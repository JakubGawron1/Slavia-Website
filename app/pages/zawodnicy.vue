<script setup lang="ts">
import AtheleteCard from '~/components/AtheleteCard.vue'
import { athleteProfilePath } from '~/utils/slug'
import type { Athlete as AthleteModel, AthletePaymentStatusRow, CompetitionResult } from '~/types/models'
import type { SinclairGender } from '~/utils/sinclair'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair, parseWeightCategoryLimitKg } from '~/utils/sinclairAthlete'
import { apiRoutes } from '~/config/api'

function cardGender(g: string | null | undefined): SinclairGender | null {
  return g === 'male' || g === 'female' ? g : null
}

const MALE_WEIGHT_CATEGORIES = [60, 65, 70, 75, 85, 95, 110]
const FEMALE_WEIGHT_CATEGORIES = [49, 53, 57, 61, 69, 77, 86]

function resolveWeightCategoryThreshold(gender: string | null | undefined, bodyweight?: number | null, rawCategory?: string | null): number {
  const cats = gender === 'female' ? FEMALE_WEIGHT_CATEGORIES : MALE_WEIGHT_CATEGORIES
  const weight = bodyweight != null && Number.isFinite(bodyweight) && bodyweight > 0
    ? bodyweight
    : parseWeightCategoryLimitKg(rawCategory ?? undefined)
  if (weight <= 0) return 0
  return cats.find((c) => weight <= c) ?? cats[cats.length - 1]
}

function formatWeightCategoryText(threshold: number, bodyweight?: number | null): string {
  if (threshold <= 0) return '—'
  if (bodyweight != null && Number.isFinite(bodyweight) && bodyweight > 0 && bodyweight < threshold) {
    return `${threshold} (${Math.round(bodyweight)})`
  }
  return String(threshold)
}

const config = useRuntimeConfig()
const auth = useAuth()
const apiFetch = useApi()

function publicBase() {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

const { data: pageBundle, status, error } = await useAsyncData(
  'players-public-bundle',
  async () => {
    const base = publicBase()
    const players = await $fetch<AthleteModel[]>(`${base}/api/athletes`).catch(() => [] as AthleteModel[])
    const resultsByAthlete: Record<string, CompetitionResult[]> = {}
    await Promise.all(
      players.map(async (p) => {
        resultsByAthlete[p.id] = await $fetch<CompetitionResult[]>(`${base}/api/results/athlete/${p.id}`).catch(
          () => []
        )
      })
    )
    return { players, resultsByAthlete }
  },
  { default: () => ({ players: [] as AthleteModel[], resultsByAthlete: {} as Record<string, CompetitionResult[]> }) }
)

const players = computed(() => pageBundle.value?.players ?? [])
const resultsByAthlete = computed(() => pageBundle.value?.resultsByAthlete ?? {})

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

const { data: paymentStatuses } = await useAsyncData(
  'players-payment-statuses',
  async () => {
    await auth.ensureSession()
    if (!auth.isAthlete.value) return [] as AthletePaymentStatusRow[]
    const q = `?month=${encodeURIComponent(currentMonth())}`
    return await apiFetch<AthletePaymentStatusRow[]>(`${apiRoutes.payments.status}${q}`).catch(() => [])
  },
  { default: () => [] as AthletePaymentStatusRow[] }
)

const paidByAthleteId = computed(() => {
  const map = new Map<string, boolean>()
  for (const r of (paymentStatuses.value ?? [])) {
    if (r?.athlete_id) map.set(r.athlete_id, !!r.is_paid)
  }
  return map
})

useSeoMeta({
  title: 'Zawodnicy i Ranking — Slavia Ruda Śląska',
  description: 'Lista zawodników CKS Slavia Ruda Śląska oraz ranking Sinclair.',
  ogTitle: 'Zawodnicy i ranking CKS Slavia',
  ogDescription: 'Poznaj kadrę Slavia i sprawdź aktualną klasyfikację Sinclair.',
  twitterCard: 'summary'
})

/** Karty i ranking: wyłącznie zatwierdzone zgłoszenia (`/api/results/athlete/:id`). */
function mapToCard(p: AthleteModel, rb: Record<string, CompetitionResult[]>) {
  const approved = (rb[p.id] ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

  let bestRow: CompetitionResult | null = null
  for (const r of approved) {
    if (
      !bestRow
      || r.total > bestRow.total
      || (r.total === bestRow.total && r.date.localeCompare(bestRow.date) > 0)
    ) {
      bestRow = r
    }
  }

  const snatchKg = bestRow?.snatch ?? 0
  const cjKg = bestRow?.clean_and_jerk ?? 0
  const totalKg = bestRow?.total ?? 0

  const effectiveWeight = effectiveBodyweightKgForSinclair(p)
  const weightCategoryDisplay = resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined)
  const weightCategoryText = formatWeightCategoryText(weightCategoryDisplay, p.bodyweight ?? undefined)

  const sg = cardGender(p.gender ?? undefined)
  let sc = 0
  if (totalKg > 0 && effectiveWeight > 0 && sg) {
    const calculated = sinclairTotal(totalKg, effectiveWeight, sg)
    if (!Number.isNaN(calculated)) {
      sc = calculated
    }
  }

  const chartHistory = approved.map((r) => {
    let sinclairPt: number | null = null
    if (effectiveWeight > 0 && sg) {
      const c = sinclairTotal(r.total, effectiveWeight, sg)
      if (!Number.isNaN(c)) sinclairPt = Number(c.toFixed(2))
    }
    const raw = r.date || ''
    const dateShort = raw.length >= 10 ? raw.slice(0, 10) : raw
    return {
      date: dateShort,
      total: r.total,
      snatch: r.snatch,
      clean_and_jerk: r.clean_and_jerk,
      sinclair: sinclairPt
    }
  })

  const totals = chartHistory.map(x => x.total)
  const maxHistory = totals.length > 0 ? Math.max(...totals) * 1.15 || 300 : 300

  return {
    id: p.id,
    name: p.full_name,
    birthYear: p.birth_year || 0,
    weightCategory: weightCategoryDisplay,
    weightCategoryText,
    bodyweight: p.bodyweight ?? null,
    snatch: snatchKg,
    cleanAndJerk: cjKg,
    total: totalKg,
    sinclair: Number(sc.toFixed(2)),
    membershipPaid: auth.isAthlete.value ? (paidByAthleteId.value.get(p.id) ?? false) : null,
    description:
      (p.public_bio && String(p.public_bio).trim())
      || (p.profile_tagline && String(p.profile_tagline).trim())
      || p.notes
      || 'Zawodnik klubu CKS Slavia Ruda Śląska.',
    photo: p.image_url || undefined,
    chartHistory,
    maxHistory
  }
}

const mappedPlayers = computed(() => {
  const rb = resultsByAthlete.value
  return players.value.map(p => mapToCard(p, rb)).sort((a, b) => b.sinclair - a.sinclair)
})

/** Podium i tabela — tylko osoby z co najmniej jednym zatwierdzonym wynikiem. */
const rankingPlayers = computed(() => mappedPlayers.value.filter(x => x.chartHistory.length > 0))

const podium = computed(() => rankingPlayers.value.slice(0, 3))

// Kategorie dla rankingu
const categories = [
  { label: 'Wszyscy', value: 'all' },
  { label: 'Mężczyźni', value: 'male' },
  { label: 'Kobiety', value: 'female' }
]
const selectedCategory = ref('all')

const filteredRankings = computed(() => {
  const rb = resultsByAthlete.value
  const genderOk = (p: AthleteModel) =>
    selectedCategory.value === 'all' || p.gender === selectedCategory.value
  return players.value
    .filter(genderOk)
    .map(p => mapToCard(p, rb))
    .filter(x => x.chartHistory.length > 0)
    .sort((a, b) => b.sinclair - a.sinclair)
})
</script>

<template>
  <UContainer class="py-8 md:py-16 lg:py-20">
    <!-- Header Section -->
    <div class="mb-10 px-1 text-center md:mb-16">
      <div class="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary sm:gap-3 sm:text-sm sm:tracking-[0.3em]">
        <UIcon
          name="i-lucide-trophy"
          class="size-5 shrink-0 sm:size-6"
        />
        Kadra i Ranking
      </div>
      <h1 class="mt-4 text-4xl font-black uppercase italic tracking-tighter text-highlighted sm:mt-6 sm:text-6xl md:text-7xl lg:text-8xl lg:tracking-tighter">
        Elita <span class="text-primary">Slavii</span>
      </h1>
      <p class="mx-auto mt-4 max-w-2xl px-2 text-base font-medium leading-relaxed text-muted/80 sm:mt-6 sm:text-xl">
        Poznaj naszych reprezentantów. Ranking i wykresy na kartach bazują wyłącznie na zatwierdzonych zgłoszeniach wyników
        (po weryfikacji przez trenera lub administrację).
      </p>
    </div>

    <!-- Podium Section -->
    <div
      v-if="podium.length > 0"
      class="relative mb-16 pt-8 sm:mb-24 sm:pt-12"
    >
      <div class="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 to-transparent blur-3xl opacity-50" />
      <div class="mx-auto grid max-w-4xl grid-cols-1 items-end gap-8 px-2 sm:gap-10 sm:px-4 md:grid-cols-3">
        <!-- 2nd Place -->
        <NuxtLink
          v-if="podium[1]"
          :to="athleteProfilePath(podium[1].name, podium[1].id)"
          class="order-2 md:order-1 group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
        >
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img
                :src="podium[1].photo || '/athlete-placeholder.svg'"
                class="size-32 rounded-full border-4 border-slate-400/50 object-cover shadow-xl grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
              >
              <div class="absolute -bottom-2 -right-2 bg-slate-400 text-slate-950 size-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-background">
                2
              </div>
            </div>
            <div class="text-center p-4 bg-slate-400/10 rounded-t-2xl w-full border-t border-x border-slate-400/30 backdrop-blur-md">
              <h3 class="text-base font-black text-highlighted truncate uppercase italic">
                {{ podium[1].name }}
              </h3>
              <p class="text-primary font-mono font-black text-lg">
                {{ podium[1].sinclair }}
              </p>
            </div>
            <div class="h-24 w-full bg-linear-to-b from-slate-400 to-slate-700 rounded-b-xl shadow-xl flex items-center justify-center">
              <span class="text-white/10 text-4xl font-black tracking-tighter">SILVER</span>
            </div>
          </div>
        </NuxtLink>

        <!-- 1st Place -->
        <NuxtLink
          v-if="podium[0]"
          :to="athleteProfilePath(podium[0].name, podium[0].id)"
          class="order-1 md:order-2 group -mt-6 md:-mt-16 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
        >
          <div class="flex flex-col items-center">
            <div class="relative mb-6">
              <div class="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-500 animate-pulse">
                <UIcon
                  name="i-lucide-crown"
                  class="size-14 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                />
              </div>
              <img
                :src="podium[0].photo || '/athlete-placeholder.svg'"
                class="size-48 rounded-full border-4 border-yellow-500 object-cover shadow-[0_0_30px_rgba(234,179,8,0.3)] ring-6 ring-yellow-500/10 group-hover:scale-110 transition-all duration-700"
              >
              <div class="absolute -bottom-2 -right-2 bg-yellow-500 text-yellow-950 size-14 rounded-full flex items-center justify-center font-black text-2xl shadow-xl ring-4 ring-background">
                1
              </div>
            </div>
            <div class="text-center p-6 bg-yellow-500/10 rounded-t-2xl w-full border-t border-x border-yellow-500/30 backdrop-blur-md">
              <h3 class="text-xl font-black text-highlighted truncate uppercase italic">
                {{ podium[0].name }}
              </h3>
              <p class="text-primary text-2xl font-mono font-black">
                {{ podium[0].sinclair }}
              </p>
            </div>
            <div class="h-40 w-full bg-linear-to-b from-yellow-400 to-yellow-600 rounded-b-xl shadow-[0_15px_30px_rgba(234,179,8,0.2)] flex items-center justify-center">
              <span class="text-white/20 text-6xl font-black tracking-tighter">GOLD</span>
            </div>
          </div>
        </NuxtLink>

        <!-- 3rd Place -->
        <NuxtLink
          v-if="podium[2]"
          :to="athleteProfilePath(podium[2].name, podium[2].id)"
          class="order-3 md:order-3 group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
        >
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img
                :src="podium[2].photo || '/athlete-placeholder.svg'"
                class="size-28 rounded-full border-4 border-amber-700/50 object-cover shadow-lg grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
              >
              <div class="absolute -bottom-2 -right-2 bg-amber-700 text-white size-8 rounded-full flex items-center justify-center font-black text-lg shadow-lg ring-4 ring-background">
                3
              </div>
            </div>
            <div class="text-center p-3 bg-amber-700/10 rounded-t-2xl w-full border-t border-x border-amber-700/30 backdrop-blur-md">
              <h3 class="text-base font-black text-highlighted truncate uppercase italic">
                {{ podium[2].name }}
              </h3>
              <p class="text-primary font-mono font-black text-lg">
                {{ podium[2].sinclair }}
              </p>
            </div>
            <div class="h-20 w-full bg-linear-to-b from-amber-600 to-amber-900 rounded-b-xl shadow-lg flex items-center justify-center">
              <span class="text-white/10 text-3xl font-black tracking-tighter">BRONZE</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Ranking Table Section -->
    <div class="mb-32">
      <div class="mb-8 flex flex-col justify-between gap-6 sm:mb-12 md:flex-row md:items-end lg:mb-14">
        <div class="min-w-0">
          <h2 class="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tight text-highlighted sm:gap-4 sm:text-3xl lg:text-4xl">
            <UIcon
              name="i-lucide-list-ordered"
              class="size-7 shrink-0 text-primary sm:size-8"
            />
            Tabela Rankingowa
          </h2>
          <p class="mt-2 font-medium text-muted">
            Zestawienie Sinclair — uwzględniani są tylko zawodnicy z co najmniej jednym zatwierdzonym wynikiem.
          </p>
        </div>
        <div
          class="flex w-full flex-wrap gap-2 rounded-2xl border border-default bg-muted/30 p-1.5 md:inline-flex md:w-auto md:flex-nowrap lg:p-2"
          role="tablist"
        >
          <UButton
            v-for="c in categories"
            :key="c.value"
            size="sm"
            class="min-h-11 min-w-0 flex-1 sm:min-h-10 sm:flex-none md:shrink-0"
            :variant="selectedCategory === c.value ? 'solid' : 'ghost'"
            :color="selectedCategory === c.value ? 'primary' : 'neutral'"
            @click="selectedCategory = c.value"
          >
            {{ c.label }}
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="filteredRankings.length === 0 && players.length > 0"
        color="neutral"
        variant="subtle"
        class="mb-6"
        title="Ranking Sinclair jest pusty"
        description="Żaden zawodnik nie ma jeszcze zatwierdzonego wyniku w systemie zgłoszeń. Po akceptacji wpisów przez trenera lub administrację pozycje pojawią się tutaj automatycznie."
      />

      <UCard
        v-if="filteredRankings.length > 0"
        class="overflow-hidden border-primary/20 shadow-2xl bg-linear-to-b from-primary/5 to-transparent backdrop-blur-md"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/10 bg-white/5">
                <th class="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-5 sm:text-xs sm:tracking-widest lg:px-8">
                  Msc.
                </th>
                <th class="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-5 sm:text-xs sm:tracking-widest lg:px-8">
                  Zawodnik
                </th>
                <th class="hidden px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted md:table-cell md:px-6 md:py-5 md:text-xs md:tracking-widest lg:px-8">
                  Waga
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-5 sm:text-xs sm:tracking-widest lg:px-8">
                  Dwubój
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-5 sm:text-xs sm:tracking-widest lg:px-8">
                  Sinclair
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr
                v-for="(p, idx) in filteredRankings"
                :key="p.id"
                class="group transition-all hover:bg-primary/10"
              >
                <td class="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                  <span class="font-mono text-base font-black text-muted/50 transition-colors group-hover:text-primary sm:text-lg">
                    {{ (idx + 1).toString().padStart(2, '0') }}
                  </span>
                </td>
                <td class="min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                  <NuxtLink
                    :to="athleteProfilePath(p.name, p.id)"
                    class="flex min-w-0 items-center gap-2 sm:gap-4 rounded-lg text-left outline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <UAvatar
                      :src="p.photo"
                      :alt="p.name"
                      size="sm"
                      class="shrink-0 ring-1 ring-white/10"
                    />
                    <span class="truncate font-bold text-highlighted group-hover:text-primary">{{ p.name }}</span>
                  </NuxtLink>
                  <p class="mt-0.5 font-mono text-[11px] text-muted md:hidden">
                    {{ p.weightCategoryText }}
                  </p>
                </td>
                <td class="hidden px-3 py-4 text-right font-mono text-muted md:table-cell md:px-6 md:py-6 lg:px-8">
                  {{ p.weightCategoryText }}
                </td>
                <td class="px-3 py-4 text-right font-mono text-sm font-bold text-highlighted sm:px-6 sm:py-6 sm:text-base lg:px-8">
                  {{ p.total }} kg
                </td>
                <td class="px-3 py-4 text-right sm:px-6 sm:py-6 lg:px-8">
                  <span class="inline-block rounded-full bg-primary/20 px-2 py-1 font-mono text-sm font-black text-primary sm:px-4">
                    {{ p.sinclair }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Full Athlete List Section -->
    <div
      v-if="mappedPlayers.length > 0"
      class="mb-20"
    >
      <h2 class="mb-8 flex items-center gap-3 text-2xl font-black uppercase italic tracking-tight text-highlighted sm:mb-12 sm:gap-4 sm:text-3xl lg:text-4xl">
        <UIcon
          name="i-lucide-users"
          class="size-7 shrink-0 text-primary sm:size-8"
        />
        Karty Zawodników
      </h2>
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14">
        <NuxtLink
          v-for="player in mappedPlayers"
          :key="player.id"
          :to="athleteProfilePath(player.name, player.id)"
          class="block"
        >
          <AtheleteCard
            :model-value="player"
          />
        </NuxtLink>
      </div>
    </div>

    <UAlert
      v-else-if="status !== 'pending' && !error"
      color="info"
      variant="subtle"
      title="Brak zawodników"
      description="Obecnie lista zawodników jest pusta."
      class="mb-12"
    />
  </UContainer>
</template>

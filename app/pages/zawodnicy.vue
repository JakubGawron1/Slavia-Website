<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
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
  const fallback = cats[cats.length - 1] ?? 0
  return cats.find((c) => weight <= c) ?? fallback
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

const base = computed(() => publicBase())

const {
  data: playersRaw,
  pending: playersPending,
  error: playersError
} = await useLazyFetch<AthleteModel[]>(
  () => `${base.value}/api/athletes`,
  {
    key: 'players-public-athletes',
    default: () => [] as AthleteModel[],
    server: true
  }
)

const bundlePending = computed(() => playersPending.value)
const error = computed(() => playersError.value)
const status = computed(() => (bundlePending.value ? 'pending' : 'success'))

const players = computed(() => playersRaw.value ?? [])

/**
 * Wyniki treningowe (wszystkich zawodników) — pobierane wyłącznie po zalogowaniu,
 * scalane z osobnych zapytań per zawodnik (`?kind=training`).
 */
const trainingByAthlete = ref<Record<string, CompetitionResult[]>>({})

/**
 * Wyniki startowe (publiczne, `kind=competition`) — potrzebne do wykresów na kartach.
 * Backend domyślnie zwraca zawody także dla niezalogowanych.
 */
const competitionByAthlete = ref<Record<string, CompetitionResult[]>>({})

function normalizeApprovedCompetition(rows: CompetitionResult[] | null | undefined) {
  return (rows ?? [])
    .filter(r => r && r.status === 'Approved')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Starty z zawodów (bez treningów); brak `kind` traktujemy jak zawody (starsze rekordy). */
function approvedCompetitionStarts(rows: CompetitionResult[] | null | undefined) {
  return normalizeApprovedCompetition(rows).filter(r => r.kind !== 'training')
}

/** Najlepszy start pod ranking / KPI: maks. total, przy remisie nowsza data. */
function pickBestCompetitionStart(rows: CompetitionResult[]): CompetitionResult | null {
  let best: CompetitionResult | null = null
  for (const r of rows) {
    if (!best
      || r.total > best.total
      || (r.total === best.total && r.date.localeCompare(best.date) > 0)) {
      best = r
    }
  }
  return best
}

async function refreshTrainingResults() {
  if (!auth.isLoggedIn.value || players.value.length === 0) {
    trainingByAthlete.value = {}
    return
  }
  const out: Record<string, CompetitionResult[]> = {}
  await Promise.all(
    players.value.map(async (p) => {
      out[p.id] = await apiFetch<CompetitionResult[]>(
        `/api/results/athlete/${encodeURIComponent(p.id)}?kind=training`
      ).catch(() => [] as CompetitionResult[])
    })
  )
  trainingByAthlete.value = out
}

async function refreshCompetitionResults() {
  if (players.value.length === 0) {
    competitionByAthlete.value = {}
    return
  }
  const out: Record<string, CompetitionResult[]> = {}
  await Promise.all(
    players.value.map(async (p) => {
      out[p.id] = await apiFetch<CompetitionResult[]>(
        `/api/results/athlete/${encodeURIComponent(p.id)}`
      ).catch(() => [] as CompetitionResult[])
    })
  )
  competitionByAthlete.value = out
}

watch(
  [() => auth.isLoggedIn.value, () => players.value.length],
  () => {
    void refreshTrainingResults()
  },
  { immediate: true }
)

watch(
  () => players.value.length,
  () => {
    void refreshCompetitionResults()
  },
  { immediate: true }
)

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

const { data: paymentStatuses } = await useAsyncData(
  'players-payment-statuses',
  async () => {
    await auth.ensureSession()
    if (!auth.isLoggedIn.value) return [] as AthletePaymentStatusRow[]
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
  title: 'Zawodnicy i ranking — Slavia Ruda Śląska',
  description:
    'Kadra CKS Slavia Ruda Śląska oraz ranking Sinclair. Po zalogowaniu dodatkowo wewnętrzne wyniki treningowe.',
  ogTitle: 'Zawodnicy i ranking CKS Slavia',
  ogDescription: 'Poznaj kadrę Slavia i sprawdź klasyfikację Sinclair.',
  twitterCard: 'summary'
})

/**
 * Karty: wykres = pełna historia startów zawodowych; KPI + ranking = najlepszy start (fallback: agregaty z profilu).
 */
function mapToCard(p: AthleteModel) {
  const fallbackSnatch = Number(p.best_snatch_kg ?? 0)
  const fallbackCj = Number(p.best_clean_jerk_kg ?? 0)
  const fallbackTotal = Number(p.total_kg ?? 0)

  const compStarts = approvedCompetitionStarts(competitionByAthlete.value[p.id])
  const bestStart = pickBestCompetitionStart(compStarts)

  const snatchKg = bestStart?.snatch ?? fallbackSnatch
  const cjKg = bestStart?.clean_and_jerk ?? fallbackCj
  const totalKg = bestStart?.total ?? fallbackTotal

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

  const chartHistory = compStarts.length > 0
    ? compStarts.map((r) => {
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
    : (fallbackTotal > 0
        ? [{
            date: 'PB',
            total: fallbackTotal,
            snatch: fallbackSnatch,
            clean_and_jerk: fallbackCj,
            sinclair: effectiveWeight > 0 && sg ? Number(sinclairTotal(fallbackTotal, effectiveWeight, sg).toFixed(2)) : null
          }]
        : [])

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
    membershipPaid: auth.isLoggedIn.value ? (paidByAthleteId.value.get(p.id) ?? false) : null,
    isActive: p.is_active !== false,
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
  return players.value.map(p => mapToCard(p)).sort((a, b) => b.sinclair - a.sinclair)
})

/** Podium i tabela — zawodnicy z sensownym Sinclair (najlepszy start lub PB z profilu). */
const rankingPlayers = computed(() => mappedPlayers.value.filter(x => x.total > 0 && x.sinclair > 0))

const podium = computed(() => rankingPlayers.value.slice(0, 3))

// Kategorie dla rankingu
const categories = [
  { label: 'Wszyscy', value: 'all' },
  { label: 'Mężczyźni', value: 'male' },
  { label: 'Kobiety', value: 'female' }
]
const selectedCategory = ref('all')

const filteredRankings = computed(() => {
  const genderOk = (p: AthleteModel) =>
    selectedCategory.value === 'all' || p.gender === selectedCategory.value
  return players.value
    .filter(genderOk)
    .map(p => mapToCard(p))
    .filter(x => x.total > 0 && x.sinclair > 0)
    .sort((a, b) => b.sinclair - a.sinclair)
})

/**
 * Wewnętrzny ranking treningowy — widoczny tylko dla zalogowanych.
 * Sinclair liczony z najlepszego treningowego totalu, NIE wpływa na publiczne PB.
 */
const trainingRanking = computed(() => {
  if (!auth.isLoggedIn.value) return []
  return players.value
    .map((p) => {
      const approved = (trainingByAthlete.value[p.id] ?? [])
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
      let bestRow: CompetitionResult | null = null
      for (const r of approved) {
        if (!bestRow || r.total > bestRow.total) bestRow = r
      }
      const totalKg = bestRow?.total ?? 0
      const effectiveWeight = effectiveBodyweightKgForSinclair(p)
      const sg = cardGender(p.gender ?? undefined)
      let sc = 0
      if (totalKg > 0 && effectiveWeight > 0 && sg) {
        const calc = sinclairTotal(totalKg, effectiveWeight, sg)
        if (!Number.isNaN(calc)) sc = calc
      }
      return {
        id: p.id,
        name: p.full_name,
        photo: p.image_url || undefined,
        weightCategoryText: formatWeightCategoryText(
          resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined),
          p.bodyweight ?? undefined
        ),
        total: totalKg,
        sinclair: Number(sc.toFixed(2)),
        entries: approved.length
      }
    })
    .filter(x => x.entries > 0)
    .sort((a, b) => b.sinclair - a.sinclair)
})

const showTrainingSection = computed(() => auth.isLoggedIn.value)

/** Spłaszczone wyniki treningowe (dla wszystkich zawodników) — tabela dla zalogowanych. */
const trainingFlat = computed(() => {
  if (!auth.isLoggedIn.value) return [] as Array<CompetitionResult & { athlete_name: string }>
  const nameById = new Map<string, string>()
  for (const p of players.value) nameById.set(p.id, p.full_name)
  const flat: Array<CompetitionResult & { athlete_name: string }> = []
  for (const [aid, list] of Object.entries(trainingByAthlete.value)) {
    const name = nameById.get(aid) || aid
    for (const r of list) {
      if (r.status !== 'Approved') continue
      flat.push({ ...r, athlete_name: name })
    }
  }
  return flat.sort((a, b) => b.date.localeCompare(a.date))
})

function formatBoardDate(d: string) {
  try {
    return format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: pl })
  } catch {
    return d.slice(0, 10)
  }
}

function formatKg(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return '\u2014'
  return `${v}`
}

function formatPlTriple(r: { squat_kg?: number | null, bench_kg?: number | null, deadlift_kg?: number | null }) {
  const has = r.squat_kg != null || r.bench_kg != null || r.deadlift_kg != null
  if (!has) return '\u2014'
  return `${formatKg(r.squat_kg)} / ${formatKg(r.bench_kg)} / ${formatKg(r.deadlift_kg)}`
}
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

    <!-- Sekcja TRENINGOWA (tylko dla zalogowanych) -->
    <div
      v-if="showTrainingSection"
      class="mb-20"
    >
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-info">
            <UIcon name="i-lucide-lock" class="size-4 shrink-0" />
            Sekcja dla zalogowanych
          </div>
          <h2 class="mt-2 flex items-center gap-3 text-2xl font-black uppercase italic tracking-tight text-highlighted sm:gap-4 sm:text-3xl lg:text-4xl">
            <UIcon
              name="i-lucide-dumbbell"
              class="size-7 shrink-0 text-info sm:size-8"
            />
            Wyniki treningowe
          </h2>
          <p class="mt-2 max-w-3xl font-medium text-muted">
            Wewnętrzny ranking treningowy klubu. Te wpisy nie wpływają na publiczne PB ani na ranking
            zawodów — pokazujemy je tylko zalogowanym członkom klubu.
          </p>
        </div>
      </div>

      <UCard
        v-if="trainingRanking.length > 0"
        class="mb-6 overflow-hidden border-info/20 bg-info/5"
      >
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-info">
          Top zawodników (Sinclair z najlepszego treningowego totalu)
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-default/70 text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th class="px-3 py-2.5">Msc.</th>
                <th class="px-3 py-2.5">Zawodnik</th>
                <th class="hidden md:table-cell px-3 py-2.5 text-right">Waga</th>
                <th class="px-3 py-2.5 text-right">Trening total</th>
                <th class="px-3 py-2.5 text-right">Sinclair</th>
                <th class="px-3 py-2.5 text-right text-muted/70">Wpisów</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default/40">
              <tr
                v-for="(p, idx) in trainingRanking.slice(0, 12)"
                :key="`tr-${p.id}`"
                class="hover:bg-info/10"
              >
                <td class="px-3 py-2.5 font-mono text-muted">{{ (idx + 1).toString().padStart(2, '0') }}</td>
                <td class="px-3 py-2.5">
                  <NuxtLink
                    :to="athleteProfilePath(p.name, p.id)"
                    class="flex items-center gap-2 hover:text-info"
                  >
                    <UAvatar :src="p.photo" :alt="p.name" size="2xs" class="shrink-0" />
                    <span class="truncate font-semibold text-highlighted">{{ p.name }}</span>
                  </NuxtLink>
                </td>
                <td class="hidden md:table-cell px-3 py-2.5 text-right font-mono text-muted">{{ p.weightCategoryText }}</td>
                <td class="px-3 py-2.5 text-right font-mono font-bold text-highlighted">{{ p.total }} kg</td>
                <td class="px-3 py-2.5 text-right">
                  <span class="rounded-full bg-info/20 px-2 py-0.5 font-mono text-xs font-black text-info">
                    {{ p.sinclair }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-right text-xs text-muted/80">{{ p.entries }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <div
        v-if="trainingFlat.length === 0"
        class="rounded-2xl border border-dashed border-info/30 bg-info/5 px-6 py-12 text-center text-sm text-muted"
      >
        Brak zatwierdzonych wpisów treningowych w bazie. Dodaj pierwszy w panelu zawodnika lub jako trener.
      </div>

      <div
        v-else
        class="overflow-x-auto rounded-2xl border border-info/25"
      >
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="border-b border-info/20 bg-info/10 text-xs font-semibold uppercase tracking-wide text-info">
            <tr>
              <th class="px-4 py-3">Data</th>
              <th class="px-4 py-3">Zawodnik</th>
              <th class="px-4 py-3 text-right">Rwanie</th>
              <th class="px-4 py-3 text-right">Podrzut</th>
              <th class="px-4 py-3 text-right font-semibold">Razem</th>
              <th class="hidden lg:table-cell px-4 py-3 text-right">Siła (kg)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/40">
            <tr
              v-for="r in trainingFlat.slice(0, 60)"
              :key="`tflat-${r.id}`"
              class="bg-card hover:bg-info/5"
            >
              <td class="whitespace-nowrap px-4 py-3 text-muted">{{ formatBoardDate(r.date) }}</td>
              <td class="px-4 py-3 font-medium text-highlighted">
                <NuxtLink
                  :to="athleteProfilePath(r.athlete_name, r.athlete_id)"
                  class="hover:text-info"
                >
                  {{ r.athlete_name }}
                </NuxtLink>
              </td>
              <td class="px-4 py-3 text-right tabular-nums">{{ r.snatch }} kg</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ r.clean_and_jerk }} kg</td>
              <td class="px-4 py-3 text-right tabular-nums font-semibold text-info">{{ r.total }} kg</td>
              <td class="hidden lg:table-cell px-4 py-3 text-right text-xs tabular-nums text-muted">
                {{ formatPlTriple(r) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
          prefetch
          prefetch-on="interaction"
          class="block"
        >
          <AtheleteCard
            :model-value="player"
          />
        </NuxtLink>
      </div>
    </div>

    <div
      v-else-if="bundlePending"
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
        <div
          v-for="i in 6"
          :key="`player-skel-${i}`"
          class="rounded-2xl border border-default bg-card p-6 shadow-sm"
        >
          <div class="flex items-start gap-4">
            <div class="size-14 shrink-0 rounded-2xl bg-muted/35 animate-pulse" />
            <div class="min-w-0 flex-1 space-y-2">
              <div class="h-5 w-[62%] rounded bg-muted/35 animate-pulse" />
              <div class="h-4 w-[42%] rounded bg-muted/25 animate-pulse" />
              <div class="h-4 w-[70%] rounded bg-muted/25 animate-pulse" />
            </div>
          </div>
          <div class="mt-5 grid grid-cols-3 gap-3">
            <div class="h-12 rounded-xl bg-muted/25 animate-pulse" />
            <div class="h-12 rounded-xl bg-muted/25 animate-pulse" />
            <div class="h-12 rounded-xl bg-muted/25 animate-pulse" />
          </div>
        </div>
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

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

/** Pełny ranking/podium treningowy klubu — tylko kadra (trener / admin / superadmin). Zawodnik bez tych ról widzi tylko własny trening na swoim profilu. */
const canSeeClubTrainingRanking = computed(() => auth.isTrainer.value || auth.isAdmin.value)

function publicBase() {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

const base = computed(() => publicBase())

const {
  data: playersRaw,
  pending: playersPending,
  error: playersError,
  refresh: refreshPlayersPublic
} = await useLazyFetch<AthleteModel[]>(
  () => `${base.value}/api/athletes`,
  {
    key: 'players-public-athletes',
    default: () => [] as AthleteModel[],
    server: true
  }
)

if (import.meta.client) {
  onMounted(() => {
    const onFocus = () => {
      void refreshPlayersPublic()
    }
    window.addEventListener('focus', onFocus)
    onUnmounted(() => window.removeEventListener('focus', onFocus))
  })
}

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
  trainingByAthlete.value = {}
  if (!auth.isLoggedIn.value || players.value.length === 0) return

  if (canSeeClubTrainingRanking.value) {
    const out: Record<string, CompetitionResult[]> = {}
    await Promise.all(
      players.value.map(async (p) => {
        out[p.id] = await apiFetch<CompetitionResult[]>(
          `/api/results/athlete/${encodeURIComponent(p.id)}?kind=training`
        ).catch(() => [] as CompetitionResult[])
      })
    )
    trainingByAthlete.value = out
    return
  }

  await auth.ensureSession()
  const myAthleteId = auth.user.value?.athlete_id
  if (!myAthleteId) return
  const rows = await apiFetch<CompetitionResult[]>(
    `/api/results/athlete/${encodeURIComponent(myAthleteId)}?kind=training`
  ).catch(() => [] as CompetitionResult[])
  trainingByAthlete.value = { [myAthleteId]: rows }
}

async function refreshCompetitionResults() {
  if (players.value.length === 0) {
    competitionByAthlete.value = {}
    return
  }
  const out: Record<string, CompetitionResult[]> = {}
  await Promise.all(
    players.value.map(async (p) => {
      const rows = await apiFetch<CompetitionResult[]>(
        `/api/results/athlete/${encodeURIComponent(p.id)}`
      ).catch(() => [] as CompetitionResult[])
      /* Domyślny endpoint może zwracać też treningi — publiczne karty i ranking tylko ze zawodów. */
      out[p.id] = rows.filter(r => r.kind !== 'training')
    })
  )
  competitionByAthlete.value = out
}

watch(
  [
    () => auth.isLoggedIn.value,
    () => players.value.length,
    () => auth.user.value?.athlete_id,
    () => canSeeClubTrainingRanking.value
  ],
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
    'Kadra CKS Slavia Ruda Śląska oraz ranking Sinclair. Kadra po zalogowaniu widzi wewnętrzny ranking treningowy klubu.',
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

  const trainingApproved = (trainingByAthlete.value[p.id] ?? []).filter(r => r.status === 'Approved')
  const bestTraining = pickBestCompetitionStart(trainingApproved)
  const trainingStrip = trainingApproved.length > 0 && bestTraining && bestTraining.total > 0
    ? (() => {
        let tsc = 0
        if (effectiveWeight > 0 && sg) {
          const calc = sinclairTotal(bestTraining.total, effectiveWeight, sg)
          if (!Number.isNaN(calc)) tsc = calc
        }
        return {
          snatch: bestTraining.snatch,
          cleanAndJerk: bestTraining.clean_and_jerk,
          total: bestTraining.total,
          sinclair: Number(tsc.toFixed(2))
        }
      })()
    : null

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
    trainingStrip,
    membershipPaid: auth.isLoggedIn.value ? (paidByAthleteId.value.get(p.id) ?? false) : null,
    hasStandingOrder: auth.isLoggedIn.value ? p.has_standing_order === true : false,
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

// Kategorie dla rankingu i kart (płeć)
const categories = [
  { label: 'Wszyscy', value: 'all' },
  { label: 'Mężczyźni', value: 'male' },
  { label: 'Kobiety', value: 'female' }
]
const selectedCategory = ref('all')

const filterActiveOnly = ref(false)
const filterWeightThreshold = ref<string>('all')
const filterPaymentStaff = ref<'all' | 'paid' | 'unpaid' | 'standing'>('all')

const canUseStaffFilters = computed(() =>
  auth.isLoggedIn.value && (auth.isTrainer.value || auth.isAdmin.value)
)

const weightCategoryFilterOptions = computed(() => {
  const set = new Set<number>()
  for (const p of players.value) {
    const t = resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined)
    if (t > 0) set.add(t)
  }
  return [...set].sort((a, b) => a - b)
})

function playerPassesListFilters(p: AthleteModel): boolean {
  if (selectedCategory.value !== 'all' && p.gender !== selectedCategory.value) {
    return false
  }
  if (filterActiveOnly.value && p.is_active === false) {
    return false
  }
  if (filterWeightThreshold.value !== 'all') {
    const want = Number(filterWeightThreshold.value)
    const t = resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined)
    if (!Number.isFinite(want) || t !== want) {
      return false
    }
  }
  if (canUseStaffFilters.value && filterPaymentStaff.value !== 'all') {
    const paid = paidByAthleteId.value.get(p.id) ?? false
    const so = p.has_standing_order === true
    if (filterPaymentStaff.value === 'paid' && !paid) {
      return false
    }
    if (filterPaymentStaff.value === 'unpaid' && paid) {
      return false
    }
    if (filterPaymentStaff.value === 'standing' && !so) {
      return false
    }
  }
  return true
}

const playersFiltered = computed(() => players.value.filter(playerPassesListFilters))

const mappedPlayers = computed(() => {
  return playersFiltered.value.map(p => mapToCard(p)).sort((a, b) => b.sinclair - a.sinclair)
})

/** Podium i tabela — zawodnicy z sensownym Sinclair (najlepszy start lub PB z profilu). */
const rankingPlayers = computed(() => mappedPlayers.value.filter(x => x.total > 0 && x.sinclair > 0))

const podium = computed(() => rankingPlayers.value.slice(0, 3))

const filteredRankings = computed(() => {
  return playersFiltered.value
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
  return playersFiltered.value
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

const showTrainingSection = computed(() => auth.isLoggedIn.value && canSeeClubTrainingRanking.value)

/** Pierwsza trójka wewnętrznego rankingu treningowego — podium jak przy zawodach. */
const trainingPodium = computed(() => trainingRanking.value.slice(0, 3))

const exportKind = ref<'competition' | 'training'>('competition')

function downloadRankingCsv() {
  const rows = exportKind.value === 'training' && canSeeClubTrainingRanking.value
    ? trainingRanking.value
    : filteredRankings.value
  const kindLabel = exportKind.value === 'training' ? 'trening' : 'zawody'
  const header = ['Pozycja', 'Imię i nazwisko', 'Kategoria', 'Total (kg)', 'Sinclair', 'Rodzaj rankingu']
  const lines = rows.map((r, i) => [
    String(i + 1),
    `"${String(r.name).replace(/"/g, '""')}"`,
    `"${String(r.weightCategoryText || '').replace(/"/g, '""')}"`,
    String(r.total ?? ''),
    String(r.sinclair ?? ''),
    kindLabel
  ].join(';'))
  const csv = `\uFEFF${header.join(';')}\n${lines.join('\n')}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ranking-slavia-${kindLabel}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const terms = useSlaviaCopy()
const runtimePublic = useRuntimeConfig().public
const publicFeaturesMap = usePublicFeatures()
/** `NUXT_PUBLIC_FEATURE_ATHLETE_COMPARE=0` lub `featuresJson.athleteCompare: false` wyłącza link. */
const showAthleteCompareLink = computed(() => {
  if (!runtimePublic.featureAthleteCompare) return false
  return publicFeaturesMap.value.athleteCompare !== false
})

</script>

<template>
  <PublicPageLayout padding="hero">
    <PublicPageHeader
      variant="centered"
      eyebrow="Kadra i Ranking"
      icon="i-lucide-trophy"
      description="Poznaj naszych reprezentantów. Ranking i wykresy na kartach bazują wyłącznie na zatwierdzonych zgłoszeniach wyników (po weryfikacji przez trenera lub administrację)."
    >
      <template #title>
        Elita <span class="text-primary">Slavii</span>
      </template>
    </PublicPageHeader>

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
                alt=""
                width="128"
                height="128"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 128px, 128px"
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
                alt=""
                width="192"
                height="192"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 192px, 192px"
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
                alt=""
                width="112"
                height="112"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 112px, 112px"
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
    <div class="slavia-content-well mb-32">
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
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <USelect
              v-if="canSeeClubTrainingRanking"
              v-model="exportKind"
              :items="[
                { label: 'Eksport: zawody', value: 'competition' },
                { label: 'Eksport: trening', value: 'training' }
              ]"
              class="w-44"
              size="sm"
            />
            <UButton
              size="sm"
              variant="soft"
              icon="i-lucide-download"
              :disabled="(exportKind === 'training' ? trainingRanking : filteredRankings).length === 0"
              @click="downloadRankingCsv"
            >
              CSV na zebranie
            </UButton>
          </div>
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

      <div
        class="mb-6 flex flex-col gap-4 rounded-2xl border border-default/60 bg-muted/15 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <UFormField
          label="Kategoria wagowa (limit)"
          class="w-full min-w-0 sm:w-52"
        >
          <select
            v-model="filterWeightThreshold"
            class="slavia-select min-h-11 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          >
            <option value="all">
              Dowolna
            </option>
            <option
              v-for="w in weightCategoryFilterOptions"
              :key="`wc-${w}`"
              :value="String(w)"
            >
              {{ w }} kg
            </option>
          </select>
        </UFormField>
        <div class="flex min-h-11 w-full items-center gap-2 sm:w-auto">
          <input
            id="zaw-filter-active"
            v-model="filterActiveOnly"
            type="checkbox"
            class="size-4 shrink-0 accent-primary"
          >
          <label
            for="zaw-filter-active"
            class="text-sm font-medium text-muted"
          >Tylko aktywni w systemie</label>
        </div>
        <UFormField
          v-if="canUseStaffFilters"
          label="Składka (bieżący miesiąc)"
          class="w-full min-w-0 sm:w-56"
        >
          <select
            v-model="filterPaymentStaff"
            class="slavia-select min-h-11 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          >
            <option value="all">
              Dowolnie
            </option>
            <option value="paid">
              Opłacona
            </option>
            <option value="unpaid">
              Brak zatwierdzonej wpłaty
            </option>
            <option value="standing">
              {{ terms.paymentStandingOrder() }}
            </option>
          </select>
        </UFormField>
        <NuxtLink
          v-if="showAthleteCompareLink"
          to="/zawodnicy/porownanie"
          class="ms-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/15"
        >
          Porównaj zawodników
        </NuxtLink>
      </div>

      <UAlert
        v-if="filteredRankings.length === 0 && players.length > 0"
        color="neutral"
        variant="subtle"
        class="mb-6"
        title="Ranking Sinclair jest pusty"
        description="Żaden zawodnik nie ma jeszcze zatwierdzonego wyniku w systemie zgłoszeń. Po akceptacji wpisów przez trenera lub administrację pozycje pojawią się tutaj automatycznie."
      />

      <div
        v-if="filteredRankings.length > 0"
        class="slavia-page-card overflow-hidden"
      >
        <div class="slavia-data-table overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th class="w-16">
                  Msc.
                </th>
                <th>
                  Zawodnik
                </th>
                <th class="hidden text-right md:table-cell">
                  Waga
                </th>
                <th class="text-right">
                  Dwubój
                </th>
                <th class="text-right">
                  Sinclair
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, idx) in filteredRankings"
                :key="p.id"
                class="group"
              >
                <td>
                  <span class="font-mono text-sm font-bold tabular-nums text-muted transition-colors group-hover:text-primary sm:text-base">
                    {{ (idx + 1).toString().padStart(2, '0') }}
                  </span>
                </td>
                <td class="min-w-0">
                  <NuxtLink
                    :to="athleteProfilePath(p.name, p.id)"
                    class="flex min-w-0 items-center gap-2 sm:gap-3 rounded-lg text-left outline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <UAvatar
                      :src="p.photo"
                      :alt="p.name"
                      size="sm"
                      class="shrink-0 ring-1 ring-default/40"
                    />
                    <span class="truncate font-bold text-highlighted group-hover:text-primary">{{ p.name }}</span>
                  </NuxtLink>
                  <p class="mt-0.5 font-mono text-[11px] text-muted md:hidden">
                    {{ p.weightCategoryText }}
                  </p>
                </td>
                <td class="hidden text-right font-mono text-sm text-muted md:table-cell">
                  {{ p.weightCategoryText }}
                </td>
                <td class="text-right font-mono text-sm font-bold tabular-nums text-highlighted">
                  {{ p.total }} kg
                </td>
                <td class="text-right">
                  <span class="inline-block rounded-full bg-primary/12 px-2.5 py-1 font-mono text-sm font-bold text-primary ring-1 ring-primary/20 sm:px-3">
                    {{ p.sinclair }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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

      <!-- Podium treningowe — stonowana paleta, więcej oddechu pod nagłówkiem -->
      <div
        v-if="trainingPodium.length > 0"
        class="relative mb-14 pt-4 sm:mb-16"
      >
        <div class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-info/5 via-transparent to-transparent blur-3xl opacity-50" />
        <p class="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Podium treningowe (Sinclair z najlepszego treningu)
        </p>
        <div class="mx-auto grid max-w-4xl grid-cols-1 items-end gap-10 px-3 sm:gap-12 sm:px-6 md:grid-cols-3 md:gap-8 lg:gap-10">
          <NuxtLink
            v-if="trainingPodium[1]"
            :to="athleteProfilePath(trainingPodium[1].name, trainingPodium[1].id)"
            class="order-2 md:order-1 group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40"
          >
            <div class="flex flex-col items-center">
              <div class="relative mb-5">
                <img
                  :src="trainingPodium[1].photo || '/athlete-placeholder.svg'"
                  class="size-32 rounded-full border-2 border-default/50 object-cover shadow-md grayscale-[0.2] transition-all duration-500 group-hover:border-info/30 group-hover:shadow-lg group-hover:grayscale-0"
                >
                <div class="absolute -bottom-1.5 -right-1.5 flex size-9 items-center justify-center rounded-full border border-default/40 bg-muted font-black text-sm text-highlighted shadow-sm ring-2 ring-background">
                  2
                </div>
              </div>
              <div class="w-full rounded-t-2xl border border-b-0 border-default/45 bg-muted/25 px-4 py-5 text-center sm:px-5">
                <h3 class="truncate text-base font-black uppercase italic leading-snug text-highlighted">
                  {{ trainingPodium[1].name }}
                </h3>
                <p class="mt-1.5 font-mono text-base font-bold tabular-nums text-info/85 dark:text-info/90 sm:text-lg">
                  {{ trainingPodium[1].sinclair }}
                </p>
              </div>
              <div class="flex h-20 w-full items-center justify-center rounded-b-2xl border border-t-0 border-default/40 bg-linear-to-b from-muted/50 to-muted/25">
                <span class="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Sala</span>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            v-if="trainingPodium[0]"
            :to="athleteProfilePath(trainingPodium[0].name, trainingPodium[0].id)"
            class="order-1 md:order-2 group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40 md:-mt-3"
          >
            <div class="flex flex-col items-center pt-8 md:pt-10">
              <div class="relative mb-6">
                <div class="absolute -top-7 left-1/2 flex -translate-x-1/2 text-info/50 dark:text-info/45 md:-top-8">
                  <UIcon name="i-lucide-dumbbell" class="size-9 md:size-10" />
                </div>
                <img
                  :src="trainingPodium[0].photo || '/athlete-placeholder.svg'"
                  class="size-40 rounded-full border-2 border-info/35 object-cover shadow-md ring-1 ring-info/10 transition-all duration-500 group-hover:border-info/50 group-hover:shadow-lg md:size-44"
                >
                <div class="absolute -bottom-1.5 -right-1.5 flex size-11 items-center justify-center rounded-full border border-info/25 bg-info/90 font-black text-xl text-white shadow-md ring-2 ring-background dark:bg-info/85">
                  1
                </div>
              </div>
              <div class="w-full rounded-t-2xl border border-b-0 border-default/50 bg-muted/35 px-5 py-6 text-center sm:px-6">
                <h3 class="truncate text-lg font-black uppercase italic leading-snug text-highlighted md:text-xl">
                  {{ trainingPodium[0].name }}
                </h3>
                <p class="mt-2 font-mono text-xl font-bold tabular-nums text-info/90 dark:text-info/90 md:text-2xl">
                  {{ trainingPodium[0].sinclair }}
                </p>
              </div>
              <div class="flex h-28 w-full items-center justify-center rounded-b-2xl border border-t-0 border-default/45 bg-linear-to-b from-info/18 to-info/12 dark:from-info/14 dark:to-muted/35">
                <span class="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Trening</span>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            v-if="trainingPodium[2]"
            :to="athleteProfilePath(trainingPodium[2].name, trainingPodium[2].id)"
            class="order-3 group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40"
          >
            <div class="flex flex-col items-center">
              <div class="relative mb-5">
                <img
                  :src="trainingPodium[2].photo || '/athlete-placeholder.svg'"
                  class="size-28 rounded-full border-2 border-default/55 object-cover shadow-md grayscale-[0.25] transition-all duration-500 group-hover:border-default/80 group-hover:grayscale-0"
                >
                <div class="absolute -bottom-1.5 -right-1.5 flex size-8 items-center justify-center rounded-full border border-default/45 bg-muted font-black text-sm text-highlighted shadow-sm ring-2 ring-background">
                  3
                </div>
              </div>
              <div class="w-full rounded-t-2xl border border-b-0 border-default/45 bg-muted/20 px-4 py-4 text-center sm:px-5">
                <h3 class="truncate text-base font-black uppercase italic leading-snug text-highlighted">
                  {{ trainingPodium[2].name }}
                </h3>
                <p class="mt-1.5 font-mono text-base font-bold tabular-nums text-info/85 dark:text-info/90 sm:text-lg">
                  {{ trainingPodium[2].sinclair }}
                </p>
              </div>
              <div class="flex h-16 w-full items-center justify-center rounded-b-2xl border border-t-0 border-default/40 bg-linear-to-b from-muted/45 to-muted/20">
                <span class="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">Sala</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <UCard
        v-if="trainingRanking.length > 0"
        class="mb-6 overflow-hidden border-info/25 bg-linear-to-b from-info/8 via-background to-background shadow-xl ring-1 ring-info/15 backdrop-blur-md"
      >
        <div class="border-b border-default/50 bg-muted/30 px-4 py-3 sm:px-6">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-info">
            Top 12 — ranking treningowy (Sinclair)
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-default/60 bg-muted/40">
                <th class="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Msc.
                </th>
                <th class="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Zawodnik
                </th>
                <th class="hidden px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted md:table-cell md:px-6 md:py-4 md:text-xs">
                  Waga
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Trening total
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Sinclair
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted/70 sm:px-6 sm:py-4 sm:text-xs">
                  Wpisów
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default/50">
              <tr
                v-for="(p, idx) in trainingRanking.slice(0, 12)"
                :key="`tr-${p.id}`"
                class="group transition-colors hover:bg-info/8"
              >
                <td class="px-3 py-4 font-mono text-base font-black text-muted/60 transition-colors group-hover:text-info dark:group-hover:text-info sm:px-6 sm:py-5">
                  {{ (idx + 1).toString().padStart(2, '0') }}
                </td>
                <td class="min-w-0 px-3 py-4 sm:px-6 sm:py-5">
                  <NuxtLink
                    :to="athleteProfilePath(p.name, p.id)"
                    class="flex items-center gap-2 rounded-lg outline-offset-2 hover:text-info focus-visible:outline-2 focus-visible:outline-info dark:hover:text-info"
                  >
                    <UAvatar :src="p.photo" :alt="p.name" size="sm" class="shrink-0 ring-1 ring-default/30" />
                    <span class="truncate font-bold text-highlighted">{{ p.name }}</span>
                  </NuxtLink>
                  <p class="mt-0.5 font-mono text-[11px] text-muted md:hidden">
                    {{ p.weightCategoryText }}
                  </p>
                </td>
                <td class="hidden px-3 py-4 text-right font-mono text-muted md:table-cell md:px-6 md:py-5">
                  {{ p.weightCategoryText }}
                </td>
                <td class="px-3 py-4 text-right font-mono text-sm font-bold text-highlighted sm:px-6 sm:py-5 sm:text-base">
                  {{ p.total }} kg
                </td>
                <td class="px-3 py-4 text-right sm:px-6 sm:py-5">
                  <span class="inline-block rounded-full bg-info/15 px-3 py-1 font-mono text-sm font-black text-info ring-1 ring-info/25 dark:text-info">
                    {{ p.sinclair }}
                  </span>
                </td>
                <td class="px-3 py-4 text-right text-xs text-muted sm:px-6 sm:py-5">
                  {{ p.entries }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <PublicEmptyState
        v-if="trainingRanking.length === 0"
        icon="i-lucide-dumbbell"
        title="Brak wyników treningowych"
        description="Gdy pojawią się zatwierdzone wpisy treningowe, ranking wewnętrzny wypełni się automatycznie."
        compact
      />
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
          class="overflow-hidden rounded-3xl border border-default/40 bg-card shadow-sm ring-1 ring-default/3"
        >
          <div class="animate-pulse">
            <div class="flex flex-col gap-4 border-b border-default/35 p-4 sm:flex-row sm:items-start sm:p-5">
              <div class="mx-auto h-28 w-28 shrink-0 rounded-xl bg-muted/35 ring-2 ring-default/20 sm:mx-0 sm:h-32 sm:w-32" />
              <div class="min-w-0 flex-1 space-y-3">
                <div class="mx-auto h-7 w-[70%] max-w-xs rounded-lg bg-muted/40 sm:mx-0 sm:ml-0" />
                <div class="mx-auto h-4 w-24 rounded bg-muted/25 sm:mx-0" />
                <div class="flex justify-center gap-2 sm:justify-start">
                  <div class="h-6 w-28 rounded-full bg-muted/30" />
                  <div class="h-6 w-24 rounded-full bg-muted/25" />
                </div>
              </div>
            </div>
            <div class="border-b border-default/30">
              <div class="h-10 border-l-4 border-default/35 bg-muted/20" />
              <div class="grid grid-cols-4 divide-x divide-default/25 bg-muted/15">
                <div v-for="j in 4" :key="`sk-${i}-${j}`" class="min-h-20 bg-muted/20" />
              </div>
            </div>
            <div class="p-4 sm:p-5">
              <div class="mb-3 h-5 w-40 rounded bg-muted/25" />
              <div class="h-29 rounded-xl border border-default/30 bg-muted/15" />
            </div>
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
  </PublicPageLayout>
</template>

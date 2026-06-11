<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { CompetitionResult } from '~/types/models'
import type { SinclairGender } from '~/utils/sinclair'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'
import { cmsRoutePageName } from '~/utils/cmsRoutePage'
import AthleteProgressChart, { type AthleteChartPoint } from '~/components/AthleteProgressChart.vue'
import AthleteCombinedChart, { type CombinedChartPoint } from '~/components/AthleteCombinedChart.vue'

const route = useRoute()
const auth = useAuth()
const toast = useToast()
const requestUrlState = useRequestURL()

definePageMeta({
  backTo: '/zawodnicy',
  backLabel: 'Lista zawodników'
})

const {
  shareLite,
  athleteId,
  canViewAthleteTraining,
  canEditAthlete,
  athlete,
  error,
  results,
  trainingResults
} = await useAthletePublicProfilePage()

if (error.value || !athlete.value) {
  throw createError({ statusCode: 404, statusMessage: 'Zawodnik nie znaleziony', fatal: true })
}

const profileHeroBio = computed(
  () =>
    athlete.value?.public_bio?.trim()
    || athlete.value?.profile_tagline?.trim()
    || `Profil zawodnika ${athlete.value!.full_name} w CKS Slavia Ruda Śląska.`
)

const publicProfileUrl = computed(() => {
  const base = String(requestUrlState.origin || '').replace(/\/$/, '')
  return `${base}${route.path}`
})

useSeoMeta({
  title: `${athlete.value.full_name} — Slavia`,
  description: profileHeroBio.value.slice(0, 320),
  ogTitle: athlete.value.full_name,
  ogDescription: profileHeroBio.value.slice(0, 300),
  ogImage: athlete.value.image_url || '/logo.png',
  ogType: 'profile'
})

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: athlete.value?.full_name,
        url: publicProfileUrl.value,
        image: athlete.value?.image_url || undefined,
        description: profileHeroBio.value,
        memberOf: {
          '@type': 'SportsOrganization',
          name: 'CKS Slavia Ruda Śląska'
        }
      })
    }
  ]
}))

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: pl })
  } catch {
    return dateStr
  }
}

function formatBoardDate(d: string) {
  try {
    return format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: pl })
  } catch {
    return d.slice(0, 10)
  }
}

function genderLabel(g: string | null | undefined) {
  if (g === 'male') return 'Mężczyzna'
  if (g === 'female') return 'Kobieta'
  return null
}

function cardGender(g: string | null | undefined): SinclairGender | null {
  return g === 'male' || g === 'female' ? g : null
}

/** Wpis z zawodów (publiczny); `kind` brak lub `competition` — trening ma osobne zapytanie. */
function isCompetitionResultRow(r: CompetitionResult): boolean {
  return r.kind !== 'training'
}

const approvedResults = computed(() =>
  (results.value || []).filter(r => r.status === 'Approved' && isCompetitionResultRow(r))
)
const approvedTraining = computed(() => (trainingResults.value || []).filter(r => r.status === 'Approved'))

/** Wpisy treningowe od najnowszych — tabela jak wcześniej na `/zawodnicy`. */
const approvedTrainingSorted = computed(() =>
  [...approvedTraining.value].sort((a, b) => b.date.localeCompare(a.date))
)

/** Najlepszy zatwierdzony start z zawodów (max total, przy remisie nowsza data). */
function pickBestCompetitionRow(rows: CompetitionResult[]): CompetitionResult | null {
  let best: CompetitionResult | null = null
  for (const r of rows) {
    if (
      !best
      || r.total > best.total
      || (r.total === best.total && r.date.localeCompare(best.date) > 0)
    ) {
      best = r
    }
  }
  return best
}

/** KPI z profilu nadpisane najlepszym startem z zawodów, gdy mamy historię — żeby trening z API nie „podmieniał” publicznych liczb. */
const competitionPbDisplay = computed(() => {
  const rows = approvedResults.value
  const p = athlete.value
  if (!p) {
    return { snatch: null as number | null, cleanJerk: null as number | null, total: null as number | null }
  }
  const best = pickBestCompetitionRow(rows)
  if (!best) {
    return {
      snatch: p.best_snatch_kg ?? null,
      cleanJerk: p.best_clean_jerk_kg ?? null,
      total: p.total_kg ?? null
    }
  }
  return {
    snatch: best.snatch,
    cleanJerk: best.clean_and_jerk,
    total: best.total
  }
})

/** Pas KPI treningowego — tylko gdy viewer widzi wpisy sali na tym profilu. */
const trainingStripKpi = computed(() => {
  if (!canViewAthleteTraining.value) return null
  const rows = approvedTraining.value
  const p = athlete.value
  if (!p || rows.length === 0) return null
  const best = pickBestCompetitionRow(rows)
  if (!best || best.total <= 0) return null
  const sg = cardGender(p.gender ?? undefined)
  const eff = effectiveBodyweightKgForSinclair(p)
  let sinclairVal: number | null = null
  if (eff > 0 && sg) {
    const c = sinclairTotal(best.total, eff, sg)
    if (!Number.isNaN(c)) sinclairVal = Number(c.toFixed(2))
  }
  return {
    snatch: best.snatch,
    cleanJerk: best.clean_and_jerk,
    total: best.total,
    sinclair: sinclairVal
  }
})

const progressSeries = computed<AthleteChartPoint[]>(() => {
  const p = athlete.value
  if (!p) return []
  const effectiveWeight = effectiveBodyweightKgForSinclair(p)
  const sg = cardGender(p.gender ?? undefined)
  return approvedResults.value
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => {
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
})

/**
 * Łączona seria — startowa + treningowa, tylko zatwierdzone.
 * Sinclair liczony per punkt z aktualnej masy ciała / kategorii zawodnika.
 */
const combinedSeries = computed<CombinedChartPoint[]>(() => {
  const p = athlete.value
  if (!p) return []
  const sg = cardGender(p.gender ?? undefined)
  const eff = effectiveBodyweightKgForSinclair(p)
  const toPoint = (r: CompetitionResult, kind: 'competition' | 'training'): CombinedChartPoint => {
    let sinclairPt: number | null = null
    if (eff > 0 && sg) {
      const c = sinclairTotal(r.total, eff, sg)
      if (!Number.isNaN(c)) sinclairPt = Number(c.toFixed(2))
    }
    const raw = r.date || ''
    const dateShort = raw.length >= 10 ? raw.slice(0, 10) : raw
    return {
      date: dateShort,
      total: r.total,
      snatch: r.snatch,
      clean_and_jerk: r.clean_and_jerk,
      sinclair: sinclairPt,
      kind
    }
  }
  const trainPts = canViewAthleteTraining.value
    ? approvedTraining.value.map(r => toPoint(r, 'training'))
    : []
  return [
    ...approvedResults.value.map(r => toPoint(r, 'competition')),
    ...trainPts
  ].sort((a, b) => a.date.localeCompare(b.date))
})

interface CombinedStats {
  competitions: number
  trainings: number
  bestCompetitionTotal: number | null
  bestTrainingTotal: number | null
  bestCombinedTotal: number | null
  bestSnatch: number | null
  bestCleanJerk: number | null
  avgCompetitionTotal: number | null
  avgTrainingTotal: number | null
  bestSinclairCompetition: number | null
  bestSinclairTraining: number | null
  /** „Realizacja formy" — best zawody / best trening * 100%. <100% = zostawia kg na sali. */
  formRealisationPct: number | null
  /** Trend ostatnich 90 dni (po wszystkich punktach combined). */
  trendKgLast90Days: number | null
  pbCount: number
  daysSinceLastEntry: number | null
  lastEntryKind: 'competition' | 'training' | null
}

function safeMax(arr: number[]): number | null {
  return arr.length === 0 ? null : Math.max(...arr)
}

function safeAvg(arr: number[]): number | null {
  if (arr.length === 0) return null
  return Number((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1))
}

function bestSinclairOf(rows: CompetitionResult[]): number | null {
  const p = athlete.value
  if (!p || rows.length === 0) return null
  const sg = cardGender(p.gender ?? undefined)
  const eff = effectiveBodyweightKgForSinclair(p)
  if (!sg || eff <= 0) return null
  let best = 0
  for (const r of rows) {
    const c = sinclairTotal(r.total, eff, sg)
    if (Number.isFinite(c) && c > best) best = c
  }
  return best > 0 ? Number(best.toFixed(2)) : null
}

const combinedStats = computed<CombinedStats>(() => {
  const comp = approvedResults.value
  const train = canViewAthleteTraining.value ? approvedTraining.value : []
  const all = combinedSeries.value

  const compTotals = comp.map(r => r.total).filter(v => Number.isFinite(v) && v > 0)
  const trainTotals = train.map(r => r.total).filter(v => Number.isFinite(v) && v > 0)
  const allRows = [...comp, ...train]
  const allSnatch = allRows.map(r => r.snatch).filter(v => Number.isFinite(v) && v > 0)
  const allCJ = allRows.map(r => r.clean_and_jerk).filter(v => Number.isFinite(v) && v > 0)

  const bestComp = safeMax(compTotals)
  const bestTrain = safeMax(trainTotals)
  const bestCombined = safeMax([...compTotals, ...trainTotals])

  // PB: ile razy w combined serii pojawił się nowy rekord (ścisła nierówność).
  let pbCount = 0
  let runningMax = 0
  for (const pt of all) {
    if (pt.total > runningMax) {
      if (runningMax > 0) pbCount++
      runningMax = pt.total
    }
  }

  // Trend ostatnich 90 dni — różnica średnich (ostatnie 90 dni vs. wcześniejsze 90 dni przed nimi).
  let trendKgLast90Days: number | null = null
  if (all.length >= 4) {
    const lastDate = new Date(all[all.length - 1]!.date + 'T00:00:00').getTime()
    if (Number.isFinite(lastDate)) {
      const cutoff = lastDate - 90 * 24 * 3600 * 1000
      const prev = lastDate - 180 * 24 * 3600 * 1000
      const recent = all.filter((p) => {
        const t = new Date(p.date + 'T00:00:00').getTime()
        return t >= cutoff
      })
      const earlier = all.filter((p) => {
        const t = new Date(p.date + 'T00:00:00').getTime()
        return t >= prev && t < cutoff
      })
      if (recent.length > 0 && earlier.length > 0) {
        const a = recent.reduce((s, x) => s + x.total, 0) / recent.length
        const b = earlier.reduce((s, x) => s + x.total, 0) / earlier.length
        trendKgLast90Days = Number((a - b).toFixed(1))
      }
    }
  }

  let daysSinceLastEntry: number | null = null
  let lastEntryKind: 'competition' | 'training' | null = null
  const lastPoint = all[all.length - 1]
  if (lastPoint) {
    const t = new Date(lastPoint.date + 'T00:00:00').getTime()
    if (Number.isFinite(t)) {
      const days = Math.floor((Date.now() - t) / (24 * 3600 * 1000))
      daysSinceLastEntry = Math.max(0, days)
      lastEntryKind = lastPoint.kind
    }
  }

  const formRealisationPct = (bestComp != null && bestTrain != null && bestTrain > 0)
    ? Number(((bestComp / bestTrain) * 100).toFixed(1))
    : null

  return {
    competitions: comp.length,
    trainings: train.length,
    bestCompetitionTotal: bestComp,
    bestTrainingTotal: bestTrain,
    bestCombinedTotal: bestCombined,
    bestSnatch: safeMax(allSnatch),
    bestCleanJerk: safeMax(allCJ),
    avgCompetitionTotal: safeAvg(compTotals),
    avgTrainingTotal: safeAvg(trainTotals),
    bestSinclairCompetition: bestSinclairOf(comp),
    bestSinclairTraining: bestSinclairOf(train),
    formRealisationPct,
    trendKgLast90Days,
    pbCount,
    daysSinceLastEntry,
    lastEntryKind
  }
})

const showCombinedSection = computed(
  () => auth.isLoggedIn.value && !shareLite.value && combinedSeries.value.length > 0
)

/** Publiczne, lekkie statystyki ze startów — używane w hero/KPI strip dla wszystkich. */
const publicStats = computed(() => {
  const comp = approvedResults.value
  if (comp.length === 0) {
    return {
      totalStarts: 0,
      bestTotal: null as number | null,
      avgTotal: null as number | null,
      lastDate: null as string | null,
      lastLocation: null as string | null,
      daysSinceLast: null as number | null
    }
  }
  const sorted = comp.slice().sort((a, b) => a.date.localeCompare(b.date))
  const last = sorted[sorted.length - 1]!
  const totals = comp.map(r => r.total).filter(v => Number.isFinite(v) && v > 0)
  let daysSinceLast: number | null = null
  const t = new Date(last.date.slice(0, 10) + 'T00:00:00').getTime()
  if (Number.isFinite(t)) {
    daysSinceLast = Math.max(0, Math.floor((Date.now() - t) / (24 * 3600 * 1000)))
  }
  return {
    totalStarts: comp.length,
    bestTotal: totals.length ? Math.max(...totals) : null,
    avgTotal: totals.length ? Number((totals.reduce((s, v) => s + v, 0) / totals.length).toFixed(1)) : null,
    lastDate: last.date,
    lastLocation: last.location ?? null,
    daysSinceLast
  }
})

const cmsAthletePageName = computed(() => cmsRoutePageName(route.path as string))

useProvideCmsPageData(cmsAthletePageName, () => {
  const a = athlete.value
  if (!a) return {}
  const sg = cardGender(a.gender ?? undefined)
  const eff = effectiveBodyweightKgForSinclair(a)
  const bestTotal = publicStats.value.bestTotal
  let bestSinclair = ''
  if (sg && bestTotal && eff > 0) {
    bestSinclair = sinclairTotal(bestTotal, eff, sg).toFixed(2)
  }
  return {
    imie_zawodnika: a.full_name,
    kategoria_wagowa: a.weight_category ?? '',
    rok_urodzenia: a.birth_year ?? '',
    plec_zawodnika: a.gender === 'female' ? 'K' : a.gender === 'male' ? 'M' : '',
    najlepszy_total: bestTotal != null ? `${bestTotal} kg` : '',
    najlepszy_sinclair: bestSinclair,
    liczba_startow: publicStats.value.totalStarts
  }
})

const nameInitials = computed(() => {
  const name = (athlete.value?.full_name || '').trim()
  if (!name) return ''
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
})

const approvedSinclair = computed(() => {
  const p = athlete.value
  if (!p) return null
  const sg = cardGender(p.gender ?? undefined)
  const bestRow = pickBestCompetitionRow(approvedResults.value)
  const totalKg = bestRow?.total ?? p.total_kg ?? 0
  const effectiveWeight = effectiveBodyweightKgForSinclair(p)
  if (totalKg <= 0 || effectiveWeight <= 0 || !sg) return null
  const calculated = sinclairTotal(totalKg, effectiveWeight, sg)
  if (Number.isNaN(calculated)) return null
  return Number(calculated.toFixed(2))
})

const resumeShareUrl = computed(() => `${requestUrlState.origin}${route.path}?share=1`)

async function copyResumeShareLink() {
  if (!import.meta.client || !resumeShareUrl.value) return
  try {
    await navigator.clipboard.writeText(resumeShareUrl.value)
    toast.add({
      title: 'Skopiowano link publiczny',
      description: 'Widok dla mediów bez sekcji treningowych (?share=1).',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'Nie udało się skopiować linku', color: 'warning' })
  }
}

function printAthleteResume() {
  if (import.meta.client) window.print()
}
</script>

<template>
  <PublicPageLayout padding="flush" :ambient="false">
    <!-- ========== HERO MAGAZINE ========== -->
    <section class="relative overflow-hidden border-b border-default/60">
      <div
        v-if="athlete!.image_url"
        class="pointer-events-none absolute inset-0 -z-10 opacity-25 saturate-150"
        :style="{
          backgroundImage: `url(${athlete!.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(48px)'
        }"
      />
      <div
        class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-background/50 via-background/85 to-background"
      />
      <div
        class="pointer-events-none absolute inset-0 -z-10"
        style="background-image: radial-gradient(ellipse at top left, rgb(34 197 94 / 0.12), transparent 55%), radial-gradient(ellipse at bottom right, rgb(14 165 233 / 0.08), transparent 55%);"
      />

      <div class="relative pt-8 pb-10 sm:pt-10 sm:pb-14 lg:pt-14 lg:pb-20">
        <PublicPageHeader
          back-to="/zawodnicy"
          back-label="Lista zawodników"
          eyebrow="Profil zawodnika"
          class="!mb-6 !flex-col !items-start !gap-2 md:!mb-8"
        />

        <div class="grid gap-8 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-12">
          <!-- AVATAR / FOTO -->
          <div class="relative mx-auto w-full max-w-[18rem] lg:mx-0">
            <div class="absolute -inset-3 rounded-4xl bg-linear-to-br from-primary/40 via-primary/10 to-info/18 opacity-60 blur-2xl" />
            <div class="relative aspect-4/5 overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-primary/15 ring-1 ring-primary/15">
              <img
                v-if="athlete!.image_url"
                :src="athlete!.image_url"
                :alt="`Zdjęcie ${athlete!.full_name}`"
                class="h-full w-full object-cover"
              >
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/30 via-primary/10 to-neutral-900"
              >
                <span class="font-display text-7xl font-black tracking-tight text-white/85">
                  {{ nameInitials || '—' }}
                </span>
              </div>
              <div class="absolute inset-x-0 bottom-0 flex items-end gap-2 bg-linear-to-t from-black/85 via-black/40 to-transparent p-4">
                <span class="rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                  CKS Slavia
                </span>
                <span
                  v-if="athlete && athlete.is_active === false"
                  class="rounded-full bg-warning/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg"
                >
                  Nieaktywny
                </span>
                <span
                  v-else
                  class="rounded-full bg-success/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg"
                >
                  Aktywny
                </span>
              </div>
            </div>
          </div>

          <!-- INFO -->
          <div class="flex flex-col justify-end">
            <p class="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
              Profil zawodnika
            </p>
            <h1 class="mt-3 text-4xl font-black leading-[1.05] tracking-tight text-highlighted sm:text-5xl lg:text-6xl">
              {{ athlete!.full_name }}
            </h1>
            <p
              v-if="athlete!.profile_tagline?.trim()"
              class="mt-3 text-lg font-semibold text-primary/90 sm:text-xl"
            >
              {{ athlete!.profile_tagline!.trim() }}
            </p>

            <!-- Badges szybkich faktów -->
            <div class="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <span
                v-if="athlete!.weight_category"
                class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-semibold text-primary"
              >
                <UIcon name="i-lucide-scale" class="size-3.5" />
                {{ athlete!.weight_category }}
              </span>
              <span
                v-if="athlete!.bodyweight != null"
                class="inline-flex items-center gap-1.5 rounded-full border border-default/60 bg-muted/10 px-3 py-1.5 font-mono font-semibold text-highlighted"
              >
                <UIcon name="i-lucide-weight" class="size-3.5 text-muted" />
                {{ athlete!.bodyweight }} kg
              </span>
              <span
                v-if="genderLabel(athlete!.gender)"
                class="inline-flex items-center gap-1.5 rounded-full border border-default/60 bg-muted/10 px-3 py-1.5 font-semibold text-muted"
              >
                <UIcon
                  :name="athlete!.gender === 'female' ? 'i-lucide-venus' : 'i-lucide-mars'"
                  class="size-3.5"
                />
                {{ genderLabel(athlete!.gender) }}
              </span>
              <span
                v-if="athlete!.birth_year"
                class="inline-flex items-center gap-1.5 rounded-full border border-default/60 bg-muted/10 px-3 py-1.5 font-semibold text-muted"
              >
                <UIcon name="i-lucide-cake" class="size-3.5" />
                rocznik {{ athlete!.birth_year }}
              </span>
              <span
                v-if="publicStats.totalStarts > 0"
                class="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 font-semibold text-success dark:text-success"
              >
                <UIcon name="i-lucide-medal" class="size-3.5" />
                {{ publicStats.totalStarts }} {{ publicStats.totalStarts === 1 ? 'start' : 'startów' }}
              </span>
            </div>

            <UAlert
              v-if="athlete && athlete.is_active === false"
              class="mt-5 max-w-2xl"
              color="warning"
              variant="subtle"
              icon="i-lucide-user-x"
              title="Profil nieaktywny w kadrze"
              description="Ten zawodnik jest oznaczony jako nieaktywny — zwykle oznacza to przerwę w treningach lub archiwizację profilu. Dane historyczne pozostają widoczne."
            />

            <p class="mt-5 max-w-3xl text-base leading-relaxed text-muted">
              {{ profileHeroBio }}
            </p>

            <!-- CTA -->
            <div class="mt-7 flex flex-wrap gap-2">
              <UButton
                v-if="canEditAthlete && athleteId"
                :to="`/trainer/zawodnicy?edit=${encodeURIComponent(String(athleteId))}`"
                color="primary"
                icon="i-lucide-pencil"
              >
                Edytuj profil
              </UButton>
              <UButton
                v-if="approvedResults.length > 0"
                to="#progres"
                variant="soft"
                color="primary"
                icon="i-lucide-trending-up"
              >
                Zobacz progres
              </UButton>
              <UButton
                v-if="approvedResults.length > 0"
                to="#historia-startow"
                variant="ghost"
                color="neutral"
                icon="i-lucide-list"
              >
                Historia startów
              </UButton>
              <UButton
                v-if="approvedResults.length > 0"
                variant="outline"
                color="neutral"
                icon="i-lucide-share-2"
                @click="copyResumeShareLink"
              >
                Link (media / sponsor)
              </UButton>
              <UButton
                v-if="shareLite && approvedResults.length > 0"
                variant="soft"
                color="primary"
                icon="i-lucide-printer"
                @click="printAthleteResume"
              >
                Drukuj
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== KPI STRIP (zawody / publiczne) ========== -->
    <section class="slavia-page-bleed border-b border-default/60 bg-muted/5">
      <div class="py-0">
        <p
          v-if="approvedResults.length > 0"
          class="border-b border-default/40 bg-muted/30 px-5 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90 sm:px-6"
        >
          Rekordy z zatwierdzonych startów zawodowych
        </p>
        <div class="grid grid-cols-2 gap-px bg-default/40 lg:grid-cols-4">
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-up" class="size-4" />
              Rwanie · PB
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ competitionPbDisplay.snatch ?? '—' }}
              <span
                v-if="competitionPbDisplay.snatch != null"
                class="text-sm font-semibold text-muted"
              >kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-down" class="size-4" />
              Podrzut · PB
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ competitionPbDisplay.cleanJerk ?? '—' }}
              <span
                v-if="competitionPbDisplay.cleanJerk != null"
                class="text-sm font-semibold text-muted"
              >kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-success dark:text-success">
              <UIcon name="i-lucide-trophy" class="size-4" />
              Total · rekord
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-success dark:text-success sm:text-4xl">
              {{ competitionPbDisplay.total ?? '—' }}
              <span
                v-if="competitionPbDisplay.total != null"
                class="text-sm font-semibold text-muted"
              >kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-star" class="size-4" />
              Sinclair
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-amber-600 dark:text-amber-300 sm:text-4xl">
              {{ approvedSinclair ?? '—' }}
              <span
                v-if="approvedSinclair != null"
                class="text-sm font-semibold text-muted"
              >pkt</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== KPI TRENING (tylko zalogowani) — ta sama siatka co zawody, inna etykieta ========== -->
    <section
      v-if="canViewAthleteTraining && trainingStripKpi && !shareLite"
      class="slavia-page-bleed border-b border-default/60 bg-muted/5"
    >
      <div class="py-0">
        <p class="border-b border-default/40 bg-muted/30 px-5 py-2.5 text-center sm:px-6">
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90">Trening (sala)</span>
          <span class="mx-2 hidden text-default/35 sm:inline">·</span>
          <span class="mt-1 block text-[11px] font-medium leading-snug tracking-normal text-muted sm:mt-0 sm:inline">
            Osobno od zawodów — bez wpływu na PB i ranking publiczny.
          </span>
        </p>
        <div class="grid grid-cols-2 gap-px bg-default/40 lg:grid-cols-4">
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-up" class="size-4" />
              Rwanie · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ trainingStripKpi.snatch }}
              <span class="text-sm font-semibold text-muted">kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-down" class="size-4" />
              Podrzut · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ trainingStripKpi.cleanJerk }}
              <span class="text-sm font-semibold text-muted">kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-success dark:text-success">
              <UIcon name="i-lucide-dumbbell" class="size-4 opacity-90" />
              Total · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-success dark:text-success sm:text-4xl">
              {{ trainingStripKpi.total }}
              <span class="text-sm font-semibold text-muted">kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-star" class="size-4" />
              Sinclair · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-amber-600 dark:text-amber-300 sm:text-4xl">
              {{ trainingStripKpi.sinclair ?? '—' }}
              <span
                v-if="trainingStripKpi.sinclair != null"
                class="text-sm font-semibold text-muted"
              >pkt</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <div class="space-y-12 py-8 sm:py-10 lg:space-y-16 lg:py-12">
        <!-- ========== BIO PULL-QUOTE ========== -->
        <section v-if="athlete!.public_bio?.trim()" class="relative">
          <div class="slavia-page-card relative mx-auto max-w-4xl p-6 sm:p-10">
            <UIcon
              name="i-lucide-quote"
              class="absolute -top-4 left-6 size-10 rounded-full bg-primary p-2 text-white shadow-md"
            />
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              O zawodniku
            </p>
            <p class="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-highlighted/95 sm:text-xl">
              {{ athlete!.public_bio!.trim() }}
            </p>
          </div>
        </section>

        <!-- ========== QUICK STATS ========== -->
        <section v-if="publicStats.totalStarts > 0">
          <header class="mb-5 flex items-center gap-3">
            <span class="h-8 w-1 rounded-full bg-primary" />
            <h2 class="text-xl font-bold tracking-tight text-highlighted sm:text-2xl">
              Statystyki w skrócie
            </h2>
          </header>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="slavia-page-card slavia-page-card--flat p-5 transition hover:border-primary/30">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Liczba startów
              </p>
              <p class="mt-2 font-mono text-3xl font-bold text-highlighted">
                {{ publicStats.totalStarts }}
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Zatwierdzone starty z zawodów (bez treningów salowych).
              </p>
            </div>
            <div class="slavia-page-card slavia-page-card--flat p-5 transition hover:border-primary/30">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Średni total
              </p>
              <p class="mt-2 font-mono text-3xl font-bold text-highlighted">
                {{ publicStats.avgTotal ?? '—' }}<span v-if="publicStats.avgTotal != null" class="ml-1 text-sm font-semibold text-muted">kg</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Średnia z zatwierdzonych startów.
              </p>
            </div>
            <div class="slavia-page-card slavia-page-card--flat border-success/30 bg-linear-to-br from-success/12 to-success/6 p-5">
              <p class="text-[10px] font-bold uppercase tracking-wide text-success dark:text-success">
                Najlepszy total
              </p>
              <p class="mt-2 font-mono text-3xl font-bold text-success dark:text-success">
                {{ publicStats.bestTotal ?? '—' }}<span v-if="publicStats.bestTotal != null" class="ml-1 text-sm font-semibold text-muted">kg</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Maksimum z historii startów.
              </p>
            </div>
            <div class="slavia-page-card slavia-page-card--flat p-5 transition hover:border-primary/30">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Ostatni start
              </p>
              <p class="mt-2 font-mono text-2xl font-bold text-highlighted">
                <template v-if="publicStats.daysSinceLast == null">—</template>
                <template v-else-if="publicStats.daysSinceLast === 0">dziś</template>
                <template v-else>{{ publicStats.daysSinceLast }} <span class="text-sm font-semibold text-muted">dni temu</span></template>
              </p>
              <p
                v-if="publicStats.lastDate"
                class="mt-1 text-[11px] text-muted truncate"
              >
                {{ formatDate(publicStats.lastDate) }}<template v-if="publicStats.lastLocation"> · {{ publicStats.lastLocation }}</template>
              </p>
            </div>
          </div>
        </section>

        <!-- ========== WYKRES PROGRESJI ========== -->
        <section
          v-if="approvedResults.length > 0"
          id="progres"
          class="scroll-mt-24"
        >
          <header class="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="h-8 w-1 rounded-full bg-primary" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Pomost
                </p>
                <h2 class="mt-0.5 text-xl font-bold tracking-tight text-highlighted sm:text-2xl">
                  Progresja totalu — zawody
                </h2>
              </div>
            </div>
            <p class="text-[11px] text-muted">
              Najedź punkt — szczegóły startu.
            </p>
          </header>
          <div class="slavia-page-card p-5 sm:p-7">
            <AthleteProgressChart :series="progressSeries" :height="260" />
          </div>
        </section>

        <!-- ========== ANALIZA ŁĄCZONA (auth) ========== -->
        <section v-if="showCombinedSection" id="analiza" class="scroll-mt-24">
          <header class="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="h-8 w-1 rounded-full bg-success" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-success dark:text-success">
                  Trening + zawody
                </p>
                <h2 class="mt-0.5 text-xl font-bold tracking-tight text-highlighted sm:text-2xl">
                  Analiza łączona
                </h2>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-[11px]">
              <span class="flex items-center gap-1.5">
                <span class="inline-block h-2 w-3 rounded-full bg-primary" />
                <span class="font-semibold text-highlighted">Zawody</span>
                <span class="text-muted">({{ combinedStats.competitions }})</span>
              </span>
              <span class="flex items-center gap-1.5">
                <span class="inline-block h-1 w-3 rounded-full bg-info" />
                <span class="font-semibold text-highlighted">Trening</span>
                <span class="text-muted">({{ combinedStats.trainings }})</span>
              </span>
            </div>
          </header>

          <div class="slavia-page-card p-5 sm:p-7">
            <AthleteCombinedChart :series="combinedSeries" :height="260" />
            <p class="mt-3 text-right text-[11px] text-muted">
              Linia ciągła = zawody, przerywana = trening.
            </p>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-success/30 bg-linear-to-br from-success/12 to-success/6 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-success dark:text-success">
                Najlepszy total (łącznie)
              </p>
              <p class="mt-1.5 font-mono text-2xl font-bold text-success dark:text-success">
                {{ combinedStats.bestCombinedTotal ?? '—' }}<span v-if="combinedStats.bestCombinedTotal != null" class="ml-1 text-xs font-semibold text-muted">kg</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Z: <span class="font-mono font-semibold text-highlighted">{{ combinedStats.bestCompetitionTotal ?? '—' }}</span>
                · T: <span class="font-mono font-semibold text-highlighted">{{ combinedStats.bestTrainingTotal ?? '—' }}</span>
              </p>
            </div>
            <div class="rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/5 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Realizacja formy
              </p>
              <p class="mt-1.5 font-mono text-2xl font-bold text-amber-600 dark:text-amber-300">
                {{ combinedStats.formRealisationPct != null ? combinedStats.formRealisationPct + '%' : '—' }}
              </p>
              <p class="mt-1 text-[11px] leading-snug text-muted">
                <template v-if="combinedStats.formRealisationPct != null && combinedStats.formRealisationPct >= 100">
                  Pełna forma z sali na pomoście.
                </template>
                <template v-else-if="combinedStats.formRealisationPct != null">
                  Zostawia <span class="font-semibold text-highlighted">{{ (100 - combinedStats.formRealisationPct).toFixed(1) }}%</span> potencjału.
                </template>
                <template v-else>
                  Brak pary do porównania.
                </template>
              </p>
            </div>
            <div class="rounded-2xl border border-primary/25 bg-linear-to-br from-primary/10 to-primary/5 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-primary">
                Trend (90 dni)
              </p>
              <p
                class="mt-1.5 font-mono text-2xl font-bold"
                :class="combinedStats.trendKgLast90Days == null
                  ? 'text-muted'
                  : combinedStats.trendKgLast90Days > 0
                    ? 'text-success'
                    : combinedStats.trendKgLast90Days < 0
                      ? 'text-error'
                      : 'text-highlighted'"
              >
                <template v-if="combinedStats.trendKgLast90Days == null">—</template>
                <template v-else>
                  {{ combinedStats.trendKgLast90Days > 0 ? '+' : '' }}{{ combinedStats.trendKgLast90Days }}<span class="ml-1 text-xs font-semibold text-muted">kg</span>
                </template>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Δ średniego totalu vs. poprzednie 90 dni.
              </p>
            </div>
            <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Pobite rekordy
              </p>
              <p class="mt-1.5 font-mono text-2xl font-bold text-success">
                {{ combinedStats.pbCount }} <span class="text-xs font-normal text-muted">razy ↑</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Liczba PB w historii.
              </p>
            </div>
          </div>

          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-default/50 bg-background/60 p-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Średni total
              </p>
              <p class="mt-1 font-mono text-sm font-semibold text-highlighted">
                <span class="text-primary">Z</span> {{ combinedStats.avgCompetitionTotal ?? '—' }}
                <span class="mx-1 text-muted">/</span>
                <span class="font-semibold text-info">T</span> {{ combinedStats.avgTrainingTotal ?? '—' }}
              </p>
            </div>
            <div class="rounded-xl border border-default/50 bg-background/60 p-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Best Sinclair
              </p>
              <p class="mt-1 font-mono text-sm font-semibold text-amber-500 dark:text-amber-300">
                <span class="text-primary">Z</span> {{ combinedStats.bestSinclairCompetition ?? '—' }}
                <span class="mx-1 text-muted">/</span>
                <span class="font-semibold text-info">T</span> {{ combinedStats.bestSinclairTraining ?? '—' }}
              </p>
            </div>
            <div class="rounded-xl border border-default/50 bg-background/60 p-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Najlepsze boje (łącznie)
              </p>
              <p class="mt-1 font-mono text-sm font-semibold text-highlighted">
                Rwanie {{ combinedStats.bestSnatch ?? '—' }}
                <span class="mx-1 text-muted">·</span>
                Podrzut {{ combinedStats.bestCleanJerk ?? '—' }}
              </p>
            </div>
          </div>
        </section>

        <!-- ========== HISTORIA STARTÓW ========== -->
        <section id="historia-startow" class="scroll-mt-24">
          <header class="mb-5 flex items-center gap-3">
            <span class="h-8 w-1 rounded-full bg-primary" />
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Pomost &amp; sala
              </p>
              <h2 class="mt-0.5 text-xl font-bold tracking-tight text-highlighted sm:text-2xl">
                Historia startów
              </h2>
            </div>
          </header>

          <div
            class="grid gap-6"
            :class="canViewAthleteTraining ? 'lg:grid-cols-2' : ''"
          >
            <!-- ZAWODY -->
            <div class="slavia-page-card min-h-0 min-w-0 p-5 sm:p-6">
              <div class="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    <UIcon name="i-lucide-medal" class="size-4" />
                    Zawody
                  </p>
                  <p class="mt-0.5 text-xs text-muted">
                    Widok publiczny.
                  </p>
                </div>
                <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {{ approvedResults.length }} {{ approvedResults.length === 1 ? 'wpis' : 'wpisów' }}
                </span>
              </div>
              <div
                class="min-h-0 max-h-[min(70vh,34rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-0.5"
              >
              <ol class="relative space-y-3 border-l-2 border-primary/20 pl-5">
                <li
                  v-for="result in approvedResults.slice(0, 12)"
                  :key="result.id"
                  class="relative"
                >
                  <span class="absolute left-[-27px] top-2 size-3 rounded-full border-2 border-primary bg-background" />
                  <div class="rounded-xl border border-default/50 bg-background/60 p-4 transition hover:border-primary/40 hover:shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-highlighted">
                          {{ formatDate(result.date) }}
                        </p>
                        <p
                          v-if="result.location"
                          class="mt-0.5 flex items-center gap-1 text-xs text-muted"
                        >
                          <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
                          <span class="truncate">{{ result.location }}</span>
                        </p>
                      </div>
                      <p class="font-mono text-lg font-bold text-primary">
                        {{ result.total }} <span class="text-xs font-semibold text-muted">kg</span>
                      </p>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <p class="rounded-md bg-muted/10 px-2 py-1 text-muted">
                        Rwanie <span class="font-mono font-semibold text-highlighted">{{ result.snatch }}</span>
                      </p>
                      <p class="rounded-md bg-muted/10 px-2 py-1 text-muted">
                        Podrzut <span class="font-mono font-semibold text-highlighted">{{ result.clean_and_jerk }}</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li v-if="approvedResults.length === 0" class="list-none pl-0">
                  <PublicEmptyState
                    compact
                    icon="i-lucide-medal"
                    title="Brak zatwierdzonych wyników"
                    description="Wyniki z zawodów pojawią się po weryfikacji przez trenera lub administrację."
                  />
                </li>
              </ol>
              </div>
              <p
                v-if="approvedResults.length > 12"
                class="mt-3 text-center text-[11px] text-muted"
              >
                Pokazano 12 najnowszych z {{ approvedResults.length }}.
              </p>
            </div>

            <!-- TRENING (auth only) — tabela ostatnich wpisów (tylko ten zawodnik) -->
            <div
              v-if="canViewAthleteTraining"
              class="slavia-page-card min-h-0 min-w-0 p-5 sm:p-6"
            >
              <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    <UIcon name="i-lucide-dumbbell" class="size-4 text-primary/85" />
                    Ostatnie wpisy treningowe
                  </p>
                  <p class="mt-0.5 text-xs text-muted">
                    Widok kadry lub Twój własny profil — wpisy nie zmieniają publicznego PB ani rankingu zawodów.
                  </p>
                </div>
                <span class="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {{ approvedTraining.length }} {{ approvedTraining.length === 1 ? 'wpis' : 'wpisów' }}
                </span>
              </div>

              <PublicEmptyState
                v-if="approvedTrainingSorted.length === 0"
                compact
                icon="i-lucide-dumbbell"
                title="Brak wpisów treningowych"
                description="Zatwierdzone wyniki z sali pojawią się tutaj po weryfikacji."
              />

              <div
                v-else
                class="overflow-hidden rounded-xl border border-info/25 bg-linear-to-b from-info/6 to-background shadow-lg ring-1 ring-info/12"
              >
                <div class="border-b border-default/50 bg-muted/30 px-3 py-2 sm:px-4">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-info">
                    Kronika sali
                  </p>
                </div>
                <div class="max-h-[min(70vh,36rem)] overflow-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                  <div class="min-w-0 overflow-x-auto">
                    <table class="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr class="border-b border-default/60 bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted">
                          <th class="px-3 py-3 sm:px-4">Data</th>
                          <th class="hidden px-3 py-3 sm:table-cell sm:px-4">Miejsce</th>
                          <th class="px-3 py-3 text-right sm:px-4">Rwanie</th>
                          <th class="px-3 py-3 text-right sm:px-4">Podrzut</th>
                          <th class="px-3 py-3 text-right font-semibold sm:px-4">Razem</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-default/50">
                        <tr
                          v-for="r in approvedTrainingSorted.slice(0, 12)"
                          :key="`train-row-${r.id}`"
                          class="bg-background/80 transition-colors hover:bg-info/8"
                        >
                          <td class="whitespace-nowrap px-3 py-3 text-muted sm:px-4">
                            {{ formatBoardDate(r.date) }}
                          </td>
                          <td class="hidden max-w-40 truncate px-3 py-3 text-xs text-muted sm:table-cell sm:px-4">
                            <template v-if="r.location">{{ r.location }}</template>
                            <template v-else>—</template>
                          </td>
                          <td class="px-3 py-3 text-right tabular-nums text-muted sm:px-4">{{ r.snatch }} kg</td>
                          <td class="px-3 py-3 text-right tabular-nums text-muted sm:px-4">{{ r.clean_and_jerk }} kg</td>
                          <td class="px-3 py-3 text-right tabular-nums font-bold text-info sm:px-4">
                            {{ r.total }} kg
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <p
                v-if="approvedTrainingSorted.length > 12"
                class="mt-3 text-center text-[11px] text-muted"
              >
                Pokazano 12 najnowszych z {{ approvedTrainingSorted.length }}.
              </p>
            </div>
          </div>
        </section>

        <!-- ========== FOOTER NAVIGATION ========== -->
        <section class="slavia-page-card p-6 text-center sm:p-8">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Nawigacja
          </p>
          <h3 class="mt-2 text-xl font-bold text-highlighted sm:text-2xl">
            Sprawdź pozostałych zawodników klubu
          </h3>
          <p class="mt-2 mx-auto max-w-2xl text-sm leading-relaxed text-muted">
            Rozbudowany opis i slogan ustawiają trener, administrator lub superadministrator w panelu kadry.
          </p>
          <div class="mt-5 flex flex-wrap justify-center gap-2">
            <UButton
              to="/zawodnicy"
              color="primary"
              size="lg"
              icon="i-lucide-users"
            >
              Lista zawodników
            </UButton>
            <UButton
              to="/zawodnicy#wyniki-zawodow"
              variant="soft"
              color="primary"
              size="lg"
              icon="i-lucide-medal"
            >
              Wszystkie wyniki klubu
            </UButton>
          </div>
        </section>
      </div>
  </PublicPageLayout>
</template>

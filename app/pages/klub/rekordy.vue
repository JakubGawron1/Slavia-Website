<script setup lang="ts">
import ClubHallOfFameRecordCard, {
  type ClubHallOfFameRecordCardData
} from '~/components/club/ClubHallOfFameRecordCard.vue'
import type { AthleteChartPoint } from '~/components/AthleteProgressChart.vue'
import { groupPublicBoardByAthlete } from '~/composables/usePublicFetch'
import type { Athlete } from '~/types/models'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'
import {
  approvedCompetitionStarts,
  boardRowToCompetitionResult,
  buildCompetitionChartHistory,
  cardGender,
  formatWeightCategoryText,
  pickBestCompetitionStart,
  resolveWeightCategoryThreshold,
  type PublicBoardRow
} from '~/utils/zawodnicyRanking'

definePageMeta({
  backTo: '/zawodnicy',
  backLabel: 'Wróć do kadry'
})

useSeoMeta({
  title: 'Rekordy klubu — Hall of Fame',
  description: 'Najlepsze wyniki zawodników CKS Slavia w podziale na kategorie wagowe i płeć — zatwierdzone starty zawodów i wykres progresu.',
  robots: 'index, follow'
})

const period = ref<'all' | 'year'>('all')
const currentYear = new Date().getFullYear()

const { data: athletesRaw, error: athletesError, refresh: refreshAthletes } = await usePublicLazyFetch<Athlete[]>('athletes', {
  key: 'hall-of-fame-athletes',
  default: () => [] as Athlete[]
})

const { data: publicBoardRaw, error: boardError, refresh: refreshBoard } = await usePublicLazyFetch<PublicBoardRow[]>('results/public-board', {
  key: 'hall-of-fame-public-board',
  default: () => [] as PublicBoardRow[]
})

type RecordRow = {
  athleteId: string
  name: string
  gender: string
  weightCategory: number
  weightCategoryText: string
  bodyweight: number | null
  birthYear: number | null
  photo?: string
  tagline?: string
  total: number
  snatch: number
  cleanJerk: number
  sinclair: number
  resultDate: string | null
  chartHistory: AthleteChartPoint[]
  usesProfileFallback: boolean
}

const periodChartHint = computed(() =>
  period.value === 'year'
    ? `Wykresy i rekordy — tylko zatwierdzone starty z ${currentYear}.`
    : 'Wykresy i rekordy — wszystkie zatwierdzone starty zawodów (public board).'
)

function bucketKey(a: Athlete) {
  const threshold = resolveWeightCategoryThreshold(
    a.gender ?? undefined,
    a.bodyweight ?? undefined,
    a.weight_category ?? undefined
  )
  return `${a.gender || 'unknown'}|${threshold}`
}

function computeSinclair(a: Athlete, totalKg: number) {
  const sg = cardGender(a.gender ?? undefined)
  const eff = effectiveBodyweightKgForSinclair(a)
  if (!sg || totalKg <= 0 || eff <= 0) return 0
  const calculated = sinclairTotal(totalKg, eff, sg)
  return Number.isNaN(calculated) ? 0 : Number(calculated.toFixed(2))
}

function athleteToRecordRow(
  a: Athlete,
  snatch: number,
  cleanJerk: number,
  total: number,
  resultDate: string | null,
  chartHistory: AthleteChartPoint[],
  usesProfileFallback: boolean
): RecordRow {
  const threshold = resolveWeightCategoryThreshold(
    a.gender ?? undefined,
    a.bodyweight ?? undefined,
    a.weight_category ?? undefined
  )
  const tagline = (a.profile_tagline && String(a.profile_tagline).trim())
    || (a.public_bio && String(a.public_bio).trim())
    || undefined

  return {
    athleteId: a.id,
    name: a.full_name,
    gender: a.gender || '',
    weightCategory: threshold,
    weightCategoryText: formatWeightCategoryText(threshold, a.bodyweight ?? undefined),
    bodyweight: a.bodyweight ?? null,
    birthYear: a.birth_year ?? null,
    photo: a.image_url || undefined,
    tagline,
    total,
    snatch,
    cleanJerk,
    sinclair: computeSinclair(a, total),
    resultDate,
    chartHistory,
    usesProfileFallback
  }
}

function upsertBucket(buckets: Map<string, RecordRow>, key: string, row: RecordRow) {
  const prev = buckets.get(key)
  if (!prev
    || row.total > prev.total
    || (row.total === prev.total && (row.resultDate || '') > (prev.resultDate || ''))) {
    buckets.set(key, row)
  }
}

function chartOptsForPeriod(profileFallback: boolean) {
  return {
    year: period.value === 'year' ? currentYear : undefined,
    profileFallback
  } as const
}

const recordBoard = computed(() => {
  const athletes = (athletesRaw.value ?? []).filter(a => a.is_active !== false)
  const athleteMap = new Map(athletes.map(a => [a.id, a]))
  const buckets = new Map<string, RecordRow>()
  const yearPrefix = String(currentYear)
  const boardGrouped = groupPublicBoardByAthlete<PublicBoardRow>(publicBoardRaw.value ?? [])
  let usedBoard = false

  for (const [athleteId, rows] of Object.entries(boardGrouped)) {
    const a = athleteMap.get(athleteId)
    if (!a) continue

    const compResults = rows.map(boardRowToCompetitionResult)
    const compStarts = approvedCompetitionStarts(compResults)
    const candidates = period.value === 'year'
      ? compStarts.filter(r => r.date.startsWith(yearPrefix))
      : compStarts

    const best = pickBestCompetitionStart(candidates)
    if (!best || best.total <= 0) continue

    usedBoard = true
    const chartHistory = buildCompetitionChartHistory(a, compResults, chartOptsForPeriod(false))

    upsertBucket(
      buckets,
      bucketKey(a),
      athleteToRecordRow(
        a,
        best.snatch,
        best.clean_and_jerk,
        best.total,
        best.date.slice(0, 10),
        chartHistory,
        false
      )
    )
  }

  if (!usedBoard) {
    for (const a of athletes) {
      const total = a.total_kg ?? 0
      if (total <= 0) continue
      const chartHistory = buildCompetitionChartHistory(a, [], chartOptsForPeriod(true))
      upsertBucket(
        buckets,
        bucketKey(a),
        athleteToRecordRow(
          a,
          a.best_snatch_kg ?? 0,
          a.best_clean_jerk_kg ?? 0,
          total,
          null,
          chartHistory,
          true
        )
      )
    }
  }

  return [...buckets.values()].sort((a, b) => {
    if (a.gender !== b.gender) {
      if (a.gender === 'male') return -1
      if (b.gender === 'male') return 1
      return a.gender.localeCompare(b.gender)
    }
    if (a.weightCategory !== b.weightCategory) {
      return a.weightCategory - b.weightCategory
    }
    return b.total - a.total
  })
})

const usesProfileFallbackBoard = computed(() =>
  recordBoard.value.length > 0 && recordBoard.value.every(r => r.usesProfileFallback)
)

const maleRecords = computed(() => recordBoard.value.filter(r => r.gender === 'male'))
const femaleRecords = computed(() => recordBoard.value.filter(r => r.gender === 'female'))

useProvideCmsPageData('klub-rekordy', () => ({
  liczba_rekordow: recordBoard.value.length,
  liczba_zawodnikow: new Set(recordBoard.value.map(r => r.athleteId)).size
}))

function genderLabel(g: string) {
  if (g === 'male') return 'Mężczyźni'
  if (g === 'female') return 'Kobiety'
  return 'Inne'
}

function chartCaption(_row: RecordRow) {
  if (period.value === 'year') {
    return `Progres totalu — starty ${currentYear}`
  }
  return 'Progres totalu — zawody'
}

function toRecordCard(row: RecordRow): ClubHallOfFameRecordCardData {
  return {
    athleteId: row.athleteId,
    name: row.name,
    weightCategoryText: row.weightCategoryText,
    birthYear: row.birthYear,
    bodyweight: row.bodyweight,
    photo: row.photo,
    tagline: row.tagline,
    total: row.total,
    snatch: row.snatch,
    cleanJerk: row.cleanJerk,
    sinclair: row.sinclair,
    resultDate: row.resultDate,
    chartHistory: row.chartHistory,
    usesProfileFallback: row.usesProfileFallback,
    chartCaption: chartCaption(row),
    chartKey: `${row.athleteId}-${row.weightCategory}-${period.value}`
  }
}
</script>

<template>
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="Klub"
      icon="i-lucide-trophy"
      title="Hall of Fame — rekordy klubu"
      description="Najlepsze totale w kategoriach wagowych na podstawie zatwierdzonych wyników zawodów. Filtr roku dotyczy rekordów i wykresów progresu."
      back-to="/zawodnicy"
      back-label="Wróć do kadry"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2">
          <UButton
            size="sm"
            :variant="period === 'all' ? 'solid' : 'ghost'"
            @click="period = 'all'"
          >
            Wszech czasów
          </UButton>
          <UButton
            size="sm"
            :variant="period === 'year' ? 'solid' : 'ghost'"
            @click="period = 'year'"
          >
            Bieżący rok ({{ currentYear }})
          </UButton>
        </div>
      </template>
    </PublicPageHeader>

    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      class="mb-6"
      :title="period === 'year' ? `Filtr ${currentYear}` : 'Źródło danych'"
      :description="usesProfileFallbackBoard
        ? 'Brak startów w public board — tymczasowo pokazujemy PB z profilu kadry (bez dat zawodów).'
        : periodChartHint"
    />

    <PublicApiErrorBanner
      v-if="athletesError"
      :error="athletesError"
      class="mb-6"
      @retry="refreshAthletes()"
    />
    <PublicApiErrorBanner
      v-if="boardError"
      :error="boardError"
      class="mb-6"
      @retry="refreshBoard()"
    />

    <template
      v-for="section in [
        { gender: 'male', rows: maleRecords },
        { gender: 'female', rows: femaleRecords }
      ]"
      :key="section.gender"
    >
      <section
        v-if="section.rows.length"
        class="slavia-content-well slavia-public-section mb-10 last:mb-0"
      >
        <PublicSectionHead
          split
          :eyebrow="genderLabel(section.gender)"
          :title="`${section.rows.length} ${section.rows.length === 1 ? 'kategoria' : 'kategorii'}`"
          :lead="period === 'year' ? `Rekordy i wykresy z zatwierdzonych startów w ${currentYear}.` : 'Najlepsze totale w kategoriach wagowych — zatwierdzone wyniki zawodów.'"
        />

        <div class="slavia-public-grid slavia-public-grid--stagger">
          <ClubHallOfFameRecordCard
            v-for="row in section.rows"
            :key="`${row.gender}-${row.weightCategory}`"
            :record="toRecordCard(row)"
          />
        </div>
      </section>
    </template>

    <PublicEmptyState
      v-if="!recordBoard.length && !athletesError && !boardError"
      class="mt-8"
      icon="i-lucide-trophy"
      title="Brak rekordów"
      :description="period === 'year'
        ? `W ${currentYear} nie ma jeszcze zatwierdzonych wyników zawodów w kategoriach wagowych.`
        : 'Gdy zawodnicy uzupełnią wyniki w profilach, tablica wypełni się automatycznie.'"
    >
      <UButton to="/zawodnicy" variant="soft" color="primary" icon="i-lucide-users">
        Przejdź do kadry
      </UButton>
    </PublicEmptyState>
  </PublicPageLayout>
</template>

<script setup lang="ts">
import { groupPublicBoardByAthlete } from '~/composables/usePublicFetch'
import type { Athlete } from '~/types/models'
import { athleteProfilePath } from '~/utils/slug'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'
import {
  approvedCompetitionStarts,
  boardRowToCompetitionResult,
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
  description: 'Najlepsze wyniki zawodników CKS Slavia w podziale na kategorie wagowe i płeć.',
  robots: 'index, follow'
})

const period = ref<'all' | 'year'>('all')
const currentYear = new Date().getFullYear()

const { data: athletesRaw } = await usePublicLazyFetch<Athlete[]>('athletes', {
  key: 'hall-of-fame-athletes',
  default: () => [] as Athlete[]
})

const { data: publicBoardRaw } = await usePublicLazyFetch<PublicBoardRow[]>('results/public-board', {
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
}

function fmtPlDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = iso.slice(0, 10)
  if (d.length < 10) return iso
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

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
  resultDate: string | null
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
    resultDate
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

const recordBoard = computed(() => {
  const athletes = (athletesRaw.value ?? []).filter(a => a.is_active !== false)
  const athleteMap = new Map(athletes.map(a => [a.id, a]))
  const buckets = new Map<string, RecordRow>()
  const yearPrefix = String(currentYear)

  const boardGrouped = groupPublicBoardByAthlete<PublicBoardRow>(publicBoardRaw.value ?? [])

  for (const [athleteId, rows] of Object.entries(boardGrouped)) {
    const a = athleteMap.get(athleteId)
    if (!a) continue

    const compStarts = approvedCompetitionStarts(rows.map(boardRowToCompetitionResult))
    const candidates = period.value === 'year'
      ? compStarts.filter(r => r.date.startsWith(yearPrefix))
      : compStarts

    const best = pickBestCompetitionStart(candidates)
    if (!best || best.total <= 0) continue

    upsertBucket(
      buckets,
      bucketKey(a),
      athleteToRecordRow(a, best.snatch, best.clean_and_jerk, best.total, best.date.slice(0, 10))
    )
  }

  if (buckets.size === 0) {
    for (const a of athletes) {
      const total = a.total_kg ?? 0
      if (total <= 0) continue
      upsertBucket(
        buckets,
        bucketKey(a),
        athleteToRecordRow(
          a,
          a.best_snatch_kg ?? 0,
          a.best_clean_jerk_kg ?? 0,
          total,
          null
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

const maleRecords = computed(() => recordBoard.value.filter(r => r.gender === 'male'))
const femaleRecords = computed(() => recordBoard.value.filter(r => r.gender === 'female'))

function genderLabel(g: string) {
  if (g === 'male') return 'Mężczyźni'
  if (g === 'female') return 'Kobiety'
  return 'Inne'
}

function genderSectionIcon(g: string) {
  if (g === 'male') return 'i-lucide-user'
  if (g === 'female') return 'i-lucide-user-round'
  return 'i-lucide-users'
}
</script>

<template>
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="Klub"
      icon="i-lucide-trophy"
      title="Hall of Fame — rekordy klubu"
      description="Najlepsze totale w kategoriach wagowych na podstawie zatwierdzonych wyników zawodów. Zdjęcia i statystyki z profili kadry."
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

    <template v-for="section in [
      { gender: 'male', rows: maleRecords },
      { gender: 'female', rows: femaleRecords }
    ]" :key="section.gender">
      <section
        v-if="section.rows.length"
        class="slavia-public-section mb-10 last:mb-0"
      >
        <div class="mb-5 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <UIcon :name="genderSectionIcon(section.gender)" class="size-5" />
          </div>
          <div>
            <h2 class="text-lg font-black tracking-tight text-highlighted sm:text-xl">
              {{ genderLabel(section.gender) }}
            </h2>
            <p class="text-xs text-muted">
              {{ section.rows.length }} {{ section.rows.length === 1 ? 'kategoria' : 'kategorii' }}
              <span v-if="period === 'year'"> · wyniki z {{ currentYear }}</span>
            </p>
          </div>
        </div>

        <div class="slavia-content-well grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <UCard
            v-for="row in section.rows"
            :key="`${row.gender}-${row.weightCategory}`"
            class="group overflow-hidden rounded-2xl border-default/70 shadow-sm ring-1 ring-default/40 transition hover:-translate-y-0.5 hover:ring-primary/30"
            :ui="{ body: 'p-0' }"
          >
            <NuxtLink
              :to="athleteProfilePath(row.name, row.athleteId)"
              class="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div class="relative aspect-5/3 overflow-hidden bg-muted/20">
                <img
                  :src="row.photo || '/athlete-placeholder.svg'"
                  :alt="row.name"
                  width="480"
                  height="288"
                  loading="lazy"
                  decoding="async"
                  class="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
                >
                <div class="absolute inset-0 bg-linear-to-t from-background/95 via-background/20 to-transparent" />
                <div class="absolute bottom-0 left-0 right-0 p-4">
                  <UBadge
                    color="primary"
                    variant="solid"
                    size="sm"
                    class="mb-2 font-bold"
                  >
                    Kat. {{ row.weightCategoryText }} kg
                  </UBadge>
                  <h3 class="text-lg font-black leading-tight text-highlighted sm:text-xl">
                    {{ row.name }}
                  </h3>
                  <p
                    v-if="row.birthYear || row.bodyweight"
                    class="mt-1 text-xs text-muted"
                  >
                    <span v-if="row.birthYear">Rocznik {{ row.birthYear }}</span>
                    <span v-if="row.birthYear && row.bodyweight"> · </span>
                    <span v-if="row.bodyweight">{{ row.bodyweight }} kg wagi ciała</span>
                  </p>
                </div>
              </div>
            </NuxtLink>

            <div class="border-t border-default/40 p-4">
              <p
                v-if="row.tagline"
                class="mb-3 line-clamp-2 text-sm leading-relaxed text-muted"
              >
                {{ row.tagline }}
              </p>

              <dl class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div class="rounded-xl bg-primary/10 px-2 py-2.5 text-center">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-primary">
                    Total
                  </dt>
                  <dd class="font-mono text-lg font-black tabular-nums text-highlighted">
                    {{ row.total }}
                  </dd>
                  <span class="text-[10px] text-muted">kg</span>
                </div>
                <div class="rounded-xl bg-muted/15 px-2 py-2.5 text-center">
                  <dt class="text-[10px] font-medium uppercase tracking-wide text-muted">
                    Rwanie
                  </dt>
                  <dd class="font-mono text-base font-bold tabular-nums text-highlighted">
                    {{ row.snatch }}
                  </dd>
                  <span class="text-[10px] text-muted">kg</span>
                </div>
                <div class="rounded-xl bg-muted/15 px-2 py-2.5 text-center">
                  <dt class="text-[10px] font-medium uppercase tracking-wide text-muted">
                    Podrzut
                  </dt>
                  <dd class="font-mono text-base font-bold tabular-nums text-highlighted">
                    {{ row.cleanJerk }}
                  </dd>
                  <span class="text-[10px] text-muted">kg</span>
                </div>
                <div class="rounded-xl bg-warning/10 px-2 py-2.5 text-center">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-warning">
                    Sinclair
                  </dt>
                  <dd class="font-mono text-base font-bold tabular-nums text-highlighted">
                    {{ row.sinclair || '—' }}
                  </dd>
                  <span class="text-[10px] text-muted">pkt</span>
                </div>
              </dl>

              <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span
                  v-if="row.resultDate"
                  class="inline-flex items-center gap-1.5"
                >
                  <UIcon name="i-lucide-calendar" class="size-3.5 shrink-0" />
                  Rekord: {{ fmtPlDate(row.resultDate) }}
                </span>
                <span v-else class="italic">
                  PB z profilu
                </span>
                <UButton
                  size="xs"
                  variant="link"
                  color="primary"
                  :to="athleteProfilePath(row.name, row.athleteId)"
                  trailing-icon="i-lucide-arrow-right"
                  class="px-0"
                >
                  Profil
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </template>

    <PublicEmptyState
      v-if="!recordBoard.length"
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

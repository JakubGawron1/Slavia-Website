<script setup lang="ts">
import { athleteProfilePath } from '~/utils/slug'

type ChallengeMetric = 'sessions' | 'tonnage'

type LeaderboardRow = {
  athlete_id: string
  full_name: string
  session_count?: number | null
  tonnage_kg?: number | null
}

type ApiResponse = {
  month: string
  metric: string
  leaderboard: LeaderboardRow[]
}

const activeMetric = ref<ChallengeMetric>('sessions')
const monthInput = ref('')
/** `null` = bieżący miesiąc po stronie API. */
const activeMonth = ref<string | null>(null)

const monthQuery = computed(() => {
  const q: Record<string, string> = { metric: activeMetric.value }
  if (activeMonth.value) q.month = activeMonth.value
  return q
})

const { data, pending, error, refresh } = usePublicLazyFetch<ApiResponse>(
  'challenges/monthly-training-sessions',
  {
    key: 'klub-wyzwania',
    query: monthQuery,
    default: () => ({ month: '', metric: '', leaderboard: [] })
  }
)

const metricOptions = [
  { label: 'Liczba wpisów', value: 'sessions' as const, icon: 'i-lucide-list' },
  { label: 'Tonaż (kg)', value: 'tonnage' as const, icon: 'i-lucide-dumbbell' }
]

const isTonnage = computed(() => activeMetric.value === 'tonnage')

const pageDescription = computed(() =>
  isTonnage.value
    ? 'Ranking objętości treningowej — suma kg × powtórzenia z wpisów dziennika (serie z planu lub format 5x3@100kg).'
    : 'Ranking oparty na liczbie wpisów w dzienniku treningów w wybranym miesiącu — im więcej jednostek, tym wyżej na liście.'
)

useSeoMeta({
  title: 'Wyzwania klubu — Slavia',
  description: 'Ranking aktywności i tonażu w dzienniku treningów — CKS Slavia Ruda Śląska.',
  ogTitle: 'Wyzwania klubu — CKS Slavia',
  robots: 'index, follow'
})

function applyMonthFilter() {
  const m = monthInput.value.trim()
  if (!m) {
    activeMonth.value = null
    return
  }
  if (!/^\d{4}-\d{2}$/.test(m)) {
    return
  }
  activeMonth.value = m
}

const rows = computed(() => data.value?.leaderboard ?? [])

const topThree = computed(() => rows.value.slice(0, 3))

function athleteHref(row: LeaderboardRow) {
  return athleteProfilePath(row.full_name, row.athlete_id)
}

function rowScore(row: LeaderboardRow) {
  if (isTonnage.value) {
    return row.tonnage_kg ?? 0
  }
  return row.session_count ?? 0
}

function formatScore(row: LeaderboardRow) {
  const score = rowScore(row)
  if (isTonnage.value) {
    return `${score.toLocaleString('pl-PL')} kg`
  }
  return `${score} wpisów`
}

function podiumAccent(idx: number) {
  if (idx === 0) return 'border-amber-500/40 ring-amber-500/25 bg-amber-500/8'
  if (idx === 1) return 'border-slate-400/35 ring-slate-400/20 bg-slate-400/8'
  return 'border-amber-700/35 ring-amber-700/20 bg-amber-700/8'
}
</script>

<template>
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="Klub · community"
      icon="i-lucide-flame"
      title="Wyzwanie miesiąca"
      :description="pageDescription"
    />

    <div class="slavia-content-well slavia-public-section mx-auto w-full max-w-4xl space-y-8">
      <UCard class="slavia-page-card slavia-public-card slavia-public-card--flat space-y-4">
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in metricOptions"
            :key="opt.value"
            :variant="activeMetric === opt.value ? 'solid' : 'outline'"
            :color="activeMetric === opt.value ? 'primary' : 'neutral'"
            :icon="opt.icon"
            @click="activeMetric = opt.value"
          >
            {{ opt.label }}
          </UButton>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <UFormField label="Miesiąc (YYYY-MM)" class="min-w-0 flex-1 sm:max-w-xs">
            <div class="flex gap-2">
              <UInput
                v-model="monthInput"
                placeholder="puste = bieżący"
                size="lg"
                class="font-mono"
              />
              <UButton size="lg" variant="soft" color="primary" @click="applyMonthFilter">
                Pokaż
              </UButton>
            </div>
          </UFormField>
          <UButton icon="i-lucide-refresh-ccw" variant="ghost" color="neutral" @click="() => refresh()">
            Odśwież
          </UButton>
        </div>
        <p v-if="data?.month" class="text-sm text-muted">
          Ranking za <span class="font-semibold text-highlighted">{{ data.month }}</span>
          <span v-if="isTonnage"> — tonaż z notatek dziennika</span>.
        </p>
      </UCard>

      <div v-if="pending && rows.length === 0" class="flex flex-col items-center gap-3 py-16 text-muted">
        <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-primary" />
        <p>Wczytywanie rankingu…</p>
      </div>

      <PublicApiErrorBanner
        v-else-if="error"
        :error="error"
        @retry="refresh()"
      />

      <PublicEmptyState
        v-else-if="rows.length === 0"
        icon="i-lucide-flame"
        :title="isTonnage ? 'Brak danych tonażowych' : 'Brak wpisów w tym miesiącu'"
        :description="isTonnage
          ? 'Dodaj ćwiczenia z planu (serie × powt. × kg) lub wpisz np. 5x3@100kg w dzienniku.'
          : 'Ranking wypełni się, gdy zawodnicy zapiszą jednostki w dzienniku treningowym.'"
      />

      <template v-else>
        <div
          v-if="topThree.length"
          class="grid gap-4 sm:grid-cols-3 sm:items-end"
        >
          <div
            v-for="(row, idx) in topThree"
            :key="row.athlete_id"
            class="rounded-2xl border p-5 text-center shadow-sm ring-1 transition hover:-translate-y-0.5"
            :class="podiumAccent(idx)"
          >
            <p class="font-mono text-2xl font-black text-primary">
              #{{ idx + 1 }}
            </p>
            <NuxtLink
              :to="athleteHref(row)"
              class="mt-2 block text-base font-bold text-highlighted hover:text-primary hover:underline"
            >
              {{ row.full_name }}
            </NuxtLink>
            <p class="mt-2 font-mono text-sm tabular-nums text-muted">
              {{ formatScore(row) }}
            </p>
          </div>
        </div>

        <div class="slavia-page-card hidden overflow-hidden md:block">
          <div class="slavia-data-table overflow-x-auto p-2 sm:p-4">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Zawodnik</th>
                  <th class="text-right">
                    {{ isTonnage ? 'Tonaż' : 'Jednostki (wpisy)' }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in rows"
                  :key="row.athlete_id"
                >
                  <td class="font-mono font-bold text-primary">
                    {{ idx + 1 }}
                  </td>
                  <td class="font-semibold text-highlighted">
                    <NuxtLink
                      :to="athleteHref(row)"
                      class="hover:text-primary hover:underline"
                    >
                      {{ row.full_name }}
                    </NuxtLink>
                  </td>
                  <td class="text-right font-mono tabular-nums">
                    {{ formatScore(row) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid gap-3 md:hidden">
          <UCard
            v-for="(row, idx) in rows"
            :key="`m-${row.athlete_id}`"
            class="slavia-page-card"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-mono text-lg font-black text-primary">#{{ idx + 1 }}</span>
              <span class="font-mono text-sm tabular-nums text-muted">{{ formatScore(row) }}</span>
            </div>
            <NuxtLink
              :to="athleteHref(row)"
              class="mt-2 block text-base font-bold text-highlighted hover:text-primary"
            >
              {{ row.full_name }}
            </NuxtLink>
          </UCard>
        </div>
      </template>
    </div>
  </PublicPageLayout>
</template>

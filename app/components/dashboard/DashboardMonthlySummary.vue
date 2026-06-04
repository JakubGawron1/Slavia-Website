<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

export type DashboardSummaryMetric = {
  label: string
  value: string | number
  hint?: string | null
  to?: RouteLocationRaw | string
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

const props = defineProps<{
  metrics: DashboardSummaryMetric[]
}>()

const apiFetch = useApi()

const { data: votingSummary } = await useAsyncData(
  'monthly-voting-summary',
  () => apiFetch<{ athlete_name: string; votes_count: number }[]>('/api/club-votes/summary').catch(() => [])
)

const topVote = computed(() => votingSummary.value?.[0])
const currentMonthName = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(new Date())

function valueClass(tone?: DashboardSummaryMetric['tone']) {
  if (tone === 'primary') return 'text-primary'
  if (tone === 'success') return 'text-success'
  if (tone === 'warning') return 'text-warning'
  if (tone === 'error') return 'text-error'
  if (tone === 'info') return 'text-info'
  return 'text-highlighted'
}
</script>

<template>
  <div class="rounded-2xl border border-default/60 bg-card/90 p-4 shadow-sm ring-1 ring-default/20 sm:p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <h3 class="text-sm font-black tracking-tight text-highlighted sm:text-base">
          Podsumowanie · {{ currentMonthName }}
        </h3>
        <p class="text-xs text-muted">
          Kluczowe wskaźniki — kliknij, by przejść do modułu
        </p>
      </div>
      <UIcon name="i-lucide-bar-chart-3" class="size-5 shrink-0 text-primary/70" />
    </div>

    <div
      class="grid gap-2"
      :class="metrics.length >= 5
        ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
        : 'grid-cols-2 lg:grid-cols-4'"
    >
      <component
        :is="m.to ? 'NuxtLink' : 'div'"
        v-for="(m, i) in metrics"
        :key="`${m.label}-${i}`"
        :to="m.to || undefined"
        class="rounded-xl border border-default/50 bg-muted/8 px-3 py-2.5 ring-1 ring-default/15 transition-colors"
        :class="m.to ? 'cursor-pointer hover:border-primary/25 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary' : ''"
      >
        <p class="truncate text-[10px] font-bold uppercase tracking-wider text-muted">
          {{ m.label }}
        </p>
        <p class="mt-0.5 text-xl font-black tabular-nums sm:text-2xl" :class="valueClass(m.tone)">
          {{ m.value }}
        </p>
        <p v-if="m.hint" class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted">
          {{ m.hint }}
        </p>
      </component>
    </div>

    <div class="mt-4 rounded-xl border border-default/45 bg-muted/8 px-3 py-2.5 ring-1 ring-default/15">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Zawodnik miesiąca
      </p>
      <div v-if="topVote" class="mt-1.5 flex items-center justify-between gap-2">
        <span class="truncate text-sm font-semibold text-highlighted">{{ topVote.athlete_name }}</span>
        <UBadge color="primary" variant="subtle" size="sm" class="shrink-0">
          {{ topVote.votes_count }} głosów
        </UBadge>
      </div>
      <p v-else class="mt-1 text-sm text-muted">
        Brak głosów w tym miesiącu.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Miesięczne KPI klubu (idea #45) — dane z istniejących endpointów.
 */
withDefaults(
  defineProps<{
    athletesActive?: number
    paymentProgress?: number
    paymentsPending?: number
    avgAttendance30d?: number
    pendingResults?: number
  }>(),
  {
    athletesActive: 0,
    paymentProgress: 0,
    paymentsPending: 0,
    avgAttendance30d: 0,
    pendingResults: 0
  }
)

const apiFetch = useApi()

const { data: votingSummary } = await useAsyncData(
  'monthly-voting-summary',
  () => apiFetch<{ athlete_name: string; votes_count: number }[]>('/api/club-votes/summary').catch(() => [])
)

const topVote = computed(() => votingSummary.value?.[0])
const currentMonthName = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(new Date())
</script>

<template>
  <div class="h-full rounded-2xl border border-default/70 bg-linear-to-br from-card via-card to-primary/5 p-5 shadow-sm ring-1 ring-default/30 sm:p-6">
    <div class="mb-5 flex items-center gap-3">
      <div class="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
        <UIcon name="i-lucide-bar-chart-3" class="size-6" />
      </div>
      <div class="min-w-0">
        <h3 class="text-lg font-bold tracking-tight text-highlighted">
          Podsumowanie: {{ currentMonthName }}
        </h3>
        <p class="text-xs text-muted">
          Frekwencja, składki i aktywność kadry
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-xl border border-default/50 bg-muted/10 p-3 ring-1 ring-default/20">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Aktywni zawodnicy
        </p>
        <p class="mt-1 text-xl font-black tabular-nums text-primary sm:text-2xl">
          {{ athletesActive }}
        </p>
      </div>
      <div class="rounded-xl border border-default/50 bg-muted/10 p-3 ring-1 ring-default/20">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Składki (miesiąc)
        </p>
        <p class="mt-1 text-xl font-black tabular-nums text-success sm:text-2xl">
          {{ paymentProgress }}%
        </p>
        <p class="mt-0.5 text-[10px] text-muted">
          {{ paymentsPending }} oczekuje
        </p>
      </div>
      <div class="rounded-xl border border-default/50 bg-muted/10 p-3 ring-1 ring-default/20">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Obecność (30 dni)
        </p>
        <p class="mt-1 text-xl font-black tabular-nums text-info sm:text-2xl">
          {{ avgAttendance30d }}%
        </p>
      </div>
      <div class="rounded-xl border border-default/50 bg-muted/10 p-3 ring-1 ring-default/20">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Wyniki do akceptacji
        </p>
        <p class="mt-1 text-xl font-black tabular-nums text-warning sm:text-2xl">
          {{ pendingResults }}
        </p>
      </div>
    </div>

    <div class="mt-4 rounded-xl border border-default/45 bg-muted/10 p-3.5 ring-1 ring-default/20">
      <p class="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        Głosowanie na zawodnika miesiąca
      </p>
      <div v-if="topVote" class="flex items-center justify-between gap-2">
        <span class="truncate text-sm font-semibold text-highlighted">{{ topVote.athlete_name }}</span>
        <UBadge color="primary" variant="subtle" class="shrink-0">
          {{ topVote.votes_count }} głosów
        </UBadge>
      </div>
      <p v-else class="text-sm italic text-muted">
        Brak oddanych głosów w tym miesiącu.
      </p>
    </div>
  </div>
</template>

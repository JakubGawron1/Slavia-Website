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
  <div class="rounded-2xl border border-default bg-card p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <UIcon name="i-lucide-bar-chart-3" class="size-6" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-highlighted">
          Podsumowanie: {{ currentMonthName }}
        </h3>
        <p class="text-xs text-muted">
          Frekwencja, składki i aktywność kadry
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-default/40 bg-muted/5 p-3">
        <p class="text-[10px] font-bold uppercase text-muted">
          Aktywni zawodnicy
        </p>
        <p class="text-lg font-black tabular-nums text-primary">
          {{ athletesActive }}
        </p>
      </div>
      <div class="rounded-xl border border-default/40 bg-muted/5 p-3">
        <p class="text-[10px] font-bold uppercase text-muted">
          Składki (miesiąc)
        </p>
        <p class="text-lg font-black tabular-nums text-success">
          {{ paymentProgress }}%
        </p>
        <p class="mt-0.5 text-[10px] text-muted">
          {{ paymentsPending }} oczekuje
        </p>
      </div>
      <div class="rounded-xl border border-default/40 bg-muted/5 p-3">
        <p class="text-[10px] font-bold uppercase text-muted">
          Obecność (30 dni)
        </p>
        <p class="text-lg font-black tabular-nums text-info">
          {{ avgAttendance30d }}%
        </p>
      </div>
      <div class="rounded-xl border border-default/40 bg-muted/5 p-3">
        <p class="text-[10px] font-bold uppercase text-muted">
          Wyniki do akceptacji
        </p>
        <p class="text-lg font-black tabular-nums text-warning">
          {{ pendingResults }}
        </p>
      </div>
    </div>

    <div class="mt-4 rounded-xl bg-muted/10 p-3">
      <p class="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        Głosowanie na zawodnika miesiąca
      </p>
      <div v-if="topVote" class="flex items-center justify-between">
        <span class="text-sm font-semibold">{{ topVote.athlete_name }}</span>
        <UBadge color="primary" variant="subtle">
          {{ topVote.votes_count }} głosów
        </UBadge>
      </div>
      <p v-else class="text-sm italic text-muted">
        Brak oddanych głosów w tym miesiącu.
      </p>
    </div>
  </div>
</template>

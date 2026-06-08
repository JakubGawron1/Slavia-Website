<script setup lang="ts">
import type { AthletePaymentOverviewRow } from '~/types/models'
import { formatPln } from '~/utils/formatCurrency'

const props = defineProps<{
  title: string
  rows: AthletePaymentOverviewRow[]
  tone: 'error' | 'warning' | 'success'
  badgeLabel: string
  standingOrderIds: Set<string>
  search: string
}>()

const emit = defineEmits<{
  'select-athlete': [athleteId: string]
}>()

const filtered = computed(() => {
  const q = props.search.trim().toLowerCase()
  if (!q) return props.rows
  return props.rows.filter(r => r.full_name.toLowerCase().includes(q))
})

const shellClass = computed(() => {
  if (props.tone === 'error') return 'border-error/35 bg-linear-to-b from-error/8 to-card'
  if (props.tone === 'warning') return 'border-warning/35 bg-linear-to-b from-warning/8 to-card'
  return 'border-success/35 bg-linear-to-b from-success/8 to-card'
})

const badgeColor = computed(() => props.tone)
</script>

<template>
  <div class="slavia-page-card flex h-full flex-col overflow-hidden rounded-2xl border p-4 ring-1 ring-default/25 sm:p-5" :class="shellClass">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-black text-highlighted sm:text-base">{{ title }}</h3>
      <UBadge :color="badgeColor" variant="subtle" class="font-bold tabular-nums">
        {{ rows.length }}
      </UBadge>
    </div>
    <div class="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto max-h-72">
      <button
        v-for="r in filtered"
        :key="r.athlete_id"
        type="button"
        class="flex w-full items-center justify-between gap-2 rounded-xl border border-default/50 bg-background/70 px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-muted/20"
        @click="emit('select-athlete', r.athlete_id)"
      >
        <span class="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-highlighted">
          <UIcon
            v-if="standingOrderIds.has(r.athlete_id)"
            name="i-lucide-repeat"
            class="size-3.5 shrink-0 text-success"
            title="Przelew stały"
          />
          {{ r.full_name }}
        </span>
        <UBadge :color="badgeColor" variant="subtle" size="xs" class="shrink-0 font-semibold">
          <template v-if="tone === 'success'">
            {{ formatPln(r.approved_amount_pln) }}
          </template>
          <template v-else>
            {{ badgeLabel }}
          </template>
        </UBadge>
      </button>
      <p v-if="filtered.length === 0" class="py-4 text-center text-sm text-muted">
        {{ search.trim() ? 'Brak wyników dla wyszukiwania.' : 'Brak zawodników w tej kategorii.' }}
      </p>
    </div>
  </div>
</template>

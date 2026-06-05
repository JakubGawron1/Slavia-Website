<script setup lang="ts">
import type { RecoveryLog } from '~/types/models'

import type { RecoveryTrendPoint } from '~/composables/useRecoveryLogs'

const props = defineProps<{
  logs: RecoveryLog[]
  trend?: RecoveryTrendPoint[]
  pending?: boolean
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
}>()

const maxReadiness = computed(() => {
  const pts = props.trend ?? []
  if (!pts.length) return 10
  return Math.max(10, ...pts.map(p => p.readiness_level))
})
</script>

<template>
  <section>
    <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-highlighted">
      <UIcon name="i-lucide-history" class="size-5 text-muted" />
      <slot name="title">
        Historia
      </slot>
    </h2>
    <div v-if="pending || loading" class="flex items-center gap-2 text-sm text-muted">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      Ładowanie…
    </div>
    <div
      v-if="trend?.length"
      class="mb-6 rounded-xl border border-default/60 bg-muted/10 p-4"
    >
      <p class="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
        Trend gotowości (ostatnie {{ trend.length }} dni)
      </p>
      <div class="flex h-16 items-end gap-1">
        <div
          v-for="pt in trend"
          :key="pt.date"
          class="group flex min-w-0 flex-1 flex-col items-center gap-1"
        >
          <div
            class="w-full max-w-8 rounded-t bg-primary/70 transition group-hover:bg-primary"
            :style="{ height: `${(pt.readiness_level / maxReadiness) * 100}%`, minHeight: '4px' }"
            :title="`${pt.date}: gotowość ${pt.readiness_level}/10, sen ${pt.sleep_hours}h`"
          />
          <span class="hidden text-[9px] tabular-nums text-muted sm:block">{{ pt.date.slice(5) }}</span>
        </div>
      </div>
    </div>
    <div v-if="!pending && !loading" class="space-y-3">
      <UCard
        v-for="r in logs"
        :key="r.id"
        class="border-default/60 transition hover:border-primary/25"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <p class="font-bold tabular-nums text-highlighted">
            {{ r.date }}
          </p>
          <UBadge variant="subtle" color="neutral" size="sm">
            sen {{ r.sleep_hours }}h
          </UBadge>
        </div>
        <div class="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">
          <span>Zmęczenie <strong class="text-highlighted">{{ r.fatigue_level }}</strong>/10</span>
          <span>Ból <strong class="text-highlighted">{{ r.soreness_level }}</strong>/10</span>
          <span>Gotowość <strong class="text-highlighted">{{ r.readiness_level }}</strong>/10</span>
        </div>
        <p v-if="r.note" class="mt-3 rounded-lg border border-default/50 bg-muted/10 px-3 py-2 text-sm text-muted">
          {{ r.note }}
        </p>
      </UCard>
      <PublicEmptyState
        v-if="logs.length === 0"
        compact
        :icon="emptyIcon || 'i-lucide-heart-pulse'"
        :title="emptyTitle || 'Brak wpisów regeneracji'"
        :description="emptyDescription || 'Zapisz pierwszy check-in w formularzu powyżej.'"
      />
    </div>
  </section>
</template>

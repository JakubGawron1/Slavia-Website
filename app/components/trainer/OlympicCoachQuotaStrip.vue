<script setup lang="ts">
import type { OlympicCoachQuotaMetric } from '~/composables/useOlympicCoachAi'

defineProps<{
  metrics: OlympicCoachQuotaMetric[]
  columns?: 2 | 4
}>()
</script>

<template>
  <div
    v-if="metrics.length"
    class="olympic-coach__quota-strip"
    :class="columns === 4 ? 'olympic-coach__quota-strip--wide' : undefined"
    aria-label="Limity klubu Trenera AI"
  >
    <div
      v-for="metric in metrics"
      :key="metric.id"
      class="olympic-coach__quota-meter"
    >
      <div class="olympic-coach__quota-meter-head">
        <span class="olympic-coach__quota-meter-label">{{ metric.label }}</span>
        <span class="olympic-coach__quota-meter-value">
          {{ metric.used }}/{{ metric.limit }}
          <span
            v-if="metric.remaining > 0"
            class="olympic-coach__quota-meter-rem"
          >· {{ metric.remaining }} zostało</span>
        </span>
      </div>
      <div
        class="olympic-coach__quota-track"
        role="progressbar"
        :aria-valuenow="metric.percent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${metric.label}: ${metric.used} z ${metric.limit}`"
      >
        <div
          class="olympic-coach__quota-fill"
          :class="`olympic-coach__quota-fill--${metric.tone}`"
          :style="{ width: `${metric.percent}%` }"
        />
      </div>
    </div>
  </div>
</template>

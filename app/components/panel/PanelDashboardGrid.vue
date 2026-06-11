<script setup lang="ts">
/**
 * Responsywna siatka dashboardu — KPI, karty modułów lub auto-fit.
 * @example
 * <PanelDashboardGrid variant="kpi">
 *   <DashboardKpiCard ... />
 * </PanelDashboardGrid>
 */
withDefaults(
  defineProps<{
    /** kpi = 2×2 mobile, 4 kolumny desktop; modules = 1→2→3; duo = 1→2; auto = minmax fit */
    variant?: 'kpi' | 'modules' | 'duo' | 'auto'
    tight?: boolean
    class?: string
  }>(),
  {
    variant: 'kpi',
    tight: false,
    class: ''
  }
)
</script>

<template>
  <div
    class="slavia-panel-dashboard-grid"
    :class="[
      variant === 'kpi' ? 'slavia-panel-dashboard-grid--kpi' : '',
      variant === 'modules' ? 'slavia-panel-dashboard-grid--modules' : '',
      variant === 'duo' ? 'slavia-panel-dashboard-grid--duo' : '',
      variant === 'auto' ? 'slavia-panel-dashboard-grid--auto' : '',
      tight ? 'slavia-panel-dashboard-grid--tight' : '',
      $props.class
    ]"
  >
    <slot />
  </div>
</template>

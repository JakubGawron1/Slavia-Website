<script setup lang="ts">
import type { DashboardModuleLink } from '~/utils/dashboardLink'

/** @deprecated Użyj PanelModuleNav z tablicą grup — ten wrapper zostaje dla pojedynczych sekcji. */
defineProps<{
  title: string
  description?: string
  items: DashboardModuleLink[]
  toneFromBg?: (bg?: string) => 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
}>()
</script>

<template>
  <PanelModuleNav
    :groups="[{ title, items }]"
    :tone-from-bg="toneFromBg"
  />
</template>

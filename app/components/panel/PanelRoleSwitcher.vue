<!-- @deprecated Użyj PanelDashboardNav (automatycznie w PanelPageLayout). -->
<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  dashboards: Array<{ label: string, to: string, icon: string }>
}>()
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>

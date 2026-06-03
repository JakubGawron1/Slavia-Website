<script setup lang="ts">
const { otherDashboards } = useRoleDashboardNav()
</script>

<template>
  <PanelRoleSwitcher
    v-if="otherDashboards.length"
    class="mb-8"
    :dashboards="otherDashboards"
  />
</template>

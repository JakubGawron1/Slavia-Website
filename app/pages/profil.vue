<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { accountSettingsPath } = useRoleDashboardNav()

await navigateTo(accountSettingsPath.value, { replace: true })
</script>

<template>
  <div />
</template>

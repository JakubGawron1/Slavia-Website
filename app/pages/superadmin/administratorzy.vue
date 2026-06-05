<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

await navigateTo({ path: '/superadmin/zawodnicy', query: { tab: 'accounts' } }, { replace: true })
</script>

<template>
  <div />
</template>

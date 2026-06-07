<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

await navigateTo({ path: '/klub/obecnosc', query: { view: 'scan' } }, { replace: true })
</script>

<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

await navigateTo({ path: '/attendance', query: { view: 'scan' } }, { replace: true })
</script>

<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

await navigateTo({ path: '/trainer/cwiczenia', query: { tab: 'slownik' } }, { redirectCode: 301 })
</script>

<template>
  <div />
</template>

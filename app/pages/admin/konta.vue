<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

await navigateTo({ path: '/admin/zawodnicy', query: { tab: 'accounts' } }, { replace: true })
</script>

<template>
  <div />
</template>

<script setup lang="ts">
/**
 * Karta modułu panelu — alias nad `DashboardModuleCard` (tokeny premium w SCSS).
 */
type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

defineProps<{
  title: string
  description: string
  icon: string
  to: string
  tone?: Tone
  iconWrapperClass?: string | null
  disabled?: boolean
}>()
</script>

<template>
  <DashboardModuleCard
    :title="title"
    :description="description"
    :icon="icon"
    :to="to"
    :tone="tone"
    :icon-wrapper-class="iconWrapperClass"
    :disabled="disabled"
  />
</template>

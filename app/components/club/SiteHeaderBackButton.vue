<script setup lang="ts">
const { visible, target, goBack } = useSlaviaNavBack()
</script>

<template>
  <UButton
    v-if="visible && target && target.mode === 'link' && target.to"
    :to="target.to"
    icon="i-lucide-arrow-left"
    color="neutral"
    variant="ghost"
    size="lg"
    square
    class="shrink-0 rounded-xl text-highlighted touch-manipulation"
    :aria-label="target.label"
  />
  <UButton
    v-else-if="visible && target"
    icon="i-lucide-arrow-left"
    color="neutral"
    variant="ghost"
    size="lg"
    square
    class="shrink-0 rounded-xl text-highlighted touch-manipulation"
    :aria-label="target.label"
    @click="goBack"
  />
</template>

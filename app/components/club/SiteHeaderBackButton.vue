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
    size="md"
    square
    class="size-9 shrink-0 rounded-lg text-highlighted touch-manipulation sm:size-10"
    :aria-label="target.label"
  />
  <UButton
    v-else-if="visible && target"
    icon="i-lucide-arrow-left"
    color="neutral"
    variant="ghost"
    size="md"
    square
    class="size-9 shrink-0 rounded-lg text-highlighted touch-manipulation sm:size-10"
    :aria-label="target.label"
    @click="goBack"
  />
</template>

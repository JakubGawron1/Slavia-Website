<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Szerokość „tekstu” (np. '8rem', '40%', '120px'). */
    width?: string
    /** Wysokość (np. '1em', '14px'). */
    height?: string
    /** Jeśli true, element jest blokowy (np. pełna szerokość wiersza). */
    block?: boolean
  }>(),
  {
    width: '8rem',
    height: '1em',
    block: false
  }
)
</script>

<template>
  <span
    class="slavia-shimmer"
    :class="block ? 'slavia-shimmer--block' : ''"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>


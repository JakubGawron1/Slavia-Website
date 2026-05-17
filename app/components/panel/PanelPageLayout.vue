<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Wewnętrzny panel kadry — max-width 80rem */
    panel?: boolean
    /** Wąski układ (formularze, analiza) */
    narrow?: boolean
    padding?: 'default' | 'compact' | 'flush'
    animate?: boolean
  }>(),
  {
    panel: true,
    narrow: false,
    padding: 'default',
    animate: true
  }
)

const containerClass = computed(() => {
  const c: string[] = []
  if (props.panel) c.push('slavia-panel-page')
  if (props.narrow) c.push('mx-auto max-w-5xl')
  if (props.padding === 'default') c.push('py-8 md:py-12 lg:py-14')
  else if (props.padding === 'compact') c.push('py-6 sm:py-8 md:py-10')
  if (props.animate) c.push('animate-page-in')
  return c
})
</script>

<template>
  <UContainer :class="containerClass">
    <slot />
  </UContainer>
</template>

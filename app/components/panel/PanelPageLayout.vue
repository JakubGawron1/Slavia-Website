<script setup lang="ts">
const { isGlassLayout, isSportTechLayout } = useSlaviaAppearance()

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
  const c: string[] = ['mx-auto', 'w-full', 'min-w-0']
  if (props.panel) c.push('slavia-panel-page')
  if (props.narrow) c.push('max-w-5xl')
  if (props.padding === 'default') c.push('py-8 md:py-12 lg:py-14')
  else if (props.padding === 'compact') c.push('py-6 sm:py-8 md:py-10')
  if (props.animate) c.push('animate-page-in')
  if (isGlassLayout.value) c.push('slavia-glass-layout')
  if (isSportTechLayout.value) c.push('slavia-sport-tech-layout')
  return c
})
</script>

<template>
  <UContainer :class="containerClass">
    <slot />
  </UContainer>
</template>

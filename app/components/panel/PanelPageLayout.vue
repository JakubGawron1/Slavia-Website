<script setup lang="ts">
const { presetLayoutClass } = useSlaviaAppearance()

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
  const c: string[] = ['slavia-below-site-header', 'mx-auto', 'w-full', 'min-w-0']
  if (props.panel) c.push('slavia-panel-page')
  if (props.narrow) c.push('max-w-5xl')
  if (props.padding === 'default') c.push('pt-10 pb-8 md:pt-14 md:pb-12 lg:pt-16 lg:pb-14')
  else if (props.padding === 'compact') c.push('pt-8 pb-6 sm:pt-10 sm:pb-8 md:pt-12 md:pb-10')
  if (props.animate) c.push('animate-page-in')
  const layoutClass = presetLayoutClass.value
  if (layoutClass) c.push(layoutClass)
  return c
})
</script>

<template>
  <UContainer :class="containerClass">
    <slot />
  </UContainer>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    padding?: 'default' | 'compact' | 'hero'
    animate?: boolean
    narrow?: boolean
  }>(),
  {
    padding: 'default',
    animate: true,
    narrow: false
  }
)

const containerClass = computed(() => {
  const c: string[] = ['slavia-public-page']
  if (props.narrow) c.push('max-w-3xl')
  if (props.padding === 'default') c.push('py-8 sm:py-12 lg:py-14')
  else if (props.padding === 'compact') c.push('py-6 sm:py-10')
  else if (props.padding === 'hero') c.push('py-10 md:py-16 lg:py-20')
  if (props.animate) c.push('animate-page-in')
  return c
})
</script>

<template>
  <UContainer :class="containerClass">
    <slot />
  </UContainer>
</template>

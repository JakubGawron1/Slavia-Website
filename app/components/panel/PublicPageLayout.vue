<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    padding?: 'default' | 'compact' | 'hero'
    animate?: boolean
    narrow?: boolean
    /** Delikatne tło / poświata jak na kalkulatorach i w galerii */
    ambient?: boolean
  }>(),
  {
    padding: 'default',
    animate: true,
    narrow: false,
    ambient: true
  }
)

const containerClass = computed(() => {
  const c: string[] = ['slavia-public-page', 'relative']
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
    <div
      v-if="ambient"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(28rem,55vh)] overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute -left-24 top-0 size-72 rounded-full bg-primary/12 blur-3xl sm:size-96"
      />
      <div
        class="absolute -right-16 top-8 size-64 rounded-full bg-primary/8 blur-3xl sm:size-80"
      />
      <div
        class="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent"
      />
    </div>
    <slot />
  </UContainer>
</template>

<script setup lang="ts">
/** Public pages: center empty states and hero blocks; keep tables, forms, and prose start-aligned in children. */
const { presetLayoutClass } = useSlaviaAppearance()

const props = withDefaults(
  defineProps<{
    padding?: 'default' | 'compact' | 'hero' | 'flush'
    animate?: boolean
    narrow?: boolean
    /** Węższa, wyśrodkowana studnia treści (kalkulatory) */
    centered?: boolean
    /** Delikatne tło / poświata jak na kalkulatorach i w galerii */
    ambient?: boolean
  }>(),
  {
    padding: 'default',
    animate: true,
    narrow: false,
    centered: false,
    ambient: true
  }
)

const containerClass = computed(() => {
  const c: string[] = [
    'slavia-public-page',
    'slavia-below-site-header',
    'relative',
    'mx-auto',
    'w-full',
    'min-w-0',
    'max-w-[min(var(--slavia-content-max),100%)]'
  ]
  if (props.narrow) c.push('max-w-3xl')
  else if (props.centered) c.push('max-w-5xl')
  if (props.padding === 'default') c.push('pt-10 pb-8 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14')
  else if (props.padding === 'compact') c.push('pt-8 pb-6 sm:pt-12 sm:pb-10')
  else if (props.padding === 'hero') c.push('pt-8 pb-6 sm:pt-10 sm:pb-8 lg:pt-12 lg:pb-10')
  else if (props.padding === 'flush') c.push('pt-4 pb-0 sm:pt-6')
  if (props.animate) c.push('animate-page-in')
  const layoutClass = presetLayoutClass.value
  if (layoutClass) c.push(layoutClass)
  return c
})
</script>

<template>
  <UContainer :class="containerClass">
    <div
      v-if="ambient"
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(32rem,60vh)] overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute -left-28 top-0 size-80 rounded-full bg-primary/14 blur-3xl sm:size-[28rem] dark:bg-primary/18"
      />
      <div
        class="absolute -right-20 top-6 size-72 rounded-full bg-primary/10 blur-3xl sm:size-96 dark:bg-primary/12"
      />
      <div
        class="absolute left-1/2 top-12 size-56 -translate-x-1/2 rounded-full bg-primary/6 blur-3xl dark:bg-primary/8"
      />
      <div
        class="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent sm:inset-x-12"
      />
      <div
        class="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background/80 to-transparent dark:from-background/90"
      />
    </div>
    <div class="slavia-page-flow">
      <slot />
    </div>
    <SlaviaScrollToTop />
  </UContainer>
</template>

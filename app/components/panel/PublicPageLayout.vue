<script setup lang="ts">
/** Public pages: center empty states and hero blocks; keep tables, forms, and prose start-aligned in children. */
import {
  isGlassThemePreset,
  isNeonBrutalismThemePreset,
  isSportTechThemePreset
} from '~/composables/useSlaviaAppearance'

const { preset } = useSlaviaAppearance()

const props = withDefaults(
  defineProps<{
    padding?: 'default' | 'compact' | 'hero' | 'flush'
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
  const c: string[] = ['slavia-public-page', 'relative', 'mx-auto', 'w-full', 'min-w-0']
  if (props.narrow) c.push('max-w-3xl')
  if (props.padding === 'default') c.push('py-8 sm:py-12 lg:py-14')
  else if (props.padding === 'compact') c.push('py-6 sm:py-10')
  else if (props.padding === 'hero') c.push('py-10 md:py-16 lg:py-20')
  else if (props.padding === 'flush') c.push('py-0')
  if (props.animate) c.push('animate-page-in')
  if (isGlassThemePreset(preset.value)) c.push('slavia-glass-layout')
  if (isSportTechThemePreset(preset.value)) c.push('slavia-sport-tech-layout')
  if (isNeonBrutalismThemePreset(preset.value)) c.push('slavia-neon-brutalism-layout')
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
    <slot />
  </UContainer>
</template>

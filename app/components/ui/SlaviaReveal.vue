<script setup lang="ts">
import {
  observeSlaviaReveal,
  type SlaviaRevealVariant
} from '~/composables/useSlaviaScrollReveal'

const props = withDefaults(
  defineProps<{
    variant?: SlaviaRevealVariant
    delay?: number
  }>(),
  {
    variant: 'fade-up',
    delay: undefined
  }
)

const root = ref<HTMLElement | null>(null)
let stop: (() => void) | undefined

onMounted(() => {
  if (!root.value) return
  stop = observeSlaviaReveal(root.value, {
    variant: props.variant,
    delay: props.delay
  })
})

onUnmounted(() => {
  stop?.()
})
</script>

<template>
  <div ref="root">
    <slot />
  </div>
</template>

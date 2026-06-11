<script setup lang="ts">
/**
 * Szkielet ładowania — dopasuj `variant` i wymiary do docelowego layoutu (mniej CLS).
 */
const props = withDefaults(
  defineProps<{
    variant?: 'text' | 'title' | 'circle' | 'rect' | 'card'
    width?: string
    height?: string
    /** Liczba linii tekstu (tylko variant=text) */
    lines?: number
    wrapperClass?: string
  }>(),
  {
    variant: 'text',
    width: undefined,
    height: undefined,
    lines: 1,
    wrapperClass: ''
  }
)

const blockClass = computed(() => {
  const base = ['slavia-skeleton-block']
  if (props.variant === 'text') base.push('slavia-skeleton-block--text')
  else if (props.variant === 'title') base.push('slavia-skeleton-block--title')
  else if (props.variant === 'circle') base.push('slavia-skeleton-block--circle')
  else if (props.variant === 'card') base.push('slavia-skeleton-block--card')
  return base
})

const style = computed(() => {
  const s: Record<string, string> = {}
  if (props.width) s.width = props.width
  if (props.height) s.height = props.height
  if (props.variant === 'circle' && props.width) {
    s.height = props.width
  }
  return s
})
</script>

<template>
  <div
    v-if="variant === 'text' && lines > 1"
    class="slavia-skeleton-stack"
    :class="wrapperClass"
    aria-hidden="true"
  >
    <span
      v-for="i in lines"
      :key="i"
      class="slavia-skeleton-block slavia-skeleton-block--text"
      :style="i === lines ? { width: width || '72%' } : style"
    />
  </div>
  <span
    v-else
    :class="[...blockClass, wrapperClass]"
    :style="style"
    aria-hidden="true"
  />
</template>

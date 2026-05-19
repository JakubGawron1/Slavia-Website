<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    description?: string
    icon?: string
    backTo?: string
    backLabel?: string
    variant?: 'default' | 'hero' | 'centered'
    /** Nieco mniejszy hero (np. /zawodnicy). */
    compact?: boolean
  }>(),
  {
    eyebrow: undefined,
    title: undefined,
    description: undefined,
    icon: undefined,
    backTo: undefined,
    variant: 'default',
    backLabel: 'Wróć',
    compact: false
  }
)

const pageBackConfig = computed(() =>
  props.backTo
    ? { to: props.backTo, label: props.backLabel }
    : undefined
)

useSlaviaPageBack(pageBackConfig)

const rootClass = computed(() => {
  if (props.variant === 'hero') {
    return props.compact
      ? 'slavia-public-hero slavia-public-hero--compact'
      : 'slavia-public-hero'
  }
  if (props.variant === 'centered') {
    return props.compact
      ? 'mb-6 px-1 text-center sm:mb-7 md:mb-8'
      : 'mb-10 px-1 text-center md:mb-14'
  }
  return 'mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between'
})

const titleClass = computed(() => {
  const display = 'slavia-display'
  if (props.variant === 'centered') {
    if (props.compact) {
      return `${display} mt-2 text-2xl font-black uppercase italic tracking-tighter text-highlighted sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl`
    }
    return `${display} mt-4 text-4xl font-black uppercase italic tracking-tighter text-highlighted sm:mt-6 sm:text-6xl md:text-7xl lg:text-8xl`
  }
  if (props.variant === 'hero') {
    if (props.compact) {
      return `${display} mt-1 text-lg font-bold tracking-tight text-highlighted sm:text-xl lg:text-[1.45rem]`
    }
    return `${display} mt-1 text-xl font-bold tracking-tight text-highlighted sm:mt-1.5 sm:text-2xl lg:text-[1.65rem]`
  }
  return `${display} mt-1 text-2xl font-black tracking-tight text-highlighted sm:text-3xl lg:text-4xl`
})

const eyebrowClass = computed(() => {
  const base = 'text-[11px] font-black uppercase tracking-[0.2em] text-primary'
  if (props.variant === 'centered') {
    const gap = props.compact ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-3'
    const size = props.compact ? 'sm:text-xs sm:tracking-[0.24em]' : 'sm:text-sm sm:tracking-[0.28em]'
    return `${base} inline-flex items-center justify-center ${gap} ${size}`
  }
  if (props.variant === 'hero') {
    return `${base} slavia-public-hero__eyebrow`
  }
  return base
})

const descriptionClass = computed(() => {
  if (props.variant === 'centered') {
    if (props.compact) {
      return 'mx-auto mt-2 max-w-2xl px-2 text-xs font-medium leading-relaxed text-muted/85 sm:mt-3 sm:text-sm'
    }
    return 'mx-auto mt-4 max-w-2xl px-2 text-base font-medium leading-relaxed text-muted/85 sm:mt-6 sm:text-xl'
  }
  if (props.variant === 'hero') {
    return 'mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-[0.9375rem]'
  }
  return 'mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base'
})

const iconWrapClass = computed(() => {
  const base =
    'flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 dark:bg-primary/14'
  if (props.variant === 'hero') {
    return `${base} ${props.compact ? 'size-9' : 'size-10'} self-start shadow-sm`
  }
  return `${base} size-11 self-start`
})
</script>

<template>
  <header
    v-slavia-reveal="'fade-up'"
    :class="rootClass"
  >
    <div
      class="relative min-w-0"
      :class="
        variant === 'centered'
          ? ''
          : variant === 'hero'
            ? 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'
            : 'flex flex-col gap-4 md:flex-row md:items-end md:justify-between'
      "
    >
      <div
        class="min-w-0"
        :class="variant === 'centered' ? 'mx-auto' : 'flex-1'"
      >
        <p
          v-if="eyebrow"
          :class="eyebrowClass"
        >
          <UIcon
            v-if="icon && variant === 'centered'"
            :name="icon"
            class="shrink-0"
            :class="compact ? 'size-4 sm:size-5' : 'size-5 sm:size-6'"
          />
          {{ eyebrow }}
        </p>
        <h1 :class="titleClass">
          <slot name="title">
            {{ title }}
          </slot>
        </h1>
        <p
          v-if="description || $slots.description"
          :class="descriptionClass"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </p>
        <div
          v-if="$slots.badges"
          class="mt-2 flex flex-wrap gap-2"
          :class="variant === 'centered' ? 'justify-center' : ''"
        >
          <slot name="badges" />
        </div>
      </div>

      <span
        v-if="icon && variant !== 'centered'"
        :class="iconWrapClass"
      >
        <UIcon :name="icon" class="size-4" />
      </span>
    </div>

    <div
      v-if="$slots.actions"
      class="relative z-1 flex w-full min-w-0 flex-wrap items-center gap-2"
      :class="[
        variant === 'hero' ? 'slavia-public-hero__actions' : 'mt-4 border-t border-default/40 pt-4',
        variant === 'centered'
          ? 'justify-center'
          : variant === 'hero'
            ? 'justify-center md:justify-end'
            : 'justify-center sm:justify-end'
      ]"
    >
      <slot name="actions" />
    </div>
  </header>
</template>

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
  }>(),
  {
    eyebrow: undefined,
    title: undefined,
    description: undefined,
    icon: undefined,
    backTo: undefined,
    variant: 'default',
    backLabel: 'Wróć'
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
    return 'slavia-glass relative mb-8 overflow-x-clip rounded-3xl border border-default/50 bg-linear-to-br from-primary/12 via-card/95 to-card p-6 shadow-md ring-1 ring-primary/15 sm:mb-10 sm:p-8 lg:p-10'
  }
  if (props.variant === 'centered') {
    return 'mb-10 px-1 text-center md:mb-14'
  }
  return 'mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between'
})

const titleClass = computed(() => {
  const display = 'slavia-display'
  if (props.variant === 'centered') {
    return `${display} mt-4 text-4xl font-black uppercase italic tracking-tighter text-highlighted sm:mt-6 sm:text-6xl md:text-7xl lg:text-8xl`
  }
  if (props.variant === 'hero') {
    return `${display} mt-2 text-3xl font-black tracking-tight text-highlighted sm:text-4xl lg:text-[2.75rem]`
  }
  return `${display} mt-1 text-2xl font-black tracking-tight text-highlighted sm:text-3xl lg:text-4xl`
})

const eyebrowClass = computed(() => {
  const base = 'text-[11px] font-black uppercase tracking-[0.2em] text-primary'
  if (props.variant === 'centered') {
    return `${base} inline-flex items-center justify-center gap-2 sm:gap-3 sm:text-sm sm:tracking-[0.28em]`
  }
  return base
})

const descriptionClass = computed(() => {
  if (props.variant === 'centered') {
    return 'mx-auto mt-4 max-w-2xl px-2 text-base font-medium leading-relaxed text-muted/85 sm:mt-6 sm:text-xl'
  }
  return 'mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base lg:text-lg'
})
</script>

<template>
  <header :class="rootClass">
    <div
      v-if="variant === 'hero'"
      class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/22 blur-3xl dark:bg-primary/28"
      aria-hidden="true"
    />

    <div
      class="relative min-w-0"
      :class="
        variant === 'centered'
          ? ''
          : variant === 'hero'
            ? 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'
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
            class="size-5 shrink-0 sm:size-6"
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
          class="mt-3 flex flex-wrap gap-2"
          :class="variant === 'centered' ? 'justify-center' : ''"
        >
          <slot name="badges" />
        </div>
      </div>

      <span
        v-if="icon && variant !== 'centered'"
        class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/14 text-primary shadow-sm ring-1 ring-primary/25 dark:bg-primary/18"
        :class="variant === 'hero' ? 'self-start' : ''"
      >
        <UIcon :name="icon" class="size-5" />
      </span>
    </div>

    <div
      v-if="$slots.actions"
      class="relative z-[1] mt-4 flex w-full min-w-0 flex-wrap items-center gap-2 border-t border-default/40 pt-4"
      :class="
        variant === 'centered'
          ? 'justify-center'
          : variant === 'hero'
            ? 'justify-center md:justify-end'
            : 'justify-center sm:justify-end'
      "
    >
      <slot name="actions" />
    </div>
  </header>
</template>

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
    variant: 'default',
    backLabel: 'Wróć'
  }
)

const rootClass = computed(() => {
  if (props.variant === 'hero') {
    return 'relative mb-8 overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm ring-1 ring-primary/10 sm:mb-10 sm:p-8'
  }
  if (props.variant === 'centered') {
    return 'mb-10 px-1 text-center md:mb-14'
  }
  return 'mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between'
})

const titleClass = computed(() => {
  if (props.variant === 'centered') {
    return 'mt-4 text-4xl font-black uppercase italic tracking-tighter text-highlighted sm:mt-6 sm:text-6xl md:text-7xl lg:text-8xl'
  }
  if (props.variant === 'hero') {
    return 'mt-2 text-3xl font-black tracking-tight text-highlighted sm:text-4xl'
  }
  return 'mt-1 text-2xl font-black tracking-tight text-highlighted sm:text-3xl lg:text-4xl'
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
      class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/20 blur-3xl"
      aria-hidden="true"
    />

    <NuxtLink
      v-if="backTo"
      :to="backTo"
      class="relative mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4" />
      {{ backLabel }}
    </NuxtLink>

    <div
      class="relative"
      :class="variant === 'centered' ? '' : 'flex flex-col gap-4 md:flex-row md:items-end md:justify-between'"
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
        class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"
      >
        <UIcon :name="icon" class="size-5" />
      </span>

      <div
        v-if="$slots.actions"
        class="flex shrink-0 flex-wrap gap-2"
        :class="variant === 'centered' ? 'mt-6 justify-center' : 'md:ml-auto'"
      >
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

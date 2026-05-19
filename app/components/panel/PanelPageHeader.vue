<script setup lang="ts">
import type { PanelArea } from '~/composables/useSlaviaPanelArea'
import { panelEyebrow } from '~/composables/useSlaviaPanelArea'

const props = withDefaults(
  defineProps<{
    area?: PanelArea
    eyebrow?: string
    title: string
    description?: string
    icon?: string
    tone?: 'default' | 'superadmin' | 'danger'
    variant?: 'page' | 'hero'
  }>(),
  {
    tone: 'default',
    variant: 'page',
    area: undefined,
    eyebrow: undefined,
    description: undefined,
    icon: undefined
  }
)

const resolvedEyebrow = computed(() => {
  if (props.eyebrow) return props.eyebrow
  if (props.area) return panelEyebrow(props.area)
  return undefined
})

const eyebrowClass = computed(() => {
  if (props.tone === 'superadmin' || props.tone === 'danger') return 'text-error'
  return 'text-primary'
})

const rootClass = computed(() =>
  props.variant === 'hero'
    ? 'relative mb-8 overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm ring-1 ring-primary/10 sm:mb-10 sm:p-8'
    : 'mb-6 sm:mb-8'
)
</script>

<template>
  <header :class="rootClass">
    <div
      v-if="variant === 'hero'"
      class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/20 blur-3xl"
    />
    <div class="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 flex-1">
        <p
          v-if="resolvedEyebrow"
          class="text-[11px] font-black uppercase tracking-[0.22em]"
          :class="eyebrowClass"
        >
          {{ resolvedEyebrow }}
        </p>
        <h1
          class="font-black tracking-tight text-highlighted"
          :class="variant === 'hero' ? 'mt-2 text-3xl sm:text-4xl' : 'mt-1.5 text-2xl sm:text-3xl'"
        >
          {{ title }}
        </h1>
        <p
          v-if="description || $slots.description"
          class="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base"
        >
          <slot name="description">
            {{ description }}
          </slot>
        </p>
        <div v-if="$slots.badges" class="mt-3 flex flex-wrap gap-2">
          <slot name="badges" />
        </div>
      </div>

      <span
        v-if="icon"
        class="flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1"
        :class="
          tone === 'superadmin'
            ? 'bg-error/12 text-error ring-error/20'
            : 'bg-primary/12 text-primary ring-primary/20'
        "
      >
        <UIcon :name="icon" class="size-5" />
      </span>

      <div
        v-if="$slots.actions"
        class="flex shrink-0 flex-wrap gap-2 sm:justify-end"
      >
        <slot name="actions" />
      </div>
      </div>
  </header>
</template>

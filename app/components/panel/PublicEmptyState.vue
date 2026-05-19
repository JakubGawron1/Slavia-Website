<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description?: string
    compact?: boolean
  }>(),
  {
    icon: 'i-lucide-inbox',
    description: undefined,
    compact: false
  }
)
</script>

<template>
  <div
    class="slavia-empty-state slavia-public-empty flex w-full flex-col items-center justify-center text-center"
    :class="compact ? 'slavia-public-empty--compact' : 'slavia-public-empty--default'"
  >
    <div
      class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/8 blur-3xl"
      aria-hidden="true"
    />
    <div class="slavia-empty-state__body text-center">
      <div
        class="slavia-empty-state__icon"
        :class="compact ? '!size-14' : 'sm:!size-[4.5rem]'"
      >
        <UIcon :name="icon" :class="compact ? 'size-7' : 'size-8 sm:size-9'" />
      </div>
      <h3 class="slavia-empty-state__title">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="slavia-empty-state__desc"
      >
        {{ description }}
      </p>
      <div
        v-if="$slots.default"
        class="slavia-empty-state__actions flex w-full flex-col flex-wrap items-center justify-center gap-2 sm:flex-row sm:gap-3"
      >
        <slot />
      </div>
      <p
        v-if="$slots.hint"
        class="slavia-empty-state__hint"
      >
        <slot name="hint" />
      </p>
    </div>
  </div>
</template>

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
    class="slavia-public-empty relative overflow-hidden rounded-2xl border border-dashed border-default/70 bg-linear-to-b from-muted/12 via-card to-card text-center shadow-sm ring-1 ring-default/25"
    :class="compact ? 'px-5 py-12 sm:py-14' : 'px-6 py-16 sm:px-10 sm:py-20'"
  >
    <div
      class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/8 blur-3xl"
      aria-hidden="true"
    />
    <div class="relative mx-auto max-w-md">
      <div
        class="mx-auto mb-5 flex items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
        :class="compact ? 'size-14' : 'size-16 sm:size-[4.5rem]'"
      >
        <UIcon :name="icon" :class="compact ? 'size-7' : 'size-8 sm:size-9'" />
      </div>
      <h3
        class="text-lg font-bold tracking-tight text-highlighted sm:text-xl"
      >
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="mt-2 text-sm leading-relaxed text-muted sm:text-base"
      >
        {{ description }}
      </p>
      <div
        v-if="$slots.default"
        class="mt-6 flex flex-col items-center gap-3"
      >
        <slot />
      </div>
      <p
        v-if="$slots.hint"
        class="mt-4 text-xs leading-relaxed text-muted"
      >
        <slot name="hint" />
      </p>
    </div>
  </div>
</template>

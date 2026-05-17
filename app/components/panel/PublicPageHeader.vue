<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
    <div class="min-w-0">
      <p
        v-if="eyebrow"
        class="text-[11px] font-black uppercase tracking-[0.2em] text-primary"
      >
        {{ eyebrow }}
      </p>
      <h1 class="mt-1 text-2xl font-black tracking-tight text-highlighted sm:text-3xl lg:text-4xl">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base lg:text-lg"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex shrink-0 flex-wrap gap-2 md:ml-auto"
    >
      <slot name="actions" />
    </div>
  </header>
</template>

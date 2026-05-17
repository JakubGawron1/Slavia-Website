<script setup lang="ts">
defineProps<{
  title?: string
  id?: string
  description?: string
}>()
</script>

<template>
  <section
    :id="id"
    class="slavia-panel-section"
  >
    <div
      v-if="title || $slots.actions"
      class="mb-4 flex flex-wrap items-end justify-between gap-3"
    >
      <div class="min-w-0">
        <h2
          v-if="title"
          class="slavia-panel-section-title"
        >
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="mt-1 text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="flex flex-wrap gap-2"
      >
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>

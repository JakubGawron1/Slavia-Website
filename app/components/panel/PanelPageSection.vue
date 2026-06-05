<script setup lang="ts">
defineProps<{
  title?: string
  id?: string
  description?: string
  icon?: string
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
      <div class="flex min-w-0 items-start gap-3">
        <span
          v-if="icon"
          class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20"
        >
          <UIcon :name="icon" class="size-5" />
        </span>
        <div class="min-w-0">
          <h2
            v-if="title"
            class="slavia-panel-section-title"
          >
            {{ title }}
          </h2>
          <p
            v-if="description"
            class="mt-1 text-sm leading-relaxed text-muted"
          >
            {{ description }}
          </p>
        </div>
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

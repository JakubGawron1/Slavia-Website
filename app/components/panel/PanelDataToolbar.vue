<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Krótki opis po lewej (np. licznik wyników) */
    summary?: string
    sticky?: boolean
  }>(),
  {
    summary: undefined,
    sticky: false
  }
)
</script>

<template>
  <div
    class="slavia-panel-toolbar mb-4 overflow-hidden rounded-2xl border border-default/60 bg-card/85 shadow-sm ring-1 ring-default/20 backdrop-blur-sm"
    :class="sticky ? 'sticky top-[calc(var(--ui-header-height,4rem)+0.5rem)] z-20' : ''"
  >
    <div class="flex flex-col gap-3 p-3 sm:p-4">
      <div
        v-if="summary || $slots.summary"
        class="text-xs font-medium text-muted"
      >
        <slot name="summary">
          {{ summary }}
        </slot>
      </div>

      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div
          v-if="$slots.filters"
          class="slavia-panel-toolbar__filters flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <slot name="filters" />
        </div>

        <div
          v-if="$slots.meta"
          class="slavia-panel-toolbar__meta flex flex-wrap items-center gap-2"
        >
          <slot name="meta" />
        </div>

        <div
          v-if="$slots.actions"
          class="slavia-panel-toolbar__actions flex shrink-0 flex-wrap items-center gap-2 sm:justify-end"
        >
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>

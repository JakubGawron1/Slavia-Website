<script setup lang="ts">
/**
 * Pusty stan — panele i moduły wewnętrzne (kompaktowy).
 * Strony publiczne: preferuj `PublicEmptyState` (szerszy layout, ambient glow).
 */
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
    compact: true
  }
)
</script>

<template>
  <div
    class="slavia-empty-state slavia-panel-empty w-full"
    :class="compact ? 'slavia-panel-empty--compact' : 'slavia-public-empty--default'"
    role="status"
  >
    <div class="slavia-empty-state__body">
      <div
        class="slavia-empty-state__icon"
        :class="compact ? '!size-12' : ''"
      >
        <UIcon :name="icon" :class="compact ? 'size-6' : 'size-8'" />
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
        class="slavia-empty-state__actions"
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

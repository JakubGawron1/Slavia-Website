<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    compact?: boolean
  }>(),
  {
    label: 'Wczytywanie…',
    compact: false
  }
)
</script>

<template>
  <div
    class="slavia-panel-loading flex flex-col items-center justify-center text-center"
    :class="compact ? 'py-10' : 'py-16'"
    role="status"
    aria-live="polite"
  >
    <div
      class="flex items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20"
      :class="compact ? 'size-12' : 'size-14'"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin text-primary"
        :class="compact ? 'size-6' : 'size-7'"
      />
    </div>
    <p
      v-if="label"
      class="mt-3 text-sm font-medium text-muted"
    >
      {{ label }}
    </p>
  </div>
</template>

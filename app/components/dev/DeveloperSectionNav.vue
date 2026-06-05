<script setup lang="ts">
export type DevSection = 'overview' | 'tools' | 'ops' | 'map'

defineProps<{
  modelValue: DevSection
  items: { id: DevSection, label: string, icon: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DevSection]
}>()
</script>

<template>
  <nav
    class="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-default/60 bg-muted/10 p-1"
    aria-label="Sekcje developera"
  >
    <UButton
      v-for="item in items"
      :key="item.id"
      size="sm"
      :variant="modelValue === item.id ? 'solid' : 'ghost'"
      :color="modelValue === item.id ? 'primary' : 'neutral'"
      :icon="item.icon"
      class="shrink-0 touch-manipulation"
      @click="emit('update:modelValue', item.id)"
    >
      {{ item.label }}
    </UButton>
  </nav>
</template>

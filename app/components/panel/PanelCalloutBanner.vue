<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    tone?: 'primary' | 'error' | 'warning'
  }>(),
  {
    icon: 'i-lucide-sparkles',
    tone: 'primary',
    description: undefined
  }
)

const shellClass = computed(() => {
  if (props.tone === 'error') {
    return 'border-error/30 bg-linear-to-r from-error/10 to-error/5 ring-error/15'
  }
  if (props.tone === 'warning') {
    return 'border-warning/35 bg-linear-to-r from-warning/12 to-warning/5 ring-warning/15'
  }
  return 'border-primary/20 bg-linear-to-r from-primary/10 to-purple-500/10 ring-primary/15'
})

const iconShellClass = computed(() => {
  if (props.tone === 'error') return 'bg-error/20 text-error'
  if (props.tone === 'warning') return 'bg-warning/20 text-warning'
  return 'bg-primary/20 text-primary'
})

const titleClass = computed(() => {
  if (props.tone === 'error') return 'text-error'
  if (props.tone === 'warning') return 'text-warning'
  return 'text-primary'
})
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-2xl border p-4 shadow-sm ring-1 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    :class="shellClass"
  >
    <div class="flex items-start gap-3 sm:items-center sm:gap-4">
      <div
        class="flex size-11 shrink-0 items-center justify-center rounded-xl sm:size-12"
        :class="iconShellClass"
      >
        <UIcon :name="icon" class="size-6" />
      </div>
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider sm:text-sm" :class="titleClass">
          {{ title }}
        </p>
        <p v-if="description || $slots.description" class="mt-0.5 text-sm text-muted">
          <slot name="description">
            {{ description }}
          </slot>
        </p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex flex-col gap-2 sm:flex-row">
      <slot name="actions" />
    </div>
  </div>
</template>

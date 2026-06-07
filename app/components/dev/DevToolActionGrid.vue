<script setup lang="ts">
export type DevToolAction = {
  id: string
  label: string
  icon: string
  title?: string
  color?: 'primary' | 'neutral' | 'warning' | 'error' | 'success' | 'info'
  variant?: 'outline' | 'soft' | 'solid' | 'ghost'
  active?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export type DevToolActionGroup = {
  id: string
  title: string
  description?: string
  actions: DevToolAction[]
}

defineProps<{
  groups: DevToolActionGroup[]
}>()
</script>

<template>
  <div class="space-y-4">
    <section
      v-for="group in groups"
      :key="group.id"
      class="rounded-xl border border-default/50 bg-muted/5 p-3"
    >
      <div class="mb-2 min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          {{ group.title }}
        </p>
        <p
          v-if="group.description"
          class="mt-0.5 text-[11px] leading-snug text-muted"
        >
          {{ group.description }}
        </p>
      </div>
      <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <UButton
          v-for="action in group.actions"
          :key="action.id"
          size="xs"
          class="min-h-9 touch-manipulation justify-start truncate"
          :icon="action.icon"
          :title="action.title || action.label"
          :color="action.color ?? 'neutral'"
          :variant="action.active ? 'solid' : (action.variant ?? 'outline')"
          :disabled="action.disabled"
          :loading="action.loading"
          @click="action.onClick?.()"
        >
          <span class="truncate">{{ action.label }}</span>
        </UButton>
      </div>
    </section>
  </div>
</template>

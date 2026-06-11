<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

export type DashboardQuickAction = {
  label: string
  to: RouteLocationRaw
  icon: string
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info'
  variant?: 'solid' | 'soft' | 'outline' | 'ghost'
}

defineProps<{
  items: DashboardQuickAction[]
  /** Etykieta sekcji — domyślnie ukryta wizualnie, dostępna dla czytników ekranu */
  ariaLabel?: string
}>()
</script>

<template>
  <nav
    class="slavia-quick-actions"
    :aria-label="ariaLabel || 'Szybkie akcje'"
  >
    <NuxtLink
      v-for="item in items"
      :key="`${String(item.to)}-${item.label}`"
      :to="item.to"
      class="slavia-quick-action-chip group"
    >
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/18"
      >
        <UIcon :name="item.icon" class="size-4" />
      </span>
      <span class="truncate text-sm font-bold text-highlighted transition-colors group-hover:text-primary">
        {{ item.label }}
      </span>
      <UIcon
        name="i-lucide-arrow-up-right"
        class="ml-auto size-3.5 shrink-0 text-muted/40 transition group-hover:text-primary"
      />
    </NuxtLink>
  </nav>
</template>

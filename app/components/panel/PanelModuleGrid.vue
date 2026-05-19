<script setup lang="ts">
import type { DashboardModuleLink } from '~/utils/dashboardLink'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'

defineProps<{
  title: string
  description?: string
  items: DashboardModuleLink[]
  toneFromBg?: (bg?: string) => 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
}>()

const defaultToneFromBg = (bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red') || s.includes('rose')) return 'error'
  if (s.includes('orange') || s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('fuchsia') || s.includes('primary')) return 'primary'
  return 'neutral'
}
</script>

<template>
  <PanelPageSection :title="title" :description="description">
    <div class="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardModuleCard
        v-for="link in items"
        :key="String(link.to)"
        :title="link.title"
        :description="link.description"
        :icon="link.icon"
        :to="link.to"
        :tone="(toneFromBg ?? defaultToneFromBg)(link.bg)"
        :icon-wrapper-class="`${link.bg} ${link.color}`"
      />
    </div>
  </PanelPageSection>
</template>

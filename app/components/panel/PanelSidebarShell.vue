<script setup lang="ts">
import type { PanelArea } from '~/composables/useSlaviaPanelArea'

defineProps<{
  area: PanelArea
}>()

const { mobileOpen, openMobile, closeMobile } = usePanelSidebarNav()
</script>

<template>
  <div class="slavia-panel-sidebar-shell">
    <button
      type="button"
      class="slavia-panel-sidebar-shell__backdrop lg:hidden"
      :class="mobileOpen ? 'slavia-panel-sidebar-shell__backdrop--visible' : ''"
      aria-label="Zamknij panel nawigacji"
      @click="closeMobile"
    />

    <PanelDashboardNav :area="area" />

    <div class="slavia-panel-sidebar-shell__main min-w-0 flex-1">
      <div class="slavia-panel-sidebar-shell__mobile-bar lg:hidden">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-panel-left"
          aria-label="Otwórz panel nawigacji"
          @click="openMobile"
        />
        <span class="text-xs font-bold uppercase tracking-[0.18em] text-muted">Panel</span>
      </div>
      <div class="slavia-panel-sidebar-shell__content">
        <slot />
      </div>
      <ClubSiteFooter class="slavia-panel-sidebar-shell__footer" />
    </div>
  </div>
</template>

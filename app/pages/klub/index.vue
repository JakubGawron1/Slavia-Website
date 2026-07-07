<script setup lang="ts">
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'

definePageMeta({ middleware: 'auth' })

const copy = useRoleAwareCopy()
const { primaryDashboardPath } = useRoleDashboardNav()
const { moduleGroups, panelRole } = useKlubDashboardNav()
const { moduleGroupsForRole } = usePanelNavigationFlags()
const fullRoleModuleGroups = computed(() => moduleGroupsForRole(panelRole.value))
const { statCards, publicLoadError, roleStatsError, retryPublicStats, refreshRoleStats } = useKlubDashboardStats()

provideDashboardSections()

useSlaviaSeo({
  title: 'Klub — Slavia',
  description: 'Moduły wspólne klubu: obecność, czat, wyzwania i strony publiczne.',
  noindex: true
})

function toneFromBg(bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red') || s.includes('rose')) return 'error'
  if (s.includes('orange') || s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('fuchsia') || s.includes('violet') || s.includes('purple') || s.includes('primary')) return 'primary'
  return 'neutral'
}
</script>

<template>
  <KlubPageShell
    icon="i-lucide-layout-grid"
    staff-title="Strefa klubu"
    staff-description="Wspólne moduły kadry i strony publiczne klubu w jednym miejscu."
    athlete-title="Twój klub"
    athlete-description="Obecność, czat, wyzwania i ranking — szybkie wejścia bez szukania w menu."
  >
    <template #actions>
      <UButton
        :to="primaryDashboardPath"
        variant="soft"
        color="neutral"
        size="sm"
        icon="i-lucide-layout-dashboard"
      >
        Panel
      </UButton>
    </template>
    <DashboardSectionsToolbar class="mb-6" />

    <UAlert
      v-if="publicLoadError"
      class="mb-4"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      title="Nie udało się załadować statystyk klubu"
      description="Część danych może być nieaktualna lub pusta."
    >
      <template #actions>
        <UButton size="sm" color="error" variant="soft" @click="retryPublicStats">
          Spróbuj ponownie
        </UButton>
      </template>
    </UAlert>
    <UAlert
      v-else-if="roleStatsError"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="i-lucide-cloud-off"
      title="Nie udało się załadować statystyk Twojej roli"
    >
      <template #actions>
        <UButton size="sm" color="warning" variant="soft" @click="() => refreshRoleStats()">
          Spróbuj ponownie
        </UButton>
      </template>
    </UAlert>

    <PanelCollapsibleSection
      section-id="stats"
      title="Statystyki klubu"
      icon="i-lucide-bar-chart-3"
      :default-open="true"
      class="mb-6"
    >
      <PanelDashboardGrid variant="auto">
        <DashboardKpiCard
          v-for="card in statCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :tone="card.tone"
          :hint="card.hint"
          :to="card.to"
          size="compact"
        />
      </PanelDashboardGrid>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="moduleGroups.length"
      section-id="modules"
      title="Moduły klubu"
      icon="i-lucide-layout-grid"
      :default-open="true"
      embedded
    >
      <PanelModuleNav
        :groups="moduleGroups"
        :nav-role="panelRole"
        :persist-groups="fullRoleModuleGroups"
        :tone-from-bg="toneFromBg"
      />
    </PanelCollapsibleSection>
    <SlaviaEmptyState
      v-else
      icon="i-lucide-layout-grid"
      title="Brak modułów klubu"
      :description="copy.isStaff
        ? 'Nie znaleziono aktywnych modułów — sprawdź flagi nawigacji w panelu SuperAdmin.'
        : 'Poproś trenera o dostęp do modułów klubu.'"
    />
  </KlubPageShell>
</template>

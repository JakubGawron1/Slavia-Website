<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSlaviaSeo({
  title: 'Klub — Slavia',
  description: 'Moduły wspólne klubu: obecność, czat, wyzwania i strony publiczne.',
  noindex: true
})

const copy = useRoleAwareCopy()
const { moduleGroups } = useKlubDashboardNav()

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
    <PanelModuleNav
      v-if="moduleGroups.length"
      :groups="moduleGroups"
      :tone-from-bg="toneFromBg"
    />
    <PublicEmptyState
      v-else
      icon="i-lucide-layout-grid"
      title="Brak modułów klubu"
      :description="copy.isStaff
        ? 'Nie znaleziono aktywnych modułów — sprawdź flagi nawigacji w panelu SuperAdmin.'
        : 'Poproś trenera o dostęp do modułów klubu.'"
    />
  </KlubPageShell>
</template>

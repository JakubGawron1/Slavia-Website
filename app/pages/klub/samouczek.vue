<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { primaryDashboardPath } = useRoleDashboardNav()

useSlaviaSeo({
  title: 'Samouczek aplikacji — Slavia',
  description: 'Interaktywny przewodnik po panelach zawodnika, trenera, admina, redaktora i zarządu.',
  noindex: true
})
</script>

<template>
  <KlubPageShell
    icon="i-lucide-graduation-cap"
    page-label="Samouczek"
    page-icon="i-lucide-graduation-cap"
    staff-title="Samouczek aplikacji"
    staff-description="Interaktywny przewodnik po elementach interfejsu — krok po kroku, z podglądem i linkami do modułów."
    athlete-title="Samouczek aplikacji"
    athlete-description="Dowiedz się, jak działają panel zawodnika, moduły klubu i ustawienia konta."
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

    <AppTutorialPlayer />
  </KlubPageShell>
</template>

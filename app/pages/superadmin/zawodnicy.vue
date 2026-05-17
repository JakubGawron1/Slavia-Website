<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Baza zawodników',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      title="Baza zawodników"
      icon="i-lucide-users"
      description="Pełny dostęp do edycji profili zawodników i przypisań — widok superadministratora."
    />
    <ClubPlayersManager />
  </PanelPageLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Panel trenera — Zawodnicy',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Zawodnicy"
      icon="i-lucide-users"
      description="Dodawaj i edytuj profile zawodników oraz przypisania do zawodów. Konta logowania możesz utworzyć tylko przy roli administratora — jako sam trener wysyłasz prośbę do kadry administracyjnej."
    />
    <ClubPlayersManager />
  </PanelPageLayout>
</template>

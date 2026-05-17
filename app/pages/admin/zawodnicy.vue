<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Zawodnicy — Panel admina',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="admin"
      title="Zawodnicy"
      icon="i-lucide-users"
      description="Zarządzaj listą zawodników, danymi kontaktowymi i przypisaniami. Tworzenie kont logowania dla zawodników — w zależności od uprawnień konta administratora."
    />
    <ClubPlayersManager />
  </PanelPageLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Konta kadry — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="admin"
      variant="hero"
      title="Zarządzanie kontami"
      icon="i-lucide-key-round"
      description="Lista kont systemowych z wyszukiwarką i filtrami ról. Możesz edytować login, hasło i zdjęcie profilowe użytkowników bez roli SuperAdmin. Tworzenie kont, zmiana ról, ban i usuwanie — wyłącznie dla superadministratora (także w /superadmin/administratorzy)."
    />
    <ClubAdminsManager />
  </PanelPageLayout>
</template>

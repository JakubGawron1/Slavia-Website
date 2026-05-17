<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Zarządzanie kontami',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      variant="hero"
      title="Zarządzanie kontami"
      icon="i-lucide-shield-alert"
      description="Jedna lista kont systemowych z filtrami ról i wyszukiwarką. Tworzenie kont, zmiana ról i usuwanie kont są dostępne wyłącznie dla superadministratora. Zwykły administrator nie ma dostępu z API ani z UI do kont mających rolę SuperAdmin (nie są mu listowane); pozostałym kontom może zmieniać wyłącznie login, e-mail i hasło."
    />
    <ClubAdminsManager />
  </PanelPageLayout>
</template>

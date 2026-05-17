<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Konta kadry — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="admin"
      title="Konta kadry"
      icon="i-lucide-key-round"
      description="Lista kont z backendu (pogrupowana): kadra, trenerzy, zawodnicy. Jako administrator bez roli superadministratora nie widzisz ani nie edytujesz żadnego konta, które ma rolę SuperAdmin — ich zarządzanie jest wyłącznie po zalogowaniu jako SuperAdmin. Reszcie użytkowników możesz zmieniać login, e-mail i hasło; zmianę zestawu ról wykonuje superadministrator."
    />
    <ClubAdminsManager />
  </PanelPageLayout>
</template>

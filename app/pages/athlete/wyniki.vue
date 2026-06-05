<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Moje starty i wyniki — Panel zawodnika',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="athlete"
      title="Moje starty i wyniki"
      icon="i-lucide-trophy"
      description="Zgłoś wynik z zawodów lub treningu — kadra zatwierdzi wpis. Historia statusów w jednym miejscu."
    >
      <template #actions>
        <UButton to="/athlete" variant="soft" color="neutral" icon="i-lucide-layout-dashboard" size="sm">
          Panel
        </UButton>
      </template>
    </PanelPageHeader>
    <AthleteResultsPanel />
  </PanelPageLayout>
</template>

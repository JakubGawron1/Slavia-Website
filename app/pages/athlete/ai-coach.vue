<script setup lang="ts">
definePageMeta({ middleware: 'athlete-or-trainer' })

useSeoMeta({
  title: 'Trener AI — asystent treningowy',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout narrow>
    <PanelPageHeader
      area="athlete"
      eyebrow="Trening i progres"
      title="Trener AI"
      icon="i-lucide-sparkles"
      description="Asystent dwuboju: technika, plany tygodniowe, suplementacja i bezpieczna regeneracja — na bazie Twojego profilu klubowego."
    >
      <template #actions>
        <UButton
          to="/athlete/plany"
          variant="soft"
          color="neutral"
          size="lg"
          icon="i-lucide-clipboard-list"
        >
          Moje plany
        </UButton>
      </template>
    </PanelPageHeader>

    <OlympicCoachPanel area="athlete" />
  </PanelPageLayout>
</template>

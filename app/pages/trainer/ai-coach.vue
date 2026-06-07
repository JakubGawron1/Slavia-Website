<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Trener AI — dwubój olimpijski',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout narrow>
    <PanelPageHeader
      area="trainer"
      eyebrow="Narzędzia AI"
      title="Trener AI"
      icon="i-lucide-sparkles"
      description="Lokalny asystent Gemini: dwubój w fazie eksplozywnej, generowanie planów, suplementacja i plany regeneracyjne."
    >
      <template #actions>
        <UButton
          to="/trainer/plany"
          variant="soft"
          color="neutral"
          size="lg"
          icon="i-lucide-clipboard-list"
        >
          Plany treningowe
        </UButton>
      </template>
    </PanelPageHeader>

    <OlympicCoachPanel area="trainer" />
  </PanelPageLayout>
</template>

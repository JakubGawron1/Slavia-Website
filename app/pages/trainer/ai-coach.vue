<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

useSlaviaPageBack({ to: '/trainer' })

useSeoMeta({
  title: 'Trener AI — dwubój olimpijski',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout
    narrow
    class="olympic-coach-page"
  >
    <PanelPageHeader
      area="trainer"
      eyebrow="Narzędzia AI"
      title="Trener AI"
      icon="i-lucide-sparkles"
      description="Asystent Groq (LLaMA): dwubój w fazie eksplozywnej, generowanie planów, suplementacja i plany regeneracyjne."
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

<script setup lang="ts">
definePageMeta({ middleware: 'athlete-or-trainer' })

const OlympicCoachPanelLazy = defineAsyncComponent({
  loader: () => import('~/components/trainer/OlympicCoachPanel.vue'),
  delay: 80,
  timeout: 120_000
})

useSlaviaPageBack({ to: '/athlete' })

useSeoMeta({
  title: 'Trener AI — asystent treningowy',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout
    narrow
    class="olympic-coach-page"
  >
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

    <Suspense>
      <OlympicCoachPanelLazy area="athlete" />
      <template #fallback>
        <div class="flex justify-center py-16 text-muted">
          <UIcon
            name="i-lucide-loader-2"
            class="size-8 animate-spin"
          />
        </div>
      </template>
    </Suspense>
  </PanelPageLayout>
</template>

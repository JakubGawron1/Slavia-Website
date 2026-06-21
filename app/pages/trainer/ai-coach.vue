<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

const OlympicCoachPanelLazy = defineAsyncComponent({
  loader: () => import('~/components/trainer/OlympicCoachPanel.vue'),
  delay: 80,
  timeout: 120_000
})

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

    <Suspense>
      <OlympicCoachPanelLazy area="trainer" />
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

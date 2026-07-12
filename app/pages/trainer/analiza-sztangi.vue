<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Analiza toru sztangi — trener',
  robots: 'noindex, nofollow'
})

const barbellAnalysisOn = useExperimentalFlag('barbell_pose_analysis')

const BarbellLazy = defineAsyncComponent({
  loader: () => import('~/components/club/barbell/BarbellAnalysisPanel.client.vue'),
  delay: 80,
  timeout: 120_000
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Analiza toru sztangi"
      icon="i-lucide-scan-line"
      description="MoveNet w przeglądarce: gradient prędkości, fazy CLEAN/JERK, wykres 2D — materiał zostaje na urządzeniu."
    >
      <template #actions>
        <UButton
          to="/trainer"
          variant="soft"
          color="neutral"
          size="lg"
          icon="i-lucide-arrow-left"
        >
          Panel trenera
        </UButton>
      </template>
    </PanelPageHeader>

    <UAlert
      v-if="!barbellAnalysisOn"
      color="warning"
      variant="subtle"
      title="Narzędzie wyłączone"
      class="max-w-2xl"
    >
      Analiza toru sztangi jest wyłączona przez flagę eksperymentalną lub konfigurację deployu
      (<span class="font-mono text-[11px]">barbell_pose_analysis</span>).
    </UAlert>

    <ClientOnly v-else>
      <Suspense>
        <BarbellLazy />
        <template #fallback>
          <div class="flex justify-center py-16 text-muted">
            <UIcon
              name="i-lucide-loader-2"
              class="size-8 animate-spin"
            />
          </div>
        </template>
      </Suspense>
      <template #fallback>
        <div class="rounded-xl border border-default p-8 text-center text-sm text-muted">
          Ładowanie narzędzia analizy…
        </div>
      </template>
    </ClientOnly>
  </PanelPageLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Analiza toru sztangi — zawodnik',
  robots: 'noindex, nofollow'
})

const barbellAnalysisOn = useExperimentalFlag('barbell_pose_analysis')

const BarbellLazy = defineAsyncComponent({
  loader: () => import('~/components/club/BarbellPathAnalyzer.client.vue'),
  delay: 80,
  timeout: 120_000
})
</script>

<template>
  <PanelPageLayout narrow>
    <PanelPageHeader
      area="athlete"
      title="Analiza toru sztangi"
      icon="i-lucide-scan-line"
      description="Tor i podpowiedzi liczone lokalnie w przeglądarce — nagranie nie trafia na serwer."
    >
      <template #actions>
        <UButton
          to="/athlete"
          variant="soft"
          color="neutral"
          size="lg"
          icon="i-lucide-arrow-left"
        >
          Panel zawodnika
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
      (<span class="font-mono text-[11px]">barbell_pose_analysis</span>). Skontaktuj się z administratorem.
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

<script setup lang="ts">
import type { DevSection } from '~/components/dev/DeveloperSectionNav.vue'
import { DEVELOPER_PAGE_KEY, setupDeveloperPage } from '~/composables/useDeveloperPage'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Ustawienia developera — Superadmin',
  robots: 'noindex, nofollow'
})

const devSection = ref<DevSection>('overview')

const devNavItems: { id: DevSection, label: string, icon: string }[] = [
  { id: 'overview', label: 'Przegląd', icon: 'i-lucide-gauge' },
  { id: 'tools', label: 'Narzędzia', icon: 'i-lucide-wrench' },
  { id: 'ops', label: 'Integracje', icon: 'i-lucide-plug' },
  { id: 'map', label: 'Mapa tras', icon: 'i-lucide-map' }
]

const d = await setupDeveloperPage()
provide(DEVELOPER_PAGE_KEY, d)
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      eyebrow="Developer"
      title="Narzędzia superadmina"
      icon="i-lucide-terminal"
      description="Konfiguracja deployu, funkcje eksperymentalne, smoke API, schowek, motyw i mapa tras — pod szybki smoke i debug."
    >
      <template #actions>
        <UButton
          to="/superadmin"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
        >
          Panel
        </UButton>
      </template>
    </PanelPageHeader>

    <UCard class="mb-4 rounded-2xl border-primary/25 bg-linear-to-br from-primary/6 via-card to-card p-4 shadow-sm ring-1 ring-primary/15 sm:p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
            Publiczna konfiguracja (NUXT_PUBLIC_*)
          </p>
          <p class="mt-1 text-[11px] leading-relaxed text-muted sm:text-xs">
            Wartości trafiają do bundla klienta — <strong class="text-highlighted">bez sekretów</strong>. Zmiana wymaga ponownego deployu / restartu dev.
          </p>
        </div>
        <UBadge color="neutral" variant="subtle" size="xs" class="shrink-0 font-mono">
          X-API-Version: 1
        </UBadge>
      </div>
      <ul class="mt-3 grid gap-2 text-[11px] text-muted sm:grid-cols-2">
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_API_BASE_URL</span>
          — adres backendu (Leapcell / Render / localhost).
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_FEATURES_JSON</span>
          — obiekt JSON z flagami boolean (np.
          <code class="break-all font-mono text-[10px] text-primary">{"athleteCompare":false}</code>
          ); czyta composable <span class="font-mono text-[10px] text-highlighted">usePublicFeatures()</span>.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_FEATURE_ATHLETE_COMPARE</span>
          — <code class="font-mono">0</code> wyłącza link „Porównanie” na liście zawodników (domyślnie włączone bez zmiennej).
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH</span>
          — lista <code class="font-mono">id</code> z
          <code class="font-mono text-[10px]">experimentalFeaturesCatalog.ts</code>, rozdzielona przecinkami; wymusza wyłączenie na produkcji.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2 sm:col-span-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_SITE_URL</span>,
          <span class="font-mono text-[10px] text-highlighted">VERCEL_URL</span>,
          <span class="font-mono text-[10px] text-highlighted">NUXT_SOURCEMAP=1</span>
          — canonical / og:url, adres na Vercel, opcjonalne mapy przy buildzie.
        </li>
      </ul>
      <p class="mt-3 text-[10px] text-muted">
        Backend dokłada nagłówek odpowiedzi <span class="font-mono text-highlighted">X-API-Version: 1</span>
        — możesz go podejrzeć w zakładce Sieć / Network.
      </p>
    </UCard>

    <DevExperimentalFlagsPanel
      class="mb-4"
      :stable-defs="d.experimentalStableDefs"
      :experiment-defs="d.experimentalVisibleDefs"
      :resolved="d.experimentalResolved"
      :kill-deploy="d.experimentalKillDeploy"
      :is-locked="d.isExperimentalLocked"
      @reset="d.resetExperimentalDefaults"
      @toggle="(id, v) => d.setExperimentalFlag(id, v)"
    />

    <DeveloperSectionNav v-model="devSection" :items="devNavItems" />

    <DeveloperOverviewSection v-if="devSection === 'overview'" />
    <DeveloperToolsSection v-if="devSection === 'tools'" />
    <DeveloperMapSection v-if="devSection === 'map'" />
    <DeveloperOpsSection v-if="devSection === 'ops'" />
  </PanelPageLayout>
</template>

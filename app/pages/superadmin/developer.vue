<script setup lang="ts">
import type { DevSection } from '~/components/dev/DeveloperSectionNav.vue'
import { setupDeveloperPage } from '~/composables/useDeveloperPage'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Narzędzia developera — Superadmin',
  robots: 'noindex, nofollow'
})

const devSection = ref<DevSection>('overview')

const devNavItems: { id: DevSection, label: string, icon: string }[] = [
  { id: 'overview', label: 'Przegląd', icon: 'i-lucide-gauge' },
  { id: 'tools', label: 'Debug', icon: 'i-lucide-bug' },
  { id: 'flags', label: 'Flagi', icon: 'i-lucide-flask-conical' },
  { id: 'ops', label: 'Integracje', icon: 'i-lucide-plug' },
  { id: 'map', label: 'Mapa tras', icon: 'i-lucide-map' }
]

const d = await setupDeveloperPage()
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      eyebrow="Developer"
      title="DevTools"
      icon="i-lucide-terminal"
      description="Diagnostyka API, flagi eksperymentalne, integracje CMS/AI, smoke testy i mapa tras aplikacji."
    >
      <template #actions>
        <UBadge variant="subtle" color="primary" size="sm" class="font-mono">
          {{ d.config.public.appVersion }}
        </UBadge>
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

    <DeveloperSectionNav v-model="devSection" :items="devNavItems" />

    <DeveloperOverviewSection v-if="devSection === 'overview'" />
    <DeveloperToolsSection v-if="devSection === 'tools'" />
    <DeveloperFlagsSection v-if="devSection === 'flags'" />
    <DeveloperOpsSection v-if="devSection === 'ops'" />
    <DeveloperMapSection v-if="devSection === 'map'" />
  </PanelPageLayout>
</template>

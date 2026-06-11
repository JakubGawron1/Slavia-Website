<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'

definePageMeta({ middleware: 'auth' })

const apiFetch = useApi()
const auth = useAuth()
const rolePreviewState = useRolePreviewState()

const year = new Date().getFullYear()

const { data: bundle } = await useAsyncData('athlete-wrapped', async () => {
  if (!rolePreviewState.viewingAthletePortal.value) {
    return { athlete: null as Athlete | null, results: [] as CompetitionResult[] }
  }
  const athlete = await apiFetch<Athlete | null>('/api/athletes/me').catch(() => null)
  const results = athlete?.id
    ? await apiFetch<CompetitionResult[]>(`/api/results/athlete/${athlete.id}`).catch(() => [])
    : []
  return { athlete, results }
})

const yearResults = computed(() => {
  const list = bundle.value?.results ?? []
  return list.filter((r) => {
    const d = r.date?.slice(0, 4)
    return d === String(year) && r.status === 'Approved'
  })
})

const stats = computed(() => {
  const rows = yearResults.value
  let tonnage = 0
  let bestTotal = 0
  for (const r of rows) {
    tonnage += r.total || 0
    if ((r.total || 0) > bestTotal) bestTotal = r.total || 0
  }
  return {
    starts: rows.length,
    tonnage,
    bestTotal,
    prCount: rows.filter((r) => (r.total || 0) >= bestTotal * 0.99).length
  }
})

const athleteLabel = computed(
  () => bundle.value?.athlete?.full_name || auth.user.value?.username || 'Zawodniku'
)

useSeoMeta({
  title: `Slavia Wrapped ${year}`,
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="athlete"
      variant="hero"
      :title="`Slavia Wrapped ${year}`"
      icon="i-lucide-sparkles"
    >
      <template #description>
        {{ athleteLabel }} — podsumowanie sezonu {{ year }} (wyniki zatwierdzone).
      </template>
      <template #actions>
        <UButton
          to="/athlete"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-layout-dashboard"
        >
          Panel
        </UButton>
      </template>
    </PanelPageHeader>

    <UAlert
      v-if="!rolePreviewState.viewingAthletePortal.value"
      icon="i-lucide-info"
      color="warning"
      variant="subtle"
      title="Widok dla zawodnika"
      description="Pełne statystyki Wrapped są dostępne na koncie z rolą Zawodnik."
      class="rounded-2xl"
    />

    <UAlert
      v-else-if="rolePreviewState.isReadOnly.value"
      class="mb-4 rounded-2xl"
      color="warning"
      variant="subtle"
      icon="i-lucide-eye"
      title="Podgląd read-only"
      description="Podsumowanie sezonu wybranego zawodnika — tylko do odczytu."
    />

    <PanelPageSection
      v-if="rolePreviewState.viewingAthletePortal.value"
      title="Twoje liczby"
      description="Starty, tonaż i najlepszy total w bieżącym roku kalendarzowym."
      icon="i-lucide-trophy"
    >
      <PanelDashboardGrid variant="kpi">
        <DashboardKpiCard
          label="Starty (zatwierdzone)"
          :value="stats.starts"
          icon="i-lucide-flag"
          tone="primary"
        />
        <DashboardKpiCard
          label="Łączny tonaż"
          :value="`${stats.tonnage} kg`"
          icon="i-lucide-weight"
          tone="success"
        />
        <DashboardKpiCard
          label="Najlepszy total"
          :value="stats.bestTotal ? `${stats.bestTotal} kg` : '—'"
          icon="i-lucide-medal"
          tone="warning"
        />
        <DashboardKpiCard
          label="Kamienie milowe"
          :value="stats.prCount"
          icon="i-lucide-star"
          tone="info"
          hint="Wyniki na poziomie najlepszego totalu"
        />
      </PanelDashboardGrid>
    </PanelPageSection>

    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <UButton
        to="/athlete"
        variant="soft"
        color="primary"
        icon="i-lucide-layout-dashboard"
      >
        Wróć do panelu
      </UButton>
      <UButton
        to="/athlete/timeline"
        variant="outline"
        color="neutral"
        icon="i-lucide-git-branch"
      >
        Oś czasu
      </UButton>
    </div>
  </PanelPageLayout>
</template>

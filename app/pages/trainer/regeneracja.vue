<script setup lang="ts">
import { useTrainerRecoveryLogs } from '~/composables/useRecoveryLogs'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Regeneracja zawodników — trener',
  robots: 'noindex, nofollow'
})

const {
  NO_ATHLETE,
  selectedAthleteId,
  selectedName,
  athleteSelectItems,
  logs,
  trend,
  dateFrom,
  dateTo,
  loading
} = useTrainerRecoveryLogs()
</script>

<template>
  <PanelPageLayout narrow>
    <PanelPageHeader
      area="trainer"
      eyebrow="Dobrostan kadry"
      title="Regeneracja zawodników"
      icon="i-lucide-heart-pulse"
      description="Podgląd check-inów zawodników (sen, skale subiektywne, notatki). Dane pochodzą z ich wpisów — możesz reagować planem treningowym lub rozmową."
    />

    <UCard class="slavia-page-card mb-10">
      <UFormField label="Zawodnik" description="Lista aktywnych profili dostępnych dla kadry">
        <SlaviaOverlaySelect
          v-model="selectedAthleteId"
          value-key="value"
          size="lg"
          class="w-full"
          :items="athleteSelectItems"
        />
      </UFormField>
      <div v-if="selectedAthleteId !== NO_ATHLETE" class="mt-4 grid gap-4 sm:grid-cols-2">
        <UFormField label="Od daty">
          <UInput v-model="dateFrom" type="date" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Do daty">
          <UInput v-model="dateTo" type="date" size="lg" class="w-full" />
        </UFormField>
      </div>
      <p v-if="selectedAthleteId !== NO_ATHLETE" class="mt-3 text-xs text-muted">
        Wybrano: <span class="font-semibold text-highlighted">{{ selectedName }}</span>
      </p>
    </UCard>

    <PublicEmptyState
      v-if="selectedAthleteId === NO_ATHLETE"
      compact
      icon="i-lucide-user-round-search"
      title="Wybierz zawodnika"
      description="Wskaż profil z listy powyżej, aby wczytać historię check-inów regeneracji."
    />
    <RecoveryLogHistory
      v-else
      :logs="logs"
      :trend="trend"
      :loading="loading"
      empty-title="Brak wpisów regeneracji"
      empty-description="Zawodnik jeszcze nie zapisał check-inu w swoim panelu."
    >
      <template #title>
        Log check-inów
      </template>
    </RecoveryLogHistory>
  </PanelPageLayout>
</template>

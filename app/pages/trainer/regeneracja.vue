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
    >
      <template #actions>
        <UButton to="/trainer" variant="soft" color="neutral" size="sm" icon="i-lucide-layout-dashboard">
          Panel
        </UButton>
      </template>
    </PanelPageHeader>

    <PanelDataToolbar
      class="mb-10"
      :summary="selectedAthleteId !== NO_ATHLETE ? `Wybrano: ${selectedName}` : undefined"
      sticky
    >
      <template #filters>
        <UFormField label="Zawodnik" description="Lista aktywnych profili dostępnych dla kadry" class="w-full sm:max-w-md">
          <SlaviaOverlaySelect
            v-model="selectedAthleteId"
            value-key="value"
            size="lg"
            class="w-full"
            :items="athleteSelectItems"
          />
        </UFormField>
        <template v-if="selectedAthleteId !== NO_ATHLETE">
          <UFormField label="Od daty" class="w-full sm:w-44">
            <UInput v-model="dateFrom" type="date" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Do daty" class="w-full sm:w-44">
            <UInput v-model="dateTo" type="date" size="lg" class="w-full" />
          </UFormField>
        </template>
      </template>
    </PanelDataToolbar>

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

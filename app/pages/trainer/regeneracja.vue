<script setup lang="ts">
import type { Athlete, RecoveryLog } from '~/types/models'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Regeneracja zawodników — trener',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const NO_ATHLETE = '__none__'

const { data: athletes } = await useAsyncData(
  'trainer-recovery-athletes',
  () => apiFetch<Athlete[]>('/api/athletes').catch(() => []),
  { default: () => [] }
)

const selectedAthleteId = ref(NO_ATHLETE)
const logs = ref<RecoveryLog[]>([])
const loading = ref(false)

async function loadLogs() {
  if (selectedAthleteId.value === NO_ATHLETE) {
    logs.value = []
    return
  }
  loading.value = true
  try {
    logs.value = await apiFetch<RecoveryLog[]>(`/api/recovery/athlete/${selectedAthleteId.value}`).catch(() => [])
  } finally {
    loading.value = false
  }
}

watch(selectedAthleteId, () => {
  void loadLogs()
})

const selectedName = computed(() => {
  const id = selectedAthleteId.value
  if (id === NO_ATHLETE) return ''
  return (athletes.value || []).find(a => a.id === id)?.full_name || ''
})
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
        <USelect
          v-model="selectedAthleteId"
          value-key="value"
          size="lg"
          class="w-full"
          :items="[{ label: '— wybierz zawodnika —', value: NO_ATHLETE }, ...((athletes || []).map(a => ({ label: a.full_name, value: a.id })))]"
        />
      </UFormField>
      <p v-if="selectedAthleteId !== NO_ATHLETE" class="mt-3 text-xs text-muted">
        Wybrano: <span class="font-semibold text-highlighted">{{ selectedName }}</span>
      </p>
    </UCard>

    <section>
      <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-highlighted">
        <UIcon name="i-lucide-line-chart" class="size-5 text-muted" />
        Log check-inów
      </h2>
      <div v-if="loading" class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        Ładowanie…
      </div>
      <div v-else class="space-y-3">
        <UCard
          v-for="r in logs"
          :key="r.id"
          class="border-default/60"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-bold tabular-nums text-highlighted">
              {{ r.date }}
            </p>
            <UBadge variant="subtle" color="primary" size="sm">
              sen {{ r.sleep_hours }}h
            </UBadge>
          </div>
          <div class="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">
            <span>Zmęczenie <strong class="text-highlighted">{{ r.fatigue_level }}</strong>/10</span>
            <span>Ból <strong class="text-highlighted">{{ r.soreness_level }}</strong>/10</span>
            <span>Gotowość <strong class="text-highlighted">{{ r.readiness_level }}</strong>/10</span>
          </div>
          <p v-if="r.note" class="mt-3 rounded-lg bg-muted/15 px-3 py-2 text-sm text-muted">
            {{ r.note }}
          </p>
        </UCard>
        <PublicEmptyState
          v-if="selectedAthleteId === NO_ATHLETE"
          compact
          icon="i-lucide-user-round-search"
          title="Wybierz zawodnika"
          description="Wskaż profil z listy powyżej, aby wczytać historię check-inów regeneracji."
        />
        <PublicEmptyState
          v-else-if="logs.length === 0"
          compact
          icon="i-lucide-heart-pulse"
          title="Brak wpisów regeneracji"
          description="Zawodnik jeszcze nie zapisał check-inu w swoim panelu."
        />
      </div>
    </section>
  </PanelPageLayout>
</template>

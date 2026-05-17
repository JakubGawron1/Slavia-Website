<script setup lang="ts">
import type { ExerciseBoardRowV2, ExerciseSubmissionDto } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth'
})

const auth = useAuth()
const { fetchBoard } = useExercisesBoard()
const apiFetch = useApi()
const toast = useToast()

const canOpen = computed(() => auth.isAthlete.value || auth.isSuperAdmin.value)

type ExerciseOption = { id: string, name: string, category?: string | null }

const { data: exercisesRaw } = await useAsyncData('exercise-catalog', async (): Promise<ExerciseOption[]> => {
  if (!canOpen.value) return []
  return await apiFetch<ExerciseOption[]>(apiRoutes.exercises.list).catch(() => [])
}, { default: () => [] })

const exerciseItems = computed(() => (exercisesRaw.value ?? []).map(e => ({
  label: e.category ? `${e.name} · ${e.category}` : e.name,
  value: e.id
})))

const selectedExerciseId = ref<string>('')
watch(
  () => exerciseItems.value,
  (items) => {
    if (selectedExerciseId.value) return
    selectedExerciseId.value = items[0]?.value ?? ''
  },
  { immediate: true }
)

const myAthlete = ref<{ id: string } | null>(null)
onMounted(async () => {
  myAthlete.value = await apiFetch<{ id: string } | null>(apiRoutes.athletes.me).catch(() => null)
})

const submitForm = reactive({
  value: null as number | null,
  performed_at: new Date().toISOString().slice(0, 10),
  notes: ''
})

onMounted(async () => {
  // already loaded above
})

const { data: mySubmissions, pending: myPending, refresh: refreshMySubmissions } = await useAsyncData(
  'my-exercise-submissions',
  async (): Promise<ExerciseSubmissionDto[]> => {
    if (!canOpen.value) return []
    return await apiFetch<ExerciseSubmissionDto[]>(apiRoutes.exerciseSubmissions.my).catch(() => [])
  },
  { default: () => [] }
)

const { data: boardRows, pending: boardPending, refresh: refreshBoard } = await useAsyncData(
  () => `exercise-board-${selectedExerciseId.value || 'none'}`,
  async (): Promise<ExerciseBoardRowV2[]> => {
    if (!canOpen.value) return []
    if (!selectedExerciseId.value) return []
    return await fetchBoard(selectedExerciseId.value)
  },
  { default: () => [] }
)

const ranking = computed(() => [...(boardRows.value ?? [])])
const podium = computed(() => ranking.value.slice(0, 3))

const myRankIndex = computed(() => {
  const id = myAthlete.value?.id
  if (!id) return -1
  return ranking.value.findIndex(r => r.athlete_id === id)
})

function scrollToMyRank() {
  if (!import.meta.client) return
  const el = document.getElementById('my-rank-row')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function statusColor(s: ExerciseSubmissionDto['status']) {
  if (s === 'Approved') return 'success'
  if (s === 'Rejected') return 'error'
  return 'warning'
}

async function submitExerciseResult() {
  if (!myAthlete.value?.id) {
    toast.add({ title: 'Brak profilu zawodnika', color: 'warning' })
    return
  }
  if (!selectedExerciseId.value) {
    toast.add({ title: 'Wybierz ćwiczenie', color: 'warning' })
    return
  }
  const v = submitForm.value != null ? Number(submitForm.value) : null
  if (v == null || !Number.isFinite(v) || v <= 0) {
    toast.add({ title: 'Podaj poprawną wartość (większą od 0)', color: 'warning' })
    return
  }
  try {
    await apiFetch(apiRoutes.exerciseSubmissions.collection, {
      method: 'POST',
      body: {
        exercise_id: selectedExerciseId.value,
        value: v,
        performed_at: submitForm.performed_at,
        notes: submitForm.notes?.trim() || undefined
      }
    })
    toast.add({ title: 'Wysłano do weryfikacji', color: 'success' })
    submitForm.value = null
    submitForm.notes = ''
    await Promise.all([refreshMySubmissions(), refreshBoard()])
  } catch (e) {
    toast.add({ title: 'Błąd wysyłki', description: getApiErrorMessage(e), color: 'error' })
  }
}

useSeoMeta({
  title: 'Inne ćwiczenia — Zawodnik',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="athlete"
      title="Inne ćwiczenia"
      icon="i-lucide-bar-chart-3"
      description="Rzeczywiste wyniki siłowe z zatwierdzonych wpisów (trener/admin) + status zgłoszeń zawodników."
    />

    <UAlert
      v-if="!canOpen"
      color="warning"
      variant="subtle"
      title="Brak uprawnień"
      description="Ta sekcja jest dostępna dla zawodnika oraz superadmina."
    />

    <div v-else class="space-y-6">
      <UCard>
        <h2 class="mb-3 text-lg font-semibold text-highlighted">Zgłoś wynik do weryfikacji</h2>
        <div class="grid gap-3 sm:grid-cols-4">
          <UFormField label="Ćwiczenie">
            <USelect v-model="selectedExerciseId" :items="exerciseItems" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Wynik (kg)">
            <UInputNumber v-model="submitForm.value" :min="0" :step="0.5" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Data">
            <UInput v-model="submitForm.performed_at" type="date" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Notatka (opcjonalnie)">
            <UInput v-model="submitForm.notes" size="lg" class="w-full" placeholder="np. belt, pauza, RPE..." />
          </UFormField>
        </div>
        <div class="mt-3">
          <UButton icon="i-lucide-send" @click="submitExerciseResult">Wyślij</UButton>
        </div>
      </UCard>

      <UCard>
        <h2 class="mb-3 text-lg font-semibold text-highlighted">Moje zgłoszenia</h2>
        <div v-if="myPending" class="flex items-center gap-2 text-muted">
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
          Ładowanie…
        </div>
        <div v-else-if="(mySubmissions?.length || 0) === 0" class="text-sm text-muted">
          Brak zgłoszeń. Wyślij pierwszy wynik powyżej.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left text-muted">
                <th class="py-2 pr-3">Data</th>
                <th class="py-2 px-3">Ćwiczenie</th>
                <th class="py-2 px-3 text-right">Wynik</th>
                <th class="py-2 px-3">Status</th>
                <th class="py-2 pl-3">Uwagi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in mySubmissions" :key="s.id" class="border-b border-default/60 align-top">
                <td class="py-2 pr-3 font-mono text-xs text-muted">{{ s.performed_at }}</td>
                <td class="py-2 px-3 font-medium text-highlighted">{{ s.exercise_name }}</td>
                <td class="py-2 px-3 text-right font-mono font-bold text-highlighted">{{ s.value }} {{ s.unit }}</td>
                <td class="py-2 px-3">
                  <UBadge size="xs" variant="subtle" :color="statusColor(s.status)">{{ s.status }}</UBadge>
                </td>
                <td class="py-2 pl-3 text-xs text-muted">
                  <div v-if="s.review_note" class="mb-1">
                    <span class="font-semibold">Kadra:</span> {{ s.review_note }}
                  </div>
                  <div v-if="s.notes">
                    <span class="font-semibold">Ty:</span> {{ s.notes }}
                  </div>
                  <span v-if="!s.notes && !s.review_note">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard>
        <h2 class="mb-4 text-lg font-semibold text-highlighted">Podium</h2>
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="(p, idx) in podium" :key="p.athlete_id" class="rounded-xl border border-default/60 bg-muted/10 p-4 text-center">
            <p class="text-xs font-bold text-muted">#{{ idx + 1 }}</p>
            <p class="mt-1 font-semibold text-highlighted">{{ p.athlete_name }}</p>
            <p class="text-2xl font-black text-primary">{{ p.best_value }}<span class="text-sm"> {{ p.unit }}</span></p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div v-if="boardPending" class="flex items-center gap-2 text-muted">
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
          Ładowanie rankingu…
        </div>
        <div v-else-if="ranking.length === 0" class="text-sm text-muted">
          Brak zatwierdzonych wyników dla wybranego ćwiczenia.
        </div>
        <div v-else>
          <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-highlighted">Ranking (wybrane ćwiczenie)</h2>
              <p class="text-sm text-muted">Pozycje liczymy wyłącznie z zatwierdzonych wyników.</p>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                v-if="myRankIndex >= 0"
                size="sm"
                variant="soft"
                color="primary"
                icon="i-lucide-target"
                class="rounded-xl"
                @click="scrollToMyRank"
              >
                Skocz do mnie (#{{ myRankIndex + 1 }})
              </UButton>
              <UBadge
                v-else
                color="neutral"
                variant="subtle"
                size="sm"
                title="Brak Twojego zatwierdzonego wyniku w tym ćwiczeniu"
              >
                Brak Twojego wyniku
              </UBadge>
            </div>
          </div>
          <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-default text-left text-muted">
                <th class="py-2 pr-3">Msc.</th>
                <th class="py-2 px-3">Zawodnik</th>
                <th class="py-2 px-3 text-right">Wynik</th>
                <th class="py-2 px-3 text-right">Wpisów</th>
                <th class="py-2 pl-3">Ostatni</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in ranking"
                :id="myAthlete?.id && row.athlete_id === myAthlete.id ? 'my-rank-row' : undefined"
                :key="row.athlete_id"
                class="border-b border-default/60 align-top"
                :class="myAthlete?.id && row.athlete_id === myAthlete.id ? 'bg-primary/5' : ''"
              >
                <td class="py-2 pr-3 font-mono font-bold text-muted">{{ idx + 1 }}</td>
                <td class="py-2 px-3 font-medium text-highlighted">{{ row.athlete_name }}</td>
                <td class="py-2 px-3 text-right font-mono font-black text-primary">{{ row.best_value }} {{ row.unit }}</td>
                <td class="py-2 px-3 text-right font-mono text-muted">{{ row.entries }}</td>
                <td class="py-2 pl-3 font-mono text-xs text-muted">{{ row.last_performed_at || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </UCard>
    </div>
  </PanelPageLayout>
</template>
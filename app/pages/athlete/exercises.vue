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

const { exerciseItems, selectedExerciseId } = await useOtherExercisesCatalog('athlete-other-exercises-catalog', {
  enabled: () => canOpen.value
})

const myAthlete = ref<{ id: string } | null>(null)
onMounted(async () => {
  if (!canOpen.value) return
  myAthlete.value = await apiFetch<{ id: string } | null>(apiRoutes.athletes.me).catch(() => null)
})

const submitCardRef = ref<{ resetForm: () => void } | null>(null)
const submitSaving = ref(false)

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

async function submitExerciseResult(payload: { value: number, performed_at: string, notes: string }) {
  if (!myAthlete.value?.id) {
    toast.add({ title: 'Brak profilu zawodnika', color: 'warning' })
    return
  }
  if (!selectedExerciseId.value) {
    toast.add({ title: 'Wybierz ćwiczenie', color: 'warning' })
    return
  }
  submitSaving.value = true
  try {
    await apiFetch(apiRoutes.exerciseSubmissions.collection, {
      method: 'POST',
      body: {
        exercise_id: selectedExerciseId.value,
        value: payload.value,
        performed_at: payload.performed_at,
        notes: payload.notes?.trim() || undefined
      }
    })
    toast.add({ title: 'Wysłano do weryfikacji kadry', color: 'success' })
    submitCardRef.value?.resetForm()
    await Promise.all([refreshMySubmissions(), refreshBoard()])
  } catch (e) {
    toast.add({ title: 'Błąd wysyłki', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    submitSaving.value = false
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
      description="Przysiad, wycisk, martwy i inne boje siłowe — osobno od startów w rwaniu i podrzucie. Zgłoś wynik, śledź status i porównaj się z kadrą."
    />

    <UAlert
      v-if="!canOpen"
      color="warning"
      variant="subtle"
      title="Brak uprawnień"
      description="Ta sekcja jest dostępna dla zawodnika oraz superadmina."
    />

    <div v-else class="space-y-6">
      <OtherExercisesRankingCard
        :exercise-items="exerciseItems"
        :selected-exercise-id="selectedExerciseId"
        :ranking="ranking"
        :pending="boardPending"
        :highlight-athlete-id="myAthlete?.id"
        @update:selected-exercise-id="selectedExerciseId = $event"
      />

      <OtherExercisesSubmitCard
        ref="submitCardRef"
        :exercise-items="exerciseItems"
        :selected-exercise-id="selectedExerciseId"
        :saving="submitSaving"
        @update:selected-exercise-id="selectedExerciseId = $event"
        @submit="submitExerciseResult"
      />

      <OtherExercisesMySubmissionsCard
        :submissions="mySubmissions ?? []"
        :pending="myPending"
      />

      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-calculator"
        title="Kalkulator Max PR (1RM)"
        description="Szacuj rekord z ciężaru i liczby powtórzeń — publiczne narzędzie bez logowania."
        :actions="[{ label: 'Otwórz kalkulator', to: '/kalkulator-max-pr', color: 'primary', variant: 'soft' }]"
      />
    </div>
  </PanelPageLayout>
</template>

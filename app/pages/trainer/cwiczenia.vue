<script setup lang="ts">
import type { ExerciseBoardRowV2, ExerciseSubmissionDto } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'trainer' })

const route = useRoute()
const router = useRouter()
const { fetchBoard } = useExercisesBoard()
const apiFetch = useApi()
const toast = useToast()

type TrainerTab = 'ranking' | 'slownik'

const tabs: { id: TrainerTab, label: string, icon: string }[] = [
  { id: 'ranking', label: 'Ranking i weryfikacja', icon: 'i-lucide-bar-chart-3' },
  { id: 'slownik', label: 'Słownik ćwiczeń', icon: 'i-lucide-library' }
]

const activeTab = computed<TrainerTab>({
  get() {
    const q = route.query.tab
    return q === 'slownik' ? 'slownik' : 'ranking'
  },
  set(tab) {
    void router.replace({ path: '/trainer/cwiczenia', query: tab === 'ranking' ? {} : { tab } })
  }
})

const { exerciseItems, selectedExerciseId } = await useOtherExercisesCatalog('trainer-other-exercises-catalog')

const { data: pendingSubs, pending: pendingQueue, refresh: refreshPending } = await useAsyncData(
  'exercise-submissions-pending',
  async (): Promise<ExerciseSubmissionDto[]> => {
    return await apiFetch<ExerciseSubmissionDto[]>(apiRoutes.exerciseSubmissions.pending).catch(() => [])
  },
  { default: () => [] }
)

const { data: boardRows, pending: boardPending, refresh: refreshBoard } = await useAsyncData(
  () => `trainer-exercise-board-${selectedExerciseId.value || 'none'}`,
  async (): Promise<ExerciseBoardRowV2[]> => {
    if (!selectedExerciseId.value) return []
    return await fetchBoard(selectedExerciseId.value)
  },
  { default: () => [] }
)

const ranking = computed(() => [...(boardRows.value ?? [])])

const reviewOpen = ref(false)
const reviewing = ref<ExerciseSubmissionDto | null>(null)
const reviewMode = ref<'approve' | 'reject'>('approve')
const reviewSaving = ref(false)

function openReview(s: ExerciseSubmissionDto, mode: 'approve' | 'reject') {
  reviewing.value = s
  reviewMode.value = mode
  reviewOpen.value = true
}

async function submitReview(reviewNote: string) {
  if (!reviewing.value) return
  reviewSaving.value = true
  try {
    const id = reviewing.value.id
    const body = { review_note: reviewNote || undefined }
    if (reviewMode.value === 'approve') {
      await apiFetch(apiRoutes.exerciseSubmissions.approve(id), { method: 'PATCH', body })
      toast.add({ title: 'Zatwierdzono zgłoszenie', color: 'success' })
    } else {
      await apiFetch(apiRoutes.exerciseSubmissions.reject(id), { method: 'PATCH', body })
      toast.add({ title: 'Odrzucono zgłoszenie', color: 'success' })
    }
    reviewOpen.value = false
    reviewing.value = null
    await Promise.all([refreshPending(), refreshBoard()])
  } catch (e) {
    toast.add({ title: 'Błąd weryfikacji', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    reviewSaving.value = false
  }
}

async function refreshAll() {
  await Promise.all([refreshPending(), refreshBoard()])
}

useSeoMeta({
  title: 'Inne ćwiczenia — Trener',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Inne ćwiczenia"
      icon="i-lucide-bar-chart-3"
      description="Siła poza dwubojem: weryfikuj zgłoszenia zawodników, śledź ranking klubu i zarządzaj wspólnym słownikiem ćwiczeń."
    >
      <template #actions>
        <UButton
          to="/trainer"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-layout-dashboard"
        >
          Panel
        </UButton>
        <UButton
          variant="soft"
          icon="i-lucide-refresh-ccw"
          :loading="pendingQueue || boardPending"
          @click="() => void refreshAll()"
        >
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <div class="mb-6 flex flex-wrap gap-2">
      <UButton
        v-for="tab in tabs"
        :key="tab.id"
        size="sm"
        :icon="tab.icon"
        :color="activeTab === tab.id ? 'primary' : 'neutral'"
        :variant="activeTab === tab.id ? 'solid' : 'outline'"
        class="rounded-xl"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <UBadge
          v-if="tab.id === 'ranking' && (pendingSubs?.length || 0) > 0"
          color="warning"
          variant="solid"
          size="xs"
          class="ml-1"
        >
          {{ pendingSubs?.length }}
        </UBadge>
      </UButton>
    </div>

    <div v-if="activeTab === 'ranking'" class="space-y-6">
      <OtherExercisesQueueCard
        :pending-subs="pendingSubs ?? []"
        :pending="pendingQueue"
        :exercise-items="exerciseItems"
        @approve="openReview($event, 'approve')"
        @reject="openReview($event, 'reject')"
      />

      <OtherExercisesRankingCard
        :exercise-items="exerciseItems"
        :selected-exercise-id="selectedExerciseId"
        :ranking="ranking"
        :pending="boardPending"
        @update:selected-exercise-id="selectedExerciseId = $event"
      />
    </div>

    <OtherExercisesDictionaryPanel v-else />

    <OtherExercisesReviewModal
      v-model:open="reviewOpen"
      :submission="reviewing"
      :mode="reviewMode"
      :saving="reviewSaving"
      @confirm="submitReview"
    />
  </PanelPageLayout>
</template>

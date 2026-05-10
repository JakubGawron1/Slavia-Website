<script setup lang="ts">
import type { ExerciseBoardRowV2, ExerciseSubmissionDto } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({
  middleware: 'trainer'
})

const { fetchBoard } = useExercisesBoard()
const apiFetch = useApi()
const toast = useToast()

type ExerciseOption = { id: string, name: string, category?: string | null }

const { data: exercisesRaw } = await useAsyncData('exercise-catalog-trainer', async (): Promise<ExerciseOption[]> => {
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

const queueQuery = ref('')
const queueExerciseFilter = ref<string>('all')

const queueFiltered = computed(() => {
  const q = queueQuery.value.trim().toLowerCase()
  return (pendingSubs.value ?? []).filter((s) => {
    if (queueExerciseFilter.value !== 'all' && s.exercise_id !== queueExerciseFilter.value) return false
    if (!q) return true
    const hay = `${s.athlete_name || ''} ${s.athlete_id} ${s.exercise_name} ${s.notes || ''} ${s.value} ${s.performed_at}`.toLowerCase()
    return hay.includes(q)
  })
})

const queueStats = computed(() => {
  const list = pendingSubs.value ?? []
  const uniqueAthletes = new Set(list.map(x => x.athlete_id)).size
  const uniqueExercises = new Set(list.map(x => x.exercise_id)).size
  return { total: list.length, uniqueAthletes, uniqueExercises }
})

const reviewOpen = ref(false)
const reviewing = ref<ExerciseSubmissionDto | null>(null)
const reviewMode = ref<'approve' | 'reject'>('approve')
const reviewNote = ref('')
const reviewSaving = ref(false)

function openReview(s: ExerciseSubmissionDto, mode: 'approve' | 'reject') {
  reviewing.value = s
  reviewMode.value = mode
  reviewNote.value = ''
  reviewOpen.value = true
}

async function submitReview() {
  if (!reviewing.value) return
  reviewSaving.value = true
  try {
    const id = reviewing.value.id
    const body = { review_note: reviewNote.value.trim() || undefined }
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

useSeoMeta({
  title: 'Inne ćwiczenia — Trener',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-8 sm:py-12 lg:py-14">
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl lg:text-4xl">
        Inne ćwiczenia
      </h1>
      <p class="mt-2 text-sm text-muted sm:text-base lg:leading-relaxed">
        Panel kadry: rzeczywiste wyniki siłowe + monitoring oczekujących zgłoszeń od zawodników.
      </p>
    </div>

    <div class="space-y-6">
      <UCard>
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-highlighted">Kolejka zgłoszeń do zatwierdzenia</h2>
            <p class="mt-1 text-sm text-muted">
              Oczekujące: <span class="font-mono font-bold text-highlighted">{{ queueStats.total }}</span>
              · zawodników: <span class="font-mono font-bold text-highlighted">{{ queueStats.uniqueAthletes }}</span>
              · ćwiczeń: <span class="font-mono font-bold text-highlighted">{{ queueStats.uniqueExercises }}</span>
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
            <UFormField label="Szukaj" class="sm:w-64">
              <UInput v-model="queueQuery" icon="i-lucide-search" placeholder="Zawodnik, ćwiczenie, data…" />
            </UFormField>
            <UFormField label="Ćwiczenie" class="sm:w-72">
              <USelect
                v-model="queueExerciseFilter"
                :items="[{ label: 'Wszystkie', value: 'all' }, ...exerciseItems]"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
        <div v-if="pendingQueue" class="flex items-center gap-2 text-muted">
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
          Ładowanie…
        </div>
        <div v-else-if="!(pendingSubs?.length)" class="text-sm text-muted">Brak oczekujących zgłoszeń.</div>
        <div v-else-if="queueFiltered.length === 0" class="text-sm text-muted">Brak wyników dla podanych filtrów.</div>
        <div v-else class="space-y-2">
          <div v-for="r in queueFiltered" :key="r.id" class="flex flex-col gap-3 rounded-xl border border-default/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-sm">
              <p class="font-semibold text-highlighted">{{ r.athlete_name || r.athlete_id }}</p>
              <p class="text-muted">
                {{ r.exercise_name }} · <span class="font-mono font-bold">{{ r.value }} {{ r.unit }}</span> · {{ r.performed_at }}
              </p>
              <p v-if="r.notes" class="mt-1 text-xs text-muted">Notatka: {{ r.notes }}</p>
            </div>
            <div class="flex gap-2">
              <UButton size="sm" icon="i-lucide-check" @click="openReview(r, 'approve')">Zatwierdź</UButton>
              <UButton size="sm" color="error" variant="soft" icon="i-lucide-x" @click="openReview(r, 'reject')">Odrzuć</UButton>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-highlighted">Ranking (wybrane ćwiczenie)</h2>
            <p class="text-sm text-muted">Ranking jest liczony wyłącznie z zatwierdzonych rekordów nowego systemu.</p>
          </div>
          <UFormField label="Ćwiczenie" class="sm:w-96">
            <USelect v-model="selectedExerciseId" :items="exerciseItems" size="lg" class="w-full" />
          </UFormField>
        </div>

        <div v-if="boardPending" class="flex items-center gap-2 text-muted">
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
          Ładowanie rankingu…
        </div>
        <div v-else-if="ranking.length === 0" class="text-sm text-muted">
          Brak zatwierdzonych wyników dla wybranego ćwiczenia.
        </div>
        <div v-else class="overflow-x-auto">
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
              <tr v-for="(row, idx) in ranking" :key="row.athlete_id" class="border-b border-default/60 align-top">
                <td class="py-2 pr-3 font-mono font-bold text-muted">{{ idx + 1 }}</td>
                <td class="py-2 px-3 font-medium text-highlighted">{{ row.athlete_name }}</td>
                <td class="py-2 px-3 text-right font-mono font-black text-primary">{{ row.best_value }} {{ row.unit }}</td>
                <td class="py-2 px-3 text-right font-mono text-muted">{{ row.entries }}</td>
                <td class="py-2 pl-3 font-mono text-xs text-muted">{{ row.last_performed_at || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UModal
        v-model:open="reviewOpen"
        :title="reviewMode === 'approve' ? 'Zatwierdź zgłoszenie' : 'Odrzuć zgłoszenie'"
        :ui="{ content: 'rounded-3xl sm:max-w-2xl' }"
      >
        <template #body>
          <div v-if="reviewing" class="space-y-4">
            <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ reviewing.athlete_name || reviewing.athlete_id }}
                </UBadge>
                <UBadge color="primary" variant="subtle" size="sm">
                  {{ reviewing.exercise_name }}
                </UBadge>
                <UBadge color="success" variant="subtle" size="sm" class="font-mono">
                  {{ reviewing.value }} {{ reviewing.unit }}
                </UBadge>
                <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
                  {{ reviewing.performed_at }}
                </UBadge>
              </div>
              <p v-if="reviewing.notes" class="mt-3 text-sm text-muted">
                <span class="font-semibold text-highlighted">Notatka zawodnika:</span>
                {{ reviewing.notes }}
              </p>
              <p v-else class="mt-3 text-sm text-muted">
                <span class="font-semibold text-highlighted">Notatka zawodnika:</span> —
              </p>
            </div>

            <UFormField
              :label="reviewMode === 'approve' ? 'Notatka do zawodnika (opcjonalnie)' : 'Powód odrzucenia (zalecane)'"
            >
              <UTextarea v-model="reviewNote" :rows="4" placeholder="Np. OK. Zatwierdzone. / Brak dowodu / Zła data / Podejrzana wartość…" />
            </UFormField>

            <div class="flex justify-end gap-2 pt-2">
              <UButton color="neutral" variant="outline" @click="reviewOpen = false">
                Anuluj
              </UButton>
              <UButton
                :color="reviewMode === 'approve' ? 'primary' : 'error'"
                :loading="reviewSaving"
                @click="submitReview"
              >
                {{ reviewMode === 'approve' ? 'Zatwierdź' : 'Odrzuć' }}
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </UContainer>
</template>
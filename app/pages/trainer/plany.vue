<script setup lang="ts">
import type { Athlete, TrainingPlan, TrainingPlanItem } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { trainerDiaryAthletePath } from '~/utils/slug'
import { formatPlanPeriod } from '~/utils/trainingPlanSchedule'

definePageMeta({ middleware: 'trainer' })

const apiFetch = useApi()
const toast = useToast()
const NO_ATHLETE = '__none__'

const { data: athletes } = await useAsyncData(
  'trainer-plans-athletes',
  () => apiFetch<Athlete[]>(apiRoutes.athletes.listAdmin).catch(() => [])
)

const selectedAthleteId = ref(NO_ATHLETE)
const plans = ref<TrainingPlan[]>([])
const loading = ref(false)
const saving = ref(false)
const editingPlanId = ref<string | null>(null)
const showAddModal = ref(false)
const showEditMetaModal = ref(false)
const metaSaving = ref(false)
const duplicatingPlanId = ref<string | null>(null)

const editingMeta = reactive<{
  id: string
  title: string
  goal: string
  week_start: string
  duration_weeks: number
  status: TrainingPlan['status']
  coach_note: string
}>({
  id: '',
  title: '',
  goal: '',
  week_start: new Date().toISOString().slice(0, 10),
  duration_weeks: 1,
  status: 'planned',
  coach_note: ''
})

const form = reactive({
  title: '',
  goal: '',
  week_start: new Date().toISOString().slice(0, 10),
  duration_weeks: 1,
  status: 'planned',
  coach_note: ''
})

async function loadPlans() {
  if (selectedAthleteId.value === NO_ATHLETE) {
    plans.value = []
    return
  }
  loading.value = true
  try {
    plans.value = await apiFetch<TrainingPlan[]>(`/api/training-plans/athlete/${selectedAthleteId.value}`).catch(() => [])
  } finally {
    loading.value = false
  }
}

async function createPlan() {
  if (!selectedAthleteId.value || !form.title.trim()) return
  saving.value = true
  try {
    await apiFetch('/api/training-plans', {
      method: 'POST',
      body: {
        athlete_id: selectedAthleteId.value,
        title: form.title,
        goal: form.goal || null,
        week_start: form.week_start,
        duration_weeks: form.duration_weeks,
        status: form.status,
        coach_note: form.coach_note || null
      }
    })
    toast.add({ title: 'Plan dodany', color: 'success' })
    showAddModal.value = false
    Object.assign(form, {
      title: '',
      goal: '',
      coach_note: '',
      status: 'planned'
    })
    await loadPlans()
  } catch {
    toast.add({ title: 'Błąd zapisu planu', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function removePlan(id: string) {
  if (!confirm('Czy na pewno chcesz usunąć ten plan?')) return
  try {
    await apiFetch(`/api/training-plans/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Plan usunięty', color: 'success' })
    await loadPlans()
  } catch {
    toast.add({ title: 'Błąd usuwania', color: 'error' })
  }
}

function openEditMeta(plan: TrainingPlan) {
  editingMeta.id = plan.id
  editingMeta.title = plan.title
  editingMeta.goal = plan.goal || ''
  editingMeta.week_start = plan.week_start
  editingMeta.duration_weeks = plan.duration_weeks ?? 1
  editingMeta.status = plan.status
  editingMeta.coach_note = plan.coach_note || ''
  showEditMetaModal.value = true
}

async function savePlanMeta() {
  if (!editingMeta.id || !editingMeta.title.trim()) return
  metaSaving.value = true
  try {
    await apiFetch(apiRoutes.trainingPlans.one(editingMeta.id), {
      method: 'PATCH',
      body: {
        title: editingMeta.title.trim(),
        goal: editingMeta.goal.trim() || null,
        week_start: editingMeta.week_start,
        duration_weeks: editingMeta.duration_weeks,
        status: editingMeta.status,
        coach_note: editingMeta.coach_note.trim() || null
      }
    })
    toast.add({ title: 'Zapisano plan', color: 'success' })
    showEditMetaModal.value = false
    await loadPlans()
  } catch (e) {
    toast.add({ title: 'Nie udało się zapisać', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    metaSaving.value = false
  }
}

async function duplicatePlan(plan: TrainingPlan) {
  if (!selectedAthleteId.value || selectedAthleteId.value === NO_ATHLETE) return
  duplicatingPlanId.value = plan.id
  try {
    const items = await apiFetch<TrainingPlanItem[]>(apiRoutes.trainingPlans.items(plan.id)).catch(() => [])
    const created = await apiFetch<TrainingPlan>(apiRoutes.trainingPlans.collection, {
      method: 'POST',
      body: {
        athlete_id: selectedAthleteId.value,
        title: `${plan.title} (kopia)`,
        goal: plan.goal || null,
        week_start: plan.week_start,
        duration_weeks: plan.duration_weeks ?? 1,
        status: plan.status,
        coach_note: plan.coach_note || null
      }
    })
    await apiFetch(apiRoutes.trainingPlans.items(created.id), {
      method: 'PUT',
      body: {
        items: (items || []).map(i => ({
          week_number: i.week_number ?? 1,
          day_of_week: i.day_of_week,
          exercise_id: i.exercise_id ?? null,
          custom_exercise_name: i.custom_exercise_name ?? '',
          sets: i.sets ?? null,
          reps: i.reps ?? null,
          intensity_percent: i.intensity_percent ?? null,
          weight_kg: i.weight_kg ?? null,
          notes: i.notes ?? '',
          sort_order: i.sort_order
        }))
      }
    })
    toast.add({ title: 'Utworzono kopię planu', color: 'success' })
    await loadPlans()
  } catch (e) {
    toast.add({ title: 'Nie udało się skopiować planu', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    duplicatingPlanId.value = null
  }
}

watch(selectedAthleteId, () => {
  void loadPlans()
})

const selectedAthleteMeta = computed(() => {
  const id = selectedAthleteId.value
  if (!id || id === NO_ATHLETE) return null
  return (athletes.value || []).find(a => a.id === id) ?? null
})

const editingPlan = computed(() => plans.value.find(p => p.id === editingPlanId.value) ?? null)

const planVsDiaryHref = computed(() => {
  const a = selectedAthleteMeta.value
  if (!a?.id || !a.full_name) return null
  return trainerDiaryAthletePath(a.full_name, a.id)
})

function diaryEntryForPlanHref(plan: TrainingPlan) {
  const a = selectedAthleteMeta.value
  if (!a?.id || !a.full_name) return null
  const base = `${trainerDiaryAthletePath(a.full_name, a.id)}/redaguj`
  const q = new URLSearchParams({
    plan_id: plan.id,
    plan_title: plan.title,
    session_date: plan.week_start.slice(0, 10)
  })
  return `${base}?${q.toString()}`
}
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Plany treningowe"
      icon="i-lucide-clipboard-list"
      description="Zarządzaj cyklami treningowymi swoich zawodników."
    />

    <!-- Toolbar -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/40 p-6 rounded-3xl border border-default">
      <div class="flex-1 max-w-md">
        <label class="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Zawodnik</label>
        <USelect
          v-model="selectedAthleteId"
          size="xl"
          icon="i-lucide-users"
          class="font-bold"
          :items="[{ label: '--- Wybierz zawodnika ---', value: NO_ATHLETE }, ...((athletes || []).map(a => ({ label: a.full_name, value: a.id })))]"
        />
      </div>
      
      <div v-if="selectedAthleteId !== NO_ATHLETE" class="flex gap-2">
        <UButton
          v-if="planVsDiaryHref"
          :to="planVsDiaryHref"
          icon="i-lucide-git-compare"
          size="xl"
          variant="soft"
          color="primary"
          class="rounded-2xl px-5"
        >
          Plan vs dziennik
        </UButton>
        <UButton 
          icon="i-lucide-plus" 
          size="xl" 
          class="rounded-2xl px-6 shadow-lg shadow-primary/20"
          @click="showAddModal = true"
        >
          Nowy plan
        </UButton>
      </div>
    </div>

    <SlaviaEditorSheet
      v-model:open="showAddModal"
      title="Nowy plan treningowy"
      size="lg"
      :prevent-close="saving"
      scroll-restore-key="trainer-plan-create"
    >
      <div class="space-y-6 py-2">
          <div class="mb-2">
            <p class="text-sm text-muted">Zdefiniuj parametry nowego cyklu treningowego.</p>
          </div>

          <div class="space-y-5">
            <UFormField label="Tytuł planu" help="Np. Faza akumulacji - Tydzień 1">
              <UInput v-model="form.title" placeholder="Wpisz nazwę planu..." size="xl" icon="i-lucide-heading" class="font-bold" />
            </UFormField>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <UFormField label="Data rozpoczęcia">
                <UInput v-model="form.week_start" type="date" size="xl" icon="i-lucide-calendar" />
              </UFormField>
              <UFormField label="Czas trwania (tygodnie)" help="1–52 tygodnie mikrocyklu">
                <UInput v-model.number="form.duration_weeks" type="number" :min="1" :max="52" size="xl" icon="i-lucide-calendar-range" />
              </UFormField>
              <UFormField label="Status">
                <SlaviaSheetSelect
                  v-model="form.status"
                  size="xl"
                  value-key="value"
                  :items="[
                    { label: 'Zaplanowany', value: 'planned' },
                    { label: 'Aktywny', value: 'active' },
                    { label: 'Wstrzymany', value: 'paused' },
                    { label: 'Zakończony', value: 'completed' }
                  ]"
                />
              </UFormField>
            </div>

            <UFormField label="Główny cel">
              <UInput v-model="form.goal" placeholder="Np. Poprawa stabilizacji w rwaniu" size="xl" icon="i-lucide-target" />
            </UFormField>

            <UFormField label="Notatka dla zawodnika">
              <UTextarea v-model="form.coach_note" placeholder="Dodaj instrukcje..." :rows="3" size="xl" />
            </UFormField>
          </div>

      </div>
      <template #footer>
        <div class="slavia-form-actions w-full">
          <UButton variant="soft" color="neutral" class="rounded-2xl font-bold" size="xl" @click="showAddModal = false">
            Anuluj
          </UButton>
          <UButton
            class="rounded-2xl font-black"
            size="xl"
            color="primary"
            :loading="saving"
            icon="i-lucide-save"
            @click="createPlan"
          >
            Zapisz plan
          </UButton>
        </div>
      </template>
    </SlaviaEditorSheet>

    <SlaviaEditorSheet
      v-model:open="showEditMetaModal"
      title="Edytuj plan"
      size="lg"
      :prevent-close="metaSaving"
      scroll-restore-key="trainer-plan-edit"
    >
      <div class="space-y-5 py-2">
          <UFormField label="Tytuł" required>
            <UInput v-model="editingMeta.title" size="xl" class="font-bold" />
          </UFormField>
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <UFormField label="Data rozpoczęcia">
              <UInput v-model="editingMeta.week_start" type="date" size="xl" />
            </UFormField>
            <UFormField label="Czas trwania (tygodnie)">
              <UInput v-model.number="editingMeta.duration_weeks" type="number" :min="1" :max="52" size="xl" />
            </UFormField>
            <UFormField label="Status">
              <SlaviaSheetSelect
                v-model="editingMeta.status"
                size="xl"
                value-key="value"
                :items="[
                  { label: 'Zaplanowany', value: 'planned' },
                  { label: 'Aktywny', value: 'active' },
                  { label: 'Wstrzymany', value: 'paused' },
                  { label: 'Zakończony', value: 'completed' }
                ]"
              />
            </UFormField>
          </div>
          <UFormField label="Cel (opcjonalnie)">
            <UInput v-model="editingMeta.goal" size="xl" />
          </UFormField>
          <UFormField label="Notatka trenera (opcjonalnie)">
            <UTextarea v-model="editingMeta.coach_note" :rows="3" size="xl" />
          </UFormField>

      </div>
      <template #footer>
        <div class="slavia-form-actions w-full">
          <UButton color="neutral" variant="outline" size="xl" class="rounded-2xl" @click="showEditMetaModal = false">
            Anuluj
          </UButton>
          <UButton color="primary" size="xl" class="rounded-2xl font-black" :loading="metaSaving" @click="savePlanMeta">
            Zapisz
          </UButton>
        </div>
      </template>
    </SlaviaEditorSheet>

    <!-- Content Area -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4 text-muted">
      <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-primary" />
      <p class="font-bold uppercase tracking-widest text-xs">Wczytywanie planów...</p>
    </div>

    <div v-else-if="editingPlanId" class="space-y-6 animate-page-in">
      <div class="flex items-center gap-4 bg-card/60 p-4 rounded-3xl border border-default">
        <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" class="rounded-xl" @click="editingPlanId = null">Wróć do listy</UButton>
        <div class="h-6 w-px bg-default mx-2" />
        <h2 class="text-xl font-black text-highlighted">Edycja jednostek planu</h2>
      </div>
      <TrainerTrainingPlanBuilder
        :plan-id="editingPlanId"
        :duration-weeks="editingPlan?.duration_weeks ?? 1"
      />
    </div>

    <div v-else class="space-y-4">
      <PublicEmptyState
        v-if="selectedAthleteId === NO_ATHLETE"
        icon="i-lucide-users"
        title="Wybierz zawodnika"
        description="Wskaż profil z listy powyżej, aby zarządzać planami treningowymi."
      />

      <template v-else>
        <div v-for="p in plans" :key="p.id" class="group relative bg-card hover:bg-card/80 border border-default hover:border-primary/30 p-6 rounded-3xl transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <UBadge :color="p.status === 'active' ? 'success' : 'neutral'" variant="soft" class="rounded-lg font-black uppercase text-[9px] tracking-widest">
                  {{ p.status }}
                </UBadge>
                <span class="text-xs text-muted font-bold tabular-nums">{{ formatPlanPeriod(p) }}</span>
              </div>
              <h3 class="text-xl font-black text-highlighted group-hover:text-primary transition-colors">{{ p.title }}</h3>
              <p v-if="p.goal" class="mt-2 text-sm text-muted line-clamp-2">{{ p.goal }}</p>
              
              <div class="mt-4 flex items-center gap-4">
                <div class="flex-1 max-w-[200px] h-1.5 bg-default rounded-full overflow-hidden">
                  <div class="h-full bg-primary transition-all duration-1000" :style="{ width: `${p.progress_percent}%` }" />
                </div>
                <span class="text-[10px] font-black text-muted uppercase tracking-tighter">{{ p.progress_percent }}% GOTOWE</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 shrink-0">
              <UButton
                v-if="diaryEntryForPlanHref(p)"
                :to="diaryEntryForPlanHref(p)!"
                size="lg"
                color="info"
                variant="soft"
                class="rounded-2xl px-5 font-bold"
                icon="i-lucide-book-marked"
              >
                Wpis do dziennika
              </UButton>
              <UButton 
                size="lg" 
                color="primary" 
                variant="soft" 
                class="rounded-2xl px-6 font-bold"
                icon="i-lucide-settings-2"
                @click="editingPlanId = p.id"
              >
                Jednostki
              </UButton>
              <UButton
                size="lg"
                color="neutral"
                variant="outline"
                class="rounded-2xl"
                icon="i-lucide-pencil"
                @click="openEditMeta(p)"
              />
              <UButton
                size="lg"
                color="neutral"
                variant="ghost"
                class="rounded-2xl"
                icon="i-lucide-copy"
                :loading="duplicatingPlanId === p.id"
                @click="duplicatePlan(p)"
              />
              <UButton 
                size="lg" 
                color="error" 
                variant="ghost" 
                class="rounded-2xl"
                icon="i-lucide-trash-2"
                @click="removePlan(p.id)"
              />
            </div>
          </div>
        </div>

        <PublicEmptyState
          v-if="plans.length === 0"
          icon="i-lucide-calendar-x"
          title="Brak planów treningowych"
          description="Utwórz pierwszy plan dla wybranego zawodnika."
        >
          <UButton color="primary" icon="i-lucide-plus" @click="showAddModal = true">
            Utwórz pierwszy plan
          </UButton>
        </PublicEmptyState>
      </template>
    </div>
  </PanelPageLayout>
</template>

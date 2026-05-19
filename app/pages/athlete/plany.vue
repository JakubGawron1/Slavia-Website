<script setup lang="ts">
import type { TrainingPlan, TrainingPlanItem } from '~/types/models'
definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Moje Plany Treningowe — Slavia',
  description: 'Przeglądaj swoje cykle treningowe, śledź postępy i realizuj wytyczne trenera.'
})

const apiFetch = useApi()
const toast = useToast()

const { data: plans, refresh, pending } = await useAsyncData(
  'athlete-my-plans',
  () => apiFetch<TrainingPlan[]>('/api/training-plans/my').catch(() => []),
  { default: () => [] }
)

const selectedPlanId = ref<string | null>(null)
const selectedPlanItems = ref<TrainingPlanItem[]>([])
const loadingItems = ref(false)

type PlanStatus = TrainingPlan['status']
const STATUS_META: Record<PlanStatus, { label: string, hint: string, color: 'neutral' | 'primary' | 'success' | 'warning' }> = {
  planned: { label: 'Zaplanowany', hint: 'Jeszcze nie zaczęty.', color: 'neutral' },
  active: { label: 'Aktywny', hint: 'W trakcie realizacji.', color: 'success' },
  paused: { label: 'Wstrzymany', hint: 'Tymczasowo przerwany.', color: 'warning' },
  completed: { label: 'Zakończony', hint: 'Ukończony.', color: 'primary' }
}

const draft = reactive<Record<string, { status: PlanStatus, progress_percent: number, athlete_note: string }>>({})
const savingId = ref<string | null>(null)

function draftFor(plan: TrainingPlan) {
  if (!draft[plan.id]) {
    draft[plan.id] = {
      status: plan.status,
      progress_percent: plan.progress_percent,
      athlete_note: plan.athlete_note || ''
    }
  }
  return draft[plan.id]!
}

function normalizeStatusForProgress(plan: TrainingPlan) {
  const d = draftFor(plan)
  // 100% => zakończony (zawsze)
  if ((d.progress_percent ?? 0) >= 100 && d.status !== 'completed') {
    d.status = 'completed'
    return
  }
  // >0% i planowany => aktywny (typowy przypadek)
  if ((d.progress_percent ?? 0) > 0 && d.status === 'planned') {
    d.status = 'active'
  }
}

function setDraftStatus(plan: TrainingPlan, next: PlanStatus) {
  const d = draftFor(plan)
  if (next === 'completed' && (d.progress_percent ?? 0) < 100) {
    toast.add({
      title: 'Aby zakończyć plan, ustaw 100% postępu',
      description: 'Zmień suwak „Postęp” na 100% (wtedy plan zostanie automatycznie oznaczony jako zakończony).',
      color: 'warning',
      icon: 'i-lucide-info'
    })
    return
  }
  d.status = next
}

watch(
  () => plans.value,
  (list) => {
    for (const p of list || []) {
      if (!draft[p.id]) {
        draft[p.id] = {
          status: p.status,
          progress_percent: p.progress_percent,
          athlete_note: p.athlete_note || ''
        }
      }
    }
  },
  { immediate: true }
)

async function loadPlanDetails(planId: string) {
  selectedPlanId.value = planId
  loadingItems.value = true
  try {
    const items = await apiFetch<TrainingPlanItem[]>(`/api/training-plans/${planId}/items`).catch(() => [])
    selectedPlanItems.value = items
  } finally {
    loadingItems.value = false
  }
}

async function saveProgress(id: string) {
  const payload = draft[id]
  if (!payload) return
  savingId.value = id
  try {
    await apiFetch(`/api/training-plans/${id}/my-progress`, {
      method: 'PATCH',
      body: payload
    })
    toast.add({ title: 'Postęp został zaktualizowany', color: 'success', icon: 'i-lucide-check' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Błąd zapisu postępu', description: String(e), color: 'error' })
  } finally {
    savingId.value = null
  }
}

const days = [
  { id: 1, name: 'Poniedziałek' },
  { id: 2, name: 'Wtorek' },
  { id: 3, name: 'Środa' },
  { id: 4, name: 'Czwartek' },
  { id: 5, name: 'Piątek' },
  { id: 6, name: 'Sobota' },
  { id: 7, name: 'Niedziela' }
]

function getItemsForDay(dayId: number) {
  return selectedPlanItems.value.filter(i => i.day_of_week === dayId).sort((a, b) => a.sort_order - b.sort_order)
}

const selectedPlan = computed(() => plans.value.find(p => p.id === selectedPlanId.value))

const activeDayId = ref<number>(1)

function dayOfWeekMon1(d: Date) {
  // JS: 0=Sun..6=Sat → chcemy 1=Mon..7=Sun
  const js = d.getDay()
  return js === 0 ? 7 : js
}

const isSelectedPlanCurrentWeek = computed(() => {
  const p = selectedPlan.value
  if (!p?.week_start) return false
  const start = new Date(`${p.week_start}T00:00:00`)
  if (Number.isNaN(start.getTime())) return false
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const now = new Date()
  return now >= start && now < end
})

const todayDayId = computed(() => dayOfWeekMon1(new Date()))

function setDefaultActiveDayForSelectedPlan() {
  activeDayId.value = isSelectedPlanCurrentWeek.value ? todayDayId.value : 1
}

watch(selectedPlanId, () => {
  setDefaultActiveDayForSelectedPlan()
})
</script>

<template>
  <div>
    <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="athlete"
      variant="hero"
      title="Moje plany"
      icon="i-lucide-clipboard-list"
      description="Wytyczne od trenera — realizuj treningi, zaznaczaj postępy i dbaj o formę."
    />

    <!-- Loading State -->
      <div v-if="pending && plans.length === 0" class="flex flex-col items-center justify-center py-20 gap-4">
        <UIcon name="i-lucide-loader-2" class="size-12 animate-spin text-primary/40" />
        <p class="text-sm font-bold text-muted uppercase tracking-widest">Wczytywanie planów...</p>
      </div>

      <!-- Plans List -->
      <div v-else class="grid gap-8 lg:grid-cols-12">
        <!-- Main List -->
        <div class="lg:col-span-12 space-y-6">
          <PublicEmptyState
            v-if="plans.length === 0"
            icon="i-lucide-calendar-x"
            title="Brak planów treningowych"
            description="Obecnie nie masz przypisanych planów — trener doda je w panelu kadry."
          />

          <div
            v-for="(p, idx) in plans"
            :key="p.id"
            class="group relative overflow-hidden bg-card/70 hover:bg-card/85 border border-default hover:border-primary/30 p-6 lg:p-8 rounded-4xl transition-all shadow-sm hover:shadow-2xl animate-page-in"
            :style="{ animationDelay: `${idx * 100}ms` }"
          >
            <div class="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/10 blur-3xl" />
            <div class="relative grid gap-6 lg:grid-cols-12">
              <!-- Left: summary -->
              <div class="lg:col-span-7 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    :color="STATUS_META[p.status].color"
                    variant="soft"
                    class="rounded-lg font-black uppercase text-[10px] tracking-widest px-3 py-1"
                    :title="STATUS_META[p.status].hint"
                  >
                    {{ STATUS_META[p.status].label }}
                  </UBadge>
                  <UBadge
                    color="neutral"
                    variant="soft"
                    class="rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1"
                    title="Tydzień startu planu"
                  >
                    <span class="inline-flex items-center gap-1">
                      <UIcon name="i-lucide-calendar" class="size-3.5" />
                      od {{ p.week_start }}
                    </span>
                  </UBadge>
                </div>

                <div class="mt-4">
                  <h3 class="text-2xl font-black text-highlighted group-hover:text-primary transition-colors wrap-break-word">
                    {{ p.title }}
                  </h3>
                  <p v-if="p.goal" class="mt-2 text-muted font-medium flex items-start gap-2">
                    <UIcon name="i-lucide-target" class="size-4 text-primary mt-0.5 shrink-0" />
                    <span class="wrap-break-word">{{ p.goal }}</span>
                  </p>
                </div>

                <!-- Progress -->
                <div class="mt-7 rounded-3xl border border-default/70 bg-background/50 p-5">
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black text-muted uppercase tracking-widest">Postęp</p>
                      <p class="text-sm font-bold text-muted mt-1">
                        {{ STATUS_META[draftFor(p).status].label }}
                        <span class="text-muted/60">•</span>
                        {{ draftFor(p).progress_percent }}%
                      </p>
                    </div>
                    <UButton
                      size="sm"
                      variant="soft"
                      color="neutral"
                      icon="i-lucide-eye"
                      class="rounded-2xl"
                      @click="loadPlanDetails(p.id)"
                    >
                      Szczegóły
                    </UButton>
                  </div>
                  <div class="mt-4 h-2.5 bg-default/10 rounded-full overflow-hidden p-0.5 border border-default/20">
                    <div
                      class="h-full bg-linear-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(var(--color-primary-500),0.3)]"
                      :style="{ width: `${draftFor(p).progress_percent || 0}%` }"
                    />
                  </div>
                  <div class="mt-3">
                    <UInput
                      v-model.number="draftFor(p).progress_percent"
                      type="range"
                      :min="0"
                      :max="100"
                      :step="5"
                      class="w-full h-2 accent-primary"
                      @update:model-value="normalizeStatusForProgress(p)"
                    />
                  </div>
                </div>
              </div>

              <!-- Right: actions/state -->
              <div class="lg:col-span-5">
                <div class="h-full rounded-3xl border border-default/70 bg-default/5 p-5 lg:p-6 space-y-5">
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black text-muted uppercase tracking-widest">Aktualny stan</p>
                      <p class="mt-1 text-sm font-bold text-muted wrap-break-word">
                        {{ STATUS_META[draftFor(p).status].hint }}
                      </p>
                    </div>
                    <UBadge
                      :color="STATUS_META[draftFor(p).status].color"
                      variant="soft"
                      class="rounded-lg font-black uppercase text-[10px] tracking-widest px-3 py-1"
                      :title="STATUS_META[draftFor(p).status].hint"
                    >
                      {{ STATUS_META[draftFor(p).status].label }}
                    </UBadge>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <UButton
                      v-for="s in (['planned','active','paused','completed'] as const)"
                      :key="s"
                      type="button"
                      size="sm"
                      :variant="draftFor(p).status === s ? 'soft' : 'outline'"
                      :color="draftFor(p).status === s ? STATUS_META[s].color : 'neutral'"
                      class="justify-center rounded-2xl font-black"
                      @click="setDraftStatus(p, s)"
                    >
                      {{ STATUS_META[s].label }}
                    </UButton>
                  </div>

                  <UFormField label="Notatka dla trenera (opcjonalnie)">
                    <UTextarea
                      v-model="draftFor(p).athlete_note"
                      :rows="3"
                      size="lg"
                      placeholder="Np. jak poszło, co było trudne, co boli…"
                    />
                  </UFormField>

                  <div class="flex gap-2 pt-1">
                    <UButton
                      size="xl"
                      color="primary"
                      class="flex-1 justify-center rounded-2xl font-black shadow-lg shadow-primary/10"
                      :loading="savingId === p.id"
                      @click="saveProgress(p.id)"
                    >
                      Zapisz
                    </UButton>
                    <UButton
                      size="xl"
                      variant="soft"
                      color="neutral"
                      class="rounded-2xl font-black"
                      title="Cofnij niezapisane zmiany"
                      @click="(draftFor(p).progress_percent = p.progress_percent, draftFor(p).status = p.status, draftFor(p).athlete_note = p.athlete_note || '')"
                    >
                      Cofnij
                    </UButton>
                  </div>

                  <p class="text-[11px] font-bold text-muted">
                    Auto: 100% → Zakończony, >0% → Aktywny
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelPageLayout>

    <!-- Plan Details Modal (Nuxt UI v4) -->
    <UModal
      :open="!!selectedPlanId" 
      :title="selectedPlan?.title || 'Szczegóły planu'"
      :ui="{ 
        content: 'rounded-4xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl',
      }"
      @update:open="(val) => !val && (selectedPlanId = null)"
    >
      <template #body>
        <div class="py-2">
          <div class="grid gap-8 lg:grid-cols-12">
            <!-- Main -->
            <div class="lg:col-span-8 space-y-6 min-w-0">
              <!-- Coach note -->
              <div
                v-if="selectedPlan?.coach_note"
                class="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex items-start gap-4"
              >
                <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-message-circle" class="size-6 text-primary" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Uwagi od trenera</p>
                  <p class="text-highlighted italic wrap-break-word">{{ selectedPlan.coach_note }}</p>
                </div>
              </div>

              <!-- Day tabs -->
              <div class="rounded-3xl border border-default bg-card/40 p-3 sm:p-4">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="d in days"
                    :key="d.id"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors"
                    :class="activeDayId === d.id
                      ? 'border-primary/35 bg-primary/10 text-primary'
                      : 'border-default/70 bg-background/60 text-muted hover:bg-muted/15 hover:text-highlighted'"
                    @click="activeDayId = d.id"
                  >
                    <span class="inline-flex size-6 items-center justify-center rounded-xl bg-muted/40 text-[10px] font-black text-muted-foreground">
                      {{ d.id }}
                    </span>
                    {{ d.name.slice(0, 3) }}
                    <span
                      v-if="isSelectedPlanCurrentWeek && todayDayId === d.id"
                      class="ml-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-black tracking-widest text-success"
                      title="Dzisiaj"
                    >
                      dziś
                    </span>
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div v-if="loadingItems" class="flex flex-col items-center justify-center py-16 gap-3">
                <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-primary/40" />
                <p class="text-xs font-bold text-muted uppercase tracking-widest">Wczytywanie jednostek…</p>
              </div>

              <div v-else class="space-y-4">
                <div class="flex items-center justify-between px-2">
                  <div class="flex items-center gap-3">
                    <div class="size-2 rounded-full bg-primary" />
                    <h4 class="text-lg font-black text-highlighted uppercase tracking-tight">
                      {{ days.find(d => d.id === activeDayId)?.name || 'Dzień' }}
                    </h4>
                  </div>
                  <span class="text-[10px] font-black text-muted uppercase tracking-widest">
                    {{ getItemsForDay(activeDayId).length }} ćwiczeń
                  </span>
                </div>

                <div v-if="getItemsForDay(activeDayId).length === 0" class="rounded-3xl border-2 border-dashed border-default/70 bg-muted/10 p-10 text-center">
                  <UIcon name="i-lucide-calendar-x" class="mx-auto mb-3 size-10 text-muted/30" />
                  <p class="text-sm font-bold text-muted">Brak zaplanowanych ćwiczeń na ten dzień.</p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="item in getItemsForDay(activeDayId)"
                    :key="item.id"
                    class="group rounded-3xl border border-default bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
                  >
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="inline-flex size-6 items-center justify-center rounded-xl bg-muted/40 text-[10px] font-black text-muted-foreground">
                            {{ item.sort_order + 1 }}
                          </span>
                          <h5 class="truncate text-lg font-black text-highlighted group-hover:text-primary transition-colors">
                            {{ item.exercise_name || item.custom_exercise_name || 'Ćwiczenie' }}
                          </h5>
                        </div>
                        <p v-if="item.notes" class="mt-1 text-sm text-muted italic">
                          {{ item.notes }}
                        </p>
                      </div>

                      <div class="flex flex-wrap items-center gap-2 rounded-2xl border border-default/60 bg-default/5 px-4 py-3">
                        <div class="text-center">
                          <p class="text-[9px] font-black text-muted uppercase tracking-tighter mb-0.5">Serie</p>
                          <p class="text-xl font-black text-primary leading-none">{{ item.sets || '—' }}</p>
                        </div>
                        <div class="text-center border-l border-default/50 pl-4">
                          <p class="text-[9px] font-black text-muted uppercase tracking-tighter mb-0.5">Powt.</p>
                          <p class="text-xl font-black text-primary leading-none">{{ item.reps || '—' }}</p>
                        </div>
                        <div class="text-center border-l border-default/50 pl-4 min-w-[64px]">
                          <p class="text-[9px] font-black text-muted uppercase tracking-tighter mb-0.5">Ciężar</p>
                          <p class="text-xl font-black text-blue-500 leading-none">{{ item.weight_kg ? `${item.weight_kg}kg` : '—' }}</p>
                        </div>
                        <div class="text-center border-l border-default/50 pl-4 min-w-[56px]">
                          <p class="text-[9px] font-black text-muted uppercase tracking-tighter mb-0.5">Intens.</p>
                          <p class="text-xl font-black text-purple-500 leading-none">{{ item.intensity_percent ? `${item.intensity_percent}%` : '—' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sticky sidebar -->
            <aside class="lg:col-span-4">
              <div class="lg:sticky lg:top-6 rounded-3xl border border-default bg-card/40 p-6 space-y-5">
                <div class="space-y-1">
                  <p class="text-[10px] font-black text-muted uppercase tracking-widest">Plan</p>
                  <p class="text-lg font-black text-highlighted leading-tight">{{ selectedPlan?.title || '—' }}</p>
                  <p class="text-xs text-muted font-bold flex items-center gap-2">
                    <UIcon name="i-lucide-calendar" class="size-3.5" />
                    od {{ selectedPlan?.week_start || '—' }}
                  </p>
                </div>

                <div class="rounded-2xl border border-default/60 bg-background/60 p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black text-muted uppercase tracking-widest">Postęp</span>
                    <span class="text-sm font-black text-primary">{{ selectedPlan?.progress_percent ?? 0 }}%</span>
                  </div>
                  <div class="mt-2 h-2 bg-default/10 rounded-full overflow-hidden p-0.5 border border-default/20">
                    <div
                      class="h-full bg-linear-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                      :style="{ width: `${selectedPlan?.progress_percent ?? 0}%` }"
                    />
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UBadge
                    :color="selectedPlan?.status === 'active' ? 'success' : (selectedPlan?.status === 'paused' ? 'warning' : 'neutral')"
                    variant="soft"
                    class="rounded-xl font-black uppercase tracking-widest text-[10px]"
                  >
                    {{ selectedPlan?.status || '—' }}
                  </UBadge>
                  <UBadge v-if="isSelectedPlanCurrentWeek" color="primary" variant="subtle" class="rounded-xl font-black uppercase tracking-widest text-[10px]">
                    bieżący tydzień
                  </UBadge>
                </div>

                <div class="flex flex-col gap-2 border-t border-default/60 pt-4">
                  <UButton size="lg" color="neutral" variant="soft" class="rounded-2xl font-bold" @click="selectedPlanId = null">
                    Zamknij
                  </UButton>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
@keyframes page-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-page-in {
  animation: page-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
</style>

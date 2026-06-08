<script setup lang="ts">
import type { TrainingPlan, TrainingPlanItem } from '~/types/models'
import {
  TRAINING_PLAN_DAYS,
  defaultWeekAndDay,
  filterPlanItems,
  formatPlanPeriod,
  isDateInPlanRange,
  planDurationWeeks,
  weekLabels
} from '~/utils/trainingPlanSchedule'
import { isProbablyRichHtml, stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'

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

const planItemsById = ref<Record<string, TrainingPlanItem[]>>({})
const loadingItemsFor = ref<Set<string>>(new Set())
const scheduleByPlanId = ref<Record<string, { weekNumber: number, dayId: number }>>({})
const progressOpenById = ref<Record<string, boolean>>({})
const noteOpenById = ref<Record<string, boolean>>({})
const noteEditorPlanId = ref<string | null>(null)
const noteEditorHtml = ref('<p></p>')
const noteEditorPreview = ref(false)
const noteEditorSaving = ref(false)

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

function scheduleFor(plan: TrainingPlan) {
  if (!scheduleByPlanId.value[plan.id]) {
    const defaults = defaultWeekAndDay(plan)
    scheduleByPlanId.value[plan.id] = defaults
  }
  return scheduleByPlanId.value[plan.id]!
}

function setSchedule(plan: TrainingPlan, weekNumber?: number, dayId?: number) {
  const current = scheduleFor(plan)
  scheduleByPlanId.value[plan.id] = {
    weekNumber: weekNumber ?? current.weekNumber,
    dayId: dayId ?? current.dayId
  }
}

function normalizeStatusForProgress(plan: TrainingPlan) {
  const d = draftFor(plan)
  if ((d.progress_percent ?? 0) >= 100 && d.status !== 'completed') {
    d.status = 'completed'
    return
  }
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
      scheduleByPlanId.value[p.id] = defaultWeekAndDay(p)
      progressOpenById.value[p.id] = progressOpenById.value[p.id] ?? false
    }
    void loadAllPlanItems(list || [])
  },
  { immediate: true }
)

async function loadPlanItems(planId: string) {
  if (planItemsById.value[planId] || loadingItemsFor.value.has(planId)) return
  loadingItemsFor.value.add(planId)
  try {
    const items = await apiFetch<TrainingPlanItem[]>(`/api/training-plans/${planId}/items`).catch(() => [])
    planItemsById.value[planId] = items
  } finally {
    loadingItemsFor.value.delete(planId)
  }
}

async function loadAllPlanItems(list: TrainingPlan[]) {
  await Promise.all(list.map(p => loadPlanItems(p.id)))
}

function itemsForPlanSlot(plan: TrainingPlan) {
  const items = planItemsById.value[plan.id] || []
  const { weekNumber, dayId } = scheduleFor(plan)
  return filterPlanItems(items, weekNumber, dayId)
}

function isPlanInProgress(plan: TrainingPlan) {
  return isDateInPlanRange(plan)
}

function noteToEditorHtml(raw: string | null | undefined): string {
  const t = String(raw ?? '').trim()
  if (!t) return '<p></p>'
  if (isProbablyRichHtml(t)) return t
  const escaped = t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<p>${escaped.replace(/\n/g, '<br>')}</p>`
}

function sanitizedAthleteNote(raw: string | null | undefined): string {
  return sanitizeRichHtml(String(raw ?? '').trim())
}

function hasAthleteNote(raw: string | null | undefined): boolean {
  return !!stripHtmlTags(sanitizedAthleteNote(raw))
}

function noteExcerpt(raw: string | null | undefined, maxLen = 120): string {
  const plain = stripHtmlTags(sanitizedAthleteNote(raw))
  if (plain.length <= maxLen) return plain
  return `${plain.slice(0, maxLen).trim()}…`
}

const noteEditorOpen = computed({
  get: () => noteEditorPlanId.value !== null,
  set: (open: boolean) => {
    if (!open) closeNoteEditor()
  }
})

const noteEditorPlan = computed(() =>
  plans.value.find(p => p.id === noteEditorPlanId.value) ?? null
)

const noteEditorPreviewHtml = computed(() => sanitizeRichHtml(noteEditorHtml.value.trim()))

function openNoteEditor(plan: TrainingPlan) {
  noteEditorPlanId.value = plan.id
  noteEditorHtml.value = noteToEditorHtml(draftFor(plan).athlete_note || plan.athlete_note)
  noteEditorPreview.value = false
  noteOpenById.value[plan.id] = true
}

function closeNoteEditor() {
  noteEditorPlanId.value = null
  noteEditorHtml.value = '<p></p>'
  noteEditorPreview.value = false
}

async function saveProgress(id: string, toastTitle = 'Postęp został zaktualizowany'): Promise<boolean> {
  const payload = draft[id]
  if (!payload) return false
  savingId.value = id
  try {
    const note = sanitizedAthleteNote(payload.athlete_note)
    await apiFetch(`/api/training-plans/${id}/my-progress`, {
      method: 'PATCH',
      body: {
        ...payload,
        athlete_note: stripHtmlTags(note) ? note : null
      }
    })
    toast.add({ title: toastTitle, color: 'success', icon: 'i-lucide-check' })
    await refresh()
    return true
  } catch (e) {
    toast.add({ title: 'Błąd zapisu', description: String(e), color: 'error' })
    return false
  } finally {
    savingId.value = null
  }
}

function toggleProgress(planId: string) {
  progressOpenById.value[planId] = !progressOpenById.value[planId]
}

function toggleNote(planId: string) {
  noteOpenById.value[planId] = !noteOpenById.value[planId]
}

async function saveNoteFromEditor() {
  const plan = noteEditorPlan.value
  if (!plan) return
  draftFor(plan).athlete_note = sanitizedAthleteNote(noteEditorHtml.value)
  noteEditorSaving.value = true
  try {
    const ok = await saveProgress(plan.id, 'Notatka została zapisana')
    if (ok) closeNoteEditor()
  } finally {
    noteEditorSaving.value = false
  }
}

function exerciseName(item: TrainingPlanItem) {
  return item.exercise_name || item.custom_exercise_name || 'Ćwiczenie'
}
</script>

<template>
  <div>
    <PanelPageLayout padding="compact">
      <PanelPageHeader
        area="athlete"
        variant="hero"
        title="Moje plany"
        icon="i-lucide-clipboard-list"
        description="Ćwiczenia na dziś — realizuj wytyczne trenera i oznaczaj postęp."
      />

      <div v-if="pending && plans.length === 0" class="flex flex-col items-center justify-center py-20 gap-4">
        <UIcon name="i-lucide-loader-2" class="size-12 animate-spin text-primary/40" />
        <p class="text-sm font-bold text-muted uppercase tracking-widest">Wczytywanie planów...</p>
      </div>

      <div v-else class="space-y-8">
        <PublicEmptyState
          v-if="plans.length === 0"
          icon="i-lucide-calendar-x"
          title="Brak planów treningowych"
          description="Obecnie nie masz przypisanych planów — trener doda je w panelu kadry."
        />

        <article
          v-for="(p, idx) in plans"
          :key="p.id"
          class="group relative overflow-hidden rounded-4xl border border-default bg-card/70 shadow-sm transition-all hover:border-primary/25 hover:shadow-xl animate-page-in"
          :style="{ animationDelay: `${idx * 80}ms` }"
        >
          <div class="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-primary/8 blur-3xl" />

          <!-- Nagłówek planu — kompaktowy -->
          <header class="relative border-b border-default/60 px-5 py-4 lg:px-8 lg:py-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    :color="STATUS_META[p.status].color"
                    variant="soft"
                    class="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                  >
                    {{ STATUS_META[p.status].label }}
                  </UBadge>
                  <UBadge
                    v-if="isPlanInProgress(p)"
                    color="primary"
                    variant="subtle"
                    class="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                  >
                    w trakcie
                  </UBadge>
                </div>
                <h2 class="mt-2 text-xl font-black text-highlighted wrap-break-word lg:text-2xl">
                  {{ p.title }}
                </h2>
                <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted">
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-calendar-range" class="size-3.5" />
                    {{ formatPlanPeriod(p) }}
                  </span>
                  <span v-if="p.goal" class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-target" class="size-3.5 text-primary" />
                    {{ p.goal }}
                  </span>
                </p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-black uppercase tracking-widest text-muted">Postęp</p>
                <p class="text-2xl font-black text-primary">{{ draftFor(p).progress_percent }}%</p>
              </div>
            </div>

            <div
              v-if="p.coach_note"
              class="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
            >
              <UIcon name="i-lucide-message-circle" class="mt-0.5 size-5 shrink-0 text-primary" />
              <p class="text-sm italic text-highlighted wrap-break-word">{{ p.coach_note }}</p>
            </div>
          </header>

          <!-- ĆWICZENIA — główna sekcja -->
          <section class="relative px-5 py-6 lg:px-8 lg:py-8">
            <div class="mb-5 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-dumbbell" class="size-5 text-primary" />
                <h3 class="text-sm font-black uppercase tracking-widest text-highlighted">Trening</h3>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-muted">
                {{ itemsForPlanSlot(p).length }} ćwiczeń
              </span>
            </div>

            <div
              v-if="planDurationWeeks(p) > 1"
              class="mb-4 rounded-2xl border border-default/70 bg-background/50 p-3"
            >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="w in weekLabels(planDurationWeeks(p))"
                  :key="w.id"
                  type="button"
                  class="inline-flex items-center rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors"
                  :class="scheduleFor(p).weekNumber === w.id
                    ? 'border-primary/35 bg-primary/10 text-primary'
                    : 'border-default/70 text-muted hover:bg-muted/15'"
                  @click="setSchedule(p, w.id)"
                >
                  {{ w.label }}
                </button>
              </div>
            </div>

            <div class="mb-5 rounded-2xl border border-default/70 bg-background/40 p-2 sm:p-3">
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="d in TRAINING_PLAN_DAYS"
                  :key="d.id"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors"
                  :class="scheduleFor(p).dayId === d.id
                    ? 'border-primary/35 bg-primary/10 text-primary'
                    : 'border-default/70 text-muted hover:bg-muted/15'"
                  @click="setSchedule(p, undefined, d.id)"
                >
                  <span class="inline-flex size-5 items-center justify-center rounded-lg bg-muted/40 text-[9px]">{{ d.id }}</span>
                  {{ d.short }}
                  <span
                    v-if="isPlanInProgress(p) && d.id === defaultWeekAndDay(p).dayId"
                    class="rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] text-success"
                  >
                    dziś
                  </span>
                </button>
              </div>
            </div>

            <div v-if="loadingItemsFor.has(p.id)" class="flex flex-col items-center justify-center gap-3 py-12">
              <UIcon name="i-lucide-loader-2" class="size-9 animate-spin text-primary/40" />
              <p class="text-xs font-bold uppercase tracking-widest text-muted">Wczytywanie ćwiczeń…</p>
            </div>

            <div v-else-if="itemsForPlanSlot(p).length === 0" class="rounded-3xl border-2 border-dashed border-default/70 bg-muted/10 px-6 py-12 text-center">
              <UIcon name="i-lucide-calendar-x" class="mx-auto mb-3 size-10 text-muted/30" />
              <p class="text-sm font-bold text-muted">Brak ćwiczeń na wybrany dzień.</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="item in itemsForPlanSlot(p)"
                :key="item.id"
                class="rounded-3xl border border-default bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start gap-3">
                      <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                        {{ item.sort_order + 1 }}
                      </span>
                      <div class="min-w-0">
                        <h4 class="text-xl font-black text-highlighted wrap-break-word lg:text-2xl">
                          {{ exerciseName(item) }}
                        </h4>
                        <p v-if="item.notes" class="mt-1 text-sm italic text-muted wrap-break-word">
                          {{ item.notes }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="flex shrink-0 flex-wrap items-center gap-3 rounded-2xl border border-default/60 bg-default/5 px-4 py-3 lg:gap-4">
                    <div class="min-w-[52px] text-center">
                      <p class="text-[9px] font-black uppercase tracking-tighter text-muted">Serie</p>
                      <p class="text-2xl font-black leading-none text-primary">{{ item.sets || '—' }}</p>
                    </div>
                    <div class="min-w-[52px] border-l border-default/50 pl-3 text-center">
                      <p class="text-[9px] font-black uppercase tracking-tighter text-muted">Powt.</p>
                      <p class="text-2xl font-black leading-none text-primary">{{ item.reps || '—' }}</p>
                    </div>
                    <div class="min-w-[64px] border-l border-default/50 pl-3 text-center">
                      <p class="text-[9px] font-black uppercase tracking-tighter text-muted">Ciężar</p>
                      <p class="text-2xl font-black leading-none text-blue-500">{{ item.weight_kg ? `${item.weight_kg}kg` : '—' }}</p>
                    </div>
                    <div class="min-w-[56px] border-l border-default/50 pl-3 text-center">
                      <p class="text-[9px] font-black uppercase tracking-tighter text-muted">Intens.</p>
                      <p class="text-2xl font-black leading-none text-purple-500">{{ item.intensity_percent ? `${item.intensity_percent}%` : '—' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Notatka dla trenera -->
          <footer class="border-t border-default/60 bg-default/5 px-5 py-4 lg:px-8">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left"
              @click="toggleNote(p.id)"
            >
              <span class="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                <UIcon name="i-lucide-notebook-pen" class="size-4 text-primary" />
                Notatka dla trenera
              </span>
              <UIcon
                :name="noteOpenById[p.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-4 text-muted"
              />
            </button>

            <div v-if="noteOpenById[p.id]" class="mt-4 space-y-4 border-t border-default/40 pt-4">
              <div
                v-if="hasAthleteNote(draftFor(p).athlete_note)"
                class="rounded-2xl border border-default/60 bg-card/60 p-4"
              >
                <!-- eslint-disable vue/no-v-html — sanitizeRichHtml (DOMPurify) -->
                <div
                  v-if="isProbablyRichHtml(draftFor(p).athlete_note)"
                  class="slavia-rich-content prose prose-sm prose-neutral max-w-none leading-relaxed dark:prose-invert"
                  v-html="sanitizedAthleteNote(draftFor(p).athlete_note)"
                />
                <!-- eslint-enable vue/no-v-html -->
                <p v-else class="text-sm text-highlighted leading-relaxed">
                  {{ noteExcerpt(draftFor(p).athlete_note, 500) }}
                </p>
              </div>
              <p v-else class="text-sm font-medium text-muted">
                Opisz trenerowi, jak poszedł trening — z formatowaniem, listami i wyróżnieniami.
              </p>

              <UButton
                size="lg"
                color="primary"
                variant="soft"
                icon="i-lucide-pencil-line"
                class="w-full justify-center rounded-2xl font-black sm:w-auto"
                @click="openNoteEditor(p)"
              >
                {{ hasAthleteNote(draftFor(p).athlete_note) ? 'Edytuj notatkę' : 'Napisz notatkę' }}
              </UButton>
            </div>
          </footer>

          <!-- Postęp — zwinięty -->
          <footer class="border-t border-default/60 bg-default/5 px-5 py-4 lg:px-8">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 text-left"
              @click="toggleProgress(p.id)"
            >
              <span class="text-[10px] font-black uppercase tracking-widest text-muted">
                Postęp realizacji planu
              </span>
              <UIcon
                :name="progressOpenById[p.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-4 text-muted"
              />
            </button>

            <div v-if="progressOpenById[p.id]" class="mt-4 space-y-4 border-t border-default/40 pt-4">
              <div class="h-2 overflow-hidden rounded-full border border-default/20 bg-default/10 p-0.5">
                <div
                  class="h-full rounded-full bg-linear-to-r from-primary to-primary/60 transition-all duration-700"
                  :style="{ width: `${draftFor(p).progress_percent || 0}%` }"
                />
              </div>
              <UInput
                v-model.number="draftFor(p).progress_percent"
                type="range"
                :min="0"
                :max="100"
                :step="5"
                class="h-2 w-full accent-primary"
                @update:model-value="normalizeStatusForProgress(p)"
              />

              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <UButton
                  v-for="s in (['planned','active','paused','completed'] as const)"
                  :key="s"
                  type="button"
                  size="sm"
                  :variant="draftFor(p).status === s ? 'soft' : 'outline'"
                  :color="draftFor(p).status === s ? STATUS_META[s].color : 'neutral'"
                  class="justify-center rounded-xl font-black"
                  @click="setDraftStatus(p, s)"
                >
                  {{ STATUS_META[s].label }}
                </UButton>
              </div>

              <div class="flex gap-2">
                <UButton
                  color="primary"
                  class="flex-1 justify-center rounded-2xl font-black"
                  :loading="savingId === p.id"
                  @click="saveProgress(p.id)"
                >
                  Zapisz postęp
                </UButton>
                <UButton
                  variant="soft"
                  color="neutral"
                  class="rounded-2xl font-black"
                  @click="(draftFor(p).progress_percent = p.progress_percent, draftFor(p).status = p.status)"
                >
                  Cofnij
                </UButton>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </PanelPageLayout>

    <SlaviaEditorSheet
      v-model:open="noteEditorOpen"
      :title="noteEditorPlan ? `Notatka — ${noteEditorPlan.title}` : 'Notatka dla trenera'"
      size="xl"
      :prevent-close="noteEditorSaving"
      scroll-restore-key="athlete-plan-note"
    >
      <div class="space-y-5 py-2">
        <p class="text-sm text-muted">
          Pełny edytor treści — jak przy wpisie na blogu lub w dzienniku treningowym.
        </p>

        <div class="flex flex-wrap gap-2">
          <UButton
            size="sm"
            :variant="noteEditorPreview ? 'solid' : 'soft'"
            :color="noteEditorPreview ? 'primary' : 'neutral'"
            icon="i-lucide-eye"
            class="rounded-xl font-bold"
            @click="noteEditorPreview = true"
          >
            Podgląd
          </UButton>
          <UButton
            size="sm"
            :variant="!noteEditorPreview ? 'solid' : 'soft'"
            :color="!noteEditorPreview ? 'primary' : 'neutral'"
            icon="i-lucide-pencil-line"
            class="rounded-xl font-bold"
            @click="noteEditorPreview = false"
          >
            Edycja
          </UButton>
        </div>

        <UCard
          v-if="noteEditorPreview"
          class="rounded-2xl border border-default/70"
        >
          <div class="p-4 sm:p-6">
            <!-- eslint-disable vue/no-v-html — sanitizeRichHtml (DOMPurify) -->
            <div
              v-if="stripHtmlTags(noteEditorPreviewHtml)"
              class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert"
              v-html="noteEditorPreviewHtml"
            />
            <!-- eslint-enable vue/no-v-html -->
            <p v-else class="text-sm italic text-muted">
              Notatka jest pusta — wróć do edycji i dodaj treść.
            </p>
          </div>
        </UCard>

        <UFormField
          v-else
          label="Treść notatki"
          description="Opisz przebieg tygodnia, trudności, ból, samopoczucie — trener zobaczy sformatowaną treść."
        >
          <ClubRichTextEditor
            v-model="noteEditorHtml"
            placeholder="Np. jak poszło, co było trudne, co boli…"
            min-height="min(60vh, 520px)"
            class="w-full"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="slavia-form-actions w-full">
          <UButton
            variant="soft"
            color="neutral"
            size="xl"
            class="rounded-2xl font-bold"
            :disabled="noteEditorSaving"
            @click="closeNoteEditor"
          >
            Anuluj
          </UButton>
          <UButton
            color="primary"
            size="xl"
            class="rounded-2xl font-black"
            icon="i-lucide-save"
            :loading="noteEditorSaving"
            @click="saveNoteFromEditor"
          >
            Zapisz notatkę
          </UButton>
        </div>
      </template>
    </SlaviaEditorSheet>
  </div>
</template>

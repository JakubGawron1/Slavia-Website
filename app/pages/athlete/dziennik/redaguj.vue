<script setup lang="ts">
import type { Athlete, TrainingLogEntry, TrainingPlan, TrainingPlanItem } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import { stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'

definePageMeta({
  middleware: 'athlete-dziennik',
  layout: false
})

const route = useRoute()
const apiFetch = useApi()
const toast = useToast()
const auth = useAuth()

const wpisId = computed(() => String(route.query.wpis || '').trim())
const diaryListPath = '/athlete/dziennik'

function isEntryMine(e: TrainingLogEntry) {
  const uid = auth.user.value?.id
  return !!uid && e.author_user_id === uid
}

const { data: meAthlete } = await useAsyncData(
  'athlete-diary-compose-me',
  async (): Promise<Athlete | null> => apiFetch<Athlete>('/api/athletes/me').catch(() => null)
)

const athleteId = computed(() => meAthlete.value?.id ?? '')
const athleteName = computed(() => meAthlete.value?.full_name ?? 'Zawodnik')

const entries = ref<TrainingLogEntry[]>([])
const loading = ref(true)

async function loadEntries() {
  const aid = athleteId.value
  if (!aid) {
    entries.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    entries.value = await apiFetch<TrainingLogEntry[]>(`/api/athletes/${aid}/training-log`)
  } catch (e) {
    entries.value = []
    toast.add({
      title: 'Nie udało się wczytać wpisów',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
  if (wpisId.value) {
    applyEntryToForm(wpisId.value)
  }
}

watch(athleteId, () => loadEntries(), { immediate: true })

const form = reactive({
  session_date: new Date().toISOString().slice(0, 10),
  title: '',
  notes: '<p></p>'
})

const saving = ref(false)
const previewOpen = ref(false)

const sanitizedNotesPreview = computed(() => sanitizeRichHtml(form.notes.trim()))

/** Tylko przy edycji istniejącego wpisu — nie wołać przy samej zmianie listy, bo wtedy kasuje się treść „nowego wpisu” podczas ładowania `/api/athletes/me` + training-log. */
function applyEntryToForm(id: string) {
  const e = entries.value.find(x => x.id === id)
  if (!e) {
    return
  }
  form.session_date = e.session_date.slice(0, 10)
  form.title = e.title || ''
  form.notes = e.notes
}

watch(wpisId, (id) => {
  if (!id) {
    form.session_date = new Date().toISOString().slice(0, 10)
    form.title = ''
    form.notes = '<p></p>'
    return
  }
  applyEntryToForm(id)
}, { immediate: true })

const pageTitle = computed(() => (wpisId.value ? 'Edycja wpisu' : 'Nowy wpis'))

async function save() {
  const aid = athleteId.value
  if (!aid) {
    toast.add({ title: 'Brak profilu zawodnika', color: 'warning' })
    return
  }

  const notes = sanitizeRichHtml(form.notes.trim())
  if (!stripHtmlTags(notes)) {
    toast.add({ title: 'Uzupełnij treść wpisu', color: 'warning' })
    return
  }

  if (wpisId.value) {
    const entry = entries.value.find(x => x.id === wpisId.value)
    if (!entry) {
      toast.add({ title: 'Nie znaleziono wpisu', color: 'error' })
      return
    }
    if (!isEntryMine(entry)) {
      toast.add({
        title: 'Brak uprawnień',
        description: 'Możesz edytować tylko wpisy, które sam utworzyłeś.',
        color: 'warning'
      })
      return
    }
  }

  saving.value = true
  try {
    if (wpisId.value) {
      await apiFetch(`/api/athletes/${aid}/training-log/${wpisId.value}`, {
        method: 'PATCH',
        body: {
          session_date: form.session_date,
          title: form.title.trim(),
          notes
        }
      })
      toast.add({ title: 'Zapisano', color: 'success' })
    } else {
      await apiFetch(`/api/athletes/${aid}/training-log`, {
        method: 'POST',
        body: {
          session_date: form.session_date,
          title: form.title.trim() || undefined,
          notes
        }
      })
      toast.add({ title: 'Dodano wpis', color: 'success' })
    }
    await navigateTo(diaryListPath)
  } catch (e) {
    toast.add({
      title: 'Błąd zapisu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function cancel() {
  void navigateTo(diaryListPath)
}

const { data: activePlans } = await useAsyncData(
  'athlete-active-plans',
  () => apiFetch<TrainingPlan[]>('/api/training-plans/my?status=active').catch(() => []),
  { default: () => [] }
)

const activePlan = computed(() => activePlans.value?.[0] || null)
const planItems = ref<TrainingPlanItem[]>([])
const loadingPlan = ref(false)

async function loadPlanItems() {
  if (!activePlan.value) return
  loadingPlan.value = true
  try {
    planItems.value = await apiFetch<TrainingPlanItem[]>(`/api/training-plans/${activePlan.value.id}/items`).catch(() => [])
  } finally {
    loadingPlan.value = false
  }
}

watch(activePlan, (p) => { if (p) loadPlanItems() }, { immediate: true })

const dayOfWeek = computed(() => {
  const d = new Date(form.session_date)
  if (isNaN(d.getTime())) return 1
  const day = d.getDay()
  return day === 0 ? 7 : day
})

const itemsForDay = computed(() => planItems.value.filter(i => i.day_of_week === dayOfWeek.value).sort((a, b) => a.sort_order - b.sort_order))

const days = [
  { id: 1, name: 'Poniedziałek' },
  { id: 2, name: 'Wtorek' },
  { id: 3, name: 'Środa' },
  { id: 4, name: 'Czwartek' },
  { id: 5, name: 'Piątek' },
  { id: 6, name: 'Sobota' },
  { id: 7, name: 'Niedziela' }
]

function insertExercise(item: TrainingPlanItem) {
  const name = item.exercise_name || item.custom_exercise_name || 'Ćwiczenie'
  const details = [
    item.sets ? `${item.sets} serii` : '',
    item.reps ? `${item.reps} powt.` : '',
    item.weight_kg ? `${item.weight_kg}kg` : '',
    item.intensity_percent ? `${item.intensity_percent}%` : ''
  ].filter(Boolean).join(' x ')
  
  const html = `<p><strong>✅ ${name}</strong>: ${details}</p>`
  form.notes = (form.notes || '') + html
  toast.add({ title: 'Dodano do wpisu', color: 'success', icon: 'i-lucide-check' })
}

useSeoMeta({
  title: 'Dziennik — redakcja wpisu',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="slavia-diary-compose flex min-h-[100dvh] flex-col bg-background">
    <header class="sticky top-0 z-50 border-b border-default/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-wider text-primary">
            Twój dziennik · {{ athleteName }}
          </p>
          <h1 class="truncate text-lg font-bold text-highlighted">
            {{ pageTitle }}
          </h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-x"
            @click="cancel"
          >
            Zamknij
          </UButton>
          <UButton
            v-if="previewOpen"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-pencil"
            @click="previewOpen = false"
          >
            Edycja
          </UButton>
          <UButton
            v-else
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-eye"
            @click="previewOpen = true"
          >
            Podgląd
          </UButton>
          <UButton
            size="sm"
            :loading="saving"
            icon="i-lucide-save"
            @click="save"
          >
            Zapisz
          </UButton>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div
        v-if="loading"
        class="flex justify-center py-16 text-muted"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin"
        />
      </div>
      <div
        v-else-if="!meAthlete"
        class="mx-auto max-w-3xl py-12"
      >
        <UAlert
          color="warning"
          variant="subtle"
          title="Brak profilu zawodnika"
          description="Twoje konto nie jest powiązane z rekordem zawodnika."
        />
      </div>
      <div
        v-else
        class="mx-auto max-w-6xl"
      >
        <div class="grid gap-8 lg:grid-cols-12">
          <!-- Editor Column -->
          <div class="lg:col-span-8 space-y-6">
            <UCard
              v-if="previewOpen"
              class="overflow-hidden rounded-2xl ring-1 ring-primary/15"
            >
              <template #header>
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Podgląd wpisu
                    </p>
                    <p class="mt-1 text-sm text-muted">
                      {{ form.session_date }} · {{ form.title.trim() || 'bez tematu' }}
                    </p>
                  </div>
                  <UButton
                    color="primary"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-pencil"
                    @click="previewOpen = false"
                  >
                    Wróć do edycji
                  </UButton>
                </div>
              </template>
              <div class="p-4 sm:p-6">
                <!-- eslint-disable vue/no-v-html — sanitizeRichHtml (DOMPurify) -->
                <div
                  class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert"
                  v-html="sanitizedNotesPreview"
                />
                <!-- eslint-enable vue/no-v-html -->
              </div>
            </UCard>

            <template v-else>
              <div class="grid gap-5 sm:grid-cols-2">
                <UFormField
                  label="Data jednostki"
                  required
                >
                  <UInput
                    v-model="form.session_date"
                    type="date"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Temat (opcjonalnie)">
                  <UInput
                    v-model="form.title"
                    placeholder="np. Technika rwania"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <UFormField
                label="Treść / obciążenia / uwagi"
                description="Pełny edytor — jak na osobnej stronie dokumentu (panel trenera)."
                required
              >
                <ClubRichTextEditor
                  v-model="form.notes"
                  placeholder="Opisz przebieg treningu…"
                  min-height="min(72vh, 620px)"
                  class="w-full"
                />
              </UFormField>
            </template>
          </div>

          <!-- Sidebar Column (Training Plan) -->
          <div class="lg:col-span-4">
            <div class="sticky top-6 space-y-6">
              <UCard class="rounded-3xl border-primary/20 bg-primary/5">
                <div class="flex items-center gap-3 mb-4">
                  <UIcon name="i-lucide-clipboard-list" class="size-6 text-primary" />
                  <h3 class="font-black text-highlighted uppercase tracking-tight">Twój plan na dziś</h3>
                </div>

                <div v-if="loadingPlan" class="flex justify-center py-6">
                  <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-primary/40" />
                </div>
                <div v-else-if="!activePlan" class="text-xs text-muted italic">
                  Nie masz obecnie aktywnego planu treningowego.
                </div>
                <div v-else-if="itemsForDay.length === 0" class="text-xs text-muted">
                  Brak zaplanowanych ćwiczeń na ten dzień ({{ days.find(d => d.id === dayOfWeek)?.name }}).
                </div>
                <div v-else class="space-y-3">
                  <p class="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                    {{ activePlan.title }}
                  </p>
                  <div
                    v-for="item in itemsForDay"
                    :key="item.id"
                    class="rounded-2xl border border-default bg-card p-3 shadow-xs hover:border-primary/40 transition-colors group"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-bold text-highlighted truncate">{{ item.exercise_name || item.custom_exercise_name }}</p>
                        <p class="text-[10px] text-muted">
                          {{ item.sets }}x{{ item.reps }} <span v-if="item.weight_kg">@ {{ item.weight_kg }}kg</span>
                        </p>
                      </div>
                      <UButton
                        size="xs"
                        variant="soft"
                        color="primary"
                        icon="i-lucide-plus"
                        class="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Dodaj do wpisu"
                        @click="insertExercise(item)"
                      />
                    </div>
                  </div>
                  <p class="text-[10px] text-muted mt-4 italic">
                    Kliknij <UIcon name="i-lucide-plus" class="size-3" />, aby wstawić dane ćwiczenia do treści wpisu.
                  </p>
                </div>
              </UCard>

              <UAlert
                v-if="!previewOpen"
                icon="i-lucide-info"
                color="neutral"
                variant="subtle"
                title="Wskazówka"
                description="Zapisuj notatki regularnie. Widok trenera pozwala na podgląd Twoich wpisów w czasie rzeczywistym."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

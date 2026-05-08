<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Starty zawodników — Slavia',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const toast = useToast()

const { data: rawResults, pending, refresh } = await useAsyncData(
  'staff-results-all',
  () => apiFetch<CompetitionResult[]>('/api/results/all').catch(() => [] as CompetitionResult[])
)

const { data: athletes } = await useAsyncData(
  'staff-athletes-wyniki',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)

const athleteSelectOptions = computed(() => {
  const list = (athletes.value || []) as Athlete[]
  return [...list]
    .filter(a => a.is_active !== false)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pl'))
})

const nameById = computed(() => {
  const m = new Map<string, string>()
  for (const a of athletes.value || []) {
    m.set(a.id, a.full_name)
  }
  return m
})

const rows = computed(() => {
  const list = rawResults.value || []
  return [...list].sort((a, b) => b.date.localeCompare(a.date))
})

type ResultKindOption = 'competition' | 'training'

const modalOpen = ref(false)
const editing = ref<CompetitionResult | null>(null)
const form = reactive({
  snatch: 0,
  clean_and_jerk: 0,
  total: 0,
  date: '',
  status: 'Approved' as 'Pending' | 'Approved' | 'Rejected',
  kind: 'competition' as ResultKindOption,
  location: '' as string,
  squat_kg: null as number | null,
  bench_kg: null as number | null,
  deadlift_kg: null as number | null
})
const saving = ref(false)
const comments = ref<Array<{ id: string, body: string, author_user_id: string, created_at: string }>>([])
const commentDraft = ref('')
const commentSaving = ref(false)

const addModalOpen = ref(false)
const savingAdd = ref(false)
const formAdd = reactive({
  athlete_id: '',
  snatch: 0,
  clean_and_jerk: 0,
  total: 0,
  date: '',
  kind: 'competition' as ResultKindOption,
  location: '' as string,
  squat_kg: null as number | null,
  bench_kg: null as number | null,
  deadlift_kg: null as number | null
})

const kindFilter = ref<'all' | ResultKindOption>('all')

const filteredRows = computed(() => {
  if (kindFilter.value === 'all') return rows.value
  return rows.value.filter((r) => {
    const k = (r.kind ?? 'competition') as ResultKindOption
    return k === kindFilter.value
  })
})

function defaultDateStr() {
  return new Date().toISOString().slice(0, 10)
}

function openAddModal() {
  formAdd.athlete_id = athleteSelectOptions.value[0]?.id ?? ''
  formAdd.snatch = 0
  formAdd.clean_and_jerk = 0
  formAdd.total = 0
  formAdd.date = defaultDateStr()
  formAdd.kind = 'competition'
  formAdd.location = ''
  formAdd.squat_kg = null
  formAdd.bench_kg = null
  formAdd.deadlift_kg = null
  addModalOpen.value = true
}

async function submitAdd() {
  if (!formAdd.athlete_id) {
    toast.add({ title: 'Wybierz zawodnika', color: 'warning' })
    return
  }
  if (formAdd.snatch <= 0 || formAdd.clean_and_jerk <= 0) {
    toast.add({ title: 'Podaj dodatnie ciężary (rwanie i podrzut)', color: 'warning' })
    return
  }
  savingAdd.value = true
  try {
    const body: Record<string, unknown> = {
      athlete_id: formAdd.athlete_id,
      snatch: formAdd.snatch,
      clean_and_jerk: formAdd.clean_and_jerk,
      total: formAdd.snatch + formAdd.clean_and_jerk,
      date: formAdd.date,
      kind: formAdd.kind
    }
    if (formAdd.kind === 'competition' && formAdd.location.trim()) {
      body.location = formAdd.location.trim()
    }
    if (formAdd.squat_kg != null && formAdd.squat_kg > 0) body.squat_kg = formAdd.squat_kg
    if (formAdd.bench_kg != null && formAdd.bench_kg > 0) body.bench_kg = formAdd.bench_kg
    if (formAdd.deadlift_kg != null && formAdd.deadlift_kg > 0) body.deadlift_kg = formAdd.deadlift_kg

    await apiFetch<CompetitionResult>('/api/results', {
      method: 'POST',
      body
    })
    toast.add({
      title: formAdd.kind === 'training' ? 'Wpis treningowy zapisany' : 'Start zapisany',
      description: 'Wpis kadry jest od razu zatwierdzany — bez kolejki oczekujących.',
      color: 'success'
    })
    addModalOpen.value = false
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Nie udało się dodać wyniku',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    savingAdd.value = false
  }
}

function openEdit(r: CompetitionResult) {
  editing.value = r
  form.snatch = r.snatch
  form.clean_and_jerk = r.clean_and_jerk
  form.total = r.total
  form.date = r.date.slice(0, 10)
  form.status = r.status
  form.kind = ((r.kind ?? 'competition') as ResultKindOption)
  form.location = r.location ?? ''
  form.squat_kg = r.squat_kg ?? null
  form.bench_kg = r.bench_kg ?? null
  form.deadlift_kg = r.deadlift_kg ?? null
  modalOpen.value = true
  void loadComments(r.id)
}

async function loadComments(resultId: string) {
  const q = new URLSearchParams({ target_type: 'result', target_id: resultId })
  comments.value = await apiFetch<Array<{ id: string, body: string, author_user_id: string, created_at: string }>>(`/api/comments?${q.toString()}`).catch(() => [])
}

async function addComment() {
  if (!editing.value || !commentDraft.value.trim()) return
  commentSaving.value = true
  try {
    await apiFetch('/api/comments', {
      method: 'POST',
      body: {
        target_type: 'result',
        target_id: editing.value.id,
        body: commentDraft.value.trim()
      }
    })
    commentDraft.value = ''
    await loadComments(editing.value.id)
    toast.add({ title: 'Dodano komentarz', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Błąd komentarza', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    commentSaving.value = false
  }
}

async function saveEdit() {
  if (!editing.value) {
    return
  }
  saving.value = true
  try {
    const trimmedLocation = form.location.trim()
    await apiFetch(`/api/results/${editing.value.id}`, {
      method: 'PATCH',
      body: {
        snatch: form.snatch,
        clean_and_jerk: form.clean_and_jerk,
        total: form.snatch + form.clean_and_jerk,
        date: form.date,
        status: form.status,
        kind: form.kind,
        location: form.kind === 'competition' ? (trimmedLocation || null) : null,
        squat_kg: form.squat_kg != null && form.squat_kg > 0 ? form.squat_kg : null,
        bench_kg: form.bench_kg != null && form.bench_kg > 0 ? form.bench_kg : null,
        deadlift_kg: form.deadlift_kg != null && form.deadlift_kg > 0 ? form.deadlift_kg : null
      }
    })
    toast.add({ title: 'Zapisano wynik', color: 'success' })
    modalOpen.value = false
    await refresh()
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

async function removeRow(r: CompetitionResult) {
  if (!confirm(`Usunąć start z dnia ${r.date}?`)) {
    return
  }
  try {
    await apiFetch(`/api/results/${r.id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Nie udało się usunąć',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

watch([() => form.snatch, () => form.clean_and_jerk], () => {
  form.total = form.snatch + form.clean_and_jerk
})

watch([() => formAdd.snatch, () => formAdd.clean_and_jerk], () => {
  formAdd.total = formAdd.snatch + formAdd.clean_and_jerk
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16 animate-page-in">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">
          Kadra
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
          Wszystkie starty zawodników
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Pełna lista zgłoszeń (oczekujących i zatwierdzonych). Jako kadra możesz
          <strong class="text-highlighted">dodać start od razu jako zatwierdzony</strong>
          — bez kolejki akceptacji. Edycja i usuwanie jak dotąd.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plus-circle"
          @click="openAddModal"
        >
          Dodaj wynik (zatwierdzony)
        </UButton>
        <UButton
          icon="i-lucide-refresh-ccw"
          variant="soft"
          :loading="pending"
          @click="refresh()"
        >
          Odśwież
        </UButton>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-default/60 bg-muted/15 p-1.5">
      <UButton
        size="sm"
        :variant="kindFilter === 'all' ? 'solid' : 'ghost'"
        :color="kindFilter === 'all' ? 'primary' : 'neutral'"
        class="min-h-9"
        @click="kindFilter = 'all'"
      >
        Wszystko ({{ rows.length }})
      </UButton>
      <UButton
        size="sm"
        :variant="kindFilter === 'competition' ? 'solid' : 'ghost'"
        :color="kindFilter === 'competition' ? 'primary' : 'neutral'"
        class="min-h-9"
        @click="kindFilter = 'competition'"
      >
        Zawody ({{ rows.filter(r => (r.kind ?? 'competition') === 'competition').length }})
      </UButton>
      <UButton
        size="sm"
        :variant="kindFilter === 'training' ? 'solid' : 'ghost'"
        :color="kindFilter === 'training' ? 'primary' : 'neutral'"
        class="min-h-9"
        @click="kindFilter = 'training'"
      >
        Trening ({{ rows.filter(r => r.kind === 'training').length }})
      </UButton>
    </div>

    <UCard :ui="{ body: 'p-0 overflow-x-auto' }">
      <table class="w-full min-w-[920px] text-sm">
        <thead class="border-b border-default bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Data
            </th>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Typ
            </th>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Zawodnik
            </th>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Miejsce
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Rwanie
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Podrzut
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Razem
            </th>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Status
            </th>
            <th class="hidden px-4 py-3 text-right text-xs font-semibold text-muted lg:table-cell">
              Siła
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="pending">
            <td
              colspan="10"
              class="px-4 py-10 text-center text-muted"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="inline size-6 animate-spin"
              />
            </td>
          </tr>
          <tr v-else-if="filteredRows.length === 0">
            <td
              colspan="10"
              class="px-4 py-10 text-center text-muted"
            >
              Brak zapisanych wyników w tym filtrze.
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="r in filteredRows"
              :key="r.id"
              class="hover:bg-muted/15 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                {{ r.date.slice(0, 10) }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="(r.kind ?? 'competition') === 'training' ? 'info' : 'primary'"
                  variant="subtle"
                  size="sm"
                >
                  {{ (r.kind ?? 'competition') === 'training' ? 'Trening' : 'Zawody' }}
                </UBadge>
              </td>
              <td class="px-4 py-3">
                {{ nameById.get(r.athlete_id) || r.athlete_id }}
              </td>
              <td class="px-4 py-3 text-muted">
                <span v-if="r.location">
                  {{ r.location }}
                </span>
                <span v-else class="text-muted/60">—</span>
              </td>
              <td class="px-4 py-3 text-right tabular-nums">
                {{ r.snatch }}
              </td>
              <td class="px-4 py-3 text-right tabular-nums">
                {{ r.clean_and_jerk }}
              </td>
              <td class="px-4 py-3 text-right font-semibold tabular-nums">
                {{ r.total }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="r.status === 'Approved' ? 'success' : (r.status === 'Rejected' ? 'error' : 'warning')"
                  variant="subtle"
                >
                  {{ r.status === 'Approved' ? 'Zatwierdzony' : (r.status === 'Rejected' ? 'Odrzucony' : 'Oczekuje') }}
                </UBadge>
              </td>
              <td class="hidden px-4 py-3 text-right text-[11px] tabular-nums text-muted lg:table-cell">
                <span v-if="r.squat_kg != null || r.bench_kg != null || r.deadlift_kg != null">
                  {{ r.squat_kg ?? '—' }}/{{ r.bench_kg ?? '—' }}/{{ r.deadlift_kg ?? '—' }}
                </span>
                <span v-else>—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton
                    size="xs"
                    variant="soft"
                    icon="i-lucide-pencil"
                    @click="openEdit(r)"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    @click="removeRow(r)"
                  />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </UCard>

    <UModal
      v-model:open="modalOpen"
      title="Edytuj wynik"
      :dismissible="true"
      :ui="{ overlay: 'z-[190]', content: 'z-[200] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl' }"
    >
      <template #content>
        <div class="slavia-form-modal">
          <div class="slavia-form-panel">
            <div class="slavia-form-panel__header">
              <div class="slavia-form-panel__title">
                <span class="slavia-form-panel__icon">
                  <UIcon
                    name="i-lucide-pencil"
                    class="size-4"
                  />
                </span>
                Dane wyniku
              </div>
            </div>
            <div class="slavia-form-panel__body">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UFormField label="Typ wpisu" description="Tylko zawody trafiają na publiczną listę i wykres">
                  <select
                    v-model="form.kind"
                    class="slavia-select w-full py-3 text-[15px]"
                  >
                    <option value="competition">
                      Zawody (publiczne)
                    </option>
                    <option value="training">
                      Trening (tylko po zalogowaniu)
                    </option>
                  </select>
                </UFormField>
                <UFormField
                  v-if="form.kind === 'competition'"
                  label="Miejsce zawodów"
                  description="Opcjonalnie"
                >
                  <UInput
                    v-model="form.location"
                    placeholder="np. Ruda Śląska, Mistrzostwa Śląska"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  v-else
                  label="Miejsce"
                  description="Treningi automatycznie oznaczane jako sala klubowa."
                >
                  <UInput
                    model-value="Slavia"
                    size="lg"
                    class="w-full"
                    disabled
                    icon="i-lucide-dumbbell"
                  />
                </UFormField>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Rwanie (kg)">
                  <UInput
                    v-model.number="form.snatch"
                    type="number"
                    step="0.5"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Podrzut (kg)">
                  <UInput
                    v-model.number="form.clean_and_jerk"
                    type="number"
                    step="0.5"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
              </div>
              <UFormField label="Data">
                <UInput
                  v-model="form.date"
                  type="date"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status">
                <select
                  v-model="form.status"
                  class="slavia-select w-full py-3 text-[15px]"
                >
                  <option value="Pending">
                    Oczekuje na akceptację
                  </option>
                  <option value="Approved">
                    Zatwierdzony
                  </option>
                  <option value="Rejected">
                    Odrzucony
                  </option>
                </select>
              </UFormField>
              <p class="text-xs text-muted">
                Suma (auto): <strong class="tabular-nums text-highlighted">{{ form.total }}</strong> kg
              </p>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <UFormField label="Przysiad (kg)">
                  <UInput
                    v-model.number="form.squat_kg"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Wyciskanie (kg)">
                  <UInput
                    v-model.number="form.bench_kg"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Martwy (kg)">
                  <UInput
                    v-model.number="form.deadlift_kg"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
              </div>
              <p class="text-[11px] text-muted">
                Puste lub 0 — kasuje zapis siłowy przy edycji (JSON null).
              </p>
              <div class="rounded-xl border border-default/60 p-3">
                <p class="mb-2 text-sm font-semibold text-highlighted">Komentarze trenera</p>
                <div class="mb-2 space-y-2">
                  <div v-for="c in comments" :key="c.id" class="rounded-lg bg-muted/20 px-3 py-2 text-sm">
                    <p>{{ c.body }}</p>
                    <p class="mt-1 text-[11px] text-muted">{{ c.created_at.slice(0, 16).replace('T', ' ') }}</p>
                  </div>
                  <p v-if="comments.length === 0" class="text-xs text-muted">Brak komentarzy.</p>
                </div>
                <div class="flex gap-2">
                  <UInput v-model="commentDraft" class="min-w-0 flex-1" placeholder="Dodaj komentarz trenera..." />
                  <UButton size="sm" :loading="commentSaving" @click="addComment">Dodaj</UButton>
                </div>
              </div>
            </div>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              @click="modalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              size="lg"
              :loading="saving"
              @click="saveEdit"
            >
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="addModalOpen"
      title="Nowy wynik (kadra)"
      :dismissible="true"
      :ui="{ overlay: 'z-[190]', content: 'z-[200] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl' }"
    >
      <template #content>
        <div class="slavia-form-modal">
          <p class="rounded-xl border border-default/60 bg-muted/15 px-4 py-3 text-sm text-muted dark:bg-muted/10">
            Wynik zapisany przez trenera lub administratora trafia od razu jako
            <strong class="text-highlighted">zatwierdzony</strong>.
            Wpisy <strong>z zawodów</strong> liczą się w rankingu, na karcie zawodnika i w publicznej liście wyników.
            Wpisy <strong>treningowe</strong> są widoczne tylko po zalogowaniu i nie wpływają na PB.
          </p>
          <div class="slavia-form-panel">
            <div class="slavia-form-panel__header">
              <div class="slavia-form-panel__title">
                <span class="slavia-form-panel__icon">
                  <UIcon
                    name="i-lucide-plus"
                    class="size-4"
                  />
                </span>
                Dane wyniku
              </div>
            </div>
            <div class="slavia-form-panel__body">
              <UFormField label="Zawodnik">
                <select
                  v-model="formAdd.athlete_id"
                  class="slavia-select w-full py-3 text-[15px]"
                >
                  <option
                    disabled
                    value=""
                  >
                    — wybierz —
                  </option>
                  <option
                    v-for="a in athleteSelectOptions"
                    :key="a.id"
                    :value="a.id"
                  >
                    {{ a.full_name }}
                  </option>
                </select>
              </UFormField>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UFormField label="Typ wpisu" description="Tylko zawody trafiają na publiczną listę">
                  <select
                    v-model="formAdd.kind"
                    class="slavia-select w-full py-3 text-[15px]"
                  >
                    <option value="competition">
                      Zawody (publiczne)
                    </option>
                    <option value="training">
                      Trening (tylko po zalogowaniu)
                    </option>
                  </select>
                </UFormField>
                <UFormField
                  v-if="formAdd.kind === 'competition'"
                  label="Miejsce zawodów"
                  description="Opcjonalnie"
                >
                  <UInput
                    v-model="formAdd.location"
                    placeholder="np. Ruda Śląska, Mistrzostwa Śląska"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  v-else
                  label="Miejsce"
                  description="Treningi automatycznie oznaczane jako sala klubowa."
                >
                  <UInput
                    model-value="Slavia"
                    size="lg"
                    class="w-full"
                    disabled
                    icon="i-lucide-dumbbell"
                  />
                </UFormField>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Rwanie (kg)">
                  <UInput
                    v-model.number="formAdd.snatch"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Podrzut (kg)">
                  <UInput
                    v-model.number="formAdd.clean_and_jerk"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
              </div>
              <UFormField label="Data startu">
                <UInput
                  v-model="formAdd.date"
                  type="date"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
              <p class="text-xs text-muted">
                Dwubój (auto): <strong class="tabular-nums text-highlighted">{{ formAdd.total }}</strong> kg
              </p>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <UFormField label="Przysiad (kg)">
                  <UInput
                    v-model.number="formAdd.squat_kg"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Wyciskanie (kg)">
                  <UInput
                    v-model.number="formAdd.bench_kg"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
                <UFormField label="Martwy (kg)">
                  <UInput
                    v-model.number="formAdd.deadlift_kg"
                    type="number"
                    step="0.5"
                    min="0"
                    size="lg"
                    class="w-full tabular-nums"
                  />
                </UFormField>
              </div>
            </div>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              @click="addModalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              size="lg"
              :loading="savingAdd"
              @click="submitAdd"
            >
              Zapisz start
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'

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

const athleteById = computed(() => {
  const m = new Map<string, Athlete>()
  for (const a of athletes.value || []) {
    m.set(a.id, a)
  }
  return m
})

function rowSinclair(r: CompetitionResult): number | null {
  const a = athleteById.value.get(r.athlete_id)
  const gender = a?.gender
  if (gender !== 'male' && gender !== 'female') return null
  const bw = (r.bodyweight_kg != null && r.bodyweight_kg > 0)
    ? Number(r.bodyweight_kg)
    : (a?.bodyweight != null && a.bodyweight > 0 ? Number(a.bodyweight) : effectiveBodyweightKgForSinclair(a ?? ({} as Athlete)))
  const total = Number(r.total ?? 0)
  if (!Number.isFinite(bw) || bw <= 0 || !Number.isFinite(total) || total <= 0) return null
  const s = sinclairTotal(total, bw, gender)
  if (!Number.isFinite(s) || Number.isNaN(s)) return null
  return Number(s.toFixed(2))
}

const rows = computed(() => {
  const list = rawResults.value || []
  return [...list].sort((a, b) => b.date.localeCompare(a.date))
})

const lastBodyweightByAthleteId = computed(() => {
  const m = new Map<string, number>()
  for (const r of (rows.value || [])) {
    const aid = r.athlete_id
    if (!aid || m.has(aid)) continue
    const bw = (r.bodyweight_kg != null && Number(r.bodyweight_kg) > 0) ? Number(r.bodyweight_kg) : 0
    if (bw > 0) m.set(aid, bw)
  }
  return m
})

function suggestedBodyweightKg(athleteId: string): number | null {
  const fromLast = lastBodyweightByAthleteId.value.get(athleteId)
  if (fromLast != null && fromLast > 0) return fromLast
  const a = athleteById.value.get(athleteId)
  const fromProfile = a?.bodyweight
  if (fromProfile != null && Number(fromProfile) > 0) return Number(fromProfile)
  return null
}

type ResultKindOption = 'competition' | 'training' | 'import'

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
  bodyweight_kg: null as number | null
})
const saving = ref(false)
const comments = ref<Array<{ id: string, body: string, author_user_id: string, created_at: string }>>([])
const commentDraft = ref('')
const commentSaving = ref(false)

const addModalOpen = ref(false)
const savingAdd = ref(false)
/** Po zapisie — kolejny start tego samego zawodnika (data i wyniki do uzupełnienia). */
const addAnotherSameAthlete = ref(false)
const formAdd = reactive({
  athlete_id: '',
  snatch: 0,
  clean_and_jerk: 0,
  total: 0,
  date: '',
  kind: 'competition' as ResultKindOption,
  location: '' as string,
  bodyweight_kg: null as number | null
})

const kindFilter = ref<'all' | ResultKindOption>('all')

const ATHLETE_ALL = '__all__'
const selectedAthleteId = ref<string>(ATHLETE_ALL)

const filteredRows = computed(() => {
  if (kindFilter.value === 'all') return rows.value
  return rows.value.filter((r) => {
    const k = (r.kind ?? 'competition') as ResultKindOption
    return k === kindFilter.value
  })
})

watch(
  athleteSelectOptions,
  (list) => {
    if (selectedAthleteId.value === ATHLETE_ALL) return
    if (!Array.isArray(list) || !list.some(a => a.id === selectedAthleteId.value)) {
      selectedAthleteId.value = ATHLETE_ALL
    }
  },
  { immediate: true }
)

const visibleRows = computed(() => {
  const list = filteredRows.value
  if (selectedAthleteId.value === ATHLETE_ALL) return list
  return list.filter(r => r.athlete_id === selectedAthleteId.value)
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
  formAdd.bodyweight_kg = formAdd.athlete_id ? suggestedBodyweightKg(formAdd.athlete_id) : null
  addModalOpen.value = true
}

watch(
  () => formAdd.athlete_id,
  (aid) => {
    if (!aid) return
    // Nie nadpisuj, jeśli użytkownik już coś wpisał.
    if (formAdd.bodyweight_kg != null && formAdd.bodyweight_kg > 0) return
    formAdd.bodyweight_kg = suggestedBodyweightKg(aid)
  }
)

async function submitAdd() {
  if (!formAdd.athlete_id) {
    toast.add({ title: 'Wybierz zawodnika', color: 'warning' })
    return
  }
  if (formAdd.snatch < 0 || formAdd.clean_and_jerk < 0) {
    toast.add({ title: 'Ciężary nie mogą być ujemne', color: 'warning' })
    return
  }
  const hasOlyPositive = formAdd.snatch > 0 || formAdd.clean_and_jerk > 0
  if (!hasOlyPositive) {
    toast.add({
      title: 'Uzupełnij wynik',
      description: 'Podaj dodatnie rwanie i/lub podrzut (0 dozwolone przy kontuzji/jednoboju).',
      color: 'warning'
    })
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
    if ((formAdd.kind === 'competition' || formAdd.kind === 'import') && formAdd.location.trim()) {
      body.location = formAdd.location.trim()
    }
    if (formAdd.bodyweight_kg != null && formAdd.bodyweight_kg > 0) body.bodyweight_kg = formAdd.bodyweight_kg

    await apiFetch<CompetitionResult>('/api/results', {
      method: 'POST',
      body
    })
    toast.add({
      title: formAdd.kind === 'training' ? 'Wpis treningowy zapisany' : 'Start zapisany',
      description: addAnotherSameAthlete.value
        ? 'Możesz dodać kolejny start tego samego zawodnika.'
        : 'Wpis kadry jest od razu zatwierdzany — bez kolejki oczekujących.',
      color: 'success'
    })
    if (addAnotherSameAthlete.value) {
      const keepAthlete = formAdd.athlete_id
      const keepKind = formAdd.kind
      const keepLocation = formAdd.location
      const keepBw = formAdd.bodyweight_kg
      formAdd.snatch = 0
      formAdd.clean_and_jerk = 0
      formAdd.total = 0
      formAdd.date = defaultDateStr()
      formAdd.athlete_id = keepAthlete
      formAdd.kind = keepKind
      formAdd.location = keepLocation
      formAdd.bodyweight_kg = keepBw
    } else {
      addModalOpen.value = false
    }
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
  form.bodyweight_kg = r.bodyweight_kg ?? null
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
        location: (form.kind === 'competition' || form.kind === 'import') ? (trimmedLocation || null) : null,
        bodyweight_kg: form.bodyweight_kg != null && form.bodyweight_kg > 0 ? form.bodyweight_kg : null
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

const copy = useSlaviaCopy()
const pendingRows = computed(() => rows.value.filter(r => r.status === 'Pending'))
const selectedPending = ref<string[]>([])

watch(
  pendingRows,
  (list) => {
    const ok = new Set(list.map(r => r.id))
    selectedPending.value = selectedPending.value.filter(id => ok.has(id))
  },
  { deep: true }
)

function togglePendingSelect(id: string) {
  const i = selectedPending.value.indexOf(id)
  if (i >= 0) {
    selectedPending.value.splice(i, 1)
  } else {
    selectedPending.value.push(id)
  }
}

function selectAllPendingVisible() {
  const ids = pendingRows.value.map(r => r.id)
  const set = new Set([...selectedPending.value, ...ids])
  selectedPending.value = [...set]
}

const bulkApproving = ref(false)

async function bulkApproveSelected() {
  if (selectedPending.value.length === 0) {
    return
  }
  bulkApproving.value = true
  try {
    const res = await apiFetch<{ approved: number, skipped: number }>(apiRoutes.results.batchApprove, {
      method: 'POST',
      body: { ids: selectedPending.value }
    })
    toast.add({
      title: 'Masowa akceptacja zakończona',
      description: `Zatwierdzono: ${res.approved}, pominięto (np. już nie Pending): ${res.skipped}.`,
      color: 'success'
    })
    selectedPending.value = []
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zatwierdzić wybranych',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    bulkApproving.value = false
  }
}

function badgeColorForKind(k: string | undefined) {
  const v = k ?? 'competition'
  if (v === 'training') return 'info'
  if (v === 'import') return 'neutral'
  return 'primary'
}
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Wszystkie starty zawodników"
      icon="i-lucide-list-checks"
    >
      <template #description>
        Pełna lista zgłoszeń (oczekujących i zatwierdzonych). Jako kadra możesz
        <strong class="text-highlighted">dodać start od razu jako zatwierdzony</strong>
        — bez kolejki akceptacji. Edycja i usuwanie jak dotąd.
      </template>
      <template #actions>
        <UButton icon="i-lucide-plus-circle" @click="openAddModal">
          Dodaj start
        </UButton>
        <UButton icon="i-lucide-refresh-ccw" variant="soft" :loading="pending" @click="refresh()">
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <PanelDataToolbar
      :summary="`Wierszy: ${visibleRows.length}`"
      sticky
    >
      <template #filters>
        <div class="flex flex-wrap gap-2">
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
        <UFormField label="Zawodnik" class="w-full sm:min-w-72 sm:max-w-xs">
          <select
            v-model="selectedAthleteId"
            class="slavia-select w-full py-2.5 text-[14px]"
          >
            <option :value="ATHLETE_ALL">
              Wszyscy zawodnicy
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
      </template>
    </PanelDataToolbar>

    <PanelLoadingState
      v-if="pending && rows.length === 0"
      label="Wczytywanie wyników…"
    />

    <UCard
      v-if="pendingRows.length > 0"
      class="mb-6 border-warning/25 bg-warning/5"
    >
      <div class="space-y-4 p-4 sm:p-5">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-sm font-bold text-highlighted">
              Oczekujące wpisy ({{ pendingRows.length }})
            </h2>
            <p class="text-xs text-muted">
              Zaznacz wiele wierszy i zatwierdź jednym żądaniem (audyt po stronie API).
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              size="sm"
              variant="soft"
              @click="selectAllPendingVisible"
            >
              Zaznacz wszystkie oczekujące
            </UButton>
            <UButton
              size="sm"
              color="primary"
              :loading="bulkApproving"
              :disabled="selectedPending.length === 0"
              @click="bulkApproveSelected"
            >
              Zatwierdź wybrane ({{ selectedPending.length }})
            </UButton>
          </div>
        </div>
        <div class="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-default/50 bg-background/80 p-2">
          <label
            v-for="r in pendingRows"
            :key="`pend-${r.id}`"
            class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/30"
          >
            <input
              type="checkbox"
              class="size-4 accent-primary"
              :checked="selectedPending.includes(r.id)"
              @click.prevent="togglePendingSelect(r.id)"
            >
            <span class="min-w-0 flex-1 text-sm">
              <span class="font-medium text-highlighted">{{ nameById.get(r.athlete_id) || r.athlete_id }}</span>
              <span class="text-muted"> · {{ r.date.slice(0, 10) }} · {{ r.total }} kg</span>
            </span>
          </label>
        </div>
      </div>
    </UCard>

    <UCard
      v-if="!(pending && rows.length === 0)"
      class="slavia-page-card"
      :ui="{ body: 'p-0 overflow-x-auto' }"
    >
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
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Sinclair
            </th>
            <th class="px-4 py-3 text-left font-semibold text-muted">
              Status
            </th>
            <th class="px-4 py-3 text-right font-semibold text-muted">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="visibleRows.length === 0">
            <td
              colspan="11"
              class="px-4 py-6"
            >
              <SlaviaEmptyState
                icon="i-lucide-trophy"
                title="Brak wyników"
                description="Brak zapisanych wyników w tym filtrze."
              />
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="r in visibleRows"
              :key="r.id"
              class="hover:bg-muted/15 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                {{ r.date.slice(0, 10) }}
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="badgeColorForKind(r.kind)"
                  variant="subtle"
                  size="sm"
                >
                  {{ copy.resultKindLabel(r.kind) }}
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
              <td class="px-4 py-3 text-right">
                <span
                  v-if="rowSinclair(r) != null"
                  class="inline-block rounded-full bg-primary/15 px-2 py-1 font-mono text-xs font-black text-primary"
                >
                  {{ rowSinclair(r) }}
                </span>
                <span v-else class="text-muted/60">—</span>
              </td>
              <td class="px-4 py-3">
                <UBadge
                  :color="r.status === 'Approved' ? 'success' : (r.status === 'Rejected' ? 'error' : 'warning')"
                  variant="subtle"
                >
                  {{ copy.resultStatusLabel(r.status) }}
                </UBadge>
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

    <SlaviaEditorSheet
      v-model:open="modalOpen"
      title="Edytuj wynik"
      size="xl"
      scroll-restore-key="trainer-wyniki-edit"
    >
      <div class="slavia-form-stack">
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
              <div class="slavia-form-grid grid-cols-1 sm:grid-cols-2">
                <UFormField label="Data">
                  <UInput
                    v-model="form.date"
                    type="date"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
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
                    <option value="import">
                      Import (dane historyczne)
                    </option>
                  </select>
                </UFormField>
              </div>

              <div class="slavia-form-grid grid-cols-1 sm:max-w-2xl">
                <UFormField
                  v-if="form.kind === 'competition' || form.kind === 'import'"
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

              <div class="slavia-form-grid grid-cols-1 sm:grid-cols-2">
                <UFormField
                  label="Waga na starcie (kg)"
                  description="Opcjonalnie — jeśli puste, zostanie użyta waga z profilu lub z poprzedniego wpisu."
                >
                  <UInput
                    v-model.number="form.bodyweight_kg"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="auto"
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
              </div>

              <div class="slavia-form-grid grid-cols-1 sm:grid-cols-2">
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

              <p class="text-xs text-muted">
                Suma (auto): <strong class="tabular-nums text-highlighted">{{ form.total }}</strong> kg
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
      </div>
      <template #footer>
        <div class="slavia-form-actions w-full border-t border-default/60 pt-4">
          <UButton color="neutral" variant="outline" size="lg" @click="modalOpen = false">
            Anuluj
          </UButton>
          <UButton size="lg" :loading="saving" @click="saveEdit">
            Zapisz
          </UButton>
        </div>
      </template>
    </SlaviaEditorSheet>

    <SlaviaEditorSheet
      v-model:open="addModalOpen"
      title="Nowy wynik (kadra)"
      size="xl"
      scroll-restore-key="trainer-wyniki-add"
    >
      <div class="slavia-form-stack">
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
              <div class="slavia-form-grid grid-cols-1 sm:grid-cols-3">
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

                <UFormField label="Data startu">
                  <UInput
                    v-model="formAdd.date"
                    type="date"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>

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
                    <option value="import">
                      Import (dane historyczne)
                    </option>
                  </select>
                </UFormField>
              </div>

              <div class="slavia-form-grid grid-cols-1 sm:max-w-2xl">
                <UFormField
                  v-if="formAdd.kind === 'competition' || formAdd.kind === 'import'"
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

              <div class="slavia-form-grid grid-cols-1 sm:max-w-md">
                <UFormField
                  label="Waga na starcie (kg)"
                  description="Opcjonalnie — domyślnie podpowiadamy wagę z ostatniego wpisu zawodnika."
                >
                  <UInput
                    v-model.number="formAdd.bodyweight_kg"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="auto"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <div class="slavia-form-grid grid-cols-1 sm:grid-cols-2">
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
              <p class="text-xs text-muted">
                Dwubój (auto): <strong class="tabular-nums text-highlighted">{{ formAdd.total }}</strong> kg
              </p>
              <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
                <input
                  v-model="addAnotherSameAthlete"
                  type="checkbox"
                  class="mt-1 size-4 accent-primary"
                >
                <span class="text-sm">
                  <span class="font-semibold text-highlighted">Dodaj kolejny start</span>
                  <span class="block text-muted">Po zapisie zostaw ten sam zawodnik — wyczyść tylko datę i wyniki (serie startów).</span>
                </span>
              </label>
            </div>
          </div>
      </div>
      <template #footer>
        <div class="slavia-form-actions w-full border-t border-default/60 pt-4">
          <UButton color="neutral" variant="outline" size="lg" @click="addModalOpen = false">
            Anuluj
          </UButton>
          <UButton size="lg" :loading="savingAdd" icon="i-lucide-save" @click="submitAdd">
            {{ addAnotherSameAthlete ? 'Zapisz i dodaj następny' : 'Zapisz start' }}
          </UButton>
        </div>
      </template>
    </SlaviaEditorSheet>
  </PanelPageLayout>
</template>

<script setup lang="ts">
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  getDay,
  isValid
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { apiRoutes } from '~/config/api'
import type { Athlete, Competition, CalendarEvent, RecurringTrainingSession } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import { generateIcsContent, downloadIcs } from '~/utils/ics'

useSeoMeta({
  title: 'Kalendarz — Slavia Ruda Śląska',
  description: 'Kalendarz zawodów i treningów CKS Slavia.',
  ogTitle: 'Kalendarz wydarzeń — CKS Slavia',
  ogDescription: 'Sprawdź harmonogram treningów, zawodów i wydarzeń klubowych CKS Slavia.',
  twitterCard: 'summary'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const canManageEvents = computed(() => auth.isTrainer.value || auth.isSuperAdmin.value)
const {
  viewMode: calendarViewMode,
  effectiveView: calendarEffectiveView,
  showViewToggle: showCalendarViewToggle,
  setViewMode: setCalendarViewMode
} = useCalendarViewMode('club')
const calendarCompactOn = useExperimentalFlag('calendar_tablet_compact')
const viewportWidth = ref(1280)
const isCompactTablet = computed(
  () => calendarCompactOn.value && viewportWidth.value >= 768
)
onMounted(() => {
  if (!import.meta.client) return
  const sync = () => {
    viewportWidth.value = window.innerWidth
  }
  sync()
  window.addEventListener('resize', sync)
  onUnmounted(() => window.removeEventListener('resize', sync))
})
const canSyncExternalCalendars = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)

const syncLoading = ref(false)

/** Publiczny BFF — SSR + hydracja bez bezpośredniego CORS do backendu. */
const {
  data: competitions,
  refresh,
  pending: competitionsPending,
  error: competitionsError
} = await usePublicLazyFetch<Competition[]>('competitions', {
  key: 'competitions-public',
  default: () => []
})

const {
  data: recurringClubTrainingSessions,
  refresh: refreshRecurringClubTrainingSessions
} = await usePublicLazyFetch<RecurringTrainingSession[]>(
  'competitions/recurring-training-cancellations',
  {
    key: 'recurring-training-sessions',
    default: () => []
  }
)

/** yyyy-MM-dd → status z bazy (`scheduled` = brak wiersza). */
const recurringTrainingStatusByDate = computed(() => {
  const m = new Map<string, string>()
  for (const row of recurringClubTrainingSessions.value ?? []) {
    if (row.session_date) {
      m.set(row.session_date.substring(0, 10), row.status || 'cancelled')
    }
  }
  return m
})

const athletesPickList = ref<Array<{ id: string, full_name: string }>>([])
const participantIds = ref<string[]>([])

async function loadAthletesPickList() {
  try {
    if (!auth.token.value) {
      athletesPickList.value = []
      return
    }
    const rows = await apiFetch<Athlete[]>(apiRoutes.athletes.listAdmin).catch(() => null)
    const list = Array.isArray(rows) ? rows : []
    athletesPickList.value = list
      .filter(a => a.is_active !== false)
      .map(a => ({ id: a.id, full_name: a.full_name }))
  } catch {
    athletesPickList.value = []
  }
}

// Stan kalendarza — przechowujemy ms **pierwszego dnia miesiąca** (number),
// żeby uniknąć psucia `Date` przy serializacji payloadu Nuxt (SSR → hydration).
function monthFirstMsFromDate(d: Date | number | string) {
  const dt = d instanceof Date ? d : new Date(d)
  if (!isValid(dt)) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  }
  const t = new Date(dt.getFullYear(), dt.getMonth(), 1).getTime()
  return Number.isFinite(t) ? t : Date.now()
}

const monthFirstMs = ref(monthFirstMsFromDate(new Date()))

onMounted(() => {
  refresh()
  refreshRecurringClubTrainingSessions()
  if (!Number.isFinite(monthFirstMs.value)) {
    monthFirstMs.value = monthFirstMsFromDate(new Date())
  }
  if (auth.token.value) {
    auth.fetchMe()
  }
})

const currentDate = computed(() => new Date(monthFirstMs.value))

const monthStart = computed(() => new Date(monthFirstMs.value))
const monthEnd = computed(() => endOfMonth(new Date(monthFirstMs.value)))
const calendarStart = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 1 }))
const calendarEnd = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 1 }))

const days = computed(() => {
  const start = calendarStart.value
  const end = calendarEnd.value
  if (!isValid(start) || !isValid(end)) {
    const t = monthFirstMsFromDate(new Date())
    const m0 = new Date(t)
    return eachDayOfInterval({
      start: startOfWeek(m0, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(m0), { weekStartsOn: 1 })
    })
  }
  if (start.getTime() > end.getTime()) {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(start), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(start), { weekStartsOn: 1 })
    })
  }
  return eachDayOfInterval({ start, end })
})

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

const recurringClubTrainingOverridesCount = computed(() => (recurringClubTrainingSessions.value ?? []).length)

async function restoreAllRecurringTrainingsInDb() {
  if (!canManageEvents.value) return
  if (!confirm('Przywrócić wszystkie odwołane treningi Pn / Śr / Pt w kalendarzu (zapis w bazie)?')) return
  try {
    await apiFetch(apiRoutes.competitions.recurringTrainingCancellations, { method: 'DELETE' })
    await refreshRecurringClubTrainingSessions()
    toast.add({
      title: 'Przywrócono siatkę treningów',
      description: 'Wpisy Pn / Śr / Pt znów są widoczne dla wszystkich.',
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: 'Nie udało się przywrócić',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}

// Treningi: Pn / Śr / Pt — status z bazy (zsynchronizowany z kalendarzem zawodnika).
const getTrainingsForDay = (date: Date) => {
  const day = getDay(date) // 0: Ndz, 1: Pon, ..., 5: Pt
  if ([1, 3, 5].includes(day)) {
    const ds = format(date, 'yyyy-MM-dd')
    const status = recurringTrainingStatusByDate.value.get(ds) ?? 'scheduled'
    return [{
      id: `training-${ds}`,
      date: ds,
      title: 'Trening',
      time: '15:00 - 18:00',
      type: 'training',
      category: 'training',
      status
    }]
  }
  return []
}

const getEventsForDay = (date: Date): CalendarEvent[] => {
  const dateStr = format(date, 'yyyy-MM-dd')

  // Lokalne zawody z bazy danych
  const comps: CalendarEvent[] = (competitions.value || []).filter((e: Competition) => typeof e?.date === 'string' && e.date.startsWith(dateStr)).map((e: Competition): CalendarEvent => ({
    ...e,
    type: e.external_source ? 'external' : 'competition',
    external_source: e.external_source || undefined,
    club_participates: !!e.club_participates
  }))

  return [...getTrainingsForDay(date), ...comps]
}

const monthAgenda = computed(() => {
  const start = startOfMonth(monthStart.value)
  const end = endOfMonth(monthStart.value)
  const days = eachDayOfInterval({ start, end })
  return days
    .map((d) => ({
      day: d,
      events: getEventsForDay(d)
    }))
    .filter(x => x.events.length > 0)
})

function eventAgendaKey(event: { id: string | number, type?: string }) {
  return `${event.id}-${event.type ?? 'event'}`
}

const monthAgendaRows = computed(() =>
  monthAgenda.value.map((row) => ({
    day: row.day,
    events: row.events.map((ev) => ({
      key: eventAgendaKey(ev),
      title: ev.title,
      subtitle: ev.time || ev.location || '—',
      chipClass: getEventClasses(ev) || '',
      icon: getEventIcon(ev)
    }))
  }))
)

function onAgendaSelect(day: Date, ev: { key: string }) {
  const found = getEventsForDay(day).find((e) => eventAgendaKey(e) === ev.key)
  if (found) void openModal(day, found)
}

function onAgendaAddDay(day: Date) {
  openModal(day)
}

async function syncExternalCalendars() {
  if (!canSyncExternalCalendars.value) return
  syncLoading.value = true
  try {
    const res = await apiFetch<{
      pzpc_imported: number
      pc_imported: number
      upserts: number
      stale_removed: number
      stale_import_removed: number
      stale_manual_removed: number
    }>(
      apiRoutes.competitions.syncExternal,
      { method: 'POST' }
    )
    await refresh()
    await refreshRecurringClubTrainingSessions()
    toast.add({
      title: 'Zsynchronizowano kalendarze',
      description: `PZPC: ${res.pzpc_imported}, PC.pl: ${res.pc_imported}, merge: ${res.upserts}. `
        + `Czyszczenie poza bieżącym i następnym rokiem: ${res.stale_removed} (importy: ${res.stale_import_removed}, ręczne: ${res.stale_manual_removed}).`,
      color: 'success'
    })
  } catch (err) {
    toast.add({
      title: 'Synchronizacja nie powiodła się',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  } finally {
    syncLoading.value = false
  }
}

/** Kontekst otwartego wpisu (banner w modalu — external/training vs gość). */
const bannerEvent = ref<CalendarEvent | null>(null)

// Zarządzanie wydarzeniami
const isModalOpen = ref(false)

watch(isModalOpen, (open) => {
  if (!open) {
    bannerEvent.value = null
  }
})

const isSubmitting = ref(false)
const editingId = ref<string | null>(null)

const isEditingClubRecurringTraining = computed(
  () => typeof editingId.value === 'string' && editingId.value.startsWith('training-')
)

const formState = reactive({
  title: '',
  date: '',
  location: '',
  description: '',
  category: 'club_event',
  status: 'scheduled',
  club_participates: false
})
const readOnlyEvent = ref(false)

const canExportReadOnlyCompetitionIcs = computed(
  () =>
    readOnlyEvent.value
    && typeof editingId.value === 'string'
    && editingId.value.length > 0
    && !editingId.value.startsWith('training-')
    && bannerEvent.value?.type !== 'training'
)

function exportReadOnlyEventToIcs() {
  if (!canExportReadOnlyCompetitionIcs.value || !editingId.value) return
  const dateIso = formState.date?.slice(0, 10)
  if (!dateIso) return
  const cat = formState.category?.trim()
  const descParts = [formState.description?.trim(), cat ? `Kategoria: ${cat}` : ''].filter(Boolean)
  const content = generateIcsContent({
    title: formState.title || 'Wydarzenie',
    date: dateIso,
    location: formState.location,
    description: descParts.join('\n\n')
  })
  downloadIcs(formState.title || 'wydarzenie', content)
}

const categories = [
  { value: 'championship', label: '🏆 Mistrzostwa', desc: 'ogólnopol. / śląskie' },
  { value: 'league', label: '🥈 Liga', desc: 'zawody ligowe' },
  { value: 'club_event', label: '🌿 Wydarzenie klubowe', desc: 'obóz, zgrupowanie' },
  { value: 'training', label: '💪 Trening', desc: 'planowany trening lub zgrupowanie' }
]

const { getEventClasses, getEventIcon } = useCalendarEventChips()

async function openModal(date?: Date, event?: CalendarEvent) {
  if (auth.token.value) {
    await auth.fetchMe()
  }

  // Tworzenie nowego zdarzenia - tylko dla uprawniony
  if (!event && !canManageEvents.value) return

  bannerEvent.value = event ?? null

  participantIds.value = []
  readOnlyEvent.value = false
  if (event) {
    formState.title = event.title
    formState.date = event.date ? event.date.substring(0, 10) : (date ? format(date, 'yyyy-MM-dd') : '')
    formState.location = event.location || ''
    formState.description = event.description || ''
    formState.category = event.category || (event.type === 'training' ? 'training' : 'club_event')
    formState.status = event.status || 'scheduled'
    formState.club_participates = !!event.club_participates
    if (event.external_source || event.type === 'external') {
      editingId.value = event.id
      readOnlyEvent.value = !canManageEvents.value
      if (canManageEvents.value && event.id) {
        await loadAthletesPickList()
        const parts = await apiFetch<Array<{ athlete_id: string }>>(apiRoutes.competitions.participants(event.id)).catch(() => [])
        participantIds.value = parts.map(p => p.athlete_id)
      }
    } else if (event.type === 'training') {
      editingId.value = event.id?.startsWith('training-') ? event.id : `training-${event.date.substring(0, 10)}`
      readOnlyEvent.value = !canManageEvents.value
    } else {
      editingId.value = event.id
      readOnlyEvent.value = !canManageEvents.value
      if (canManageEvents.value && event.id) {
        await loadAthletesPickList()
        const parts = await apiFetch<Array<{ athlete_id: string }>>(apiRoutes.competitions.participants(event.id)).catch(() => [])
        participantIds.value = parts.map(p => p.athlete_id)
      }
    }
  } else {
    editingId.value = null
    formState.title = ''
    formState.date = date ? format(date, 'yyyy-MM-dd') : ''
    formState.location = ''
    formState.description = ''
    formState.category = 'club_event'
    formState.status = 'scheduled'
    formState.club_participates = false
    readOnlyEvent.value = false
    participantIds.value = []
    if (canManageEvents.value) {
      await loadAthletesPickList()
    }
  }
  isModalOpen.value = true
}

async function saveEvent() {
  if (!canManageEvents.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (String(editingId.value ?? '').startsWith('training-')) {
    const datePart = String(editingId.value).replace(/^training-/, '')
    isSubmitting.value = true
    try {
      if (formState.status === 'scheduled') {
        await apiFetch(apiRoutes.competitions.recurringTrainingCancellationOne(datePart), {
          method: 'DELETE'
        }).catch(() => {})
      } else {
        await apiFetch(apiRoutes.competitions.recurringTrainingCancellations, {
          method: 'POST',
          body: { session_date: datePart, status: formState.status }
        })
      }
      toast.add({
        title: 'Zapisano status treningu',
        description: 'Ta sama informacja jest widoczna u zawodników w „Mój kalendarz”.',
        color: 'success'
      })
      isModalOpen.value = false
      await refreshRecurringClubTrainingSessions()
    } catch (err) {
      toast.add({
        title: 'Nie udało się zapisać',
        description: getApiErrorMessage(err),
        color: 'error'
      })
    } finally {
      isSubmitting.value = false
    }
    return
  }

  const externalSrc = bannerEvent.value?.external_source
  if (!externalSrc && (!formState.title || !formState.date || !formState.location)) {
    toast.add({ title: 'Uzupełnij wymagane pola', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    let competitionId = editingId.value as string | null
    if (editingId.value) {
      await apiFetch(apiRoutes.competitions.one(editingId.value), {
        method: 'PATCH',
        body: {
          title: formState.title,
          date: formState.date,
          location: formState.location,
          description: formState.description,
          category: formState.category,
          status: formState.status,
          club_participates: formState.club_participates
        }
      })
      toast.add({
        title: externalSrc ? 'Zapisano status i przypisania' : 'Zaktualizowano',
        color: 'success'
      })
    } else {
      const created = await apiFetch<{ id: string }>(apiRoutes.competitions.collection, { method: 'POST', body: formState })
      competitionId = created?.id ?? null
      toast.add({ title: 'Dodano wydarzenie', color: 'success' })
    }
    if (competitionId && !String(competitionId).startsWith('training-')) {
      try {
        await apiFetch(apiRoutes.competitions.participants(competitionId), {
          method: 'PUT',
          body: { athlete_ids: participantIds.value }
        })
      } catch (pe) {
        toast.add({
          title: 'Wydarzenie zapisane — problem z przypisaniami',
          description: getApiErrorMessage(pe),
          color: 'warning'
        })
      }
    }
    isModalOpen.value = false
    await refresh()
  } catch (err) {
    toast.add({ title: 'Błąd zapisu', description: String(err), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function deleteEvent(id: string) {
  if (!canManageEvents.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (id.startsWith('training-')) {
    const datePart = id.replace(/^training-/, '')
    if (!confirm('Odwołać ten powtarzalny trening (Pn / Śr / Pt) w kalendarzu? Zapis w bazie — widoczne dla wszystkich użytkowników.')) {
      return
    }
    try {
      await apiFetch(apiRoutes.competitions.recurringTrainingCancellations, {
        method: 'POST',
        body: { session_date: datePart, status: 'cancelled' }
      })
      await refreshRecurringClubTrainingSessions()
      toast.add({
        title: 'Zapisano odwołanie treningu',
        color: 'success'
      })
      isModalOpen.value = false
    } catch (err) {
      toast.add({
        title: 'Nie udało się zapisać',
        description: getApiErrorMessage(err),
        color: 'error'
      })
    }
    return
  }

  const row = (competitions.value || []).find((c: Competition) => c.id === id) as Competition | undefined
  if (row?.external_source) {
    toast.add({
      title: 'Nie można usunąć',
      description: 'Zawody z importu są aktualizowane przyciskiem synchronizacji.',
      color: 'warning'
    })
    return
  }

  if (!confirm('Usunąć?')) return
  try {
    await apiFetch(apiRoutes.competitions.one(id), { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    isModalOpen.value = false
    await refresh()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    toast.add({ title: 'Błąd usuwania', color: 'error' })
  }
}

const nextMonth = () => {
  monthFirstMs.value = monthFirstMsFromDate(addMonths(new Date(monthFirstMs.value), 1))
}
const prevMonth = () => {
  monthFirstMs.value = monthFirstMsFromDate(subMonths(new Date(monthFirstMs.value), 1))
}
const goToToday = () => {
  monthFirstMs.value = monthFirstMsFromDate(new Date())
}

/** Usuń w bazie lub ukryj automatyczny wpis treningowy — bez usuwania importów zewnętrznych. */
const canShowCalendarDeleteButton = computed(() => {
  if (!editingId.value || !canManageEvents.value) return false
  if (bannerEvent.value?.external_source) return false
  const id = String(editingId.value)
  if (id.startsWith('training-')) return true
  return !readOnlyEvent.value
})

function handleDayClick(day: Date) {
  if (!canManageEvents.value || !isSameMonth(day, monthStart.value)) return
  openModal(day)
}
</script>

<template>
  <PublicPageLayout padding="compact">
    <PublicPageHeader
      variant="hero"
      eyebrow="CKS Slavia"
      icon="i-lucide-calendar-days"
      title="Kalendarz klubowy"
      description="Harmonogram treningów i startów klubowych."
    />

    <div class="slavia-content-well slavia-public-section mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-10">
    <div class="slavia-toolbar flex flex-col gap-4">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex flex-wrap items-center justify-center gap-2 md:justify-start">
        <div class="flex w-full items-center justify-center gap-1 rounded-xl border border-default/60 bg-card/80 p-1 shadow-sm sm:w-auto">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          @click="prevMonth"
        />
        <UButton
          variant="ghost"
          color="neutral"
          class="min-w-0 flex-1 truncate px-2 text-sm font-bold capitalize text-highlighted sm:min-w-[10rem] sm:flex-none sm:text-base"
          @click="goToToday"
        >
          {{ format(currentDate, 'MMMM yyyy', { locale: pl }) }}
        </UButton>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          @click="nextMonth"
        />
        </div>
        <CalendarViewModeToggle
          v-if="showCalendarViewToggle"
          :model-value="calendarViewMode"
          @update:model-value="setCalendarViewMode"
        />
      </div>

      <div class="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end md:w-auto md:flex-none md:max-w-xl">
        <UButton
          v-if="canSyncExternalCalendars"
          icon="i-lucide-download-cloud"
          size="lg"
          color="neutral"
          variant="ghost"
          class="min-h-11 w-full justify-center text-sm sm:w-auto sm:text-base"
          :loading="syncLoading"
          @click="syncExternalCalendars"
        >
          Synchronizuj PZPC i PC
        </UButton>
        <UButton
          v-if="canManageEvents"
          icon="i-lucide-plus"
          size="lg"
          class="min-h-11 w-full justify-center sm:w-auto"
          @click="openModal()"
        >
          Dodaj wydarzenie
        </UButton>
        <UButton
          v-if="canManageEvents && recurringClubTrainingOverridesCount > 0"
          icon="i-lucide-rotate-ccw"
          size="lg"
          color="neutral"
          variant="outline"
          class="min-h-11 w-full justify-center sm:w-auto"
          @click="restoreAllRecurringTrainingsInDb"
        >
          Przywróć treningi (Pn/Śr/Pt)
        </UButton>
      </div>
      </div>
      <p
        v-if="canManageEvents"
        class="rounded-xl border border-default/50 bg-muted/15 px-4 py-3 text-[11px] leading-relaxed text-muted sm:text-xs"
      >
        <strong class="text-default">Synchronizacja</strong> scala PZPC i PodnoszenieCiezarow.pl oraz
        <strong class="text-default">usuwa z bazy wydarzenia spoza bieżącego i następnego roku</strong>
        (w tym wpisy dodane ręcznie).
      </p>
    </div>

    <PublicApiErrorBanner
      v-if="competitionsError"
      :error="competitionsError"
      class="mb-4"
      @retry="refresh()"
    />

    <div
      v-if="competitionsPending"
      class="mb-4 rounded-xl border border-dashed border-default bg-muted/20 px-4 py-3"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <SlaviaShimmerText width="10rem" height="0.95rem" />
          <SlaviaShimmerText width="6rem" height="0.95rem" />
        </div>
        <SlaviaShimmerText block width="100%" height="0.85rem" />
      </div>
    </div>

    <!-- Calendar Grid (desktop, gdy wybrano Kalendarz) -->
    <div
      class="slavia-calendar-grid hidden max-sm:hidden overflow-hidden rounded-2xl border border-default/60 bg-card/90 shadow-sm ring-1 ring-default/30"
      :class="calendarEffectiveView === 'grid' ? 'sm:block' : ''"
    >
      <!-- Header -->
      <div class="grid grid-cols-7 border-b border-default/50 bg-muted/15">
        <div
          v-for="day in weekDays"
          :key="day"
          class="py-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted sm:py-3.5 sm:text-xs"
        >
          {{ day }}
        </div>
      </div>

      <!-- Days -->
      <div class="slavia-calendar-days grid grid-cols-7">
        <div
          v-for="day in days"
          :key="day.toString()"
          class="slavia-calendar-day group relative flex flex-col border-b border-r border-default/45 bg-background transition-colors last:border-r-0 hover:bg-muted/20"
          :class="[
            isCompactTablet
              ? 'min-h-[100px] p-1.5 sm:min-h-[120px]'
              : 'min-h-[124px] p-2 sm:min-h-[156px] sm:p-2.5 md:min-h-[176px] lg:min-h-[192px]',
            !isSameMonth(day, monthStart) ? 'bg-muted/8 opacity-45' : '',
            isToday(day) ? 'bg-primary/[0.04] ring-1 ring-inset ring-primary/20' : ''
          ]"
          @click="handleDayClick(day)"
        >
          <div class="mb-1.5 flex shrink-0 items-start justify-between gap-1 sm:mb-2">
            <span
              class="flex size-7 items-center justify-center rounded-full text-sm font-bold tabular-nums sm:size-8 sm:text-base"
              :class="isToday(day) ? 'bg-primary/15 font-black text-primary ring-1 ring-primary/30' : 'text-muted'"
            >
              {{ format(day, 'd') }}
            </span>
            <div class="flex items-center gap-1">
              <UBadge
                v-if="getEventsForDay(day).length > 0 && isSameMonth(day, monthStart)"
                color="neutral"
                variant="subtle"
                size="xs"
                class="font-bold tabular-nums"
              >
                {{ getEventsForDay(day).length }}
              </UBadge>
              <UButton
                v-if="canManageEvents && isSameMonth(day, monthStart)"
                icon="i-lucide-plus"
                variant="ghost"
                size="xs"
                class="opacity-0 transition-opacity group-hover:opacity-100"
                @click.stop="openModal(day)"
              />
            </div>
          </div>

          <div
            class="scrollbar-hide min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5"
            :class="
              isCompactTablet
                ? 'max-h-[76px] sm:max-h-[92px]'
                : 'max-h-[92px] sm:max-h-[120px] md:max-h-[140px] lg:max-h-[156px]'
            "
          >
            <div
              v-for="event in getEventsForDay(day)"
              :key="event.id"
              class="slavia-calendar-event cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-medium leading-snug transition-colors hover:opacity-95"
              :class="getEventClasses(event)"
              @click.stop="openModal(undefined, event)"
            >
              <div class="flex items-start justify-between gap-1.5">
                <span class="line-clamp-2 min-w-0 flex-1 leading-tight">{{ event.title }}</span>
                <UIcon
                  :name="getEventIcon(event)"
                  class="mt-0.5 size-3 shrink-0 opacity-80"
                />
              </div>
              <span
                v-if="event.time || event.location"
                class="mt-0.5 block truncate text-[10px] opacity-80"
              >
                {{ event.time || event.location }}
              </span>
              <span
                v-if="event.club_participates && event.type !== 'training'"
                class="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-primary/90"
              >
                Start klubu
              </span>
              <span
                v-if="event.status && event.status !== 'scheduled'"
                class="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-90"
              >
                {{
                  event.status === 'cancelled'
                    ? 'Odwołane'
                    : event.status === 'moved'
                      ? 'Przesunięte'
                      : event.status
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Agenda (mobile zawsze; desktop gdy wybrano Agenda) -->
    <div
      class="mt-4 block max-sm:block"
      :class="calendarEffectiveView === 'agenda' ? 'sm:block' : 'sm:hidden'"
    >
      <CalendarMonthAgenda
        :rows="monthAgendaRows"
        :can-add-on-day="canManageEvents"
        empty-description="Przełącz miesiąc lub dodaj wydarzenie."
        @select="onAgendaSelect"
        @add-day="onAgendaAddDay"
      />
    </div>

    <!-- Legenda -->
    <div class="slavia-page-card grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-blue-500/40 border border-blue-500/50 shrink-0" />
        <div>
          <p class="text-xs font-black text-blue-400 uppercase">
            Trening
          </p>
          <p class="text-[10px] text-muted">
            Pn, Śr, Pt 15-18
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-red-500/40 border border-red-500/50 shrink-0" />
        <div>
          <p class="text-xs font-black text-red-400 uppercase">
            Mistrzostwa
          </p>
          <p class="text-[10px] text-muted">
            ogólnopol. / śląskie
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-amber-500/40 border border-amber-500/50 shrink-0" />
        <div>
          <p class="text-xs font-black text-amber-400 uppercase">
            Liga
          </p>
          <p class="text-[10px] text-muted">
            zawody ligowe
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-3 h-7 rounded-full bg-teal-500/40 border border-teal-500/50 shrink-0" />
        <div>
          <p class="text-xs font-black text-teal-400 uppercase">
            Wydarzenie klubowe
          </p>
          <p class="text-[10px] text-muted">
            obóz, zgrupowanie
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3 sm:col-span-2">
        <div class="w-3 h-7 rounded-full bg-indigo-500/35 border border-indigo-500/50 shrink-0" />
        <div>
          <p class="text-xs font-black text-indigo-300 uppercase">
            Import zewnętrzny
          </p>
          <p class="text-[10px] text-muted">
            PZPC lub PodnoszenieCiezarow.pl — synchronizacja do bazy
          </p>
        </div>
      </div>
    </div>
    </div>

    <SlaviaEditorSheet
      v-model:open="isModalOpen"
      :title="readOnlyEvent ? 'Szczegóły wydarzenia' : (editingId ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie')"
      size="lg"
      :prevent-close="isSubmitting"
      scroll-restore-key="kalendarz-event-sheet"
    >
      <div class="slavia-form-stack">
          <div
            v-if="readOnlyEvent"
            class="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100"
          >
            <template v-if="bannerEvent?.external_source || bannerEvent?.type === 'external'">
              <span v-if="canManageEvents">Zawody z kalendarza zewnętrznego (PZPC lub PodnoszenieCiezarow.pl) — nazwa i termin są aktualizowane przy synchronizacji. Możesz zmienić status oraz przypisać zawodników klubu.</span>
              <span v-else>Importer z krajowych kalendarzy — szczegóły tylko do odczytu. Przypisania widzą zawodnicy po zalogowaniu.</span>
            </template>
            <template v-else-if="bannerEvent?.type === 'training'">
              <span v-if="canManageEvents">Stałe treningi (Pn, Śr, Pt). Zmiana <strong>statusu</strong> (np. odwołane, przesunięte) i przycisk „Usuń z kalendarza” zapisują się w bazie — <strong>ten sam widok mają zawodnicy</strong> w „Mój kalendarz”. Pełna siatka: przycisk przywrócenia u góry.</span>
              <span v-else>To stały wpis treningowy z grafiku — podgląd bez edycji. Wydarzenia klubu dodaje trener lub administrator po zalogowaniu.</span>
            </template>
            <template v-else>
              Podgląd tylko do odczytu. Zaloguj się jako trener lub administrator, aby dodawać i edytować wydarzenia z bazy klubu.
            </template>
          </div>
          <UFormField
            label="Kategoria"
            required
          >
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="cat in categories"
                :key="cat.value"
                type="button"
                class="p-2.5 rounded-xl border-2 text-[11px] font-bold text-center transition-all"
                :class="formState.category === cat.value
                  ? cat.value === 'championship' ? 'bg-red-500/20 border-red-500 text-red-400'
                    : cat.value === 'league' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-teal-500/20 border-teal-500 text-teal-400'
                  : 'border-default bg-muted/10 text-muted hover:bg-muted/30'"
                :disabled="readOnlyEvent || isEditingClubRecurringTraining"
                @click="!readOnlyEvent && !isEditingClubRecurringTraining && (formState.category = cat.value)"
              >
                {{ cat.label }}
              </button>
            </div>
          </UFormField>

          <UFormField
            label="Nazwa"
            required
          >
            <UInput
              v-model="formState.title"
              placeholder="Mistrzostwa Polski..."
              size="lg"
              class="w-full"
              :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
            />
          </UFormField>
          <div class="slavia-form-grid grid-cols-1 sm:grid-cols-2">
            <UFormField
              label="Data"
              required
            >
              <UInput
                v-model="formState.date"
                type="date"
                size="lg"
                class="w-full"
                :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
              />
            </UFormField>
            <UFormField
              label="Lokalizacja"
              required
            >
              <UInput
                v-model="formState.location"
                placeholder="Ruda Śląska"
                size="lg"
                class="w-full"
                :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
              />
            </UFormField>
          </div>
          <UFormField label="Status">
            <SlaviaFormNativeSelect
              v-model="formState.status"
              :disabled="readOnlyEvent && !bannerEvent?.external_source"
            >
              <option value="scheduled">
                Zaplanowane
              </option>
              <option value="cancelled">
                Odwołane
              </option>
              <option value="moved">
                Przesunięte
              </option>
            </SlaviaFormNativeSelect>
          </UFormField>
          <div
            v-if="canManageEvents && !isEditingClubRecurringTraining && (editingId == null || !String(editingId).startsWith('training-'))"
            class="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-1"
          >
            <label class="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                v-model="formState.club_participates"
                type="checkbox"
                class="rounded border-default"
              >
              <span>Klub bierze udział w zawodach</span>
            </label>
            <p class="text-xs text-muted pl-6">
              Bez przypisywania zawodników — wpis liczy się w statystykach na stronie Klub.
            </p>
          </div>
          <div
            v-else-if="formState.club_participates && bannerEvent?.type !== 'training'"
            class="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-primary"
          >
            Klub bierze udział w tych zawodach.
          </div>
          <div
            v-if="canManageEvents && !readOnlyEvent && athletesPickList.length && (editingId == null || !String(editingId).startsWith('training-'))"
            class="rounded-xl border border-default p-3 space-y-2"
          >
            <p class="text-xs font-bold text-muted uppercase tracking-wide">
              Przypisani zawodnicy (startują razem)
            </p>
            <div class="max-h-40 overflow-y-auto space-y-2">
              <label
                v-for="a in athletesPickList"
                :key="a.id"
                class="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  v-model="participantIds"
                  type="checkbox"
                  :value="a.id"
                  class="rounded border-default"
                >
                <span>{{ a.full_name }}</span>
              </label>
            </div>
          </div>
          <UFormField label="Opis">
            <UTextarea
              v-model="formState.description"
              placeholder="Szczegóły..."
              :rows="4"
              class="w-full"
              :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
            />
          </UFormField>
          <div
            v-if="bannerEvent?.external_url"
            class="text-sm"
          >
            <a
              :href="bannerEvent.external_url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-primary underline underline-offset-2 hover:no-underline"
            >
              Otwórz stronę źródła zawodów
            </a>
          </div>
      </div>
      <template #footer>
        <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-h-10 shrink-0 flex-wrap items-center gap-2">
            <UButton
              v-if="canExportReadOnlyCompetitionIcs"
              variant="soft"
              color="primary"
              size="lg"
              icon="i-lucide-calendar-plus"
              @click="exportReadOnlyEventToIcs"
            >
              Dodaj do kalendarza (.ics)
            </UButton>
            <UButton
              v-if="canShowCalendarDeleteButton"
              color="error"
              variant="ghost"
              size="lg"
              icon="i-lucide-trash-2"
              @click="editingId && deleteEvent(editingId)"
            >
              {{ typeof editingId === 'string' && editingId.startsWith('training-') ? 'Usuń z kalendarza' : 'Usuń' }}
            </UButton>
          </div>
          <div class="slavia-form-actions w-full sm:w-auto">
            <UButton
              color="neutral"
              variant="soft"
              size="lg"
              @click="isModalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              size="lg"
              :loading="isSubmitting"
              :disabled="readOnlyEvent && !bannerEvent?.external_source"
              @click="saveEvent"
            >
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaEditorSheet>
  </PublicPageLayout>
</template>



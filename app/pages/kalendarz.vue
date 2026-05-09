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
const config = useRuntimeConfig()

function publicBase() {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

const canManageEvents = computed(() => auth.isTrainer.value || auth.isSuperAdmin.value)
const canSyncExternalCalendars = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)

const syncLoading = ref(false)

// Bez SSR: na hostingu Node często nie ma dostępu do API / złego apiBase — strona się wywalała u gości.
const {
  data: competitions,
  refresh,
  pending: competitionsPending
} = await useLazyFetch<Competition[]>(
  () => `${publicBase()}${apiRoutes.competitions.collection}`,
  {
    key: 'competitions-public',
    default: () => [],
    server: false
  }
)

const {
  data: recurringClubTrainingSessions,
  refresh: refreshRecurringClubTrainingSessions
} = await useLazyFetch<RecurringTrainingSession[]>(
  () => `${publicBase()}${apiRoutes.competitions.recurringTrainingCancellations}`,
  {
    key: 'recurring-training-sessions',
    default: () => [],
    server: false
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
    external_source: e.external_source || undefined
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
  status: 'scheduled'
})
const readOnlyEvent = ref(false)

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
          status: formState.status
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
  <UContainer class="py-6 sm:py-10 lg:py-14">
    <div class="mb-6 flex flex-col gap-5 sm:mb-8 md:flex-row md:items-center md:justify-between md:gap-6 lg:mb-10">
      <div class="min-w-0 text-center md:text-left">
        <h1 class="text-2xl font-black uppercase italic tracking-tight text-highlighted sm:text-3xl md:text-4xl lg:text-5xl">
          Kalendarz <span class="text-primary italic">Slavia</span>
        </h1>
        <p class="mt-1 font-medium text-muted">
          Harmonogram treningów i startów klubowych.
        </p>
      </div>

      <div class="flex w-full items-center justify-center gap-2 rounded-xl border border-default bg-muted/20 p-1.5 md:w-auto">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          @click="prevMonth"
        />
        <UButton
          variant="ghost"
          color="neutral"
          class="min-w-0 flex-1 truncate px-2 font-bold text-highlighted sm:min-w-[140px] sm:flex-none"
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

      <div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-end md:w-auto md:flex-none">
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
      <p
        v-if="canManageEvents"
        class="mx-auto max-w-2xl text-center text-[11px] leading-snug text-muted md:mx-0 md:text-left"
      >
        <strong>Synchronizacja</strong> scala PZPC i PodnoszenieCiezarow.pl oraz
        <strong class="text-default">usuwa z bazy wszystkie wydarzenia spoza bieżącego i następnego roku</strong>
        (w tym wpisy dodane ręcznie). Administratorzy i trenerzy uruchamiają ją tutaj.
      </p>
    </div>

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

    <!-- Calendar Grid -->
    <div class="overflow-hidden rounded-2xl border border-default bg-card shadow-2xl">
      <!-- Header -->
      <div class="grid grid-cols-7 border-b border-default bg-muted/30">
        <div
          v-for="day in weekDays"
          :key="day"
          class="py-2 text-center text-[10px] font-black uppercase tracking-wide text-muted sm:py-4 sm:text-xs sm:tracking-widest"
        >
          {{ day }}
        </div>
      </div>

      <!-- Days -->
      <div class="grid grid-cols-7">
        <div
          v-for="day in days"
          :key="day.toString()"
          class="group relative min-h-[92px] border-b border-r border-default p-1.5 transition-colors last:border-r-0 hover:bg-primary/5 sm:min-h-[120px] sm:p-2 md:min-h-[140px]"
          :class="[
            !isSameMonth(day, monthStart) ? 'bg-muted/10 opacity-30' : '',
            isToday(day) ? 'bg-primary/5' : ''
          ]"
          @click="handleDayClick(day)"
        >
          <div class="flex justify-between items-start mb-2">
            <span
              class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full"
              :class="isToday(day) ? 'bg-primary text-white shadow-lg' : 'text-muted'"
            >
              {{ format(day, 'd') }}
            </span>
            <UButton
              v-if="canManageEvents && isSameMonth(day, monthStart)"
              icon="i-lucide-plus"
              variant="ghost"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="openModal(day)"
            />
          </div>

          <div class="scrollbar-hide max-h-[76px] space-y-1 overflow-y-auto sm:max-h-[100px]">
            <div
              v-for="event in getEventsForDay(day)"
              :key="event.id"
              class="text-[10px] p-1.5 rounded-lg border flex flex-col leading-tight cursor-pointer transition-all hover:brightness-110"
              :class="getEventClasses(event)"
              @click.stop="openModal(undefined, event)"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="truncate">{{ event.title }}</span>
                <UIcon
                  :name="getEventIcon(event)"
                  class="size-2.5 shrink-0 opacity-80"
                />
              </div>
              <span class="opacity-60">{{ event.time || event.location }}</span>
              <span
                v-if="event.status && event.status !== 'scheduled'"
                class="text-[10px] uppercase tracking-[0.15em] font-semibold mt-1"
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

    <!-- Agenda (mobile) -->
    <div class="mt-4 sm:hidden">
      <UCard class="rounded-2xl border-default/70">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Agenda miesiąca
          </p>
          <UBadge variant="subtle" color="neutral">
            {{ monthAgenda.length }}
          </UBadge>
        </div>

        <div class="mt-3 space-y-2">
          <div
            v-for="row in monthAgenda"
            :key="row.day.toISOString()"
            class="rounded-xl border border-default/60 bg-muted/10 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-bold text-highlighted">
                {{ format(row.day, 'EEEE · dd.MM', { locale: pl }) }}
              </p>
              <UButton
                v-if="canManageEvents"
                size="xs"
                variant="ghost"
                icon="i-lucide-plus"
                @click="openModal(row.day)"
              />
            </div>
            <div class="mt-2 space-y-1">
              <button
                v-for="event in row.events"
                :key="event.id"
                type="button"
                class="flex w-full items-start justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs"
                :class="getEventClasses(event)"
                @click="openModal(undefined, event)"
              >
                <span class="min-w-0">
                  <span class="block truncate font-bold">
                    {{ event.title }}
                  </span>
                  <span class="block truncate opacity-70">
                    {{ event.time || event.location || '—' }}
                  </span>
                </span>
                <UIcon
                  :name="getEventIcon(event)"
                  class="size-4 shrink-0 opacity-80"
                />
              </button>
            </div>
          </div>

          <UAlert
            v-if="monthAgenda.length === 0"
            icon="i-lucide-inbox"
            title="Brak wydarzeń w tym miesiącu"
            description="Przełącz miesiąc lub dodaj wydarzenie."
            color="neutral"
            variant="subtle"
          />
        </div>
      </UCard>
    </div>

    <!-- Legenda -->
    <div class="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-default bg-muted/10 p-4 sm:mt-8 sm:grid-cols-2 sm:gap-3 sm:p-5 lg:grid-cols-4">
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

    <!-- Modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="readOnlyEvent ? 'Szczegóły wydarzenia' : (editingId ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie')"
      :dismissible="true"
      :ui="{ overlay: 'z-[190]', content: 'z-[200] max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl' }"
    >
      <template #content>
        <div class="slavia-form-modal">
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
          <div class="grid grid-cols-2 gap-4">
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
            <select
              v-model="formState.status"
              class="slavia-select w-full"
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
            </select>
          </UFormField>
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
          <div class="mt-6 flex flex-col gap-3 border-t border-default/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-h-10 shrink-0">
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
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

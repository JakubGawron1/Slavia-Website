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

function monthFirstMsFromDate(d: Date | number | string) {
  const dt = d instanceof Date ? d : new Date(d)
  if (!isValid(dt)) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  }
  const t = new Date(dt.getFullYear(), dt.getMonth(), 1).getTime()
  return Number.isFinite(t) ? t : Date.now()
}

const categories = [
  { value: 'championship', label: '🏆 Mistrzostwa', desc: 'ogólnopol. / śląskie' },
  { value: 'league', label: '🥈 Liga', desc: 'zawody ligowe' },
  { value: 'club_event', label: '🌿 Wydarzenie klubowe', desc: 'obóz, zgrupowanie' },
  { value: 'training', label: '💪 Trening', desc: 'planowany trening lub zgrupowanie' }
]

/** Dane, uprawnienia i akcje strony `/kalendarz`. */
export async function usePublicCalendarPage() {
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

  const {
    data: competitions,
    refresh,
    pending: competitionsPending
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

  const getTrainingsForDay = (date: Date) => {
    const day = getDay(date)
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

    const comps: CalendarEvent[] = (competitions.value || []).filter((e: Competition) => typeof e?.date === 'string' && e.date.startsWith(dateStr)).map((e: Competition): CalendarEvent => ({
      ...e,
      type: e.external_source ? 'external' : 'competition',
      external_source: e.external_source || undefined,
      club_participates: !!e.club_participates
    }))

    return [...getTrainingsForDay(date), ...comps]
  }

  function dayCellAriaLabel(day: Date) {
    const labelDate = format(day, 'd MMMM yyyy', { locale: pl })
    const events = getEventsForDay(day)
    if (events.length === 0) {
      return `${labelDate}, brak wydarzeń`
    }
    const titles = events.map(e => e.title).join(', ')
    return `${labelDate}, ${events.length} wydarzeń: ${titles}`
  }

  const monthAgenda = computed(() => {
    const start = startOfMonth(monthStart.value)
    const end = endOfMonth(monthStart.value)
    const monthDays = eachDayOfInterval({ start, end })
    return monthDays
      .map((d) => ({
        day: d,
        events: getEventsForDay(d)
      }))
      .filter(x => x.events.length > 0)
  })

  function eventAgendaKey(event: { id: string | number, type?: string }) {
    return `${event.id}-${event.type ?? 'event'}`
  }

  const { getEventClasses, getEventIcon } = useCalendarEventChips()

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

  const bannerEvent = ref<CalendarEvent | null>(null)
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

  async function openModal(date?: Date, event?: CalendarEvent) {
    if (auth.token.value) {
      await auth.fetchMe()
    }

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

  return {
    athletesPickList,
    bannerEvent,
    calendarEffectiveView,
    calendarViewMode,
    canExportReadOnlyCompetitionIcs,
    canManageEvents,
    canShowCalendarDeleteButton,
    canSyncExternalCalendars,
    categories,
    competitionsPending,
    currentDate,
    dayCellAriaLabel,
    days,
    deleteEvent,
    editingId,
    exportReadOnlyEventToIcs,
    formState,
    getEventClasses,
    getEventIcon,
    getEventsForDay,
    goToToday,
    handleDayClick,
    isCompactTablet,
    isEditingClubRecurringTraining,
    isModalOpen,
    isSubmitting,
    monthAgendaRows,
    monthStart,
    nextMonth,
    onAgendaAddDay,
    onAgendaSelect,
    openModal,
    participantIds,
    prevMonth,
    readOnlyEvent,
    recurringClubTrainingOverridesCount,
    restoreAllRecurringTrainingsInDb,
    saveEvent,
    setCalendarViewMode,
    showCalendarViewToggle,
    syncExternalCalendars,
    syncLoading,
    weekDays
  }
}

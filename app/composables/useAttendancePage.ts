import type { Athlete } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek
} from 'date-fns'
import { pl } from 'date-fns/locale'

export type AttendanceRecord = {
  id: string
  athlete_id: string
  session_date: string
  status: string
  source_role: string
  verification_state: string
  note?: string | null
  created_at: string
}

export type AttendanceView = 'calendar' | 'qr' | 'scan'

type CompetitionRow = { id: string, date: string, category?: string | null, status?: string }

export function useAttendancePage() {
  const auth = useAuth()
  const route = useRoute()
  const router = useRouter()
  const api = useApi()
  const toast = useToast()
  const qrEnabled = useExperimentalFlag('attendance_qr_checkin')
  const { isStaff } = useRoleAwareCopy()

  const attendanceViews = computed(() => {
    const views: Array<{ id: AttendanceView, label: string, icon: string }> = [
      { id: 'calendar', label: 'Kalendarz', icon: 'i-lucide-calendar-days' }
    ]
    if (isStaff.value && qrEnabled.value) {
      views.push({ id: 'qr', label: 'Kod QR dla sali', icon: 'i-lucide-qr-code' })
    }
    if (!isStaff.value && qrEnabled.value) {
      views.push({ id: 'scan', label: 'Skaner QR', icon: 'i-lucide-scan-line' })
    }
    return views
  })

  const activeView = computed<AttendanceView>({
    get() {
      const q = String(route.query.view || '')
      if (q === 'qr' || q === 'scan') return q
      return 'calendar'
    },
    set(id: AttendanceView) {
      const query = { ...route.query }
      if (id === 'calendar') delete query.view
      else query.view = id
      router.replace({ query })
    }
  })

  watch(attendanceViews, (views) => {
    if (!views.some(v => v.id === activeView.value)) {
      activeView.value = 'calendar'
    }
  }, { immediate: true })

  const selectedAthleteId = ref('')
  const status = ref<'obecny' | 'nieobecny'>('obecny')
  const note = ref('')
  const sessionDate = ref(new Date().toISOString().slice(0, 10))
  const records = ref<AttendanceRecord[]>([])
  const pendingQueue = ref<AttendanceRecord[]>([])
  const pendingLoading = ref(false)
  const bulkVerifying = ref(false)
  const verifyingId = ref<string | null>(null)
  const monthRef = ref(new Date())
  const {
    viewMode: calendarViewMode,
    effectiveView: calendarEffectiveView,
    showViewToggle: showCalendarViewToggle,
    setViewMode: setCalendarViewMode
  } = useCalendarViewMode('attendance')
  const attendanceModalOpen = ref(false)
  const selectedTrainingDay = ref<Date | null>(null)
  const recurringOverrides = ref<Array<{ session_date: string, status: string }>>([])
  const savingAttendance = ref(false)

  const { data: calendarCompetitions, refresh: refreshCalendarCompetitions } = useLazyAsyncData(
    'attendance-calendar-competitions',
    () => api<CompetitionRow[]>(apiRoutes.competitions.collection).catch(() => []),
    { default: () => [], server: false }
  )

  const extraTrainingDates = computed(() => {
    const set = new Set<string>()
    for (const c of calendarCompetitions.value ?? []) {
      const cat = (c.category ?? '').toLowerCase()
      if (cat !== 'training') continue
      if ((c.status ?? 'scheduled') === 'cancelled') continue
      if (c.date) set.add(c.date.slice(0, 10))
    }
    return set
  })

  const { data: athletes } = useAsyncData('attendance-athletes', async (): Promise<Athlete[]> => {
    if (isStaff.value) {
      return api<Athlete[]>('/api/athletes/admin').catch(() => [])
    }
    const me = await api<Athlete | null>('/api/athletes/me').catch(() => null)
    return me ? [me] : []
  })

  watch(
    () => athletes.value,
    (list) => {
      if (!selectedAthleteId.value && Array.isArray(list) && list.length > 0) {
        selectedAthleteId.value = list[0]!.id
      }
    },
    { immediate: true }
  )

  const athleteNameById = computed(() => {
    const map = new Map<string, string>()
    for (const a of athletes.value || []) {
      map.set(a.id, a.full_name)
    }
    return map
  })

  function athleteLabel(id: string) {
    return athleteNameById.value.get(id) || 'Zawodnik'
  }

  const monthStart = computed(() => startOfMonth(monthRef.value))
  const monthEnd = computed(() => endOfMonth(monthRef.value))
  const gridStart = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 1 }))
  const gridEnd = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 1 }))
  const days = computed(() => eachDayOfInterval({ start: gridStart.value, end: gridEnd.value }))
  const daysInMonth = computed(() => eachDayOfInterval({ start: monthStart.value, end: monthEnd.value }))
  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'] as const

  const recordsByDate = computed(() => {
    const map = new Map<string, AttendanceRecord>()
    for (const r of records.value) {
      map.set(r.session_date.slice(0, 10), r)
    }
    return map
  })

  const monthStats = computed(() => {
    let present = 0
    let absent = 0
    let pending = 0
    for (const r of records.value) {
      if (r.verification_state === 'pending') pending++
      else if (r.status === 'obecny') present++
      else if (r.status === 'nieobecny') absent++
    }
    return { present, absent, pending }
  })

  const activeRecordForSession = computed(() => recordsByDate.value.get(sessionDate.value))

  const activePendingForSession = computed(() => {
    const key = sessionDate.value
    const fromAthlete = activeRecordForSession.value
    if (fromAthlete?.verification_state === 'pending') return fromAthlete
    return pendingQueue.value.find(r => r.session_date.slice(0, 10) === key) ?? null
  })

  const recurringStatusByDate = computed(() => {
    const map = new Map<string, string>()
    for (const r of recurringOverrides.value) {
      map.set(r.session_date.slice(0, 10), r.status || 'cancelled')
    }
    return map
  })

  const modalPrimaryLabel = computed(() => {
    if (isStaff.value && activePendingForSession.value) return 'Zatwierdź obecność'
    return 'Zapisz obecność'
  })

  function isTrainingDay(date: Date) {
    const key = format(date, 'yyyy-MM-dd')
    if (extraTrainingDates.value.has(key)) return true
    const override = recurringStatusByDate.value.get(key)
    if (override === 'extra') return true
    if (override === 'cancelled' || override === 'moved') return false
    return [1, 3, 5].includes(getDay(date))
  }

  function trainingStatusForDate(date: Date) {
    const key = format(date, 'yyyy-MM-dd')
    if (extraTrainingDates.value.has(key)) return 'scheduled'
    return recurringStatusByDate.value.get(key) ?? 'scheduled'
  }

  function openDay(date: Date) {
    sessionDate.value = format(date, 'yyyy-MM-dd')
    const rec = recordsByDate.value.get(sessionDate.value)
    if (rec?.status === 'obecny' || rec?.status === 'nieobecny') {
      status.value = rec.status
    } else {
      status.value = 'obecny'
    }
    note.value = rec?.note || ''
  }

  function openTrainingModal(date: Date) {
    if (!isTrainingDay(date)) return
    selectedTrainingDay.value = date
    const key = format(date, 'yyyy-MM-dd')
    const pendingOnDay = pendingQueue.value.find(r => r.session_date.slice(0, 10) === key)
    if (isStaff.value && pendingOnDay) {
      selectedAthleteId.value = pendingOnDay.athlete_id
    }
    openDay(date)
    attendanceModalOpen.value = true
  }

  function prevMonth() {
    monthRef.value = new Date(monthRef.value.getFullYear(), monthRef.value.getMonth() - 1, 1)
  }

  function nextMonth() {
    monthRef.value = new Date(monthRef.value.getFullYear(), monthRef.value.getMonth() + 1, 1)
  }

  function goToToday() {
    monthRef.value = new Date()
  }

  function statusColor(s: string) {
    if (s === 'obecny') return 'success'
    if (s === 'nieobecny') return 'error'
    return 'neutral'
  }

  function statusLabelPl(s: string) {
    if (s === 'obecny') return 'Obecny'
    if (s === 'nieobecny') return 'Nieobecny'
    return s || '—'
  }

  function trainingStatusLabelPl(s: string) {
    if (s === 'scheduled') return 'Planowy'
    if (s === 'cancelled') return 'Odwołany'
    return s || '—'
  }

  function trainingStatusColor(s: string) {
    if (s === 'scheduled') return 'success'
    if (s === 'cancelled') return 'warning'
    return 'neutral'
  }

  function dayAccentClass(day: Date) {
    const inMonth = isSameMonth(day, monthStart.value)
    const isT = isTrainingDay(day)
    const key = format(day, 'yyyy-MM-dd')
    const rec = recordsByDate.value.get(key)
    const tStatus = trainingStatusForDate(day)

    const base = inMonth ? 'bg-card/80' : 'bg-muted/5 opacity-55'
    if (!isT) return base

    if (tStatus !== 'scheduled') return `${base} ring-1 ring-warning/25`
    if (rec?.verification_state === 'pending') return `${base} ring-2 ring-warning/45 bg-warning/8`
    if (rec?.status === 'obecny') return `${base} ring-1 ring-success/30 bg-success/8`
    if (rec?.status === 'nieobecny') return `${base} ring-1 ring-error/25 bg-error/8`
    return `${base} ring-1 ring-primary/20 bg-primary/5`
  }

  async function refreshHistory() {
    if (!selectedAthleteId.value) {
      records.value = []
      return
    }
    records.value = await api<AttendanceRecord[]>(apiRoutes.attendance.athlete(selectedAthleteId.value)).catch(() => [])
  }

  async function refreshPendingQueue() {
    if (!isStaff.value) {
      pendingQueue.value = []
      return
    }
    pendingLoading.value = true
    try {
      pendingQueue.value = await api<AttendanceRecord[]>(
        `${apiRoutes.attendance.collection}?verification_state=pending`
      ).catch(() => [])
    } finally {
      pendingLoading.value = false
    }
  }

  async function refreshTrainingOverrides() {
    recurringOverrides.value = await api<Array<{ session_date: string, status: string }>>(
      apiRoutes.competitions.recurringTrainingCancellations
    ).catch(() => [])
  }

  async function refreshAll() {
    await Promise.all([
      refreshHistory(),
      refreshPendingQueue(),
      refreshTrainingOverrides(),
      refreshCalendarCompetitions()
    ])
  }

  watch(selectedAthleteId, () => {
    void refreshHistory()
  })

  async function verifyRecord(id: string): Promise<boolean> {
    try {
      await api(apiRoutes.attendance.verifyRecord(id), { method: 'POST' })
      return true
    } catch (e) {
      toast.add({
        title: 'Nie udało się zatwierdzić',
        description: getApiErrorMessage(e),
        color: 'error'
      })
      return false
    }
  }

  async function approvePendingRecord(rec: AttendanceRecord) {
    if (verifyingId.value) return
    verifyingId.value = rec.id
    try {
      const ok = await verifyRecord(rec.id)
      if (ok) {
        toast.add({
          title: 'Zatwierdzono',
          description: `${athleteLabel(rec.athlete_id)} · ${rec.session_date.slice(0, 10)}`,
          color: 'success'
        })
        pendingQueue.value = pendingQueue.value.filter(r => r.id !== rec.id)
        if (rec.athlete_id === selectedAthleteId.value) {
          await refreshHistory()
        }
        if (attendanceModalOpen.value && sessionDate.value === rec.session_date.slice(0, 10)) {
          attendanceModalOpen.value = false
        }
      }
    } finally {
      verifyingId.value = null
    }
  }

  async function approveAllPending() {
    const list = [...pendingQueue.value]
    if (!list.length || bulkVerifying.value) return
    bulkVerifying.value = true
    let ok = 0
    try {
      for (const rec of list) {
        if (await verifyRecord(rec.id)) ok++
      }
      toast.add({
        title: ok === list.length ? 'Wszystkie zatwierdzone' : 'Częściowo zatwierdzone',
        description: `${ok} z ${list.length} wpisów`,
        color: ok === list.length ? 'success' : 'warning'
      })
      await refreshAll()
    } finally {
      bulkVerifying.value = false
    }
  }

  async function submitAttendance(): Promise<boolean> {
    if (!selectedAthleteId.value) return false
    try {
      await api(apiRoutes.attendance.collection, {
        method: 'POST',
        body: {
          athlete_id: selectedAthleteId.value,
          session_date: sessionDate.value,
          status: status.value,
          note: note.value || undefined
        }
      })
      toast.add({ title: 'Zapisano obecność', color: 'success' })
      note.value = ''
      await refreshAll()
      return true
    } catch (e) {
      toast.add({ title: 'Nie udało się zapisać obecności', description: getApiErrorMessage(e), color: 'error' })
      return false
    }
  }

  async function saveAttendanceFromModal() {
    if (savingAttendance.value) return
    savingAttendance.value = true
    try {
      const pending = activePendingForSession.value
      if (isStaff.value && pending) {
        await approvePendingRecord(pending)
        return
      }
      const ok = await submitAttendance()
      if (ok) {
        attendanceModalOpen.value = false
      }
    } finally {
      savingAttendance.value = false
    }
  }

  onMounted(() => {
    void refreshAll()
  })

  return {
    pl,
    format,
    isToday,
    isStaff,
    attendanceViews,
    activeView,
    selectedAthleteId,
    status,
    note,
    sessionDate,
    records,
    pendingQueue,
    pendingLoading,
    bulkVerifying,
    verifyingId,
    monthRef,
    calendarViewMode,
    calendarEffectiveView,
    showCalendarViewToggle,
    setCalendarViewMode,
    attendanceModalOpen,
    selectedTrainingDay,
    athletes,
    monthStats,
    recordsByDate,
    activePendingForSession,
    modalPrimaryLabel,
    days,
    daysInMonth,
    weekDays,
    isTrainingDay,
    trainingStatusForDate,
    openTrainingModal,
    prevMonth,
    nextMonth,
    goToToday,
    statusColor,
    statusLabelPl,
    trainingStatusLabelPl,
    trainingStatusColor,
    dayAccentClass,
    athleteLabel,
    approvePendingRecord,
    approveAllPending,
    submitAttendance,
    saveAttendanceFromModal,
    savingAttendance
  }
}


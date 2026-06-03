<script setup lang="ts">
import type { Athlete } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { panelAreaFromPath } from '~/composables/useSlaviaPanelArea'
import { eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import { pl } from 'date-fns/locale'

definePageMeta({ middleware: 'auth' })

useSlaviaSeo({
  title: 'Obecność',
  description: 'Kalendarz treningowy i zgłaszanie obecności w klubie Slavia.',
  noindex: true
})

type AttendanceRecord = {
  id: string
  athlete_id: string
  session_date: string
  status: string
  source_role: string
  verification_state: string
  note?: string | null
  created_at: string
}

const auth = useAuth()
const route = useRoute()
const router = useRouter()
const api = useApi()
const toast = useToast()
const qrEnabled = useExperimentalFlag('attendance_qr_checkin')

const isStaff = computed(() => auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value)

type AttendanceView = 'calendar' | 'qr' | 'scan'

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
const panelArea = computed(() => panelAreaFromPath(route.path))

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

type CompetitionRow = { id: string, date: string, category?: string | null, status?: string }

const { data: calendarCompetitions, refresh: refreshCalendarCompetitions } = await useLazyAsyncData(
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

const { data: athletes } = await useAsyncData('attendance-athletes', async (): Promise<Athlete[]> => {
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
const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

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

const modalPrimaryLabel = computed(() => {
  if (isStaff.value && activePendingForSession.value) return 'Zatwierdź obecność'
  return 'Zapisz obecność'
})

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

async function refreshAll() {
  await Promise.all([
    refreshHistory(),
    refreshPendingQueue(),
    refreshTrainingOverrides(),
    refreshCalendarCompetitions()
  ])
}

async function refreshTrainingOverrides() {
  recurringOverrides.value = await api<Array<{ session_date: string, status: string }>>(
    apiRoutes.competitions.recurringTrainingCancellations
  ).catch(() => [])
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

/**
 * Zapis pojedynczego wpisu obecności. Zwraca `true` gdy udane, dzięki czemu wyższa
 * warstwa (handler kliknięcia w modalu) wie, czy auto-zamknąć okno — przy błędzie
 * zostawiamy je otwarte, żeby user mógł poprawić dane bez utraty kontekstu.
 */
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

const savingAttendance = ref(false)

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
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      :area="panelArea"
      :title="isStaff ? 'Obecność kadry' : 'Moja obecność'"
      icon="i-lucide-user-check"
      :description="isStaff
        ? 'Kalendarz, weryfikacja zgłoszeń i kod QR do druku — jeden moduł obecności.'
        : 'Kalendarz treningów, ręczne zgłoszenie lub skaner QR na sali.'"
    />

    <nav
      v-if="attendanceViews.length > 1"
      class="mb-6 flex flex-wrap gap-2"
      aria-label="Widoki obecności"
    >
      <UButton
        v-for="v in attendanceViews"
        :key="v.id"
        size="lg"
        class="min-h-11"
        :variant="activeView === v.id ? 'solid' : 'outline'"
        :color="activeView === v.id ? 'primary' : 'neutral'"
        :icon="v.icon"
        @click="activeView = v.id"
      >
        {{ v.label }}
      </UButton>
    </nav>

    <AttendanceQrPanel v-if="isStaff && activeView === 'qr'" />

    <AttendanceQrScannerPanel v-if="!isStaff && activeView === 'scan'" />

    <section
      v-if="isStaff && activeView === 'calendar'"
      class="relative mb-6 overflow-hidden rounded-[1.75rem] border border-warning/30 bg-linear-to-br from-warning/14 via-card to-card p-5 shadow-lg ring-1 ring-warning/20 sm:p-6"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-warning/20 blur-3xl" />
      <div class="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-warning">
            Do weryfikacji
          </p>
          <h2 class="mt-1 text-xl font-black text-highlighted sm:text-2xl">
            Nowe zgłoszenia obecności
          </h2>
          <p class="mt-2 text-sm text-muted">
            {{ pendingQueue.length }}
            {{ pendingQueue.length === 1 ? 'wpis czeka' : 'wpisów czeka' }}
            na zatwierdzenie — ze wszystkich zawodników.
          </p>
        </div>
        <UButton
          v-if="pendingQueue.length"
          size="lg"
          color="warning"
          icon="i-lucide-check-check"
          class="shrink-0 font-bold shadow-lg shadow-warning/20"
          :loading="bulkVerifying"
          @click="approveAllPending"
        >
          Zatwierdź wszystkie ({{ pendingQueue.length }})
        </UButton>
      </div>

      <div v-if="pendingLoading" class="relative mt-5 flex justify-center py-10">
        <UIcon name="i-lucide-loader-2" class="size-9 animate-spin text-warning" />
      </div>

      <PublicEmptyState
        v-else-if="!pendingQueue.length"
        compact
        icon="i-lucide-sparkles"
        title="Brak oczekujących zgłoszeń"
        description="Gdy zawodnik zgłosi obecność, pojawi się tutaj do jednego kliknięcia."
        class="relative mt-5"
      />

      <ul v-else class="relative mt-5 space-y-2.5">
        <li
          v-for="rec in pendingQueue"
          :key="rec.id"
          class="group flex flex-col gap-3 rounded-2xl border border-default/50 bg-card/95 p-4 shadow-sm transition hover:border-warning/35 hover:shadow-md sm:flex-row sm:items-center"
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <UIcon name="i-lucide-user" class="size-5" />
            </div>
            <div class="min-w-0">
              <p class="truncate font-bold text-highlighted">
                {{ athleteLabel(rec.athlete_id) }}
              </p>
              <p class="mt-0.5 text-sm text-muted">
                {{ format(new Date(rec.session_date.slice(0, 10)), 'EEEE · dd.MM.yyyy', { locale: pl }) }}
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <UBadge size="xs" variant="subtle" :color="statusColor(rec.status)">
                  {{ statusLabelPl(rec.status) }}
                </UBadge>
                <UBadge size="xs" variant="subtle" color="warning">
                  Oczekuje
                </UBadge>
              </div>
            </div>
          </div>
          <UButton
            size="md"
            color="success"
            icon="i-lucide-check"
            class="shrink-0 font-semibold shadow-sm"
            :loading="verifyingId === rec.id"
            :disabled="!!verifyingId && verifyingId !== rec.id"
            @click="approvePendingRecord(rec)"
          >
            Zatwierdź
          </UButton>
        </li>
      </ul>
    </section>

    <UCard v-if="!isStaff && activeView === 'calendar'" class="slavia-page-card mb-6">
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
        Szybkie zgłoszenie
      </p>
      <h2 class="mt-1 text-lg font-black text-highlighted">
        Zgłoś obecność na trening
      </h2>
      <p class="mt-1 text-sm text-muted">
        Na sali zeskanuj kod QR w aplikacji mobilnej Slavia (menu → Skaner obecności) — wpis jest od razu zatwierdzony.
        Poniżej możesz też wysłać ręczne zgłoszenie do weryfikacji przez trenera.
      </p>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField label="Data treningu">
          <UInput v-model="sessionDate" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Status">
          <USelect
            v-model="status"
            :items="[{ label: 'Obecny', value: 'obecny' }, { label: 'Nieobecny', value: 'nieobecny' }]"
          />
        </UFormField>
        <UFormField label="Notatka" class="sm:col-span-2">
          <UInput v-model="note" placeholder="opcjonalnie" class="w-full" />
        </UFormField>
      </div>
      <div class="mt-4">
        <UButton icon="i-lucide-send" size="lg" @click="() => { void submitAttendance() }">
          Wyślij zgłoszenie
        </UButton>
      </div>
    </UCard>

    <div v-show="activeView === 'calendar'" class="slavia-content-well">
    <UCard class="slavia-page-card overflow-hidden">
      <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Kalendarz treningowy</p>
          <p class="mt-1 text-xl font-black text-highlighted sm:text-2xl">
            {{ format(monthRef, 'LLLL yyyy', { locale: pl }) }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <UBadge variant="subtle" color="success" size="sm">{{ monthStats.present }} obecnych</UBadge>
            <UBadge variant="subtle" color="error" size="sm">{{ monthStats.absent }} nieobecnych</UBadge>
            <UBadge v-if="monthStats.pending" variant="subtle" color="warning" size="sm">{{ monthStats.pending }} oczekuje</UBadge>
          </div>
        </div>
        <UFormField v-if="isStaff" label="Zawodnik" class="w-full lg:max-w-xs">
          <USelect
            v-model="selectedAthleteId"
            :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-wrap gap-2">
          <CalendarViewModeToggle
            v-if="showCalendarViewToggle"
            :model-value="calendarViewMode"
            @update:model-value="setCalendarViewMode"
          />
          <UButton size="sm" variant="ghost" icon="i-lucide-chevron-left" @click="prevMonth" />
          <UButton size="sm" variant="ghost" icon="i-lucide-calendar-days" @click="goToToday">Dzisiaj</UButton>
          <UButton size="sm" variant="ghost" icon="i-lucide-chevron-right" @click="nextMonth" />
        </div>
      </div>

      <div class="mb-4 grid gap-2 rounded-2xl border border-default/60 bg-muted/10 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div class="flex items-center gap-2">
          <UBadge color="success" variant="subtle" size="sm">Planowy</UBadge>
          <span class="text-xs text-muted">trening</span>
        </div>
        <div class="flex items-center gap-2">
          <UBadge color="warning" variant="subtle" size="sm">Odwołany</UBadge>
          <span class="text-xs text-muted">trening</span>
        </div>
        <div class="flex items-center gap-2">
          <UBadge color="success" variant="subtle" size="sm">Obecny</UBadge>
          <span class="text-xs text-muted">wpis</span>
        </div>
        <div class="flex items-center gap-2">
          <UBadge color="error" variant="subtle" size="sm">Nieobecny</UBadge>
          <span class="text-xs text-muted">wpis</span>
        </div>
        <div class="flex items-center gap-2">
          <UBadge color="warning" variant="subtle" size="sm">Oczekuje</UBadge>
          <span class="text-xs text-muted">weryfikacja przez trenera</span>
        </div>
      </div>

      <template v-if="calendarEffectiveView === 'grid'">
        <div class="max-sm:hidden">
        <div class="grid grid-cols-7 overflow-hidden rounded-2xl border border-default/60 text-center text-[10px] font-black uppercase tracking-wide text-muted">
          <div v-for="w in weekDays" :key="w" class="border-r border-default/40 bg-muted/20 py-2.5 last:border-r-0">
            {{ w }}
          </div>
        </div>
        <div class="grid grid-cols-7 overflow-hidden rounded-2xl border border-default/60 border-t-0">
          <button
            v-for="day in days"
            :key="day.toISOString()"
            type="button"
            class="min-h-[98px] border-r border-t border-default/40 p-2.5 text-left last:border-r-0 hover:bg-muted/15 transition-colors"
            :class="[
              dayAccentClass(day),
              isToday(day) ? 'ring-2 ring-primary/35' : ''
            ]"
            @click="openTrainingModal(day)"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <div class="text-sm font-black text-highlighted tabular-nums">{{ format(day, 'd') }}</div>
              <UBadge
                v-if="isTrainingDay(day)"
                size="xs"
                variant="subtle"
                :color="trainingStatusColor(trainingStatusForDate(day))"
                class="shrink-0"
              >
                {{ trainingStatusLabelPl(trainingStatusForDate(day)) }}
              </UBadge>
            </div>

            <div class="mt-1 flex flex-col items-start gap-1">
              <UBadge
                v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))"
                size="xs"
                variant="subtle"
                :color="statusColor(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '')"
              >
                {{ statusLabelPl(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '') }}
              </UBadge>
              <UBadge
                v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))?.verification_state === 'pending'"
                size="xs"
                variant="subtle"
                color="warning"
              >
                Weryfikacja
              </UBadge>
              <UBadge
                v-else-if="isTrainingDay(day) && !recordsByDate.get(format(day, 'yyyy-MM-dd'))"
                size="xs"
                variant="subtle"
                color="neutral"
              >
                Brak wpisu
              </UBadge>
            </div>
          </button>
        </div>
        </div>
      </template>

      <template v-else-if="calendarEffectiveView === 'agenda'">
        <div class="space-y-2">
          <button
            v-for="day in daysInMonth.filter(d => isTrainingDay(d))"
            :key="day.toISOString()"
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-xl border border-default/60 bg-muted/10 px-4 py-3 text-left hover:bg-muted/20"
            @click="openTrainingModal(day)"
          >
            <div class="min-w-0">
              <p class="font-bold text-highlighted">
                {{ format(day, 'EEEE · dd.MM', { locale: pl }) }}
              </p>
              <p class="text-xs text-muted">
                Trening: {{ trainingStatusForDate(day) === 'scheduled' ? 'planowy' : trainingStatusForDate(day) }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <UBadge
                size="xs"
                variant="subtle"
                :color="trainingStatusForDate(day) === 'scheduled' ? 'success' : 'warning'"
              >
                {{ trainingStatusForDate(day) === 'scheduled' ? 'planowy' : trainingStatusForDate(day) }}
              </UBadge>
              <UBadge
                v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))"
                size="xs"
                variant="subtle"
                :color="statusColor(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || 'nieobecny')"
              >
                {{ statusLabelPl(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '') }}
              </UBadge>
              <UBadge
                v-else
                size="xs"
                variant="subtle"
                color="neutral"
              >
                brak wpisu
              </UBadge>
            </div>
          </button>
        </div>
      </template>

      <div v-if="records.length" class="mt-6 border-t border-default/50 pt-6">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Historia miesiąca</p>
        <ul class="mt-3 space-y-2">
          <li
            v-for="r in records"
            :key="r.id"
            class="flex flex-col gap-2 rounded-xl border border-default/50 bg-muted/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="font-semibold text-highlighted">{{ format(new Date(r.session_date.slice(0, 10)), 'EEEE · dd.MM.yyyy', { locale: pl }) }}</p>
              <p v-if="isStaff" class="text-xs text-muted">{{ athleteLabel(r.athlete_id) }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge size="xs" variant="subtle" :color="statusColor(r.status)">{{ statusLabelPl(r.status) }}</UBadge>
              <UBadge
                size="xs"
                variant="subtle"
                :color="r.verification_state === 'verified' ? 'success' : 'warning'"
              >
                {{ r.verification_state === 'verified' ? 'Zweryfikowano' : 'Oczekuje' }}
              </UBadge>
            </div>
          </li>
        </ul>
      </div>
    </UCard>
    </div>

    <SlaviaModal
      v-model:open="attendanceModalOpen"
      :title="selectedTrainingDay ? `Trening · ${format(selectedTrainingDay, 'dd.MM.yyyy')}` : 'Zapis obecności'"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-2xl md:max-w-3xl lg:max-w-4xl' }"
    >
      <template #body>
        <div class="space-y-4 p-4 sm:p-5">
          <UAlert
            v-if="selectedTrainingDay"
            :color="trainingStatusColor(trainingStatusForDate(selectedTrainingDay))"
            variant="subtle"
            :title="`Status treningu: ${trainingStatusLabelPl(trainingStatusForDate(selectedTrainingDay))}`"
            description="Treningi są importowane z bazy wydarzeń (siatka Pn/Śr/Pt + wyjątki)."
          />
          <UFormField label="Data treningu">
            <UInput
              v-model="sessionDate"
              type="date"
              class="w-full"
              :disabled="!!(isStaff && activePendingForSession)"
            />
          </UFormField>
          <UAlert
            v-if="activePendingForSession"
            color="warning"
            variant="subtle"
            :title="isStaff ? 'Zatwierdź zgłoszenie zawodnika' : 'Oczekuje na weryfikację trenera'"
            :description="isStaff
              ? `${athleteLabel(activePendingForSession.athlete_id)} · ${statusLabelPl(activePendingForSession.status)} — jedno kliknięcie.`
              : 'Po zatwierdzeniu w panelu trenera status zmieni się na zweryfikowany.'"
          />
          <UFormField v-if="isStaff && !activePendingForSession" label="Zawodnik">
            <USelect
              v-model="selectedAthleteId"
              :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))"
              class="w-full"
            />
          </UFormField>
          <template v-if="!(isStaff && activePendingForSession)">
            <UFormField label="Status obecności">
              <div class="flex flex-wrap gap-2">
                <UButton
                  size="sm"
                  :variant="status === 'obecny' ? 'solid' : 'outline'"
                  color="success"
                  icon="i-lucide-check"
                  @click="status = 'obecny'"
                >
                  Obecny
                </UButton>
                <UButton
                  size="sm"
                  :variant="status === 'nieobecny' ? 'solid' : 'outline'"
                  color="error"
                  icon="i-lucide-x"
                  @click="status = 'nieobecny'"
                >
                  Nieobecny
                </UButton>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="statusColor(status)"
                  class="ml-auto"
                >
                  Wybrane: {{ statusLabelPl(status) }}
                </UBadge>
              </div>
            </UFormField>
            <UFormField label="Notatka">
              <UInput v-model="note" placeholder="opcjonalnie" />
            </UFormField>
          </template>
          <div class="flex justify-end gap-2 border-t border-default/60 pt-3">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="savingAttendance"
              @click="attendanceModalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              :icon="isStaff && activePendingForSession ? 'i-lucide-check-check' : 'i-lucide-check'"
              :color="isStaff && activePendingForSession ? 'success' : 'primary'"
              :loading="savingAttendance"
              @click="saveAttendanceFromModal"
            >
              {{ modalPrimaryLabel }}
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>
  </PanelPageLayout>
</template>

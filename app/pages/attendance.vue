<script setup lang="ts">
import type { Athlete } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import { pl } from 'date-fns/locale'

definePageMeta({ middleware: 'auth' })

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
const api = useApi()
const toast = useToast()

const selectedAthleteId = ref('')
const status = ref<'obecny' | 'nieobecny'>('obecny')
const note = ref('')
const sessionDate = ref(new Date().toISOString().slice(0, 10))
const records = ref<AttendanceRecord[]>([])
const monthRef = ref(new Date())
const calendarView = ref<'grid' | 'agenda'>('grid')
const attendanceModalOpen = ref(false)
const selectedTrainingDay = ref<Date | null>(null)

const recurringOverrides = ref<Array<{ session_date: string, status: string }>>([])

const { data: athletes } = await useAsyncData('attendance-athletes', async (): Promise<Athlete[]> => {
  if (auth.isTrainer.value || auth.isSuperAdmin.value) {
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

const recurringStatusByDate = computed(() => {
  const map = new Map<string, string>()
  for (const r of recurringOverrides.value) {
    map.set(r.session_date.slice(0, 10), r.status || 'cancelled')
  }
  return map
})

function isTrainingDay(date: Date) {
  return [1, 3, 5].includes(getDay(date))
}

function trainingStatusForDate(date: Date) {
  const key = format(date, 'yyyy-MM-dd')
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

  const base = inMonth ? 'bg-card' : 'bg-muted/10 opacity-60'
  if (!isT) return base

  if (tStatus !== 'scheduled') return `${base} ring-1 ring-warning/20`
  if (rec?.status === 'obecny') return `${base} ring-1 ring-emerald-500/25 bg-emerald-500/5`
  if (rec?.status === 'nieobecny') return `${base} ring-1 ring-red-500/25 bg-red-500/5`
  return `${base} ring-1 ring-primary/15`
}

async function refreshHistory() {
  if (!selectedAthleteId.value) {
    records.value = []
    return
  }
  records.value = await api<AttendanceRecord[]>(apiRoutes.attendance.athlete(selectedAthleteId.value)).catch(() => [])
}

async function refreshTrainingOverrides() {
  recurringOverrides.value = await api<Array<{ session_date: string, status: string }>>(
    apiRoutes.competitions.recurringTrainingCancellations
  ).catch(() => [])
}

watch(selectedAthleteId, () => { void refreshHistory() })

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
    await refreshHistory()
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
    const ok = await submitAttendance()
    if (ok) {
      attendanceModalOpen.value = false
    }
  } finally {
    savingAttendance.value = false
  }
}

onMounted(() => {
  void refreshHistory()
  void refreshTrainingOverrides()
})
</script>

<template>
  <UContainer class="py-6 sm:py-10">
    <div class="mb-6">
      <h1 class="text-2xl font-black text-highlighted">Obecność (kalendarz treningowy)</h1>
      <p class="mt-1 text-sm text-muted">
        Kliknij dzień treningowy (Pn/Śr/Pt), aby szybko zgłosić obecność. Na telefonie możesz przełączyć widok na listę.
      </p>
    </div>
    <UCard class="mb-4">
      <div class="grid gap-3 md:grid-cols-4">
        <UFormField label="Zawodnik">
          <USelect v-model="selectedAthleteId" :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))" />
        </UFormField>
        <UFormField label="Data">
          <UInput v-model="sessionDate" type="date" />
        </UFormField>
        <UFormField label="Status">
          <USelect v-model="status" :items="[{label:'Obecny',value:'obecny'},{label:'Nieobecny',value:'nieobecny'}]" />
        </UFormField>
        <UFormField label="Notatka">
          <UInput v-model="note" placeholder="opcjonalnie" />
        </UFormField>
      </div>
      <div class="mt-3">
        <UButton icon="i-lucide-check" @click="() => { void submitAttendance() }">Zapisz obecność</UButton>
      </div>
    </UCard>

    <UCard>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">Kalendarz obecności</p>
          <p class="mt-1 text-lg font-black text-highlighted">
            {{ format(monthRef, 'LLLL yyyy', { locale: pl }) }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <div class="flex gap-1 rounded-xl border border-default/60 bg-muted/10 p-1">
            <UButton
              size="sm"
              :variant="calendarView === 'grid' ? 'solid' : 'ghost'"
              color="neutral"
              icon="i-lucide-grid-3x3"
              @click="calendarView = 'grid'"
            >
              Siatka
            </UButton>
            <UButton
              size="sm"
              :variant="calendarView === 'agenda' ? 'solid' : 'ghost'"
              color="neutral"
              icon="i-lucide-list"
              @click="calendarView = 'agenda'"
            >
              Agenda
            </UButton>
          </div>
          <UButton size="sm" variant="ghost" icon="i-lucide-chevron-left" @click="prevMonth" />
          <UButton size="sm" variant="ghost" icon="i-lucide-calendar-days" @click="goToToday">Dzisiaj</UButton>
          <UButton size="sm" variant="ghost" icon="i-lucide-chevron-right" @click="nextMonth" />
        </div>
      </div>

      <div class="mb-4 grid gap-2 rounded-2xl border border-default/60 bg-muted/10 p-3 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <template v-if="calendarView === 'grid'">
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

            <div class="mt-1">
              <UBadge
                v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))"
                size="xs"
                variant="subtle"
                :color="statusColor(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '')"
              >
                {{ statusLabelPl(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '') }}
              </UBadge>
              <UBadge
                v-else-if="isTrainingDay(day)"
                size="xs"
                variant="subtle"
                color="neutral"
              >
                Brak wpisu
              </UBadge>
            </div>
          </button>
        </div>
      </template>

      <template v-else>
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

      <div class="mt-4 space-y-2">
        <div v-for="r in records" :key="r.id" class="rounded-lg border border-default/60 px-3 py-2 text-sm">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge size="xs" variant="subtle" color="primary">{{ r.session_date }}</UBadge>
            <UBadge size="xs" variant="subtle">{{ r.status }}</UBadge>
            <UBadge size="xs" variant="subtle" :color="r.verification_state === 'verified' ? 'success' : 'warning'">{{ r.verification_state }}</UBadge>
          </div>
          <p v-if="r.note" class="mt-1 text-muted">{{ r.note }}</p>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="attendanceModalOpen"
      :title="selectedTrainingDay ? `Trening · ${format(selectedTrainingDay, 'dd.MM.yyyy')}` : 'Zapis obecności'"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-2xl md:max-w-3xl lg:max-w-4xl' }"
    >
      <template #content>
        <div class="space-y-4 p-4 sm:p-5">
          <UAlert
            v-if="selectedTrainingDay"
            :color="trainingStatusColor(trainingStatusForDate(selectedTrainingDay))"
            variant="subtle"
            :title="`Status treningu: ${trainingStatusLabelPl(trainingStatusForDate(selectedTrainingDay))}`"
            description="Treningi są importowane z bazy wydarzeń (siatka Pn/Śr/Pt + wyjątki)."
          />
          <UFormField label="Data treningu">
            <UInput v-model="sessionDate" type="date" class="w-full" />
          </UFormField>
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
              icon="i-lucide-check"
              :loading="savingAttendance"
              @click="saveAttendanceFromModal"
            >
              Zapisz obecność
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

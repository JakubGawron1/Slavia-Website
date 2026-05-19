<script setup lang="ts">
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  getDay
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { apiRoutes } from '~/config/api'
import type { AthleteCalendarDayEvent, Competition, MyCalendarEntry, RecurringTrainingSession } from '~/types/models'
import { generateIcsContent, downloadIcs } from '~/utils/ics'

definePageMeta({ middleware: 'athlete-calendar' })

useSeoMeta({
  title: 'Mój kalendarz — Slavia',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const runtimeConfig = useRuntimeConfig()

function publicCalendarApiBase() {
  return String(runtimeConfig.public.apiBase || '').replace(/\/$/, '')
}

const { data: clubTrainingOverrides } = await useLazyFetch<RecurringTrainingSession[]>(
  () => `${publicCalendarApiBase()}${apiRoutes.competitions.recurringTrainingCancellations}`,
  {
    key: 'athlete-recurring-training-sessions',
    default: () => [],
    server: false
  }
)

const clubTrainingStatusByDate = computed(() => {
  const m = new Map<string, string>()
  for (const row of clubTrainingOverrides.value ?? []) {
    const d = row.session_date?.substring(0, 10)
    if (d) {
      m.set(d, row.status || 'cancelled')
    }
  }
  return m
})

const { data: myData } = await useAsyncData(
  'athlete-my-calendar',
  () => apiFetch<{ entries: MyCalendarEntry[] }>('/api/athletes/my-calendar').catch(() => ({ entries: [] })),
  { default: () => ({ entries: [] }) }
)

const { data: allCompetitions } = await useLazyFetch<Competition[]>(
  () => `${publicCalendarApiBase()}${apiRoutes.competitions.collection}`,
  {
    key: 'athlete-all-competitions',
    default: () => [],
    server: false
  }
)

const filterOnlyMine = ref(true)
const filterCategory = ref('all')

const categories = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'championship', label: 'Mistrzostwa' },
  { value: 'league', label: 'Liga' },
  { value: 'club_event', label: 'Wydarzenia' },
  { value: 'training', label: 'Treningi' }
]

const assignedIds = computed(() => {
  const s = new Set<string>()
  for (const ent of myData.value?.entries ?? []) {
    if (ent.competition.id) s.add(ent.competition.id)
  }
  return s
})

const assignedByDate = computed(() => {
  const m = new Map<string, MyCalendarEntry[]>()
  for (const ent of myData.value?.entries ?? []) {
    const d = ent.competition.date?.substring(0, 10)
    if (!d) continue
    const arr = m.get(d) ?? []
    arr.push(ent)
    m.set(d, arr)
  }
  return m
})

const currentDate = ref(new Date())
const monthStart = computed(() => startOfMonth(currentDate.value))
const monthEnd = computed(() => endOfMonth(monthStart.value))
const calendarStart = computed(() => startOfWeek(monthStart.value, { weekStartsOn: 1 }))
const calendarEnd = computed(() => endOfWeek(monthEnd.value, { weekStartsOn: 1 }))

const days = computed(() =>
  eachDayOfInterval({
    start: calendarStart.value,
    end: calendarEnd.value
  })
)

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

const { getEventClasses, getEventIcon, getEventModalHeaderClass, getEventKindLabel } = useCalendarEventChips()

function getTrainingsForDay(date: Date) {
  if (filterCategory.value !== 'all' && filterCategory.value !== 'training') return []

  const day = getDay(date)
  if ([1, 3, 5].includes(day)) {
    const ds = format(date, 'yyyy-MM-dd')
    const status = clubTrainingStatusByDate.value.get(ds) ?? 'scheduled'
    return [{
      id: `training-${ds}`,
      type: 'training' as const,
      category: 'training' as const,
      status,
      title: 'Trening',
      time: '15:00 - 18:00',
      location: '',
      modalHint: status === 'scheduled'
        ? 'Trening klubowy — wszyscy zawodnicy (grafik jak w kalendarzu klubu).'
        : 'Trening klubowy — trener zaktualizował status w kalendarzu klubu (widzisz to samo co na stronie Kalendarz).',
      participantsLine: ''
    }]
  }
  return []
}

function getEventsForDay(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  
  let list: AthleteCalendarDayEvent[] = []

  if (filterOnlyMine.value) {
    const assigned = (assignedByDate.value.get(dateStr) ?? []).map((entry) => {
      const names = entry.participants.map(p => p.full_name).join(', ')
      return {
        id: entry.competition.id,
        type: 'competition' as const,
        category: entry.competition.category || 'club_event',
        status: entry.competition.status || 'scheduled',
        external_source: entry.competition.external_source || undefined,
        title: entry.competition.title,
        time: '' as const,
        location: entry.competition.location,
        modalHint: 'Przypisani zawodnicy widzą się nawzajem',
        participantsLine: names ? `Startuje z: ${names}` : '',
        isAssigned: true
      }
    })
    list = assigned
  } else {
    const allOnDay = (allCompetitions.value || [])
      .filter(c => c.date?.startsWith(dateStr))
      .map(c => {
        const isMine = assignedIds.value.has(c.id)
        let partsLine = ''
        if (isMine) {
          const entry = (myData.value?.entries ?? []).find(e => e.competition.id === c.id)
          if (entry) {
            partsLine = `Startuje z: ${entry.participants.map(p => p.full_name).join(', ')}`
          }
        }
        return {
          id: c.id,
          type: c.external_source ? 'external' : 'competition',
          category: c.category || 'club_event',
          status: c.status || 'scheduled',
          external_source: c.external_source || undefined,
          title: c.title,
          time: '',
          location: c.location,
          modalHint: isMine ? 'Przypisani zawodnicy widzą się nawzajem' : 'Nie jesteś przypisany do tych zawodów.',
          participantsLine: partsLine,
          isAssigned: isMine
        }
      })
    list = allOnDay
  }

  // Filtr kategorii (poza treningami które mają własny filtr wyżej)
  if (filterCategory.value !== 'all') {
    list = list.filter(e => e.category === filterCategory.value)
  }

  return [...getTrainingsForDay(date), ...list]
}

const modalOpen = ref(false)
const selectedEvent = ref<AthleteCalendarDayEvent | null>(null)

function openDetail(day: Date, ev: AthleteCalendarDayEvent) {
  selectedEvent.value = {
    ...ev,
    _dateIso: format(day, 'yyyy-MM-dd')
  }
  modalOpen.value = true
}

watch(modalOpen, (open) => {
  if (!open) selectedEvent.value = null
})

const nextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1)
}
const prevMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1)
}
const goToToday = () => {
  currentDate.value = new Date()
}

function exportEventToIcs() {
  const dateIso = selectedEvent.value?._dateIso
  if (!dateIso) return
  const ev = selectedEvent.value!
  const content = generateIcsContent({
    title: ev.title,
    date: dateIso,
    location: ev.location,
    description: (ev.modalHint || '') + (ev.participantsLine ? '\n\n' + ev.participantsLine : ''),
    time: ev.time
  })
  downloadIcs(ev.title, content)
}

const monthAgenda = computed(() => {
  const start = startOfMonth(monthStart.value)
  const end = endOfMonth(monthStart.value)
  return eachDayOfInterval({ start, end })
    .map((d) => ({
      day: d,
      events: getEventsForDay(d)
    }))
    .filter((x) => x.events.length > 0)
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
      subtitle: ev.time || ev.location || ev.participantsLine || '—',
      chipClass: getEventClasses(ev) || '',
      icon: getEventIcon(ev)
    }))
  }))
)

function onAgendaSelect(day: Date, ev: { key: string }) {
  const found = getEventsForDay(day).find((e) => eventAgendaKey(e) === ev.key)
  if (found) openDetail(day, found)
}
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="athlete"
      title="Mój kalendarz"
      icon="i-lucide-calendar-heart"
      description="Treningi klubowe (Pn, Śr, Pt) oraz przypisane starty. Status treningu jest ten sam co w kalendarzu klubu."
    >
      <template #actions>
        <UButton to="/kalendarz" variant="soft" color="neutral" icon="i-lucide-calendar-days">
          Pełny kalendarz klubu
        </UButton>
      </template>
    </PanelPageHeader>

    <div class="slavia-content-well flex flex-col gap-6 sm:gap-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-default">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          @click="prevMonth"
        />
        <UButton
          variant="ghost"
          color="neutral"
          class="min-w-[160px] font-bold text-highlighted"
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

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 rounded-xl border border-default bg-muted/10 p-1">
          <UButton
            v-for="cat in categories"
            :key="cat.value"
            size="sm"
            :variant="filterCategory === cat.value ? 'solid' : 'ghost'"
            color="neutral"
            @click="filterCategory = cat.value"
          >
            {{ cat.label }}
          </UButton>
        </div>

        <div class="flex items-center gap-2 rounded-xl border border-default bg-muted/10 px-3 py-1.5">
          <UCheckbox
            v-model="filterOnlyMine"
            label="Tylko moje starty"
            size="md"
          />
        </div>
      </div>
    </div>

    <div class="hidden sm:block border border-default rounded-2xl overflow-hidden bg-card shadow-2xl">
      <div class="grid grid-cols-7 border-b border-default bg-muted/30">
        <div
          v-for="d in weekDays"
          :key="d"
          class="py-4 text-center text-xs font-black uppercase tracking-widest text-muted"
        >
          {{ d }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="day in days"
          :key="day.toString()"
          class="min-h-[140px] border-r border-b border-default last:border-r-0 p-2 transition-colors hover:bg-primary/5"
          :class="[
            !isSameMonth(day, monthStart) ? 'bg-muted/10 opacity-30' : '',
            isToday(day) ? 'bg-primary/5' : ''
          ]"
        >
          <div class="flex justify-between items-start mb-2">
            <span
              class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full"
              :class="isToday(day) ? 'bg-primary text-white shadow-lg' : 'text-muted'"
            >
              {{ format(day, 'd') }}
            </span>
          </div>
          <div class="space-y-1 overflow-y-auto max-h-[100px] scrollbar-hide">
            <button
              v-for="ev in getEventsForDay(day)"
              :key="String(ev.id) + String(ev.type)"
              type="button"
              class="w-full text-left text-[10px] p-1.5 rounded-lg border flex flex-col leading-tight cursor-pointer transition-all hover:brightness-110"
              :class="getEventClasses(ev)"
              @click="openDetail(day, ev)"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="truncate font-semibold">{{ ev.title }}</span>
                <UIcon
                  :name="getEventIcon(ev)"
                  class="size-2.5 shrink-0 opacity-80"
                />
              </div>
              <span class="opacity-60">{{ ev.time || ev.location }}</span>
              <span
                v-if="ev.status && ev.status !== 'scheduled'"
                class="text-[10px] uppercase tracking-[0.15em] font-semibold mt-1"
              >
                {{
                  ev.status === 'cancelled'
                    ? 'Odwołane'
                    : ev.status === 'moved'
                      ? 'Przesunięte'
                      : ev.status
                }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 sm:hidden">
      <CalendarMonthAgenda
        :rows="monthAgendaRows"
        empty-description="Zmień miesiąc lub filtry kategorii."
        @select="onAgendaSelect"
      />
    </div>

    <div class="grid grid-cols-2 gap-3 rounded-2xl border border-default bg-muted/10 p-5 sm:grid-cols-4">
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
    </div>
    </div>

    <UModal
      v-model:open="modalOpen"
      :dismissible="true"
      :ui="{
        overlay: 'z-[190] bg-neutral-950/75 backdrop-blur-[3px]',
        content:
          'z-[200] max-h-[min(92dvh,880px)] w-[min(100vw-1rem,56rem)] overflow-hidden rounded-3xl border border-default/50 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl'
      }"
    >
      <template #content>
        <div
          v-if="selectedEvent"
          class="flex max-h-[min(92dvh,880px)] flex-col overflow-y-auto"
        >
          <div
            class="relative shrink-0 px-6 pb-8 pt-7 md:px-9 md:pb-10 md:pt-10"
            :class="getEventModalHeaderClass(selectedEvent)"
          >
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_90%_-10%,rgba(255,255,255,0.22),transparent_52%)]" />
            <div class="relative space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  color="neutral"
                  class="border-white/25 bg-white/15 font-bold uppercase tracking-wider text-white backdrop-blur-sm"
                >
                  {{ getEventKindLabel(selectedEvent) }}
                </UBadge>
                <UBadge
                  v-if="selectedEvent.status === 'cancelled'"
                  color="error"
                  variant="solid"
                  class="font-bold uppercase"
                >
                  Odwołane
                </UBadge>
                <UBadge
                  v-else-if="selectedEvent.status === 'moved'"
                  color="warning"
                  variant="solid"
                  class="font-bold uppercase"
                >
                  Przesunięte
                </UBadge>
              </div>
              <h2 class="text-pretty text-2xl font-black leading-tight tracking-tight md:text-3xl">
                {{ String(selectedEvent.title ?? '') }}
              </h2>
              <p
                v-if="selectedEvent._dateIso"
                class="flex items-center gap-2 text-base font-semibold text-white/90 md:text-lg"
              >
                <UIcon
                  name="i-lucide-calendar-days"
                  class="size-5 shrink-0 opacity-90"
                />
                {{ format(parseISO(String(selectedEvent._dateIso)), 'EEEE, d MMMM yyyy', { locale: pl }) }}
              </p>
              <p
                v-if="selectedEvent.time"
                class="text-sm font-medium text-white/75"
              >
                {{ selectedEvent.time }}
              </p>
            </div>
          </div>

          <div class="space-y-5 border-t border-default/40 bg-linear-to-b from-muted/30 to-background px-6 py-6 md:px-9 md:py-8">
            <p
              v-if="selectedEvent.modalHint"
              class="text-[15px] leading-relaxed text-muted"
            >
              {{ selectedEvent.modalHint }}
            </p>
            <div
              v-if="selectedEvent.participantsLine"
              class="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-[15px] font-medium leading-snug text-highlighted"
            >
              {{ selectedEvent.participantsLine }}
            </div>
            <div
              v-if="selectedEvent.location"
              class="flex gap-3 rounded-2xl border border-default/60 bg-muted/20 px-4 py-3 dark:bg-muted/10"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="mt-0.5 size-5 shrink-0 text-primary"
              />
              <p class="text-[15px] font-semibold leading-snug text-highlighted">
                {{ selectedEvent.location }}
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <UButton
                block
                size="lg"
                color="primary"
                variant="outline"
                icon="i-lucide-calendar-plus"
                class="font-bold"
                @click="exportEventToIcs"
              >
                Dodaj do swojego kalendarza (ICS)
              </UButton>
              <UButton
                block
                size="lg"
                color="neutral"
                variant="soft"
                icon="i-lucide-x"
                class="font-bold"
                @click="modalOpen = false"
              >
                Zamknij
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </PanelPageLayout>
</template>

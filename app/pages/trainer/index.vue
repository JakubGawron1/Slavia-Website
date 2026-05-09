<script setup lang="ts">
import type { Athlete, CompetitionResult, PendingPaymentRow } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'
import DashboardUrgentList from '~/components/dashboard/DashboardUrgentList.vue'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Panel trenera — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const FILTER_ALL = '__all__'

const { data: athletes } = await useAsyncData(
  'trainer-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)
const { data: pendingResults, refresh: refreshPending } = await useAsyncData(
  'trainer-pending-results',
  async (): Promise<CompetitionResult[]> =>
    apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
)

const { data: pendingPayments, refresh: refreshPendingPayments } = await useAsyncData(
  'trainer-pending-payments',
  async (): Promise<PendingPaymentRow[]> =>
    apiFetch<PendingPaymentRow[]>(apiRoutes.payments.pending).catch(() => [])
)
const { data: competitions } = await useAsyncData('trainer-competitions', () => apiFetch('/api/competitions').catch(() => []))

const toast = useToast()
type AttendanceRecord = {
  id: string
  athlete_id: string
  session_date: string
  status: string
  verification_state: string
  note?: string | null
}
const attendanceFilters = reactive({
  athlete_id: FILTER_ALL,
  status: FILTER_ALL,
  verification_state: FILTER_ALL,
  from_date: '',
  to_date: ''
})
const attendanceRows = ref<AttendanceRecord[]>([])

const athleteNameById = computed(() => {
  const m = new Map<string, string>()
  for (const a of (athletes.value || []) as Athlete[]) {
    m.set(a.id, a.full_name)
  }
  return m
})

function labelForResult(r: CompetitionResult) {
  return athleteNameById.value.get(r.athlete_id) || r.athlete_id
}

const athletesCount = computed(() => {
  const list = athletes.value
  if (!Array.isArray(list)) {
    return 0
  }
  return list.filter(a => a.is_active !== false).length
})
const pendingCount = computed(() => (Array.isArray(pendingResults.value) ? pendingResults.value.length : 0))
const pendingPaymentsCount = computed(() => (Array.isArray(pendingPayments.value) ? pendingPayments.value.length : 0))
const competitionsCount = computed(() => (Array.isArray(competitions.value) ? competitions.value.length : 0))

const lowerDashboards = computed(() => {
  const roles = new Set(auth.roles.value || [])
  const list: { label: string, to: string, icon: string }[] = []
  if (roles.has('Athlete')) list.push({ label: 'Panel zawodnika', to: '/athlete', icon: 'i-lucide-user' })
  return list
})

const quickLinks = computed(() => {
  const links = [
    {
      title: 'Baza zawodników',
      description: 'Edycja profili i zawodów — konta logowania zakłada administrator',
      icon: 'i-lucide-users',
      to: '/trainer/zawodnicy',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Kalendarz',
      description: 'Sprawdzaj i planuj zawody oraz treningi',
      icon: 'i-lucide-calendar',
      to: '/kalendarz',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Zgłoszenia wyników',
      description: 'Lista oczekujących na tej stronie (sekcja poniżej) lub dodaj start w „Wszystkie starty”',
      icon: 'i-lucide-check-circle',
      to: { path: '/trainer', hash: '#wyniki-oczekujace' },
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Składki klubowe',
      description: 'Oczekujące, opłacone i brak wpłaty (widok miesiąca)',
      icon: 'i-lucide-banknote',
      to: '/trainer/skladki',
      color: 'text-green-600',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Wszystkie starty',
      description: 'Lista zapisanych startów z edycją',
      icon: 'i-lucide-list-checks',
      to: '/trainer/wyniki',
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    },
    {
      title: 'Dzienniki treningów',
      description: 'Wybierz zawodnika i prowadź wpisy po jednostkach',
      icon: 'i-lucide-book-marked',
      to: '/trainer/dziennik',
      color: 'text-cyan-600',
      bg: 'bg-cyan-500/10'
    },
    {
      title: 'Plany treningowe',
      description: 'Tworzenie planów i monitoring progresu',
      icon: 'i-lucide-clipboard-list',
      to: '/trainer/plany',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Regeneracja zawodników',
      description: 'Check-in snu, zmęczenia i gotowości',
      icon: 'i-lucide-heart-pulse',
      to: '/trainer/regeneracja',
      color: 'text-rose-600',
      bg: 'bg-rose-500/10'
    },
    {
      title: 'Feed wydarzeń',
      description: 'Aktywności: wyniki, obecność, regeneracja',
      icon: 'i-lucide-list-collapse',
      to: '/trainer/wydarzenia',
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-500/10'
    },
    {
      title: 'Inne ćwiczenia',
      description: 'Ranking przysiadów, wyciskania i martwego',
      icon: 'i-lucide-bar-chart-3',
      to: '/trainer/exercises',
      color: 'text-lime-600',
      bg: 'bg-lime-500/10'
    },
    {
      title: 'Proporcje (ratio)',
      description: '„Złote proporcje” i widełki % między bojami',
      icon: 'i-lucide-sigma',
      to: '/kalkulator-proporcji',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Analiza toru sztangi',
      description: 'Wideo + AI w przeglądarce: tor ruchu i komunikaty techniczne',
      icon: 'i-lucide-scan-line',
      to: '/trainer/analiza-sztangi',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      title: 'Aktualności klubu',
      description: 'Aktualności, ogłoszenia i wpisy na stronie',
      icon: 'i-lucide-newspaper',
      to: '/aktualnosci',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Ustawienia konta',
      description: 'E-mail, avatar i hasło',
      icon: 'i-lucide-user-cog',
      to: '/profil',
      color: 'text-neutral-500',
      bg: 'bg-neutral-500/10'
    },
    {
      title: 'Czat trener–zawodnik',
      description: 'Wiadomości 1:1 i szybki kontakt',
      icon: 'i-lucide-messages-square',
      to: '/chat',
      color: 'text-sky-600',
      bg: 'bg-sky-500/10'
    },
    {
      title: 'Lista obecności',
      description: 'Statusy obecności i historia',
      icon: 'i-lucide-user-check',
      to: '/attendance',
      color: 'text-indigo-600',
      bg: 'bg-indigo-500/10'
    }
  ]
  return links
})

const moduleGroups = computed(() => {
  const list = quickLinks.value
  const byTo = new Map<string, typeof list[number]>()
  for (const l of list) byTo.set(typeof l.to === 'string' ? l.to : l.to.path, l)

  const pick = (to: string) => byTo.get(to)
  return [
    {
      title: 'Najczęstsze',
      items: [
        pick('/trainer/wyniki'),
        pick('/trainer/zawodnicy'),
        pick('/trainer/skladki'),
        pick('/attendance')
      ].filter(Boolean)
    },
    {
      title: 'Planowanie',
      items: [
        pick('/kalendarz'),
        pick('/trainer/plany'),
        pick('/trainer/regeneracja'),
        pick('/trainer/wydarzenia')
      ].filter(Boolean)
    },
    {
      title: 'Narzędzia',
      items: [
        pick('/trainer/analiza-sztangi'),
        pick('/trainer/exercises'),
        pick('/kalkulator-proporcji'),
        pick('/chat'),
        pick('/profil')
      ].filter(Boolean)
    }
  ] as const
})

function toneFromBg(bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red')) return 'error'
  if (s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('fuchsia') || s.includes('primary')) return 'primary'
  return 'neutral'
}

async function approveResult(id: string) {
  try {
    await apiFetch(`/api/results/${id}/approve`, { method: 'PATCH' })
    toast.add({ title: 'Wynik zatwierdzony', color: 'success' })
    await refreshPending()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zatwierdzić',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function rejectResult(id: string) {
  try {
    await apiFetch(`/api/results/${id}/reject`, { method: 'PATCH' })
    toast.add({ title: 'Wynik odrzucony', color: 'success' })
    await refreshPending()
  } catch (e) {
    toast.add({
      title: 'Nie udało się odrzucić',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function approvePayment(id: string) {
  try {
    await apiFetch(apiRoutes.payments.approve(id), { method: 'PATCH' })
    toast.add({ title: 'Zatwierdzono płatność', color: 'success' })
    await refreshPendingPayments()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zatwierdzić płatności',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function rejectPayment(id: string) {
  try {
    await apiFetch(apiRoutes.payments.reject(id), { method: 'PATCH' })
    toast.add({ title: 'Odrzucono zgłoszenie płatności', color: 'success' })
    await refreshPendingPayments()
  } catch (e) {
    toast.add({
      title: 'Nie udało się odrzucić zgłoszenia',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function loadAttendanceRows() {
  const q = new URLSearchParams()
  if (attendanceFilters.athlete_id !== FILTER_ALL) q.set('athlete_id', attendanceFilters.athlete_id)
  if (attendanceFilters.status !== FILTER_ALL) q.set('status', attendanceFilters.status)
  if (attendanceFilters.verification_state !== FILTER_ALL) q.set('verification_state', attendanceFilters.verification_state)
  if (attendanceFilters.from_date) q.set('from_date', attendanceFilters.from_date)
  if (attendanceFilters.to_date) q.set('to_date', attendanceFilters.to_date)
  const path = q.toString() ? `/api/attendance?${q}` : '/api/attendance'
  attendanceRows.value = await apiFetch<AttendanceRecord[]>(path).catch(() => [])
}

onMounted(() => {
  void loadAttendanceRows()
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <DashboardHero
      eyebrow="Panel trenera"
      :title="`Witaj, ${auth.user.value?.username || 'Trenerze'}!`"
      lead="Najważniejsze moduły, szybkie akcje i rzeczy do zatwierdzenia w jednym miejscu."
      icon="i-lucide-dumbbell"
      :badges="[
        { label: `Oczekujące wyniki: ${pendingCount}`, color: pendingCount ? 'warning' : 'neutral' },
        { label: `Oczekujące składki: ${pendingPaymentsCount}`, color: pendingPaymentsCount ? 'warning' : 'neutral' }
      ]"
      :actions="[
        { label: 'Wszystkie starty', to: '/trainer/wyniki', icon: 'i-lucide-list-checks', variant: 'soft', color: 'primary' },
        { label: 'Składki', to: '/trainer/skladki', icon: 'i-lucide-banknote', variant: 'outline', color: 'neutral' }
      ]"
    />

    <div
      v-if="lowerDashboards.length"
      class="mb-10 rounded-2xl border border-default/70 bg-muted/10 p-4 sm:p-5"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-muted">
            Inne panele na tym koncie
          </p>
          <p class="mt-1 text-sm text-muted">
            Masz rolę zawodnika — możesz przełączyć dashboard.
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <UButton
            v-for="d in lowerDashboards"
            :key="d.to"
            :to="d.to"
            :icon="d.icon"
            variant="outline"
            color="neutral"
            size="lg"
            class="min-h-11 justify-center"
          >
            {{ d.label }}
          </UButton>
        </div>
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
      <DashboardKpiCard label="Zawodnicy (aktywni)" :value="athletesCount" icon="i-lucide-users" tone="info" to="/trainer/zawodnicy" />
      <DashboardKpiCard
        label="Wyniki oczekujące"
        :value="pendingCount"
        icon="i-lucide-clipboard-clock"
        :tone="pendingCount ? 'warning' : 'neutral'"
        :to="{ path: '/trainer', hash: '#wyniki-oczekujace' }"
      />
      <DashboardKpiCard label="Wydarzenia w kalendarzu" :value="competitionsCount" icon="i-lucide-calendar" tone="primary" to="/kalendarz" />
    </div>

    <div class="mt-10 grid gap-4 lg:grid-cols-2">
      <DashboardUrgentList
        title="Wyniki do zatwierdzenia"
        icon="i-lucide-clipboard-clock"
        :count="pendingCount"
        empty-text="Brak oczekujących zgłoszeń wyników."
        :footer-link="{ label: 'Przejdź do wszystkich startów', to: '/trainer/wyniki' }"
        :items="(pendingResults || []).slice(0, 6).map(r => ({
          key: r.id,
          title: labelForResult(r),
          subtitle: `Rwanie ${r.snatch} · Podrzut ${r.clean_and_jerk} · Razem ${r.total} · ${r.date.slice(0,10)}`,
          badge: { label: 'Pending', color: 'warning' },
          primaryAction: { label: 'Zatwierdź', onClick: () => { void approveResult(r.id) } },
          secondaryAction: { label: 'Odrzuć', color: 'error', onClick: () => { void rejectResult(r.id) } }
        }))"
      >
        <template #actions>
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-ccw" @click="refreshPending()">Odśwież</UButton>
        </template>
      </DashboardUrgentList>

      <DashboardUrgentList
        title="Składki do zatwierdzenia"
        icon="i-lucide-banknote"
        :count="pendingPaymentsCount"
        empty-text="Brak zgłoszeń składek w statusie oczekującym."
        :footer-link="{ label: 'Przejdź do składek (widok miesiąca)', to: '/trainer/skladki' }"
        :items="(pendingPayments || []).slice(0, 6).map(p => ({
          key: p.id,
          title: p.athlete_name,
          subtitle: `Miesiąc ${p.month}${p.amount_pln != null ? ` · ${p.amount_pln} PLN` : ''}${p.note && p.note.trim() ? ` · ${p.note}` : ''}`,
          badge: { label: 'Pending', color: 'warning' },
          primaryAction: { label: 'Zatwierdź', onClick: () => { void approvePayment(p.id) } },
          secondaryAction: { label: 'Odrzuć', color: 'error', onClick: () => { void rejectPayment(p.id) } }
        }))"
      >
        <template #actions>
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-ccw" @click="refreshPendingPayments()">Odśwież</UButton>
        </template>
      </DashboardUrgentList>
    </div>

    <div class="mt-12 space-y-8">
      <div v-for="g in moduleGroups" :key="g.title">
        <div class="mb-3 flex items-end justify-between gap-3">
          <h2 class="text-xl font-semibold text-highlighted">
            {{ g.title }}
          </h2>
        </div>
        <div class="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardModuleCard
            v-for="link in g.items"
            :key="typeof link!.to === 'string' ? link!.to : link!.to.path"
            :title="link!.title"
            :description="link!.description"
            :icon="link!.icon"
            :to="link!.to"
            :tone="toneFromBg(link!.bg)"
          />
        </div>
      </div>
    </div>

    <div class="mt-12 rounded-2xl border border-default bg-card p-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-xl font-semibold text-highlighted">Obecności zawodników</h2>
        <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" @click="loadAttendanceRows">Odśwież</UButton>
      </div>
      <div class="slavia-form-grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <USelect v-model="attendanceFilters.athlete_id" :items="[{label:'Wszyscy',value:FILTER_ALL}, ...((athletes || []).map(a => ({label:a.full_name, value:a.id})))]" />
        <USelect v-model="attendanceFilters.status" :items="[{label:'Każdy status',value:FILTER_ALL},{label:'Obecny',value:'obecny'},{label:'Nieobecny',value:'nieobecny'}]" />
        <USelect v-model="attendanceFilters.verification_state" :items="[{label:'Każdy stan',value:FILTER_ALL},{label:'Zweryfikowane',value:'verified'},{label:'Oczekujące',value:'pending'}]" />
        <UInput v-model="attendanceFilters.from_date" type="date" />
        <UInput v-model="attendanceFilters.to_date" type="date" />
      </div>
      <div class="mt-2">
        <UButton size="sm" color="primary" @click="loadAttendanceRows">Filtruj</UButton>
      </div>
      <div class="mt-4 space-y-2">
        <div v-for="row in attendanceRows" :key="row.id" class="rounded-xl border border-default/60 px-3 py-2">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <UBadge size="xs" variant="subtle">{{ athleteNameById.get(row.athlete_id) || row.athlete_id }}</UBadge>
            <UBadge size="xs" variant="subtle" color="primary">{{ row.session_date }}</UBadge>
            <UBadge size="xs" variant="subtle" :color="row.status === 'obecny' ? 'success' : 'error'">{{ row.status }}</UBadge>
            <UBadge size="xs" variant="subtle" :color="row.verification_state === 'verified' ? 'success' : 'warning'">{{ row.verification_state }}</UBadge>
          </div>
          <p v-if="row.note" class="mt-1 text-sm text-muted">{{ row.note }}</p>
        </div>
        <p v-if="attendanceRows.length === 0" class="text-sm text-muted">Brak wpisów dla wybranego filtra.</p>
      </div>
    </div>
  </UContainer>
</template>

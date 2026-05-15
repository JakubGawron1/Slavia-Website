<script setup lang="ts">
import type { AthletePaymentOverviewRow } from '~/types/models'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'
import DashboardMonthlySummary from '~/components/dashboard/DashboardMonthlySummary.vue'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Panel superadmina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()

// Pobieranie podstawowych statystyk
const { data: athletes } = await useAsyncData('super-dashboard-athletes', () => apiFetch('/api/athletes/admin').catch(() => []))
const { data: adminsGrouped } = await useAsyncData(
  'super-dashboard-admins-grouped',
  () =>
    apiFetch<{ admins: unknown[], trainers: unknown[], athletes: unknown[] }>('/api/admins/grouped').catch(() => ({
      admins: [],
      trainers: [],
      athletes: []
    }))
)
const { data: competitions } = await useAsyncData('super-dashboard-competitions', () => apiFetch('/api/competitions').catch(() => []))

/** KPI Summary Data (Extended) */
const currentMonthStr = new Date().toISOString().slice(0, 7)
const { data: paymentsOverview } = await useAsyncData(
  'super-kpi-payments',
  () => apiFetch<AthletePaymentOverviewRow[]>('/api/payments/overview?month=' + currentMonthStr).catch(() => [])
)

const paidCount = computed(() => (paymentsOverview.value || []).filter(r => r.has_approved).length)
const totalAthletesWithRecords = computed(() => (paymentsOverview.value || []).length)
const paymentProgress = computed(() => {
  if (totalAthletesWithRecords.value === 0) return 0
  return Math.round((paidCount.value / totalAthletesWithRecords.value) * 100)
})
const paymentsPendingCount = computed(
  () => (paymentsOverview.value || []).filter((r: { has_approved?: boolean }) => !r.has_approved).length
)
const { data: pendingResults } = await useAsyncData(
  'super-dashboard-pending',
  () => apiFetch<unknown[]>('/api/results/pending').catch(() => [])
)
const pendingResultsCount = computed(() =>
  Array.isArray(pendingResults.value) ? pendingResults.value.length : 0
)

const { data: recentAttendance } = await useAsyncData(
  'super-kpi-attendance-recent',
  () => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const from = d.toISOString().slice(0, 10)
    return apiFetch<{ status: string }[]>(`/api/attendance?from_date=${from}`).catch(() => [])
  }
)

const avgAttendance = computed(() => {
  const rows = recentAttendance.value || []
  if (rows.length === 0) return 0
  const present = rows.filter(r => r.status === 'obecny').length
  return Math.round((present / rows.length) * 100)
})

const athletesCount = computed(() => {
  const list = athletes.value
  if (!Array.isArray(list)) {
    return 0
  }
  return list.filter(a => a.is_active !== false).length
})
const adminsCount = computed(() =>
  Array.isArray(adminsGrouped.value?.admins) ? adminsGrouped.value.admins.length : 0
)
const _competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

const quickLinks = [
  {
    title: 'Zarządzanie kontami',
    description: 'Administratorzy, trenerzy i zawodnicy — role, konta i uprawnienia (superadmin)',
    icon: 'i-lucide-shield-alert',
    to: '/superadmin/administratorzy',
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  {
    title: 'Logi systemowe',
    description: 'Historia zmian i audyt operacji (superadmin)',
    icon: 'i-lucide-history',
    to: '/superadmin/audit-logs',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    title: 'Workery cron (czasy przebiegu)',
    description:
      'Ostatnie takty zadań w tle: auto-składki, pruner czatu — czas trwania (wall-clock)',
    icon: 'i-lucide-timer',
    to: '/superadmin/workers',
    color: 'text-fuchsia-500',
    bg: 'bg-fuchsia-500/10'
  },
  {
    title: 'Panel Admina',
    description: 'Przejdź do panelu administratora',
    icon: 'i-lucide-settings',
    to: '/admin',
    color: 'text-neutral-500',
    bg: 'bg-neutral-500/10'
  },
  {
    title: 'Panel Trenera',
    description: 'Przejdź do panelu trenera',
    icon: 'i-lucide-user-check',
    to: '/trainer',
    color: 'text-success',
    bg: 'bg-success/12'
  },
  {
    title: 'Panel Zawodnika',
    description: 'Zobacz interfejs tak jak po stronie zawodnika',
    icon: 'i-lucide-dumbbell',
    to: '/athlete',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Baza Zawodników',
    description: 'Pełny dostęp do edycji bazy zawodników',
    icon: 'i-lucide-users',
    to: '/superadmin/zawodnicy',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Narzędzia developera',
    description: 'Mapa tras, ping API, PWA, logi lokalne i zrzuty diagnostyczne',
    icon: 'i-lucide-terminal',
    to: '/superadmin/developer',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10'
  },
  {
    title: 'Changelog systemu',
    description: 'Lista wydań — ta sama co w panelu admina',
    icon: 'i-lucide-file-text',
    to: '/admin/changelog',
    color: 'text-success',
    bg: 'bg-success/12'
  },
  {
    title: 'Dzienniki treningów',
    description: 'Wpisy po jednostkach — widok trenera',
    icon: 'i-lucide-book-marked',
    to: '/trainer/dziennik',
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10'
  },
  {
    title: 'Inne ćwiczenia',
    description: 'Ranking ćwiczeń pomocniczych dla kadry i adminów',
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
    color: 'text-success',
    bg: 'bg-success/12'
  },
  {
    title: 'Analiza toru sztangi',
    description: 'Wideo i diagnostyka toru (kadra)',
    icon: 'i-lucide-scan-line',
    to: '/trainer/analiza-sztangi',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    title: 'Kalendarz Systemowy',
    description: 'Edytuj wszystkie wydarzenia na stronie',
    icon: 'i-lucide-calendar',
    to: '/kalendarz',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    title: 'Starty zawodników',
    description: 'Pełna lista startów — edycja i usuwanie wpisów',
    icon: 'i-lucide-list-checks',
    to: '/trainer/wyniki',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10'
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
    title: 'Aktualności',
    description: 'Wpisy informacyjne i relacje',
    icon: 'i-lucide-newspaper',
    to: '/aktualnosci',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    title: 'Barbell Tracker Lab',
    description: 'Benchmark silników: MediaPipe, TF.js, OpenCV (Superadmin Experimental)',
    icon: 'i-lucide-beaker',
    to: '/superadmin/barbell-lab',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10'
  }
]

const moduleGroups = computed(() => {
  const byTo = new Map<string, typeof quickLinks[number]>()
  for (const l of quickLinks) byTo.set(String(l.to), l)
  const pick = (to: string) => byTo.get(to)
  return [
    {
      title: 'System i bezpieczeństwo',
      items: [
        pick('/superadmin/administratorzy'),
        pick('/superadmin/audit-logs'),
        pick('/superadmin/developer'),
        pick('/superadmin/zawodnicy'),
        pick('/superadmin/barbell-lab')
      ].filter(Boolean)
    },
    {
      title: 'Przejścia i operacje',
      items: [
        pick('/admin'),
        pick('/trainer'),
        pick('/athlete'),
        pick('/kalendarz')
      ].filter(Boolean)
    },
    {
      title: 'Narzędzia i treści',
      items: [
        pick('/admin/changelog'),
        pick('/trainer/wyniki'),
        pick('/trainer/dziennik'),
        pick('/trainer/exercises'),
        pick('/trainer/analiza-sztangi'),
        pick('/aktualnosci'),
        pick('/profil'),
        pick('/kalkulator-proporcji')
      ].filter(Boolean)
    }
  ] as const
})

function toneFromBg(bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red')) return 'error'
  if (s.includes('rose')) return 'error'
  if (s.includes('orange')) return 'warning'
  if (s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('fuchsia')) return 'primary'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('primary')) return 'primary'
  return 'neutral'
}
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <DashboardHero
      eyebrow="Superadministracja"
      :title="`Witaj, ${auth.user.value?.username || 'Superadminie'}!`"
      lead="Panel systemowy: role, bezpieczeństwo, narzędzia i szybkie przejścia."
      icon="i-lucide-crown"
      :badges="[
        { label: `Konta admin: ${adminsCount}`, color: 'neutral' },
        { label: `Zawodnicy: ${athletesCount}`, color: 'neutral' }
      ]"
      :actions="[
        { label: 'Konta i role', to: '/superadmin/administratorzy', icon: 'i-lucide-shield-alert', variant: 'soft', color: 'primary' },
        { label: 'Dev tools', to: '/superadmin/developer', icon: 'i-lucide-terminal', variant: 'outline', color: 'neutral' }
      ]"
    />

    <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      <DashboardKpiCard label="Konta (kadra)" :value="adminsCount" icon="i-lucide-shield-check" tone="error" to="/superadmin/administratorzy" />
      <DashboardKpiCard label="Zawodnicy (aktywni)" :value="athletesCount" icon="i-lucide-users" tone="info" to="/superadmin/zawodnicy" />
      <DashboardKpiCard label="Składki (opłacone)" :value="`${paymentProgress}%`" icon="i-lucide-banknote" tone="success" to="/admin" />
      <DashboardKpiCard label="Obecność (30d)" :value="`${avgAttendance}%`" icon="i-lucide-user-check" tone="primary" to="/trainer" />
    </div>

    <div class="mt-8">
      <DashboardMonthlySummary
        :athletes-active="athletesCount"
        :payment-progress="paymentProgress"
        :payments-pending="paymentsPendingCount"
        :avg-attendance30d="avgAttendance"
        :pending-results="pendingResultsCount"
      />
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
            :key="String(link!.to)"
            :title="link!.title"
            :description="link!.description"
            :icon="link!.icon"
            :to="link!.to"
            :tone="toneFromBg(link!.bg)"
            :icon-wrapper-class="`${link!.bg} ${link!.color}`"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>

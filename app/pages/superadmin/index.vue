<script setup lang="ts">
import type { AthletePaymentOverviewRow } from '~/types/models'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'
import DashboardMonthlySummary from '~/components/dashboard/DashboardMonthlySummary.vue'
import { dashboardLink, type DashboardModuleLink } from '~/utils/dashboardLink'

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

const moduleGroups: { title: string, items: DashboardModuleLink[] }[] = [
  {
    title: 'System i bezpieczeństwo',
    items: [
      dashboardLink('Konta i role', 'Administratorzy, trenerzy, zawodnicy', 'i-lucide-shield-alert', '/superadmin/administratorzy', 'text-red-500', 'bg-red-500/10'),
      dashboardLink('Logi systemowe', 'Audyt operacji', 'i-lucide-history', '/superadmin/audit-logs', 'text-primary', 'bg-primary/10'),
      dashboardLink('Workery cron', 'Zadania w tle', 'i-lucide-timer', '/superadmin/workers', 'text-fuchsia-500', 'bg-fuchsia-500/10'),
      dashboardLink('Narzędzia developera', 'Diagnostyka API i PWA', 'i-lucide-terminal', '/superadmin/developer', 'text-violet-500', 'bg-violet-500/10'),
      dashboardLink('Import danych', 'Federacje i CSV', 'i-lucide-file-up', '/superadmin/import', 'text-cyan-600', 'bg-cyan-500/10'),
      dashboardLink('Baza zawodników', 'Pełna edycja profili', 'i-lucide-users', '/superadmin/zawodnicy', 'text-blue-500', 'bg-blue-500/10'),
      dashboardLink('Barbell Lab', 'Eksperymenty wizji', 'i-lucide-beaker', '/superadmin/barbell-lab', 'text-pink-500', 'bg-pink-500/10')
    ]
  },
  {
    title: 'Panele ról',
    items: [
      dashboardLink('Panel admina', 'Administracja treści', 'i-lucide-settings', '/admin', 'text-neutral-500', 'bg-neutral-500/10'),
      dashboardLink('Panel trenera', 'Kadra i zawodnicy', 'i-lucide-dumbbell', '/trainer', 'text-success', 'bg-success/12'),
      dashboardLink('Panel zawodnika', 'Widok zawodnika', 'i-lucide-user', '/athlete', 'text-amber-500', 'bg-amber-500/10')
    ]
  },
  {
    title: 'Administracja treści',
    items: [
      dashboardLink('Konta kadry', 'Login i hasła', 'i-lucide-key-round', '/admin/konta', 'text-rose-500', 'bg-rose-500/10'),
      dashboardLink('Wiadomości (kontakt)', 'Formularz publiczny', 'i-lucide-mail', '/admin/kontakt-wiadomosci', 'text-info', 'bg-info/12'),
      dashboardLink('Changelog', 'Historia wydań', 'i-lucide-file-text', '/admin/changelog', 'text-success', 'bg-success/12'),
      dashboardLink('Aktualności', 'Wpisy klubu', 'i-lucide-newspaper', '/aktualnosci', 'text-orange-500', 'bg-orange-500/10'),
      dashboardLink('Ogłoszenia', 'Tablica klubu', 'i-lucide-megaphone', '/ogloszenia', 'text-violet-500', 'bg-violet-500/10'),
      dashboardLink('Galeria', 'Zdjęcia na stronie', 'i-lucide-images', '/galeria', 'text-pink-500', 'bg-pink-500/10'),
      dashboardLink('Kalendarz', 'Wydarzenia klubu', 'i-lucide-calendar', '/kalendarz', 'text-purple-500', 'bg-purple-500/10')
    ]
  },
  {
    title: 'Kadra trenera',
    items: [
      dashboardLink('Starty zawodników', 'Lista startów', 'i-lucide-list-checks', '/trainer/wyniki', 'text-teal-500', 'bg-teal-500/10'),
      dashboardLink('Składki', 'Zatwierdzanie wpłat', 'i-lucide-banknote', '/trainer/skladki', 'text-green-600', 'bg-green-500/10'),
      dashboardLink('Obecności', 'Weryfikacja', 'i-lucide-user-check', '/attendance', 'text-indigo-600', 'bg-indigo-500/10'),
      dashboardLink('Dzienniki', 'Wpisy treningowe', 'i-lucide-book-marked', '/trainer/dziennik', 'text-cyan-600', 'bg-cyan-500/10'),
      dashboardLink('Plany', 'Monitoring progresu', 'i-lucide-clipboard-list', '/trainer/plany', 'text-emerald-600', 'bg-emerald-500/10'),
      dashboardLink('Regeneracja', 'Check-in zawodników', 'i-lucide-heart-pulse', '/trainer/regeneracja', 'text-rose-600', 'bg-rose-500/10'),
      dashboardLink('Inne ćwiczenia', 'Ranking siłowy', 'i-lucide-bar-chart-3', '/trainer/exercises', 'text-lime-600', 'bg-lime-500/10'),
      dashboardLink('Słownik ćwiczeń', 'Baza do planów', 'i-lucide-library', '/trainer/cwiczenia', 'text-indigo-500', 'bg-indigo-500/10'),
      dashboardLink('Analiza sztangi', 'Wideo i diagnostyka', 'i-lucide-scan-line', '/trainer/analiza-sztangi', 'text-orange-500', 'bg-orange-500/10'),
      dashboardLink('Monitoring', 'Metryki kadry', 'i-lucide-activity', '/trainer/monitoring', 'text-sky-600', 'bg-sky-500/10'),
      dashboardLink('Czat', 'Wiadomości 1:1', 'i-lucide-messages-square', '/chat', 'text-info', 'bg-info/12')
    ]
  },
  {
    title: 'Klub publiczny i konto',
    items: [
      dashboardLink('Ranking zawodników', 'Wyniki publiczne', 'i-lucide-trophy', '/zawodnicy', 'text-yellow-600', 'bg-yellow-500/10'),
      dashboardLink('Wyzwania miesiąca', 'Aktywność', 'i-lucide-flame', '/klub/wyzwania', 'text-orange-600', 'bg-orange-500/10'),
      dashboardLink('Powiadomienia', 'Alerty', 'i-lucide-bell', '/powiadomienia', 'text-amber-600', 'bg-amber-500/10'),
      dashboardLink('Proporcje', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12'),
      dashboardLink('Profil', 'Ustawienia konta', 'i-lucide-user-cog', '/profil', 'text-neutral-500', 'bg-neutral-500/10')
    ]
  }
]

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
  <UContainer class="slavia-panel-page py-8 md:py-14 lg:py-16">
    <DashboardHero
      eyebrow="Superadministracja"
      :title="`Witaj, ${auth.user.value?.username || 'Superadminie'}!`"
      lead="Panel systemowy: role, bezpieczeństwo, narzędzia i szybkie przejścia."
      icon="i-lucide-crown"
      :badges="[
        { label: `Konta admin: ${adminsCount}`, color: 'neutral' },
        { label: `Zawodnicy: ${athletesCount}`, color: 'neutral' }
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
          <h2 class="slavia-panel-section-title">
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

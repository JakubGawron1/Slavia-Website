<script setup lang="ts">
import type { AthletePaymentOverviewRow, Athlete } from '~/types/models'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardMonthlySummary from '~/components/dashboard/DashboardMonthlySummary.vue'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Panel superadmina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const clubHubOn = useExperimentalFlag('club_hub')
const { isAccountView } = useDashboardAccountView()
const { accountSettingsPath } = useRoleDashboardNav()
const apiFetch = useApi()

// Pobieranie podstawowych statystyk
const currentMonthStr = new Date().toISOString().slice(0, 7)

const { data: athletes } = await useAsyncData(
  'super-dashboard-athletes',
  () =>
    apiFetch
      .orEmpty<Athlete[]>('/api/athletes/admin', { fallback: [], toast: true })
      .then(rows => rows ?? []),
  { default: () => [] as Athlete[] }
)
const { data: adminsGrouped } = await useAsyncData(
  'super-dashboard-admins-grouped',
  () =>
    apiFetch
      .orEmpty<{ admins: unknown[], trainers: unknown[], athletes: unknown[] }>(
        '/api/admins/grouped',
        {
          fallback: { admins: [], trainers: [], athletes: [] },
          toast: true
        }
      )
      .then(rows => rows ?? { admins: [], trainers: [], athletes: [] }),
  { default: () => ({ admins: [], trainers: [], athletes: [] }) }
)
const { data: paymentsOverview } = await useAsyncData(
  'super-kpi-payments',
  () =>
    apiFetch
      .orEmpty<AthletePaymentOverviewRow[]>(`/api/payments/overview?month=${currentMonthStr}`, {
        fallback: [],
        toast: true
      })
      .then(rows => rows ?? []),
  { default: () => [] as AthletePaymentOverviewRow[] }
)
const { data: pendingResults } = await useAsyncData(
  'super-dashboard-pending',
  () => apiFetch.orEmpty<unknown[]>('/api/results/pending', { fallback: [], toast: true }).then(rows => rows ?? []),
  { default: () => [] }
)
const { data: recentAttendance } = await useAsyncData(
  'super-kpi-attendance-recent',
  () => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const from = d.toISOString().slice(0, 10)
    return apiFetch
      .orEmpty<{ status: string }[]>(`/api/attendance?from_date=${from}`, { fallback: [], toast: true })
      .then(rows => rows ?? [])
  },
  { default: () => [] as { status: string }[] }
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
const pendingResultsCount = computed(() =>
  Array.isArray(pendingResults.value) ? pendingResults.value.length : 0
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

provideDashboardSections()

const summaryMetrics = computed(() => [
  {
    label: 'Konta kadry',
    value: adminsCount.value,
    tone: 'error' as const,
    to: { path: '/superadmin/zawodnicy', query: { tab: 'accounts' } }
  },
  {
    label: 'Zawodnicy',
    value: athletesCount.value,
    tone: 'info' as const,
    to: '/superadmin/zawodnicy'
  },
  {
    label: 'Składki',
    value: `${paymentProgress.value}%`,
    tone: 'success' as const,
    hint: paymentsPendingCount.value ? `${paymentsPendingCount.value} oczekuje` : null,
    to: '/trainer/skladki'
  },
  {
    label: 'Obecność 30d',
    value: `${avgAttendance.value}%`,
    tone: 'primary' as const,
    to: '/klub/obecnosc'
  },
  {
    label: 'Wyniki oczek.',
    value: pendingResultsCount.value,
    tone: pendingResultsCount.value ? ('warning' as const) : ('neutral' as const),
    to: '/trainer/wyniki'
  }
])

</script>

<template>
  <PanelPageLayout>
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
    <PanelCollapsibleSection
      section-id="hero"
      title="Powitanie"
      icon="i-lucide-crown"
      :default-open="true"
    >
      <DashboardHero
        eyebrow="Superadministracja"
        :title="`Witaj, ${auth.user.value?.username || 'Superadminie'}!`"
        lead="Kontrola systemu, widoczność modułów i szybkie przejścia do narzędzi kadry."
        icon="i-lucide-crown"
        :badges="[
          { label: `Konta admin: ${adminsCount}`, color: 'neutral' },
          { label: `Zawodnicy: ${athletesCount}`, color: 'neutral' }
        ]"
        :actions="[
          { label: 'Ustawienia konta', to: accountSettingsPath, icon: 'i-lucide-user-cog', variant: 'outline' }
        ]"
      />
    </PanelCollapsibleSection>

    <PanelCalloutBanner
      class="mt-6"
      title="SuperAdmin"
      description="Wyłączone moduły na dashboardzie mają odznakę „Wyłączony”. Zarządzaj flagami w Nawigacja paneli."
      icon="i-lucide-layout-grid"
      tone="primary"
    >
      <template #actions>
        <UButton
          to="/superadmin/nawigacja-paneli"
          size="sm"
          variant="soft"
          trailing-icon="i-lucide-arrow-right"
        >
          Nawigacja paneli
        </UButton>
      </template>
    </PanelCalloutBanner>

    <DashboardSectionsToolbar class="mt-6" />

    <PanelCollapsibleSection
      section-id="summary"
      title="Podsumowanie miesiąca"
      icon="i-lucide-bar-chart-3"
      :default-open="true"
      class="mt-6"
    >
      <DashboardMonthlySummary :metrics="summaryMetrics" />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="clubHubOn"
      section-id="klub-hub"
      title="Strefa klubu"
      icon="i-lucide-users"
      :default-open="true"
      embedded
      class="mt-6"
    >
      <KlubHubSection context="superadmin" />
    </PanelCollapsibleSection>
    </template>
  </PanelPageLayout>
</template>

<script setup lang="ts">
import type { Athlete, AthletePaymentOverviewRow, CompetitionResult } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardUrgentList from '~/components/dashboard/DashboardUrgentList.vue'
import DashboardMonthlySummary from '~/components/dashboard/DashboardMonthlySummary.vue'
import type { DashboardModuleLink } from '~/utils/dashboardLink'

definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const { isAccountView } = useDashboardAccountView()
const { accountSettingsPath } = useRoleDashboardNav()
const apiFetch = useApi()
/** Sam administrator (bez osobnej roli trenera i bez SuperAdmin). */
const isPureAdmin = computed(() => {
  const r = auth.user.value?.roles ?? []
  return r.includes('Admin')
    && !r.includes('Trainer')
    && !r.includes('SuperAdmin')
})

// Pobieranie podstawowych statystyk
const { data: athletes } = await useAsyncData(
  'dashboard-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes')
    }
  }
)
const { data: pendingResults, refresh: refreshPending } = await useAsyncData(
  'dashboard-pending',
  async (): Promise<CompetitionResult[]> =>
    apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
)
const { data: competitions } = await useAsyncData('dashboard-competitions', () => apiFetch('/api/competitions').catch(() => []))

/** KPI Summary Data (Extended) */
const currentMonthStr = new Date().toISOString().slice(0, 7)
const { data: paymentsOverview } = await useAsyncData(
  'admin-kpi-payments',
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

const { data: recentAttendance } = await useAsyncData(
  'admin-kpi-attendance-recent',
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

const toast = useToast()

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
const pendingCount = computed(() => Array.isArray(pendingResults.value) ? pendingResults.value.length : 0)
const _competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

// [2002] Review modal state
const reviewModalOpen = ref(false)
const reviewingId = ref('')
const reviewMode = ref<'approve' | 'reject'>('approve')
const reviewNote = ref('')
const reviewSaving = ref(false)

function openReviewModal(id: string, mode: 'approve' | 'reject') {
  reviewingId.value = id
  reviewMode.value = mode
  reviewNote.value = ''
  reviewModalOpen.value = true
}

async function submitReview() {
  reviewSaving.value = true
  try {
    const body = reviewNote.value.trim() ? { review_note: reviewNote.value.trim() } : undefined
    if (reviewMode.value === 'approve') {
      await apiFetch(`/api/results/${reviewingId.value}/approve`, { method: 'PATCH', body })
      toast.add({ title: 'Wynik zatwierdzony', color: 'success' })
    } else {
      await apiFetch(`/api/results/${reviewingId.value}/reject`, { method: 'PATCH', body })
      toast.add({ title: 'Wynik odrzucony', color: 'success' })
    }
    reviewModalOpen.value = false
    await refreshPending()
  } catch (e) {
    toast.add({ title: 'Błąd weryfikacji', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    reviewSaving.value = false
  }
}

const { moduleGroupsForRole } = usePanelNavigationFlags()

const moduleGroups = computed((): { title: string, items: DashboardModuleLink[] }[] => {
  const adminGroups = moduleGroupsForRole('admin')
  if (isPureAdmin.value) return adminGroups

  const trainerItems = moduleGroupsForRole('trainer').flatMap(g => g.items)
  const trainerBlock = { title: 'Kadra trenera', items: trainerItems }
  const [most, content, account] = adminGroups
  if (!most || !content || !account) return adminGroups
  return [most, content, trainerBlock, account].filter(g => g.items.length > 0)
})

const summaryMetrics = computed(() => [
  {
    label: 'Zawodnicy',
    value: athletesCount.value,
    tone: 'info' as const,
    to: '/admin/zawodnicy'
  },
  {
    label: 'Wyniki oczek.',
    value: pendingCount.value,
    tone: pendingCount.value ? ('warning' as const) : ('neutral' as const),
    to: { path: '/admin', hash: '#wyniki-oczekujace' }
  },
  {
    label: 'Składki',
    value: `${paymentProgress.value}%`,
    tone: 'success' as const,
    hint: paymentsPendingCount.value ? `${paymentsPendingCount.value} oczekuje` : null,
    to: '/admin/zawodnicy'
  },
  {
    label: 'Obecność 30d',
    value: `${avgAttendance.value}%`,
    tone: 'primary' as const,
    hint: 'Lista na /attendance',
    to: '/attendance'
  }
])

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
  <div>
  <PanelPageLayout>
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
    <DashboardHero
      eyebrow="Administracja"
      :title="`Witaj, ${auth.user.value?.username || 'Adminie'}!`"
      lead="Szybkie wejścia do modułów i lista rzeczy, które wymagają uwagi."
      icon="i-lucide-shield"
      :badges="[
        { label: `Wyniki do zatwierdzenia: ${pendingCount}`, color: pendingCount ? 'warning' : 'neutral' },
        { label: `Zawodnicy: ${athletesCount}`, color: 'neutral' }
      ]"
      :actions="[
        { label: 'Ustawienia konta', to: accountSettingsPath, icon: 'i-lucide-user-cog', variant: 'outline' }
      ]"
    />

    <DashboardMonthlySummary class="mt-8" :metrics="summaryMetrics" />

    <PanelModuleNav
      :groups="moduleGroups"
      :tone-from-bg="toneFromBg"
    />

    <div class="mt-10">
      <DashboardUrgentList
        title="Wyniki do zatwierdzenia"
        icon="i-lucide-clipboard-clock"
        :count="pendingCount"
        empty-text="Brak oczekujących zgłoszeń."
        :footer-link="{ label: 'Wszystkie starty / dodaj wpis', to: '/trainer/wyniki' }"
        :items="(pendingResults || []).slice(0, 6).map(r => ({
          key: r.id,
          title: labelForResult(r),
          subtitle: `Rwanie ${r.snatch} · Podrzut ${r.clean_and_jerk} · Razem ${r.total} · ${r.date.slice(0,10)}`,
          badge: { label: 'Pending', color: 'warning' },
          primaryAction: { label: 'Zatwierdź', onClick: () => { openReviewModal(r.id, 'approve') } },
          secondaryAction: { label: 'Odrzuć', color: 'error', onClick: () => { openReviewModal(r.id, 'reject') } }
        }))"
      >
        <template #actions>
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-ccw" @click="refreshPending()">Odśwież</UButton>
        </template>
      </DashboardUrgentList>
    </div>
    </template>
  </PanelPageLayout>

  <!-- [2002] Modal zatwierdzenia/odrzucenia wyniku z powodem -->
  <SlaviaModal
    v-model:open="reviewModalOpen"
    :title="reviewMode === 'approve' ? 'Zatwierdź wynik' : 'Odrzuć wynik'"
    :dismissible="true"
    :ui="{ content: 'sm:max-w-lg rounded-3xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="reviewMode === 'approve' ? 'Uwaga do zawodnika (opcjonalnie)' : 'Powód odrzucenia (zalecane)'">
          <UTextarea
            v-model="reviewNote"
            :rows="3"
            :placeholder="reviewMode === 'approve' ? 'Np. Dobry start, wynik zatwierdzony.' : 'Np. Brak zaświadczenia / Błędna data'"
            class="w-full"
          />
        </UFormField>
        <p class="text-xs text-muted">
          Powód zostanie dostarczony zawodnikowi jako powiadomienie w aplikacji.
        </p>
        <div class="flex justify-end gap-2 border-t border-default/60 pt-3">
          <UButton color="neutral" variant="outline" @click="reviewModalOpen = false">Anuluj</UButton>
          <UButton
            :color="reviewMode === 'approve' ? 'primary' : 'error'"
            :loading="reviewSaving"
            @click="submitReview"
          >
            {{ reviewMode === 'approve' ? 'Zatwierdź' : 'Odrzuć' }}
          </UButton>
        </div>
      </div>
    </template>
  </SlaviaModal>
  </div>
</template>

<script setup lang="ts">
import type { Athlete, AthletePaymentOverviewRow, CompetitionResult, PendingPaymentRow } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardUrgentList from '~/components/dashboard/DashboardUrgentList.vue'
import DashboardMonthlySummary from '~/components/dashboard/DashboardMonthlySummary.vue'
definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Panel trenera — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const { isAccountView } = useDashboardAccountView()
const { accountSettingsPath } = useRoleDashboardNav()
const apiFetch = useApi()

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
  status?: string
  verification_state: string
}

/** KPI Summary Data */
const currentMonthStr = new Date().toISOString().slice(0, 7)
const { data: paymentsOverview } = await useAsyncData(
  'trainer-kpi-payments',
  () => apiFetch<AthletePaymentOverviewRow[]>(`${apiRoutes.payments.overview}?month=${currentMonthStr}`).catch(() => [])
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

/** Skrót: kto bez wpłaty za bieżący miesiąc (ideas #19). */
const unpaidThisMonth = computed(() =>
  (paymentsOverview.value || []).filter(r => !r.has_approved).slice(0, 12)
)

const { data: recentAttendance } = await useAsyncData(
  'trainer-kpi-attendance-recent',
  () => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const from = d.toISOString().slice(0, 10)
    return apiFetch<AttendanceRecord[]>(`/api/attendance?from_date=${from}`).catch(() => [])
  }
)

const avgAttendance = computed(() => {
  const rows = recentAttendance.value || []
  if (rows.length === 0) return 0
  const present = rows.filter(r => r.status === 'obecny').length
  return Math.round((present / rows.length) * 100)
})

const { data: pendingAttendanceRows } = await useAsyncData(
  'trainer-pending-attendance',
  () =>
    apiFetch<AttendanceRecord[]>('/api/attendance?verification_state=pending').catch(
      () => []
    )
)

const pendingAttendanceCount = computed(
  () => (pendingAttendanceRows.value || []).length
)

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
const _competitionsCount = computed(() => (Array.isArray(competitions.value) ? competitions.value.length : 0))

const { moduleGroupsForRole } = usePanelNavigationFlags()
const moduleGroups = computed(() => moduleGroupsForRole('trainer'))

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

const summaryMetrics = computed(() => [
  {
    label: 'Zawodnicy',
    value: athletesCount.value,
    tone: 'info' as const,
    to: '/trainer/zawodnicy'
  },
  {
    label: 'Obecność 30d',
    value: `${avgAttendance.value}%`,
    tone: 'success' as const,
    hint: pendingAttendanceCount.value ? `${pendingAttendanceCount.value} do weryfikacji` : null,
    to: '/attendance'
  },
  {
    label: 'Składki',
    value: `${paymentProgress.value}%`,
    tone: paymentProgress.value < 50 ? ('warning' as const) : ('success' as const),
    hint: paymentsPendingCount.value ? `${paymentsPendingCount.value} oczekuje` : null,
    to: '/trainer/skladki'
  },
  {
    label: 'Wyniki oczek.',
    value: pendingCount.value,
    tone: pendingCount.value ? ('warning' as const) : ('neutral' as const),
    to: { path: '/trainer', hash: '#wyniki-oczekujace' }
  }
])

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

</script>

<template>
  <div>
  <PanelPageLayout>
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
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
        { label: 'Ustawienia konta', to: accountSettingsPath, icon: 'i-lucide-user-cog', variant: 'outline' }
      ]"
    />

    <DashboardMonthlySummary class="mt-8" :metrics="summaryMetrics" />

    <UAlert
      v-if="pendingAttendanceCount > 0"
      class="mt-8"
      icon="i-lucide-user-check"
      color="warning"
      variant="subtle"
      title="Obecności oczekują na weryfikację"
      :description="`${pendingAttendanceCount} wpisów — zarządzaj na dedykowanej stronie listy obecności (kalendarz + agenda).`"
    >
      <template #actions>
        <UButton to="/attendance" size="sm" color="primary" variant="soft">
          Otwórz listę obecności
        </UButton>
      </template>
    </UAlert>

    <PanelModuleNav
      :groups="moduleGroups"
      :tone-from-bg="toneFromBg"
    />

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
          primaryAction: { label: 'Zatwierdź', onClick: () => { openReviewModal(r.id, 'approve') } },
          secondaryAction: { label: 'Odrzuć', color: 'error', onClick: () => { openReviewModal(r.id, 'reject') } }
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

      <UCard v-if="unpaidThisMonth.length" class="rounded-2xl border-warning/40 bg-warning/5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-bold text-highlighted">
            Bez wpłaty za {{ currentMonthStr }}
          </h3>
          <UButton size="xs" variant="soft" to="/trainer/skladki">
            Składki
          </UButton>
        </div>
        <ul class="mt-3 space-y-1 text-sm">
          <li v-for="row in unpaidThisMonth" :key="row.athlete_id" class="text-muted">
            {{ row.full_name }}
            <UBadge v-if="row.has_pending" size="xs" color="warning" variant="subtle" class="ml-1">
              Pending
            </UBadge>
          </li>
        </ul>
        <p v-if="paymentsPendingCount > unpaidThisMonth.length" class="mt-2 text-xs text-muted">
          + {{ paymentsPendingCount - unpaidThisMonth.length }} więcej — pełna lista w składkach.
        </p>
      </UCard>
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

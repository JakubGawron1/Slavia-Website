import type {
  Athlete,
  AthletePaymentOverviewRow,
  CompetitionResult,
  TrainerDashboardResponse
} from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

type AttendanceRecord = {
  id: string
  status?: string
  verification_state: string
}

export async function useTrainerDashboard() {
  const auth = useAuth()
  const { accountSettingsPath } = useRoleDashboardNav()
  const apiFetch = useApi()
  const toast = useToast()

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

  const { data: dashboardBundle, refresh: refreshDashboard } = await useAsyncData(
    'trainer-dashboard-bundle',
    () => apiFetch<TrainerDashboardResponse>(apiRoutes.trainer.dashboard).catch(() => null),
    { default: () => null }
  )

  const pendingResults = computed(() => dashboardBundle.value?.pending_results ?? [])
  const pendingPayments = computed(() => dashboardBundle.value?.pending_payments ?? [])
  const monitoringSummary = computed(() => dashboardBundle.value?.monitoring_summary ?? null)

  async function refreshPending() {
    await refreshDashboard()
  }

  async function refreshPendingPayments() {
    await refreshDashboard()
  }

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

  const pendingAttendanceCount = computed(
    () => monitoringSummary.value?.pending_attendance_count ?? 0
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
      to: '/klub/obecnosc'
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

  const trainerQuickActions = [
    { label: 'Zawodnicy', to: '/trainer/zawodnicy', icon: 'i-lucide-users' },
    { label: 'Wyniki', to: '/trainer/wyniki', icon: 'i-lucide-trophy' },
    { label: 'Składki', to: '/trainer/skladki', icon: 'i-lucide-banknote' },
    { label: 'Plany', to: '/trainer/plany', icon: 'i-lucide-clipboard-list' },
    { label: 'Dzienniki', to: '/trainer/dziennik', icon: 'i-lucide-book-marked' },
    { label: 'Obecność', to: '/klub/obecnosc', icon: 'i-lucide-user-check' },
    { label: 'Czat', to: '/klub/czat', icon: 'i-lucide-messages-square' },
    { label: 'Regeneracja', to: '/trainer/regeneracja', icon: 'i-lucide-heart-pulse' }
  ]

  return {
    accountSettingsPath,
    approvePayment,
    auth,
    currentMonthStr,
    labelForResult,
    openReviewModal,
    pendingAttendanceCount,
    pendingCount,
    pendingPayments,
    pendingPaymentsCount,
    pendingResults,
    paymentsPendingCount,
    refreshPending,
    refreshPendingPayments,
    rejectPayment,
    reviewModalOpen,
    reviewMode,
    reviewNote,
    reviewSaving,
    submitReview,
    summaryMetrics,
    trainerQuickActions,
    unpaidThisMonth
  }
}

import type {
  Athlete,
  AthleteDashboardResponse,
  MobileReleaseInfo,
  MyCalendarEntry,
  PaymentStatusResponse
} from '~/types/models'
import { apiRoutes } from '~/config/api'
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'
import {
  athletePaymentKpiFromStatus,
  showPre10PaymentAthleteReminder
} from '~/utils/paymentSemantics'
import {
  cloneDefaultChecklist,
  daysUntilDate,
  findNearestCalendarEntry,
  goalCurrentValueFromAthlete,
  mergeChecklistWithSaved,
  resolvePreStartEntry,
  seasonGoalProgressPercent,
  shouldShowOverduePaymentAlert,
  type GoalMode,
  type SeasonGoalData
} from '~/utils/athleteDashboardLogic'
import {
  canPersistAthleteDashboardCache,
  clearAthleteDashboardCache,
  peekAthleteDashboardCache,
  readAthleteDashboardCache,
  writeAthleteDashboardCache
} from '~/utils/athleteDashboardCache'
import { scheduleIdleWork } from '~/utils/scheduleIdleWork'
import { API_PANEL_COLD_START_TIMEOUT_MS } from '~/composables/useApi'
import { fetchWithDashboardKpiRetry } from '~/utils/dashboardKpiLoadLogic'

type AthleteBundle = {
  athlete: Athlete | null
  pendingResultsCount: number
  calendarEntries: MyCalendarEntry[]
  attendanceSummary: AttendanceSummary | null
  paymentStatus: PaymentStatusResponse | null
}
type AttendanceSummary = {
  athlete_id: string
  present_count: number
  absent_count: number
  pending_count: number
  attendance_percent: number
}

const PAY_HIDE_LS = 'slavia_hide_payment_reminder'
const ONBOARD_LS = 'slavia_onboarding_athlete_v1_done'
const GOAL_LS_KEY = 'slavia_season_goal_v1'
const CHECKLIST_LS_KEY = 'slavia_prestart_checklist_v1'

export async function useAthleteDashboard() {
  const auth = useAuth()
  const rolePreviewState = useRolePreviewState()
  const apiFetch = useApi()
  const toast = useToast()
  const terms = useSlaviaCopy()
  const route = useRoute()
  const { accountSettingsPath } = useRoleDashboardNav()

  /** Konto z przypisaną rolą „Zawodnik” (nie mylić z dostępem SuperAdmin do tej strefy). */
  const isAthleteRole = computed(() => auth.isAthlete.value)
  const isAthletePortalAsSuperAdminOnly = computed(
    () => auth.isSuperAdmin.value && !auth.isAthlete.value
  )

  const paymentMonth = ref(new Date().toISOString().slice(0, 7))

  const emptyAthleteBundle = (): AthleteBundle => ({
    athlete: null,
    pendingResultsCount: 0,
    calendarEntries: [],
    attendanceSummary: null,
    paymentStatus: null
  })

  function dashboardQuery(month = paymentMonth.value): string {
    return month ? `?month=${encodeURIComponent(month)}` : ''
  }

  function mapDashboardToBundle(dashboard: AthleteDashboardResponse | null): AthleteBundle {
    if (!dashboard) return emptyAthleteBundle()
    const canLoadAttendance = !!dashboard.athlete?.id
    const canLoadPayment = !!(
      isAthleteRole.value
      && auth.canAccessAthletePortal.value
      && dashboard.athlete?.id
      && rolePreviewState.viewingAthletePortal.value
    )
    return {
      athlete: dashboard.athlete,
      pendingResultsCount: dashboard.pending_results_count ?? 0,
      calendarEntries: Array.isArray(dashboard.calendar_entries) ? dashboard.calendar_entries : [],
      attendanceSummary: canLoadAttendance ? (dashboard.attendance_summary ?? null) : null,
      paymentStatus: canLoadPayment ? (dashboard.payment_status ?? null) : null
    }
  }

  /** Agregat dashboardu — dłuższy timeout i jeden retry przy 502/503 (HF cold start po idle). */
  async function fetchDashboardPayload(options?: { coldStart?: boolean }): Promise<AthleteDashboardResponse | null> {
    const url = `${apiRoutes.athletes.meDashboard}${dashboardQuery()}`
    const fetcher = () => apiFetch<AthleteDashboardResponse>(url, {
      timeout: API_PANEL_COLD_START_TIMEOUT_MS
    })
    if (options?.coldStart) {
      return await fetchWithDashboardKpiRetry(fetcher, {
        maxAttempts: 2,
        delaysMs: [1_000]
      }).catch(() => null)
    }
    return await fetcher().catch(() => null)
  }

  function canUseAthleteDashboardCache(): boolean {
    return canPersistAthleteDashboardCache(
      auth.isAthlete.value,
      rolePreviewState.isActive.value,
      auth.user.value?.id
    )
  }

  function readCachedDashboardBundle(): AthleteBundle | null {
    if (!import.meta.client) return null
    const month = paymentMonth.value
    const userId = auth.user.value?.id
    const entry = userId
      ? readAthleteDashboardCache(userId, month)
      : peekAthleteDashboardCache(month)
    if (!entry) return null
    if (userId && entry.userId !== userId) {
      clearAthleteDashboardCache(entry.userId)
      return null
    }
    return mapDashboardToBundle(entry.data)
  }

  function persistDashboardCache(dashboard: AthleteDashboardResponse) {
    const userId = auth.user.value?.id
    if (!canUseAthleteDashboardCache() || !userId) return
    writeAthleteDashboardCache(userId, paymentMonth.value, dashboard)
  }

  const cachedBundlePreview = readCachedDashboardBundle()

  const { data: bundle, pending: bundlePending } = await useAsyncData(
    () => `athlete-page-bundle-${paymentMonth.value}`,
    async () => {
      await auth.ensureSession()
      const roles = auth.user.value?.roles ?? []
      if (!roles.includes('Athlete') && !roles.includes('SuperAdmin')) {
        return emptyAthleteBundle()
      }
      const userId = auth.user.value?.id
      const dashboard = await fetchDashboardPayload({ coldStart: true })
      if (dashboard) {
        persistDashboardCache(dashboard)
        return mapDashboardToBundle(dashboard)
      }
      if (userId) {
        const cached = readAthleteDashboardCache(userId, paymentMonth.value)
        if (cached) return mapDashboardToBundle(cached.data)
      }
      return cachedBundlePreview ?? emptyAthleteBundle()
    },
    { default: () => cachedBundlePreview ?? emptyAthleteBundle() }
  )

  const resultsPending = computed(
    () => bundlePending.value && !cachedBundlePreview && !bundle.value?.athlete?.id
  )

  const athlete = computed(() => bundle.value?.athlete ?? null)
  const myPendingResultsCount = computed(() => bundle.value?.pendingResultsCount ?? 0)

  const shouldLoadAttendanceKpi = computed(() => !!athlete.value?.id)
  const shouldLoadPaymentKpi = computed(() => !!(
    isAthleteRole.value
    && auth.canAccessAthletePortal.value
    && athlete.value?.id
    && rolePreviewState.viewingAthletePortal.value
  ))

  const attendanceKpiLoad = useDashboardKpiLoad<AttendanceSummary>()
  const paymentKpiLoad = useDashboardKpiLoad<PaymentStatusResponse>()

  function syncKpiFromBundle(next: AthleteBundle | null) {
    if (!next) return
    if (shouldLoadAttendanceKpi.value) {
      attendanceKpiLoad.data.value = next.attendanceSummary
      attendanceKpiLoad.loading.value = false
      attendanceKpiLoad.failed.value = !next.attendanceSummary
    }
    if (shouldLoadPaymentKpi.value) {
      paymentKpiLoad.data.value = next.paymentStatus
      paymentKpiLoad.loading.value = false
      paymentKpiLoad.failed.value = !next.paymentStatus
    }
  }

  syncKpiFromBundle(bundle.value)

  watch(
    () => bundle.value,
    (next) => syncKpiFromBundle(next ?? null)
  )

  const attendanceSummary = computed(() => attendanceKpiLoad.data.value)
  const paymentStatus = computed(() => {
    if (!shouldLoadPaymentKpi.value) return null
    return paymentKpiLoad.data.value
  })

  async function refreshAttendanceSummary() {
    await attendanceKpiLoad.refresh(async () => {
      const dashboard = await fetchDashboardPayload()
      if (!dashboard?.attendance_summary) {
        throw new Error('Brak podsumowania frekwencji')
      }
      persistDashboardCache(dashboard)
      bundle.value = mapDashboardToBundle(dashboard)
      return dashboard.attendance_summary
    }, { skip: !shouldLoadAttendanceKpi.value })
  }

  async function refreshPaymentStatus() {
    await paymentKpiLoad.refresh(async () => {
      const dashboard = await fetchDashboardPayload()
      if (!dashboard?.payment_status) {
        throw new Error('Brak statusu składki')
      }
      persistDashboardCache(dashboard)
      bundle.value = mapDashboardToBundle(dashboard)
      return dashboard.payment_status
    }, { skip: !shouldLoadPaymentKpi.value })
  }

  const latestRelease = ref<MobileReleaseInfo | null>(null)

  scheduleIdleWork(() => {
    void apiFetch<MobileReleaseInfo>('/api/system/mobile-releases/latest')
      .then((release) => {
        latestRelease.value = release
      })
      .catch(() => {
        latestRelease.value = null
      })
  })

  const welcomeName = computed(
    () => athlete.value?.full_name?.trim() || auth.user.value?.username || 'Zawodniku'
  )

  /** Avatar na dashboardzie: konto (`avatar_url` + opcjonalnie `athlete_image_url` z /me) albo `image_url` z API zawodnika. */
  const portalHeroAvatarSrc = computed(() => {
    const fromAuth = resolveAuthProfilePhotoSrc(auth.user.value ?? undefined)
    if (fromAuth) return fromAuth
    const img = athlete.value?.image_url?.trim()
    return img || undefined
  })

  const paymentKpi = computed(() => {
    if (!isAthleteRole.value) {
      return { value: '—', tone: 'info' as const, hint: 'Dostępne tylko dla roli zawodnika' }
    }
    if (paymentKpiLoad.loading.value) {
      return { value: '—', tone: 'info' as const, hint: null }
    }
    if (paymentKpiLoad.failed.value || !paymentStatus.value) {
      return { value: '—', tone: 'info' as const, hint: 'Brak danych (odśwież)' }
    }
    return athletePaymentKpiFromStatus(paymentStatus.value, terms.paymentStandingOrder())
  })

  const { moduleGroupsForRole } = usePanelNavigationFlags()
  const athleteModuleGroups = computed(() => moduleGroupsForRole('athlete'))

  function toneFromIconBg(iconBg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
    const s = String(iconBg || '').toLowerCase()
    if (s.includes('error') || s.includes('rose') || s.includes('red')) return 'error'
    if (s.includes('warning') || s.includes('amber') || s.includes('yellow') || s.includes('orange')) return 'warning'
    if (s.includes('success') || s.includes('emerald') || s.includes('green') || s.includes('teal')) return 'success'
    if (s.includes('info') || s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
    if (s.includes('primary') || s.includes('violet') || s.includes('purple') || s.includes('fuchsia') || s.includes('lime')) return 'primary'
    if (s.includes('muted')) return 'neutral'
    return 'neutral'
  }

  const pageHeading = computed(() => {
    if (isAthletePortalAsSuperAdminOnly.value) return 'Strefa zawodnika'
    return isAthleteRole.value ? 'Panel Zawodnika' : 'Profil konta'
  })
  const pageLead = computed(() => {
    if (isAthletePortalAsSuperAdminOnly.value) {
      return 'Podgląd strefy zawodnika dla superadmina.'
    }
    return isAthleteRole.value
      ? 'Składka, starty, kalendarz i moduły — wszystko w jednym miejscu.'
      : 'Ustawienia konta. Funkcje zawodnicze wymagają roli zawodnika.'
  })
  const heroBadges = computed(() => {
    const label = auth.rolesDisplayShort.value
    return label ? [{ label, color: 'neutral' as const }] : undefined
  })

  /** Konto z rolą zawodnika powiązane z rekordem oznaczonym jako nieaktywny (archiwum kadry). */
  const showArchivedAthleteNote = computed(
    () => isAthleteRole.value && !!athlete.value?.id && athlete.value.is_active === false
  )

  const hidePaymentReminderLocal = ref(false)
  const showOnboarding = ref(false)

  function syncPaymentReminderFromStorage() {
    if (!import.meta.client) return
    try {
      hidePaymentReminderLocal.value = localStorage.getItem(PAY_HIDE_LS) === '1'
    } catch {
      /* ignore */
    }
  }

  watch(
    () => route.fullPath,
    () => {
      syncPaymentReminderFromStorage()
    }
  )

  function dismissOnboarding() {
    showOnboarding.value = false
    if (!import.meta.client) return
    try {
      localStorage.setItem(ONBOARD_LS, '1')
    } catch {
      /* ignore */
    }
  }

  const showPre10PaymentBanner = computed(() =>
    showPre10PaymentAthleteReminder({
      isAthlete: isAthleteRole.value,
      hiddenInBrowserStorage: hidePaymentReminderLocal.value,
      paymentStatus: paymentStatus.value
    }))

  // ─── [2024] Overdue payment alert ──────────────────────────────────────────
  const showOverduePaymentAlert = computed(() =>
    shouldShowOverduePaymentAlert(isAthleteRole.value, paymentStatus.value))

  // ─── [2001] "Mój Tydzień" widget ─────────────────────────────────────────
  /** Today’s date string (YYYY-MM-DD) */
  const todayStr = new Date().toISOString().slice(0, 10)

  /** Nearest upcoming calendar entry (competition or event). */
  const nearestCalendarEntry = computed(() =>
    findNearestCalendarEntry(bundle.value?.calendarEntries ?? [], todayStr))

  /** Days until nearest event (0 = today). */
  const daysUntilNearest = computed(() => {
    const d = nearestCalendarEntry.value?.competition?.date
    if (!d) return null
    return daysUntilDate(d, todayStr)
  })

  // ─── [2005] Season Goal ────────────────────────────────────────────────────
  const seasonGoal = ref<SeasonGoalData | null>(null)
  const goalMode = ref<GoalMode>('total')
  const goalTarget = ref<number | null>(null)
  const goalEditing = ref(false)

  function loadGoalFromStorage() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(GOAL_LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SeasonGoalData
        seasonGoal.value = parsed
        goalMode.value = parsed.mode
        goalTarget.value = parsed.target
      }
    } catch { /* ignore */ }
  }

  function saveGoal() {
    if (!goalTarget.value || goalTarget.value <= 0) {
      toast.add({ title: 'Podaj cel większy od zera', color: 'warning' })
      return
    }
    const data: SeasonGoalData = { mode: goalMode.value, target: goalTarget.value }
    seasonGoal.value = data
    goalEditing.value = false
    if (!import.meta.client) return
    try { localStorage.setItem(GOAL_LS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
    toast.add({ title: 'Cel sezonu zapisany', color: 'success' })
  }

  function clearGoal() {
    seasonGoal.value = null
    goalTarget.value = null
    goalEditing.value = false
    if (!import.meta.client) return
    try { localStorage.removeItem(GOAL_LS_KEY) } catch { /* ignore */ }
  }

  const goalCurrentValue = computed(() =>
    goalCurrentValueFromAthlete(athlete.value, goalMode.value))

  const goalProgress = computed(() => {
    if (!seasonGoal.value) return 0
    return seasonGoalProgressPercent(goalCurrentValue.value, seasonGoal.value.target)
  })

  // ─── [2013] Pre-start checklist ────────────────────────────────────────────
  const checklistItems = ref(cloneDefaultChecklist())

  function loadChecklistFromStorage(forDate: string) {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(`${CHECKLIST_LS_KEY}_${forDate}`)
      if (raw) {
        const saved = JSON.parse(raw) as { id: string; checked: boolean }[]
        checklistItems.value = mergeChecklistWithSaved(cloneDefaultChecklist(), saved)
      } else {
        checklistItems.value = cloneDefaultChecklist()
      }
    } catch { /* ignore */ }
  }

  function saveChecklistToStorage(forDate: string) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(
        `${CHECKLIST_LS_KEY}_${forDate}`,
        JSON.stringify(checklistItems.value.map(i => ({ id: i.id, checked: i.checked })))
      )
    } catch { /* ignore */ }
  }

  /** Next competition within 48 hours. */
  const preStartEntry = computed(() =>
    resolvePreStartEntry(nearestCalendarEntry.value, daysUntilNearest.value))

  const checklistDoneCount = computed(() => checklistItems.value.filter(i => i.checked).length)
  const checklistTotal = computed(() => checklistItems.value.length)

  watch(preStartEntry, (entry) => {
    if (entry?.competition?.date) {
      loadChecklistFromStorage(entry.competition.date)
    }
  }, { immediate: true })

  function toggleChecklistItem(id: string) {
    const item = checklistItems.value.find(i => i.id === id)
    if (item) item.checked = !item.checked
    const forDate = preStartEntry.value?.competition?.date
    if (forDate) saveChecklistToStorage(forDate)
  }

  const athleteQuickActions = computed(() => {
    const actions = [
      { label: 'Starty', to: '/athlete/wyniki', icon: 'i-lucide-trophy' },
      { label: 'Kalendarz', to: '/athlete/kalendarz', icon: 'i-lucide-calendar-days' },
      { label: 'Dziennik', to: '/athlete/dziennik', icon: 'i-lucide-book-marked' },
      { label: 'Plany', to: '/athlete/plany', icon: 'i-lucide-clipboard-list' },
      { label: 'Czat', to: '/klub/czat', icon: 'i-lucide-messages-square' }
    ]
    if (isAthleteRole.value) {
      actions.splice(1, 0, { label: 'Składka', to: '/athlete/skladki', icon: 'i-lucide-banknote' })
    }
    return actions
  })

  onMounted(() => {
    syncPaymentReminderFromStorage()
    loadGoalFromStorage()
    if (isAthleteRole.value) {
      try {
        if (!localStorage.getItem(ONBOARD_LS)) {
          showOnboarding.value = true
        }
      } catch {
        /* ignore */
      }
    }
  })

  return {
    auth,
    accountSettingsPath,
    athlete,
    athleteModuleGroups,
    athleteQuickActions,
    attendanceKpiLoad,
    attendanceSummary,
    checklistDoneCount,
    checklistItems,
    checklistTotal,
    clearGoal,
    daysUntilNearest,
    dismissOnboarding,
    goalCurrentValue,
    goalEditing,
    goalMode,
    goalProgress,
    goalTarget,
    heroBadges,
    isAthleteRole,
    latestRelease,
    myPendingResultsCount,
    resultsPending,
    nearestCalendarEntry,
    pageHeading,
    pageLead,
    paymentKpi,
    paymentKpiLoad,
    paymentStatus,
    portalHeroAvatarSrc,
    preStartEntry,
    refreshAttendanceSummary,
    refreshPaymentStatus,
    saveGoal,
    seasonGoal,
    showArchivedAthleteNote,
    showOnboarding,
    showOverduePaymentAlert,
    showPre10PaymentBanner,
    toggleChecklistItem,
    toneFromIconBg,
    welcomeName
  }
}

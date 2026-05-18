<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import type { Athlete, CompetitionResult, MobileReleaseInfo, MyCalendarEntry, PaymentStatusResponse } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'
import {
  athletePaymentKpiFromStatus,
  membershipMonthBadgeFromStatus,
  showPre10PaymentAthleteReminder
} from '~/utils/paymentSemantics'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import { dashboardLink, type DashboardModuleLink } from '~/utils/dashboardLink'

definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const terms = useSlaviaCopy()
const route = useRoute()

/** Konto z przypisaną rolą „Zawodnik” (nie mylić z dostępem SuperAdmin do tej strefy). */
const isAthleteRole = computed(() => auth.isAthlete.value)
const isAthletePortalAsSuperAdminOnly = computed(
  () => auth.isSuperAdmin.value && !auth.isAthlete.value
)

type AthleteBundle = { athlete: Athlete | null, results: CompetitionResult[], calendarEntries: MyCalendarEntry[] }
type AttendanceSummary = {
  athlete_id: string
  present_count: number
  absent_count: number
  pending_count: number
  attendance_percent: number
}

const { data: bundle, refresh: refreshAthletePage } = await useAsyncData(
  'athlete-page-bundle',
  async () => {
    await auth.ensureSession()
    const roles = auth.user.value?.roles ?? []
    if (!roles.includes('Athlete') && !roles.includes('SuperAdmin')) {
      return { athlete: null, results: [], calendarEntries: [] } satisfies AthleteBundle
    }
    const a = await apiFetch<Athlete | null>(`/api/athletes/me`).catch(() => null)
    const results = a?.id
      ? await apiFetch<CompetitionResult[]>(`/api/results/athlete/${a.id}/submissions`).catch(() => [])
      : []
    const cal = await apiFetch<{ entries: MyCalendarEntry[] }>('/api/athletes/my-calendar').catch(() => ({
      entries: [] as MyCalendarEntry[]
    }))
    return {
      athlete: a,
      results,
      calendarEntries: Array.isArray(cal.entries) ? cal.entries : []
    } satisfies AthleteBundle
  },
  { default: () => ({ athlete: null, results: [], calendarEntries: [] }) }
)

const athlete = computed(() => bundle.value?.athlete ?? null)
const results = computed(() => bundle.value?.results ?? [])
const recentResults = computed(() => results.value.slice(0, 7))
const myPendingResultsCount = computed(() => results.value.filter(r => r.status === 'Pending').length)
const attendanceSummary = ref<AttendanceSummary | null>(null)
const paymentStatus = ref<PaymentStatusResponse | null>(null)

const paymentForm = reactive<{
  month: string
  amount_pln: number | null
  note: string
}>({
  month: new Date().toISOString().slice(0, 7),
  amount_pln: null,
  note: ''
})

async function refreshResults() {
  await refreshAthletePage()
  await refreshAttendanceSummary()
  await refreshPaymentStatus()
}

async function refreshAttendanceSummary() {
  if (!athlete.value?.id) {
    attendanceSummary.value = null
    return
  }
  attendanceSummary.value = await apiFetch<AttendanceSummary>(`/api/attendance/summary/${athlete.value.id}`).catch(() => null)
}

async function refreshPaymentStatus() {
  if (!auth.canAccessAthletePortal.value || !athlete.value?.id || !auth.isAthlete.value) {
    paymentStatus.value = null
    return
  }
  const q = paymentForm.month ? `?month=${encodeURIComponent(paymentForm.month)}` : ''
  paymentStatus.value = await apiFetch<PaymentStatusResponse>(`${apiRoutes.payments.myStatus}${q}`).catch(() => null)
}

async function submitMembershipPayment() {
  if (!auth.canAccessAthletePortal.value) {
    toast.add({ title: 'Brak dostępu', description: 'Ta sekcja wymaga dostępu do panelu zawodnika.', color: 'warning' })
    return
  }
  if (!athlete.value?.id) {
    toast.add({ title: 'Brak profilu zawodnika', description: 'Twoje konto nie jest powiązane z profilem w bazie.', color: 'warning' })
    return
  }
  if (!auth.isAthlete.value) {
    toast.add({ title: 'Brak roli zawodnika', description: 'Tylko konto z rolą Athlete może zgłaszać płatności.', color: 'warning' })
    return
  }
  try {
    const amount = paymentForm.amount_pln != null ? Number(paymentForm.amount_pln) : null
    await apiFetch(apiRoutes.payments.my, {
      method: 'POST',
      body: {
        month: paymentForm.month,
        amount_pln: amount != null && Number.isFinite(amount) && amount > 0 ? amount : null,
        note: paymentForm.note
      }
    })
    toast.add({
      title: 'Zgłoszono płatność',
      description: 'Zgłoszenie trafiło do weryfikacji przez kadrę.',
      color: 'success'
    })
    await refreshPaymentStatus()
  } catch (e) {
    toast.add({
      title: 'Błąd zgłoszenia płatności',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

const resultForm = reactive<{
  kind: 'competition' | 'training'
  location: string
  snatch: number | null
  clean_and_jerk: number | null
  total: number
  bodyweight: number | null
  date: string
}>({
  kind: 'competition',
  location: '',
  snatch: null,
  clean_and_jerk: null,
  total: 0,
  bodyweight: null,
  date: new Date().toISOString().substring(0, 10)
})

watch(
  () => [resultForm.snatch, resultForm.clean_and_jerk],
  ([snatch, clean]) => {
    resultForm.total = (snatch || 0) + (clean || 0)
  }
)

const sinclairValue = ref(0)
watch(
  () => [resultForm.total, resultForm.bodyweight, athlete.value?.bodyweight, athlete.value?.gender],
  async () => {
    const g = athlete.value?.gender === 'female' ? 'female' : 'male'
    const w = resultForm.bodyweight || athlete.value?.bodyweight || 0
    if (w <= 0 || resultForm.total <= 0) {
      sinclairValue.value = 0
      return
    }
    const { sinclairTotal } = await import('~/utils/sinclair')
    sinclairValue.value = sinclairTotal(resultForm.total, w, g)
  },
  { immediate: true }
)

function useProfileWeight() {
  if (athlete.value?.bodyweight) {
    resultForm.bodyweight = athlete.value.bodyweight
  }
}

/** Idea #49 — wstaw wagę z profilu i pokaż przeliczony Sinclair. */
function applySinclairCalcAndInsert() {
  useProfileWeight()
  if (!resultForm.bodyweight && athlete.value?.bodyweight) {
    resultForm.bodyweight = athlete.value.bodyweight
  }
  if (resultForm.total <= 0) {
    toast.add({
      title: 'Uzupełnij rwanie i podrzut',
      description: 'Suma dwuboju musi być większa od zera.',
      color: 'warning'
    })
    return
  }
  toast.add({
    title: 'Sinclair przeliczony',
    description: `${sinclairValue.value.toFixed(2)} pkt (podgląd — nie zapisujemy automatycznie w zgłoszeniu).`,
    color: 'success'
  })
}

/** Idea #22 — zapis bieżącego formularza jako scenariusz (jak kalkulator). */
async function saveResultFormAsSinclairScenario() {
  const g = athlete.value?.gender === 'female' ? 'female' : 'male'
  const bw = resultForm.bodyweight || athlete.value?.bodyweight
  const t = resultForm.total
  if (!bw || bw <= 0 || t <= 0) {
    toast.add({ title: 'Uzupełnij wagę i sumę', color: 'warning' })
    return
  }
  const { sinclairTotal: st } = await import('~/utils/sinclair')
  const sin = Number(st(t, bw, g).toFixed(2))
  try {
    const saved = localStorage.getItem('slavia_sinclair_scenarios')
    const list = saved ? JSON.parse(saved) : []
    list.push({
      id: crypto.randomUUID(),
      label: `Z formularza ${resultForm.date}`,
      gender: g,
      bodyweight: bw,
      total: t,
      sinclair: sin,
      at: new Date().toISOString()
    })
    localStorage.setItem('slavia_sinclair_scenarios', JSON.stringify(list))
    toast.add({ title: 'Scenariusz zapisany lokalnie', color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się zapisać scenariusza', color: 'error' })
  }
}

function applySinclairQueryFromRoute() {
  const q = route.query
  const bw = Number(q.sinclair_bw)
  const tot = Number(q.sinclair_total)
  if (Number.isFinite(bw) && bw > 0) resultForm.bodyweight = bw
  if (Number.isFinite(tot) && tot > 0) {
    resultForm.snatch = Math.floor(tot / 2)
    resultForm.clean_and_jerk = tot - (resultForm.snatch || 0)
    resultForm.total = tot
  }
  if (q.sinclair_gender === 'female' || q.sinclair_gender === 'male') {
    // gender z profilu zawodnika — tylko podpowiedź w UI
  }
}

onMounted(() => {
  applySinclairQueryFromRoute()
})

async function submitResult() {
  if (!athlete.value) {
    toast.add({ title: 'Brak profilu zawodnika', color: 'warning' })
    return
  }
  if (resultForm.snatch != null && resultForm.snatch < 0) {
    toast.add({ title: 'Rwanie nie może być ujemne', color: 'warning' })
    return
  }
  if (resultForm.clean_and_jerk != null && resultForm.clean_and_jerk < 0) {
    toast.add({ title: 'Podrzut nie może być ujemny', color: 'warning' })
    return
  }
  const hasOly =
    (resultForm.snatch != null && resultForm.snatch > 0)
    || (resultForm.clean_and_jerk != null && resultForm.clean_and_jerk > 0)
  if (!hasOly) {
    toast.add({
      title: 'Uzupełnij formularz',
      description: 'Podaj rwanie i/lub podrzut.',
      color: 'warning'
    })
    return
  }

  const sn = resultForm.snatch ?? 0
  const cj = resultForm.clean_and_jerk ?? 0
  const tot = resultForm.total
  if (hasOly && tot === 0 && sn === 0 && cj === 0) {
    const ok = typeof window !== 'undefined'
      && window.confirm(
        'Zgłaszasz wpis z zerowym total (obie próby 0 kg). Czy na pewno chcesz wysłać taki wynik?'
      )
    if (!ok) return
  } else if (sn > 0 && cj > 0) {
    if (Math.abs(sn - cj) >= 100) {
      const ok = typeof window !== 'undefined'
        && window.confirm(
          'Różnica między rwaniem a podrzutem wynosi co najmniej 100 kg. Sprawdź wartości przed wysłaniem — kontynuować?'
        )
      if (!ok) return
    }
  }

  try {
    const body: Record<string, unknown> = {
      athlete_id: athlete.value.id,
      date: resultForm.date,
      kind: resultForm.kind
    }
    if (resultForm.kind === 'competition' && resultForm.location.trim()) {
      body.location = resultForm.location.trim()
    }
    // 0 jest dozwolone (np. kontuzja / jednobój), ale null oznacza „nie podano”.
    if (resultForm.snatch != null && resultForm.snatch >= 0) body.snatch = resultForm.snatch
    if (resultForm.clean_and_jerk != null && resultForm.clean_and_jerk >= 0) body.clean_and_jerk = resultForm.clean_and_jerk
    if (resultForm.snatch != null || resultForm.clean_and_jerk != null) body.total = resultForm.total
    if (resultForm.bodyweight != null && resultForm.bodyweight > 0) {
      body.bodyweight_kg = resultForm.bodyweight
    }

    await apiFetch('/api/results', {
      method: 'POST',
      body
    })
    toast.add({
      title: 'Zgłoszono wynik',
      description: resultForm.kind === 'training'
        ? 'Wpis treningowy trafił do oczekujących.'
        : 'Wynik z zawodów trafił do oczekujących.',
      color: 'success'
    })
    resultForm.snatch = null
    resultForm.clean_and_jerk = null
    resultForm.total = 0
    resultForm.date = new Date().toISOString().substring(0, 10)
    resultForm.kind = 'competition'
    resultForm.location = ''
    await refreshResults()
  } catch (e) {
    toast.add({ title: 'Błąd zgłoszenia', description: getApiErrorMessage(e), color: 'error' })
  }
}

const { data: latestRelease } = await useAsyncData('latest-mobile-release-athlete', () => apiFetch<MobileReleaseInfo>('/api/system/mobile-releases/latest').catch(() => null))

useSeoMeta({
  title: 'Profil konta — CKS Slavia Ruda Śląska',
  robots: 'noindex, nofollow'
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
  if (!paymentStatus.value) {
    return { value: '—', tone: 'info' as const, hint: 'Brak danych (odśwież)' }
  }
  return athletePaymentKpiFromStatus(paymentStatus.value, terms.paymentStandingOrder())
})

/** Spójny kolor/tekst z KPI — bez mylenia zielonego kafelka z faktycznym „opłacona”. */
const membershipMonthBadge = computed(() => {
  if (!paymentStatus.value) return null
  return membershipMonthBadgeFromStatus(paymentStatus.value, terms.paymentStandingOrder())
})

const athleteModuleGroups: { title: string, items: DashboardModuleLink[] }[] = [
  {
    title: 'Najczęstsze',
    items: [
      dashboardLink('Składka klubowa', 'Zgłoś płatność i status', 'i-lucide-banknote', '/athlete/skladki', 'text-primary', 'bg-primary/15'),
      dashboardLink('Kalendarz startów', 'Przypisania od kadry', 'i-lucide-calendar-heart', '/athlete/kalendarz', 'text-primary', 'bg-primary/15'),
      dashboardLink('Moja obecność', 'Zgłoś i sprawdź historię', 'i-lucide-user-check', '/attendance', 'text-primary', 'bg-primary/12'),
      ...(useExperimentalFlag('attendance_qr_checkin').value
        ? [dashboardLink('Skaner QR obecności', 'Check-in na sali', 'i-lucide-qr-code', '/athlete/obecnosc-qr', 'text-primary', 'bg-primary/10')]
        : []),
      dashboardLink('Czat z trenerem', 'Wiadomości 1:1', 'i-lucide-messages-square', '/chat', 'text-info', 'bg-info/14'),
      dashboardLink('Powiadomienia', 'Alerty od kadry', 'i-lucide-bell', '/powiadomienia', 'text-amber-600', 'bg-amber-500/12')
    ]
  },
  {
    title: 'Trening i progres',
    items: [
      dashboardLink('Dziennik treningów', 'Wpisy po jednostkach', 'i-lucide-book-marked', '/dziennik', 'text-info', 'bg-info/12'),
      dashboardLink('Historia treningów', 'Oś czasu aktywności', 'i-lucide-timeline', '/athlete/timeline', 'text-primary', 'bg-primary/10'),
      dashboardLink('Plany treningowe', 'Cele i progres', 'i-lucide-clipboard-list', '/athlete/plany', 'text-success', 'bg-success/12'),
      dashboardLink('Regeneracja', 'Check-in snu i zmęczenia', 'i-lucide-heart-pulse', '/athlete/regeneracja', 'text-error', 'bg-error/10')
    ]
  },
  {
    title: 'Klub',
    items: [
      dashboardLink('Kalendarz klubu', 'Treningi i zawody', 'i-lucide-calendar-days', '/kalendarz', 'text-purple-600', 'bg-purple-500/12'),
      dashboardLink('Aktualności', 'Komunikaty klubu', 'i-lucide-newspaper', '/aktualnosci', 'text-warning', 'bg-warning/10'),
      dashboardLink('Wyzwania miesiąca', 'Ranking aktywności', 'i-lucide-flame', '/klub/wyzwania', 'text-orange-600', 'bg-orange-500/12'),
      dashboardLink('Ranking zawodników', 'Wyniki w klubie', 'i-lucide-trophy', '/zawodnicy', 'text-yellow-600', 'bg-yellow-500/12')
    ]
  },
  {
    title: 'Narzędzia i konto',
    items: [
      dashboardLink('Tor sztangi', 'Analiza nagrania', 'i-lucide-scan-line', '/athlete/analiza-sztangi', 'text-orange-600', 'bg-orange-500/12'),
      dashboardLink('Inne ćwiczenia', 'Przysiad, wycisk, martwy', 'i-lucide-bar-chart-3', '/athlete/exercises', 'text-warning', 'bg-warning/10'),
      dashboardLink('Proporcje (ratio)', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12'),
      dashboardLink('Ustawienia konta', 'E-mail, avatar, hasło', 'i-lucide-user-cog', '/profil', 'text-neutral-500', 'bg-muted/30')
    ]
  }
]

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

/** Wydarzenia z przypisań kadry — bez wpisów kategorii „trening” (stałe jednostki w klubie liczą się osobno w kalendarzu). */
const assignedCompetitionStartsCount = computed(() => {
  const entries = bundle.value?.calendarEntries ?? []
  const ids = new Set<string>()
  for (const e of entries) {
    const cat = (e.competition.category || '').toLowerCase()
    if (cat === 'training') continue
    ids.add(e.competition.id)
  }
  return ids.size
})

onMounted(() => {
  void refreshAttendanceSummary()
  void refreshPaymentStatus()
})

const pageHeading = computed(() => {
  if (isAthletePortalAsSuperAdminOnly.value) return 'Strefa zawodnika'
  return isAthleteRole.value ? 'Panel Zawodnika' : 'Profil konta'
})
const pageLead = computed(() => {
  if (isAthletePortalAsSuperAdminOnly.value) {
    return 'Superadmin ma dostęp do całej aplikacji — tutaj widzisz widok jak dla konta z rolą zawodnika (jeśli masz powiązany profil zawodnika w bazie).'
  }
  return isAthleteRole.value
    ? 'To jest Twój osobisty panel. Tutaj możesz śledzić swoje postępy, wyniki z zawodów oraz zarządzać swoim profilem.'
    : 'Ustawienia konta (e-mail, hasło, zdjęcie). Funkcje zawodnicze są dostępne tylko dla kont z rolą zawodnika.'
})

const PAY_HIDE_LS = 'slavia_hide_payment_reminder'
const hidePaymentReminderLocal = ref(false)
const ONBOARD_LS = 'slavia_onboarding_athlete_v1_done'
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
  () => syncPaymentReminderFromStorage()
)

onMounted(() => {
  syncPaymentReminderFromStorage()
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
const showOverduePaymentAlert = computed(() => {
  if (!isAthleteRole.value) return false
  const ps = paymentStatus.value
  if (!ps) return false
  // Show when payment is overdue (past the 10th) and not paid
  return !!(ps.is_overdue && !ps.is_paid)
})

// ─── [2001] "Mój Tydzień" widget ─────────────────────────────────────────
/** Today’s date string (YYYY-MM-DD) */
const todayStr = new Date().toISOString().slice(0, 10)

/** Nearest upcoming calendar entry (competition or event). */
const nearestCalendarEntry = computed(() => {
  const entries = bundle.value?.calendarEntries ?? []
  const future = entries
    .filter(e => {
      const d = e.competition?.date ?? ''
      return d >= todayStr
    })
    .sort((a, b) => (a.competition?.date ?? '').localeCompare(b.competition?.date ?? ''))
  return future[0] ?? null
})

/** Days until nearest event (0 = today). */
const daysUntilNearest = computed(() => {
  const d = nearestCalendarEntry.value?.competition?.date
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - new Date(todayStr).getTime()) / 86_400_000)
  return diff
})

/** Count of pending results (already computed above). */
const weekPendingCount = myPendingResultsCount

// ─── [2005] Season Goal ────────────────────────────────────────────────────
const GOAL_LS_KEY = 'slavia_season_goal_v1'

type GoalMode = 'total' | 'sinclair'
interface SeasonGoalData {
  mode: GoalMode
  target: number
}

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

/** Current best relevant to the goal mode. */
const goalCurrentValue = computed(() => {
  if (!athlete.value) return 0
  if (goalMode.value === 'total') {
    return athlete.value.total_kg ?? 0
  }
  // Sinclair requires bodyweight + total
  const bw = athlete.value.bodyweight ?? 0
  const total = athlete.value.total_kg ?? 0
  if (bw <= 0 || total <= 0) return 0
  // We use a synchronous approximation. Full async Sinclair is in the form.
  // A² coefficient approximation: Sinclair ≈ total * 1.0–1.35 depending on bw.
  // We just display total here and note it is approximate for the progress bar.
  return total
})

const goalProgress = computed(() => {
  if (!seasonGoal.value || seasonGoal.value.target <= 0) return 0
  const pct = Math.round((goalCurrentValue.value / seasonGoal.value.target) * 100)
  return Math.min(pct, 100)
})

onMounted(() => {
  loadGoalFromStorage()
})

// ─── [2013] Pre-start checklist ────────────────────────────────────────────
const CHECKLIST_LS_KEY = 'slavia_prestart_checklist_v1'

const defaultChecklist = [
  { id: 'singlet', label: 'Strjój startowy (singlet)', checked: false },
  { id: 'shoes', label: 'Buty ciężarowe', checked: false },
  { id: 'belt', label: 'Pas dźwigniowy', checked: false },
  { id: 'wraps', label: 'Opaski / kolanka', checked: false },
  { id: 'id_card', label: 'Dowód tożsamości', checked: false },
  { id: 'license', label: 'Licencja zawodnicza', checked: false },
  { id: 'weight', label: 'Sprawdzona waga (kategoria wagowa)', checked: false },
  { id: 'nutrition', label: 'Posiłki i nawodnienie na dzień', checked: false },
] as { id: string; label: string; checked: boolean }[]

const checklistItems = ref(defaultChecklist.map(i => ({ ...i })))

function loadChecklistFromStorage(forDate: string) {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(`${CHECKLIST_LS_KEY}_${forDate}`)
    if (raw) {
      const saved = JSON.parse(raw) as { id: string; checked: boolean }[]
      checklistItems.value = checklistItems.value.map(item => ({
        ...item,
        checked: saved.find(s => s.id === item.id)?.checked ?? false
      }))
    } else {
      checklistItems.value = defaultChecklist.map(i => ({ ...i }))
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
const preStartEntry = computed(() => {
  const entry = nearestCalendarEntry.value
  if (!entry) return null
  const d = daysUntilNearest.value
  if (d === null || d > 1) return null
  const cat = (entry.competition?.category ?? '').toLowerCase()
  if (cat === 'training') return null
  return entry
})

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
</script>

<template>
  <UContainer class="slavia-panel-page py-8 md:py-11 lg:py-14">
    <!-- Hero dashboard -->
    <div
      class="relative mb-8 overflow-hidden rounded-[1.75rem] border border-primary/20 bg-linear-to-br from-primary/[0.14] via-card to-card shadow-sm ring-1 ring-primary/10 sm:rounded-3xl"
    >
      <div class="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/25 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-20 -left-16 size-60 rounded-full bg-primary/10 blur-3xl" />
      <div class="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div class="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div class="relative shrink-0">
            <div class="absolute -inset-1 rounded-full bg-linear-to-br from-primary/40 to-primary/5 opacity-80 blur-sm" />
            <UAvatar
              :src="portalHeroAvatarSrc"
              :alt="welcomeName"
              size="xl"
              class="relative size-24 ring-2 ring-background shadow-lg sm:size-28"
            />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                <UIcon
                  name="i-lucide-dumbbell"
                  class="size-3.5"
                />
                {{ pageHeading }}
              </span>
              <UBadge
                v-if="auth.rolesDisplayShort"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ auth.rolesDisplayShort }}
              </UBadge>
            </div>
            <h1 class="mt-3 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
              Cześć, {{ welcomeName }}
            </h1>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {{ pageLead }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <UAlert
      v-if="showPre10PaymentBanner && paymentStatus"
      class="mt-6"
      color="warning"
      variant="subtle"
      title="Zbliża się termin składki (10. dzień miesiąca)"
      :description="`Nie masz jeszcze zatwierdzonej wpłaty za ${paymentStatus.month}. Możesz zgłosić przelew w sekcji składki — przypomnienie można wyłączyć w /profil (tylko ta przeglądarka).`"
    />

    <UModal
      v-model:open="showOnboarding"
      title="Witaj w panelu zawodnika"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #content>
        <div class="space-y-4 p-4 sm:p-5">
          <ol class="list-decimal space-y-3 ps-5 text-sm text-muted">
            <li>
              <strong class="text-highlighted">Składka</strong> — zgłoś przelew do 10. dnia miesiąca; przy przelewie stałym system tworzy wpisy automatycznie.
            </li>
            <li>
              <strong class="text-highlighted">Kalendarz</strong> — sprawdzaj przypisane starty i treningi klubowe.
            </li>
            <li>
              <strong class="text-highlighted">Wynik</strong> — możesz zgłosić start lub trening; kadra zatwierdza wpis w systemie.
            </li>
          </ol>
          <div class="flex justify-end border-t border-default/60 pt-3">
            <UButton @click="dismissOnboarding">
              Rozumiem
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mt-8 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
    >
      <DashboardKpiCard
        label="Składka (bieżący miesiąc)"
        :value="paymentKpi.value"
        icon="i-lucide-banknote"
        :tone="paymentKpi.tone"
        :hint="paymentKpi.hint"
        to="/athlete/skladki"
      />
      <DashboardKpiCard
        label="Frekwencja"
        :value="attendanceSummary ? `${attendanceSummary.attendance_percent}%` : '—'"
        icon="i-lucide-user-check"
        :tone="attendanceSummary ? 'primary' : 'info'"
        :hint="attendanceSummary ? `${attendanceSummary.present_count} obecności · ${attendanceSummary.absent_count} nieob.` : null"
        to="/attendance"
      />
      <DashboardKpiCard
        label="Wyniki (oczekujące)"
        :value="myPendingResultsCount"
        icon="i-lucide-clipboard-clock"
        :tone="myPendingResultsCount ? 'warning' : 'info'"
        :to="{ path: '/athlete', hash: '#ostatnie-zgloszenia' }"
      />
      <ClubVotingWidget />
    </div>

    <!-- [2024] Overdue payment alert — prominent full-width banner -->
    <div
      v-if="showOverduePaymentAlert && paymentStatus"
      class="mt-6"
    >
      <div class="relative overflow-hidden rounded-2xl border-2 border-error/60 bg-error/8 px-5 py-4 shadow-md shadow-error/10 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div class="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-error/15 blur-3xl" />
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/20 text-error ring-1 ring-error/30 shadow-inner mt-0.5">
            <UIcon name="i-lucide-alert-triangle" class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-black text-error sm:text-base">
              Zaległa składka — {{ paymentStatus.month }}
            </p>
            <p class="mt-0.5 text-sm text-muted">
              Nie masz zatwierdzonej wpłaty za ten miesiąc. Termin płatności minął 10. dnia miesiąca.
            </p>
          </div>
        </div>
        <UButton
          to="/athlete/skladki"
          color="error"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
          class="mt-3 shrink-0 sm:mt-0"
        >
          Zgłoś płatność
        </UButton>
      </div>
    </div>

    <!-- [2001] "Mój Tydzień" widget -->
    <div v-if="auth.canAccessAthletePortal && athlete && isAthleteRole" class="mt-8">
      <div class="mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-calendar-days" class="size-5 text-primary" />
        <h2 class="text-xl font-black tracking-tight text-highlighted">Mój Tydzień</h2>
        <UBadge variant="soft" color="primary" size="xs" class="uppercase tracking-widest ml-1">Szybki podgląd</UBadge>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Najbliższy start -->
        <div class="flex flex-col gap-2 rounded-2xl border border-default/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <UIcon name="i-lucide-flag" class="size-3.5" />
            Najbliższy start
          </div>
          <template v-if="nearestCalendarEntry">
            <p class="text-base font-black text-highlighted leading-tight">
              {{ nearestCalendarEntry.competition?.title ?? '—' }}
            </p>
            <p class="text-sm text-muted">{{ nearestCalendarEntry.competition?.date?.slice(0,10) ?? '—' }}</p>
            <UBadge
              :color="daysUntilNearest === 0 ? 'error' : daysUntilNearest === 1 ? 'warning' : 'primary'"
              variant="soft"
              size="sm"
              class="w-fit"
            >
              {{ daysUntilNearest === 0 ? 'Dzisiaj!' : daysUntilNearest === 1 ? 'Jutro!' : `Za ${daysUntilNearest} dni` }}
            </UBadge>
          </template>
          <p v-else class="text-sm text-muted">Brak przypisanych startów.</p>
          <UButton to="/athlete/kalendarz" size="xs" variant="ghost" trailing-icon="i-lucide-arrow-right" class="mt-auto w-fit px-0">
            Kalendarz
          </UButton>
        </div>

        <!-- Status składki -->
        <div class="flex flex-col gap-2 rounded-2xl border border-default/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <UIcon name="i-lucide-banknote" class="size-3.5" />
            Składka
          </div>
          <p class="text-base font-black text-highlighted">{{ paymentKpi.value }}</p>
          <p class="text-sm text-muted">{{ paymentStatus?.month ?? new Date().toISOString().slice(0,7) }}</p>
          <UBadge :color="paymentKpi.tone" variant="soft" size="sm" class="w-fit">
            {{ paymentKpi.hint ?? '—' }}
          </UBadge>
          <UButton to="/athlete/skladki" size="xs" variant="ghost" trailing-icon="i-lucide-arrow-right" class="mt-auto w-fit px-0">
            Szczegóły
          </UButton>
        </div>

        <!-- Wyniki oczekujące -->
        <div class="flex flex-col gap-2 rounded-2xl border border-default/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <UIcon name="i-lucide-clipboard-clock" class="size-3.5" />
            Oczekujące wyniki
          </div>
          <p class="text-4xl font-black tabular-nums" :class="weekPendingCount > 0 ? 'text-warning' : 'text-highlighted'">
            {{ weekPendingCount }}
          </p>
          <p class="text-sm text-muted">Zgłoszeń czeka na zatwierdzenie kadry.</p>
          <UButton :to="{ path: '/athlete', hash: '#ostatnie-zgloszenia' }" size="xs" variant="ghost" trailing-icon="i-lucide-arrow-right" class="mt-auto w-fit px-0">
            Historia
          </UButton>
        </div>

        <!-- Czat z trenerem -->
        <div class="flex flex-col gap-2 rounded-2xl border border-default/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <UIcon name="i-lucide-messages-square" class="size-3.5" />
            Kontakt z trenerem
          </div>
          <p class="text-base font-black text-highlighted">Napisz wiadomość</p>
          <p class="text-sm text-muted">Pytania, dyspozycja, kontuzja — trener odpowie w czacie 1:1.</p>
          <UButton to="/chat" color="info" size="xs" variant="soft" trailing-icon="i-lucide-arrow-right" class="mt-auto w-fit">
            Otwórz czat
          </UButton>
        </div>
      </div>
    </div>

    <!-- [2013] Pre-start checklist (shows 48h before competition) -->
    <div v-if="preStartEntry" class="mt-6">
      <div class="relative overflow-hidden rounded-2xl border border-warning/50 bg-warning/8 p-5 shadow-sm">
        <div class="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-warning/20 blur-3xl" />
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-square" class="size-5 text-warning" />
            <h2 class="text-lg font-black text-highlighted">Lista kontrolna przed startem</h2>
            <UBadge color="warning" variant="soft" size="sm">
              {{ daysUntilNearest === 0 ? 'Dzisiaj!' : 'Jutro!' }}
            </UBadge>
          </div>
          <div class="text-sm text-muted font-medium">
            {{ checklistDoneCount }} / {{ checklistTotal }} gotowe
          </div>
        </div>
        <p class="mb-4 text-sm text-muted">
          <span class="font-semibold text-highlighted">{{ preStartEntry.competition?.title }}</span>
          · {{ preStartEntry.competition?.date?.slice(0,10) }}
          · {{ preStartEntry.competition?.location ?? '—' }}
        </p>
        <!-- Progress bar -->
        <div class="mb-4 h-2 w-full overflow-hidden rounded-full bg-default/40">
          <div
            class="h-full rounded-full bg-warning transition-all duration-500"
            :style="{ width: `${Math.round((checklistDoneCount / checklistTotal) * 100)}%` }"
          />
        </div>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="item in checklistItems"
            :key="item.id"
            class="flex cursor-pointer items-center gap-3 rounded-xl border border-default/60 bg-card px-3 py-2.5 transition-colors hover:border-warning/40 hover:bg-warning/5"
            @click="toggleChecklistItem(item.id)"
          >
            <div
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all"
              :class="item.checked ? 'border-warning bg-warning/20 text-warning' : 'border-default/60'"
            >
              <UIcon v-if="item.checked" name="i-lucide-check" class="size-3" />
            </div>
            <span class="text-sm" :class="item.checked ? 'text-muted line-through' : 'text-highlighted'">
              {{ item.label }}
            </span>
          </label>
        </div>
        <p v-if="checklistDoneCount === checklistTotal" class="mt-4 text-center text-sm font-bold text-warning">
          ✓ Wszystko gotowe — powodzenia na starcie!
        </p>
      </div>
    </div>

    <!-- [2005] Season goal with progress bar -->
    <div v-if="auth.canAccessAthletePortal && athlete && isAthleteRole" class="mt-6">
      <div class="rounded-2xl border border-default/70 bg-card p-5 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-target" class="size-5 text-success" />
            <h2 class="text-lg font-black text-highlighted">Cel sezonu</h2>
          </div>
          <div class="flex gap-2">
            <UButton
              v-if="seasonGoal && !goalEditing"
              size="xs"
              variant="ghost"
              icon="i-lucide-pencil"
              @click="goalEditing = true"
            >Edytuj</UButton>
            <UButton
              v-if="seasonGoal"
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              @click="clearGoal"
            >Usuń</UButton>
          </div>
        </div>

        <!-- Display mode -->
        <template v-if="seasonGoal && !goalEditing">
          <div class="mb-2 flex items-end justify-between gap-2">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-muted">
                {{ seasonGoal.mode === 'total' ? 'Total (dwubój)' : 'Sinclair (szacunkowy)' }}
              </p>
              <div class="mt-1 flex items-end gap-1.5">
                <span class="text-4xl font-black tabular-nums text-highlighted">{{ goalCurrentValue }}</span>
                <span class="mb-1 text-lg font-bold text-muted">&nbsp;/&nbsp;{{ seasonGoal.target }} kg</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-3xl font-black tabular-nums" :class="goalProgress >= 100 ? 'text-success' : 'text-primary'">
                {{ goalProgress }}%
              </span>
            </div>
          </div>
          <div class="h-3 w-full overflow-hidden rounded-full bg-default/40">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="goalProgress >= 100 ? 'bg-success' : 'bg-primary'"
              :style="{ width: `${goalProgress}%` }"
            />
          </div>
          <p v-if="goalProgress >= 100" class="mt-2 text-sm font-bold text-success">
            🎉 Cel osiągnięty! Czas podbić poprzeczkę.
          </p>
          <p v-else-if="goalCurrentValue === 0" class="mt-2 text-sm text-muted">
            Brak zatwierdzonego wyniku do porównania. Zgłoś wynik, by zobaczyć postęp.
          </p>
          <p v-else class="mt-2 text-sm text-muted">
            Zostało <span class="font-bold text-highlighted">{{ seasonGoal.target - goalCurrentValue }} kg</span> do celu.
          </p>
        </template>

        <!-- Edit / create mode -->
        <template v-else>
          <p class="mb-4 text-sm text-muted">
            Ustaw cel na ten sezon — system pokaże Twój postęp na podstawie najlepszego zatwierdzonego wyniku.
          </p>
          <div class="flex flex-wrap items-end gap-3">
            <UFormField label="Typ celu">
              <USelect
                v-model="goalMode"
                :items="[{ label: 'Total (dwubój kg)', value: 'total' }, { label: 'Sinclair (szacunkowy)', value: 'sinclair' }]"
                class="w-48"
              />
            </UFormField>
            <UFormField label="Cel (kg)">
              <UInputNumber
                v-model="goalTarget"
                :min="1"
                :step="1"
                placeholder="np. 250"
                class="w-32"
              />
            </UFormField>
            <UButton color="success" icon="i-lucide-check" @click="saveGoal">Zapisz</UButton>
            <UButton v-if="seasonGoal" variant="ghost" color="neutral" @click="goalEditing = false">Anuluj</UButton>
          </div>
        </template>
      </div>
    </div>

    <!-- Pobierz aplikację mobile -->
    <div v-if="latestRelease" class="mt-8">
      <div
        class="group relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-linear-to-r from-primary/10 to-indigo-500/10 p-5 shadow-sm sm:p-6"
      >
        <div class="absolute -right-12 -top-12 size-40 rounded-full bg-primary/20 blur-3xl transition-all group-hover:bg-primary/30" />
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/30 shadow-inner">
              <UIcon name="i-lucide-smartphone" class="size-7" />
            </div>
            <div class="min-w-0">
              <h3 class="text-lg font-black text-highlighted tracking-tight">Dostępna aplikacja mobilna</h3>
              <p class="text-sm text-muted">Śledź swoje wyniki i obecność bezpośrednio w telefonie.</p>
              <div class="mt-1 flex items-center gap-2">
                <UBadge size="sm" variant="soft" color="primary" class="font-bold font-mono">{{ latestRelease.version }}</UBadge>
                <span class="text-[10px] text-muted/60 uppercase font-bold tracking-widest">Wersja Android (.apk)</span>
              </div>
            </div>
          </div>
          <UButton
            :to="latestRelease.download_url"
            target="_blank"
            size="xl"
            color="primary"
            trailing-icon="i-lucide-download"
            class="min-h-12 w-full justify-center sm:w-auto shadow-lg shadow-primary/20 transition-transform active:scale-95"
          >
            Pobierz teraz
          </UButton>
        </div>
      </div>
    </div>

    <!-- Osiągnięcia (Badges) -->
    <div v-if="auth.canAccessAthletePortal && athlete" class="mt-8">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="text-xl font-bold tracking-tight text-highlighted">
          Moje Osiągnięcia
        </h2>
        <UBadge variant="soft" color="primary" size="sm" class="uppercase tracking-widest">
          Badges
        </UBadge>
      </div>
      <AthleteBadges :athlete="athlete" :present-count="attendanceSummary?.present_count || 0" />
    </div>

    <div v-if="auth.canAccessAthletePortal && athlete" class="mt-10 mb-10 space-y-8">
      <div v-for="g in athleteModuleGroups" :key="g.title">
        <div class="mb-3 flex items-end justify-between gap-3">
          <h2 class="text-xl font-semibold text-highlighted">
            {{ g.title }}
          </h2>
        </div>
        <div class="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardModuleCard
            v-for="link in g.items"
            :key="link.to"
            :title="link.title"
            :description="link.description"
            :icon="link.icon"
            :to="link.to"
            :tone="toneFromIconBg(link.bg)"
            :icon-wrapper-class="`${link.bg} ${link.color}`"
          />
        </div>
      </div>
    </div>

    <!-- Licznik startów (statystyki PB są wyżej w hero — bez duplikatu kart) -->
    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mb-10"
    >
      <UCard
        class="overflow-hidden border-primary/25 bg-linear-to-br from-primary/11 via-card to-card"
        :ui="{ body: 'sm:p-6 p-5' }"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-inner ring-1 ring-primary/20">
              <UIcon
                name="i-lucide-calendar-check-2"
                class="size-7"
              />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Przypisane starty
              </p>
              <p class="mt-1 text-5xl font-black tabular-nums tracking-tight text-highlighted">
                {{ assignedCompetitionStartsCount }}
              </p>
              <p class="mt-3 max-w-md text-xs leading-relaxed text-muted sm:text-sm">
                Zawody i wydarzenia przypisane przez kadrę. Stałe treningi klubowe są osobno w kalendarzu.
              </p>
            </div>
          </div>
          <UButton
            to="/athlete/kalendarz"
            trailing-icon="i-lucide-arrow-right"
            color="primary"
            size="lg"
            class="shrink-0 self-start lg:self-center"
          >
            Harmonogram
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Płatność składki (tylko rola Athlete) -->
    <div
      v-if="auth.canAccessAthletePortal && athlete && isAthleteRole"
      id="skladka-klubowa"
      class="mb-10"
    >
      <UAlert
        v-if="paymentStatus && paymentStatus.is_overdue && !paymentStatus.is_paid"
        icon="i-lucide-alert-triangle"
        title="Brak opłaconej składki"
        :description="`Nie masz zatwierdzonej płatności za ${paymentStatus.month}. Termin płatności to 10.${paymentStatus.month.slice(5,7)}.${paymentStatus.month.slice(0,4)}.`"
        color="error"
        variant="subtle"
        class="mb-4 rounded-2xl"
      />

      <UCard class="rounded-2xl border-default/70">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-black text-highlighted">Składka klubowa</h2>
          <UBadge
            v-if="membershipMonthBadge"
            :color="membershipMonthBadge.color"
            variant="subtle"
          >
            {{ membershipMonthBadge.label }}
          </UBadge>
        </div>

        <p class="mt-2 text-sm text-muted">
          Zgłoś płatność — kadra zatwierdzi ją w systemie. Termin płatności: <span class="font-bold">10</span> każdego miesiąca.
        </p>

        <div class="slavia-form-grid mt-5 grid-cols-1 sm:grid-cols-3">
          <UFormField label="Miesiąc">
            <UInput
              v-model="paymentForm.month"
              type="month"
              size="lg"
              class="w-full"
              @change="refreshPaymentStatus"
            />
          </UFormField>
          <UFormField label="Kwota (PLN)" description="Opcjonalnie">
            <UInputNumber
              v-model="paymentForm.amount_pln"
              :min="0"
              :step="1"
              size="lg"
              class="w-full"
              placeholder="np. 80"
            />
          </UFormField>
          <UFormField label="Opis" description="Opcjonalnie">
            <UInput
              v-model="paymentForm.note"
              size="lg"
              class="w-full"
              placeholder="np. składka maj / przelew"
            />
          </UFormField>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <UButton
            color="primary"
            variant="soft"
            size="lg"
            icon="i-lucide-banknote"
            @click="submitMembershipPayment"
          >
            Zgłoś płatność
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            size="lg"
            icon="i-lucide-refresh-cw"
            @click="refreshPaymentStatus"
          >
            Odśwież status
          </UButton>
          <p
            v-if="paymentStatus"
            class="text-xs text-muted"
          >
            Termin: {{ paymentStatus.due_date }}
          </p>
        </div>
      </UCard>
    </div>

    <div
      v-else-if="auth.canAccessAthletePortal && !athlete"
      class="mb-10"
    >
      <UAlert
        icon="i-lucide-info"
        title="Brak powiązanego profilu"
        description="Twoje konto nie jest jeszcze powiązane z rekordem zawodnika. Skontaktuj się z administratorem, aby połączyć swoje konto z danymi startowymi."
        color="warning"
        variant="subtle"
        class="rounded-2xl"
      />
    </div>

    <div class="grid gap-10 xl:grid-cols-12 xl:gap-8">
      <!-- Lewa kolumna: formularze -->
      <div class="space-y-10 xl:col-span-7">
    <section
      v-if="auth.canAccessAthletePortal && athlete"
    >
      <h2 class="mb-5 flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
          <UIcon
            name="i-lucide-flag"
            class="size-[1.35rem]"
          />
        </span>
        <span class="text-lg font-black tracking-tight text-highlighted sm:text-xl">Zgłoś wynik do weryfikacji</span>
      </h2>
      <div class="slavia-form-panel shadow-md">
        <div class="slavia-form-panel__header">
          <div class="slavia-form-panel__title">
            <span class="slavia-form-panel__icon">
              <UIcon
                name="i-lucide-dumbbell"
                class="size-4"
              />
            </span>
            Wynik startowy
          </div>
          <p class="slavia-form-panel__desc">
            Wybierz typ wpisu — <strong>zawody</strong> liczą się do PB, rankingu i wykresu na karcie zawodnika;
            <strong>trening</strong> jest widoczny tylko po zalogowaniu i nie wpływa na publiczne rekordy.
            Możesz zgłosić sam dwubój, same ćwiczenia siłowe albo oba naraz — brakujące rwanie/podrzut uzupełniamy wartościami z Twojego profilu w bazie.
            Po akceptacji trenera wpis wejdzie do kart i rankingów.
          </p>
        </div>
        <div class="slavia-form-panel__body">
          <div class="slavia-form-grid grid-cols-1 sm:max-w-md">
            <UFormField label="Typ wpisu" description="Zawody trafiają na publiczną listę">
              <select
                v-model="resultForm.kind"
                class="slavia-select w-full py-3 text-[15px]"
              >
                <option value="competition">Zawody (publiczne)</option>
                <option value="training">Trening (po zalogowaniu)</option>
              </select>
            </UFormField>
          </div>
          <div
            v-if="resultForm.kind === 'competition'"
            class="slavia-form-grid grid-cols-1 sm:max-w-2xl"
          >
            <UFormField
              label="Miejsce zawodów"
              description="Opcjonalnie"
            >
              <UInput
                v-model="resultForm.location"
                placeholder="np. Ruda Śląska, Mistrzostwa Śląska"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="slavia-form-grid grid-cols-1 border-t border-default/40 pt-5 sm:grid-cols-2">
            <UFormField label="Rwanie (kg)">
              <UInputNumber
                v-model="resultForm.snatch"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Podrzut (kg)">
              <UInputNumber
                v-model="resultForm.clean_and_jerk"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Data">
              <UInput
                v-model="resultForm.date"
                type="date"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Suma (dwubój)">
              <UInputNumber
                :value="resultForm.total"
                size="lg"
                class="w-full"
                disabled
              />
            </UFormField>
            <UFormField label="Waga ciała (kg)" description="Do Sinclaira">
              <div class="flex gap-2">
                <UInputNumber
                  v-model="resultForm.bodyweight"
                  :min="0"
                  :step="0.1"
                  size="lg"
                  class="flex-1"
                  placeholder="np. 85.5"
                />
                <UButton
                  v-if="athlete?.bodyweight"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-user"
                  @click="useProfileWeight"
                >
                  Z profilu
                </UButton>
              </div>
            </UFormField>
            <UFormField label="Punkty Sinclair" description="Wyliczane na żywo">
              <div class="flex h-[44px] items-center rounded-lg border border-default bg-muted/20 px-4 font-black text-primary">
                {{ sinclairValue.toFixed(2) }} pkt
              </div>
            </UFormField>
            <div class="flex flex-wrap gap-2 sm:col-span-2">
              <UButton
                color="primary"
                variant="soft"
                icon="i-lucide-calculator"
                @click="applySinclairCalcAndInsert"
              >
                Oblicz i wstaw
              </UButton>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-bookmark"
                @click="saveResultFormAsSinclairScenario"
              >
                Zapisz jako scenariusz
              </UButton>
              <UButton
                to="/kalkulator-sinclair"
                color="neutral"
                variant="ghost"
                icon="i-lucide-external-link"
              >
                Kalkulator Sinclair
              </UButton>
            </div>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-5">
            <UButton
              color="primary"
              variant="soft"
              size="lg"
              @click="submitResult"
            >
              Zgłoś wynik
            </UButton>
          </div>
        </div>
      </div>
    </section>
      </div>

      <!-- Prawa kolumna: historia + skróty klubu -->
      <div class="space-y-10 xl:col-span-5">
      <!-- Ostatnie wyniki -->
      <section v-if="auth.canAccessAthletePortal">
        <h2 class="mb-5 flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-600 ring-1 ring-yellow-500/25 dark:text-yellow-400">
            <UIcon
              name="i-lucide-trophy"
              class="size-[1.35rem]"
            />
          </span>
          <span id="ostatnie-zgloszenia" class="text-lg font-black tracking-tight text-highlighted sm:text-xl">Ostatnie zgłoszenia</span>
        </h2>
        <UCard
          v-if="recentResults && recentResults.length > 0"
          class="overflow-hidden rounded-2xl ring-1 ring-default/40"
          :ui="{ body: 'p-0' }"
        >
          <table class="w-full text-sm">
            <thead class="border-b border-default/80 bg-muted/40">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-muted">
                  Data
                </th>
                <th class="px-4 py-3 text-left font-semibold text-muted">
                  Typ
                </th>
                <th class="px-4 py-3 text-center font-semibold text-muted">
                  Suma
                </th>
                <th class="hidden sm:table-cell px-4 py-3 text-left font-semibold text-muted">
                  Miejsce
                </th>
                <th class="px-4 py-3 text-center font-semibold text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="r in recentResults"
                :key="r.id"
                class="hover:bg-muted/20"
              >
                <td class="px-4 py-3 text-muted">
                  {{ r.date }}
                </td>
                <td class="px-4 py-3">
                  <UBadge
                    :color="(r.kind ?? 'competition') === 'training' ? 'info' : 'primary'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ (r.kind ?? 'competition') === 'training' ? 'Trening' : 'Zawody' }}
                  </UBadge>
                </td>
                <td class="px-4 py-3 text-center font-bold">
                  {{ r.total }} kg
                </td>
                <td class="hidden sm:table-cell px-4 py-3 text-muted">
                  <span v-if="r.location">{{ r.location }}</span>
                  <span v-else class="text-muted/60">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <UBadge
                    :color="r.status === 'Approved' ? 'success' : (r.status === 'Rejected' ? 'error' : 'warning')"
                    variant="subtle"
                    size="sm"
                  >
                    {{ r.status === 'Approved' ? 'Zatwierdzony' : (r.status === 'Rejected' ? 'Odrzucony' : 'Oczekujący') }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </UCard>
        <div
          v-else
          class="rounded-2xl border border-dashed border-default/70 bg-muted/20 px-6 py-12 text-center text-sm text-muted"
        >
          Nie masz jeszcze zgłoszonych wyników — po wysłaniu wpisu pojawią się tutaj ze statusem weryfikacji.
        </div>
      </section>

      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Athlete, CompetitionResult, MobileReleaseInfo, MyCalendarEntry, PaymentStatusResponse } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'
import {
  athletePaymentKpiFromStatus,
  showPre10PaymentAthleteReminder
} from '~/utils/paymentSemantics'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import { dashboardLink, type DashboardModuleLink } from '~/utils/dashboardLink'

definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const terms = useSlaviaCopy()
const route = useRoute()
const { accountSettingsPath } = useRoleDashboardNav()
const { isAccountView } = useDashboardAccountView()

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

const { data: bundle } = await useAsyncData(
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
const myPendingResultsCount = computed(() => results.value.filter(r => r.status === 'Pending').length)
const attendanceSummary = ref<AttendanceSummary | null>(null)
const paymentStatus = ref<PaymentStatusResponse | null>(null)

const paymentMonth = ref(new Date().toISOString().slice(0, 7))

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
  const q = paymentMonth.value ? `?month=${encodeURIComponent(paymentMonth.value)}` : ''
  paymentStatus.value = await apiFetch<PaymentStatusResponse>(`${apiRoutes.payments.myStatus}${q}`).catch(() => null)
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

const athleteModuleGroups: { title: string, items: DashboardModuleLink[] }[] = [
  {
    title: 'Najczęstsze',
    items: [
      dashboardLink('Moje starty', 'Zgłoś wynik i historia', 'i-lucide-trophy', '/athlete/wyniki', 'text-amber-600', 'bg-amber-500/12'),
      dashboardLink('Składka klubowa', 'Zgłoś płatność i status', 'i-lucide-banknote', '/athlete/skladki', 'text-primary', 'bg-primary/15'),
      dashboardLink('Kalendarz startów', 'Przypisania od kadry', 'i-lucide-calendar-heart', '/athlete/kalendarz', 'text-primary', 'bg-primary/15'),
      dashboardLink('Obecność i QR', 'Kalendarz, skaner, zgłoszenia', 'i-lucide-user-check', '/attendance', 'text-primary', 'bg-primary/12'),
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
    title: 'Klub i narzędzia',
    items: [
      dashboardLink('Tor sztangi', 'Analiza nagrania', 'i-lucide-scan-line', '/athlete/analiza-sztangi', 'text-orange-600', 'bg-orange-500/12'),
      dashboardLink('Inne ćwiczenia', 'Przysiad, wycisk, martwy', 'i-lucide-bar-chart-3', '/athlete/exercises', 'text-warning', 'bg-warning/10'),
      dashboardLink('Proporcje (ratio)', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12'),
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
  () => {
    syncPaymentReminderFromStorage()
  }
)

onMounted(() => {
  syncPaymentReminderFromStorage()
  void refreshAttendanceSummary()
  void refreshPaymentStatus()
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
  <PanelPageLayout padding="compact">
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
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
        <div class="grid w-full shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:w-52 lg:grid-cols-1">
          <UButton
            :to="accountSettingsPath"
            variant="outline"
            color="neutral"
            size="lg"
            block
            icon="i-lucide-user-cog"
            class="h-11 justify-center"
          >
            Ustawienia
          </UButton>
          <UButton
            to="/athlete/wyniki"
            variant="soft"
            color="primary"
            size="lg"
            block
            icon="i-lucide-trophy"
            class="h-11 justify-center"
          >
            Moje starty
          </UButton>
          <UButton
            to="/athlete/skladki"
            variant="soft"
            color="primary"
            size="lg"
            block
            icon="i-lucide-banknote"
            class="h-11 justify-center"
          >
            Składka
          </UButton>
        </div>
      </div>
    </div>

    <PanelDashboardHub class="!mb-6" />

    <UAlert
      v-if="showPre10PaymentBanner && paymentStatus"
      class="mt-6"
      color="warning"
      variant="subtle"
      title="Zbliża się termin składki (10. dzień miesiąca)"
      :description="`Nie masz jeszcze zatwierdzonej wpłaty za ${paymentStatus.month}. Zgłoś przelew w składkach — przypomnienie wyłączysz w ustawieniach konta na dole panelu.`"
    />

    <UModal
      v-model:open="showOnboarding"
      title="Witaj w panelu zawodnika"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
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
        to="/athlete/wyniki"
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

    <!-- [2013] Pre-start checklist (shows 48h before competition) -->
    <PanelCollapsibleSection
      v-if="preStartEntry"
      class="mt-6"
      title="Lista przed startem"
      icon="i-lucide-check-square"
      :badge="daysUntilNearest === 0 ? 'Dzisiaj' : 'Jutro'"
      :default-open="true"
    >
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
    </PanelCollapsibleSection>

    <!-- [2005] Season goal with progress bar -->
    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete && isAthleteRole"
      class="mt-6"
      title="Cel sezonu"
      icon="i-lucide-target"
      badge="Opcjonalnie"
    >
      <div class="rounded-xl border border-default/50 bg-muted/10 p-4 sm:p-5">
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
    </PanelCollapsibleSection>

    <div v-if="auth.canAccessAthletePortal && athlete" class="mt-8 mb-6 space-y-2">
      <PanelModuleGrid
        v-for="g in athleteModuleGroups"
        :key="g.title"
        :title="g.title"
        :items="g.items"
        :tone-from-bg="toneFromIconBg"
      />
    </div>

    <!-- Pobierz aplikację mobile -->
    <PanelCollapsibleSection
      v-if="latestRelease"
      class="mt-6"
      title="Aplikacja mobilna"
      icon="i-lucide-smartphone"
      :badge="latestRelease.version"
    >
      <div
        class="group relative overflow-hidden rounded-xl border border-primary/20 bg-linear-to-r from-primary/10 to-indigo-500/10 p-5"
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
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      class="mb-8"
      title="Osiągnięcia"
      icon="i-lucide-award"
      badge="Badges"
    >
      <AthleteBadges :athlete="athlete" :present-count="attendanceSummary?.present_count || 0" />
    </PanelCollapsibleSection>

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

    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mb-8 overflow-hidden rounded-2xl border border-amber-500/25 bg-linear-to-r from-amber-500/10 via-card to-card p-5 sm:p-6"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Wyniki startowe</p>
          <h2 class="mt-1 text-xl font-black text-highlighted">Zgłoś wynik z zawodów lub treningu</h2>
          <p class="mt-2 text-sm text-muted">
            Formularz i pełna historia zgłoszeń — na osobnej podstronie panelu.
            <span v-if="myPendingResultsCount > 0" class="font-semibold text-warning">
              {{ myPendingResultsCount }} oczekuje na kadrę.
            </span>
          </p>
        </div>
        <UButton to="/athlete/wyniki" size="lg" color="primary" trailing-icon="i-lucide-arrow-right" class="shrink-0">
          Moje starty
        </UButton>
      </div>
    </div>

    </template>
  </PanelPageLayout>
</template>

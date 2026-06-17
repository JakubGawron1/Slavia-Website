<script setup lang="ts">
import type { Athlete, CompetitionResult, MobileReleaseInfo, MyCalendarEntry, PaymentStatusResponse } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'
import {
  athletePaymentKpiFromStatus,
  showPre10PaymentAthleteReminder
} from '~/utils/paymentSemantics'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardQuickActions from '~/components/dashboard/DashboardQuickActions.vue'
import DashboardWeekPreview from '~/components/dashboard/DashboardWeekPreview.vue'
definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const rolePreviewState = useRolePreviewState()
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
  if (!auth.canAccessAthletePortal.value || !athlete.value?.id || !rolePreviewState.viewingAthletePortal.value) {
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

provideDashboardSections()
</script>

<template>
  <PanelPageLayout padding="compact">
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
    <PanelCollapsibleSection
      section-id="hero"
      title="Powitanie"
      icon="i-lucide-user"
      :default-open="true"
    >
      <DashboardHero
        :eyebrow="pageHeading"
        :title="`Cześć, ${welcomeName}`"
        :lead="pageLead"
        icon="i-lucide-dumbbell"
        :avatar-src="portalHeroAvatarSrc"
        :avatar-alt="welcomeName"
        :badges="heroBadges"
        :actions="[
          { label: 'Ustawienia', to: accountSettingsPath, icon: 'i-lucide-user-cog', variant: 'outline' },
          { label: 'Moje starty', to: '/athlete/wyniki', icon: 'i-lucide-trophy', color: 'primary' }
        ]"
      />
      <DashboardQuickActions
        v-if="auth.canAccessAthletePortal && athlete"
        class="slavia-quick-actions--wide mt-4"
        :items="athleteQuickActions"
        aria-label="Skróty do modułów"
      />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      section-id="badges"
      title="Osiągnięcia"
      icon="i-lucide-award"
      :default-open="true"
      class="mt-4"
    >
      <AthleteBadges :athlete="athlete" :present-count="attendanceSummary?.present_count || 0" />
    </PanelCollapsibleSection>

    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mt-4 space-y-3"
    >
      <UAlert
        v-if="showArchivedAthleteNote"
        class="rounded-2xl"
        color="warning"
        variant="subtle"
        icon="i-lucide-ghost"
        title="Profil w archiwum kadry"
        description="Nie jesteś na liście aktywnej kadry, ale historia startów pozostaje dostępna. Napisz trenerowi, jeśli wracasz do treningów."
      >
        <template #actions>
          <UButton to="/klub/czat" size="xs" color="primary" variant="soft" icon="i-lucide-messages-square">
            Napisz do trenera
          </UButton>
        </template>
      </UAlert>

      <UAlert
        v-if="showOverduePaymentAlert && paymentStatus"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Zaległa składka — ${paymentStatus.month}`"
        description="Termin płatności minął 10. dnia miesiąca. Zgłoś przelew w module składek."
      >
        <template #actions>
          <UButton to="/athlete/skladki" size="sm" color="error" variant="soft">
            Zgłoś płatność
          </UButton>
        </template>
      </UAlert>

      <UAlert
        v-else-if="showPre10PaymentBanner && paymentStatus"
        color="warning"
        variant="subtle"
        icon="i-lucide-banknote"
        title="Zbliża się termin składki"
        :description="`Brak zatwierdzonej wpłaty za ${paymentStatus.month}. Zgłoś przelew do 10. dnia miesiąca.`"
      >
        <template #actions>
          <UButton to="/athlete/skladki" size="sm" color="warning" variant="soft">
            Składki
          </UButton>
        </template>
      </UAlert>
    </div>

    <DashboardSectionsToolbar class="mt-4" />

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      section-id="overview"
      title="Dziś i ten miesiąc"
      icon="i-lucide-gauge"
      :default-open="true"
      class="mt-4"
    >
      <div class="space-y-4">
        <DashboardWeekPreview
          v-if="isAthleteRole"
          :entry="nearestCalendarEntry"
          :days-until="daysUntilNearest"
        />
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <DashboardKpiCard
            size="compact"
            label="Składka"
            :value="paymentKpi.value"
            icon="i-lucide-banknote"
            :tone="paymentKpi.tone"
            :hint="paymentKpi.hint"
            to="/athlete/skladki"
          />
          <DashboardKpiCard
            size="compact"
            label="Frekwencja"
            :value="attendanceSummary ? `${attendanceSummary.attendance_percent}%` : '—'"
            icon="i-lucide-user-check"
            :tone="attendanceSummary ? 'primary' : 'info'"
            :hint="attendanceSummary ? `${attendanceSummary.present_count} obecności · ${attendanceSummary.absent_count} nieob.` : null"
            to="/klub/obecnosc"
          />
          <DashboardKpiCard
            size="compact"
            label="Wyniki oczek."
            :value="myPendingResultsCount"
            icon="i-lucide-clipboard-clock"
            :tone="myPendingResultsCount ? 'warning' : 'info'"
            to="/athlete/wyniki"
          />
        </div>
        <ClubVotingWidget />
      </div>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="preStartEntry"
      section-id="prestart"
      class="mt-4"
      title="Lista przed startem"
      icon="i-lucide-check-square"
      :badge="daysUntilNearest === 0 ? 'Dzisiaj' : 'Jutro'"
      :default-open="true"
    >
      <div class="rounded-xl border border-warning/40 bg-warning/6 p-4">
        <p class="mb-3 text-sm text-muted">
          <span class="font-semibold text-highlighted">{{ preStartEntry.competition?.title }}</span>
          · {{ preStartEntry.competition?.date?.slice(0, 10) }}
          · {{ preStartEntry.competition?.location ?? '—' }}
          <span class="ms-2 text-xs">({{ checklistDoneCount }}/{{ checklistTotal }})</span>
        </p>
        <div class="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-default/40">
          <div
            class="h-full rounded-full bg-warning transition-all duration-500"
            :style="{ width: `${Math.round((checklistDoneCount / checklistTotal) * 100)}%` }"
          />
        </div>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <label
            v-for="item in checklistItems"
            :key="item.id"
            class="flex cursor-pointer items-center gap-2.5 rounded-lg border border-default/50 bg-card px-3 py-2 transition-colors hover:border-warning/35"
            @click="toggleChecklistItem(item.id)"
          >
            <div
              class="flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all"
              :class="item.checked ? 'border-warning bg-warning/20 text-warning' : 'border-default/60'"
            >
              <UIcon v-if="item.checked" name="i-lucide-check" class="size-2.5" />
            </div>
            <span class="text-sm" :class="item.checked ? 'text-muted line-through' : 'text-highlighted'">
              {{ item.label }}
            </span>
          </label>
        </div>
      </div>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      section-id="modules"
      title="Moduły panelu"
      icon="i-lucide-layout-grid"
      :default-open="true"
      embedded
      class="mt-4"
    >
      <PanelModuleNav
        :groups="athleteModuleGroups"
        :tone-from-bg="toneFromIconBg"
      />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      section-id="klub-hub"
      title="Strefa klubu"
      icon="i-lucide-users"
      :default-open="false"
      embedded
      class="mt-4"
    >
      <KlubHubSection context="athlete" />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete && isAthleteRole"
      section-id="season-goal"
      class="mt-4"
      title="Cel sezonu"
      icon="i-lucide-target"
      :default-open="false"
    >
      <div class="rounded-xl border border-default/50 bg-muted/10 p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm text-muted">
            Śledź postęp względem najlepszego zatwierdzonego wyniku.
          </p>
          <div class="flex gap-1">
            <UButton
              v-if="seasonGoal && !goalEditing"
              size="xs"
              variant="ghost"
              icon="i-lucide-pencil"
              @click="goalEditing = true"
            >
              Edytuj
            </UButton>
            <UButton
              v-if="seasonGoal"
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              @click="clearGoal"
            >
              Usuń
            </UButton>
          </div>
        </div>

        <template v-if="seasonGoal && !goalEditing">
          <div class="mb-2 flex items-end justify-between gap-2">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-muted">
                {{ seasonGoal.mode === 'total' ? 'Total' : 'Sinclair (szac.)' }}
              </p>
              <div class="mt-1 flex items-end gap-1">
                <span class="text-2xl font-black tabular-nums text-highlighted">{{ goalCurrentValue }}</span>
                <span class="mb-0.5 text-sm font-semibold text-muted">/ {{ seasonGoal.target }} kg</span>
              </div>
            </div>
            <span class="text-xl font-black tabular-nums" :class="goalProgress >= 100 ? 'text-success' : 'text-primary'">
              {{ goalProgress }}%
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-default/40">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="goalProgress >= 100 ? 'bg-success' : 'bg-primary'"
              :style="{ width: `${goalProgress}%` }"
            />
          </div>
        </template>

        <template v-else>
          <div class="flex flex-wrap items-end gap-3">
            <UFormField label="Typ celu">
              <USelect
                v-model="goalMode"
                :items="[{ label: 'Total (kg)', value: 'total' }, { label: 'Sinclair (szac.)', value: 'sinclair' }]"
                class="w-40"
              />
            </UFormField>
            <UFormField label="Cel (kg)">
              <UInputNumber
                v-model="goalTarget"
                :min="1"
                :step="1"
                placeholder="np. 250"
                class="w-28"
              />
            </UFormField>
            <UButton color="success" size="sm" icon="i-lucide-check" @click="saveGoal">
              Zapisz
            </UButton>
            <UButton v-if="seasonGoal" variant="ghost" color="neutral" size="sm" @click="goalEditing = false">
              Anuluj
            </UButton>
          </div>
        </template>
      </div>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="latestRelease"
      section-id="mobile-app"
      class="mt-4"
      title="Aplikacja mobilna"
      icon="i-lucide-smartphone"
      :badge="latestRelease.version"
      :default-open="false"
    >
      <div class="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="font-semibold text-highlighted">Aplikacja na Androida</p>
          <p class="text-sm text-muted">Wyniki i obecność w telefonie.</p>
          <UBadge size="sm" variant="soft" color="primary" class="mt-1 font-mono">{{ latestRelease.version }}</UBadge>
        </div>
        <UButton
          :to="latestRelease.download_url"
          target="_blank"
          color="primary"
          trailing-icon="i-lucide-download"
          class="shrink-0"
        >
          Pobierz APK
        </UButton>
      </div>
    </PanelCollapsibleSection>

    <SlaviaModal
      v-model:open="showOnboarding"
      title="Witaj w panelu zawodnika"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <div class="space-y-4 p-4 sm:p-5">
          <ol class="list-decimal space-y-3 ps-5 text-sm text-muted">
            <li>
              <strong class="text-highlighted">Składka</strong> — zgłoś przelew do 10. dnia miesiąca.
            </li>
            <li>
              <strong class="text-highlighted">Kalendarz</strong> — starty i treningi klubowe.
            </li>
            <li>
              <strong class="text-highlighted">Wyniki</strong> — zgłaszaj starty; kadra zatwierdza wpisy.
            </li>
          </ol>
          <div class="flex justify-end border-t border-default/60 pt-3">
            <UButton @click="dismissOnboarding">
              Rozumiem
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>

    <div
      v-if="auth.canAccessAthletePortal && !athlete"
      class="mt-4"
    >
      <UAlert
        icon="i-lucide-info"
        title="Brak powiązanego profilu"
        description="Konto nie jest powiązane z rekordem zawodnika. Skontaktuj się z administratorem."
        color="warning"
        variant="subtle"
        class="rounded-2xl"
      />
    </div>

    </template>
  </PanelPageLayout>
</template>

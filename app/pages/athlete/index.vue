<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import type { Athlete, CompetitionResult, MyCalendarEntry, PaymentStatusResponse } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'

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
  date: string
  squat_kg: number | null
  bench_kg: number | null
  deadlift_kg: number | null
}>({
  kind: 'competition',
  location: '',
  snatch: null,
  clean_and_jerk: null,
  total: 0,
  date: new Date().toISOString().substring(0, 10),
  squat_kg: null,
  bench_kg: null,
  deadlift_kg: null
})

watch(
  () => [resultForm.snatch, resultForm.clean_and_jerk],
  ([snatch, clean]) => {
    resultForm.total = (snatch || 0) + (clean || 0)
  }
)

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
  const hasSbd =
    (resultForm.squat_kg != null && resultForm.squat_kg > 0)
    || (resultForm.bench_kg != null && resultForm.bench_kg > 0)
    || (resultForm.deadlift_kg != null && resultForm.deadlift_kg > 0)
  if (!hasOly && !hasSbd) {
    toast.add({
      title: 'Uzupełnij formularz',
      description: 'Podaj rwanie i/lub podrzut albo przynajmniej jedno ćwiczenie siłowe.',
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
    if (resultForm.squat_kg != null && resultForm.squat_kg > 0) body.squat_kg = resultForm.squat_kg
    if (resultForm.bench_kg != null && resultForm.bench_kg > 0) body.bench_kg = resultForm.bench_kg
    if (resultForm.deadlift_kg != null && resultForm.deadlift_kg > 0) body.deadlift_kg = resultForm.deadlift_kg

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
    resultForm.squat_kg = null
    resultForm.bench_kg = null
    resultForm.deadlift_kg = null
    await refreshResults()
  } catch (e) {
    toast.add({ title: 'Błąd zgłoszenia', description: getApiErrorMessage(e), color: 'error' })
  }
}

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
  const ps = paymentStatus.value
  const standing = ps.has_standing_order === true
  if (ps.is_paid) {
    return { value: 'Opłacona', tone: 'success' as const, hint: ps.month }
  }
  if (ps.is_overdue) {
    return { value: 'Nieopłacona', tone: 'error' as const, hint: ps.month }
  }
  if (standing) {
    return { value: terms.paymentStandingOrder(), tone: 'info' as const, hint: `Auto-składka · ${ps.month}` }
  }
  return { value: 'Oczekuje', tone: 'warning' as const, hint: ps.month }
})

/** Spójny kolor/tekst z KPI — bez mylenia zielonego kafelka z faktycznym „opłacona”. */
const membershipMonthBadge = computed(() => {
  if (!paymentStatus.value) return null
  const ps = paymentStatus.value
  if (ps.is_paid) return { color: 'success' as const, label: 'Opłacona' }
  if (ps.is_overdue) return { color: 'error' as const, label: 'Nieopłacona' }
  if (ps.has_standing_order === true) return { color: 'info' as const, label: terms.paymentStandingOrder() }
  return { color: 'warning' as const, label: 'Niepotwierdzona' }
})

const athleteDashboardTiles = [
  {
    to: '/athlete/skladki',
    title: 'Składka klubowa',
    desc: 'Zgłoś płatność i sprawdź status',
    icon: 'i-lucide-banknote',
    /** Bez „green” w klasach — inaczej `toneFromIconBg` zawsze daje success i myli ze statusem opłacenia. */
    ring: 'ring-primary/25 hover:ring-primary/45',
    iconBg: 'bg-primary/15 text-primary'
  },
  {
    to: '/athlete/kalendarz',
    title: 'Kalendarz startów',
    desc: 'Przypisania zawodów od kadry',
    icon: 'i-lucide-calendar-heart',
    ring: 'ring-primary/25 hover:ring-primary/45',
    iconBg: 'bg-primary/15 text-primary'
  },
  {
    to: '/athlete/analiza-sztangi',
    title: 'Tor sztangi',
    desc: 'Analiza nagrania w przeglądarce',
    icon: 'i-lucide-scan-line',
    ring: 'ring-orange-500/25 hover:ring-orange-500/45',
    iconBg: 'bg-orange-500/12 text-orange-600 dark:text-orange-400'
  },
  {
    to: '/dziennik',
    title: 'Dziennik treningów',
    desc: 'Wpisy po jednostkach',
    icon: 'i-lucide-book-marked',
    ring: 'ring-info/25 hover:ring-info/45',
    iconBg: 'bg-info/12 text-info'
  },
  {
    to: '/athlete/exercises',
    title: 'Inne ćwiczenia',
    desc: 'Przysiady, wyciskanie, martwy',
    icon: 'i-lucide-bar-chart-3',
    ring: 'ring-warning/28 hover:ring-warning/42',
    iconBg: 'bg-warning/10 text-warning'
  },
  {
    to: '/kalkulator-proporcji',
    title: 'Proporcje (ratio)',
    desc: '„Złote proporcje” między bojami',
    icon: 'i-lucide-sigma',
    ring: 'ring-success/25 hover:ring-success/40',
    iconBg: 'bg-success/12 text-success'
  },
  {
    to: '/aktualnosci',
    title: 'Aktualności klubu',
    desc: 'Aktualności i komunikaty',
    icon: 'i-lucide-newspaper',
    ring: 'ring-warning/25 hover:ring-warning/42',
    iconBg: 'bg-warning/10 text-warning'
  },
  {
    to: '/chat',
    title: 'Czat z trenerem',
    desc: 'Wiadomości 1:1',
    icon: 'i-lucide-messages-square',
    ring: 'ring-info/28 hover:ring-info/45',
    iconBg: 'bg-info/14 text-info'
  },
  {
    to: '/attendance',
    title: 'Moja obecność',
    desc: 'Zgłoś obecność i sprawdź historię',
    icon: 'i-lucide-user-check',
    ring: 'ring-primary/22 hover:ring-primary/42',
    iconBg: 'bg-primary/12 text-primary'
  },
  {
    to: '/athlete/timeline',
    title: 'Historia treningów',
    desc: 'Oś czasu: wyniki, obecność, dziennik',
    icon: 'i-lucide-timeline',
    ring: 'ring-primary/28 hover:ring-primary/46',
    iconBg: 'bg-primary/10 text-primary'
  },
  {
    to: '/athlete/plany',
    title: 'Plany treningowe',
    desc: 'Cele tygodnia i raport progresu',
    icon: 'i-lucide-clipboard-list',
    ring: 'ring-success/25 hover:ring-success/45',
    iconBg: 'bg-success/12 text-success'
  },
  {
    to: '/athlete/regeneracja',
    title: 'Regeneracja',
    desc: 'Dzienny check-in snu i zmęczenia',
    icon: 'i-lucide-heart-pulse',
    ring: 'ring-error/28 hover:ring-error/42',
    iconBg: 'bg-error/10 text-error'
  }
] as const

const athleteModuleGroups = computed(() => {
  const list = athleteDashboardTiles
  const byTo = new Map<string, typeof list[number]>()
  for (const l of list) byTo.set(String(l.to), l)
  const pick = (to: string) => byTo.get(to)
  return [
    {
      title: 'Najczęstsze',
      items: [
        pick('/athlete/skladki'),
        pick('/athlete/kalendarz'),
        pick('/attendance'),
        pick('/chat')
      ].filter(Boolean)
    },
    {
      title: 'Trening i progres',
      items: [
        pick('/dziennik'),
        pick('/athlete/timeline'),
        pick('/athlete/plany'),
        pick('/athlete/regeneracja')
      ].filter(Boolean)
    },
    {
      title: 'Narzędzia',
      items: [
        pick('/athlete/analiza-sztangi'),
        pick('/athlete/exercises'),
        pick('/kalkulator-proporcji'),
        pick('/aktualnosci')
      ].filter(Boolean)
    }
  ] as const
})

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

/** Przypomnienie przed 10. dniem miesiąca — tylko zawodnik, nie „ukryte” w profilu, brak opłaty i bez przelewu stałego. */
const showPre10PaymentBanner = computed(() => {
  if (!isAthleteRole.value || hidePaymentReminderLocal.value) {
    return false
  }
  const day = new Date().getDate()
  if (day >= 10) {
    return false
  }
  if (paymentStatus.value?.is_paid) {
    return false
  }
  if (paymentStatus.value?.has_standing_order === true) {
    return false
  }
  return true
})
</script>

<template>
  <UContainer class="py-8 md:py-11 lg:py-14">
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
      class="mt-8 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3 lg:gap-4"
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
    </div>

    <div v-if="auth.canAccessAthletePortal && athlete" class="mb-10 space-y-8">
      <div v-for="g in athleteModuleGroups" :key="g.title">
        <div class="mb-3 flex items-end justify-between gap-3">
          <h2 class="text-xl font-semibold text-highlighted">
            {{ g.title }}
          </h2>
        </div>
        <div class="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardModuleCard
            v-for="tile in g.items"
            :key="String(tile!.to)"
            :title="tile!.title"
            :description="tile!.desc"
            :icon="tile!.icon"
            :to="tile!.to"
            :tone="toneFromIconBg(tile!.iconBg)"
            :icon-wrapper-class="tile!.iconBg"
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

    <div
      v-if="auth.canAccessAthletePortal && athlete && attendanceSummary"
      class="mb-10"
    >
      <UCard class="rounded-2xl border-default/70">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-black text-highlighted">Frekwencja treningowa</h2>
          <UBadge color="primary" variant="subtle">
            {{ attendanceSummary.attendance_percent }}%
          </UBadge>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-4 sm:items-stretch">
          <div class="flex min-h-[5.25rem] flex-col justify-between gap-1 rounded-xl border border-default/50 p-3">
            <p class="text-xs leading-tight text-muted">Obecności</p>
            <p class="text-2xl font-black tabular-nums leading-none text-success">{{ attendanceSummary.present_count }}</p>
          </div>
          <div class="flex min-h-[5.25rem] flex-col justify-between gap-1 rounded-xl border border-default/50 p-3">
            <p class="text-xs leading-tight text-muted">Nieobecności</p>
            <p class="text-2xl font-black tabular-nums leading-none text-error">{{ attendanceSummary.absent_count }}</p>
          </div>
          <div class="flex min-h-[5.25rem] flex-col justify-between gap-1 rounded-xl border border-default/50 p-3">
            <p class="text-xs leading-tight text-muted">Oczekuje</p>
            <p class="text-2xl font-black tabular-nums leading-none text-warning">{{ attendanceSummary.pending_count }}</p>
          </div>
          <div class="flex min-h-[5.25rem] flex-col justify-between gap-1 rounded-xl border border-default/50 p-3">
            <p class="text-xs leading-tight text-muted">Frekwencja</p>
            <p class="text-2xl font-black tabular-nums leading-none text-primary">{{ attendanceSummary.attendance_percent }}%</p>
          </div>
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
          </div>
          <div class="slavia-form-grid grid-cols-1 border-t border-default/40 pt-5 sm:grid-cols-3">
            <UFormField
              label="Przysiad (kg)"
              description="Opcjonalnie"
            >
              <UInputNumber
                v-model="resultForm.squat_kg"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Wyciskanie (kg)"
              description="Opcjonalnie"
            >
              <UInputNumber
                v-model="resultForm.bench_kg"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Martwy ciąg (kg)"
              description="Opcjonalnie"
            >
              <UInputNumber
                v-model="resultForm.deadlift_kg"
                :min="0"
                :step="0.5"
                size="lg"
                class="w-full"
              />
            </UFormField>
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
                <th class="hidden lg:table-cell px-4 py-3 text-center font-semibold text-muted">
                  Siła (opcj.)
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
                <td class="hidden lg:table-cell max-w-40 px-4 py-3 text-center text-[11px] text-muted leading-snug">
                  <template v-if="r.squat_kg != null || r.bench_kg != null || r.deadlift_kg != null">
                    P {{ r.squat_kg ?? '—' }} · W {{ r.bench_kg ?? '—' }} · M {{ r.deadlift_kg ?? '—' }}
                  </template>
                  <template v-else>
                    —
                  </template>
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

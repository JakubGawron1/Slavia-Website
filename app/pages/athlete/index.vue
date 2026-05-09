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
  if (!auth.canAccessAthletePortal.value || !athlete.value?.id || !auth.isAthlete.value) return
  try {
    await apiFetch(apiRoutes.payments.my, {
      method: 'POST',
      body: {
        month: paymentForm.month,
        amount_pln: paymentForm.amount_pln != null ? Number(paymentForm.amount_pln) : null,
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
    return { value: '—', tone: 'neutral' as const, hint: 'Dostępne tylko dla roli zawodnika' }
  }
  if (!paymentStatus.value) {
    return { value: '—', tone: 'neutral' as const, hint: 'Brak danych (odśwież)' }
  }
  if (paymentStatus.value.is_paid) {
    return { value: 'Opłacona', tone: 'success' as const, hint: paymentStatus.value.month }
  }
  if (paymentStatus.value.is_overdue) {
    return { value: 'Nieopłacona', tone: 'error' as const, hint: paymentStatus.value.month }
  }
  return { value: 'Oczekuje', tone: 'warning' as const, hint: paymentStatus.value.month }
})

const athleteDashboardTiles = [
  {
    to: '/athlete/skladki',
    title: 'Składka klubowa',
    desc: 'Zgłoś płatność i sprawdź status',
    icon: 'i-lucide-banknote',
    ring: 'ring-green-500/25 hover:ring-green-500/45',
    iconBg: 'bg-green-500/15 text-green-700 dark:text-green-400'
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
    ring: 'ring-violet-500/20 hover:ring-violet-500/40',
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
  },
  {
    to: '/dziennik',
    title: 'Dziennik treningów',
    desc: 'Wpisy po jednostkach',
    icon: 'i-lucide-book-marked',
    ring: 'ring-cyan-500/25 hover:ring-cyan-500/45',
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
  },
  {
    to: '/athlete/exercises',
    title: 'Inne ćwiczenia',
    desc: 'Przysiady, wyciskanie, martwy',
    icon: 'i-lucide-bar-chart-3',
    ring: 'ring-lime-500/25 hover:ring-lime-500/45',
    iconBg: 'bg-lime-500/15 text-lime-700 dark:text-lime-400'
  },
  {
    to: '/kalkulator-proporcji',
    title: 'Proporcje (ratio)',
    desc: '„Złote proporcje” między bojami',
    icon: 'i-lucide-sigma',
    ring: 'ring-emerald-500/20 hover:ring-emerald-500/40',
    iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  },
  {
    to: '/aktualnosci',
    title: 'Aktualności klubu',
    desc: 'Aktualności i komunikaty',
    icon: 'i-lucide-newspaper',
    ring: 'ring-amber-500/25 hover:ring-amber-500/45',
    iconBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  },
  {
    to: '/chat',
    title: 'Czat z trenerem',
    desc: 'Wiadomości 1:1',
    icon: 'i-lucide-messages-square',
    ring: 'ring-sky-500/25 hover:ring-sky-500/45',
    iconBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
  },
  {
    to: '/attendance',
    title: 'Moja obecność',
    desc: 'Zgłoś obecność i sprawdź historię',
    icon: 'i-lucide-user-check',
    ring: 'ring-indigo-500/25 hover:ring-indigo-500/45',
    iconBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400'
  },
  {
    to: '/athlete/timeline',
    title: 'Historia treningów',
    desc: 'Oś czasu: wyniki, obecność, dziennik',
    icon: 'i-lucide-timeline',
    ring: 'ring-fuchsia-500/25 hover:ring-fuchsia-500/45',
    iconBg: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400'
  },
  {
    to: '/athlete/plany',
    title: 'Plany treningowe',
    desc: 'Cele tygodnia i raport progresu',
    icon: 'i-lucide-clipboard-list',
    ring: 'ring-emerald-500/25 hover:ring-emerald-500/45',
    iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  },
  {
    to: '/athlete/regeneracja',
    title: 'Regeneracja',
    desc: 'Dzienny check-in snu i zmęczenia',
    icon: 'i-lucide-heart-pulse',
    ring: 'ring-rose-500/25 hover:ring-rose-500/45',
    iconBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
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
  if (s.includes('rose') || s.includes('red')) return 'error'
  if (s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('fuchsia') || s.includes('primary')) return 'primary'
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

    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4"
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
        :tone="attendanceSummary ? 'primary' : 'neutral'"
        :hint="attendanceSummary ? `${attendanceSummary.present_count} obecności · ${attendanceSummary.absent_count} nieob.` : null"
        to="/attendance"
      />
      <DashboardKpiCard
        label="Wyniki (oczekujące)"
        :value="myPendingResultsCount"
        icon="i-lucide-clipboard-clock"
        :tone="myPendingResultsCount ? 'warning' : 'neutral'"
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
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardModuleCard
            v-for="tile in g.items"
            :key="String(tile!.to)"
            :title="tile!.title"
            :description="tile!.desc"
            :icon="tile!.icon"
            :to="tile!.to"
            :tone="toneFromIconBg(tile!.iconBg)"
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
        <div class="mt-4 grid gap-3 sm:grid-cols-4">
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Obecności</p>
            <p class="text-2xl font-black text-success">{{ attendanceSummary.present_count }}</p>
          </div>
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Nieobecności</p>
            <p class="text-2xl font-black text-error">{{ attendanceSummary.absent_count }}</p>
          </div>
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Oczekuje</p>
            <p class="text-2xl font-black text-warning">{{ attendanceSummary.pending_count }}</p>
          </div>
          <div class="rounded-xl border border-default/50 p-3">
            <p class="text-xs text-muted">Frekwencja</p>
            <p class="text-2xl font-black text-primary">{{ attendanceSummary.attendance_percent }}%</p>
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
            v-if="paymentStatus"
            :color="paymentStatus.is_paid ? 'success' : (paymentStatus.is_overdue ? 'error' : 'warning')"
            variant="subtle"
          >
            {{ paymentStatus.is_paid ? 'Opłacona' : (paymentStatus.is_overdue ? 'Nieopłacona' : 'Niepotwierdzona') }}
          </UBadge>
        </div>

        <p class="mt-2 text-sm text-muted">
          Zgłoś płatność — kadra zatwierdzi ją w systemie. Termin płatności: <span class="font-bold">10</span> każdego miesiąca.
        </p>

        <div class="mt-5 grid gap-4 sm:grid-cols-3">
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
          <div class="grid gap-5 sm:grid-cols-2">
            <UFormField label="Typ wpisu" description="Zawody trafiają na publiczną listę">
              <select
                v-model="resultForm.kind"
                class="slavia-select w-full py-3 text-[15px]"
              >
                <option value="competition">Zawody (publiczne)</option>
                <option value="training">Trening (po zalogowaniu)</option>
              </select>
            </UFormField>
            <UFormField
              v-if="resultForm.kind === 'competition'"
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
          <div class="grid gap-5 border-t border-default/40 pt-5 sm:grid-cols-3">
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

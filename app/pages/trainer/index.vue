<script setup lang="ts">
import type { Athlete, CompetitionResult, PendingPaymentRow } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Panel trenera — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const FILTER_ALL = '__all__'

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
  athlete_id: string
  session_date: string
  status: string
  verification_state: string
  note?: string | null
}
const attendanceFilters = reactive({
  athlete_id: FILTER_ALL,
  status: FILTER_ALL,
  verification_state: FILTER_ALL,
  from_date: '',
  to_date: ''
})
const attendanceRows = ref<AttendanceRecord[]>([])

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
const competitionsCount = computed(() => (Array.isArray(competitions.value) ? competitions.value.length : 0))

const lowerDashboards = computed(() => {
  const roles = new Set(auth.roles.value || [])
  const list: { label: string, to: string, icon: string }[] = []
  if (roles.has('Athlete')) list.push({ label: 'Panel zawodnika', to: '/athlete', icon: 'i-lucide-user' })
  return list
})

const quickLinks = computed(() => {
  const links = [
    {
      title: 'Baza zawodników',
      description: 'Edycja profili i zawodów — konta logowania zakłada administrator',
      icon: 'i-lucide-users',
      to: '/trainer/zawodnicy',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Kalendarz',
      description: 'Sprawdzaj i planuj zawody oraz treningi',
      icon: 'i-lucide-calendar',
      to: '/kalendarz',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Zgłoszenia wyników',
      description: 'Lista oczekujących na tej stronie (sekcja poniżej) lub dodaj start w „Wszystkie starty”',
      icon: 'i-lucide-check-circle',
      to: { path: '/trainer', hash: '#wyniki-oczekujace' },
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Składki klubowe',
      description: 'Oczekujące, opłacone i brak wpłaty (widok miesiąca)',
      icon: 'i-lucide-banknote',
      to: '/trainer/skladki',
      color: 'text-green-600',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Wszystkie starty',
      description: 'Lista zapisanych startów z edycją',
      icon: 'i-lucide-list-checks',
      to: '/trainer/wyniki',
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    },
    {
      title: 'Dzienniki treningów',
      description: 'Wybierz zawodnika i prowadź wpisy po jednostkach',
      icon: 'i-lucide-book-marked',
      to: '/trainer/dziennik',
      color: 'text-cyan-600',
      bg: 'bg-cyan-500/10'
    },
    {
      title: 'Plany treningowe',
      description: 'Tworzenie planów i monitoring progresu',
      icon: 'i-lucide-clipboard-list',
      to: '/trainer/plany',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Regeneracja zawodników',
      description: 'Check-in snu, zmęczenia i gotowości',
      icon: 'i-lucide-heart-pulse',
      to: '/trainer/regeneracja',
      color: 'text-rose-600',
      bg: 'bg-rose-500/10'
    },
    {
      title: 'Feed wydarzeń',
      description: 'Aktywności: wyniki, obecność, regeneracja',
      icon: 'i-lucide-list-collapse',
      to: '/trainer/wydarzenia',
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-500/10'
    },
    {
      title: 'Inne ćwiczenia',
      description: 'Ranking przysiadów, wyciskania i martwego',
      icon: 'i-lucide-bar-chart-3',
      to: '/trainer/exercises',
      color: 'text-lime-600',
      bg: 'bg-lime-500/10'
    },
    {
      title: 'Analiza toru sztangi',
      description: 'Wideo + AI w przeglądarce: tor ruchu i komunikaty techniczne',
      icon: 'i-lucide-scan-line',
      to: '/trainer/analiza-sztangi',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      title: 'Aktualności klubu',
      description: 'Aktualności, ogłoszenia i wpisy na stronie',
      icon: 'i-lucide-newspaper',
      to: '/aktualnosci',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Ustawienia konta',
      description: 'E-mail, avatar i hasło',
      icon: 'i-lucide-user-cog',
      to: '/profil',
      color: 'text-neutral-500',
      bg: 'bg-neutral-500/10'
    },
    {
      title: 'Czat trener–zawodnik',
      description: 'Wiadomości 1:1 i szybki kontakt',
      icon: 'i-lucide-messages-square',
      to: '/chat',
      color: 'text-sky-600',
      bg: 'bg-sky-500/10'
    },
    {
      title: 'Lista obecności',
      description: 'Statusy obecności i historia',
      icon: 'i-lucide-user-check',
      to: '/attendance',
      color: 'text-indigo-600',
      bg: 'bg-indigo-500/10'
    }
  ]
  return links
})

async function approveResult(id: string) {
  try {
    await apiFetch(`/api/results/${id}/approve`, { method: 'PATCH' })
    toast.add({ title: 'Wynik zatwierdzony', color: 'success' })
    await refreshPending()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zatwierdzić',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function rejectResult(id: string) {
  try {
    await apiFetch(`/api/results/${id}/reject`, { method: 'PATCH' })
    toast.add({ title: 'Wynik odrzucony', color: 'success' })
    await refreshPending()
  } catch (e) {
    toast.add({
      title: 'Nie udało się odrzucić',
      description: getApiErrorMessage(e),
      color: 'error'
    })
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

const addApprovedPaymentForm = reactive<{
  athlete_id: string | null
  month: string
  amount_pln: number | null
  note: string
}>({
  athlete_id: null,
  month: new Date().toISOString().slice(0, 7),
  amount_pln: null,
  note: ''
})

watch(
  () => athletes.value,
  (list) => {
    if (!addApprovedPaymentForm.athlete_id && Array.isArray(list) && list.length > 0) {
      addApprovedPaymentForm.athlete_id = list[0]!.id
    }
  },
  { immediate: true }
)

async function createApprovedPayment() {
  if (!addApprovedPaymentForm.athlete_id) return
  try {
    await apiFetch(apiRoutes.payments.createApprovedForAthlete(addApprovedPaymentForm.athlete_id), {
      method: 'POST',
      body: {
        month: addApprovedPaymentForm.month,
        amount_pln: addApprovedPaymentForm.amount_pln != null ? Number(addApprovedPaymentForm.amount_pln) : null,
        note: addApprovedPaymentForm.note
      }
    })
    toast.add({ title: 'Dodano zatwierdzoną płatność', color: 'success' })
    addApprovedPaymentForm.note = ''
    await refreshPendingPayments()
  } catch (e) {
    toast.add({
      title: 'Nie udało się dodać płatności',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function loadAttendanceRows() {
  const q = new URLSearchParams()
  if (attendanceFilters.athlete_id !== FILTER_ALL) q.set('athlete_id', attendanceFilters.athlete_id)
  if (attendanceFilters.status !== FILTER_ALL) q.set('status', attendanceFilters.status)
  if (attendanceFilters.verification_state !== FILTER_ALL) q.set('verification_state', attendanceFilters.verification_state)
  if (attendanceFilters.from_date) q.set('from_date', attendanceFilters.from_date)
  if (attendanceFilters.to_date) q.set('to_date', attendanceFilters.to_date)
  const path = q.toString() ? `/api/attendance?${q}` : '/api/attendance'
  attendanceRows.value = await apiFetch<AttendanceRecord[]>(path).catch(() => [])
}

onMounted(() => {
  void loadAttendanceRows()
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Panel Trenera
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, {{ auth.user.value?.username || 'Trenerze' }}!
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Tutaj możesz przeglądać zawodników, sprawdzać zgłoszenia wyników i koordynować harmonogramy.
      </p>
    </div>

    <div
      v-if="lowerDashboards.length"
      class="mb-10 rounded-2xl border border-default/70 bg-muted/10 p-4 sm:p-5"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-muted">
            Inne panele na tym koncie
          </p>
          <p class="mt-1 text-sm text-muted">
            Masz rolę zawodnika — możesz przełączyć dashboard.
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <UButton
            v-for="d in lowerDashboards"
            :key="d.to"
            :to="d.to"
            :icon="d.icon"
            variant="outline"
            color="neutral"
            size="lg"
            class="min-h-11 justify-center"
          >
            {{ d.label }}
          </UButton>
        </div>
      </div>
    </div>

    <div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <UIcon
              name="i-lucide-users"
              class="size-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">
              Zawodnicy (aktywni)
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ athletesCount }}
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <UIcon
              name="i-lucide-activity"
              class="size-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">
              Wyniki oczekujące
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ pendingCount }}
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <UIcon
              name="i-lucide-calendar"
              class="size-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">
              Wydarzenia w kalendarzu
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ competitionsCount }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-highlighted">
      Moduły i skróty
    </h2>
    <div class="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.title"
        :to="link.to"
        class="group block transition-transform hover:-translate-y-1"
      >
        <UCard class="h-full border border-default transition-colors group-hover:border-primary/50 group-hover:shadow-md">
          <div class="flex flex-col items-center text-center p-4">
            <div :class="['mb-3 flex h-14 w-14 items-center justify-center rounded-full', link.bg, link.color]">
              <UIcon
                :name="link.icon"
                class="size-7"
              />
            </div>
            <h3 class="font-medium text-highlighted group-hover:text-primary transition-colors">
              {{ link.title }}
            </h3>
            <p class="mt-2 text-xs text-muted">
              {{ link.description }}
            </p>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Wyniki oczekujące — pod skrótami; kotwica działa także przy 0 pozycjach -->
    <div
      id="wyniki-oczekujace"
      class="mb-12 scroll-mt-24 rounded-2xl border border-default bg-card p-6"
    >
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-xl font-semibold text-highlighted">
          <UIcon
            name="i-lucide-clipboard-clock"
            class="mr-2 inline"
          />
          Wyniki do zatwierdzenia ({{ pendingCount }})
        </h2>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="soft"
            size="sm"
            icon="i-lucide-refresh-ccw"
            @click="refreshPending()"
          >
            Odśwież listę
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            to="/trainer/wyniki"
          >
            Wszystkie starty / dodaj wpis
          </UButton>
        </div>
      </div>
      <div
        v-if="pendingCount === 0"
        class="rounded-xl border border-dashed border-default/70 bg-muted/10 px-4 py-8 text-center text-sm text-muted"
      >
        Brak oczekujących zgłoszeń. Możesz dodać start od razu jako zatwierdzony na stronie
        <NuxtLink
          to="/trainer/wyniki"
          class="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Wszystkie starty
        </NuxtLink>
        .
      </div>
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="result in pendingResults || []"
          :key="result.id"
          class="flex flex-col gap-3 rounded-xl border border-default/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium text-highlighted">
              {{ labelForResult(result) }}
            </p>
            <p class="text-sm text-muted">
              Rwanie {{ result.snatch }} kg · Podrzut {{ result.clean_and_jerk }} kg · Razem {{ result.total }} kg · {{ result.date.slice(0, 10) }}
            </p>
          </div>
          <UButton
            size="sm"
            class="shrink-0"
            @click="approveResult(result.id)"
          >
            Zatwierdź
          </UButton>
          <UButton
            size="sm"
            color="error"
            variant="soft"
            class="shrink-0"
            @click="rejectResult(result.id)"
          >
            Odrzuć
          </UButton>
        </div>
      </div>
    </div>

    <!-- Składki do zatwierdzenia -->
    <div
      id="skladki-oczekujace"
      class="mb-12 scroll-mt-24 rounded-2xl border border-default bg-card p-6"
    >
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-xl font-semibold text-highlighted">
          <UIcon
            name="i-lucide-banknote"
            class="mr-2 inline"
          />
          Składki do zatwierdzenia ({{ pendingPaymentsCount }})
        </h2>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="soft"
            size="sm"
            icon="i-lucide-refresh-ccw"
            @click="refreshPendingPayments()"
          >
            Odśwież listę
          </UButton>
        </div>
      </div>

      <UCard class="mb-5 border-default/60">
        <div class="grid gap-3 md:grid-cols-12 md:items-end">
          <UFormField label="Dodaj zatwierdzoną płatność" class="md:col-span-4">
            <USelect
              v-model="addApprovedPaymentForm.athlete_id"
              :items="[{ label: 'Wybierz zawodnika', value: null }, ...((athletes || []).map(a => ({ label: a.full_name, value: a.id })))]"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Miesiąc" class="md:col-span-3">
            <UInput v-model="addApprovedPaymentForm.month" type="month" class="w-full" />
          </UFormField>
          <UFormField label="Kwota (PLN)" description="Opcjonalnie" class="md:col-span-2">
            <UInputNumber v-model="addApprovedPaymentForm.amount_pln" :min="0" :step="1" class="w-full" />
          </UFormField>
          <UFormField label="Opis" description="Opcjonalnie" class="md:col-span-3">
            <UInput v-model="addApprovedPaymentForm.note" placeholder="np. gotówka / przelew" class="w-full" />
          </UFormField>
        </div>
        <div class="mt-3">
          <UButton
            icon="i-lucide-check"
            :disabled="!addApprovedPaymentForm.athlete_id"
            @click="createApprovedPayment"
          >
            Dodaj jako zatwierdzone
          </UButton>
        </div>
      </UCard>

      <div
        v-if="pendingPaymentsCount === 0"
        class="rounded-xl border border-dashed border-default/70 bg-muted/10 px-4 py-8 text-center text-sm text-muted"
      >
        Brak zgłoszeń składek w statusie oczekującym.
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="p in pendingPayments || []"
          :key="p.id"
          class="flex flex-col gap-3 rounded-xl border border-default/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium text-highlighted">
              {{ p.athlete_name }}
            </p>
            <p class="text-sm text-muted">
              Miesiąc: <span class="font-mono">{{ p.month }}</span>
              <span v-if="p.amount_pln != null"> · Kwota: <span class="font-mono">{{ p.amount_pln }}</span> PLN</span>
              <span v-if="p.note && p.note.trim()"> · {{ p.note }}</span>
            </p>
            <p class="mt-1 text-[11px] text-muted">
              Zgłoszono: <span class="font-mono">{{ p.created_at }}</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <UButton
              size="sm"
              class="shrink-0"
              @click="approvePayment(p.id)"
            >
              Zatwierdź
            </UButton>
            <UButton
              size="sm"
              color="error"
              variant="soft"
              class="shrink-0"
              @click="rejectPayment(p.id)"
            >
              Odrzuć
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-12 rounded-2xl border border-default bg-card p-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-xl font-semibold text-highlighted">Obecności zawodników</h2>
        <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" @click="loadAttendanceRows">Odśwież</UButton>
      </div>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <USelect v-model="attendanceFilters.athlete_id" :items="[{label:'Wszyscy',value:FILTER_ALL}, ...((athletes || []).map(a => ({label:a.full_name, value:a.id})))]" />
        <USelect v-model="attendanceFilters.status" :items="[{label:'Każdy status',value:FILTER_ALL},{label:'Obecny',value:'obecny'},{label:'Nieobecny',value:'nieobecny'}]" />
        <USelect v-model="attendanceFilters.verification_state" :items="[{label:'Każdy stan',value:FILTER_ALL},{label:'Zweryfikowane',value:'verified'},{label:'Oczekujące',value:'pending'}]" />
        <UInput v-model="attendanceFilters.from_date" type="date" />
        <UInput v-model="attendanceFilters.to_date" type="date" />
      </div>
      <div class="mt-2">
        <UButton size="sm" color="primary" @click="loadAttendanceRows">Filtruj</UButton>
      </div>
      <div class="mt-4 space-y-2">
        <div v-for="row in attendanceRows" :key="row.id" class="rounded-xl border border-default/60 px-3 py-2">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <UBadge size="xs" variant="subtle">{{ athleteNameById.get(row.athlete_id) || row.athlete_id }}</UBadge>
            <UBadge size="xs" variant="subtle" color="primary">{{ row.session_date }}</UBadge>
            <UBadge size="xs" variant="subtle" :color="row.status === 'obecny' ? 'success' : 'error'">{{ row.status }}</UBadge>
            <UBadge size="xs" variant="subtle" :color="row.verification_state === 'verified' ? 'success' : 'warning'">{{ row.verification_state }}</UBadge>
          </div>
          <p v-if="row.note" class="mt-1 text-sm text-muted">{{ row.note }}</p>
        </div>
        <p v-if="attendanceRows.length === 0" class="text-sm text-muted">Brak wpisów dla wybranego filtra.</p>
      </div>
    </div>
  </UContainer>
</template>

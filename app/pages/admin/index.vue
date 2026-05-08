<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const isSuperAdmin = computed(() => auth.isSuperAdmin.value)
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
const competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

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

const quickLinksAll = [
  {
    title: 'Zawodnicy',
    description: 'Zarządzaj listą zawodników i ich danymi',
    icon: 'i-lucide-users',
    to: '/admin/zawodnicy',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    trainerOnly: false
  },
  {
    title: 'Kalendarz',
    description: 'Dodawaj i edytuj wydarzenia oraz zawody',
    icon: 'i-lucide-calendar',
    to: '/kalendarz',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    trainerOnly: false
  },
  {
    title: 'Aktualności',
    description: 'Wpisy informacyjne i relacje (jak wcześniej „blog”)',
    icon: 'i-lucide-newspaper',
    to: '/aktualnosci',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    trainerOnly: false
  },
  {
    title: 'Strony klubu',
    description: 'Ogłoszenia, galeria, wiadomości z formularza kontaktowego',
    icon: 'i-lucide-layout-grid',
    to: '/ogloszenia',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    trainerOnly: false
  },
  {
    title: 'Wiadomości (kontakt)',
    description: 'Skrzynka z publicznego formularza',
    icon: 'i-lucide-mail',
    to: '/admin/kontakt-wiadomosci',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    trainerOnly: false
  },
  {
    title: 'Rankingi',
    description: 'Przeglądaj zawodników i wyniki',
    icon: 'i-lucide-trophy',
    to: '/zawodnicy',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    trainerOnly: false
  },
  {
    title: 'Changelog',
    description: 'Zobacz nowości w systemie',
    icon: 'i-lucide-file-text',
    to: '/admin/changelog',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    trainerOnly: false
  },
  {
    title: 'Analiza toru sztangi',
    description: 'Wideo i szkielet ruchu — narzędzie kadry (ścieżka trenera)',
    icon: 'i-lucide-scan-line',
    to: '/trainer/analiza-sztangi',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    trainerOnly: false
  },
  {
    title: 'Konta kadry',
    description: 'Login, e-mail i hasła kont administracyjnych',
    icon: 'i-lucide-key-round',
    to: '/admin/konta',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    trainerOnly: false
  },
  {
    title: 'Wszystkie starty',
    description: 'Historia startów — poprawki i usuwanie wpisów',
    icon: 'i-lucide-list-checks',
    to: '/trainer/wyniki',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    trainerOnly: true
  },
  {
    title: 'Dzienniki treningów',
    description: 'Wpisy po jednostkach — widok trenera',
    icon: 'i-lucide-book-marked',
    to: '/trainer/dziennik',
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10',
    trainerOnly: true
  },
  {
    title: 'Ustawienia konta',
    description: 'E-mail, avatar i hasło',
    icon: 'i-lucide-user-cog',
    to: '/profil',
    color: 'text-neutral-500',
    bg: 'bg-neutral-500/10',
    trainerOnly: false
  }
]

const quickLinks = computed(() => {
  if (isPureAdmin.value) {
    return quickLinksAll.filter(l => !l.trainerOnly)
  }
  return quickLinksAll
})

const lowerDashboards = computed(() => {
  const list: { label: string, to: string, icon: string }[] = []
  const roles = new Set(auth.roles.value || [])
  if (roles.has('Trainer')) list.push({ label: 'Panel trenera', to: '/trainer', icon: 'i-lucide-dumbbell' })
  if (roles.has('Athlete')) list.push({ label: 'Panel zawodnika', to: '/athlete', icon: 'i-lucide-user' })
  return list
})
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">
        Administracja
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, {{ auth.user.value?.username || 'Adminie' }}!
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        To jest twój panel zarządzania klubem CKS Slavia Ruda Śląska. Tutaj masz dostęp do wszystkich kluczowych modułów.
      </p>
    </div>

    <!-- Statystyki — nad banerami i skrótami -->
    <div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
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
              Zarejestrowani Zawodnicy
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ athletesCount }}
            </p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
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
              Zaplanowane zawody
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ competitionsCount }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- SuperAdmin Banner -->
    <div
      v-if="isSuperAdmin"
      class="mb-10 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div class="flex items-start gap-3 sm:items-center sm:gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary sm:h-12 sm:w-12">
          <UIcon
            name="i-lucide-shield-check"
            class="size-6"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
            Tryb SuperAdmin
          </p>
          <p class="mt-0.5 text-sm text-muted">
            Masz dostęp do zaawansowanych narzędzi systemowych.
          </p>
        </div>
      </div>
      <UButton
        to="/superadmin"
        trailing-icon="i-lucide-arrow-right"
        size="lg"
        class="min-h-11 w-full shrink-0 justify-center sm:w-auto"
      >
        Panel SuperAdmin
      </UButton>
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
            Masz więcej ról — możesz przełączyć dashboard.
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

    <h2 class="mb-4 text-xl font-semibold text-highlighted">
      Moduły
    </h2>
    <div class="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="group block transition-transform hover:-translate-y-1"
      >
        <UCard class="h-full border border-default transition-colors group-hover:border-primary/50 group-hover:shadow-md">
          <div class="flex items-start gap-4">
            <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', link.bg, link.color]">
              <UIcon
                :name="link.icon"
                class="size-5"
              />
            </div>
            <div>
              <h3 class="font-medium text-highlighted group-hover:text-primary transition-colors">
                {{ link.title }}
              </h3>
              <p class="mt-1 text-sm text-muted">
                {{ link.description }}
              </p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Wyniki oczekujące — kotwica działa także przy 0 pozycjach -->
    <div
      id="wyniki-oczekujace"
      class="mb-12 scroll-mt-24 rounded-2xl border border-default bg-card p-6"
    >
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-lg font-semibold text-highlighted sm:text-xl">
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
            class="min-h-10 shrink-0"
            @click="refreshPending()"
          >
            Odśwież listę
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            to="/trainer/wyniki"
            class="min-h-10 shrink-0"
          >
            Wszystkie starty / dodaj wpis
          </UButton>
        </div>
      </div>
      <div
        v-if="pendingCount === 0"
        class="rounded-xl border border-dashed border-default/70 bg-muted/10 px-4 py-8 text-center text-sm text-muted"
      >
        Brak oczekujących zgłoszeń. Start dodany przez kadrę trafia od razu jako zatwierdzony —
        <NuxtLink
          to="/trainer/wyniki"
          class="font-semibold text-primary underline-offset-2 hover:underline"
        >
          otwórz listę startów
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
            class="min-h-10 w-full shrink-0 sm:w-auto"
            @click="approveResult(result.id)"
          >
            Zatwierdź
          </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>

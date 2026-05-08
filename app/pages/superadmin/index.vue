<script setup lang="ts">
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Panel superadmina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()

// Pobieranie podstawowych statystyk
const { data: athletes } = await useAsyncData('super-dashboard-athletes', () => apiFetch('/api/athletes/admin').catch(() => []))
const { data: adminsGrouped } = await useAsyncData(
  'super-dashboard-admins-grouped',
  () =>
    apiFetch<{ admins: unknown[], trainers: unknown[], athletes: unknown[] }>('/api/admins/grouped').catch(() => ({
      admins: [],
      trainers: [],
      athletes: []
    }))
)
const { data: competitions } = await useAsyncData('super-dashboard-competitions', () => apiFetch('/api/competitions').catch(() => []))

const athletesCount = computed(() => {
  const list = athletes.value
  if (!Array.isArray(list)) {
    return 0
  }
  return list.filter(a => a.is_active !== false).length
})
const adminsCount = computed(() =>
  Array.isArray(adminsGrouped.value?.admins) ? adminsGrouped.value.admins.length : 0
)
const competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

const quickLinks = [
  {
    title: 'Zarządzanie kontami',
    description: 'Administratorzy, trenerzy i zawodnicy — role, konta i uprawnienia (superadmin)',
    icon: 'i-lucide-shield-alert',
    to: '/superadmin/administratorzy',
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  {
    title: 'Panel Admina',
    description: 'Przejdź do panelu administratora',
    icon: 'i-lucide-settings',
    to: '/admin',
    color: 'text-neutral-500',
    bg: 'bg-neutral-500/10'
  },
  {
    title: 'Panel Trenera',
    description: 'Przejdź do panelu trenera',
    icon: 'i-lucide-user-check',
    to: '/trainer',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Panel Zawodnika',
    description: 'Zobacz interfejs tak jak po stronie zawodnika',
    icon: 'i-lucide-dumbbell',
    to: '/athlete',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Baza Zawodników',
    description: 'Pełny dostęp do edycji bazy zawodników',
    icon: 'i-lucide-users',
    to: '/superadmin/zawodnicy',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Narzędzia developera',
    description: 'Mapa tras, ping API, PWA, logi lokalne i zrzuty diagnostyczne',
    icon: 'i-lucide-terminal',
    to: '/superadmin/developer',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10'
  },
  {
    title: 'Changelog systemu',
    description: 'Lista wydań — ta sama co w panelu admina',
    icon: 'i-lucide-file-text',
    to: '/admin/changelog',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Dzienniki treningów',
    description: 'Wpisy po jednostkach — widok trenera',
    icon: 'i-lucide-book-marked',
    to: '/trainer/dziennik',
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10'
  },
  {
    title: 'Inne ćwiczenia',
    description: 'Ranking ćwiczeń pomocniczych dla kadry i adminów',
    icon: 'i-lucide-bar-chart-3',
    to: '/trainer/exercises',
    color: 'text-lime-600',
    bg: 'bg-lime-500/10'
  },
  {
    title: 'Proporcje (ratio)',
    description: '„Złote proporcje” i widełki % między bojami',
    icon: 'i-lucide-sigma',
    to: '/kalkulator-proporcji',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Analiza toru sztangi',
    description: 'Wideo i diagnostyka toru (kadra)',
    icon: 'i-lucide-scan-line',
    to: '/trainer/analiza-sztangi',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    title: 'Kalendarz Systemowy',
    description: 'Edytuj wszystkie wydarzenia na stronie',
    icon: 'i-lucide-calendar',
    to: '/kalendarz',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    title: 'Starty zawodników',
    description: 'Pełna lista startów — edycja i usuwanie wpisów',
    icon: 'i-lucide-list-checks',
    to: '/trainer/wyniki',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10'
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
    title: 'Aktualności',
    description: 'Wpisy informacyjne i relacje',
    icon: 'i-lucide-newspaper',
    to: '/aktualnosci',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  }
]
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <p class="text-sm font-medium uppercase tracking-wider text-primary flex items-center gap-2">
        <UIcon
          name="i-lucide-crown"
          class="size-4"
        />
        SuperAdministracja
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
        Witaj, Władco Absolutny! ({{ auth.user.value?.username || 'Superadminie' }})
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        To jest główny panel zarządzania całym systemem klubu. Masz pełne uprawnienia do wszystkich zasobów i ról.
      </p>
    </div>

    <h2 class="mb-3 text-lg font-semibold text-highlighted">
      Statystyki
    </h2>
    <div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <UIcon
              name="i-lucide-shield-check"
              class="size-6"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-muted">
              Konta administracyjne
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ adminsCount }}
            </p>
          </div>
        </div>
      </UCard>
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
              Zawodnicy
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ athletesCount }}
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
              Wydarzenia łącznie
            </p>
            <p class="text-2xl font-bold text-highlighted">
              {{ competitionsCount }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <h2 class="mb-4 text-xl font-semibold text-highlighted">
      Moduły i przejścia
    </h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="group block transition-transform hover:-translate-y-1"
      >
        <UCard class="h-full border border-default transition-colors group-hover:border-primary/50 group-hover:shadow-md">
          <div class="flex flex-col items-center text-center p-2">
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
  </UContainer>
</template>

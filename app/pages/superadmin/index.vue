<script setup lang="ts">
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'

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

const moduleGroups = computed(() => {
  const byTo = new Map<string, typeof quickLinks[number]>()
  for (const l of quickLinks) byTo.set(String(l.to), l)
  const pick = (to: string) => byTo.get(to)
  return [
    {
      title: 'System i bezpieczeństwo',
      items: [
        pick('/superadmin/administratorzy'),
        pick('/superadmin/developer'),
        pick('/superadmin/zawodnicy')
      ].filter(Boolean)
    },
    {
      title: 'Przejścia i operacje',
      items: [
        pick('/admin'),
        pick('/trainer'),
        pick('/athlete'),
        pick('/kalendarz')
      ].filter(Boolean)
    },
    {
      title: 'Narzędzia i treści',
      items: [
        pick('/admin/changelog'),
        pick('/trainer/wyniki'),
        pick('/trainer/dziennik'),
        pick('/trainer/exercises'),
        pick('/trainer/analiza-sztangi'),
        pick('/aktualnosci'),
        pick('/profil'),
        pick('/kalkulator-proporcji')
      ].filter(Boolean)
    }
  ] as const
})

function toneFromBg(bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red')) return 'error'
  if (s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('fuchsia') || s.includes('primary')) return 'primary'
  return 'neutral'
}
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <DashboardHero
      eyebrow="Superadministracja"
      :title="`Witaj, ${auth.user.value?.username || 'Superadminie'}!`"
      lead="Panel systemowy: role, bezpieczeństwo, narzędzia i szybkie przejścia."
      icon="i-lucide-crown"
      :badges="[
        { label: `Konta admin: ${adminsCount}`, color: 'neutral' },
        { label: `Zawodnicy: ${athletesCount}`, color: 'neutral' }
      ]"
      :actions="[
        { label: 'Konta i role', to: '/superadmin/administratorzy', icon: 'i-lucide-shield-alert', variant: 'soft', color: 'primary' },
        { label: 'Dev tools', to: '/superadmin/developer', icon: 'i-lucide-terminal', variant: 'outline', color: 'neutral' }
      ]"
    />

    <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
      <DashboardKpiCard label="Konta administracyjne" :value="adminsCount" icon="i-lucide-shield-check" tone="error" to="/superadmin/administratorzy" />
      <DashboardKpiCard label="Zawodnicy (aktywni)" :value="athletesCount" icon="i-lucide-users" tone="info" to="/superadmin/zawodnicy" />
      <DashboardKpiCard label="Wydarzenia (kalendarz)" :value="competitionsCount" icon="i-lucide-calendar" tone="primary" to="/kalendarz" />
    </div>

    <div class="mt-12 space-y-8">
      <div v-for="g in moduleGroups" :key="g.title">
        <div class="mb-3 flex items-end justify-between gap-3">
          <h2 class="text-xl font-semibold text-highlighted">
            {{ g.title }}
          </h2>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardModuleCard
            v-for="link in g.items"
            :key="String(link!.to)"
            :title="link!.title"
            :description="link!.description"
            :icon="link!.icon"
            :to="link!.to"
            :tone="toneFromBg(link!.bg)"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>

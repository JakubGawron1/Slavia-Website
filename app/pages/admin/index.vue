<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardModuleCard from '~/components/dashboard/DashboardModuleCard.vue'
import DashboardUrgentList from '~/components/dashboard/DashboardUrgentList.vue'

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
    color: 'text-info',
    bg: 'bg-info/12',
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
    color: 'text-success',
    bg: 'bg-success/12',
    trainerOnly: false
  },
  {
    title: 'Proporcje (ratio)',
    description: '„Złote proporcje” i widełki % między bojami',
    icon: 'i-lucide-sigma',
    to: '/kalkulator-proporcji',
    color: 'text-success',
    bg: 'bg-success/12',
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

const moduleGroups = computed(() => {
  const list = quickLinks.value
  const byTo = new Map<string, typeof list[number]>()
  for (const l of list) byTo.set(String(l.to), l)

  const pick = (to: string) => byTo.get(to)
  const isTrainerScope = !isPureAdmin.value
  return [
    {
      title: 'Najczęstsze',
      items: [
        pick('/admin/zawodnicy'),
        pick('/admin/konta'),
        pick('/admin/kontakt-wiadomosci'),
        pick('/admin/changelog')
      ].filter(Boolean)
    },
    {
      title: 'Treści publiczne',
      items: [
        pick('/aktualnosci'),
        pick('/ogloszenia'),
        pick('/galeria'),
        pick('/kontakt')
      ].filter(Boolean)
    },
    {
      title: 'Narzędzia',
      items: [
        pick('/kalendarz'),
        pick('/zawodnicy'),
        pick('/kalkulator-proporcji'),
        pick('/profil'),
        ...(isTrainerScope ? [pick('/trainer/wyniki'), pick('/trainer/dziennik'), pick('/trainer/analiza-sztangi')] : [])
      ].filter(Boolean)
    }
  ] as const
})

function toneFromBg(bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red')) return 'error'
  if (s.includes('rose')) return 'error'
  if (s.includes('orange')) return 'warning'
  if (s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('fuchsia')) return 'primary'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('primary')) return 'primary'
  return 'neutral'
}

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
    <DashboardHero
      eyebrow="Administracja"
      :title="`Witaj, ${auth.user.value?.username || 'Adminie'}!`"
      lead="Szybkie wejścia do modułów i lista rzeczy, które wymagają uwagi."
      icon="i-lucide-shield"
      :badges="[
        { label: `Wyniki do zatwierdzenia: ${pendingCount}`, color: pendingCount ? 'warning' : 'neutral' },
        { label: `Zawodnicy: ${athletesCount}`, color: 'neutral' }
      ]"
      :actions="[
        { label: 'Zawodnicy', to: '/admin/zawodnicy', icon: 'i-lucide-users', variant: 'soft', color: 'primary' },
        { label: 'Wiadomości', to: '/admin/kontakt-wiadomosci', icon: 'i-lucide-mail', variant: 'outline', color: 'neutral' }
      ]"
    />

    <!-- Statystyki — nad banerami i skrótami -->
    <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
      <DashboardKpiCard label="Zawodnicy (aktywni)" :value="athletesCount" icon="i-lucide-users" tone="info" to="/admin/zawodnicy" />
      <DashboardKpiCard
        label="Wyniki oczekujące"
        :value="pendingCount"
        icon="i-lucide-clipboard-clock"
        :tone="pendingCount ? 'warning' : 'info'"
        :to="{ path: '/admin', hash: '#wyniki-oczekujace' }"
      />
      <DashboardKpiCard label="Zaplanowane zawody" :value="competitionsCount" icon="i-lucide-calendar" tone="primary" to="/kalendarz" />
    </div>

    <!-- SuperAdmin Banner -->
    <div
      v-if="isSuperAdmin"
      class="mb-10 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 to-purple-500/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
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

    <div class="mt-10">
      <DashboardUrgentList
        title="Wyniki do zatwierdzenia"
        icon="i-lucide-clipboard-clock"
        :count="pendingCount"
        empty-text="Brak oczekujących zgłoszeń."
        :footer-link="{ label: 'Wszystkie starty / dodaj wpis', to: '/trainer/wyniki' }"
        :items="(pendingResults || []).slice(0, 6).map(r => ({
          key: r.id,
          title: labelForResult(r),
          subtitle: `Rwanie ${r.snatch} · Podrzut ${r.clean_and_jerk} · Razem ${r.total} · ${r.date.slice(0,10)}`,
          badge: { label: 'Pending', color: 'warning' },
          primaryAction: { label: 'Zatwierdź', onClick: () => { void approveResult(r.id) } }
        }))"
      >
        <template #actions>
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-ccw" @click="refreshPending()">Odśwież</UButton>
        </template>
      </DashboardUrgentList>
    </div>

    <div class="mt-12 space-y-8">
      <div v-for="g in moduleGroups" :key="g.title">
        <div class="mb-3 flex items-end justify-between gap-3">
          <h2 class="text-xl font-semibold text-highlighted">
            {{ g.title }}
          </h2>
        </div>
        <div class="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardModuleCard
            v-for="link in g.items"
            :key="String(link!.to)"
            :title="link!.title"
            :description="link!.description"
            :icon="link!.icon"
            :to="link!.to"
            :tone="toneFromBg(link!.bg)"
            :icon-wrapper-class="`${link!.bg} ${link!.color}`"
          />
        </div>
      </div>
    </div>

    <!-- Kotwica zachowana dla linków zewnętrznych -->
    <div id="wyniki-oczekujace" class="sr-only" />
  </UContainer>
</template>

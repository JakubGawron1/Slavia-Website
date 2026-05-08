<script setup lang="ts">
const props = defineProps<{
  /**
   * drawer — szuflada na węższych ekranach (trigger widoczny gdy rodzic nie ukrywa komponentu)
   * desktop-inline — jeden rząd: linki klubu + dropdown „Panel”
   */
  mode: 'drawer' | 'desktop-inline'
}>()

const auth = useAuth()
const route = useRoute()
const mobileDrawerOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileDrawerOpen.value = false
  }
)

async function logoutFromMenu() {
  mobileDrawerOpen.value = false
  auth.logout()
  await navigateTo('/')
}

type ManagementLink = {
  label: string
  to: string
  icon: string
  emphasis?: boolean
}

type PanelSection = {
  heading: string
  links: ManagementLink[]
}

/** Kalkulatory wydzielone do osobnego dropdownu „Kalkulatory” — żeby nie zaśmiecać
 *  głównego paska i zawsze mieścić się w jednym wierszu, niezależnie od szerokości ekranu. */
const calculatorLinks: ManagementLink[] = [
  { label: 'Kalkulator Sinclair', to: '/kalkulator-sinclair', icon: 'i-lucide-calculator' },
  { label: 'Kalkulator proporcji', to: '/kalkulator-proporcji', icon: 'i-lucide-sliders-horizontal' }
]

const items = computed(() => {
  // Główny pasek: same „strony klubu”. Świadomie ograniczone do 5–6 krótkich etykiet,
  // żeby nigdy nie powodować przewijania w poziomie ani ucinania ostatniego linku
  // (testowane na 1024 / 1280 / 1440 / 1920 px).
  const main = [
    ...(auth.isLoggedIn.value ? [{ label: 'Ogłoszenia', to: '/ogloszenia' }] : []),
    { label: 'Aktualności', to: '/aktualnosci' },
    { label: 'Galeria', to: '/galeria' },
    // „Wyniki” są dostępne jako sekcja na stronie „Zawodnicy” (#wyniki-zawodow) —
    // dlatego skracamy etykietę, najdłuższa pozycja w pasku to wąskie gardło.
    { label: 'Zawodnicy', to: '/zawodnicy' },
    { label: 'Kalendarz', to: '/kalendarz' },
    { label: 'Kontakt', to: '/kontakt' }
  ]

  const adminLinks: ManagementLink[] = []
  const athleteLinks: ManagementLink[] = []
  const accountLinks: ManagementLink[] = []

  if (!auth.isLoggedIn.value) {
    return { main, panelSections: [] as PanelSection[] }
  }

  const r = new Set(auth.user.value?.roles ?? [])
  const hasSA = r.has('SuperAdmin')
  const hasAdmin = r.has('Admin')
  const hasTrainer = r.has('Trainer')
  const hasAthlete = r.has('Athlete')

  const needsAdminDashboard = hasSA || hasAdmin
  const showTrainerPanel = hasSA || hasTrainer

  let emphasisPending = true
  const pushLink = (bucket: ManagementLink[], link: ManagementLink) => {
    if (emphasisPending) {
      link.emphasis = true
      emphasisPending = false
    }
    bucket.push(link)
  }

  if (hasSA) {
    pushLink(adminLinks, { label: 'Panel SuperAdmin', to: '/superadmin', icon: 'i-lucide-shield-check' })
  }

  if (needsAdminDashboard) {
    pushLink(adminLinks, { label: 'Panel admina', to: '/admin', icon: 'i-lucide-layout-dashboard' })
  }

  if (showTrainerPanel) {
    pushLink(adminLinks, { label: 'Panel trenera', to: '/trainer', icon: 'i-lucide-dumbbell' })
  }

  if (hasAthlete || hasSA) {
    pushLink(athleteLinks, { label: 'Profil zawodnika', to: '/athlete', icon: 'i-lucide-user' })
    athleteLinks.push({ label: 'Składka klubowa', to: '/athlete/skladki', icon: 'i-lucide-banknote' })
    athleteLinks.push({ label: 'Mój kalendarz', to: '/athlete/kalendarz', icon: 'i-lucide-calendar-days' })
    athleteLinks.push({ label: 'Dziennik', to: '/dziennik', icon: 'i-lucide-book-open' })
    athleteLinks.push({ label: 'Inne ćwiczenia', to: '/athlete/exercises', icon: 'i-lucide-bar-chart-3' })
  }

  if (showTrainerPanel) {
    adminLinks.push({ label: 'Składki klubowe', to: '/trainer/skladki', icon: 'i-lucide-banknote' })
    adminLinks.push({ label: 'Ćwiczenia kadry', to: '/trainer/exercises', icon: 'i-lucide-clipboard-list' })
  }

  pushLink(accountLinks, {
    label: 'Ustawienia konta',
    to: '/profil',
    icon: 'i-lucide-user-circle'
  })

  const panelSections: PanelSection[] = []
  if (adminLinks.length) {
    panelSections.push({ heading: 'Administracja i kadra', links: adminLinks })
  }
  if (athleteLinks.length) {
    panelSections.push({ heading: 'Panel zawodnika', links: athleteLinks })
  }
  if (accountLinks.length) {
    panelSections.push({ heading: 'Konto', links: accountLinks })
  }

  return { main, panelSections }
})

/** Dropdown „Panel” — grupy: kadra / zawodnik / konto. */
const panelDropdownItems = computed(() =>
  items.value.panelSections.map(section => [
    { type: 'label' as const, label: section.heading },
    ...section.links.map(link => ({
      label: link.label,
      icon: link.icon,
      to: link.to,
      ...(link.emphasis ? { color: 'primary' as const } : {})
    }))
  ])
)

/** Dropdown „Kalkulatory” — Sinclair + Proporcje, dostępny dla wszystkich (publiczny). */
const calculatorDropdownItems = [
  calculatorLinks.map(link => ({
    label: link.label,
    icon: link.icon,
    to: link.to
  }))
]
</script>

<template>
  <div
    v-if="props.mode === 'desktop-inline'"
    class="flex min-w-0 flex-1 items-center gap-2 xl:gap-3"
  >
    <nav
      class="flex min-h-10 min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-visible overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] py-0.5 [&::-webkit-scrollbar]:hidden"
      aria-label="Strony klubu"
    >
      <NuxtLink
        v-for="link in items.main"
        :key="'nav-' + link.to"
        :to="link.to"
        class="inline-flex shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-muted/70 hover:text-highlighted xl:px-3 xl:text-sm"
        active-class="bg-primary/14 font-semibold text-primary"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>

    <div class="flex shrink-0 items-center gap-1.5 xl:gap-2">
      <UDropdownMenu
        :modal="false"
        :items="calculatorDropdownItems"
        :content="{ align: 'end', collisionPadding: 16 }"
        :ui="{ content: 'min-w-[15rem]' }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-calculator"
          trailing-icon="i-lucide-chevron-down"
          class="h-9 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs font-bold uppercase tracking-wide xl:h-10 xl:px-3 xl:text-[13px]"
          aria-label="Kalkulatory"
        >
          <span class="hidden xl:inline">Kalkulatory</span>
        </UButton>
      </UDropdownMenu>

      <UDropdownMenu
        v-if="items.panelSections.length > 0"
        :modal="false"
        :items="panelDropdownItems"
        :content="{ align: 'end', collisionPadding: 16 }"
        :ui="{ content: 'min-w-[14rem]' }"
      >
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-layout-grid"
          trailing-icon="i-lucide-chevron-down"
          class="h-9 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs font-bold uppercase tracking-wide xl:h-10 xl:px-3.5 xl:text-[13px]"
          aria-label="Panel"
        >
          <span class="hidden xl:inline">Panel</span>
        </UButton>
      </UDropdownMenu>
    </div>
  </div>

  <div
    v-else-if="props.mode === 'drawer'"
    class="inline-flex"
  >
    <UDrawer
      v-model:open="mobileDrawerOpen"
      title="Menu Slavia"
    >
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        size="lg"
        square
        class="rounded-xl"
        aria-label="Otwórz menu"
      />

      <template #body>
        <nav
          class="flex flex-col gap-4 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-4"
          aria-label="Menu mobilne"
        >
          <NuxtLink
            to="/"
            class="flex min-h-13 items-center justify-between rounded-2xl border border-default/60 bg-muted/15 px-4 py-3 text-base font-bold text-highlighted ring-1 ring-transparent transition-colors hover:border-primary/35 hover:bg-primary/5"
            active-class="border-primary/45 bg-primary/10 ring-primary/20"
          >
            <span class="flex items-center gap-3">
              <span class="flex size-9 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-default/60">
                <UIcon name="i-lucide-home" class="size-4" />
              </span>
              Strona główna
            </span>
            <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
          </NuxtLink>

          <div class="rounded-2xl border border-default/50 bg-muted/10 p-2 ring-1 ring-default/30">
            <p class="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Strony klubu
            </p>
            <div class="flex flex-col gap-1">
              <UButton
                v-for="link in items.main"
                :key="'drawer-main-' + link.to"
                :to="link.to"
                variant="ghost"
                color="neutral"
                block
                class="min-h-11 justify-between rounded-xl px-2 text-[15px] font-semibold"
              >
                <span>{{ link.label }}</span>
                <UIcon name="i-lucide-arrow-right" class="size-4 shrink-0 text-muted opacity-60" />
              </UButton>
            </div>
          </div>

          <div class="rounded-2xl border border-default/50 bg-muted/10 p-2 ring-1 ring-default/30">
            <p class="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Kalkulatory
            </p>
            <div class="flex flex-col gap-1">
              <UButton
                v-for="link in calculatorLinks"
                :key="'drawer-tools-' + link.to"
                :to="link.to"
                :icon="link.icon"
                variant="outline"
                color="neutral"
                block
                class="min-h-11 justify-start rounded-xl border-default/60 font-semibold shadow-none text-highlighted"
                active-class="border-primary bg-primary/15 text-primary ring-1 ring-primary/25"
              >
                {{ link.label }}
              </UButton>
            </div>
          </div>

          <template v-if="items.panelSections.length > 0">
            <template
              v-for="section in items.panelSections"
              :key="section.heading"
            >
              <div class="rounded-2xl border border-primary/15 bg-primary/4 p-2 ring-1 ring-primary/10 dark:bg-primary/10">
                <p class="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {{ section.heading }}
                </p>
                <div class="flex flex-col gap-1">
                  <UButton
                    v-for="link in section.links"
                    :key="link.to + section.heading"
                    :to="link.to"
                    :icon="link.icon"
                    variant="outline"
                    color="neutral"
                    block
                    class="min-h-11 justify-start rounded-xl border-default/60 font-semibold shadow-none"
                    :class="
                      link.emphasis
                        ? 'border-primary/45 bg-primary/10 text-primary'
                        : 'text-highlighted'
                    "
                    active-class="border-primary bg-primary/18 text-primary ring-1 ring-primary/25"
                  >
                    {{ link.label }}
                  </UButton>
                </div>
              </div>
            </template>
          </template>

          <template v-if="!auth.isLoggedIn.value">
            <UButton
              to="/logowanie"
              icon="i-lucide-log-in"
              size="lg"
              block
              class="min-h-12 rounded-2xl justify-center font-bold"
            >
              Zaloguj się
            </UButton>
          </template>
          <template v-else>
            <div class="rounded-2xl border border-default/60 bg-linear-to-br from-muted/40 to-muted/15 px-4 py-4 ring-1 ring-default/35">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                Zalogowany jako
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <p class="min-w-0 truncate text-lg font-bold text-highlighted">
                  {{ auth.user.value?.username }}
                </p>
                <UBadge
                  size="sm"
                  variant="subtle"
                  color="primary"
                  class="shrink-0 font-semibold"
                >
                  {{ auth.rolesDisplayShort }}
                </UBadge>
              </div>
            </div>
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-log-out"
              size="lg"
              block
              class="min-h-12 rounded-2xl justify-center font-semibold"
              @click="logoutFromMenu"
            >
              Wyloguj
            </UButton>
          </template>
        </nav>
      </template>
    </UDrawer>
  </div>
</template>

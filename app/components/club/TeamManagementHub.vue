<script setup lang="ts">
const props = withDefaults(defineProps<{
  area?: 'admin' | 'superadmin' | 'trainer'
  defaultTab?: 'players' | 'accounts'
}>(), {
  area: 'admin',
  defaultTab: 'players'
})

const auth = useAuth()
const route = useRoute()
const router = useRouter()

type TabId = 'players' | 'accounts'

const tab = computed<TabId>({
  get() {
    const q = String(route.query.tab || '')
    if (q === 'accounts' || q === 'konta') return 'accounts'
    if (q === 'players' || q === 'zawodnicy') return 'players'
    return props.defaultTab
  },
  set(value: TabId) {
    router.replace({ query: { ...route.query, tab: value } })
  }
})

type TabDef = { id: TabId, label: string, icon: string, hint: string }

const tabs = computed((): TabDef[] => {
  const base: TabDef[] = [
    { id: 'players', label: 'Zawodnicy', icon: 'i-lucide-users', hint: 'Profile sportowe, PZPC, przypisania startów' }
  ]
  if (props.area === 'trainer') {
    base.push({
      id: 'accounts',
      label: 'Konta zawodników',
      icon: 'i-lucide-key-round',
      hint: 'Podgląd powiązań — tworzenie loginu w edycji zawodnika'
    })
  } else {
    base.push({
      id: 'accounts',
      label: 'Konta logowania',
      icon: 'i-lucide-key-round',
      hint: 'Login, hasło, role, powiązanie z profilem'
    })
  }
  return base
})

const headerCopy = computed(() => {
  if (props.area === 'superadmin') {
    return {
      title: 'Zespół i konta',
      description: 'Profile zawodników oraz konta systemowe — jeden widok z przełącznikiem zakładek.'
    }
  }
  if (props.area === 'trainer') {
    return {
      title: 'Zespół i konta',
      description: 'Zawodnicy klubu i ich konta logowania — w jednym module, bez osobnych stron.'
    }
  }
  return {
    title: 'Zespół i konta',
    description: 'Zarządzaj zawodnikami i kontami kadry w jednym miejscu.'
  }
})

const showAdminsManager = computed(
  () => props.area !== 'trainer' && (auth.isAdmin.value || auth.isSuperAdmin.value)
)

const AdminsManagerLazy = defineAsyncComponent({
  loader: () => import('~/components/club/AdminsManager.vue'),
  delay: 80,
  timeout: 120_000
})

const breadcrumbs = computed(() => {
  if (props.area === 'trainer') {
    return [
      { label: 'Panel trenera', to: '/trainer', icon: 'i-lucide-dumbbell' },
      { label: 'Zespół i konta', icon: 'i-lucide-users-round' }
    ]
  }
  if (props.area === 'superadmin') {
    return [
      { label: 'SuperAdmin', to: '/superadmin', icon: 'i-lucide-shield-check' },
      { label: 'Zespół i konta', icon: 'i-lucide-users-round' }
    ]
  }
  return [
    { label: 'Administracja', to: '/admin', icon: 'i-lucide-shield' },
    { label: 'Zespół i konta', icon: 'i-lucide-users-round' }
  ]
})
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      :area="area === 'trainer' ? 'trainer' : area"
      :tone="area === 'superadmin' ? 'superadmin' : undefined"
      :title="headerCopy.title"
      icon="i-lucide-users-round"
      :description="headerCopy.description"
      :breadcrumbs="breadcrumbs"
    >
      <template v-if="area === 'trainer'" #actions>
        <UButton to="/trainer" variant="soft" color="neutral" size="sm" icon="i-lucide-layout-dashboard">
          Panel
        </UButton>
      </template>
    </PanelPageHeader>

    <nav
      class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
      aria-label="Sekcje zespołu"
    >
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="group flex min-h-[4.75rem] flex-col rounded-2xl border px-4 py-3.5 text-left shadow-sm ring-1 transition duration-200"
        :class="tab === t.id
          ? 'border-primary/45 bg-primary/10 ring-primary/25'
          : 'border-default/60 bg-card/85 ring-default/15 hover:border-primary/25 hover:bg-muted/10'"
        @click="tab = t.id"
      >
        <span class="flex items-center gap-2.5 font-bold text-highlighted">
          <span
            class="flex size-9 items-center justify-center rounded-xl ring-1 ring-inset ring-current/10"
            :class="tab === t.id ? 'bg-primary/15 text-primary' : 'bg-muted/15 text-muted group-hover:text-primary'"
          >
            <UIcon :name="t.icon" class="size-4" />
          </span>
          {{ t.label }}
        </span>
        <span class="mt-1.5 pl-[2.875rem] text-xs leading-snug text-muted">{{ t.hint }}</span>
      </button>
    </nav>

    <div v-show="tab === 'players'">
      <ClubPlayersManager />
    </div>
    <div v-if="tab === 'accounts'">
      <ClubTrainerTeamAccountsPanel v-if="area === 'trainer'" />
      <Suspense v-else-if="showAdminsManager">
        <AdminsManagerLazy />
        <template #fallback>
          <div class="flex justify-center py-16 text-muted">
            <UIcon
              name="i-lucide-loader-2"
              class="size-8 animate-spin"
            />
          </div>
        </template>
      </Suspense>
    </div>
  </PanelPageLayout>
</template>

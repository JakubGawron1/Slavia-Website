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
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      :area="area === 'trainer' ? 'trainer' : area"
      :tone="area === 'superadmin' ? 'superadmin' : undefined"
      :title="headerCopy.title"
      icon="i-lucide-users-round"
      :description="headerCopy.description"
    />

    <nav
      class="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      aria-label="Sekcje zespołu"
    >
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="group flex min-h-11 flex-1 flex-col rounded-2xl border px-4 py-3 text-left transition sm:min-w-48 sm:max-w-md"
        :class="tab === t.id
          ? 'border-primary/45 bg-primary/10 shadow-sm ring-1 ring-primary/25'
          : 'border-default/60 bg-card/80 hover:border-primary/25 hover:bg-muted/10'"
        @click="tab = t.id"
      >
        <span class="flex items-center gap-2 font-bold text-highlighted">
          <UIcon :name="t.icon" class="size-4 text-primary" />
          {{ t.label }}
        </span>
        <span class="mt-1 text-xs text-muted">{{ t.hint }}</span>
      </button>
    </nav>

    <div v-show="tab === 'players'">
      <ClubPlayersManager />
    </div>
    <div v-show="tab === 'accounts'">
      <ClubTrainerTeamAccountsPanel v-if="area === 'trainer'" />
      <ClubAdminsManager v-else-if="showAdminsManager" />
    </div>
  </PanelPageLayout>
</template>

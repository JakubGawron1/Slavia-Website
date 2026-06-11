<script setup lang="ts">
import type { AdminAccount, GroupedAdminAccounts } from '~/types/models'
import {
  PANEL_NAV_MODULES,
  PANEL_NAV_ROLE_LABELS,
  PANEL_NAV_ROLE_SHORT,
  panelNavModulesForUserRoles,
  panelNavModuleInSiteNavbar,
  panelNavSharedInOtherPanels,
  type PanelNavRole
} from '~/data/panelNavigationCatalog'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Nawigacja paneli — Superadmin',
  robots: 'noindex, nofollow'
})

const toast = useToast()
const apiFetch = useApi()
const panelNav = usePanelNavigationFlags()

await panelNav.hydrateFromApi(true)

const activeTab = ref<'global' | 'account'>('global')
const roles: PanelNavRole[] = ['athlete', 'trainer', 'admin']
const activeGlobalRole = ref<PanelNavRole>('admin')
const activeAccountRole = ref<PanelNavRole>('athlete')

const globalRoleTabItems = computed(() =>
  roles.map(role => ({
    label: PANEL_NAV_ROLE_LABELS[role],
    value: role,
    icon: role === 'athlete' ? 'i-lucide-user' : role === 'trainer' ? 'i-lucide-whistle' : 'i-lucide-shield'
  }))
)

const selectedAccountId = ref('')
const loadingAccountOverrides = ref(false)

const { data: groupedAccounts } = await useAsyncData(
  'panel-nav-accounts',
  () => apiFetch<GroupedAdminAccounts>('/api/admins/grouped').catch(() => ({
    admins: [],
    trainers: [],
    athletes: []
  }))
)

type AccountOption = { id: string, label: string, roles: string[], search: string }

const accountOptions = computed((): AccountOption[] => {
  const seen = new Set<string>()
  const rows: AccountOption[] = []
  const buckets = [
    ...(groupedAccounts.value?.admins ?? []),
    ...(groupedAccounts.value?.trainers ?? []),
    ...(groupedAccounts.value?.athletes ?? [])
  ] as AdminAccount[]
  for (const a of buckets) {
    if (!a?.id || seen.has(a.id)) continue
    seen.add(a.id)
    const roleLabels = (a.roles ?? []).join(', ')
    rows.push({
      id: a.id,
      label: `${a.username} (${roleLabels || 'brak ról'})`,
      roles: a.roles ?? [],
      search: `${a.username} ${roleLabels}`.toLowerCase()
    })
  }
  return rows.sort((x, y) => x.label.localeCompare(y.label, 'pl'))
})

const selectedAccount = computed(() =>
  selectedAccountId.value
    ? accountOptions.value.find(a => a.id === selectedAccountId.value) ?? null
    : null
)

const modulesByRole = computed(() => {
  const map = new Map<PanelNavRole, typeof PANEL_NAV_MODULES>()
  for (const role of roles) {
    map.set(role, PANEL_NAV_MODULES.filter(m => m.role === role))
  }
  return map
})

const accountModules = computed(() => {
  if (!selectedAccount.value) return []
  return panelNavModulesForUserRoles(selectedAccount.value.roles)
})

const accountRoleTabItems = computed(() => {
  const present = new Set(accountModules.value.map(m => m.role))
  return roles
    .filter(role => present.has(role))
    .map(role => ({
      label: PANEL_NAV_ROLE_LABELS[role],
      value: role,
      icon: role === 'athlete' ? 'i-lucide-user' : role === 'trainer' ? 'i-lucide-whistle' : 'i-lucide-shield'
    }))
})

const accountModulesForActiveRole = computed(() =>
  accountModules.value.filter(m => m.role === activeAccountRole.value)
)

function groupedBySection(role: PanelNavRole) {
  const modules = modulesByRole.value.get(role) ?? []
  const groups = new Map<string, typeof modules>()
  for (const mod of modules) {
    const list = groups.get(mod.group) ?? []
    list.push(mod)
    groups.set(mod.group, list)
  }
  return [...groups.entries()]
}

function groupedAccountModules(mods = accountModulesForActiveRole.value) {
  const groups = new Map<string, typeof mods>()
  for (const mod of mods) {
    const list = groups.get(mod.group) ?? []
    list.push(mod)
    groups.set(mod.group, list)
  }
  return [...groups.entries()]
}

function sharedLabel(mod: (typeof PANEL_NAV_MODULES)[number]): string {
  return panelNavSharedInOtherPanels(mod)
    .map(r => PANEL_NAV_ROLE_SHORT[r])
    .join(', ')
}

watch(accountRoleTabItems, items => {
  if (!items.length) return
  if (!items.some(i => i.value === activeAccountRole.value)) {
    activeAccountRole.value = items[0]!.value as PanelNavRole
  }
})

watch(selectedAccountId, async id => {
  if (!id?.trim()) {
    panelNav.clearManagedUserOverrides()
    return
  }
  const items = accountRoleTabItems.value
  if (items.length) {
    activeAccountRole.value = items[0]!.value as PanelNavRole
  }
  loadingAccountOverrides.value = true
  try {
    await panelNav.loadManagedUserOverrides(id)
  } catch (e: unknown) {
    toast.add({
      title: 'Nie udało się wczytać nadpisań konta',
      description: e instanceof Error ? e.message : 'Spróbuj ponownie.',
      color: 'error'
    })
  } finally {
    loadingAccountOverrides.value = false
  }
})

async function onToggleGlobal(flagId: string, enabled: boolean) {
  try {
    await panelNav.setFlag(flagId, enabled, { type: 'global' })
    toast.add({
      title: enabled ? 'Moduł włączony globalnie' : 'Moduł wyłączony globalnie',
      color: enabled ? 'success' : 'neutral'
    })
  } catch (e: unknown) {
    toast.add({
      title: 'Nie udało się zapisać',
      description: e instanceof Error ? e.message : 'Spróbuj ponownie.',
      color: 'error'
    })
  }
}

async function onToggleAccount(flagId: string, enabled: boolean) {
  const userId = selectedAccountId.value
  if (!userId) return
  try {
    await panelNav.setFlag(flagId, enabled, { type: 'user', userId })
    toast.add({
      title: enabled ? 'Włączone dla konta' : 'Wyłączone dla konta',
      color: enabled ? 'success' : 'neutral'
    })
  } catch (e: unknown) {
    toast.add({
      title: 'Nie udało się zapisać',
      description: e instanceof Error ? e.message : 'Spróbuj ponownie.',
      color: 'error'
    })
  }
}

async function onResetAccount(flagId: string) {
  const userId = selectedAccountId.value
  if (!userId) return
  try {
    await panelNav.clearUserFlag(flagId, userId)
    toast.add({ title: 'Przywrócono ustawienie globalne', color: 'neutral' })
  } catch (e: unknown) {
    toast.add({
      title: 'Nie udało się usunąć nadpisania',
      description: e instanceof Error ? e.message : 'Spróbuj ponownie.',
      color: 'error'
    })
  }
}

function accountEffectiveEnabled(flagId: string): boolean {
  const userId = selectedAccountId.value
  if (!userId) return true
  return panelNav.effectiveEnabled(flagId, userId)
}

function accountHasOverride(flagId: string): boolean {
  const userId = selectedAccountId.value
  if (!userId) return false
  return panelNav.userOverrideValue(flagId, userId) !== null
}

const enabledCount = computed(() => {
  let on = 0
  for (const def of PANEL_NAV_MODULES) {
    if (panelNav.rawGlobalEnabled(def.id)) on++
  }
  return { on, total: PANEL_NAV_MODULES.length }
})
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      eyebrow="Konfiguracja"
      title="Nawigacja paneli"
      icon="i-lucide-layout-grid"
      description="Ta sama strona (np. czat) może być w kilku panelach — każdy panel ma osobny przełącznik. Dodatkowo możesz nadpisać widoczność dla wybranego konta."
    >
      <template #actions>
        <UButton
          to="/superadmin"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
        >
          Panel
        </UButton>
      </template>
    </PanelPageHeader>

    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      class="mb-4 rounded-2xl"
      title="Priorytet ustawień"
      description="Dla danego konta: najpierw nadpisanie per konto, potem ustawienie globalne panelu, na końcu domyślnie włączone. Wyłączenie czatu tylko w panelu zawodnika nie wpływa na panel trenera. Moduły oznaczone „Navbar” znikają też z głównej belki nawigacji (oraz menu Panel / kalkulatory, gdy URL się pokrywa)."
    />

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UBadge color="primary" variant="subtle">
        {{ enabledCount.on }} / {{ enabledCount.total }} włączonych globalnie
      </UBadge>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="!panelNav.hydratedFromApi.value"
        @click="panelNav.hydrateFromApi(true)"
      >
        Odśwież z API
      </UButton>
    </div>

    <UTabs
      v-model="activeTab"
      :items="[
        { label: 'Globalnie (per panel)', value: 'global', icon: 'i-lucide-layout-grid' },
        { label: 'Nadpisanie konta', value: 'account', icon: 'i-lucide-user-cog' }
      ]"
      class="mb-4"
    />

    <div v-if="activeTab === 'global'" class="space-y-4">
      <UTabs
        v-model="activeGlobalRole"
        :items="globalRoleTabItems"
        class="sticky top-0 z-10 rounded-2xl border border-default/50 bg-background/95 p-1 backdrop-blur-md"
      />

      <section
        :key="activeGlobalRole"
        class="overflow-hidden rounded-2xl border border-default/60 bg-card/80 shadow-sm ring-1 ring-default/20"
      >
        <header class="border-b border-default/50 bg-muted/8 px-4 py-3 sm:px-5">
          <h2 class="text-sm font-bold text-highlighted">
            {{ PANEL_NAV_ROLE_LABELS[activeGlobalRole] }}
          </h2>
          <p class="mt-0.5 text-[11px] text-muted">
            Flagi <code class="font-mono text-[10px] text-primary">panel_nav_{{ activeGlobalRole }}_*</code> — tylko ten panel.
          </p>
        </header>

        <div class="divide-y divide-default/40">
          <div
            v-for="[groupTitle, mods] in groupedBySection(activeGlobalRole)"
            :key="`${activeGlobalRole}-${groupTitle}`"
            class="px-4 py-3 sm:px-5"
          >
            <h3 class="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              {{ groupTitle }}
            </h3>
            <ul class="space-y-2">
              <li
                v-for="mod in mods"
                :key="mod.id"
                class="flex items-start justify-between gap-3 rounded-xl border border-default/40 bg-muted/5 px-3 py-2.5 transition-colors hover:border-primary/20 hover:bg-primary/5"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-current/10"
                      :class="`${mod.bg} ${mod.color}`"
                    >
                      <UIcon :name="mod.icon" class="size-4" />
                    </span>
                    <span class="text-sm font-semibold text-highlighted">{{ mod.title }}</span>
                    <UBadge
                      v-if="!panelNav.rawGlobalEnabled(mod.id)"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                      icon="i-lucide-eye-off"
                    >
                      Wyłączony
                    </UBadge>
                    <UBadge
                      v-if="sharedLabel(mod)"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      Też w: {{ sharedLabel(mod) }}
                    </UBadge>
                    <UBadge
                      v-if="panelNavModuleInSiteNavbar(mod)"
                      color="info"
                      variant="subtle"
                      size="xs"
                      icon="i-lucide-panel-top"
                    >
                      Navbar
                    </UBadge>
                    <UBadge
                      v-if="mod.gateRoute"
                      color="warning"
                      variant="subtle"
                      size="xs"
                      icon="i-lucide-shield"
                    >
                      Blokada URL
                    </UBadge>
                  </div>
                  <p class="mt-0.5 text-[11px] text-muted">
                    {{ mod.description }}
                  </p>
                  <p class="mt-1 font-mono text-[10px] text-muted">
                    {{ mod.to }}
                  </p>
                </div>
                <USwitch
                  :model-value="panelNav.rawGlobalEnabled(mod.id)"
                  :loading="panelNav.isSaving(mod.id, { type: 'global' })"
                  :aria-label="`Włącz globalnie ${mod.title}`"
                  class="shrink-0"
                  @update:model-value="onToggleGlobal(mod.id, $event)"
                />
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="space-y-4">
      <UCard class="rounded-2xl border border-default/60 p-4 sm:p-5">
        <label class="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted">
          Konto użytkownika
        </label>
        <USelect
          v-model="selectedAccountId"
          size="lg"
          icon="i-lucide-user-cog"
          placeholder="Wybierz konto…"
          class="w-full max-w-xl font-medium"
          :items="[
            { label: '— Wybierz konto —', value: '' },
            ...accountOptions.map(a => ({ label: a.label, value: a.id }))
          ]"
        />
        <p v-if="selectedAccount" class="mt-2 text-[11px] text-muted">
          Panele tego konta:
          <span class="font-semibold text-highlighted">
            {{ panelNavModulesForUserRoles(selectedAccount.roles).map(m => PANEL_NAV_ROLE_SHORT[m.role]).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '—' }}
          </span>
        </p>
      </UCard>

      <UAlert
        v-if="!selectedAccountId"
        color="neutral"
        variant="subtle"
        icon="i-lucide-user-search"
        title="Wybierz konto"
        description="Po wyborze zobaczysz moduły z paneli przypisanych do ról tego użytkownika. Przełącznik nadpisuje globalne ustawienie tylko dla niego."
      />

      <section
        v-else-if="accountModules.length === 0"
        class="rounded-2xl border border-dashed border-default/60 p-6 text-center text-sm text-muted"
      >
        To konto nie ma ról panelowych (Admin / Trener / Zawodnik).
      </section>

      <template v-else>
        <UTabs
          v-if="accountRoleTabItems.length > 1"
          v-model="activeAccountRole"
          :items="accountRoleTabItems"
          class="rounded-2xl border border-default/50 bg-muted/5 p-1"
        />

        <section
          class="overflow-hidden rounded-2xl border border-default/60 bg-card/80 shadow-sm ring-1 ring-default/20"
        >
        <header class="border-b border-default/50 bg-muted/8 px-4 py-3 sm:px-5">
          <h2 class="text-sm font-bold text-highlighted">
            Nadpisania dla {{ selectedAccount?.label }}
            <span class="font-normal text-muted">· {{ PANEL_NAV_ROLE_LABELS[activeAccountRole] }}</span>
          </h2>
          <p class="mt-0.5 text-[11px] text-muted">
            Odznacz „dziedzicz” przywraca ustawienie globalne panelu.
          </p>
        </header>

        <div v-if="loadingAccountOverrides" class="p-6 text-center text-sm text-muted">
          Wczytywanie nadpisań…
        </div>

        <div v-else class="divide-y divide-default/40">
          <div
            v-for="[groupTitle, mods] in groupedAccountModules()"
            :key="groupTitle"
            class="px-4 py-3 sm:px-5"
          >
            <h3 class="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              {{ groupTitle }}
            </h3>
            <ul class="space-y-2">
              <li
                v-for="mod in mods"
                :key="mod.id"
                class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-default/40 bg-muted/5 px-3 py-2.5 transition-colors hover:border-primary/20 hover:bg-primary/5"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-current/10"
                      :class="`${mod.bg} ${mod.color}`"
                    >
                      <UIcon :name="mod.icon" class="size-4" />
                    </span>
                    <span class="text-sm font-semibold text-highlighted">{{ mod.title }}</span>
                    <UBadge
                      v-if="accountHasOverride(mod.id)"
                      color="primary"
                      variant="subtle"
                      size="xs"
                    >
                      Nadpisane
                    </UBadge>
                    <UBadge
                      v-else
                      color="neutral"
                      variant="subtle"
                      size="xs"
                    >
                      Dziedziczy globalne ({{ panelNav.rawGlobalEnabled(mod.id) ? 'wł.' : 'wył.' }})
                    </UBadge>
                    <UBadge
                      v-if="panelNavModuleInSiteNavbar(mod)"
                      color="info"
                      variant="subtle"
                      size="xs"
                      icon="i-lucide-panel-top"
                    >
                      Navbar
                    </UBadge>
                  </div>
                  <p class="mt-0.5 font-mono text-[10px] text-muted">
                    {{ mod.to }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <UButton
                    v-if="accountHasOverride(mod.id)"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-undo-2"
                    :loading="panelNav.isSaving(mod.id, { type: 'user', userId: selectedAccountId! })"
                    @click="onResetAccount(mod.id)"
                  >
                    Dziedzicz
                  </UButton>
                  <USwitch
                    :model-value="accountEffectiveEnabled(mod.id)"
                    :loading="panelNav.isSaving(mod.id, { type: 'user', userId: selectedAccountId! })"
                    :aria-label="`Włącz ${mod.title} dla konta`"
                    @update:model-value="onToggleAccount(mod.id, $event)"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
        </section>
      </template>
    </div>
  </PanelPageLayout>
</template>

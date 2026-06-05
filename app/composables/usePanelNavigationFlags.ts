import {
  PANEL_NAV_FLAG_PREFIX,
  PANEL_NAV_MODULES,
  PANEL_NAV_ROLE_LABELS,
  buildPanelModuleGroups,
  panelNavModulesForNavPath,
  panelNavModulesForRole,
  panelNavNormalizePath,
  type PanelModuleGroup,
  type PanelNavRole
} from '~/data/panelNavigationCatalog'
import { cmsNavGroupsFromItems } from '~/composables/useCmsDashboardNav'

const GLOBAL_OVERRIDES_KEY = 'slavia-panel-nav-global'
const USER_OVERRIDES_KEY = 'slavia-panel-nav-user'
const MANAGED_USER_OVERRIDES_KEY = 'slavia-panel-nav-managed-user'
const HYDRATED_FROM_API_KEY = 'slavia-panel-nav-hydrated-api'

type RemoteFlag = {
  name: string
  value: boolean
  user_id?: string | null
  updated_at: string
}

export type PanelNavFlagScope =
  | { type: 'global' }
  | { type: 'user', userId: string }

const normalizePath = panelNavNormalizePath

function userHasRole(roles: string[], role: PanelNavRole): boolean {
  if (role === 'admin') return roles.includes('Admin') || roles.includes('SuperAdmin')
  if (role === 'trainer') return roles.includes('Trainer') || roles.includes('SuperAdmin')
  if (role === 'athlete') return roles.includes('Athlete') || roles.includes('SuperAdmin')
  return false
}

function parsePanelNavRows(rows: RemoteFlag[], userId?: string | null): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const row of rows || []) {
    if (!row.name.startsWith(PANEL_NAV_FLAG_PREFIX)) continue
    const rowUser = row.user_id?.trim() || null
    if (userId === undefined) {
      if (rowUser) continue
    } else if (rowUser !== userId) {
      continue
    }
    out[row.name] = !!row.value
  }
  return out
}

export function usePanelNavigationFlags() {
  const auth = useAuth()
  const globalOverrides = useState<Record<string, boolean>>(GLOBAL_OVERRIDES_KEY, () => ({}))
  const userOverrides = useState<Record<string, boolean>>(USER_OVERRIDES_KEY, () => ({}))
  const managedUserOverrides = useState<Record<string, boolean>>(MANAGED_USER_OVERRIDES_KEY, () => ({}))
  const hydratedFromApi = useState<boolean>(HYDRATED_FROM_API_KEY, () => false)
  const savingKeys = useState<Set<string>>('slavia-panel-nav-saving', () => new Set())

  const bypassFilter = computed(() => auth.isSuperAdmin.value)

  function savingKey(flagId: string, scope: PanelNavFlagScope): string {
    if (scope.type === 'global') return `g:${flagId}`
    return `u:${scope.userId}:${flagId}`
  }

  function isSaving(flagId: string, scope: PanelNavFlagScope = { type: 'global' }): boolean {
    return savingKeys.value.has(savingKey(flagId, scope))
  }

  function rawGlobalEnabled(flagId: string): boolean {
    if (flagId in globalOverrides.value) return globalOverrides.value[flagId] === true
    return true
  }

  function overridesForUser(userId: string): Record<string, boolean> {
    if (userId === auth.user.value?.id) return userOverrides.value
    return managedUserOverrides.value
  }

  function userOverrideValue(flagId: string, userId: string): boolean | null {
    const map = overridesForUser(userId)
    if (flagId in map) return map[flagId] === true
    return null
  }

  /** Efektywna widoczność: nadpisanie konta → globalne → domyślnie włączone. */
  function effectiveEnabled(flagId: string, userId?: string): boolean {
    const uid = userId ?? auth.user.value?.id
    if (uid) {
      const map = overridesForUser(uid)
      if (flagId in map) return map[flagId] === true
    }
    return rawGlobalEnabled(flagId)
  }

  /** Widoczność na dashboardzie (SuperAdmin omija filtr). */
  function isEnabled(flagId: string): boolean {
    if (bypassFilter.value) return true
    return effectiveEnabled(flagId)
  }

  function rawIsEnabled(flagId: string): boolean {
    return rawGlobalEnabled(flagId)
  }

  function enabledMap(): Record<string, boolean> {
    const map: Record<string, boolean> = {}
    for (const def of PANEL_NAV_MODULES) {
      map[def.id] = isEnabled(def.id)
    }
    return map
  }

  function filterModuleGroups(role: PanelNavRole, groups: PanelModuleGroup[]): PanelModuleGroup[] {
    if (bypassFilter.value) return groups
    return groups
      .map(g => ({
        title: g.title,
        items: g.items.filter(item => !item.panelNavId || isEnabled(item.panelNavId))
      }))
      .filter(g => g.items.length > 0)
  }

  function moduleGroupsForRole(role: PanelNavRole): PanelModuleGroup[] {
    const cms = useCms()
    const cmsGroups = cmsNavGroupsFromItems(role, cms.navigation.value)
    const hasOverride = cms.navigation.value.some(n => n.role === role)
    if (hasOverride) {
      return filterModuleGroups(role, cmsGroups)
    }
    return filterModuleGroups(role, buildPanelModuleGroups(role))
  }

  async function fetchFlags(userId?: string): Promise<RemoteFlag[]> {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
    return $fetch<RemoteFlag[]>(`${auth.apiBase.value}/api/system/feature-flags${query}`, {
      headers: auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : undefined
    })
  }

  async function persistRemote(flagId: string, enabled: boolean, scope: PanelNavFlagScope) {
    if (!auth.isSuperAdmin.value || !auth.token.value) return
    const key = savingKey(flagId, scope)
    savingKeys.value = new Set(savingKeys.value).add(key)
    try {
      await $fetch(`${auth.apiBase.value}/api/system/feature-flags/${encodeURIComponent(flagId)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token.value}` },
        body: scope.type === 'user'
          ? { value: enabled, user_id: scope.userId }
          : { value: enabled }
      })
    } finally {
      const next = new Set(savingKeys.value)
      next.delete(key)
      savingKeys.value = next
    }
  }

  async function clearRemote(flagId: string, scope: PanelNavFlagScope) {
    if (!auth.isSuperAdmin.value || !auth.token.value) return
    const key = savingKey(flagId, scope)
    savingKeys.value = new Set(savingKeys.value).add(key)
    try {
      const query = scope.type === 'user' ? `?user_id=${encodeURIComponent(scope.userId)}` : ''
      await $fetch(`${auth.apiBase.value}/api/system/feature-flags/${encodeURIComponent(flagId)}${query}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token.value}` }
      })
    } finally {
      const next = new Set(savingKeys.value)
      next.delete(key)
      savingKeys.value = next
    }
  }

  async function hydrateFromApi(force = false) {
    if (!import.meta.client || !auth.isLoggedIn.value) return
    if (hydratedFromApi.value && !force) return
    try {
      const globalRows = await fetchFlags()
      globalOverrides.value = parsePanelNavRows(globalRows)
      const uid = auth.user.value?.id
      if (uid) {
        const userRows = await fetchFlags(uid)
        userOverrides.value = parsePanelNavRows(userRows, uid)
      } else {
        userOverrides.value = {}
      }
    } catch {
      /* domyślnie włączone */
    } finally {
      hydratedFromApi.value = true
    }
  }

  async function loadManagedUserOverrides(userId: string) {
    if (!auth.isSuperAdmin.value) return
    const rows = await fetchFlags(userId)
    managedUserOverrides.value = parsePanelNavRows(rows, userId)
  }

  function clearManagedUserOverrides() {
    managedUserOverrides.value = {}
  }

  async function setFlag(flagId: string, enabled: boolean, scope: PanelNavFlagScope = { type: 'global' }) {
    if (!auth.isSuperAdmin.value) return
    if (scope.type === 'global') {
      globalOverrides.value = { ...globalOverrides.value, [flagId]: enabled }
    } else if (scope.userId === auth.user.value?.id) {
      userOverrides.value = { ...userOverrides.value, [flagId]: enabled }
      managedUserOverrides.value = { ...managedUserOverrides.value, [flagId]: enabled }
    } else {
      managedUserOverrides.value = { ...managedUserOverrides.value, [flagId]: enabled }
    }
    await persistRemote(flagId, enabled, scope)
  }

  function omitFlag(map: Record<string, boolean>, flagId: string): Record<string, boolean> {
    const { [flagId]: _removed, ...rest } = map
    return rest
  }

  async function clearUserFlag(flagId: string, userId: string) {
    if (!auth.isSuperAdmin.value) return
    if (userId === auth.user.value?.id) {
      userOverrides.value = omitFlag(userOverrides.value, flagId)
    }
    managedUserOverrides.value = omitFlag(managedUserOverrides.value, flagId)
    await clearRemote(flagId, { type: 'user', userId })
  }

  /**
   * Widoczność linku w navbarze (główny pasek + menu Panel / drawer).
   * Ten sam przełącznik co na dashboardzie; dla współdzielonych URL-i wystarczy
   * jedna włączona flaga roli użytkownika (lub globalnie dla gościa).
   */
  function isNavLinkEnabled(path: string): boolean {
    if (bypassFilter.value) return true

    const matching = panelNavModulesForNavPath(path)
    if (matching.length === 0) return true

    const roles = auth.user.value?.roles ?? []

    if (auth.isLoggedIn.value) {
      const applicable = matching.filter(def => userHasRole(roles, def.role))
      if (applicable.length > 0) {
        return applicable.some(def => effectiveEnabled(def.id))
      }
    }

    return matching.some(def => rawGlobalEnabled(def.id))
  }

  function canAccessPath(path: string): boolean {
    if (bypassFilter.value || !auth.isLoggedIn.value) return true
    const roles = auth.user.value?.roles ?? []
    const normalized = normalizePath(path)

    const gated = PANEL_NAV_MODULES.filter(def => {
      if (!def.gateRoute) return false
      const target = normalizePath(def.to)
      return normalized === target || normalized.startsWith(`${target}/`)
    })

    if (gated.length === 0) return true

    const applicable = gated.filter(def => userHasRole(roles, def.role))
    if (applicable.length === 0) return true

    return applicable.some(def => effectiveEnabled(def.id))
  }

  function redirectPathForBlockedRoute(path: string): string {
    const normalized = normalizePath(path)
    if (normalized.startsWith('/athlete')) return '/athlete'
    if (normalized.startsWith('/trainer')) return '/trainer'
    if (normalized.startsWith('/admin')) return '/admin'
    if (auth.isAthlete.value) return '/athlete'
    if (auth.isTrainer.value) return '/trainer'
    if (auth.isAdmin.value) return '/admin'
    return '/'
  }

  return {
    globalOverrides,
    userOverrides,
    managedUserOverrides,
    hydratedFromApi,
    enabledMap,
    isEnabled,
    rawIsEnabled,
    rawGlobalEnabled,
    effectiveEnabled,
    userOverrideValue,
    filterModuleGroups,
    moduleGroupsForRole,
    panelNavModulesForRole,
    panelNavRoleLabels: PANEL_NAV_ROLE_LABELS,
    hydrateFromApi,
    loadManagedUserOverrides,
    clearManagedUserOverrides,
    setFlag,
    clearUserFlag,
    isSaving,
    isNavLinkEnabled,
    canAccessPath,
    redirectPathForBlockedRoute
  }
}

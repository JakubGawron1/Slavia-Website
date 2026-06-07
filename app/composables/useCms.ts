import { publicApiUrl } from '~/composables/usePublicFetch'
import { apiRoutes } from '~/config/api'
import type {
  CmsNavigationItem,
  CmsPage,
  CmsVariable,
  CmsVariableType,
  CmsVersionEntry
} from '~/types/cms'
import { isCmsExcludedPath } from '~/utils/cmsExcludedRoutes'
import { cmsRoutePageName } from '~/utils/cmsRoutePage'
import { interpolateCmsVariables, variablesToMap } from '~/utils/cmsVariables'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'

const CMS_VARS_KEY = 'slavia-cms-variables'
const CMS_PAGES_KEY = 'slavia-cms-pages'
const CMS_NAV_KEY = 'slavia-cms-navigation'
const CMS_HYDRATED_KEY = 'slavia-cms-hydrated'
const CMS_EDIT_MODE_KEY = 'slavia-cms-edit-mode'
const CMS_EDIT_LS_KEY = 'slavia-cms-edit-mode-v4'
const CMS_PAGE_DATA_KEY = 'slavia-cms-page-data'

export function useCms() {
  const auth = useAuth()
  const apiFetch = useApi()
  const route = useRoute()

  const variables = useState<CmsVariable[]>(CMS_VARS_KEY, () => [])
  const pages = useState<Record<string, CmsPage>>(CMS_PAGES_KEY, () => ({}))
  const navigation = useState<CmsNavigationItem[]>(CMS_NAV_KEY, () => [])
  const pageDataVariables = useState<Record<string, Record<string, string>>>(
    CMS_PAGE_DATA_KEY,
    () => ({})
  )
  const hydrated = useState<boolean>(CMS_HYDRATED_KEY, () => false)
  const editMode = useState<boolean>(CMS_EDIT_MODE_KEY, () => false)

  const canEdit = computed(
    () =>
      auth.roles.value.some(r =>
        ['Editor', 'Admin', 'SuperAdmin'].includes(r)
      )
  )

  const routePageName = computed(() => cmsRoutePageName(route.path as string))

  const routePageDataMap = computed(
    () => pageDataVariables.value[routePageName.value] ?? {}
  )

  /** Wartość z API jako baza; wpis w cms_variables (inline / panel) ma pierwszeństwo. */
  function variableMapForPage(pageName: string): Record<string, string> {
    return {
      ...(pageDataVariables.value[pageName] ?? {}),
      ...variablesToMap(variables.value)
    }
  }

  const variableMap = computed(() => variableMapForPage(routePageName.value))

  function getLiveVariableValue(key: string, pageName?: string): string {
    const pn = pageName ?? routePageName.value
    return pageDataVariables.value[pn]?.[key] ?? ''
  }

  function isVariableOverridden(key: string): boolean {
    return variables.value.some(v => v.key === key)
  }

  async function saveVariableOverride(key: string, value: string) {
    await saveVariable(key, value, 'text', !isVariableOverridden(key))
  }

  async function resetVariableOverride(key: string) {
    if (isVariableOverridden(key)) {
      await deleteVariable(key)
    }
  }

  function setPageDataVariables(pageName: string, vars: Record<string, string>) {
    pageDataVariables.value = {
      ...pageDataVariables.value,
      [pageName]: { ...vars }
    }
  }

  function clearPageDataVariables(pageName: string) {
    if (!(pageName in pageDataVariables.value)) return
    const { [pageName]: _removed, ...rest } = pageDataVariables.value
    pageDataVariables.value = rest
  }

  function resolveContent(raw: string, html = false): string {
    const interpolated = interpolateCmsVariables(raw, variableMap.value)
    return html ? sanitizeRichHtml(interpolated) : interpolated
  }

  function getPageFieldRaw(pageName: string, fieldKey: string, fallback = ''): string {
    const page = pages.value[pageName]
    const val = page?.fields?.[fieldKey]?.value
    if (val == null) return fallback
    return String(val)
  }

  function getPageField(pageName: string, fieldKey: string, fallback = ''): string {
    const page = pages.value[pageName]
    const val = page?.fields?.[fieldKey]?.value
    if (val == null) return fallback
    const str = String(val)
    const type = page?.fields?.[fieldKey]?.type
    return type === 'html' ? resolveContent(str, true) : resolveContent(str)
  }

  async function fetchVariables(): Promise<CmsVariable[]> {
    const data = await apiFetch<CmsVariable[]>(apiRoutes.cms.variables)
    variables.value = data
    return data
  }

  async function fetchPages(): Promise<CmsPage[]> {
    const data = await apiFetch<CmsPage[]>(apiRoutes.cms.pages)
    const map: Record<string, CmsPage> = {}
    for (const p of data) map[p.page_name] = p
    pages.value = map
    return data
  }

  async function fetchPage(name: string): Promise<CmsPage> {
    const data = await apiFetch<CmsPage>(apiRoutes.cms.page(name))
    pages.value = { ...pages.value, [name]: data }
    return data
  }

  async function fetchPagePublic(name: string): Promise<CmsPage | null> {
    try {
      const data = await $fetch<CmsPage>(publicApiUrl(`cms/page/${encodeURIComponent(name)}`))
      pages.value = { ...pages.value, [name]: data }
      return data
    } catch {
      return null
    }
  }

  async function fetchNavigation(role?: string): Promise<CmsNavigationItem[]> {
    const url = role
      ? `${apiRoutes.cms.navigation}?role=${encodeURIComponent(role)}`
      : apiRoutes.cms.navigation
    const data = await apiFetch<CmsNavigationItem[]>(url)
    if (!role) navigation.value = data
    return data
  }

  async function hydratePublic(
    force = false,
    opts: { variables?: boolean, navigation?: boolean } = {}
  ) {
    const loadVars = opts.variables ?? !variables.value.length
    const loadNav = opts.navigation ?? !navigation.value.length
    if (hydrated.value && !force && !loadVars && !loadNav) return

    try {
      const tasks: Promise<void>[] = []

      if (force || loadVars) {
        tasks.push(
          $fetch<CmsVariable[]>(publicApiUrl('cms/variables'))
            .then((vars) => {
              variables.value = vars
            })
            .catch(() => {
              /* fallback z SSR / domyślne */
            })
        )
      }

      if (force || loadNav) {
        tasks.push(
          $fetch<CmsNavigationItem[]>(publicApiUrl('cms/navigation'))
            .then((nav) => {
              navigation.value = nav
            })
            .catch(() => {
              /* fallback z katalogu panelu */
            })
        )
      }

      await Promise.all(tasks)
    } catch {
      /* puste domyślnie */
    } finally {
      hydrated.value = true
    }
  }

  async function saveVariable(
    key: string,
    value: unknown,
    type: CmsVariableType,
    create = false
  ) {
    if (create) {
      await apiFetch(apiRoutes.cms.variableCreate, {
        method: 'POST',
        body: { key, value, type }
      })
    } else {
      await apiFetch(apiRoutes.cms.variable(key), {
        method: 'PUT',
        body: { value, type }
      })
    }
    await fetchVariables()
  }

  async function deleteVariable(key: string) {
    await apiFetch(apiRoutes.cms.variable(key), { method: 'DELETE' })
    await fetchVariables()
  }

  async function savePage(name: string, fields: CmsPage['fields']) {
    await apiFetch(apiRoutes.cms.page(name), {
      method: 'PUT',
      body: { fields }
    })
    await fetchPage(name)
  }

  async function saveNavigation(items: CmsNavigationItem[]) {
    await apiFetch(apiRoutes.cms.navigation, {
      method: 'PUT',
      body: {
        items: items.map((it, idx) => ({
          id: it.id || undefined,
          role: it.role,
          label: it.label,
          icon: it.icon,
          url: it.url,
          order_index: idx,
          group_name: it.group_name ?? null
        }))
      }
    })
    await fetchNavigation()
  }

  async function fetchHistory(params?: {
    entity_type?: string
    entity_key?: string
    limit?: number
  }): Promise<CmsVersionEntry[]> {
    const q = new URLSearchParams()
    if (params?.entity_type) q.set('entity_type', params.entity_type)
    if (params?.entity_key) q.set('entity_key', params.entity_key)
    if (params?.limit) q.set('limit', String(params.limit))
    const suffix = q.toString() ? `?${q}` : ''
    return apiFetch<CmsVersionEntry[]>(`${apiRoutes.cms.history}${suffix}`)
  }

  const cmsEnabledOnRoute = computed(() => !isCmsExcludedPath(route.path as string))

  const inlineEditEnabled = useExperimentalFlag('cms_inline_edit')

  const showGlobalEditToggle = computed(
    () => canEdit.value && cmsEnabledOnRoute.value && inlineEditEnabled.value
  )

  function setEditMode(on: boolean) {
    editMode.value = on
    if (import.meta.client) {
      document.documentElement.classList.toggle('slavia-cms-edit-mode', on)
      try {
        if (on) localStorage.setItem(CMS_EDIT_LS_KEY, '1')
        else localStorage.removeItem(CMS_EDIT_LS_KEY)
      } catch {
        /* private mode */
      }
    }
  }

  function toggleEditMode() {
    setEditMode(!editMode.value)
  }

  function restoreEditModeFromStorage() {
    if (!import.meta.client || !canEdit.value || !inlineEditEnabled.value) return
    try {
      if (localStorage.getItem(CMS_EDIT_LS_KEY) === '1') {
        setEditMode(true)
      }
    } catch {
      /* ignore */
    }
  }

  if (import.meta.client) {
    watch(canEdit, (allowed) => {
      if (!allowed && editMode.value) setEditMode(false)
    })
    watch(inlineEditEnabled, (on) => {
      if (!on && editMode.value) setEditMode(false)
    })
  }

  return {
    variables,
    pages,
    navigation,
    pageDataVariables,
    hydrated,
    editMode,
    canEdit,
    inlineEditEnabled,
    variableMap,
    variableMapForPage,
    getLiveVariableValue,
    isVariableOverridden,
    saveVariableOverride,
    resetVariableOverride,
    routePageDataMap,
    setPageDataVariables,
    clearPageDataVariables,
    routePageName,
    cmsEnabledOnRoute,
    showGlobalEditToggle,
    setEditMode,
    toggleEditMode,
    restoreEditModeFromStorage,
    resolveContent,
    getPageField,
    getPageFieldRaw,
    fetchVariables,
    fetchPages,
    fetchPage,
    fetchPagePublic,
    fetchNavigation,
    hydratePublic,
    saveVariable,
    deleteVariable,
    savePage,
    saveNavigation,
    fetchHistory
  }
}

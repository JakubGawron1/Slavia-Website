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
import { interpolateCmsVariables, variablesToMap } from '~/utils/cmsVariables'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'

const CMS_VARS_KEY = 'slavia-cms-variables'
const CMS_PAGES_KEY = 'slavia-cms-pages'
const CMS_NAV_KEY = 'slavia-cms-navigation'
const CMS_HYDRATED_KEY = 'slavia-cms-hydrated'

export function useCms() {
  const auth = useAuth()
  const apiFetch = useApi()
  const route = useRoute()

  const variables = useState<CmsVariable[]>(CMS_VARS_KEY, () => [])
  const pages = useState<Record<string, CmsPage>>(CMS_PAGES_KEY, () => ({}))
  const navigation = useState<CmsNavigationItem[]>(CMS_NAV_KEY, () => [])
  const hydrated = useState<boolean>(CMS_HYDRATED_KEY, () => false)

  const canEdit = computed(
    () =>
      auth.roles.value.some(r =>
        ['Editor', 'Admin', 'SuperAdmin'].includes(r)
      )
  )

  const variableMap = computed(() => variablesToMap(variables.value))

  function resolveContent(raw: string, html = false): string {
    const interpolated = interpolateCmsVariables(raw, variableMap.value)
    return html ? sanitizeRichHtml(interpolated) : interpolated
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

  return {
    variables,
    pages,
    navigation,
    hydrated,
    canEdit,
    variableMap,
    cmsEnabledOnRoute,
    resolveContent,
    getPageField,
    fetchVariables,
    fetchPages,
    fetchPage,
    fetchNavigation,
    hydratePublic,
    saveVariable,
    deleteVariable,
    savePage,
    saveNavigation,
    fetchHistory
  }
}

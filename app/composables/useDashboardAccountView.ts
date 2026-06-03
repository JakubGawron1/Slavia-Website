import {
  ACCOUNT_SETTINGS_SECTION_ID,
  ACCOUNT_SETTINGS_QUERY_KEY
} from '~/composables/useRoleDashboardNav'

function hashMatchesAccountSettings(hash: string): boolean {
  const normalized = hash.replace(/^#/, '').toLowerCase()
  return normalized === ACCOUNT_SETTINGS_SECTION_ID
}

function queryMatchesAccountSettings(query: Record<string, unknown>): boolean {
  const v = query[ACCOUNT_SETTINGS_QUERY_KEY]
  if (Array.isArray(v)) return v.some(item => item === '1' || item === 'true')
  return v === '1' || v === 'true'
}

/** Przełączanie między dashboardem a ustawieniami konta (hash lub query `konto=1`). */
export function useDashboardAccountView() {
  const route = useRoute()
  const router = useRouter()

  const isAccountView = computed(
    () => hashMatchesAccountSettings(route.hash) || queryMatchesAccountSettings(route.query)
  )

  function openAccountView() {
    return router.replace({
      path: route.path,
      hash: `#${ACCOUNT_SETTINGS_SECTION_ID}`,
      query: { ...route.query, [ACCOUNT_SETTINGS_QUERY_KEY]: '1' }
    })
  }

  function closeAccountView() {
    const nextQuery = { ...route.query }
    delete nextQuery[ACCOUNT_SETTINGS_QUERY_KEY]
    return router.replace({
      path: route.path,
      hash: '',
      query: nextQuery
    })
  }

  return { isAccountView, openAccountView, closeAccountView }
}

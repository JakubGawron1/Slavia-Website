import type { CmsPage, CmsVariable } from '~/types/cms'

const CMS_VARS_FETCH_KEY = 'cms-vars'

/** SSR + hydracja treści strony CMS przez publiczny BFF (strona + zmienne równolegle). */
export async function useCmsPageHydrate(pageName: string) {
  const cms = useCms()

  const [{ data: page }, { data: variables }] = await Promise.all([
    usePublicLazyFetch<CmsPage>(`cms/page/${pageName}`, {
      key: `cms-page-${pageName}`,
      default: () => ({
        id: '',
        page_name: pageName,
        fields: {},
        created_at: '',
        updated_at: ''
      })
    }),
    usePublicLazyFetch<CmsVariable[]>('cms/variables', {
      key: CMS_VARS_FETCH_KEY,
      default: () => []
    })
  ])

  watch(
    page,
    (p) => {
      if (p?.page_name) {
        cms.pages.value = { ...cms.pages.value, [p.page_name]: p }
      }
    },
    { immediate: true }
  )

  watch(
    variables,
    (vars) => {
      if (vars?.length) cms.variables.value = vars
    },
    { immediate: true }
  )

  if (page.value?.page_name || variables.value?.length) {
    cms.hydrated.value = true
  }

  return { cms, page, variables }
}

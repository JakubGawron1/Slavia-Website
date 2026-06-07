import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

type CmsPageDataSource = Record<string, string | number | boolean | null | undefined>

function normalizePageData(source: CmsPageDataSource): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(source)) {
    if (raw == null || raw === '') continue
    out[key] = String(raw)
  }
  return out
}

/** Wartości globalne (rok, data) — dostępne na każdej stronie CMS. */
export function cmsGlobalDataVariables(): Record<string, string> {
  const now = new Date()
  return {
    rok_biezacy: String(now.getFullYear()),
    data_biezaca: format(now, 'd MMMM yyyy', { locale: pl })
  }
}

/**
 * Rejestruje zmienne uzupełniane z danych strony (API / computed).
 * Wartości trafiają do interpolacji `{klucz}` w polach CMS.
 */
export function useProvideCmsPageData(
  pageName: MaybeRefOrGetter<string>,
  source: MaybeRefOrGetter<CmsPageDataSource>
) {
  const cms = useCms()
  let lastPage = ''

  watch(
    () => {
      const page = toValue(pageName)
      return {
        page,
        vars: {
          ...cmsGlobalDataVariables(),
          ...normalizePageData(toValue(source))
        }
      }
    },
    ({ page, vars }) => {
      if (lastPage && lastPage !== page) {
        cms.clearPageDataVariables(lastPage)
      }
      lastPage = page
      cms.setPageDataVariables(page, vars)
    },
    { immediate: true, deep: true }
  )

  onScopeDispose(() => {
    if (lastPage) cms.clearPageDataVariables(lastPage)
  })
}

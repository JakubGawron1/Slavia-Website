export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return

  // Jeśli weszliśmy w tryb iframe-preview, chcemy utrzymać ten parametr
  // przy kolejnych nawigacjach w tej samej ramce (NuxtLink domyślnie nie
  // zachowuje nieznanych query params).
  try {
    const key = 'slavia-dev__iframe_active'
    const isActive = sessionStorage.getItem(key) === '1'
    const toHas = String(to.query.__dev_iframe || '') === '1'

    if (toHas) {
      sessionStorage.setItem(key, '1')
      return
    }

    if (!isActive) return

    return navigateTo({
      path: to.path,
      query: { ...to.query, __dev_iframe: '1' },
      hash: to.hash
    }, { replace: true })
  } catch {
    // ignore
  }
})


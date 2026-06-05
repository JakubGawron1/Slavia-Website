/**
 * SPA w ramce iframe (Dev viewport): zachować query `__dev_iframe` przy nawigacji.
 *
 * Nie wolno używać tego znacznika poza rzeczywistym iframe – `sessionStorage` jest **wspólne**
 * dla dokumentu rodzica i iframe w tej samej zakładce, więc stary kod mógł wymuszać
 * parametr w oknie głównym po zamknięciu podglądu.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return

  try {
    const key = 'slavia-dev__iframe_active'
    const inIframe = window.self !== window.top
    const toHas = String(to.query.__dev_iframe || '') === '1'

    if (!inIframe) {
      sessionStorage.removeItem(key)
      return
    }

    if (toHas) {
      sessionStorage.setItem(key, '1')
      return
    }

    if (sessionStorage.getItem(key) === '1') {
      return navigateTo(
        {
          path: to.path,
          query: { ...to.query, __dev_iframe: '1' },
          hash: to.hash
        },
        { replace: true }
      )
    }
  } catch {
    /* ignore */
  }
})

import type { FetchError } from 'ofetch'

export function useApi() {
  const auth = useAuth()
  const expBanRedirect = useExperimentalFlag('ban_redirect_on_403')

  return $fetch.create({
    async onRequest({ options }) {
      options.baseURL = auth.apiBase.value
      // Ochrona przed „wiszącymi” requestami, które w praktyce wyglądają jak zawieszona nawigacja.
      // ofetch obsługuje timeout (ms) — ustawiamy domyślny, jeśli caller nie podał własnego.
      // Dla FormData (uploady na Cloudinary) zwiększamy timeout — duże zdjęcia/filmy
      // potrafią przesyłać się znacznie dłużej niż zwykły JSON request.
      if (typeof options.timeout !== 'number') {
        options.timeout = options.body instanceof FormData ? 120_000 : 20_000
      }
      const headers = new Headers(options.headers as HeadersInit)
      if (auth.token.value) {
        headers.set('Authorization', `Bearer ${auth.token.value}`)
      }
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
      }
      /** Multipart: granica musi ustawić przeglądarka — nie wysyłaj application/json. */
      if (options.body instanceof FormData) {
        headers.delete('Content-Type')
      }
      options.headers = headers
    },
    onRequestError({ error }) {
      console.error('[api] request error', error)
    },
    onResponseError({ response }) {
      if (response?.status === 401) {
        auth.logout()
      }
      if (response?.status === 403) {
        // Jeśli backend blokuje konto (ban), przekieruj na /banned.
        // Nie rób tego dla SuperAdmin (konta super mają być odporne na flagę is_banned).
        if (expBanRedirect.value && !auth.isSuperAdmin.value) {
          queueMicrotask(() => {
            void navigateTo('/banned')
          })
        }
      }
    }
  })
}

export function getApiErrorMessage(e: unknown, fallback = 'Wystąpił błąd.') {
  const err = e as FetchError<{ message?: string, error?: string }>
  return err?.data?.message || err?.data?.error || err?.message || fallback
}

export function getApiDetailedErrorMessage(e: unknown, fallback = 'Wystąpił błąd połączenia z backendem.') {
  const err = e as FetchError<{ message?: string, error?: string }>
  const msg = (err?.data?.message || err?.data?.error || err?.message || '').toLowerCase()

  if (msg.includes('cors')) return 'Błąd CORS: backend odrzuca origin tej aplikacji.'
  if (msg.includes('dns') || msg.includes('enotfound')) return 'Błąd DNS: nie można rozwiązać adresu backendu.'
  if (msg.includes('timed out') || msg.includes('timeout')) return 'Brak odpowiedzi backendu (timeout).'
  if (msg.includes('fetch') || msg.includes('network')) return 'Brak odpowiedzi backendu (błąd sieci).'

  return getApiErrorMessage(e, fallback)
}

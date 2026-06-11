import type { FetchError, FetchOptions } from 'ofetch'
import { rewriteRolePreviewApiUrl } from '~/utils/rolePreviewApiRewrite'

export function useApi() {
  const auth = useAuth()
  const expBanRedirect = useExperimentalFlag('ban_redirect_on_403')

  const rolePreview = useRolePreviewState()
  const toast = useToast()

  const client = $fetch.create({
    async onRequest({ options }) {
      options.baseURL = auth.apiBase.value
      const method = String(options.method || 'GET').toUpperCase()
      if (rolePreview.isReadOnly.value && method !== 'GET' && method !== 'HEAD') {
        toast.add({
          title: 'Podgląd read-only',
          description: 'Zakończ symulację roli, aby zapisywać zmiany.',
          color: 'warning'
        })
        throw new Error('ROLE_PREVIEW_READONLY')
      }
      if (typeof options.timeout !== 'number') {
        options.timeout = options.body instanceof FormData ? 120_000 : 20_000
      }
      const headers = new Headers(options.headers as HeadersInit)
      if (auth.token.value) {
        headers.set('Authorization', `Bearer ${auth.token.value}`)
      }
      if (rolePreview.isActive.value && rolePreview.state.value?.targetUserId) {
        headers.set('X-Slavia-Role-Preview', rolePreview.state.value.targetUserId)
      }
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
      }
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
        if (expBanRedirect.value && !auth.isSuperAdmin.value) {
          queueMicrotask(() => {
            void navigateTo('/banned')
          })
        }
      }
    }
  })

  return <T>(url: string, opts?: FetchOptions) => {
    const method = String(opts?.method || 'GET')
    const rewritten = rewriteRolePreviewApiUrl(url, method, rolePreview.state.value, {
      isActive: rolePreview.isActive.value,
      isAthletePreview: rolePreview.isAthletePreview.value
    })
    return client<T>(rewritten, opts as Parameters<typeof client>[1])
  }
}

export function getApiErrorMessage(e: unknown, fallback = 'Wystąpił błąd.') {
  const err = e as FetchError<{ message?: string, error?: string }>
  const status = err?.response?.status
  const body = err?.data?.message || err?.data?.error || err?.message || fallback
  if (status === 409) {
    return body.includes('już') ? body : `${body} (duplikat — odśwież widok, jeśli wpis już istnieje.)`
  }
  return body
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

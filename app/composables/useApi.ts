import type { FetchError, FetchOptions } from 'ofetch'
import {
  apiFetchOrEmpty,
  createApiFetchOrEmptyDeps,
  type ApiFetchOrEmptyOptions
} from '~/utils/apiFetchOrEmpty'
import { markBackendAwake, notifyBackendWakingIfNeeded } from '~/utils/backendWakeNotice'
import { isPanelBffPath, panelApiUrl } from '~/utils/panelBffPaths'
import { rewriteRolePreviewApiUrl } from '~/utils/rolePreviewApiRewrite'

/** Domyślny timeout panelowych żądań JSON (ms). */
export const API_DEFAULT_TIMEOUT_MS = 20_000

/**
 * Dłuższy timeout pierwszego żądania panelu po bezczynności (ms).
 * Hugging Face Spaces usypiają instancję — cold start często przekracza 20s (502/503 z proxy).
 */
export const API_PANEL_COLD_START_TIMEOUT_MS = 30_000

export const API_UPLOAD_TIMEOUT_MS = 120_000

function handleSessionExpired(auth: ReturnType<typeof useAuth>, toast: ReturnType<typeof useToast>) {
  if (!import.meta.client) return
  const hadSession = !!auth.token.value
  auth.logout()
  if (!hadSession) return
  toast.add({
    title: 'Sesja wygasła',
    description: 'Zaloguj się ponownie, aby kontynuować.',
    color: 'warning'
  })
  queueMicrotask(() => {
    const path = window.location.pathname + window.location.search
    void navigateTo({ path: '/logowanie', query: path !== '/logowanie' ? { redirect: path } : undefined })
  })
}

function splitUrl(url: string): { path: string, query: string } {
  const q = url.indexOf('?')
  if (q === -1) return { path: url, query: '' }
  return { path: url.slice(0, q), query: url.slice(q) }
}

function applyNoStoreGetHeaders(headers: Headers, method: string) {
  const m = method.toUpperCase()
  if (m !== 'GET' && m !== 'HEAD') return
  headers.set('Cache-Control', 'no-cache')
  headers.set('Pragma', 'no-cache')
}

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
        options.timeout = options.body instanceof FormData
          ? API_UPLOAD_TIMEOUT_MS
          : API_DEFAULT_TIMEOUT_MS
      }
      const headers = new Headers(options.headers as HeadersInit)
      if (auth.token.value) {
        headers.set('Authorization', `Bearer ${auth.token.value}`)
      }
      if (rolePreview.isActive.value && rolePreview.state.value?.targetUserId) {
        const previewTarget = rolePreview.state.value.targetUserId
        if (previewTarget !== auth.user.value?.id) {
          headers.set('X-Slavia-Role-Preview', previewTarget)
        }
      }
      if (!headers.has('Accept')) {
        const rt = (options as { responseType?: string }).responseType
        if (rt === 'text') {
          headers.set('Accept', 'text/plain, text/html, text/csv, application/json, */*')
        } else if (rt === 'blob' || rt === 'arrayBuffer') {
          headers.set('Accept', '*/*')
        } else {
          headers.set('Accept', 'application/json')
        }
      }
      if (options.body instanceof FormData) {
        headers.delete('Content-Type')
      }
      applyNoStoreGetHeaders(headers, method)
      options.headers = headers
      if (method === 'GET' || method === 'HEAD') {
        options.cache = 'no-store'
      }
    },
    onRequestError({ error }) {
      console.error('[api] request error', error)
    },
    onResponse({ response }) {
      if (import.meta.client && response.ok) {
        markBackendAwake(toast)
      }
    },
    onResponseError({ response }) {
      if (import.meta.client) {
        notifyBackendWakingIfNeeded(response?.status, toast)
      }
      if (response?.status === 401) {
        handleSessionExpired(auth, toast)
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

  const panelClient = $fetch.create({
    async onRequest({ options }) {
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
        options.timeout = API_DEFAULT_TIMEOUT_MS
      }
      const headers = new Headers(options.headers as HeadersInit)
      if (auth.token.value) {
        headers.set('Authorization', `Bearer ${auth.token.value}`)
      }
      if (rolePreview.isActive.value && rolePreview.state.value?.targetUserId) {
        const previewTarget = rolePreview.state.value.targetUserId
        if (previewTarget !== auth.user.value?.id) {
          headers.set('X-Slavia-Role-Preview', previewTarget)
        }
      }
      if (!headers.has('Accept')) {
        const rt = (options as { responseType?: string }).responseType
        if (rt === 'text') {
          headers.set('Accept', 'text/plain, text/html, text/csv, application/json, */*')
        } else if (rt === 'blob' || rt === 'arrayBuffer') {
          headers.set('Accept', '*/*')
        } else {
          headers.set('Accept', 'application/json')
        }
      }
      applyNoStoreGetHeaders(headers, method)
      options.headers = headers
      if (method === 'GET' || method === 'HEAD') {
        options.cache = 'no-store'
      }
    },
    onResponse({ response }) {
      if (import.meta.client && response.ok) {
        markBackendAwake(toast)
      }
    },
    onResponseError({ response }) {
      if (import.meta.client) {
        notifyBackendWakingIfNeeded(response?.status, toast)
      }
      if (response?.status === 401) {
        handleSessionExpired(auth, toast)
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

  const apiFetch = <T>(url: string, opts?: FetchOptions) => {
    const method = String(opts?.method || 'GET')
    const { path, query } = splitUrl(url)
    if (method.toUpperCase() === 'GET' && isPanelBffPath(path)) {
      return panelClient<T>(`${panelApiUrl(path)}${query}`, opts as Parameters<typeof panelClient>[1])
    }
    const rewritten = rewriteRolePreviewApiUrl(url, method, rolePreview.state.value, {
      isActive: rolePreview.isActive.value,
      isAthletePreview: rolePreview.isAthletePreview.value,
      currentUserId: auth.user.value?.id ?? null
    })
    return client<T>(rewritten, opts as Parameters<typeof client>[1])
  }

  const orEmpty = <T>(
    url: string,
    opts?: FetchOptions & ApiFetchOrEmptyOptions<T | null>
  ): Promise<T | null> => {
    const { fallback, toast: toastOpt, ...fetchOpts } = opts ?? {}
    return apiFetchOrEmpty<T>(
      () => apiFetch<T>(url, fetchOpts) as Promise<T>,
      { fallback, toast: toastOpt },
      createApiFetchOrEmptyDeps((t) => toast.add(t))
    )
  }

  return Object.assign(apiFetch, {
    orEmpty,
    raw: (url: string, opts?: FetchOptions) => {
      const method = String(opts?.method || 'GET')
      const { path, query } = splitUrl(url)
      if (method.toUpperCase() === 'GET' && isPanelBffPath(path)) {
        return panelClient.raw(`${panelApiUrl(path)}${query}`, opts as Parameters<typeof panelClient.raw>[1])
      }
      const rewritten = rewriteRolePreviewApiUrl(url, method, rolePreview.state.value, {
        isActive: rolePreview.isActive.value,
        isAthletePreview: rolePreview.isAthletePreview.value,
        currentUserId: auth.user.value?.id ?? null
      })
      return client.raw(rewritten, opts as Parameters<typeof client.raw>[1])
    }
  }) as typeof apiFetch & {
    orEmpty: typeof orEmpty
    raw: typeof client.raw
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

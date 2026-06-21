import type { H3Event } from 'h3'
import { isPanelBffPath } from '~/utils/panelBffPaths'
import { isPublicBackendProxyPath } from './publicBackendProxy'
import { resolvePublicApiBase } from './resolvePublicApiBase'

export const PANEL_BFF_CACHE_CONTROL = 'private, max-age=10, stale-while-revalidate=30'

/**
 * BFF GET panelu (zalogowany) → zewnętrzny backend z tokenem użytkownika.
 * Jawna whitelist (`panelBffPaths`) — dashboard, składki, frekwencja (UUID).
 * Bez tras publicznych i bez mutacji.
 */
export function isPanelBackendProxyPath(apiPath: string): boolean {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`
  if (isPublicBackendProxyPath(path)) {
    return false
  }
  if (path.includes('/manage') || path.includes('/admin')) {
    return false
  }
  return isPanelBffPath(path)
}

function resolvePanelBackendPath(apiPath: string, previewUserId: string | undefined): string {
  const uid = previewUserId?.trim()
  if (!uid) return apiPath
  if (apiPath === '/api/athletes/me/dashboard') {
    return `/api/system/role-preview/athlete-dashboard/${encodeURIComponent(uid)}`
  }
  if (apiPath === '/api/payments/my/status') {
    return `/api/system/role-preview/payment-status/${encodeURIComponent(uid)}`
  }
  return apiPath
}

function readBearerToken(event: H3Event): string {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Brak tokenu autoryzacji.' })
  }
  return token
}

export async function proxyPanelBackendGet(
  event: H3Event,
  apiPath: string,
  query?: Record<string, string | string[] | undefined>
): Promise<unknown> {
  if (!isPanelBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const token = readBearerToken(event)
  const previewUserId = getHeader(event, 'x-slavia-role-preview')?.trim()
  const backendPath = resolvePanelBackendPath(apiPath, previewUserId)
  const base = await resolvePublicApiBase()

  const url = new URL(`${base}${backendPath.startsWith('/') ? backendPath : `/${backendPath}`}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, v)
      } else {
        url.searchParams.set(key, value)
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`
  }
  if (previewUserId) {
    headers['X-Slavia-Role-Preview'] = previewUserId
  }

  return await $fetch(url.toString(), {
    method: 'GET',
    timeout: 20_000,
    headers
  })
}

export function applyPanelBffResponseHeaders(event: H3Event) {
  setResponseHeaders(event, {
    'Cache-Control': PANEL_BFF_CACHE_CONTROL,
    Vary: 'Authorization'
  })
}

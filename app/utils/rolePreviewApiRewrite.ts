import type { RolePreviewState } from '~/composables/useRolePreviewState'

export type RolePreviewRewriteFlags = {
  isActive: boolean
  isAthletePreview: boolean
}

function splitUrl(url: string): { path: string, query: string } {
  const q = url.indexOf('?')
  if (q === -1) return { path: url, query: '' }
  return { path: url.slice(0, q), query: url.slice(q) }
}

/**
 * Przepisuje ścieżki „moje dane” na endpointy podglądu (SuperAdmin read-only).
 */
export function rewriteRolePreviewApiUrl(
  url: string,
  method: string,
  state: RolePreviewState | null,
  flags: RolePreviewRewriteFlags
): string {
  const m = method.toUpperCase()
  if (m !== 'GET' && m !== 'HEAD') return url
  if (!state?.targetUserId) return url

  const { path, query } = splitUrl(url)
  const uid = encodeURIComponent(state.targetUserId)
  const aid = state.athleteId ? encodeURIComponent(state.athleteId) : null

  if (flags.isActive) {
    if (path === '/api/notifications') {
      return `/api/system/role-preview/notifications/${uid}${query}`
    }
    if (path === '/api/chat/threads') {
      return `/api/system/role-preview/chat/threads/${uid}${query}`
    }
    const messagesMatch = path.match(/^\/api\/chat\/threads\/([^/]+)\/messages$/)
    if (messagesMatch?.[1]) {
      const threadId = encodeURIComponent(decodeURIComponent(messagesMatch[1]))
      return `/api/system/role-preview/chat/threads/${uid}/${threadId}/messages${query}`
    }
  }

  if (!flags.isAthletePreview) return url

  const exact: Record<string, string> = {
    '/api/athletes/me': `/api/system/role-preview/athlete-profile/${uid}`,
    '/api/athletes/my-calendar': `/api/system/role-preview/calendar/${uid}`,
    '/api/exercise-submissions/my': `/api/system/role-preview/exercise-submissions/${uid}`
  }
  if (exact[path]) return exact[path] + query

  if (path === '/api/payments/my/status') {
    return `/api/system/role-preview/payment-status/${uid}${query}`
  }
  if (path === '/api/payments/my/year' && aid) {
    return `/api/payments/athlete/${aid}/year${query}`
  }
  if (path === '/api/training-plans/my' && aid) {
    return `/api/training-plans/athlete/${aid}${query}`
  }
  if (path === '/api/recovery' && aid) {
    return `/api/recovery/athlete/${aid}${query}`
  }

  return url
}

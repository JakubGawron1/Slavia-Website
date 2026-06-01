/**
 * BFF GET → zewnętrzny backend (SSG/ISR/SSR na Vercel).
 * Tylko jawna whitelist ścieżek — bez tokenów i bez tras administracyjnych.
 */
const PUBLIC_GET_PATTERNS: RegExp[] = [
  /^\/api\/athletes$/,
  /^\/api\/posts$/,
  /^\/api\/posts\/[^/]+$/,
  /^\/api\/gallery$/,
  /^\/api\/competitions$/,
  /^\/api\/competitions\/recurring-training-cancellations$/,
  /^\/api\/results\/public-board$/,
  /^\/api\/results\/public-board-olympic$/
]

export function isPublicBackendProxyPath(apiPath: string): boolean {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`
  if (path.includes('/manage') || path.includes('/admin')) {
    return false
  }
  return PUBLIC_GET_PATTERNS.some(re => re.test(path))
}

export function resolveBackendApiBase(): string {
  const config = useRuntimeConfig()
  return String(config.public.apiBase ?? '').replace(/\/$/, '')
}

export async function proxyPublicBackendGet(apiPath: string): Promise<unknown> {
  if (!isPublicBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  const base = resolveBackendApiBase()
  if (!base) {
    throw createError({ statusCode: 503, statusMessage: 'API base not configured' })
  }
  const target = `${base}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`
  return await $fetch(target, {
    method: 'GET',
    timeout: 12_000,
    headers: { Accept: 'application/json' }
  })
}

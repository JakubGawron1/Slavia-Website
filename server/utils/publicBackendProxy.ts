import {
  emptyPublicApiFallback,
  isLocalApiBase,
  isPrerenderPass,
  resolvePublicApiBase
} from './resolvePublicApiBase'

/**
 * BFF GET → zewnętrzny backend (SSG/ISR/SSR na Vercel).
 * Tylko jawna whitelist ścieżek — bez tokenów i bez tras administracyjnych.
 */
const PUBLIC_GET_PATTERNS: RegExp[] = [
  /^\/api\/athletes$/,
  /^\/api\/athletes\/ranking\/sinclair$/,
  /^\/api\/athletes\/archive$/,
  /^\/api\/posts$/,
  /^\/api\/posts\/[^/]+$/,
  /^\/api\/gallery$/,
  /^\/api\/competitions$/,
  /^\/api\/competitions\/recurring-training-cancellations$/,
  /^\/api\/results\/public-board$/,
  /^\/api\/results\/public-board-olympic$/,
  /^\/api\/cms\/variables$/,
  /^\/api\/cms\/pages$/,
  /^\/api\/cms\/page\/[^/]+$/,
  /^\/api\/cms\/navigation$/,
  /^\/api\/challenges\/monthly-training-sessions$/,
  /^\/api\/announcements$/
]

export function isPublicBackendProxyPath(apiPath: string): boolean {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`
  if (path.includes('/manage') || path.includes('/admin')) {
    return false
  }
  return PUBLIC_GET_PATTERNS.some(re => re.test(path))
}

export async function proxyPublicBackendGet(
  apiPath: string,
  query?: Record<string, string | string[] | undefined>
): Promise<unknown> {
  if (!isPublicBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const base = await resolvePublicApiBase()
  if (isLocalApiBase(base) && (process.env.VERCEL || isPrerenderPass())) {
    if (isPrerenderPass()) {
      console.warn(
        `[public-api] Prerender: pominięto ${apiPath} — ustaw NUXT_PUBLIC_API_BASE_URL_LEAPCELL lub _RENDER na Vercel.`
      )
    }
    return emptyPublicApiFallback(apiPath)
  }

  const url = new URL(`${base}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`)
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

  try {
    return await $fetch(url.toString(), {
      method: 'GET',
      timeout: 12_000,
      headers: { Accept: 'application/json' }
    })
  } catch (err) {
    if (isPrerenderPass()) {
      console.warn(`[public-api] Prerender: ${apiPath} → ${url} niedostępne, używam pustych danych.`, err)
      return emptyPublicApiFallback(apiPath)
    }
    throw err
  }
}

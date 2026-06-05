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
  /^\/api\/athletes\/archive$/,
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

export async function proxyPublicBackendGet(apiPath: string): Promise<unknown> {
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

  const target = `${base}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`

  try {
    return await $fetch(target, {
      method: 'GET',
      timeout: 12_000,
      headers: { Accept: 'application/json' }
    })
  } catch (err) {
    if (isPrerenderPass()) {
      console.warn(`[public-api] Prerender: ${apiPath} → ${target} niedostępne, używam pustych danych.`, err)
      return emptyPublicApiFallback(apiPath)
    }
    throw err
  }
}

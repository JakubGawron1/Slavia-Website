import { getGlobalBackendProvider } from './backendProviderStore'

export type BackendProviderId = 'leapcell' | 'render'

/** localhost / 127.0.0.1 — tylko dev; na Vercel build nie proxy'ujemy tam. */
export function isLocalApiBase(url: string): boolean {
  const u = url.trim().toLowerCase()
  if (!u) return true
  return u.includes('127.0.0.1') || u.includes('localhost')
}

function normalizeBase(url: string | undefined): string {
  return String(url ?? '').trim().replace(/\/$/, '')
}

function apiBaseForProvider(
  provider: BackendProviderId,
  cfg: { apiBase: string, apiBaseLeapcell: string, apiBaseRender: string }
): string {
  if (provider === 'render') {
    return normalizeBase(cfg.apiBaseRender) || normalizeBase(cfg.apiBase)
  }
  return normalizeBase(cfg.apiBaseLeapcell) || normalizeBase(cfg.apiBase)
}

function providerFromEnv(): BackendProviderId {
  return process.env.DEFAULT_BACKEND_PROVIDER === 'render' ? 'render' : 'leapcell'
}

/**
 * Bazowy URL backendu dla BFF / sitemap / prerender.
 * Na Vercel: Leapcell lub Render z env (nie localhost), opcjonalnie Blob provider.
 */
export async function resolvePublicApiBase(): Promise<string> {
  const config = useRuntimeConfig()
  const cfg = {
    apiBase: String(config.public.apiBase ?? ''),
    apiBaseLeapcell: String(config.public.apiBaseLeapcell ?? ''),
    apiBaseRender: String(config.public.apiBaseRender ?? '')
  }

  let provider = providerFromEnv()
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    try {
      provider = await getGlobalBackendProvider()
    } catch {
      /* env fallback */
    }
  }

  const primary = apiBaseForProvider(provider, cfg)
  if (!isLocalApiBase(primary)) {
    return primary
  }

  for (const alt of ['leapcell', 'render'] as const) {
    if (alt === provider) continue
    const url = apiBaseForProvider(alt, cfg)
    if (!isLocalApiBase(url)) {
      return url
    }
  }

  return primary
}

/** Nitro prerender / build — brak API nie powinien wywalać całego buildu. */
export function isPrerenderPass(): boolean {
  return (
    import.meta.prerender === true
    || process.env.NITRO_PRERENDER === 'true'
    || process.env.NUXT_PRERENDER === 'true'
  )
}

/** Pusta odpowiedź zgodna z kształtem publicznego GET (lista vs pojedynczy wpis). */
export function emptyPublicApiFallback(apiPath: string): unknown {
  if (/\/posts\/[^/]+$/.test(apiPath)) {
    return null
  }
  return []
}

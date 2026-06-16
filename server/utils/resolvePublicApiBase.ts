import { getGlobalBackendProvider } from './backendProviderStore'
import {
  apiBaseForBackendProvider,
  backendProviderFromEnv,
  type BackendProviderId
} from '~/utils/backendProviderTypes'

export type { BackendProviderId }

/** localhost / 127.0.0.1 — tylko dev; na Vercel build nie proxy'ujemy tam. */
export function isLocalApiBase(url: string): boolean {
  const u = url.trim().toLowerCase()
  if (!u) return true
  return u.includes('127.0.0.1') || u.includes('localhost')
}

function normalizeBase(url: string | undefined): string {
  return String(url ?? '').trim().replace(/\/$/, '')
}

/**
 * Bazowy URL backendu dla BFF / sitemap / prerender.
 * Na Vercel: Hugging Face (domyślnie / Preview) lub Render (deprecated).
 */
export async function resolvePublicApiBase(): Promise<string> {
  const config = useRuntimeConfig()
  const cfg = {
    apiBase: String(config.public.apiBase ?? ''),
    apiBaseRender: String(config.public.apiBaseRender ?? ''),
    apiBaseHuggingface: String(config.public.apiBaseHuggingface ?? '')
  }

  let provider = backendProviderFromEnv()
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    try {
      provider = await getGlobalBackendProvider()
    } catch {
      /* env fallback */
    }
  }

  const primary = apiBaseForBackendProvider(provider, cfg) || normalizeBase(cfg.apiBase)

  if (!process.env.VERCEL) {
    return primary
  }

  if (!isLocalApiBase(primary)) {
    return primary
  }

  for (const alt of ['huggingface', 'render'] as const) {
    if (alt === provider) continue
    const url = apiBaseForBackendProvider(alt, cfg)
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
  if (/\/cms\/page\/[^/]+$/.test(apiPath)) {
    return { id: '', page_name: 'home', fields: {}, created_at: '', updated_at: '' }
  }
  return []
}

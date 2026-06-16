/** Identyfikatory globalnego providera backendu (Hugging Face domyślnie, Render legacy). */
export type BackendProviderId = 'render' | 'huggingface'

const PROVIDER_IDS: BackendProviderId[] = ['render', 'huggingface']

export function isBackendProviderId(raw: unknown): raw is BackendProviderId {
  return typeof raw === 'string' && PROVIDER_IDS.includes(raw as BackendProviderId)
}

/** Vercel Preview zawsze idzie na Hugging Face (izolacja od produkcji). */
export function isVercelPreviewRuntime(): boolean {
  return (process.env.VERCEL_ENV || '').trim().toLowerCase() === 'preview'
}

/** Normalizuje wartość z env / Blob / PATCH do kanonicznego id. */
export function normalizeBackendProvider(raw: unknown): BackendProviderId {
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (normalized === 'render') {
      return 'render'
    }
    if (
      normalized === 'huggingface'
      || normalized === 'hf'
      || normalized === 'hugging_face'
      || normalized === 'leapcell'
    ) {
      return 'huggingface'
    }
  }
  return 'huggingface'
}

export function backendProviderFromEnv(): BackendProviderId {
  if (isVercelPreviewRuntime()) {
    return 'huggingface'
  }
  return normalizeBackendProvider(process.env.DEFAULT_BACKEND_PROVIDER || 'huggingface')
}

export function isBackendProviderDeprecated(provider: BackendProviderId): boolean {
  return provider === 'render'
}

export function backendProviderLabel(provider: BackendProviderId): string {
  if (provider === 'render') {
    return 'Render (deprecated)'
  }
  return 'Hugging Face'
}

export type BackendProviderRuntimeConfig = {
  apiBase: string
  apiBaseRender: string
  apiBaseHuggingface: string
}

export function apiBaseForBackendProvider(
  provider: BackendProviderId,
  cfg: BackendProviderRuntimeConfig
): string {
  const normalize = (url: string | undefined) => String(url ?? '').trim().replace(/\/$/, '')
  if (provider === 'render') {
    return normalize(cfg.apiBaseRender) || normalize(cfg.apiBase)
  }
  return normalize(cfg.apiBaseHuggingface) || normalize(cfg.apiBase)
}

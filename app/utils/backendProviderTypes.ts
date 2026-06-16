/** Identyfikatory globalnego providera backendu (Leapcell / Render / Hugging Face). */
export type BackendProviderId = 'leapcell' | 'render' | 'huggingface'

const PROVIDER_IDS: BackendProviderId[] = ['leapcell', 'render', 'huggingface']

export function isBackendProviderId(raw: unknown): raw is BackendProviderId {
  return typeof raw === 'string' && PROVIDER_IDS.includes(raw as BackendProviderId)
}

/** Normalizuje wartość z env / Blob / PATCH do kanonicznego id. */
export function normalizeBackendProvider(raw: unknown): BackendProviderId {
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (normalized === 'render') {
      return 'render'
    }
    if (normalized === 'huggingface' || normalized === 'hf' || normalized === 'hugging_face') {
      return 'huggingface'
    }
  }
  return 'leapcell'
}

export function backendProviderFromEnv(): BackendProviderId {
  return normalizeBackendProvider(process.env.DEFAULT_BACKEND_PROVIDER)
}

export function backendProviderLabel(provider: BackendProviderId): string {
  if (provider === 'render') return 'Render'
  if (provider === 'huggingface') return 'Hugging Face'
  return 'Leapcell'
}

export type BackendProviderRuntimeConfig = {
  apiBase: string
  apiBaseLeapcell: string
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
  if (provider === 'huggingface') {
    return normalize(cfg.apiBaseHuggingface) || normalize(cfg.apiBase)
  }
  return normalize(cfg.apiBaseLeapcell) || normalize(cfg.apiBase)
}

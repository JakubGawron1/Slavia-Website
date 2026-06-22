/** Pełny URL do backendu Rust (HF/Render) — ten sam wybór providera co `useApi()`. */
export function useBackendDirectUrl() {
  const auth = useAuth()

  function backendUrl(path: string): string {
    const base = auth.apiBase.value.replace(/\/$/, '')
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalized}`
  }

  return { backendUrl, apiBase: auth.apiBase }
}

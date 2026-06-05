type BackendProvider = 'leapcell' | 'render'

interface BackendProviderResponse {
  active_provider: BackendProvider
  updated_at?: string | null
}

const BACKEND_PROVIDER_STATE_KEY = 'slavia-backend-provider'
const BACKEND_PROVIDER_HYDRATED_STATE_KEY = 'slavia-backend-provider-hydrated'

function normalizeBase(url: string | undefined): string {
  return (url || '').trim().replace(/\/$/, '')
}

export function useBackendProvider() {
  const config = useRuntimeConfig()
  const activeProvider = useState<BackendProvider>(BACKEND_PROVIDER_STATE_KEY, () => 'leapcell')
  const hydrated = useState<boolean>(BACKEND_PROVIDER_HYDRATED_STATE_KEY, () => false)

  const fallbackBase = computed(() => normalizeBase(config.public.apiBase))
  const leapcellBase = computed(() => normalizeBase(config.public.apiBaseLeapcell))
  const renderBase = computed(() => normalizeBase(config.public.apiBaseRender))

  function resolveApiBase(provider: BackendProvider): string {
    if (provider === 'render') {
      return renderBase.value || fallbackBase.value
    }
    return leapcellBase.value || fallbackBase.value
  }

  const activeApiBase = computed(() => resolveApiBase(activeProvider.value))

  function setActiveProvider(provider: BackendProvider) {
    activeProvider.value = provider
    if (import.meta.client) {
      // Jedno źródło prawdy: provider -> activeApiBase.
      console.info('[backend-provider] switched', {
        provider,
        apiBase: resolveApiBase(provider)
      })
    }
  }

  async function hydrateFromServer(force = false) {
    if (hydrated.value && !force) {
      return
    }

    try {
      const res = await $fetch<BackendProviderResponse>('/api/system/backend-provider')
      if (res?.active_provider === 'leapcell' || res?.active_provider === 'render') {
        activeProvider.value = res.active_provider
      }
    } catch {
      // Fallback do ustawień lokalnych builda, gdy endpoint kontrolny chwilowo niedostępny.
      activeProvider.value = 'leapcell'
    } finally {
      hydrated.value = true
    }
  }

  return {
    activeProvider,
    activeApiBase,
    hydrated,
    setActiveProvider,
    hydrateFromServer
  }
}

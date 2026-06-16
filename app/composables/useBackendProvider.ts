import {
  apiBaseForBackendProvider,
  isBackendProviderId,
  type BackendProviderId as BackendProvider
} from '~/utils/backendProviderTypes'

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

  const providerConfig = computed(() => ({
    apiBase: normalizeBase(config.public.apiBase),
    apiBaseLeapcell: normalizeBase(config.public.apiBaseLeapcell),
    apiBaseRender: normalizeBase(config.public.apiBaseRender),
    apiBaseHuggingface: normalizeBase(config.public.apiBaseHuggingface)
  }))

  function resolveApiBase(provider: BackendProvider): string {
    return apiBaseForBackendProvider(provider, providerConfig.value)
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
      if (isBackendProviderId(res?.active_provider)) {
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

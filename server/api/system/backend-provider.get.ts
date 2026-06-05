import { getGlobalBackendProvider } from '../../utils/backendProviderStore'

export default defineEventHandler(async () => {
  const activeProvider = await getGlobalBackendProvider()
  return {
    active_provider: activeProvider
  }
})


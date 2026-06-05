import { ensureSuperAdmin } from '../../utils/backendProviderAuth'
import { setGlobalBackendProvider } from '../../utils/backendProviderStore'

export default defineEventHandler(async (event) => {
  await ensureSuperAdmin(event)
  const body = await readBody<{ active_provider?: string }>(event)
  if (!body?.active_provider) {
    throw createError({
      statusCode: 400,
      statusMessage: 'active_provider jest wymagane.'
    })
  }

  const activeProvider = await setGlobalBackendProvider(body.active_provider)
  return {
    active_provider: activeProvider
  }
})


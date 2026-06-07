import {
  ALL_VERCEL_CACHE_PURGE_PATHS,
  ISR_REVALIDATE_PATHS,
  PUBLIC_BFF_REVALIDATE_PATHS
} from '../../../../config/isrRevalidatePaths'
import { ensureSuperAdmin } from '../../../utils/backendProviderAuth'
import { purgeVercelIsrCache } from '../../../utils/purgeVercelIsrCache'
import { resolvePurgeSiteOrigin } from '../../../utils/resolvePurgeSiteOrigin'

type PurgeBody = {
  scope?: 'all' | 'isr' | 'bff'
  paths?: string[]
}

export default defineEventHandler(async (event) => {
  await ensureSuperAdmin(event)
  const config = useRuntimeConfig(event)
  const token = String(config.vercelIsrBypassToken ?? '').trim()

  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Brak VERCEL_ISR_BYPASS_TOKEN na serwerze. Ustaw zmienną w Vercel i w nitro.vercel.config.bypassToken.'
    })
  }

  const body = await readBody<PurgeBody>(event).catch((): PurgeBody => ({}))
  let paths: readonly string[]

  if (Array.isArray(body.paths) && body.paths.length > 0) {
    paths = body.paths.map(p => (p.startsWith('/') ? p : `/${p}`))
  } else if (body.scope === 'isr') {
    paths = ISR_REVALIDATE_PATHS
  } else if (body.scope === 'bff') {
    paths = PUBLIC_BFF_REVALIDATE_PATHS
  } else {
    paths = ALL_VERCEL_CACHE_PURGE_PATHS
  }

  const origin = resolvePurgeSiteOrigin(config)
  const summary = await purgeVercelIsrCache({
    origin,
    bypassToken: token,
    paths
  })

  if (summary.okCount === 0) {
    throw createError({
      statusCode: 502,
      statusMessage: `Nie udało się unieważnić cache (${summary.failCount} tras). Sprawdź origin: ${origin}`
    })
  }

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return {
    ...summary,
    scope: body.scope ?? 'all',
    path_count: paths.length
  }
})

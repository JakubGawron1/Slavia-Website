import { ALL_VERCEL_CACHE_PURGE_PATHS, ISR_REVALIDATE_PATHS } from '../../../../config/isrRevalidatePaths'
import { ensureSuperAdmin } from '../../../utils/backendProviderAuth'
import { resolvePurgeSiteOrigin } from '../../../utils/resolvePurgeSiteOrigin'

export default defineEventHandler(async (event) => {
  await ensureSuperAdmin(event)
  const config = useRuntimeConfig(event)
  const token = String(config.vercelIsrBypassToken ?? '').trim()

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return {
    configured: token.length > 0,
    on_vercel: Boolean(process.env.VERCEL),
    site_origin: resolvePurgeSiteOrigin(config),
    isr_path_count: ISR_REVALIDATE_PATHS.length,
    total_path_count: ALL_VERCEL_CACHE_PURGE_PATHS.length
  }
})

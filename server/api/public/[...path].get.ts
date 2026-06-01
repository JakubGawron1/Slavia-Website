import { isPublicBackendProxyPath, proxyPublicBackendGet } from '../../utils/publicBackendProxy'

/**
 * GET /api/public/athletes → {apiBase}/api/athletes
 * Cache przez routeRules (`s-maxage` + SWR na Vercel).
 */
export default defineEventHandler(async (event) => {
  const segments = getRouterParam(event, 'path')?.split('/').filter(Boolean) ?? []
  const apiPath = `/api/${segments.join('/')}`
  if (!isPublicBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  return proxyPublicBackendGet(apiPath)
})

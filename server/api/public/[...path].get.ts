import { isPublicBackendProxyPath, proxyPublicBackendGet } from '../../utils/publicBackendProxy'

/**
 * GET /api/public/athletes → {apiBase}/api/athletes
 * Bez cache CDN — `routeRules` ustawia `no-store`.
 */
export default defineEventHandler(async (event) => {
  const segments = getRouterParam(event, 'path')?.split('/').filter(Boolean) ?? []
  const apiPath = `/api/${segments.join('/')}`
  if (!isPublicBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  const query = getQuery(event) as Record<string, string | string[] | undefined>
  return proxyPublicBackendGet(apiPath, query)
})

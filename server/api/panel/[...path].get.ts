import {
  applyPanelBffResponseHeaders,
  isPanelBackendProxyPath,
  proxyPanelBackendGet
} from '../../utils/panelBackendProxy'

/**
 * GET /api/panel/* → {apiBase}/api/* (whitelist w `panelBffPaths`).
 * Krótki cache prywatny (przeglądarka) — `routeRules` + nagłówki odpowiedzi.
 */
export default defineEventHandler(async (event) => {
  const segments = getRouterParam(event, 'path')?.split('/').filter(Boolean) ?? []
  const apiPath = `/api/${segments.join('/')}`
  if (!isPanelBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  applyPanelBffResponseHeaders(event)

  const query = getQuery(event) as Record<string, string | string[] | undefined>
  return proxyPanelBackendGet(event, apiPath, query)
})

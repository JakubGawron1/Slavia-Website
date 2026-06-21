import { applyPanelBffResponseHeaders, isPanelBackendProxyPath } from '../../utils/panelBackendProxy'

/** HEAD dla panelowego BFF — health-check bez body JSON. */
export default defineEventHandler((event) => {
  const segments = getRouterParam(event, 'path')?.split('/').filter(Boolean) ?? []
  const apiPath = `/api/${segments.join('/')}`
  if (!isPanelBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  applyPanelBffResponseHeaders(event)
  setResponseStatus(event, 204)
})

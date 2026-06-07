import { isPublicBackendProxyPath } from '../../utils/publicBackendProxy'

/**
 * HEAD dla publicznego BFF — Nitro nie mapuje HEAD na .get.ts automatycznie.
 * Purge cache / health-check bez pobierania body JSON.
 */
export default defineEventHandler((event) => {
  const segments = getRouterParam(event, 'path')?.split('/').filter(Boolean) ?? []
  const apiPath = `/api/${segments.join('/')}`
  if (!isPublicBackendProxyPath(apiPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  setResponseStatus(event, 204)
})

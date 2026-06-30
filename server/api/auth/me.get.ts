import { resolvePublicApiBase } from '../../utils/resolvePublicApiBase'
import type { AuthUser } from '~/types/models'

/** BFF sesji — `GET /api/auth/me` z Bearer (SSR na Vercel + klient). */
export default defineEventHandler(async (event): Promise<AuthUser> => {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const base = await resolvePublicApiBase()

  try {
    return await $fetch(`${base}/api/auth/me`, {
      method: 'GET',
      timeout: 12_000,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
  } catch (e: unknown) {
    const err = e as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: typeof err.statusCode === 'number' ? err.statusCode : 502,
      statusMessage: err.statusMessage || 'Auth backend unavailable'
    })
  }
})

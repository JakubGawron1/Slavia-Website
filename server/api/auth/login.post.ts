import { resolvePublicApiBase } from '../../utils/resolvePublicApiBase'
import type { LoginResponse } from '~/types/models'

interface LoginBody {
  username?: string
  password?: string
  totp_code?: string
}

/** BFF logowania — ten sam origin co WWW (SSR + klient), proxy na HF/Render. */
export default defineEventHandler(async (event): Promise<LoginResponse> => {
  const body = await readBody<LoginBody>(event)
  const base = await resolvePublicApiBase()

  try {
    return await $fetch(`${base}/api/auth/login`, {
      method: 'POST',
      body,
      timeout: 25_000,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
    })
  } catch (e: unknown) {
    const err = e as { statusCode?: number, statusMessage?: string, data?: { message?: string } }
    throw createError({
      statusCode: typeof err.statusCode === 'number' ? err.statusCode : 502,
      statusMessage: err.data?.message || err.statusMessage || 'Login backend unavailable'
    })
  }
})

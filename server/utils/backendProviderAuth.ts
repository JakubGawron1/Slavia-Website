import type { H3Event } from 'h3'

function normalizeBase(url: string | undefined): string {
  return (url || '').trim().replace(/\/$/, '')
}

const AUTH_ME_PATH = '/api/auth/me'
type AuthMeResponse = { roles?: string[] }

export async function ensureSuperAdmin(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Brak tokenu autoryzacji.' })
  }

  const config = useRuntimeConfig(event)
  const candidates = [
    normalizeBase(config.public.apiBaseLeapcell as string),
    normalizeBase(config.public.apiBaseRender as string),
    normalizeBase(config.public.apiBase as string)
  ].filter(Boolean)

  for (const base of candidates) {
    try {
      const me = await $fetch<AuthMeResponse>(`${base}${AUTH_ME_PATH}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (Array.isArray(me.roles) && me.roles.includes('SuperAdmin')) {
        return
      }
    } catch {
      // próbujemy kolejny backend
    }
  }

  throw createError({ statusCode: 403, statusMessage: 'Wymagana rola SuperAdmin.' })
}


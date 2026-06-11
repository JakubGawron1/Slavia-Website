import { resolvePublicApiBase } from '../utils/resolvePublicApiBase'

interface ContactBody {
  name?: string
  email?: string
  phone?: string
  message?: string
  /** Honeypot — ukryte pole anty-spam; wypełnione = bot. */
  website?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ContactBody>(event)

  if (String(body?.website ?? '').trim()) {
    return { ok: true }
  }

  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim()
  const message = String(body?.message ?? '').trim()
  if (!name || !message || !email) {
    throw createError({ statusCode: 400, statusMessage: 'name, email and message are required' })
  }

  const base = await resolvePublicApiBase()
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return await $fetch(`${base}/api/contact`, {
    method: 'POST',
    body: {
      name,
      email,
      phone: String(body?.phone ?? '').trim() || undefined,
      message
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip
    },
    timeout: 20_000
  })
})

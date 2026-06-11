import { resolvePublicApiBase } from '../../../utils/resolvePublicApiBase'
import { checkPublicAiRateLimit } from '../../../utils/publicAiRateLimit'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!checkPublicAiRateLimit(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const body = await readBody(event)
  const base = await resolvePublicApiBase()

  return await $fetch(`${base}/api/ai/coach/public/chat`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip
    },
    timeout: 120_000
  })
})

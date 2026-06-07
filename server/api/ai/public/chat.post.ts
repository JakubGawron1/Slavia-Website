import { resolvePublicApiBase } from '../../../utils/resolvePublicApiBase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const base = await resolvePublicApiBase()
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

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

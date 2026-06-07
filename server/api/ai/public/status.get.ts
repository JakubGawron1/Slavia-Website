import { resolvePublicApiBase } from '../../../utils/resolvePublicApiBase'

export default defineEventHandler(async () => {
  const base = await resolvePublicApiBase()
  return await $fetch(`${base}/api/ai/coach/public/status`, {
    timeout: 10_000
  })
})

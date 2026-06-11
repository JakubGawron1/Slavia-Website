import { resolvePublicApiBase } from '../../../utils/resolvePublicApiBase'

const OFFLINE_STATUS = {
  available: false,
  reason: 'backend_unreachable',
  message: 'Asystent chwilowo niedostępny — spróbuj później.'
} as const

export default defineEventHandler(async () => {
  try {
    const base = await resolvePublicApiBase()
    return await $fetch(`${base}/api/ai/coach/public/status`, {
      timeout: 10_000
    })
  } catch {
    return OFFLINE_STATUS
  }
})

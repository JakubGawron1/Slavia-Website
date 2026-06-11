import { resolvePublicApiBase } from '../../../utils/resolvePublicApiBase'

const OFFLINE_SSE = 'event: stub\ndata: {"message":"stream unavailable"}\n\n'

/** BFF proxy do stub SSE backendu (pełny streaming LLM — backlog). */
export default defineEventHandler(async (event): Promise<string> => {
  try {
    const base = await resolvePublicApiBase()
    const res = await $fetch<string>(`${base}/api/ai/coach/stream`, {
      timeout: 15_000,
      responseType: 'text'
    })
    setResponseHeader(event, 'content-type', 'text/event-stream; charset=utf-8')
    setResponseHeader(event, 'cache-control', 'no-cache')
    return res
  } catch {
    setResponseHeader(event, 'content-type', 'text/event-stream; charset=utf-8')
    return OFFLINE_SSE
  }
})

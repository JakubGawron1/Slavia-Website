/**
 * Prefetch danych API na hover/focus (debounce) — uzupełnia prefetch tras NuxtLink.
 */
export function usePrefetchApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts?: { debounceMs?: number; maxConcurrent?: number }
) {
  const debounceMs = opts?.debounceMs ?? 140
  const nuxtApp = useNuxtApp()
  let timer: ReturnType<typeof setTimeout> | null = null
  let inflight = 0
  const maxConcurrent = opts?.maxConcurrent ?? 2

  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  async function run() {
    if (inflight >= maxConcurrent) return
    const existing = nuxtApp.payload.data[key]
    if (existing !== undefined) return
    inflight++
    try {
      const data = await fetcher()
      nuxtApp.payload.data[key] = data
    } catch {
      /* prefetch best-effort */
    } finally {
      inflight--
    }
  }

  function schedule() {
    cancel()
    timer = setTimeout(() => {
      timer = null
      void run()
    }, debounceMs)
  }

  return {
    onPointerEnter: schedule,
    onFocus: schedule,
    onPointerLeave: cancel,
    onBlur: cancel
  }
}

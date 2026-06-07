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
    if (!nuxtApp.payload.data) {
      nuxtApp.payload.data = {}
    }
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

/**
 * Dynamiczny prefetch (lista wpisów / ranking) — debounce per klucz, zapis do `useNuxtData`.
 */
export function createPrefetchScheduler(opts?: { debounceMs?: number, maxConcurrent?: number }) {
  const debounceMs = opts?.debounceMs ?? 140
  const maxConcurrent = opts?.maxConcurrent ?? 2
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let inflight = 0

  function cancel(key: string) {
    const t = timers.get(key)
    if (t != null) {
      clearTimeout(t)
      timers.delete(key)
    }
  }

  function schedule<T>(key: string, fetcher: () => Promise<T>) {
    if (timers.has(key)) return
    const existing = useNuxtData<T>(key).data.value
    if (existing !== undefined && existing !== null) return

    const t = setTimeout(() => {
      timers.delete(key)
      if (inflight >= maxConcurrent) return
      inflight++
      void fetcher()
        .then((data) => {
          useNuxtData<T>(key).data.value = data
        })
        .catch(() => {})
        .finally(() => {
          inflight--
        })
    }, debounceMs)
    timers.set(key, t)
  }

  return { schedule, cancel }
}

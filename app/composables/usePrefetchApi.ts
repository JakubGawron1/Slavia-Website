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

export type PrefetchScheduler = ReturnType<typeof createPrefetchScheduler>

type ViewportObserveOpts = {
  rootMargin?: string
  threshold?: number
  /** Po pierwszym prefetch — przestań obserwować element (domyślnie true). */
  once?: boolean
}

/**
 * Dynamiczny prefetch (lista wpisów / ranking) — debounce per klucz, zapis do `useNuxtData`.
 * `observeViewport` — prefetch po wejściu karty w viewport (IntersectionObserver, client-only).
 */
export function createPrefetchScheduler(opts?: { debounceMs?: number, maxConcurrent?: number }) {
  const debounceMs = opts?.debounceMs ?? 140
  const maxConcurrent = opts?.maxConcurrent ?? 2
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let inflight = 0

  const viewportFetchers = new Map<string, () => Promise<unknown>>()
  const viewportMeta = new WeakMap<Element, Array<{ key: string, once: boolean }>>()
  let viewportObserver: IntersectionObserver | null = null

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

  function ensureViewportObserver(rootMargin: string, threshold: number) {
    if (!import.meta.client) return null
    if (viewportObserver) return viewportObserver

    viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const metas = viewportMeta.get(entry.target)
          if (!metas?.length) continue

          if (entry.isIntersecting) {
            let unobserve = false
            for (const meta of metas) {
              const fetcher = viewportFetchers.get(meta.key)
              if (fetcher) schedule(meta.key, fetcher)
              if (meta.once) unobserve = true
            }
            if (unobserve) {
              viewportObserver?.unobserve(entry.target)
              viewportMeta.delete(entry.target)
              for (const meta of metas) {
                viewportFetchers.delete(meta.key)
              }
            }
          } else {
            for (const meta of metas) {
              if (!meta.once) cancel(meta.key)
            }
          }
        }
      },
      { root: null, rootMargin, threshold }
    )
    return viewportObserver
  }

  function observeViewport(
    el: Element | null | undefined,
    key: string,
    fetcher: () => Promise<unknown>,
    ioOpts?: ViewportObserveOpts
  ) {
    if (!import.meta.client || !el) return
    const existing = useNuxtData(key).data.value
    if (existing !== undefined && existing !== null) return

    const rootMargin = ioOpts?.rootMargin ?? '160px 0px'
    const threshold = ioOpts?.threshold ?? 0.01
    const once = ioOpts?.once ?? true

    const existingMeta = viewportMeta.get(el) ?? []
    if (existingMeta.some(meta => meta.key === key)) return

    viewportFetchers.set(key, fetcher)
    existingMeta.push({ key, once })
    viewportMeta.set(el, existingMeta)
    ensureViewportObserver(rootMargin, threshold)?.observe(el)
  }

  function disconnectViewport() {
    viewportObserver?.disconnect()
    viewportObserver = null
    viewportFetchers.clear()
  }

  return { schedule, cancel, observeViewport, disconnectViewport }
}

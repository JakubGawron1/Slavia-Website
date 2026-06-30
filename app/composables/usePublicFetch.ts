/** Bazowy URL publicznego BFF (ten sam na SSR i kliencie — spójna hydracja). */
export function usePublicApiBase(): string {
  return '/api/public'
}

const publicFetchTimestamps = new Map<string, number>()

/** Pełny URL do publicznego proxy, np. `/api/public/athletes`. */
export function publicApiUrl(path: string): string {
  const normalized = path.replace(/^\/?api\//, '').replace(/^\//, '')
  return `${usePublicApiBase()}/${normalized}`
}

function readPublicPayloadCache<T>(nuxtApp: ReturnType<typeof useNuxtApp>, cacheKey: string): T | undefined {
  const entry = nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey]
  return entry !== undefined ? (entry as T) : undefined
}

type PublicLazyFetchOpts<T> = {
  key?: string
  default?: () => T
  /** Po stronie klienta — nie odświeżaj danych przez N ms (SWR w pamięci). */
  staleTimeMs?: number
  query?: MaybeRef<Record<string, string | undefined>>
  /** Przekazywane do `useAsyncData` — np. `false` dla danych tylko po logowaniu. */
  server?: boolean
}

/**
 * Publiczne dane przez BFF `/api/public/*` — lazy `useAsyncData` (SSR).
 */
export function usePublicLazyFetch<T>(
  apiPath: string,
  opts: PublicLazyFetchOpts<T> = {}
) {
  const staleTimeMs = opts.staleTimeMs ?? 60_000
  const queryRef = computed(() => toValue(opts.query) ?? {})
  const key = computed(() => {
    const q = queryRef.value
    const qs = Object.entries(q)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    const baseKey = opts.key ?? `public:${apiPath}`
    return qs ? `${baseKey}?${qs}` : baseKey
  })

  function buildUrl() {
    const base = publicApiUrl(apiPath)
    const u = new URL(base, 'http://local')
    for (const [k, v] of Object.entries(queryRef.value)) {
      if (v) u.searchParams.set(k, v)
    }
    return `${u.pathname}${u.search}`
  }

  return useAsyncData<T>(
    key,
    async () => {
      const nuxtApp = useNuxtApp()
      try {
        const result = (await $fetch(buildUrl(), { timeout: 12_000 })) as T
        publicFetchTimestamps.set(key.value, Date.now())
        return result
      } catch (err) {
        const existing = readPublicPayloadCache<T>(nuxtApp, key.value)
        if (existing !== undefined) {
          return existing
        }
        if (opts.default) {
          if (import.meta.dev) {
            console.warn(`[public-api] ${buildUrl()} niedostępne, używam default()`, err)
          }
          return opts.default()
        }
        throw err
      }
    },
    {
      server: opts.server ?? true,
      lazy: true,
      default: opts.default,
      dedupe: 'defer',
      getCachedData: (cacheKey, nuxtApp, ctx) => {
        if (ctx.cause === 'refresh:manual') {
          return undefined
        }

        const fromPayload = readPublicPayloadCache<T>(nuxtApp, cacheKey)
        if (fromPayload === undefined) {
          return undefined
        }

        if (!import.meta.client || staleTimeMs <= 0) {
          return fromPayload
        }

        const fetchedAt = publicFetchTimestamps.get(cacheKey)
        if (!fetchedAt) {
          // Hydracja klienta — zachowaj dane z SSR, nie nadpisuj default() przed fetch.
          publicFetchTimestamps.set(cacheKey, Date.now())
          return fromPayload
        }

        if (Date.now() - fetchedAt < staleTimeMs) {
          return fromPayload
        }

        return undefined
      }
    }
  )
}

/** Grupuje wiersze public-board po `athlete_id`. */
export function groupPublicBoardByAthlete<T extends { athlete_id: string }>(
  rows: T[] | null | undefined
): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const row of rows ?? []) {
    const id = row.athlete_id
    if (!id) continue
    if (!out[id]) out[id] = []
    out[id].push(row)
  }
  return out
}

/** Bazowy URL publicznego BFF (ten sam na SSR i kliencie — spójna hydracja + cache Vercel). */
export function usePublicApiBase(): string {
  return '/api/public'
}

const publicFetchTimestamps = new Map<string, number>()

/** Pełny URL do publicznego proxy, np. `/api/public/athletes`. */
export function publicApiUrl(path: string): string {
  const normalized = path.replace(/^\/?api\//, '').replace(/^\//, '')
  return `${usePublicApiBase()}/${normalized}`
}

type PublicLazyFetchOpts<T> = {
  key?: string
  default?: () => T
  /** Po stronie klienta — nie odświeżaj danych przez N ms (SWR w pamięci). */
  staleTimeMs?: number
  query?: MaybeRef<Record<string, string | undefined>>
}

/**
 * Publiczne dane przez BFF `/api/public/*` — lazy `useAsyncData` (SSG/ISR, cache Vercel).
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
      try {
        const result = (await $fetch(buildUrl())) as T
        publicFetchTimestamps.set(key.value, Date.now())
        return result
      } catch (err) {
        if (import.meta.server && opts.default) {
          return opts.default()
        }
        throw err
      }
    },
    {
      server: true,
      lazy: true,
      default: opts.default,
      dedupe: 'defer',
      getCachedData: (cacheKey, nuxtApp, ctx) => {
        if (ctx.cause === 'refresh:manual' || !import.meta.client || staleTimeMs <= 0) {
          return undefined
        }
        const fetchedAt = publicFetchTimestamps.get(cacheKey)
        if (!fetchedAt || Date.now() - fetchedAt >= staleTimeMs) {
          return undefined
        }
        const entry = nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey]
        return entry !== undefined ? (entry as T) : undefined
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

/** Bazowy URL publicznego BFF (ten sam na SSR i kliencie — spójna hydracja). */
export function usePublicApiBase(): string {
  return '/api/public'
}

/** Pełny URL do publicznego proxy, np. `/api/public/athletes`. */
export function publicApiUrl(path: string): string {
  const normalized = path.replace(/^\/?api\//, '').replace(/^\//, '')
  return `${usePublicApiBase()}/${normalized}`
}

function readSsrPayload<T>(nuxtApp: ReturnType<typeof useNuxtApp>, cacheKey: string): T | undefined {
  const entry = nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey]
  return entry !== undefined ? (entry as T) : undefined
}

/** Tylko hydracja SSR → klient; bez cache między nawigacjami. */
function readHydrationPayload<T>(nuxtApp: ReturnType<typeof useNuxtApp>, cacheKey: string): T | undefined {
  if (import.meta.server || nuxtApp.isHydrating) {
    return readSsrPayload<T>(nuxtApp, cacheKey)
  }
  return undefined
}

type PublicLazyFetchOpts<T> = {
  key?: string
  default?: () => T
  query?: MaybeRef<Record<string, string | undefined>>
  /** Przekazywane do `useAsyncData` — np. `false` dla danych tylko po logowaniu. */
  server?: boolean
}

const PUBLIC_FETCH_OPTIONS = {
  cache: 'no-store' as const,
  headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
}

/**
 * Publiczne dane przez BFF `/api/public/*` — lazy `useAsyncData` (SSR, zawsze świeże z backendu).
 */
export function usePublicLazyFetch<T>(
  apiPath: string,
  opts: PublicLazyFetchOpts<T> = {}
) {
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
        return (await $fetch(buildUrl(), {
          timeout: 12_000,
          ...PUBLIC_FETCH_OPTIONS
        })) as T
      } catch (err) {
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
      dedupe: 'cancel',
      getCachedData: (cacheKey, nuxtApp, ctx) => {
        if (ctx.cause === 'refresh:manual') {
          return undefined
        }
        return readHydrationPayload<T>(nuxtApp, cacheKey)
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

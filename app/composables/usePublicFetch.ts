/** Bazowy URL publicznego BFF (ten sam na SSR i kliencie — spójna hydracja + cache Vercel). */
export function usePublicApiBase(): string {
  return '/api/public'
}

/** Pełny URL do publicznego proxy, np. `/api/public/athletes`. */
export function publicApiUrl(path: string): string {
  const normalized = path.replace(/^\/?api\//, '').replace(/^\//, '')
  return `${usePublicApiBase()}/${normalized}`
}

type PublicLazyFetchOpts<T> = {
  key?: string
  default?: () => T
}

/**
 * Publiczne dane przez BFF `/api/public/*` — lazy `useAsyncData` (SSG/ISR, cache Vercel).
 */
export function usePublicLazyFetch<T>(
  apiPath: string,
  opts: PublicLazyFetchOpts<T> = {}
) {
  const key = opts.key ?? `public:${apiPath}`
  return useAsyncData<T>(
    key,
    async () => (await $fetch(publicApiUrl(apiPath))) as T,
    {
      server: true,
      lazy: true,
      default: opts.default,
      dedupe: 'defer'
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

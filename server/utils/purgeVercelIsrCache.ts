export type VercelCachePurgeResult = {
  path: string
  ok: boolean
  status?: number
  error?: string
}

export type VercelCachePurgeSummary = {
  origin: string
  results: VercelCachePurgeResult[]
  okCount: number
  failCount: number
  at: string
}

function isBffPath(path: string): boolean {
  return path.startsWith('/api/')
}

/** URL purge — BFF dostaje unikalny query (inny klucz CDN), strony ISR bez. */
function buildPurgeUrl(origin: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = `${origin}${normalized}`
  if (!isBffPath(normalized)) {
    return base
  }
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}_slavia_revalidate=${Date.now()}`
}

function isPurgeSuccess(status: number): boolean {
  return (status >= 200 && status < 300) || status === 304
}

export async function purgeVercelIsrCache(options: {
  origin: string
  bypassToken: string
  paths: readonly string[]
}): Promise<VercelCachePurgeSummary> {
  const origin = options.origin.replace(/\/$/, '')
  const results: VercelCachePurgeResult[] = []

  for (const rawPath of options.paths) {
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
    const url = buildPurgeUrl(origin, path)
    const bff = isBffPath(path)

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-prerender-revalidate': options.bypassToken,
          Accept: bff ? 'application/json' : 'text/html,*/*',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Slavia-vercel-cache-purge/1.0'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(30_000)
      })
      const ok = isPurgeSuccess(res.status)
      results.push({
        path,
        ok,
        status: res.status,
        error: ok ? undefined : `HTTP ${res.status}`
      })
    } catch (e) {
      results.push({
        path,
        ok: false,
        error: e instanceof Error ? e.message : String(e)
      })
    }
  }

  const okCount = results.filter(r => r.ok).length
  return {
    origin,
    results,
    okCount,
    failCount: results.length - okCount,
    at: new Date().toISOString()
  }
}

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

export async function purgeVercelIsrCache(options: {
  origin: string
  bypassToken: string
  paths: readonly string[]
}): Promise<VercelCachePurgeSummary> {
  const origin = options.origin.replace(/\/$/, '')
  const results: VercelCachePurgeResult[] = []

  for (const rawPath of options.paths) {
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
    const url = `${origin}${path}`
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: {
          'x-prerender-revalidate': options.bypassToken,
          'User-Agent': 'Slavia-vercel-cache-purge/1.0'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000)
      })
      const ok = res.ok || res.status === 304
      results.push({ path, ok, status: res.status })
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

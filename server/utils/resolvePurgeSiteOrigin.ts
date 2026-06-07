/** Origin do żądań purge — produkcja / preview Vercel, nie localhost gdy dostępny VERCEL_URL. */
export function resolvePurgeSiteOrigin(config: { public: { siteUrl?: string } }): string {
  const fromRuntime = String(config.public.siteUrl ?? '').trim().replace(/\/$/, '')
  if (fromRuntime && !isLocalOrigin(fromRuntime)) {
    return fromRuntime
  }

  const vercel = String(process.env.VERCEL_URL ?? '').trim()
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, '')}`
  }

  return fromRuntime || 'http://localhost:3000'
}

function isLocalOrigin(url: string): boolean {
  const u = url.toLowerCase()
  return u.includes('localhost') || u.includes('127.0.0.1')
}

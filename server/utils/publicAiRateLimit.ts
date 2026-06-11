const buckets = new Map<string, number[]>()

const WINDOW_MS = 60_000
const MAX_PER_MINUTE = 8

/** Prosty limiter Nitro per IP dla publicznego AI (BFF). */
export function checkPublicAiRateLimit(ip: string): boolean {
  const key = ip.trim() || 'unknown'
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter(t => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_MINUTE) {
    return false
  }
  recent.push(now)
  buckets.set(key, recent)
  return true
}

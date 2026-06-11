/** Wynik sondy SSE Trenera AI (BFF → backend stub lub przyszły streaming). */
export type OlympicCoachStreamMode = 'stub' | 'live' | 'offline'

const STUB_MARKER = 'event: stub'

/** Parsuje pierwszy blok SSE — wykrywa stub backendu bez pełnego EventSource. */
export function parseOlympicCoachStreamProbe(body: string): OlympicCoachStreamMode {
  const trimmed = body.trim()
  if (!trimmed) return 'offline'
  if (trimmed.includes(STUB_MARKER)) return 'stub'
  return 'live'
}

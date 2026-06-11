import { describe, expect, it } from 'vitest'
import { parseOlympicCoachStreamProbe } from './olympicCoachStream'

describe('parseOlympicCoachStreamProbe', () => {
  it('detects backend stub event', () => {
    const body = 'event: stub\ndata: {"streaming":false}\n\n'
    expect(parseOlympicCoachStreamProbe(body)).toBe('stub')
  })

  it('treats non-stub SSE as live', () => {
    const body = 'event: token\ndata: {"delta":"hi"}\n\n'
    expect(parseOlympicCoachStreamProbe(body)).toBe('live')
  })

  it('returns offline for empty body', () => {
    expect(parseOlympicCoachStreamProbe('')).toBe('offline')
  })
})

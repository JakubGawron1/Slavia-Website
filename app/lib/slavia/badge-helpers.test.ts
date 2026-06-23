import { describe, expect, it } from 'vitest'
import { getBadgeLevel, getBadgeProgressPercent, getNextBadgeThreshold } from './badgeHelpers'

describe('badgeHelpers', () => {
  const badge = { thresholds: [10, 50, 100], current: 55 }

  it('computes level from thresholds', () => {
    expect(getBadgeLevel({ thresholds: [10, 50], current: 9 })).toBe(0)
    expect(getBadgeLevel({ thresholds: [10, 50], current: 10 })).toBe(1)
    expect(getBadgeLevel(badge)).toBe(2)
    expect(getBadgeLevel({ thresholds: [10, 50], current: 100 })).toBe(2)
  })

  it('progress percent toward next threshold', () => {
    expect(getBadgeProgressPercent(badge)).toBeCloseTo(10)
    expect(getBadgeProgressPercent({ thresholds: [10], current: 20 })).toBe(100)
  })

  it('next threshold or null when maxed', () => {
    expect(getNextBadgeThreshold(badge)).toBe(100)
    expect(getNextBadgeThreshold({ thresholds: [10], current: 20 })).toBeNull()
  })
})

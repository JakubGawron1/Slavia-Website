export interface BadgeThresholds {
  thresholds: number[]
  current: number
}

export function getBadgeLevel(badge: BadgeThresholds): number {
  let level = 0
  for (const t of badge.thresholds) {
    if (badge.current >= t) level++
  }
  return level
}

export function getBadgeProgressPercent(badge: BadgeThresholds): number {
  const level = getBadgeLevel(badge)
  if (level >= badge.thresholds.length) return 100
  const prev = level === 0 ? 0 : badge.thresholds[level - 1]!
  const next = badge.thresholds[level]!
  if (next <= prev) return 100
  return Math.min(100, ((badge.current - prev) / (next - prev)) * 100)
}

export function getNextBadgeThreshold(badge: BadgeThresholds): number | null {
  const level = getBadgeLevel(badge)
  return level < badge.thresholds.length ? badge.thresholds[level]! : null
}

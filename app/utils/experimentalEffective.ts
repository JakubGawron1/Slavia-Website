/**
 * Skuteczny stan flag eksperymentalnych: merge kill switcha z deployu + nadpisań z localStorage + domyślnych.
 */

export function parseExperimentalKillSwitch(raw: string | undefined | null): Set<string> {
  return new Set(
    String(raw ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
}

export function computeExperimentalEnabled(
  id: string,
  opts: { killSwitch: Set<string>, overrides: Record<string, boolean>, defaultEnabled: boolean }
): boolean {
  if (opts.killSwitch.has(id)) {
    return false
  }
  if (Object.prototype.hasOwnProperty.call(opts.overrides, id)) {
    return !!opts.overrides[id]
  }
  return opts.defaultEnabled
}

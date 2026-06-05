/** Płytkie porównanie obiektów/tablic (JSON) — wystarczy dla snapshotów formularzy. */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

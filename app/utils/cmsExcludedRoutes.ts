/** Trasy wyłączone z inline-edycji CMS. */
export const CMS_EXCLUDED_PATHS = [
  '/superadmin/nawigacja-paneli',
  '/superadmin/developer'
] as const

export function isCmsExcludedPath(path: string): boolean {
  const normalized = path.replace(/\/$/, '') || '/'
  return CMS_EXCLUDED_PATHS.some(
    p => normalized === p || normalized.startsWith(`${p}/`)
  )
}

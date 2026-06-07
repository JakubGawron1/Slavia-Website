/** Trasy bez globalnego trybu edycji CMS (puste = edycja wszędzie). */
export const CMS_EXCLUDED_PATHS = [] as const

export function isCmsExcludedPath(_path: string): boolean {
  return false
}

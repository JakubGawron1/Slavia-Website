export type SlaviaPanelRole = 'superadmin' | 'admin' | 'trainer' | 'athlete' | 'guest'

export type RoleCopyMap<T> = Partial<Record<SlaviaPanelRole | 'staff', T>> & { default?: T }

/**
 * Spójne teksty i CTA zależne od roli — zamiast rozproszonych `isStaff` w każdej stronie.
 */
export function useRoleAwareCopy() {
  const auth = useAuth()

  const isStaff = computed(
    () => auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value
  )

  const role = computed<SlaviaPanelRole>(() => {
    if (auth.isSuperAdmin.value) return 'superadmin'
    if (auth.isAdmin.value) return 'admin'
    if (auth.isTrainer.value) return 'trainer'
    if (auth.isAthlete.value) return 'athlete'
    return 'guest'
  })

  function pick<T>(map: RoleCopyMap<T>): T | undefined {
    if (isStaff.value && map.staff !== undefined) return map.staff
    const r = role.value
    if (map[r] !== undefined) return map[r]
    return map.default
  }

  return { isStaff, role, pick }
}

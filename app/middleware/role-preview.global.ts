/** SuperAdmin w trybie podglądu roli — ograniczenie tras i ochrona przed /superadmin. */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()
  const preview = useRolePreview()

  if (!auth.isSuperAdmin.value || !preview.isActive.value) {
    return
  }

  if (to.path === '/superadmin/podglad-roli') {
    return
  }

  if (!preview.pathAllowedInPreview(to.path)) {
    const root = preview.previewRoot.value
    if (root && to.path !== root) {
      return navigateTo(root)
    }
  }
})

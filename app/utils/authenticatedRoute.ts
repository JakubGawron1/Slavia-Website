/** Wspólna ochrona tras — nie wylogowuj przy chwilowej awarii GET /auth/me. */
export async function guardAuthenticatedRoute(
  auth: ReturnType<typeof useAuth>,
  to: { fullPath: string }
) {
  await auth.ensureSession()
  if (!auth.user.value) {
    if (auth.token.value && auth.sessionLoadError.value) {
      return
    }
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }
}

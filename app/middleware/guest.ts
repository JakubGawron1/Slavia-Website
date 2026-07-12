import { resolvePostLoginPath } from '~/composables/useAuth'

function safeInternalRedirect(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return undefined
  }
  return raw
}

/** Strona tylko dla gości — zalogowany użytkownik trafia od razu do panelu. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()

  const user = auth.user.value
  if (!user) return

  if (user.is_banned && !auth.isSuperAdmin.value) {
    return navigateTo('/banned')
  }

  const redirect = safeInternalRedirect(to.query.redirect)
  const clubHubOn = useExperimentalFlag('club_hub')
  return navigateTo(
    redirect ?? resolvePostLoginPath(auth.roles.value, clubHubOn.value),
    { replace: true }
  )
})

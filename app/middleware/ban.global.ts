export default defineNuxtRouteMiddleware(async to => {
  const auth = useAuth()

  // Zapewnij, że `auth.user` jest uzupełnione (jeśli jest token).
  await auth.ensureSession()

  // Przy błędzie /me nie ufamy cache'owanemu `is_banned` (np. po restarcie backendu).
  if (auth.sessionLoadError.value) {
    return
  }

  // Zbanowany user ma widzieć tylko stronę bana + ewentualnie logowanie (żeby mógł zmienić konto).
  // SuperAdmin nie jest blokowany nawet jeśli w DB ktoś ustawi `is_banned=1` (dodatkowe zabezpieczenie).
  if (auth.user.value?.is_banned && !auth.isSuperAdmin.value && to.path !== '/banned' && to.path !== '/logowanie') {
    return navigateTo('/banned')
  }
})


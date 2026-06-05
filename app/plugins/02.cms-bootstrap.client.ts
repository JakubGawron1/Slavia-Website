/** Tło: nawigacja paneli (zalogowani) — bez blokowania startu aplikacji. */
export default defineNuxtPlugin(() => {
  const auth = useAuth()
  const cms = useCms()

  if (!auth.token.value) return

  void cms.hydratePublic(false, { variables: false, navigation: true })
})

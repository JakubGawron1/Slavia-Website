export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const router = useRouter()
  const toast = useToast()

  let navTimer: number | null = null
  let lastHardRecoverAt = 0

  function clearNavTimer() {
    if (navTimer != null) {
      window.clearTimeout(navTimer)
      navTimer = null
    }
  }

  router.beforeEach(() => {
    clearNavTimer()

    // Jeśli nawigacja utknie (np. błąd runtime albo zawieszony main thread),
    // pokazujemy informację i robimy twardy recover — to lepsze UX niż „klikam i nic”.
    navTimer = window.setTimeout(() => {
      const now = Date.now()
      if (now - lastHardRecoverAt < 60_000) return
      lastHardRecoverAt = now
      toast.add({
        title: 'Nawigacja utknęła',
        description: 'Odświeżam aplikację, aby przywrócić działanie linków.',
        color: 'warning'
      })
      window.location.reload()
    }, 12_000)
  })

  router.afterEach(() => {
    clearNavTimer()
  })

  router.onError((err) => {
    clearNavTimer()
    // Router errors potrafią „zatrzymać” kolejne przejścia; log i toast pomagają szybciej zdiagnozować problem.
    console.error('[router] navigation error', err)
    toast.add({
      title: 'Błąd nawigacji',
      description: String(err),
      color: 'error'
    })
  })

  window.addEventListener('unhandledrejection', (ev) => {
    // Nie spamujemy — ale przynajmniej mamy sygnał gdy obietnica wysypie się w tle.
    console.error('[app] unhandledrejection', ev.reason)
  })

  window.addEventListener('error', (ev) => {
    console.error('[app] error', ev.error || ev.message)
  })
})


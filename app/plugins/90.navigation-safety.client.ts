export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const router = useRouter()
  const toast = useToast()

  let navTimer: number | null = null
  let lastHardRecoverAt = 0
  let lastRejectionToastAt = 0

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
    console.error('[app] unhandledrejection', ev.reason)
    const reason = ev.reason as { message?: string, name?: string } | string | undefined
    const msg = String(
      typeof reason === 'object' && reason && 'message' in reason
        ? reason.message
        : reason ?? ''
    )
    const lower = msg.toLowerCase()
    if (
      lower.includes('role_preview_readonly')
      || lower.includes('cancelled')
      || lower.includes('canceled')
      || lower.includes('aborted')
      || lower.includes('navigation')
    ) {
      return
    }
    const now = Date.now()
    if (now - lastRejectionToastAt < 8_000) return
    lastRejectionToastAt = now
    toast.add({
      title: 'Nieoczekiwany błąd',
      description: 'Operacja w tle nie powiodła się. Odśwież stronę, jeśli problem się powtarza.',
      color: 'error'
    })
  })

  window.addEventListener('error', (ev) => {
    console.error('[app] error', ev.error || ev.message)
  })
})


/** Zdarzenie `beforeinstallprompt` (Chrome / Edge na Androidzie i desktopie). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Instalacja PWA witryny Slavia — przycisk + wykrywanie iOS / standalone.
 * Wymaga HTTPS (produkcja); na localhost instalacja może być niedostępna.
 */
export function useSlaviaPwaInstall() {
  const canPromptInstall = ref(false)
  const isStandalone = ref(false)
  const isIos = ref(false)
  const isAndroid = ref(false)
  const installLoading = ref(false)

  let deferredPrompt: BeforeInstallPromptEvent | null = null

  const isInstalled = computed(() => isStandalone.value)

  const showIosGuide = computed(
    () => isIos.value && !isStandalone.value && !canPromptInstall.value
  )

  const showAndroidManual = computed(
    () => isAndroid.value && !isStandalone.value && !canPromptInstall.value
  )

  const showDesktopHint = computed(
    () => !isIos.value && !isAndroid.value && !isStandalone.value && !canPromptInstall.value
  )

  function syncStandalone() {
    if (!import.meta.client) return
    const nav = window.navigator as Navigator & { standalone?: boolean }
    isStandalone.value =
      window.matchMedia('(display-mode: standalone)').matches
      || nav.standalone === true
  }

  onMounted(() => {
    if (!import.meta.client) return

    const ua = navigator.userAgent.toLowerCase()
    isIos.value = /iphone|ipad|ipod/.test(ua) && !('MSStream' in window)
    isAndroid.value = /android/.test(ua)
    syncStandalone()

    if (isStandalone.value) return

    const onBip = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      canPromptInstall.value = true
    }

    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', () => {
      canPromptInstall.value = false
      deferredPrompt = null
      syncStandalone()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('beforeinstallprompt', onBip)
    })
  })

  async function install(): Promise<boolean> {
    if (!deferredPrompt || installLoading.value) return false
    installLoading.value = true
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      deferredPrompt = null
      canPromptInstall.value = false
      if (outcome === 'accepted') {
        syncStandalone()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      installLoading.value = false
    }
  }

  return {
    canPromptInstall,
    isInstalled,
    isIos,
    isAndroid,
    showIosGuide,
    showAndroidManual,
    showDesktopHint,
    installLoading,
    install
  }
}

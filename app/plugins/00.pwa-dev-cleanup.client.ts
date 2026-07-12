/** Usuwa starą rejestrację dev SW (`/dev-sw.js`) — PWA w dev jest wyłączone. */
export default defineNuxtPlugin(async () => {
  if (!import.meta.dev || !import.meta.client || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      regs
        .filter((reg) => {
          const url
            = reg.active?.scriptURL
              ?? reg.installing?.scriptURL
              ?? reg.waiting?.scriptURL
              ?? ''
          return url.includes('dev-sw')
        })
        .map(reg => reg.unregister())
    )
  } catch {
    /* private mode / blocked */
  }
})

/**
 * Uruchamia pracę po pierwszym malowaniu — nextTick + requestIdleCallback (fallback: setTimeout).
 * Panel CSR: odroczenie niekrytycznych fetchy, żeby shell dashboardu pojawił się wcześniej.
 */
export function scheduleIdleWork(work: () => void): void {
  if (!import.meta.client) {
    work()
    return
  }
  nextTick(() => {
    const run = () => work()
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 2_000 })
    } else {
      setTimeout(run, 0)
    }
  })
}

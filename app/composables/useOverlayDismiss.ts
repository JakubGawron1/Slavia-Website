/**
 * Zamykanie overlayu: ESC, przycisk X, gest wstecz (history.popstate) na telefonie.
 */
export function useOverlayDismiss(
  open: Ref<boolean>,
  options: {
    onClose?: () => void
    canClose?: () => boolean
    /** Klucz w history.state — unikalny per overlay. */
    historyKey?: string
    /** Wyłącza synchronizację z history API (np. prosty SlaviaModal). */
    enabled?: Ref<boolean> | (() => boolean)
  } = {}
) {
  const isEnabled = () => {
    const e = options.enabled
    if (e === undefined) return true
    return typeof e === 'function' ? e() : e.value
  }
  const stateKey = options.historyKey ?? 'slaviaOverlay'
  let historyPushed = false
  let closingFromPopstate = false
  let closingFromDismiss = false

  function canClose() {
    return options.canClose?.() !== false
  }

  function dismiss() {
    if (!open.value || !canClose()) return
    closingFromDismiss = true
    open.value = false
    options.onClose?.()
    nextTick(() => {
      closingFromDismiss = false
    })
  }

  function onEscape(e: KeyboardEvent) {
    if (!open.value || e.key !== 'Escape') return
    e.preventDefault()
    e.stopImmediatePropagation()
    dismiss()
  }

  function onPopState() {
    if (!isEnabled()) return
    if (closingFromDismiss) return
    if (!open.value) return
    closingFromPopstate = true
    open.value = false
    options.onClose?.()
    historyPushed = false
    nextTick(() => {
      closingFromPopstate = false
    })
  }

  function syncHistoryAfterClose() {
    if (!historyPushed || closingFromPopstate) return
    historyPushed = false
    if (history.state?.[stateKey]) {
      history.back()
    }
  }

  watch(open, (isOpen) => {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('overflow-hidden', isOpen)

    if (!isEnabled()) return

    if (isOpen) {
      if (!historyPushed) {
        history.pushState({ ...history.state, [stateKey]: 1 }, '')
        historyPushed = true
      }
      return
    }

    syncHistoryAfterClose()
  })

  onMounted(() => {
    if (!import.meta.client) return
    window.addEventListener('keydown', onEscape, { capture: true })
    window.addEventListener('popstate', onPopState)
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    window.removeEventListener('keydown', onEscape, { capture: true })
    window.removeEventListener('popstate', onPopState)
    document.documentElement.classList.remove('overflow-hidden')
    if (historyPushed && !closingFromPopstate) {
      historyPushed = false
      if (history.state?.[stateKey]) {
        history.back()
      }
    }
  })

  return { dismiss }
}

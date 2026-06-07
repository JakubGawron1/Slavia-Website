/**
 * Gest wstecz od lewej krawędzi (iOS / natywny czat) z podglądem przesunięcia.
 */
export type EdgeSwipeBackOptions = {
  enabled?: MaybeRefOrGetter<boolean>
  canSwipe?: () => boolean
  onBack: () => void | Promise<void>
  /** Szerokość strefy aktywacji od lewej (px). */
  edgeWidth?: number
  /** Ułamek szerokości ekranu — próg ukończenia gestu. */
  thresholdRatio?: number
}

export function useEdgeSwipeBack(
  targetRef: Ref<HTMLElement | null>,
  options: EdgeSwipeBackOptions
) {
  const edgeWidth = options.edgeWidth ?? 28
  const thresholdRatio = options.thresholdRatio ?? 0.28

  const offset = ref(0)
  const tracking = ref(false)
  const completing = ref(false)

  let startX = 0
  let startY = 0
  let axisLocked: 'x' | 'y' | null = null
  let pointerId: number | null = null

  const swipeStyle = computed(() => {
    if (offset.value <= 0 && !completing.value) return undefined
    const transition = tracking.value
      ? 'none'
      : 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
    return {
      transform: `translate3d(${offset.value}px, 0, 0)`,
      transition
    }
  })

  const backdropOpacity = computed(() => {
    if (offset.value <= 0) return 0
    const max = typeof window !== 'undefined' ? window.innerWidth * 0.45 : 180
    return Math.min(offset.value / max, 1) * 0.42
  })

  function isEnabled() {
    if (!import.meta.client) return false
    const enabled = options.enabled
    if (enabled === undefined) return true
    return toValue(enabled)
  }

  function canSwipe() {
    return options.canSwipe?.() !== false
  }

  function thresholdPx() {
    if (!import.meta.client) return 96
    return Math.max(72, Math.round(window.innerWidth * thresholdRatio))
  }

  function resetOffset(animate = true) {
    completing.value = false
    tracking.value = false
    axisLocked = null
    pointerId = null
    if (!animate) {
      offset.value = 0
      return
    }
    offset.value = 0
  }

  async function finishBack() {
    if (!import.meta.client) return
    completing.value = true
    tracking.value = false
    offset.value = window.innerWidth
    await new Promise(r => setTimeout(r, 220))
    await options.onBack()
    resetOffset(false)
  }

  function onPointerDown(e: PointerEvent) {
    if (!isEnabled() || !canSwipe()) return
    if (e.pointerType === 'mouse') return
    if (e.clientX > edgeWidth) return
    if (completing.value) return

    const el = targetRef.value
    if (!el) return

    pointerId = e.pointerId
    startX = e.clientX
    startY = e.clientY
    axisLocked = null
    tracking.value = false
    offset.value = 0

    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId === null || e.pointerId !== pointerId) return
    if (!isEnabled() || !canSwipe()) return

    const dx = e.clientX - startX
    const dy = e.clientY - startY

    if (!axisLocked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      axisLocked = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      if (axisLocked === 'y') {
        resetOffset(false)
        return
      }
    }

    if (axisLocked !== 'x') return

    tracking.value = true
    const next = Math.max(0, dx)
    offset.value = next

    if (next > 8) e.preventDefault()
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId === null || e.pointerId !== pointerId) return

    const el = targetRef.value
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    const shouldComplete = offset.value >= thresholdPx()
    pointerId = null
    axisLocked = null
    tracking.value = false

    if (shouldComplete) {
      void finishBack()
      return
    }

    resetOffset(true)
  }

  function onPointerCancel(e: PointerEvent) {
    if (pointerId === null || e.pointerId !== pointerId) return
    resetOffset(true)
  }

  function bind() {
    const el = targetRef.value
    if (!el || !import.meta.client) return

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove, { passive: false })
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)
  }

  function unbind() {
    const el = targetRef.value
    if (!el || !import.meta.client) return

    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerCancel)
  }

  watch(targetRef, (el, prev) => {
    if (prev) unbind()
    if (el) bind()
  })

  onMounted(() => {
    bind()
  })

  onBeforeUnmount(() => {
    unbind()
    resetOffset(false)
  })

  return {
    offset,
    tracking,
    completing,
    swipeStyle,
    backdropOpacity,
    resetOffset
  }
}

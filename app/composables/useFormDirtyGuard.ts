import { isEqual } from '~/utils/isEqual'

/** Porównanie snapshotów formularza — ostrzeżenie przed zamknięciem bez zapisu. */
export function useFormDirtyGuard<T>(getCurrent: () => T, options?: { equals?: (a: T, b: T) => boolean }) {
  const equals = options?.equals ?? isEqual
  const baseline = ref<T | null>(null)

  const isDirty = computed(() => {
    if (baseline.value === null) return false
    return !equals(baseline.value, getCurrent())
  })

  function captureBaseline() {
    baseline.value = structuredClone(getCurrent())
  }

  function markClean() {
    captureBaseline()
  }

  function resetBaseline() {
    baseline.value = null
  }

  function confirmDiscard(message = 'Masz niezapisane zmiany. Zamknąć bez zapisu?'): boolean {
    if (!isDirty.value) return true
    if (!import.meta.client) return true
    return window.confirm(message)
  }

  return { isDirty, captureBaseline, markClean, resetBaseline, confirmDiscard }
}

const STORAGE_PREFIX = 'slavia-form-scroll:'

/** Zapamiętuje ostatnie pole formularza (ideas #4). */
export function useFormFieldScrollRestore(formKey: string) {
  const storageKey = `${STORAGE_PREFIX}${formKey}`

  function rememberField(fieldId: string) {
    if (!import.meta.client || !fieldId) {
      return
    }
    try {
      localStorage.setItem(storageKey, fieldId)
    } catch {
      /* ignore */
    }
  }

  function restoreScroll(container?: HTMLElement | null) {
    if (!import.meta.client) {
      return
    }
    let fieldId = ''
    try {
      fieldId = localStorage.getItem(storageKey) || ''
    } catch {
      return
    }
    if (!fieldId) {
      return
    }
    const root = container || document
    const el = root.querySelector?.(`[data-form-field="${fieldId}"]`) as HTMLElement | null
    if (el) {
      queueMicrotask(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  return { rememberField, restoreScroll }
}

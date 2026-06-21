export const BACKEND_WAKE_TOAST_ID = 'slavia-backend-waking'

export const BACKEND_WAKE_MESSAGE = 'Serwer się uruchamia — spróbuj za chwilę'

type ToastApi = {
  add: (toast: Record<string, unknown>) => unknown
  remove: (id: string | number) => void
}

type WakeNoticeState = {
  /** Toast już wyświetlony w bieżącej „awarii” HF. */
  episodeActive: boolean
  /** Użytkownik zamknął banner — nie pokazuj ponownie do pierwszej udanej odpowiedzi. */
  dismissed: boolean
}

let state: WakeNoticeState = {
  episodeActive: false,
  dismissed: false
}

export function isBackendWakingStatus(status: number | undefined): boolean {
  return status === 502 || status === 503
}

/** Tylko testy — reset modułowego stanu. */
export function resetBackendWakeNoticeState() {
  state = { episodeActive: false, dismissed: false }
}

export function shouldShowBackendWakeNotice(status: number | undefined): boolean {
  if (!isBackendWakingStatus(status)) return false
  return !state.episodeActive && !state.dismissed
}

/** Pierwszy 502/503 w sesji awarii — toast z możliwością zamknięcia. */
export function notifyBackendWakingIfNeeded(status: number | undefined, toast: ToastApi) {
  if (!shouldShowBackendWakeNotice(status)) return

  state.episodeActive = true
  toast.add({
    id: BACKEND_WAKE_TOAST_ID,
    title: BACKEND_WAKE_MESSAGE,
    color: 'warning',
    icon: 'i-lucide-loader-circle',
    duration: 0,
    progress: false,
    close: true,
    type: 'background',
    onUpdateOpen: (open: boolean) => {
      if (!open) {
        state.dismissed = true
      }
    }
  })
}

/** Udana odpowiedź backendu — reset epizodu i ukrycie bannera. */
export function markBackendAwake(toast?: Pick<ToastApi, 'remove'>) {
  state = { episodeActive: false, dismissed: false }
  toast?.remove(BACKEND_WAKE_TOAST_ID)
}

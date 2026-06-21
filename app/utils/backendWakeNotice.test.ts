import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  BACKEND_WAKE_MESSAGE,
  BACKEND_WAKE_TOAST_ID,
  markBackendAwake,
  notifyBackendWakingIfNeeded,
  resetBackendWakeNoticeState,
  shouldShowBackendWakeNotice
} from './backendWakeNotice'

function mockToast() {
  return {
    add: vi.fn(),
    remove: vi.fn()
  }
}

describe('backendWakeNotice', () => {
  beforeEach(() => {
    resetBackendWakeNoticeState()
  })

  it('shouldShowBackendWakeNotice matches 502/503 only', () => {
    expect(shouldShowBackendWakeNotice(502)).toBe(true)
    expect(shouldShowBackendWakeNotice(503)).toBe(true)
    expect(shouldShowBackendWakeNotice(500)).toBe(false)
    expect(shouldShowBackendWakeNotice(undefined)).toBe(false)
  })

  it('notifyBackendWakingIfNeeded shows toast once per episode', () => {
    const toast = mockToast()

    notifyBackendWakingIfNeeded(502, toast)
    notifyBackendWakingIfNeeded(502, toast)
    notifyBackendWakingIfNeeded(503, toast)

    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: BACKEND_WAKE_TOAST_ID,
        title: BACKEND_WAKE_MESSAGE,
        duration: 0,
        close: true
      })
    )
  })

  it('does not show again after user dismisses until backend is awake', () => {
    const toast = mockToast()

    notifyBackendWakingIfNeeded(503, toast)
    const options = toast.add.mock.calls[0]![0] as { onUpdateOpen?: (open: boolean) => void }
    options.onUpdateOpen?.(false)

    notifyBackendWakingIfNeeded(502, toast)
    expect(toast.add).toHaveBeenCalledTimes(1)
  })

  it('markBackendAwake resets episode and removes toast', () => {
    const toast = mockToast()

    notifyBackendWakingIfNeeded(502, toast)
    markBackendAwake(toast)

    expect(toast.remove).toHaveBeenCalledWith(BACKEND_WAKE_TOAST_ID)
    expect(shouldShowBackendWakeNotice(503)).toBe(true)

    notifyBackendWakingIfNeeded(503, toast)
    expect(toast.add).toHaveBeenCalledTimes(2)
  })
})

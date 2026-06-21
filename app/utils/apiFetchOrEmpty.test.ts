import { describe, expect, it, vi } from 'vitest'
import { apiFetchOrEmpty } from './apiFetchOrEmpty'

describe('apiFetchOrEmpty', () => {
  it('returns fetcher result on success', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1 })
    await expect(apiFetchOrEmpty(fetcher)).resolves.toEqual({ id: 1 })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('returns null on error without toast by default', async () => {
    const addToast = vi.fn()
    const fetcher = vi.fn().mockRejectedValue(new Error('network'))

    await expect(
      apiFetchOrEmpty(fetcher, undefined, { addToast })
    ).resolves.toBeNull()

    expect(addToast).not.toHaveBeenCalled()
  })

  it('returns custom fallback on error', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'))
    await expect(
      apiFetchOrEmpty(fetcher, { fallback: [] as string[] })
    ).resolves.toEqual([])
  })

  it('shows default toast when toast: true', async () => {
    const addToast = vi.fn()
    const fetcher = vi.fn().mockRejectedValue(new Error('timeout'))

    await apiFetchOrEmpty(
      fetcher,
      { toast: true },
      { addToast, getErrorMessage: () => 'Brak odpowiedzi backendu (timeout).' }
    )

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Brak danych',
        description: 'Brak odpowiedzi backendu (timeout).',
        color: 'warning'
      })
    )
  })

  it('merges custom toast fields', async () => {
    const addToast = vi.fn()
    const fetcher = vi.fn().mockRejectedValue(new Error('x'))

    await apiFetchOrEmpty(
      fetcher,
      {
        toast: {
          title: 'KPI niedostępne',
          description: 'Spróbuj odświeżyć za chwilę.',
          color: 'warning'
        }
      },
      { addToast }
    )

    expect(addToast).toHaveBeenCalledWith({
      title: 'KPI niedostępne',
      description: 'Spróbuj odświeżyć za chwilę.',
      color: 'warning'
    })
  })
})

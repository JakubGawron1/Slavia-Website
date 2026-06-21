import { describe, expect, it, vi } from 'vitest'
import {
  DASHBOARD_KPI_MAX_ATTEMPTS,
  DASHBOARD_KPI_RETRY_DELAYS_MS,
  fetchWithDashboardKpiRetry,
  isDashboardKpiRetryableError
} from './dashboardKpiLoadLogic'

function hfError(status: number) {
  return { response: { status } }
}

describe('dashboardKpiLoadLogic — retryable HF errors', () => {
  it('isDashboardKpiRetryableError matches 502 and 503 only', () => {
    expect(isDashboardKpiRetryableError(hfError(502))).toBe(true)
    expect(isDashboardKpiRetryableError(hfError(503))).toBe(true)
    expect(isDashboardKpiRetryableError(hfError(500))).toBe(false)
    expect(isDashboardKpiRetryableError(hfError(404))).toBe(false)
    expect(isDashboardKpiRetryableError(new Error('network'))).toBe(false)
  })

  it('fetchWithDashboardKpiRetry succeeds on first attempt', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    await expect(fetchWithDashboardKpiRetry(fetcher)).resolves.toEqual({ ok: true })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('fetchWithDashboardKpiRetry retries 502 with backoff then succeeds', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(hfError(502))
      .mockRejectedValueOnce(hfError(503))
      .mockResolvedValue({ value: 42 })

    await expect(
      fetchWithDashboardKpiRetry(fetcher, { sleep })
    ).resolves.toEqual({ value: 42 })

    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenNthCalledWith(1, DASHBOARD_KPI_RETRY_DELAYS_MS[0])
    expect(sleep).toHaveBeenNthCalledWith(2, DASHBOARD_KPI_RETRY_DELAYS_MS[1])
  })

  it('fetchWithDashboardKpiRetry stops after max attempts on persistent 503', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const fetcher = vi.fn().mockRejectedValue(hfError(503))

    await expect(
      fetchWithDashboardKpiRetry(fetcher, { sleep })
    ).rejects.toEqual(hfError(503))

    expect(fetcher).toHaveBeenCalledTimes(DASHBOARD_KPI_MAX_ATTEMPTS)
    expect(sleep).toHaveBeenCalledTimes(DASHBOARD_KPI_MAX_ATTEMPTS - 1)
  })

  it('fetchWithDashboardKpiRetry does not retry non-retryable errors', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    const err = hfError(500)
    const fetcher = vi.fn().mockRejectedValue(err)

    await expect(fetchWithDashboardKpiRetry(fetcher, { sleep })).rejects.toEqual(err)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })
})

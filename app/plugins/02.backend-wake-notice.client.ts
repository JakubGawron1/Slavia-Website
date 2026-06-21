import type { FetchError } from 'ofetch'
import { markBackendAwake, notifyBackendWakingIfNeeded } from '~/utils/backendWakeNotice'

/**
 * Globalny hook 502/503 (HF cold start) dla `$fetch` spoza `useApi()`.
 * `useApi()` ma własne hooki — wspólny stan w `backendWakeNotice` zapobiega spamowi.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return
  }

  const toast = useToast()
  const baseFetch = globalThis.$fetch

  async function wrappedFetch(...args: Parameters<typeof baseFetch>) {
    try {
      const result = await baseFetch(...args)
      markBackendAwake(toast)
      return result
    } catch (error) {
      const status = (error as FetchError)?.response?.status
      notifyBackendWakingIfNeeded(status, toast)
      throw error
    }
  }

  Object.assign(wrappedFetch, baseFetch)
  globalThis.$fetch = wrappedFetch as typeof baseFetch
})

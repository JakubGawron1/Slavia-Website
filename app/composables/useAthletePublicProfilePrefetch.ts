import type { AthletePublicProfile, CompetitionResult } from '~/types/models'
import { athleteProfilePath } from '~/utils/slug'

const VIEWPORT_IO = { rootMargin: '160px 0px', threshold: 0.01, once: true } as const

/**
 * Prefetch profilu publicznego zawodnika — dane przez BFF `/api/public/*` (cache Vercel ISR)
 * oraz preload komponentu trasy `/athlete/[slug]`.
 */
export function useAthletePublicProfilePrefetch() {
  const scheduler = createPrefetchScheduler({ debounceMs: 140, maxConcurrent: 3 })
  const prefetchedRoutes = new Set<string>()

  function athleteDetailKey(id: string) {
    return `athlete-detail-${id}`
  }

  function athleteResultsKey(id: string) {
    return `athlete-results-${id}`
  }

  function fetchAthleteDetail(id: string) {
    return $fetch<AthletePublicProfile>(publicApiUrl(`athletes/${encodeURIComponent(id)}`))
  }

  function fetchAthleteResults(id: string) {
    return $fetch<CompetitionResult[]>(
      publicApiUrl(`results/athlete/${encodeURIComponent(id)}`)
    )
  }

  function prefetchRoute(name: string, id: string) {
    if (!import.meta.client) return
    const path = athleteProfilePath(name, id)
    if (prefetchedRoutes.has(path)) return
    prefetchedRoutes.add(path)
    void preloadRouteComponents(path).catch(() => {})
  }

  function prefetchAthleteProfile(id?: string | null, name?: string | null) {
    if (!id) return
    scheduler.schedule(athleteDetailKey(id), () => fetchAthleteDetail(id))
    scheduler.schedule(athleteResultsKey(id), () => fetchAthleteResults(id))
    if (name) prefetchRoute(name, id)
  }

  function cancelAthletePrefetch(id?: string | null) {
    if (!id) return
    scheduler.cancel(athleteDetailKey(id))
    scheduler.cancel(athleteResultsKey(id))
  }

  function athletePrefetchHandlers(id?: string | null, name?: string | null) {
    return {
      onPointerenter: () => prefetchAthleteProfile(id, name),
      onFocus: () => prefetchAthleteProfile(id, name),
      onPointerleave: () => cancelAthletePrefetch(id),
      onBlur: () => cancelAthletePrefetch(id)
    }
  }

  function observeAthleteCard(el: Element | null | undefined, id?: string | null, name?: string | null) {
    if (!id) return
    scheduler.observeViewport(el, athleteDetailKey(id), () => fetchAthleteDetail(id), VIEWPORT_IO)
    scheduler.observeViewport(el, athleteResultsKey(id), () => fetchAthleteResults(id), VIEWPORT_IO)
    if (name) {
      scheduler.observeViewport(
        el,
        `athlete-route-${id}`,
        async () => {
          prefetchRoute(name, id)
          return null
        },
        VIEWPORT_IO
      )
    }
  }

  /** Podłącza viewport prefetch do `[data-athlete-prefetch-id]` w kontenerze listy. */
  function connectPrefetchContainer(container: HTMLElement | null | undefined) {
    if (!container || !import.meta.client) return
    container.querySelectorAll<HTMLElement>('[data-athlete-prefetch-id]').forEach((el) => {
      const id = el.dataset.athletePrefetchId
      const name = el.dataset.athletePrefetchName
      if (id) observeAthleteCard(el, id, name)
    })
  }

  function rescanPrefetchContainers(...containers: Array<HTMLElement | null | undefined>) {
    scheduler.disconnectViewport()
    for (const container of containers) {
      connectPrefetchContainer(container)
    }
  }

  function disconnectPrefetchContainers() {
    scheduler.disconnectViewport()
  }

  onScopeDispose(() => {
    disconnectPrefetchContainers()
  })

  return {
    prefetchAthleteProfile,
    cancelAthletePrefetch,
    athletePrefetchHandlers,
    connectPrefetchContainer,
    rescanPrefetchContainers,
    disconnectPrefetchContainers
  }
}

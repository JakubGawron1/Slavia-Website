/**
 * Pokazuje mini-header profilu zawodnika, gdy hero (karta z h1) zjedzie pod site header.
 */
export function useAthleteProfileStickyHeader(heroRef: Ref<HTMLElement | null>) {
  const visible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!import.meta.client) return

    const el = heroRef.value
    if (!el) return

    observer = new IntersectionObserver(
      ([entry]) => {
        visible.value = entry != null && !entry.isIntersecting
      },
      {
        root: null,
        rootMargin: '-4.25rem 0px 0px 0px',
        threshold: 0
      }
    )
    observer.observe(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { visible }
}

export type CalendarViewMode = 'agenda' | 'grid'

const STORAGE_PREFIX = 'slavia-calendar-view:'

/** Tailwind `sm` — spójnie z `hidden sm:block` w widokach kalendarza. */
const MOBILE_MQ = '(max-width: 639px)'

function readStoredMode(key: string): CalendarViewMode | null {
  if (!import.meta.client) return null
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
  return raw === 'agenda' || raw === 'grid' ? raw : null
}

function writeStoredMode(key: string, mode: CalendarViewMode) {
  if (!import.meta.client) return
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, mode)
}

/**
 * Widok kalendarza: na mobile zawsze agenda; na desktop wybór siatki lub agendy (localStorage).
 */
export function useCalendarViewMode(storageKey: string) {
  const viewMode = ref<CalendarViewMode>('grid')
  const isMobile = ref(
    import.meta.client ? window.matchMedia(MOBILE_MQ).matches : false
  )

  const effectiveView = computed<CalendarViewMode>(() =>
    isMobile.value ? 'agenda' : viewMode.value
  )

  const showViewToggle = computed(() => !isMobile.value)

  function setViewMode(mode: CalendarViewMode) {
    viewMode.value = mode
    if (!isMobile.value) {
      writeStoredMode(storageKey, mode)
    }
  }

  if (import.meta.client) {
    const stored = readStoredMode(storageKey)
    if (stored) {
      viewMode.value = stored
    }
  }

  onMounted(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const syncMobile = () => {
      isMobile.value = mq.matches
    }
    syncMobile()
    mq.addEventListener('change', syncMobile)
    onUnmounted(() => mq.removeEventListener('change', syncMobile))
  })

  return {
    viewMode,
    isMobile,
    effectiveView,
    showViewToggle,
    setViewMode
  }
}

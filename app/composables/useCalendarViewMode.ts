export type CalendarViewMode = 'agenda' | 'grid'

const STORAGE_PREFIX = 'slavia-calendar-view:'

/** Tailwind `sm` — spójnie z `hidden sm:block` w widokach kalendarza. */
const MOBILE_MQ = '(max-width: 639px)'

function storageCookieKey(storageKey: string): string {
  return `slavia_cal_view_${storageKey.replace(/[^a-z0-9_-]/gi, '_')}`
}

function readStoredMode(key: string): CalendarViewMode | null {
  if (!import.meta.client) return null
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
  return raw === 'agenda' || raw === 'grid' ? raw : null
}

function writeStoredMode(key: string, mode: CalendarViewMode) {
  if (!import.meta.client) return
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, mode)
}

function resolveInitialMode(storageKey: string, cookieValue: CalendarViewMode | null): CalendarViewMode {
  if (cookieValue === 'agenda' || cookieValue === 'grid') return cookieValue
  if (import.meta.client) {
    const legacy = readStoredMode(storageKey)
    if (legacy) return legacy
  }
  return 'grid'
}

/**
 * Widok kalendarza: na mobile zawsze agenda; na desktop wybór siatki lub agendy.
 * Preferencja w cookie (SSR + hydracja) z migracją ze starego localStorage.
 */
export function useCalendarViewMode(storageKey: string) {
  const viewModeCookie = useCookie<CalendarViewMode | null>(storageCookieKey(storageKey), {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  if (import.meta.client) {
    const legacy = readStoredMode(storageKey)
    if (legacy && !viewModeCookie.value) {
      viewModeCookie.value = legacy
    }
  }

  const viewMode = ref<CalendarViewMode>(resolveInitialMode(storageKey, viewModeCookie.value))
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
      viewModeCookie.value = mode
      writeStoredMode(storageKey, mode)
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

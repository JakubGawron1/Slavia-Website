export type SlaviaBackMode = 'link' | 'history'

export type SlaviaBackTarget = {
  mode: SlaviaBackMode
  to?: string
  label: string
}

export type SlaviaBackOverride = {
  to?: string
  label?: string
  mode?: SlaviaBackMode
  hidden?: boolean
}

const DEFAULT_BACK_LABEL = 'Wróć'

/**
 * Trasy główne — bez przycisku wstecz w nagłówku (link do rodzica).
 * `/galeria` celowo pominięta: po wejściu z innej strony klubu pokazujemy „historia” (Vue Router).
 */
const TOP_LEVEL_PATHS = new Set([
  '/',
  '/aktualnosci',
  '/zawodnicy',
  '/kalendarz',
  '/kontakt',
  '/ogloszenia',
  '/logowanie',
  '/o-klubie',
  '/kalkulator-sinclair',
  '/kalkulator-proporcji',
  '/admin',
  '/trainer',
  '/athlete',
  '/superadmin',
  '/profil',
  '/dziennik',
  '/powiadomienia',
  '/chat',
  '/attendance',
  '/banned'
])

const pageBackOverride = ref<SlaviaBackOverride | null>(null)
const canUseHistoryBack = ref(false)

function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}

function inferParentPath(path: string): string | null {
  const normalized = normalizePath(path)
  if (TOP_LEVEL_PATHS.has(normalized)) return null

  if (normalized.startsWith('/athlete/')) return '/zawodnicy'
  if (normalized.startsWith('/klub/')) return '/zawodnicy'
  if (normalized.startsWith('/zawodnicy/')) return '/zawodnicy'
  if (normalized.startsWith('/aktualnosci/')) return '/aktualnosci'

  const segments = normalized.split('/').filter(Boolean)
  if (segments.length <= 1) return null

  return `/${segments.slice(0, -1).join('/')}`
}

function resolveBackFromRoute(route: ReturnType<typeof useRoute>): SlaviaBackTarget | null {
  const path = normalizePath(route.path)
  if (TOP_LEVEL_PATHS.has(path)) return null

  const meta = route.meta
  if (meta.hideBack) return null

  if (typeof meta.backTo === 'string' && meta.backTo) {
    return {
      mode: 'link',
      to: meta.backTo,
      label: meta.backLabel ?? DEFAULT_BACK_LABEL
    }
  }

  const inferred = inferParentPath(path)
  if (inferred && inferred !== path) {
    return {
      mode: 'link',
      to: inferred,
      label: DEFAULT_BACK_LABEL
    }
  }

  if (import.meta.client && canUseHistoryBack.value) {
    return {
      mode: 'history',
      label: DEFAULT_BACK_LABEL
    }
  }

  return null
}

function resolveBackTarget(
  route: ReturnType<typeof useRoute>,
  override: SlaviaBackOverride | null
): SlaviaBackTarget | null {
  if (override?.hidden) return null

  if (override) {
    if (override.to) {
      return {
        mode: 'link',
        to: override.to,
        label: override.label ?? DEFAULT_BACK_LABEL
      }
    }
    if (override.mode === 'history') {
      if (!import.meta.client || !canUseHistoryBack.value) return null
      return {
        mode: 'history',
        label: override.label ?? DEFAULT_BACK_LABEL
      }
    }
  }

  return resolveBackFromRoute(route)
}

function syncHistoryBackAvailability() {
  if (!import.meta.client) {
    canUseHistoryBack.value = false
    return
  }
  const state = window.history.state as { back?: string | null } | null
  const hasRouterBack = Boolean(state && 'back' in state && state.back != null)
  canUseHistoryBack.value = hasRouterBack || window.history.length > 1
}

export function setSlaviaPageBack(config: SlaviaBackOverride | null) {
  pageBackOverride.value = config
}

/** Rejestruje nadpisanie celu wstecz na czas życia komponentu (np. PublicPageHeader). */
export function useSlaviaPageBack(config?: MaybeRefOrGetter<SlaviaBackOverride | undefined>) {
  const route = useRoute()

  function apply() {
    const value = config ? toValue(config) : undefined
    if (!value) {
      setSlaviaPageBack(null)
      return
    }
    setSlaviaPageBack(value)
  }

  if (config) {
    watch(() => toValue(config), apply, { deep: true, immediate: true })
  }

  onBeforeRouteLeave(() => {
    setSlaviaPageBack(null)
  })

  onUnmounted(() => {
    setSlaviaPageBack(null)
  })

  watch(
    () => route.fullPath,
    () => {
      if (!config) {
        setSlaviaPageBack(null)
      }
    }
  )
}

/** Stan przycisku wstecz w nagłówku (SiteHeader). */
export function useSlaviaNavBack() {
  const route = useRoute()

  if (import.meta.client) {
    onMounted(() => {
      syncHistoryBackAvailability()
    })

    watch(
      () => route.fullPath,
      () => {
        nextTick(() => syncHistoryBackAvailability())
      }
    )
  }

  const target = computed(() => resolveBackTarget(route, pageBackOverride.value))
  const visible = computed(() => target.value !== null)

  async function goBack() {
    const current = target.value
    if (!current) return

    if (current.mode === 'link' && current.to) {
      await navigateTo(current.to)
      return
    }

    if (!import.meta.client) return
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    await navigateTo('/')
  }

  return {
    visible,
    target,
    goBack
  }
}

const DASHBOARD_SECTIONS_KEY = Symbol('slavia-dashboard-sections')
const LS_PREFIX = 'slavia-dashboard-sections-v1'

export type DashboardSectionHandle = {
  setOpen: (open: boolean) => void
  isOpen: () => boolean
}

type DashboardSectionsApi = {
  register: (id: string, handle: DashboardSectionHandle) => void
  unregister: (id: string) => void
  getStoredOpen: (id: string, fallback: boolean) => boolean
  persistOpen: (id: string, open: boolean) => void
  collapseAll: () => void
  expandAll: () => void
  sectionCount: Ref<number>
}

function storageKey(path: string) {
  const root = path.split('?')[0]?.split('#')[0] ?? path
  return `${LS_PREFIX}:${root}`
}

function readStore(path: string): Record<string, boolean> {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(storageKey(path))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(path: string, data: Record<string, boolean>) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(storageKey(path), JSON.stringify(data))
  } catch {
    /* private mode */
  }
}

export function provideDashboardSections(pathSource?: MaybeRefOrGetter<string>) {
  const route = useRoute()
  const path = computed(() => toValue(pathSource) || route.path)
  const handles = new Map<string, DashboardSectionHandle>()
  const sectionCount = ref(0)
  const store = ref<Record<string, boolean>>({})

  function syncStoreFromDisk() {
    store.value = readStore(path.value)
  }

  watch(path, () => {
    handles.clear()
    sectionCount.value = 0
    syncStoreFromDisk()
  }, { immediate: true })

  function register(id: string, handle: DashboardSectionHandle) {
    handles.set(id, handle)
    sectionCount.value = handles.size
    const saved = store.value[id]
    if (typeof saved === 'boolean') {
      handle.setOpen(saved)
    }
  }

  function unregister(id: string) {
    handles.delete(id)
    sectionCount.value = handles.size
  }

  function getStoredOpen(id: string, fallback: boolean) {
    const saved = store.value[id]
    return typeof saved === 'boolean' ? saved : fallback
  }

  function persistOpen(id: string, open: boolean) {
    store.value = { ...store.value, [id]: open }
    writeStore(path.value, store.value)
  }

  function setAll(open: boolean) {
    for (const handle of handles.values()) {
      handle.setOpen(open)
    }
    const next: Record<string, boolean> = { ...store.value }
    for (const id of handles.keys()) {
      next[id] = open
    }
    store.value = next
    writeStore(path.value, store.value)
  }

  const api: DashboardSectionsApi = {
    register,
    unregister,
    getStoredOpen,
    persistOpen,
    collapseAll: () => setAll(false),
    expandAll: () => setAll(true),
    sectionCount
  }

  provide(DASHBOARD_SECTIONS_KEY, api)
  return api
}

export function useDashboardSections() {
  return inject<DashboardSectionsApi | null>(DASHBOARD_SECTIONS_KEY, null)
}

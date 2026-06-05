export type DevSuperadminLogLevel = 'change' | 'info' | 'warn' | 'error'

export interface DevSuperadminLogEntry {
  id: string
  ts: number
  level: DevSuperadminLogLevel
  title: string
  detail?: string
}

const STORAGE_KEY = 'slavia-superadmin-system-logs'

function makeId() {
  if (import.meta.client && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useDevSuperadminLogs() {
  const entries = ref<DevSuperadminLogEntry[]>([])

  function persist() {
    if (!import.meta.client) {
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value.slice(0, 250)))
    } catch {
      // ignore quota
    }
  }

  function seedDefaults() {
    if (entries.value.length > 0) {
      return
    }
    const t = Date.now()
    entries.value = [
      {
        id: makeId(),
        ts: t - 86_400_000 * 4,
        level: 'change',
        title: 'Wdrożenie modułu PWA',
        detail: 'Manifest, service worker i auto-update na środowisku produkcyjnym.'
      },
      {
        id: makeId(),
        ts: t - 86_400_000 * 2,
        level: 'info',
        title: 'Powiadomienia przeglądarki — konfiguracja',
        detail: 'Sprawdź uprawnienia użytkowników po pierwszym logowaniu.'
      },
      {
        id: makeId(),
        ts: t - 86_400_000,
        level: 'warn',
        title: 'Weryfikacja HTTPS przed instalacją aplikacji',
        detail: 'Instalacja PWA z poziomu Chrome wymaga poprawnego TLS.'
      },
      {
        id: makeId(),
        ts: t - 3_600_000,
        level: 'info',
        title: 'Synchronizacja API z panelem superadmina',
        detail: 'Statystyki blog / zawodnicy / zawody odświeżane przy wejściu w narzędzia.'
      }
    ]
    persist()
  }

  function load() {
    if (!import.meta.client) {
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as DevSuperadminLogEntry[]
        if (Array.isArray(parsed)) {
          entries.value = parsed
        }
      }
    } catch {
      entries.value = []
    }
    seedDefaults()
  }

  function push(entry: Omit<DevSuperadminLogEntry, 'id' | 'ts'>) {
    entries.value.unshift({
      ...entry,
      id: makeId(),
      ts: Date.now()
    })
    persist()
  }

  function clear() {
    entries.value = []
    persist()
  }

  function demoPush(kind: DevSuperadminLogLevel) {
    const demos: Record<DevSuperadminLogLevel, { title: string, detail?: string }> = {
      change: {
        title: '[demo] Zapisano zmiany systemowe',
        detail: 'Symulacja wpisu — wpisy demo nie pochodzą z backendu.'
      },
      info: {
        title: '[demo] Informacja operacyjna',
        detail: 'Możesz dodawać własne wpisy lub eksportować log do JSON.'
      },
      warn: {
        title: '[demo] Ostrzeżenie integracji',
        detail: 'Sprawdź timeout API lub certyfikat po stronie reverse proxy.'
      },
      error: {
        title: '[demo] Błąd krytyczny (symulacja)',
        detail: 'W produkcji podłącz monitoring (np. Sentry) i alerty.'
      }
    }
    const d = demos[kind]
    push({ level: kind, title: d.title, detail: d.detail })
  }

  function exportJson() {
    if (!import.meta.client) {
      return ''
    }
    return JSON.stringify(entries.value, null, 2)
  }

  return {
    items: entries,
    load,
    push,
    clear,
    demoPush,
    exportJson
  }
}

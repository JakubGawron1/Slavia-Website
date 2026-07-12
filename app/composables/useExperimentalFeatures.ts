import {
  EXPERIMENTAL_FEATURES,
  EXPERIMENTAL_FEATURES_STORAGE_KEY,
  type ExperimentalFeatureId
} from '~/data/experimentalFeaturesCatalog'
import { computeExperimentalEnabled, parseExperimentalKillSwitch } from '~/utils/experimentalEffective'

const OVERRIDES_STATE_KEY = 'slavia-experimental-overrides'
const HYDRATED_FROM_API_KEY = 'slavia-experimental-hydrated-api'

type RemoteFlag = {
  name: string
  value: boolean
  user_id?: string | null
  updated_at: string
}

/** Lekkie żądania flag — bez `useApi()` (unikamy cyklu z `useExperimentalFlag` w interceptorze HTTP). */
function useFeatureFlagFetch() {
  const auth = useAuth()
  return async function featureFlagFetch<T>(
    url: string,
    opts?: { method?: 'GET' | 'POST', body?: Record<string, unknown> }
  ): Promise<T> {
    const headers: Record<string, string> = {}
    if (auth.token.value) {
      headers.Authorization = `Bearer ${auth.token.value}`
    }
    return (await $fetch(url, {
      baseURL: auth.apiBase.value,
      method: opts?.method ?? 'GET',
      body: opts?.body,
      headers
    })) as T
  }
}

export function useExperimentalFeatures() {
  const runtimeConfig = useRuntimeConfig()
  const auth = useAuth()
  const featureFlagFetch = useFeatureFlagFetch()
  const overrides = useState<Record<string, boolean>>(OVERRIDES_STATE_KEY, () => ({}))
  const hydratedFromApi = useState<boolean>(HYDRATED_FROM_API_KEY, () => false)

  const killSwitch = computed(() =>
    parseExperimentalKillSwitch(String(runtimeConfig.public.experimentalKillSwitch ?? ''))
  )

  const enabledMap = computed(() => {
    const kill = killSwitch.value
    const o = overrides.value
    const map: Record<string, boolean> = {}
    for (const def of EXPERIMENTAL_FEATURES) {
      // W dev analiza sztangi ma być domyślnie aktywna, nawet jeśli katalog ma inną wartość.
      const defaultEnabled = def.id === 'barbell_pose_analysis' && import.meta.dev
        ? true
        : def.defaultEnabled
      map[def.id] = computeExperimentalEnabled(def.id, {
        killSwitch: kill,
        overrides: o,
        defaultEnabled
      })
    }
    return map
  })

  function isForcedOffByDeploy(id: string): boolean {
    return killSwitch.value.has(id)
  }

  function persist() {
    if (!import.meta.client) {
      return
    }
    try {
      localStorage.setItem(EXPERIMENTAL_FEATURES_STORAGE_KEY, JSON.stringify(overrides.value))
    } catch {
      /* quota / private mode */
    }
  }

  async function persistRemote(id: ExperimentalFeatureId, enabled: boolean) {
    if (!auth.isLoggedIn.value || !auth.token.value) {
      return
    }
    await featureFlagFetch(`/api/system/feature-flags/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: { value: enabled }
    })
  }

  async function hydrateFromApi(force = false) {
    if (!import.meta.client || !auth.isLoggedIn.value) return
    if (hydratedFromApi.value && !force) return
    try {
      const remote = await featureFlagFetch<RemoteFlag[]>('/api/system/feature-flags')
      const next = { ...overrides.value }
      for (const row of remote || []) {
        if (!EXPERIMENTAL_FEATURES.find(def => def.id === row.name)) continue
        next[row.name] = !!row.value
      }
      overrides.value = next
      persist()
    } catch {
      /* fallback na localStorage */
    } finally {
      hydratedFromApi.value = true
    }
  }

  async function setFlag(id: ExperimentalFeatureId, enabled: boolean) {
    if (killSwitch.value.has(id)) {
      return
    }
    const def = EXPERIMENTAL_FEATURES.find(f => f.id === id)
    if (!def) {
      return
    }
    if (enabled === def.defaultEnabled) {
      overrides.value = Object.fromEntries(
        Object.entries(overrides.value).filter(([k]) => k !== id)
      ) as Record<string, boolean>
    } else {
      overrides.value = { ...overrides.value, [id]: enabled }
    }
    persist()
    await persistRemote(id, enabled)
  }

  function resetAllToDefaults() {
    overrides.value = {}
    persist()
  }

  return {
    definitions: EXPERIMENTAL_FEATURES,
    enabledMap,
    killSwitchIds: computed(() => [...killSwitch.value]),
    killSwitchRaw: computed(() => String(runtimeConfig.public.experimentalKillSwitch ?? '').trim()),
    isForcedOffByDeploy,
    setFlag,
    resetAllToDefaults,
    hydrateFromApi
  }
}

/** Wygodny dostęp reaktywny do jednej flagi (np. w `v-if`). */
export function useExperimentalFlag(id: ExperimentalFeatureId) {
  const { enabledMap } = useExperimentalFeatures()
  return computed(() => !!enabledMap.value[id])
}

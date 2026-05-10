/**
 * Opcjonalne flagi funkcji z `NUXT_PUBLIC_FEATURES_JSON` (JSON obiektu booleanów).
 * Przykład: `{"experimentalPanel":true,"athleteCompare":false}`
 */
export function usePublicFeatures() {
  const cfg = useRuntimeConfig().public
  return computed(() => {
    const raw = String((cfg as Record<string, unknown>).featuresJson ?? '{}').trim()
    if (!raw) return {} as Record<string, boolean>
    try {
      const o = JSON.parse(raw) as unknown
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        const out: Record<string, boolean> = {}
        for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
          if (typeof v === 'boolean') out[k] = v
        }
        return out
      }
    } catch {
      /* ignore */
    }
    return {} as Record<string, boolean>
  })
}

export function usePublicFeatureFlag(key: string, defaultValue = true) {
  const map = usePublicFeatures()
  return computed(() => {
    const v = map.value[key]
    return typeof v === 'boolean' ? v : defaultValue
  })
}

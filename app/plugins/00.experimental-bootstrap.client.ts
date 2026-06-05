import { EXPERIMENTAL_FEATURES_STORAGE_KEY } from '~/data/experimentalFeaturesCatalog'

/** Hydracja nadpisań flag z localStorage (musi być przed logiką zależną od stanu). */
export default defineNuxtPlugin({
  name: 'slavia-experimental-bootstrap',
  async setup() {
    if (!import.meta.client) {
      return
    }

    const overrides = useState<Record<string, boolean>>('slavia-experimental-overrides', () => ({}))

    try {
      const raw = localStorage.getItem(EXPERIMENTAL_FEATURES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const cleaned: Record<string, boolean> = {}
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'boolean') {
              cleaned[k] = v
            }
          }
          overrides.value = cleaned
        }
      }
    } catch {
      /* uszkodzony JSON — zostaw domyślne */
    }

    // Po starcie sesji nadpisz stan flag z backendu (główne źródło prawdy).
    const experimental = useExperimentalFeatures()
    await experimental.hydrateFromApi()
  }
})

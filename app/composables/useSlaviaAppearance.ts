import type { AuthUser } from '~/types/models'
import {
  type SlaviaThemePreset,
  useSlaviaCatalogs
} from '~/composables/useSlaviaCatalogs'

export type { SlaviaThemePreset } from '~/composables/useSlaviaCatalogs'

export function isGlassThemePreset(id: string | null | undefined): boolean {
  return id === 'glass'
}

export function isSportTechThemePreset(id: string | null | undefined): boolean {
  return id === 'sport-tech'
}

export function isNeonBrutalismThemePreset(id: string | null | undefined): boolean {
  return id === 'neon-brutalism'
}

export function isPodiumThemePreset(id: string | null | undefined): boolean {
  return id === 'podium'
}

export function isChalkThemePreset(id: string | null | undefined): boolean {
  return id === 'chalk'
}

export function isAuroraThemePreset(id: string | null | undefined): boolean {
  return id === 'aurora'
}

export function isForgeThemePreset(id: string | null | undefined): boolean {
  return id === 'forge'
}

export function isVelvetThemePreset(id: string | null | undefined): boolean {
  return id === 'velvet'
}

/** Presety z dedykowaną stylizacją poświaty layoutu (PublicPageLayout). */
export function slaviaPresetLayoutClass(id: SlaviaThemePreset): string | null {
  if (isGlassThemePreset(id)) return 'slavia-glass-layout'
  if (isSportTechThemePreset(id)) return 'slavia-sport-tech-layout'
  if (isNeonBrutalismThemePreset(id)) return 'slavia-neon-brutalism-layout'
  if (isPodiumThemePreset(id)) return 'slavia-podium-layout'
  if (isChalkThemePreset(id)) return 'slavia-chalk-layout'
  if (isAuroraThemePreset(id)) return 'slavia-aurora-layout'
  if (isForgeThemePreset(id)) return 'slavia-forge-layout'
  if (isVelvetThemePreset(id)) return 'slavia-velvet-layout'
  return null
}

/** Klucze localStorage lustra motywu (per konto) — panel developera, diagnostyka. */
export function slaviaAppearanceStorageKeys(uid: string | number) {
  const u = String(uid)
  return {
    preset: `slavia-appearance-preset-${u}`,
    mode: `slavia-appearance-mode-${u}`
  } as const
}

function presetKey(uid: string | number) {
  return slaviaAppearanceStorageKeys(uid).preset
}

function modeKey(uid: string | number) {
  return slaviaAppearanceStorageKeys(uid).mode
}

function isValidPreset(id: string | null | undefined, presets: readonly { id: string }[]): id is SlaviaThemePreset {
  return !!id && presets.some(x => x.id === id)
}

function defaultPresetByGender(gender: string | null | undefined): SlaviaThemePreset {
  const g = String(gender || '').trim().toLowerCase()
  if (g === 'female' || g === 'kobieta') {
    return 'pink'
  }
  if (g === 'male' || g === 'mężczyzna' || g === 'mezczyzna') {
    return 'dark'
  }
  return 'slavia'
}

function mirrorLocal(uid: string, p: SlaviaThemePreset, mode: string) {
  if (!import.meta.client) {
    return
  }
  localStorage.setItem(presetKey(uid), p)
  if (mode === 'light' || mode === 'dark') {
    localStorage.setItem(modeKey(uid), mode)
  }
}

export function useSlaviaAppearance() {
  const auth = useAuth()
  const colorMode = useColorMode()
  const apiFetch = useApi()
  const { themePresets } = useSlaviaCatalogs()

  const preset = ref<SlaviaThemePreset>('slavia')
  /** Pomija zapis na serwer przy programowej zmianie trybu (hydracja). */
  const hydrating = ref(false)

  let colorPersistTimer: ReturnType<typeof setTimeout> | null = null

  function applyPresetDom(p: SlaviaThemePreset) {
    if (!import.meta.client) {
      return
    }
    document.documentElement.setAttribute('data-slavia-preset', p)
    const layoutFlags: Array<[boolean, string]> = [
      [isGlassThemePreset(p), 'data-slavia-glass-layout'],
      [isSportTechThemePreset(p), 'data-slavia-sport-tech-layout'],
      [isNeonBrutalismThemePreset(p), 'data-slavia-neon-brutalism-layout'],
      [isPodiumThemePreset(p), 'data-slavia-podium-layout'],
      [isChalkThemePreset(p), 'data-slavia-chalk-layout'],
      [isAuroraThemePreset(p), 'data-slavia-aurora-layout'],
      [isForgeThemePreset(p), 'data-slavia-forge-layout'],
      [isVelvetThemePreset(p), 'data-slavia-velvet-layout']
    ]
    for (const [on, attr] of layoutFlags) {
      if (on) document.documentElement.setAttribute(attr, 'true')
      else document.documentElement.removeAttribute(attr)
    }
  }

  async function persistToAccount(partial: {
    ui_theme_preset?: SlaviaThemePreset
    ui_color_mode?: string
  }) {
    const uid = auth.user.value?.id
    const token = auth.token.value
    if (!import.meta.client || !uid || !token) {
      return
    }
    const body: Record<string, string> = {}
    if (partial.ui_theme_preset !== undefined) {
      body.ui_theme_preset = partial.ui_theme_preset
    }
    if (partial.ui_color_mode !== undefined) {
      body.ui_color_mode = partial.ui_color_mode
    }
    if (Object.keys(body).length === 0) {
      return
    }
    try {
      await apiFetch('/api/auth/profile', { method: 'PATCH', body })
      await auth.fetchMe()
      const prefStr = String(unref(colorMode.preference))
      if (partial.ui_theme_preset !== undefined) {
        mirrorLocal(uid, partial.ui_theme_preset, prefStr)
      }
      if (
        partial.ui_color_mode !== undefined
        && (partial.ui_color_mode === 'light' || partial.ui_color_mode === 'dark')
      ) {
        mirrorLocal(uid, preset.value, partial.ui_color_mode)
      }
    } catch {
      /* bez toastu — nie przerywamy UX przy przełączaniu motywu */
    }
  }

  function resolveFromUser(u: AuthUser): { preset: SlaviaThemePreset, colorModePref?: string } {
    let p: SlaviaThemePreset = defaultPresetByGender(u.athlete_gender)
    if (isValidPreset(u.ui_theme_preset ?? undefined, themePresets.value)) {
      p = u.ui_theme_preset as SlaviaThemePreset
    }
    const m = u.ui_color_mode
    if (m === 'light' || m === 'dark' || m === 'system') {
      return { preset: p, colorModePref: m }
    }
    return { preset: p }
  }

  function hydrate() {
    if (!import.meta.client) {
      return
    }

    hydrating.value = true
    try {
      const uid = auth.user.value?.id
      const u = auth.user.value

      if (!uid || !auth.token.value || !u) {
        preset.value = 'slavia'
        applyPresetDom('slavia')
        return
      }

      const fromApi = resolveFromUser(u)
      let nextPreset = fromApi.preset
      if (!u.ui_theme_preset) {
        const localP = localStorage.getItem(presetKey(uid))
        if (isValidPreset(localP, themePresets.value)) {
          nextPreset = localP
        }
      }

      preset.value = nextPreset
      applyPresetDom(nextPreset)

      if (fromApi.colorModePref !== undefined) {
        colorMode.preference = fromApi.colorModePref
      } else {
        const savedMode = localStorage.getItem(modeKey(uid))
        if (savedMode === 'light' || savedMode === 'dark') {
          colorMode.preference = savedMode
        }
      }
    } finally {
      hydrating.value = false
    }
  }

  async function setPreset(next: SlaviaThemePreset) {
    preset.value = next
    applyPresetDom(next)
    const uid = auth.user.value?.id
    if (!import.meta.client || !uid || !auth.token.value) {
      if (uid && import.meta.client) {
        localStorage.setItem(presetKey(uid), next)
      }
      return
    }
    mirrorLocal(uid, next, String(unref(colorMode.preference)))
    await persistToAccount({ ui_theme_preset: next })
  }

  watch(
    () => colorMode.preference,
    (pref) => {
      const uid = auth.user.value?.id
      const p = typeof pref === 'string' ? pref : String(pref ?? '')
      if (!import.meta.client || hydrating.value || !uid || !auth.token.value) {
        if (uid && import.meta.client && (p === 'light' || p === 'dark')) {
          localStorage.setItem(modeKey(uid), p)
        }
        return
      }
      if (p !== 'light' && p !== 'dark' && p !== 'system') {
        return
      }
      if (auth.user.value?.ui_color_mode === p) {
        return
      }
      mirrorLocal(uid, preset.value, p)
      if (colorPersistTimer) {
        clearTimeout(colorPersistTimer)
      }
      colorPersistTimer = setTimeout(() => {
        void persistToAccount({ ui_color_mode: p })
      }, 420)
    }
  )

  watch(
    () =>
      [auth.user.value?.id, auth.user.value?.ui_theme_preset, auth.user.value?.ui_color_mode] as const,
    () => hydrate()
  )

  const isGlassLayout = computed(() => isGlassThemePreset(preset.value))
  const isSportTechLayout = computed(() => isSportTechThemePreset(preset.value))
  const isNeonBrutalismLayout = computed(() => isNeonBrutalismThemePreset(preset.value))
  const isPodiumLayout = computed(() => isPodiumThemePreset(preset.value))
  const isChalkLayout = computed(() => isChalkThemePreset(preset.value))
  const isAuroraLayout = computed(() => isAuroraThemePreset(preset.value))
  const isForgeLayout = computed(() => isForgeThemePreset(preset.value))
  const isVelvetLayout = computed(() => isVelvetThemePreset(preset.value))

  const presetLayoutClass = computed(() => slaviaPresetLayoutClass(preset.value))

  const standardPresets = computed(() =>
    themePresets.value.filter(p => !('experimental' in p && p.experimental))
  )
  const experimentalPresets = computed(() =>
    themePresets.value.filter(p => 'experimental' in p && p.experimental)
  )

  return {
    preset,
    presets: themePresets,
    standardPresets,
    experimentalPresets,
    setPreset,
    hydrate,
    colorMode,
    applyPresetDom,
    presetLayoutClass,
    isGlassLayout,
    isSportTechLayout,
    isNeonBrutalismLayout,
    isPodiumLayout,
    isChalkLayout,
    isAuroraLayout,
    isForgeLayout,
    isVelvetLayout
  }
}

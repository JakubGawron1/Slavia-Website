import type { AuthUser } from '~/types/models'

export const SLAVIA_THEME_PRESETS = [
  {
    id: 'pink',
    label: 'Pink — athlete',
    description: 'Akcent różowy dla kont zawodniczek (domyślny wg płci).'
  },
  {
    id: 'dark',
    label: 'Dark — athlete',
    description: 'Mocny ciemny preset dla kont zawodników (domyślny wg płci).'
  },
  {
    id: 'slavia',
    label: 'Slavia — sala klubu',
    description: 'Ciemne bordo z akcentem łososiowym — domyślny klubowy; jasny wariant ciepły i premium.'
  },
  {
    id: 'iron',
    label: 'Żeliwo i stal',
    description: 'Chłodne odcienie jak rack i talerze na siłowni.'
  },
  {
    id: 'arena',
    label: 'Światła areny',
    description: 'Ciepłe reflektory i kontrast jak przy podejściu na podium.'
  },
  {
    id: 'platform',
    label: 'Platforma startowa',
    description: 'Minimalizm i mocny akcent — skupienie przed podejściem.'
  },
  {
    id: 'midnight',
    label: 'Midnight lift',
    description: 'Głęboki kontrast i akcent jak światło na nocnej sali.'
  },
  {
    id: 'ruby',
    label: 'Ruby podium',
    description: 'Ciepłe tło i rubinowy akcent — „ostatnie podejście”.'
  },
  {
    id: 'neon',
    label: 'Neon gym',
    description: 'Jaskrawe neony i energia siłowni — widoczna zmiana.'
  },
  {
    id: 'blackgym',
    label: 'Black gym',
    description: 'Czarna sala jako kolor przewodni — kontrast i spokój jak wieczorny trening.'
  },
  {
    id: 'glass',
    label: 'Glassmorphism',
    description: 'Przezroczyste karty, rozmycie i delikatne obramowania — eksperymentalny układ wizualny.',
    experimental: true
  },
  {
    id: 'sport-tech',
    label: 'Sport-Tech (Arena)',
    description: 'Futurystyczna arena — ciemny grafit z neonowym cyjanem; jasny wariant jak podświetlona trybuna.',
    experimental: true
  },
  {
    id: 'neon-brutalism',
    label: 'Neon Brutalism · Sport-Tech',
    description: 'Brutalizm z grubymi obrysami i twardymi cieniami — neon magenta/cyjan/lime na węglu; jasny wariant odwrócony.',
    experimental: true
  }
] as const

export type SlaviaThemePreset = (typeof SLAVIA_THEME_PRESETS)[number]['id']

export function isGlassThemePreset(id: string | null | undefined): boolean {
  return id === 'glass'
}

export function isSportTechThemePreset(id: string | null | undefined): boolean {
  return id === 'sport-tech'
}

export function isNeonBrutalismThemePreset(id: string | null | undefined): boolean {
  return id === 'neon-brutalism'
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

function isValidPreset(id: string | null | undefined): id is SlaviaThemePreset {
  return !!id && SLAVIA_THEME_PRESETS.some(x => x.id === id)
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

  const preset = ref<SlaviaThemePreset>('slavia')
  /** Pomija zapis na serwer przy programowej zmianie trybu (hydracja). */
  const hydrating = ref(false)

  let colorPersistTimer: ReturnType<typeof setTimeout> | null = null

  function applyPresetDom(p: SlaviaThemePreset) {
    if (!import.meta.client) {
      return
    }
    document.documentElement.setAttribute('data-slavia-preset', p)
    if (isGlassThemePreset(p)) {
      document.documentElement.setAttribute('data-slavia-glass-layout', 'true')
    } else {
      document.documentElement.removeAttribute('data-slavia-glass-layout')
    }
    if (isSportTechThemePreset(p)) {
      document.documentElement.setAttribute('data-slavia-sport-tech-layout', 'true')
    } else {
      document.documentElement.removeAttribute('data-slavia-sport-tech-layout')
    }
    if (isNeonBrutalismThemePreset(p)) {
      document.documentElement.setAttribute('data-slavia-neon-brutalism-layout', 'true')
    } else {
      document.documentElement.removeAttribute('data-slavia-neon-brutalism-layout')
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
    if (isValidPreset(u.ui_theme_preset ?? undefined)) {
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
        if (isValidPreset(localP)) {
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

  return {
    preset,
    presets: SLAVIA_THEME_PRESETS,
    setPreset,
    hydrate,
    colorMode,
    applyPresetDom,
    isGlassLayout,
    isSportTechLayout,
    isNeonBrutalismLayout
  }
}

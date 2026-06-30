import { setPzpcCatalog, type PzpcCatalog } from '~/lib/slavia/pzpcWeightCategories'

export type ThemePresetMeta = {
  id: string
  label: string
  description: string
  experimental?: boolean
}

export type AthleteBadgeMeta = {
  id: string
  label: string
  description: string
  thresholds: number[]
  unit: string
}

type ThemePresetsResponse = { presets: ThemePresetMeta[] }
type AthleteBadgesResponse = { badges: AthleteBadgeMeta[] }

/** Fallback offline (dev) — zgodny z backend `embed/theme-presets.json`. */
export const DEFAULT_THEME_PRESETS: readonly ThemePresetMeta[] = [
  { id: 'pink', label: 'Pink — athlete', description: 'Akcent różowy dla kont zawodniczek (domyślny wg płci).' },
  { id: 'dark', label: 'Dark — athlete', description: 'Mocny ciemny preset dla kont zawodników (domyślny wg płci).' },
  { id: 'slavia', label: 'Slavia — sala klubu', description: 'Ciepłe bordo i łososiowy akcent — charakter klubu; jasny wariant jak podświetlona sala.' },
  { id: 'iron', label: 'Żeliwo i stal', description: 'Chłodne odcienie jak rack i talerze na siłowni.' },
  { id: 'arena', label: 'Światła areny', description: 'Ciepłe reflektory i kontrast jak przy podejściu na podium.' },
  { id: 'platform', label: 'Platforma startowa', description: 'Minimalizm i mocny akcent — skupienie przed podejściem.' },
  { id: 'midnight', label: 'Midnight lift', description: 'Głęboki kontrast i akcent jak światło na nocnej sali.' },
  { id: 'ruby', label: 'Ruby podium', description: 'Ciepłe tło i rubinowy akcent — „ostatnie podejście”.' },
  { id: 'neon', label: 'Neon gym', description: 'Jaskrawe neony i energia siłowni — widoczna zmiana.' },
  { id: 'blackgym', label: 'Black gym', description: 'Czarna sala jako kolor przewodni — kontrast i spokój jak wieczorny trening.' },
  { id: 'glass', label: 'Glassmorphism', description: 'Szkło, rozmycie i miękkie poświaty — jak nowoczesna aplikacja fitness premium.', experimental: true },
  { id: 'sport-tech', label: 'Sport-Tech (Arena)', description: 'Siatka areny, neon cyjan i grafit — klimat transmisji sport-tech.', experimental: true },
  { id: 'neon-brutalism', label: 'Neon Brutalism', description: 'Twarde obrysy, offset shadow i neony — energia miejskiej siłowni.', experimental: true },
  { id: 'podium', label: 'Podium · IWF', description: 'Granat, złoto i reflektor nad platformą — jak transmisja zawodów międzynarodowych.', experimental: true },
  { id: 'chalk', label: 'Chalk Studio', description: 'Kreda, beton i spokojny minimalizm — estetyka Hookgrip / studio siłowe.', experimental: true },
  { id: 'aurora', label: 'Aurora Lift', description: 'Fioletowo-morska poświata i płynne tło — nowoczesna aplikacja treningowa.', experimental: true },
  { id: 'forge', label: 'Forge · Industrial', description: 'Żar, stal i miedziany akcent — industrial gym / Rogue vibe.', experimental: true },
  { id: 'velvet', label: 'Velvet Club', description: 'Aksamitne bordo, różowe złoto — luksusowa, wieczorna sala klubu.', experimental: true }
] as const

/** @deprecated Użyj `useSlaviaCatalogs().themePresets` — zachowane dla kompatybilności importów. */
export const SLAVIA_THEME_PRESETS = DEFAULT_THEME_PRESETS

export type SlaviaThemePreset = (typeof DEFAULT_THEME_PRESETS)[number]['id']

export const DEFAULT_ATHLETE_BADGES: readonly AthleteBadgeMeta[] = [
  { id: 'sinclair', label: 'Mistrz Sinclaira', description: 'Punkty Sinclair wyliczane na podstawie masy ciała i wyniku w dwuboju.', thresholds: [100, 200, 300, 400], unit: 'pkt' },
  { id: 'total', label: 'Siła dwuboju', description: 'Suma najlepszego rwania i podrzutu.', thresholds: [100, 200, 300, 400], unit: 'kg' },
  { id: 'snatch', label: 'Technika rwania', description: 'Twój najlepszy wynik w rwaniu.', thresholds: [50, 90, 100, 120, 150], unit: 'kg' },
  { id: 'cj', label: 'Moc podrzutu', description: 'Twój najlepszy wynik w podrzucie.', thresholds: [70, 90, 100, 120, 150, 170, 200], unit: 'kg' },
  { id: 'trainings', label: 'Staż w klubie', description: 'Ilość obecności na treningach zarejestrowana w systemie.', thresholds: [10, 50, 100, 250, 500], unit: 'sesji' }
] as const

const DEFAULT_PZPC_CATALOG: PzpcCatalog = {
  ageGroups: [
    { id: 'U15', label: 'U15 (młodziczki / młodzicy)' },
    { id: 'U17', label: 'U17 (juniorki mł. / juniorzy mł.)' },
    { id: 'U20', label: 'U20 (juniorki / juniorzy)' },
    { id: 'U23', label: 'U23 (młodzieżowcy)' },
    { id: 'Senior', label: 'Senior' }
  ],
  classesByAge: {
    U15: { male: ['51', '55', '60', '65', '70', '75', '85', '+85'], female: ['41', '45', '49', '53', '57', '61', '69', '+69'] },
    U17: { male: ['55', '60', '65', '70', '75', '85', '95', '+95'], female: ['45', '49', '53', '57', '61', '69', '77', '+77'] },
    U20: { male: ['60', '65', '70', '75', '85', '95', '110', '+110'], female: ['49', '53', '57', '61', '69', '77', '86', '+86'] },
    U23: { male: ['60', '65', '70', '75', '85', '95', '110', '+110'], female: ['49', '53', '57', '61', '69', '77', '86', '+86'] },
    Senior: { male: ['60', '65', '70', '75', '85', '95', '110', '+110'], female: ['49', '53', '57', '61', '69', '77', '86', '+86'] }
  }
}

/**
 * Katalogi statyczne z backendu (`GET /api/system/*`) — zawsze świeże z API.
 */
export function useSlaviaCatalogs() {
  const { data: themeRaw } = usePublicLazyFetch<ThemePresetsResponse>('system/theme-presets', {
    key: 'catalog:theme-presets',
    default: () => ({ presets: [...DEFAULT_THEME_PRESETS] })
  })

  const { data: badgesRaw } = usePublicLazyFetch<AthleteBadgesResponse>('system/athlete-badges', {
    key: 'catalog:athlete-badges',
    default: () => ({ badges: [...DEFAULT_ATHLETE_BADGES] })
  })

  const { data: pzpcRaw } = usePublicLazyFetch<PzpcCatalog>('system/pzpc-weight-classes', {
    key: 'catalog:pzpc-weight-classes',
    default: () => DEFAULT_PZPC_CATALOG
  })

  const themePresets = computed(() => themeRaw.value?.presets ?? [...DEFAULT_THEME_PRESETS])
  const athleteBadges = computed(() => badgesRaw.value?.badges ?? [...DEFAULT_ATHLETE_BADGES])
  const pzpcCatalog = computed(() => pzpcRaw.value ?? DEFAULT_PZPC_CATALOG)

  watch(pzpcCatalog, (catalog) => {
    if (catalog) setPzpcCatalog(catalog)
  }, { immediate: true })

  return {
    themePresets,
    athleteBadges,
    pzpcCatalog
  }
}

/** Definicja zmiennej CMS uzupełnianej dynamicznie z API / bazy (nadpisywalna w CMS). */
export interface CmsPageDataVariableDef {
  key: string
  label: string
  description?: string
}

/** Dostępne na każdej stronie z włączonym CMS. */
export const CMS_GLOBAL_DATA_VARIABLES: CmsPageDataVariableDef[] = [
  { key: 'rok_biezacy', label: 'Bieżący rok kalendarzowy' },
  { key: 'data_biezaca', label: 'Dzisiejsza data (PL)' }
]

const HOME_DATA_VARIABLES: CmsPageDataVariableDef[] = [
  { key: 'liczba_zawodnikow', label: 'Liczba aktywnych zawodników' },
  { key: 'liczba_kobiet', label: 'Aktywne zawodniczki' },
  { key: 'liczba_mezczyzn', label: 'Aktywni zawodnicy (M)' },
  { key: 'najlepszy_sinclair', label: 'Najwyższy Sinclair w klubie' },
  { key: 'najciezszy_total', label: 'Najcięższy total (kg)' },
  { key: 'imie_zawodnika', label: 'Lider rankingu — imię i nazwisko' },
  { key: 'sinclair_lidera', label: 'Sinclair lidera rankingu' },
  { key: 'imie_zawodnika_2', label: '2. miejsce — imię i nazwisko' },
  { key: 'imie_zawodnika_3', label: '3. miejsce — imię i nazwisko' }
]

const ZAWODNICY_DATA_VARIABLES: CmsPageDataVariableDef[] = [
  { key: 'liczba_w_rankingu', label: 'Zawodników w rankingu Sinclair' },
  { key: 'imie_zawodnika', label: '1. miejsce — imię i nazwisko' },
  { key: 'sinclair_lidera', label: 'Sinclair lidera' },
  { key: 'imie_zawodnika_2', label: '2. miejsce — imię i nazwisko' },
  { key: 'imie_zawodnika_3', label: '3. miejsce — imię i nazwisko' }
]

const ATHLETE_PROFILE_DATA_VARIABLES: CmsPageDataVariableDef[] = [
  { key: 'imie_zawodnika', label: 'Imię i nazwisko' },
  { key: 'kategoria_wagowa', label: 'Kategoria wagowa' },
  { key: 'rok_urodzenia', label: 'Rok urodzenia' },
  { key: 'plec_zawodnika', label: 'Płeć (K/M)' },
  { key: 'najlepszy_total', label: 'Najlepszy total (kg)' },
  { key: 'najlepszy_sinclair', label: 'Najlepszy Sinclair' },
  { key: 'liczba_startow', label: 'Liczba startów zawodniczych' }
]

const REKORDY_DATA_VARIABLES: CmsPageDataVariableDef[] = [
  { key: 'liczba_rekordow', label: 'Liczba rekordów na tablicy' },
  { key: 'liczba_zawodnikow', label: 'Zawodników z rekordem' }
]

const AKTUALNOSCI_DATA_VARIABLES: CmsPageDataVariableDef[] = [
  { key: 'liczba_aktualnosci', label: 'Opublikowanych aktualności' }
]

const STATIC_PAGE_DATA: Record<string, CmsPageDataVariableDef[]> = {
  home: HOME_DATA_VARIABLES,
  zawodnicy: ZAWODNICY_DATA_VARIABLES,
  'klub-rekordy': REKORDY_DATA_VARIABLES,
  aktualnosci: AKTUALNOSCI_DATA_VARIABLES
}

/** Katalog zmiennych dynamicznych dla klucza strony CMS. */
export function cmsDataVariableDefs(pageName: string): CmsPageDataVariableDef[] {
  const staticDefs = STATIC_PAGE_DATA[pageName] ?? []
  const athleteDefs = pageName.startsWith('athlete-') ? ATHLETE_PROFILE_DATA_VARIABLES : []
  const merged = new Map<string, CmsPageDataVariableDef>()
  for (const def of [...CMS_GLOBAL_DATA_VARIABLES, ...staticDefs, ...athleteDefs]) {
    merged.set(def.key, def)
  }
  return [...merged.values()].sort((a, b) => a.key.localeCompare(b.key, 'pl'))
}

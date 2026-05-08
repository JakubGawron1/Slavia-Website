/**
 * Rejestr funkcji eksperymentalnych — przełączniki na `/superadmin/developer`.
 *
 * Diagnostyka motywów (presety `data-slavia-preset`, tryb jasny/ciemny, JSON do schowka)
 * jest na tej samej stronie w sekcji „Motyw i wygląd” — nie wymaga osobnej flagi.
 *
 * Przy dodawaniu nowej funkcji w fazie rozwoju:
 * 1. Dodaj wpis tutaj (`id` stabilny, snake_case).
 * 2. Używaj `useExperimentalFlag(id)` lub `enabledMap` w UI / pluginach.
 *
 * **localStorage** (`EXPERIMENTAL_FEATURES_STORAGE_KEY`) — nadpisania per przeglądarka.
 *
 * **Kill switch (deploy, poza przeglądarką)** — zmienna środowiskowa build/runtime:
 * `NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH` — lista `id` rozdzielonych przecinkami, które są
 * **zawsze wyłączone** (ignoruje localStorage i „włączone” domyślnie). Ratunek przy problemach na produkcji.
 *
 * Przykład wyłączenia analizy sztangi na deployu:
 * `NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH=barbell_pose_analysis`
 */

export const EXPERIMENTAL_FEATURES_STORAGE_KEY = 'slavia-experimental-features'

export interface ExperimentalFeatureDefinition {
  id: string
  label: string
  description: string
  /** Gdy brak wpisu w localStorage — ta wartość jest używana (o ile nie ma kill switcha). */
  defaultEnabled: boolean
}

/** Lista edytowalna — przy nowej fladze dopisz identyfikator także do typu `ExperimentalFeatureId`. */
export const EXPERIMENTAL_FEATURES: ExperimentalFeatureDefinition[] = [
  {
    id: 'club_notification_bell',
    label: 'Dzwonek powiadomień w nagłówku',
    description:
      'Panel powiadomień klubu w belce (lista, polling, opcjonalne powiadomienia systemowe przy nowych wpisach).',
    defaultEnabled: true
  },
  {
    id: 'barbell_pose_analysis',
    label: 'Analiza ruchu sztangi (overlay + heurystyki)',
    description:
      'Analiza toru sztangi w panelu trenera i zawodnika (MoveNet + nakładka toru + wskazówki techniczne).',
    defaultEnabled: true
  },
  {
    id: 'admin_accounts_ban_ui',
    label: 'Banowanie kont w panelu kont',
    description:
      'Przyciski ban/unban na liście kont + badge „Zbanowany” i powód w podpowiedzi.',
    defaultEnabled: true
  },
  {
    id: 'developer_tools_ban_panel',
    label: 'Dev tools: banowanie kont',
    description:
      'Sekcja w /superadmin/developer z wyborem konta z listy i akcjami ban/unban (smoke).',
    defaultEnabled: true
  },
  {
    id: 'athlete_reverse_account_linking',
    label: 'Zawodnik: przypięcie istniejącego konta',
    description:
      'W modalu edycji zawodnika pozwala przypiąć istniejące konto (Athlete) oraz odpiąć konto z profilu.',
    defaultEnabled: true
  },
  {
    id: 'ban_redirect_on_403',
    label: 'Przekierowanie na /banned przy 403',
    description:
      'Dodatkowe przekierowanie na /banned w kliencie API przy odpowiedzi 403 (poza global middleware).',
    defaultEnabled: true
  },
  {
    id: 'dev_viewport_iframe_preview',
    label: 'Dev: podgląd viewportu (iframe)',
    description:
      'Overlay z iframe do symulacji prawdziwych breakpointów Mobile/Desktop (zamiast CSS-only zwężania #__nuxt).',
    defaultEnabled: true
  },
  {
    id: 'barbell_plate_tracking',
    label: 'Analiza sztangi: tryb talerzy (klik + interpolacja)',
    description:
      'W analizie toru sztangi dodaje tryb śledzenia talerzy (manual: klik na klatce + interpolacja).',
    defaultEnabled: false
  },
  {
    id: 'barbell_body_reference_tracking',
    label: 'Analiza sztangi: tryb barki/łokcie',
    description:
      'W analizie toru sztangi dodaje tryb śledzenia punktu referencyjnego z ciała (barki i łokcie).',
    defaultEnabled: true
  }
]

export type ExperimentalFeatureId =
  | 'club_notification_bell'
  | 'barbell_pose_analysis'
  | 'admin_accounts_ban_ui'
  | 'developer_tools_ban_panel'
  | 'athlete_reverse_account_linking'
  | 'ban_redirect_on_403'
  | 'dev_viewport_iframe_preview'
  | 'barbell_plate_tracking'
  | 'barbell_body_reference_tracking'

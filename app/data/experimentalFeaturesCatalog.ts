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
  /** Grupa w siatce dev tools (czytelniejsze sekcje). */
  group?: ExperimentalFeatureGroup
}

export type ExperimentalFeatureGroup =
  | 'www'
  | 'mobile'
  | 'chat'
  | 'cms'
  | 'dev'
  | 'club'

export const EXPERIMENTAL_FEATURE_GROUP_LABELS: Record<ExperimentalFeatureGroup, string> = {
  www: 'Strona WWW',
  mobile: 'Aplikacja mobilna',
  chat: 'Czat',
  cms: 'CMS',
  dev: 'Dev tools',
  club: 'Klub i panel'
}

/** Lista edytowalna — przy nowej fladze dopisz identyfikator także do typu `ExperimentalFeatureId`. */
export const EXPERIMENTAL_FEATURES: ExperimentalFeatureDefinition[] = [
  {
    id: 'club_notification_bell',
    label: 'Dzwonek powiadomień w nagłówku',
    description:
      'Panel powiadomień klubu w belce (lista, polling, opcjonalne powiadomienia systemowe przy nowych wpisach).',
    defaultEnabled: true,
    group: 'club'
  },
  {
    id: 'barbell_pose_analysis',
    label: 'Analiza ruchu sztangi (overlay + heurystyki)',
    description:
      'Analiza toru sztangi w panelu trenera i zawodnika (MoveNet + nakładka toru + wskazówki techniczne).',
    defaultEnabled: true,
    group: 'www'
  },
  {
    id: 'admin_accounts_ban_ui',
    label: 'Banowanie kont w panelu kont',
    description:
      'Przyciski ban/unban na liście kont + badge „Zbanowany” i powód w podpowiedzi.',
    defaultEnabled: true,
    group: 'dev'
  },
  {
    id: 'developer_tools_ban_panel',
    label: 'Dev tools: banowanie kont',
    description:
      'Sekcja w /superadmin/developer z wyborem konta z listy i akcjami ban/unban (smoke).',
    defaultEnabled: true,
    group: 'dev'
  },
  {
    id: 'athlete_reverse_account_linking',
    label: 'Zawodnik: przypięcie istniejącego konta',
    description:
      'W modalu edycji zawodnika pozwala przypiąć istniejące konto (Athlete) oraz odpiąć konto z profilu.',
    defaultEnabled: true,
    group: 'club'
  },
  {
    id: 'ban_redirect_on_403',
    label: 'Przekierowanie na /banned przy 403',
    description:
      'Dodatkowe przekierowanie na /banned w kliencie API przy odpowiedzi 403 (poza global middleware).',
    defaultEnabled: true,
    group: 'dev'
  },
  {
    id: 'dev_viewport_iframe_preview',
    label: 'Dev: podgląd viewportu (iframe)',
    description:
      'Overlay z iframe do symulacji prawdziwych breakpointów Mobile/Desktop (zamiast CSS-only zwężania #__nuxt).',
    defaultEnabled: true,
    group: 'dev'
  },
  {
    id: 'barbell_plate_tracking',
    label: 'Analiza sztangi: tryb talerzy (klik + interpolacja)',
    description:
      'W analizie toru sztangi dodaje tryb śledzenia talerzy (manual: klik na klatce + interpolacja).',
    defaultEnabled: false,
    group: 'www'
  },
  {
    id: 'barbell_body_reference_tracking',
    label: 'Analiza sztangi: tryb barki/łokcie',
    description:
      'W analizie toru sztangi dodaje tryb śledzenia punktu referencyjnego z ciała (barki i łokcie).',
    defaultEnabled: true,
    group: 'www'
  },
  {
    id: 'attendance_qr_checkin',
    label: 'Obecność: kod QR + skaner zawodnika',
    description:
      'Stały kod QR dla kadry (druk), skaner w aplikacji mobilnej oraz /klub/obecnosc?view=scan na WWW — natychmiastowa, zatwierdzona obecność.',
    defaultEnabled: true,
    group: 'club'
  },
  {
    id: 'mobile_feature_flags_api',
    label: 'Mobile: flagi funkcji z API',
    description:
      'Odczyt globalnych feature_flags z backendu (włączanie eksperymentalnych ekranów bez nowego APK).',
    defaultEnabled: true,
    group: 'mobile'
  },
  {
    id: 'athlete_share_result_graphic',
    label: 'Mobile: udostępnianie wyniku jako grafika',
    description: 'Eksport karty wyniku (total, Sinclair) do natywnego share sheet.',
    defaultEnabled: true,
    group: 'mobile'
  },
  {
    id: 'push_notifications_grouped',
    label: 'Mobile: powiadomienia grupowane po typie',
    description: 'Kanały Android „Slavia: czat”, „Slavia: klub” dla mniejszego szumu.',
    defaultEnabled: true,
    group: 'mobile'
  },
  {
    id: 'experimental_beta_badges',
    label: 'Badge „beta” przy narzędziach eksperymentalnych',
    description:
      'Widoczna etykieta beta przy wybranych modułach (analiza sztangi, QR obecności) z linkiem do /superadmin/developer.',
    defaultEnabled: true,
    group: 'www'
  },
  {
    id: 'chat_online_presence',
    label: 'Czat: status online rozmówcy',
    description: 'Wskaźnik „na żywo” gdy druga osoba była aktywna w ostatnich kilku minutach.',
    defaultEnabled: true,
    group: 'chat'
  },
  {
    id: 'chat_message_reactions',
    label: 'Czat: reakcje emoji na wiadomościach',
    description: 'Szybkie potwierdzenie (👍 ✅ itd.) bez pisania odpowiedzi.',
    defaultEnabled: true,
    group: 'chat'
  },
  {
    id: 'calendar_tablet_compact',
    label: 'Kalendarz: tryb kompaktowy (tablet)',
    description: 'Wyższa gęstość siatki miesiąca na szerszych ekranach.',
    defaultEnabled: true,
    group: 'www'
  },
  {
    id: 'mobile_local_encryption',
    label: 'Mobile: szyfrowane dane wrażliwe offline',
    description: 'Token i zapisane dane logowania w secure storage zamiast zwykłego SharedPreferences.',
    defaultEnabled: true,
    group: 'mobile'
  },
  {
    id: 'mobile_sinclair_isolates',
    label: 'Mobile: obliczenia Sinclair w isolate',
    description: 'Ciężkie przeliczenia bez blokowania UI przy dużych zestawach danych.',
    defaultEnabled: true,
    group: 'mobile'
  },
  {
    id: 'olympic_coach',
    label: 'Trener AI (Groq / LLaMA) — dwubój olimpijski',
    description:
      'Panel czatu z trenerem AI: plany treningowe, technika, suplementacja i regeneracja. Wymaga GROQ_API_KEY na backendzie.',
    defaultEnabled: true,
    group: 'www'
  },
  {
    id: 'mobile_foldable_two_pane',
    label: 'Mobile: układ dwukolumnowy (tablet / składany)',
    description: 'Lista + szczegóły obok siebie w czacie i liście zawodników na szerokim ekranie.',
    defaultEnabled: true,
    group: 'mobile'
  },
  {
    id: 'cms_inline_edit',
    label: 'CMS — inline edycja treści',
    description:
      'Przycisk „Edytuj” na stronach, pasek pól CMS, podgląd {zmiennych} po zapisie. Panel /admin/cms działa niezależnie od tej flagi.',
    defaultEnabled: false,
    group: 'cms'
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
  | 'attendance_qr_checkin'
  | 'mobile_feature_flags_api'
  | 'athlete_share_result_graphic'
  | 'push_notifications_grouped'
  | 'experimental_beta_badges'
  | 'chat_online_presence'
  | 'chat_message_reactions'
  | 'calendar_tablet_compact'
  | 'mobile_local_encryption'
  | 'mobile_sinclair_isolates'
  | 'olympic_coach'
  | 'mobile_foldable_two_pane'
  | 'cms_inline_edit'

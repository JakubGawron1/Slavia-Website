/** Grupy odnośników na stronie narzędzi developera (mapa aplikacji). */

export interface DevToolLinkItem {
  to: string
  label: string
  description: string
  icon: string
}

export interface DevToolLinkGroup {
  title: string
  description?: string
  links: DevToolLinkItem[]
}

export const DEV_TOOL_LINK_GROUPS: DevToolLinkGroup[] = [
  {
    title: 'Public: strona i narzędzia',
    description: 'Widok dostępny bez paneli — treści klubu i narzędzia dla gości.',
    links: [
      { to: '/', label: 'Start', description: 'Strona główna klubu', icon: 'i-lucide-home' },
      { to: '/zawodnicy', label: 'Zawodnicy i ranking', description: 'Lista, profile (`imię-nazwisko--uuid`) i ranking Sinclair', icon: 'i-lucide-users' },
      { to: '/ogloszenia', label: 'Ogłoszenia', description: 'Tablica komunikatów', icon: 'i-lucide-megaphone' },
      { to: '/aktualnosci', label: 'Aktualności', description: 'Wpisy i relacje (dawniej „blog”)', icon: 'i-lucide-newspaper' },
      { to: '/galeria', label: 'Galeria', description: 'Zdjęcia klubu', icon: 'i-lucide-images' },
      { to: '/zawodnicy#wyniki-zawodow', label: 'Wyniki zawodów', description: 'Publiczna lista zatwierdzonych startów (sekcja na stronie Zawodnicy)', icon: 'i-lucide-medal' },
      { to: '/kontakt', label: 'Kontakt', description: 'Formularz do administracji', icon: 'i-lucide-message-square' },
      { to: '/kalendarz', label: 'Kalendarz', description: 'Wydarzenia i zawody', icon: 'i-lucide-calendar' },
      { to: '/kalkulator-sinclair', label: 'Kalkulator Sinclair', description: 'Przelicznik punktów', icon: 'i-lucide-calculator' },
      { to: '/kalkulator-proporcji', label: 'Kalkulator proporcji', description: '„Złote proporcje” i widełki %', icon: 'i-lucide-sigma' },
      { to: '/logowanie', label: 'Logowanie', description: 'Formularz sesji', icon: 'i-lucide-log-in' }
    ]
  },
  {
    title: 'CMS: aktualności (wpisy)',
    description: 'Wpisy HTML — edycja wymaga roli Admin/SuperAdmin (`/aktualnosci/*`).',
    links: [
      { to: '/aktualnosci', label: 'Lista wpisów', description: 'Karty i slugi `--uuid`', icon: 'i-lucide-newspaper' },
      { to: '/aktualnosci/nowy', label: 'Nowy wpis', description: 'Formularz dodawania (middleware admin)', icon: 'i-lucide-file-plus-2' }
    ]
  },
  {
    title: 'Panel: zawodnik',
    description: 'Ścieżki `/athlete/*` po zalogowaniu kontem z rolą zawodnika.',
    links: [
      { to: '/athlete', label: 'Dashboard', description: 'Profil, wyniki, skróty', icon: 'i-lucide-user' },
      { to: '/athlete/skladki', label: 'Składka', description: 'Status i widok roczny składek', icon: 'i-lucide-banknote' },
      { to: '/athlete/kalendarz', label: 'Mój kalendarz', description: 'Przypisane starty', icon: 'i-lucide-calendar-heart' },
      { to: '/attendance', label: 'Obecność', description: 'Kalendarz obecności (badges + modale)', icon: 'i-lucide-user-check' },
      { to: '/chat', label: 'Czat', description: 'Wiadomości 1:1', icon: 'i-lucide-messages-square' },
      { to: '/dziennik', label: 'Dziennik', description: 'Wpisy treningowe', icon: 'i-lucide-book-marked' },
      { to: '/athlete/timeline', label: 'Historia', description: 'Oś czasu: wyniki, obecność, dziennik', icon: 'i-lucide-timeline' },
      { to: '/athlete/analiza-sztangi', label: 'Analiza sztangi', description: 'Tor sztangi (wideo)', icon: 'i-lucide-scan-line' },
      { to: '/athlete/exercises', label: 'Inne ćwiczenia', description: 'Przysiady, martwy, wyciskanie — ranking', icon: 'i-lucide-bar-chart-3' }
    ]
  },
  {
    title: 'Panel: trener',
    description: 'Narzędzia kadry — trener, admin z dostępem trenera, superadmin.',
    links: [
      { to: '/trainer', label: 'Dashboard trenera', description: 'Podsumowanie i skróty', icon: 'i-lucide-layout-dashboard' },
      { to: '/trainer/zawodnicy', label: 'Zawodnicy (trener)', description: 'CRUD profili — konto logowania przez admina lub prośba', icon: 'i-lucide-users' },
      { to: '/trainer/wyniki', label: 'Wszystkie starty', description: 'Lista i edycja wyników', icon: 'i-lucide-list-checks' },
      { to: '/trainer/skladki', label: 'Składki', description: 'Podgląd miesiąca i widok roczny zawodnika', icon: 'i-lucide-banknote' },
      { to: '/trainer/dziennik', label: 'Dzienniki (lista)', description: 'Wybór zawodnika (`…/imię--uuid`)', icon: 'i-lucide-book-open' },
      { to: '/trainer/analiza-sztangi', label: 'Analiza sztangi', description: 'Wersja kadry', icon: 'i-lucide-scan-line' },
      { to: '/trainer/exercises', label: 'Inne ćwiczenia', description: 'Ranking przysiadów, martwego itp.', icon: 'i-lucide-bar-chart-3' }
    ]
  },
  {
    title: 'Panel: administrator',
    description: 'Zarządzanie treścią i kontami (`/admin/*`).',
    links: [
      { to: '/admin', label: 'Dashboard admina', description: 'Statystyki i oczekujące wyniki', icon: 'i-lucide-shield' },
      { to: '/admin/zawodnicy', label: 'Zawodnicy (CMS)', description: 'Edycja bazy zawodników', icon: 'i-lucide-users-round' },
      { to: '/admin/konta', label: 'Konta kadry', description: 'Hasła i dostępy administracyjne', icon: 'i-lucide-key-round' },
      { to: '/admin/changelog', label: 'Changelog', description: 'Historia zmian w systemie', icon: 'i-lucide-file-text' },
      { to: '/admin/kontakt-wiadomosci', label: 'Wiadomości kontaktowe', description: 'Skrzynka z formularza publicznego', icon: 'i-lucide-inbox' }
    ]
  },
  {
    title: 'Superadmin',
    description: 'Pełna kontrola systemu i narzędzia developerskie.',
    links: [
      { to: '/superadmin', label: 'Dashboard', description: 'Statystyki i skróty', icon: 'i-lucide-crown' },
      { to: '/superadmin/administratorzy', label: 'Zarządzanie kontami', description: 'Lista kont i role — wybór motywu także w `/profil`', icon: 'i-lucide-shield-alert' },
      { to: '/superadmin/zawodnicy', label: 'Baza (super)', description: 'Zawodnicy — widok superadmina', icon: 'i-lucide-database' },
      { to: '/superadmin/developer', label: 'Developer tools', description: 'Motyw (diag.), smoke API, funkcje eksperymentalne', icon: 'i-lucide-terminal' },
      { to: '/kalendarz', label: 'Import zawodów', description: 'Synchronizacja wydarzeń i zawodów w kalendarzu klubowym', icon: 'i-lucide-calendar-plus-2' }
    ]
  },
  {
    title: 'Konto i profil',
    description: 'Wspólne ustawienia użytkownika.',
    links: [
      { to: '/profil', label: 'Ustawienia konta', description: 'Avatar, hasło, motyw', icon: 'i-lucide-user-cog' }
    ]
  },
  {
    title: 'Dokumentacja zewnętrzna',
    description: 'Przydatne przy pracy z frontem, PWA i przeglądarką.',
    links: [
      {
        to: 'https://nuxt.com/docs',
        label: 'Nuxt',
        description: 'Framework aplikacji',
        icon: 'i-lucide-book-open'
      },
      {
        to: 'https://ui.nuxt.com/',
        label: 'Nuxt UI',
        description: 'Komponenty interfejsu',
        icon: 'i-lucide-panels-top-left'
      },
      {
        to: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API',
        label: 'MDN: Service Worker',
        description: 'Cykl życia SW i cache',
        icon: 'i-lucide-globe'
      },
      {
        to: 'https://web.dev/explore/progressive-web-apps',
        label: 'web.dev — PWA',
        description: 'Instalacja i jakość PWA',
        icon: 'i-lucide-smartphone'
      },
      {
        to: 'https://developer.chrome.com/docs/devtools/',
        label: 'Chrome DevTools',
        description: 'Sieć, wydajność, Lighthouse',
        icon: 'i-lucide-wrench'
      }
    ]
  }
]

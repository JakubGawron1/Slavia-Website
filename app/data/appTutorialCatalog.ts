import { KLUB_BOARD_ROUTES, KLUB_SHARED_ROUTES } from '~/config/klubRoutes'
import type { TutorialTrack } from '~/types/appTutorial'

export const APP_TUTORIAL_TRACKS: TutorialTrack[] = [
  {
    id: 'common',
    label: 'Podstawy aplikacji',
    shortLabel: 'Podstawy',
    icon: 'i-lucide-compass',
    description: 'Logowanie, belka nawigacji, wyszukiwarka, konto i przełączanie paneli.',
    color: 'text-primary',
    bg: 'bg-primary/12',
    steps: [
      {
        id: 'welcome',
        title: 'Witaj w Slavia WWW',
        icon: 'i-lucide-home',
        summary: 'Aplikacja łączy stronę publiczną klubu z panelami po zalogowaniu.',
        paragraphs: [
          'CKS Slavia działa w przeglądarce jako strona klubu (ranking, aktualności, kalendarz) oraz jako panele po zalogowaniu — zależnie od Twojej roli.',
          'Ten samouczek prowadzi krok po kroku przez elementy interfejsu. Postęp zapisuje się na Twoim koncie w przeglądarce — możesz wracać w dowolnej chwili.'
        ],
        bullets: [
          'Strona publiczna — bez logowania (ranking, galeria, kalkulatory)',
          'Strefa klubu (/klub) — moduły wspólne po zalogowaniu',
          'Panele roli — /athlete, /trainer, /admin oraz dokumenty zarządu'
        ]
      },
      {
        id: 'login',
        title: 'Logowanie i bezpieczeństwo',
        icon: 'i-lucide-key-round',
        summary: 'Jak wejść do panelu i co robi dwuskładnikowe logowanie (2FA).',
        paragraphs: [
          'Zaloguj się na stronie /logowanie loginem i hasłem nadanym przez klub. Po udanym logowaniu trafiasz na dashboard swojej głównej roli.',
          'Jeśli konto ma włączone 2FA, po haśle pojawi się pole na 6-cyfrowy kod z aplikacji authenticator. Sesja jest przechowywana w ciasteczku — na współdzielonym komputerze wyloguj się po zakończeniu pracy.'
        ],
        bullets: [
          'Link „redirect” w URL — po logowaniu wrócisz tam, skąd zostałeś przekierowany',
          'Zakaz konta (ban) — przekierowanie na /banned zamiast panelu',
          'Hasło i 2FA zmieniasz w ustawieniach konta na dashboardzie roli'
        ],
        actionTo: '/logowanie',
        actionLabel: 'Strona logowania'
      },
      {
        id: 'navbar',
        title: 'Belka nawigacji',
        icon: 'i-lucide-menu',
        summary: 'Górna belka łączy strony publiczne z panelem i kontem.',
        paragraphs: [
          'Na górze ekranu znajduje się stała belka z logo klubu, linkami do sekcji publicznych oraz — po zalogowaniu — skrótami do panelu i konta.',
          'Kliknij elementy na mockupie poniżej, aby zobaczyć opis każdej części belki.'
        ],
        demo: 'navbar',
        hotspots: [
          { id: 'logo', label: 'Logo', x: 8, y: 50, description: 'Powrót na stronę główną klubu.', icon: 'i-lucide-home' },
          { id: 'nav-links', label: 'Strony klubu', x: 35, y: 50, description: 'Ogłoszenia, aktualności, galeria, ranking zawodników i kalendarz — treści publiczne lub wymagające logowania (np. ogłoszenia).', icon: 'i-lucide-newspaper' },
          { id: 'search', label: 'Szukaj', x: 72, y: 50, description: 'Globalna wyszukiwarka — skrót Ctrl+K, ⌘K lub klawisz / (poza polami formularza).', icon: 'i-lucide-search' },
          { id: 'panel', label: 'Panel', x: 86, y: 50, description: 'Skrót do dashboardu Twojej głównej roli. Na mobile — awatar otwiera menu konta.', icon: 'i-lucide-layout-dashboard' },
          { id: 'account', label: 'Konto', x: 94, y: 50, description: 'Ustawienia profilu, wyglądu, aplikacji mobilnej i bezpieczeństwa.', icon: 'i-lucide-user-cog' }
        ]
      },
      {
        id: 'search',
        title: 'Wyszukiwarka globalna',
        icon: 'i-lucide-search',
        summary: 'Szybkie przejście do modułów, stron i zawodników.',
        paragraphs: [
          'Wyszukiwarka indeksuje strony publiczne, treści CMS, zawodników, wydarzenia kalendarza oraz moduły panelu dostępne dla Twoich ról.',
          'Wyniki są pogrupowane (strony klubu, panel zawodnika, panel trenera itd.). Wyłączone moduły nie pojawią się na liście.'
        ],
        demo: 'search',
        bullets: [
          'Ctrl+K / ⌘K — otwiera wyszukiwarkę z dowolnego miejsca',
          'Klawisz / — alternatywny skrót (gdy fokus nie jest w polu tekstowym)',
          'Wpisz nazwę modułu, np. „składki”, „dziennik”, „CMS”'
        ]
      },
      {
        id: 'panels',
        title: 'Panele i przełączanie ról',
        icon: 'i-lucide-layers',
        summary: 'Jedno konto może mieć kilka ról — każda ma własny dashboard.',
        paragraphs: [
          'Jeśli masz np. rolę Trener i Zawodnik, w bocznym panelu nawigacji (na stronach /athlete i /trainer) zobaczysz przełącznik między panelami.',
          'Dashboard każdej roli składa się z sekcji zwijanych (powitanie, KPI, moduły). Stan sekcji zapamiętuje się lokalnie w przeglądarce.'
        ],
        demo: 'sidebar',
        bullets: [
          'Panel zawodnika — /athlete',
          'Panel trenera — /trainer',
          'Panel admina — /admin',
          'Strefa klubu — /klub (moduły wspólne i dokumenty zarządu)'
        ],
        actionTo: '/klub',
        actionLabel: 'Strefa klubu'
      },
      {
        id: 'account',
        title: 'Ustawienia konta',
        icon: 'i-lucide-user-cog',
        summary: 'Profil, motyw, PWA i bezpieczeństwo w jednym miejscu.',
        paragraphs: [
          'Ustawienia konta otwierasz z dashboardu roli (przycisk „Ustawienia konta”) lub przez hash w URL (#profil, #wyglad, #aplikacje, #bezpieczenstwo).',
          'Zakładka Profil — awatar i dane zawodnika. Wygląd — tryb jasny/ciemny i motyw kolorystyczny klubu. Aplikacje — link do PWA i aplikacji Android. Bezpieczeństwo — zmiana hasła i konfiguracja 2FA.'
        ],
        demo: 'module-flow',
        bullets: [
          'Awatar w belce = zdjęcie konta lub profilu sportowego',
          'Motyw można ustawić niezależnie od systemu operacyjnego',
          'Po zmianie hasła pozostałe sesje mogą wymagać ponownego logowania'
        ]
      },
      {
        id: 'klub-hub',
        title: 'Strefa klubu (/klub)',
        icon: 'i-lucide-layout-grid',
        summary: 'Hub modułów wspólnych — obecność, czat, wyzwania, dokumenty.',
        paragraphs: [
          'Strona /klub zbiera moduły dostępne dla Twojej roli w jednym miejscu: obecność, czat, powiadomienia, wyzwania oraz — dla zarządu — dokumenty klubu.',
          'Kafelki odpowiadają modułom z dashboardu, ale są pogrupowane pod kątem codziennej pracy klubowej, a nie tylko treningu.'
        ],
        demo: 'dashboard',
        actionTo: '/klub',
        actionLabel: 'Otwórz strefę klubu'
      }
    ]
  },
  {
    id: 'athlete',
    label: 'Panel zawodnika',
    shortLabel: 'Zawodnik',
    icon: 'i-lucide-user',
    description: 'Starty, składki, dziennik, plany, Trener AI i narzędzia treningowe.',
    color: 'text-amber-600',
    bg: 'bg-amber-500/12',
    steps: [
      {
        id: 'dashboard',
        title: 'Dashboard zawodnika',
        icon: 'i-lucide-layout-dashboard',
        summary: 'Powitanie, KPI, checklista startowa i szybkie akcje.',
        paragraphs: [
          'Po wejściu na /athlete widzisz podsumowanie: najbliższy start, status składki, obecność i skróty do modułów.',
          'Sekcje można zwijać — przycisk „Sekcje” na górze pozwala szybko przejść do wybranej części dashboardu.'
        ],
        demo: 'dashboard',
        actionTo: '/athlete',
        actionLabel: 'Panel zawodnika'
      },
      {
        id: 'wyniki',
        title: 'Moje starty i wyniki',
        icon: 'i-lucide-trophy',
        summary: 'Zgłaszanie wyników z zawodów — kadra je zatwierdza.',
        paragraphs: [
          'W module /athlete/wyniki dodajesz wynik z zawodów lub treningu. Wpis trafia do kolejki oczekujących — trener lub admin zatwierdza lub odrzuca.',
          'Po zatwierdzeniu wynik pojawia się w rankingu publicznym i w Twoim profilu zawodnika.'
        ],
        bullets: [
          'Statusy: oczekujący, zatwierdzony, odrzucony',
          'Możesz edytować oczekujące zgłoszenia',
          'Historia wszystkich wpisów w jednej tabeli'
        ],
        actionTo: '/athlete/wyniki',
        actionLabel: 'Moje wyniki'
      },
      {
        id: 'skladki',
        title: 'Składka klubowa',
        icon: 'i-lucide-banknote',
        summary: 'Status płatności miesięcznej i zgłaszanie przelewu.',
        paragraphs: [
          'Moduł składek pokazuje bieżący miesiąc, historię roku oraz formularz zgłoszenia płatności (kwota, miesiąc, notatka).',
          'Po zgłoszeniu przelewu trener weryfikuje wpis — do czasu zatwierdzenia status pozostaje „oczekujący”.'
        ],
        demo: 'module-flow',
        actionTo: '/athlete/skladki',
        actionLabel: 'Składki'
      },
      {
        id: 'kalendarz',
        title: 'Kalendarz startów',
        icon: 'i-lucide-calendar-heart',
        summary: 'Zawody i starty przypisane przez kadrę.',
        paragraphs: [
          'Kalendarz /athlete/kalendarz pokazuje wydarzenia, na które zostałeś zgłoszony. Widzisz datę, kategorię wagową i status przygotowania.',
          'Publiczny kalendarz klubu (/kalendarz) zawiera wszystkie wydarzenia — ten moduł dotyczy tylko Twoich startów.'
        ],
        actionTo: '/athlete/kalendarz',
        actionLabel: 'Kalendarz startów'
      },
      {
        id: 'obecnosc',
        title: 'Obecność i QR',
        icon: 'i-lucide-user-check',
        summary: 'Zgłaszanie obecności na treningu — ręcznie lub skanerem QR.',
        paragraphs: [
          'W /klub/obecnosc zawodnik widzi kalendarz treningów. Może zgłosić obecność ręcznie lub użyć skanera QR na sali (kod generowany przez kadrę).',
          'Zgłoszenie trafia do weryfikacji — trener zatwierdza lub koryguje status.'
        ],
        demo: 'attendance',
        actionTo: KLUB_SHARED_ROUTES.obecnosc,
        actionLabel: 'Obecność'
      },
      {
        id: 'dziennik',
        title: 'Dziennik treningów',
        icon: 'i-lucide-book-marked',
        summary: 'Wpisy po jednostkach treningowych z notatkami i ćwiczeniami.',
        paragraphs: [
          'Dziennik (/athlete/dziennik) to chronologiczna lista treningów. Każdy wpis może zawierać ćwiczenia, serie, ciężary i notatki (rich text).',
          'Możesz usuwać tylko własne wpisy. Trener widzi dzienniki całego zespołu w swoim panelu.'
        ],
        actionTo: '/athlete/dziennik',
        actionLabel: 'Dziennik'
      },
      {
        id: 'plany',
        title: 'Plany treningowe',
        icon: 'i-lucide-clipboard-list',
        summary: 'Cykle i cele ustawione przez trenera lub Trenera AI.',
        paragraphs: [
          'Plany (/athlete/plany) pokazują aktualny mikrocykl: ćwiczenia, serie docelowe i postęp realizacji.',
          'Plan może pochodzić od trenera (ręcznie) lub być wygenerowany przez moduł Trener AI.'
        ],
        actionTo: '/athlete/plany',
        actionLabel: 'Plany'
      },
      {
        id: 'ai-coach',
        title: 'Trener AI',
        icon: 'i-lucide-sparkles',
        summary: 'Asystent dwuboju — technika, plany, regeneracja.',
        paragraphs: [
          'Trener AI (/athlete/ai-coach) odpowiada na pytania treningowe z kontekstem Twojego profilu klubowego. Nie zastępuje decyzji kadry — traktuj go jako pomoc przy planowaniu.',
          'Odpowiedzi są formatowane w Markdown i sanityzowane przed wyświetleniem.'
        ],
        actionTo: '/athlete/ai-coach',
        actionLabel: 'Trener AI'
      },
      {
        id: 'czat',
        title: 'Czat z trenerem',
        icon: 'i-lucide-messages-square',
        summary: 'Wiadomości 1:1 w wątkach tematycznych.',
        paragraphs: [
          'Czat (/klub/czat) działa w modelu wątków — trener zakłada temat, zawodnik odpowiada w ramach rozmowy.',
          'Nieprzeczytane wątki są oznaczane; historia wiadomości ładuje się przy otwarciu wątku.'
        ],
        demo: 'chat',
        actionTo: KLUB_SHARED_ROUTES.czat,
        actionLabel: 'Czat'
      },
      {
        id: 'inne',
        title: 'Pozostałe moduły',
        icon: 'i-lucide-grid-3x3',
        summary: 'Regeneracja, tor sztangi, wyzwania, ranking i kalkulatory.',
        paragraphs: [
          'Regeneracja — check-in snu i zmęczenia. Analiza toru sztangi — nagranie wideo z diagnostyką ścieżki gryfu.',
          'Wyzwania miesiąca i ranking — moduły społecznościowe klubu. Kalkulator proporcji — publiczne narzędzie planowania bojów.'
        ],
        bullets: [
          'Timeline — oś czasu aktywności treningowej',
          'Inne ćwiczenia — siła poza dwubojem',
          'Powiadomienia — alerty od kadry w /klub/powiadomienia'
        ]
      }
    ]
  },
  {
    id: 'trainer',
    label: 'Panel trenera',
    shortLabel: 'Trener',
    icon: 'i-lucide-dumbbell',
    description: 'Zespół, wyniki, składki, dzienniki, monitoring i narzędzia kadry.',
    color: 'text-teal-600',
    bg: 'bg-teal-500/12',
    steps: [
      {
        id: 'dashboard',
        title: 'Dashboard trenera',
        icon: 'i-lucide-layout-dashboard',
        summary: 'KPI, oczekujące wyniki i składki do zatwierdzenia.',
        paragraphs: [
          'Dashboard /trainer pokazuje liczbę oczekujących wyników, składek i obecności. Z list „Do zrobienia” możesz zatwierdzać wpisy bez wchodzenia w szczegóły modułu.',
          'Szybkie akcje prowadzą do najczęstszych zadań: zawodnicy, wyniki, obecność.'
        ],
        demo: 'dashboard',
        actionTo: '/trainer',
        actionLabel: 'Panel trenera'
      },
      {
        id: 'zawodnicy',
        title: 'Zespół i konta',
        icon: 'i-lucide-users-round',
        summary: 'Lista zawodników, profile sportowe i dane logowania.',
        paragraphs: [
          'Moduł /trainer/zawodnicy łączy bazę sportową z kontami użytkowników. Możesz przeglądać profile, edytować dane zawodnika i zarządzać przypisaniem kont.',
          'To główne miejsce pracy z kadrą — stąd przechodzisz też do dzienników poszczególnych zawodników.'
        ],
        actionTo: '/trainer/zawodnicy',
        actionLabel: 'Zawodnicy'
      },
      {
        id: 'wyniki',
        title: 'Wszystkie starty',
        icon: 'i-lucide-list-checks',
        summary: 'Weryfikacja wyników zgłoszonych przez zawodników.',
        paragraphs: [
          'W /trainer/wyniki widzisz pełną listę startów z filtrowaniem. Oczekujące wpisy zatwierdzasz lub odrzucasz z opcjonalną notatką.',
          'Zatwierdzony wynik aktualizuje ranking i rekordy zawodnika.'
        ],
        actionTo: '/trainer/wyniki',
        actionLabel: 'Wyniki'
      },
      {
        id: 'skladki',
        title: 'Składki klubowe',
        icon: 'i-lucide-banknote',
        summary: 'Widok miesiąca i zatwierdzanie zgłoszeń płatności.',
        paragraphs: [
          'Panel składek trenera (/trainer/skladki) pokazuje macierz zawodnik × miesiąc. Zgłoszenia oczekujące oznaczają się kolorem — jednym kliknięciem zatwierdzasz lub odrzucasz.',
          'Dashboard admina ma podobny widok KPI, ale trener pracuje tu na co dzień.'
        ],
        actionTo: '/trainer/skladki',
        actionLabel: 'Składki'
      },
      {
        id: 'obecnosc',
        title: 'Lista obecności',
        icon: 'i-lucide-user-check',
        summary: 'Weryfikacja zgłoszeń, kalendarz i kod QR do druku.',
        paragraphs: [
          'Jako kadra widzisz wszystkich zawodników, możesz zbiorczo zatwierdzać oczekujące wpisy i generować kod QR na trening.',
          'Widok kalendarza pokazuje statystyki miesiąca — frekwencję i dni treningowe.'
        ],
        demo: 'attendance',
        actionTo: KLUB_SHARED_ROUTES.obecnosc,
        actionLabel: 'Obecność'
      },
      {
        id: 'dziennik',
        title: 'Dzienniki zespołu',
        icon: 'i-lucide-book-marked',
        summary: 'Podgląd i edycja wpisów wszystkich zawodników.',
        paragraphs: [
          'Ścieżka /trainer/dziennik prowadzi do listy zawodników, a następnie do dziennika wybranej osoby.',
          'Trener może dodawać i korygować wpisy — przydatne po treningu grupowym.'
        ],
        actionTo: '/trainer/dziennik',
        actionLabel: 'Dzienniki'
      },
      {
        id: 'plany',
        title: 'Plany treningowe',
        icon: 'i-lucide-clipboard-list',
        summary: 'Tworzenie cykli i monitoring realizacji przez zawodników.',
        paragraphs: [
          'W /trainer/plany definiujesz tytuł, czas trwania (tygodnie) i strukturę jednostek. Zawodnik widzi plan w swoim panelu.',
          'Możesz monitorować, które jednostki zostały odhaczone.'
        ],
        actionTo: '/trainer/plany',
        actionLabel: 'Plany'
      },
      {
        id: 'monitoring',
        title: 'Monitoring i wydarzenia',
        icon: 'i-lucide-activity',
        summary: 'Feed aktywności i metryki systemowe klubu.',
        paragraphs: [
          'Feed wydarzeń (/trainer/wydarzenia) zbiera aktywności w klubie — nowe wyniki, wpisy dziennika, logowania.',
          'Monitoring (/trainer/monitoring) pokazuje metryki techniczne — przydatne przy diagnozie problemów z API.'
        ],
        bullets: [
          'Trener AI — ten sam silnik co u zawodnika, z szerszym kontekstem kadry',
          'Regeneracja — podgląd check-inów zawodników',
          'Ćwiczenia — ranking i weryfikacja siły poza dwubojem'
        ]
      }
    ]
  },
  {
    id: 'admin',
    label: 'Panel admina',
    shortLabel: 'Admin',
    icon: 'i-lucide-shield',
    description: 'CMS, treści publiczne, zawodnicy, kontakt i changelog.',
    color: 'text-blue-600',
    bg: 'bg-blue-500/12',
    steps: [
      {
        id: 'dashboard',
        title: 'Dashboard admina',
        icon: 'i-lucide-layout-dashboard',
        summary: 'KPI klubu: składki, obecność, oczekujące wyniki.',
        paragraphs: [
          'Panel /admin agreguje najważniejsze wskaźniki: liczba zawodników, postęp składek w bieżącym miesiącu, średnia frekwencja i kolejka wyników.',
          'Z sekcji „Pilne” przechodzisz bezpośrednio do weryfikacji.'
        ],
        demo: 'dashboard',
        actionTo: '/admin',
        actionLabel: 'Panel admina'
      },
      {
        id: 'zawodnicy',
        title: 'Zespół i konta',
        icon: 'i-lucide-users-round',
        summary: 'Zarządzanie zawodnikami i kontami logowania.',
        paragraphs: [
          'Admin ma pełny dostęp do bazy zawodników (/admin/zawodnicy) — profile sportowe, kategorie wagowe, zdjęcia i powiązanie z kontem użytkownika.',
          'Osobna strona /admin/konta służy do zarządzania loginami (bez pełnych uprawnień SuperAdmin).'
        ],
        actionTo: '/admin/zawodnicy',
        actionLabel: 'Zawodnicy'
      },
      {
        id: 'cms',
        title: 'CMS — treści stron',
        icon: 'i-lucide-layout-template',
        summary: 'Edycja pól stron, zmiennych i nawigacji.',
        paragraphs: [
          'CMS (/admin/cms) ma zakładki: Strony, Zmienne, Nawigacja i Historia wersji. Każda strona (home, o-klubie itd.) składa się z pól tekstowych i rich HTML.',
          'Zmienne {{nazwa}} można wstawiać w treści — aktualizują się globalnie po edycji zmiennej.'
        ],
        demo: 'cms',
        actionTo: '/admin/cms',
        actionLabel: 'CMS'
      },
      {
        id: 'tresci',
        title: 'Treści publiczne',
        icon: 'i-lucide-newspaper',
        summary: 'Aktualności, ogłoszenia, galeria i kalendarz.',
        paragraphs: [
          'Aktualności — wpisy blogowe z edytorem WYSIWYG (/aktualnosci). Ogłoszenia — tablica klubu (/ogloszenia, wymaga logowania).',
          'Galeria — zdjęcia z podpisami. Kalendarz — wydarzenia klubowe widoczne publicznie.'
        ],
        bullets: [
          'Nowy wpis aktualności — /aktualnosci/nowy',
          'Ranking — /zawodnicy (wyniki publiczne)',
          'Wyzwania — moduł społecznościowy w /klub/wyzwania'
        ]
      },
      {
        id: 'kontakt',
        title: 'Wiadomości i changelog',
        icon: 'i-lucide-mail',
        summary: 'Skrzynka formularza kontaktowego i historia wydań.',
        paragraphs: [
          'Formularz na /kontakt trafia do /admin/kontakt-wiadomosci — przeglądasz i oznaczasz wiadomości jako obsłużone.',
          'Changelog (/admin/changelog) dokumentuje wersje aplikacji — przydatne przy komunikacji ze zawodnikami po aktualizacji.'
        ],
        actionTo: '/admin/kontakt-wiadomosci',
        actionLabel: 'Wiadomości kontaktowe'
      }
    ]
  },
  {
    id: 'editor',
    label: 'Rola redaktora',
    shortLabel: 'Redaktor',
    icon: 'i-lucide-pen-line',
    description: 'Dostęp do CMS i aktualności bez pełnego panelu admina.',
    color: 'text-violet-600',
    bg: 'bg-violet-500/12',
    steps: [
      {
        id: 'scope',
        title: 'Zakres roli Editor',
        icon: 'i-lucide-info',
        summary: 'Redaktor edytuje treści — nie zarządza kontami ani systemem.',
        paragraphs: [
          'Rola Editor daje dostęp do CMS (/admin/cms) i tworzenia aktualności. Po zalogowaniu domyślnie trafiasz na CMS.',
          'Nie widzisz modułów admina takich jak zarządzanie kontami, changelog czy pełna baza zawodników — chyba że masz też rolę Admin.'
        ],
        bullets: [
          'CMS — strony, zmienne, nawigacja',
          'Aktualności — tworzenie i edycja wpisów',
          'Brak dostępu do panelu SuperAdmin'
        ]
      },
      {
        id: 'cms-workflow',
        title: 'Praca w CMS',
        icon: 'i-lucide-layout-template',
        summary: 'Jak edytować stronę krok po kroku.',
        paragraphs: [
          'Wybierz stronę z listy (np. home). Pola formularza odpowiadają sekcjom na stronie publicznej. Rich HTML przechodzi przez sanityzację przy zapisie i wyświetlaniu.',
          'Zakładka Nawigacja pozwala układać linki w menu — zmiany są widoczne po odświeżeniu strony (cache ISR może opóźnić podgląd o kilka minut na produkcji).'
        ],
        demo: 'cms',
        actionTo: '/admin/cms',
        actionLabel: 'Otwórz CMS'
      },
      {
        id: 'aktualnosci',
        title: 'Aktualności',
        icon: 'i-lucide-newspaper',
        summary: 'Publikacja wpisów na stronie klubu.',
        paragraphs: [
          'Nowy wpis tworzysz pod /aktualnosci/nowy. Edytor TipTap obsługuje nagłówki, listy, linki i obrazy.',
          'Po zapisie wpis jest dostępny pod unikalnym adresem /aktualnosci/[slug].'
        ],
        actionTo: '/aktualnosci/nowy',
        actionLabel: 'Nowy wpis'
      }
    ]
  },
  {
    id: 'board',
    label: 'Zarząd — dokumenty',
    shortLabel: 'Zarząd',
    icon: 'i-lucide-folder-lock',
    description: 'Repozytorium dokumentów, generator raportów i typy dokumentów.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/12',
    steps: [
      {
        id: 'access',
        title: 'Dostęp do modułu',
        icon: 'i-lucide-shield-check',
        summary: 'Role BoardMember i BoardDocsFullAccess.',
        paragraphs: [
          'Moduł dokumentów wymaga roli Członek zarządu (BoardMember) lub Pełny dostęp do dokumentów (BoardDocsFullAccess).',
          'Pełny dostęp umożliwia zapis, edycję i wersjonowanie plików w repozytorium Slavia-cms (folder board/ na GitHubie).'
        ],
        bullets: [
          'BoardMember — przeglądanie i pobieranie',
          'BoardDocsFullAccess — edycja i nowe wersje',
          'Backend pośredniczy — pliki nie są serwowane bezpośrednio z GitHuba'
        ]
      },
      {
        id: 'repozytorium',
        title: 'Repozytorium dokumentów',
        icon: 'i-lucide-folder-open',
        summary: 'Przeglądanie, filtrowanie i podgląd plików.',
        paragraphs: [
          'Strona /klub/dokumenty listuje dokumenty z katalogu board/. Filtruj po kategorii, typie lub folderze. Kliknięcie otwiera podgląd (PDF, obrazy, tekst).',
          'Status „Slavia-cms gotowe” oznacza, że backend ma skonfigurowane połączenie z repozytorium.'
        ],
        demo: 'documents',
        actionTo: KLUB_BOARD_ROUTES.dokumenty,
        actionLabel: 'Repozytorium'
      },
      {
        id: 'generator',
        title: 'Generator dokumentów',
        icon: 'i-lucide-wand-sparkles',
        summary: 'Raporty i listy startowe z szablonów.',
        paragraphs: [
          'Generator (/klub/dokumenty/generator) tworzy dokumenty na podstawie typów z katalogu — np. listy startowe, protokoły.',
          'Wybierasz typ, uzupełniasz pola formularza i generujesz plik do repozytorium lub pobrania.'
        ],
        actionTo: KLUB_BOARD_ROUTES.generator,
        actionLabel: 'Generator'
      },
      {
        id: 'typy',
        title: 'Typy dokumentów',
        icon: 'i-lucide-tags',
        summary: 'Katalog szablonów i typy własne.',
        paragraphs: [
          'Zakładka Typy (/klub/dokumenty/typy) definiuje dostępne szablony generatora — pola, kategorie i metadane.',
          'Typy własne może dodawać zarząd z pełnym dostępem — pozostali korzystają z katalogu bootstrap.'
        ],
        actionTo: KLUB_BOARD_ROUTES.typy,
        actionLabel: 'Typy dokumentów'
      }
    ]
  }
]

export function tutorialTrackById(id: string) {
  return APP_TUTORIAL_TRACKS.find(t => t.id === id)
}

export const TUTORIAL_TRACK_ORDER: import('~/types/appTutorial').TutorialTrackId[] = [
  'common',
  'athlete',
  'trainer',
  'admin',
  'editor',
  'board'
]

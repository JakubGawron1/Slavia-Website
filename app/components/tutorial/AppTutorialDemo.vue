<script setup lang="ts">
import type { TutorialDemoKind, TutorialHotspot } from '~/types/appTutorial'
import { buildPanelModuleGroups } from '~/data/panelNavigationCatalog'
import type { PanelNavRole } from '~/data/panelNavigationCatalog'

const props = defineProps<{
  kind: TutorialDemoKind
  hotspots?: TutorialHotspot[]
  trackRole?: PanelNavRole | 'common'
}>()

const activeHotspot = ref<string | null>(null)

const demoTrackRole = computed<PanelNavRole>(() => {
  if (props.trackRole === 'athlete' || props.trackRole === 'trainer' || props.trackRole === 'admin' || props.trackRole === 'board') {
    return props.trackRole
  }
  return 'athlete'
})

const modulePreview = computed(() => {
  const groups = buildPanelModuleGroups(demoTrackRole.value)
  return groups.flatMap(g => g.items).slice(0, 6)
})

const searchItems = [
  { label: 'Składka klubowa', group: 'Panel zawodnika', icon: 'i-lucide-banknote' },
  { label: 'Dziennik treningów', group: 'Panel zawodnika', icon: 'i-lucide-book-marked' },
  { label: 'Strefa klubu', group: 'Klub', icon: 'i-lucide-layout-grid' },
  { label: 'Ranking zawodników', group: 'Strony klubu', icon: 'i-lucide-trophy' }
]

const searchQuery = ref('')
const filteredSearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return searchItems
  return searchItems.filter(i => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q))
})

const cmsTabs = [
  { id: 'pages', label: 'Strony', active: true },
  { id: 'variables', label: 'Zmienne', active: false },
  { id: 'navigation', label: 'Nawigacja', active: false },
  { id: 'history', label: 'Historia', active: false }
]
const activeCmsTab = ref('pages')
/** Przykład tokenu CMS — w szablonie nie da się bezpiecznie użyć literalnych `{{ }}`. */
const cmsVariableTokenExample = '{{nazwa_klubu}}'

const docFolders = [
  { name: 'protokoły', count: 12, icon: 'i-lucide-file-text' },
  { name: 'umowy', count: 4, icon: 'i-lucide-file-signature' },
  { name: 'listy-startowe', count: 8, icon: 'i-lucide-list' }
]
const selectedFolder = ref<string | null>(null)

const attendanceStatuses = [
  { label: 'Obecny', color: 'success' as const },
  { label: 'Oczekujący', color: 'warning' as const },
  { label: 'Nieobecny', color: 'error' as const }
]
const pickedStatus = ref(1)

const chatThreads = [
  { title: 'Przygotowanie do zawodów', unread: true },
  { title: 'Technika rwania', unread: false },
  { title: 'Plan na tydzień', unread: false }
]
const activeThread = ref(0)

function pickHotspot(id: string) {
  activeHotspot.value = activeHotspot.value === id ? null : id
}

const activeHotspotData = computed(() =>
  props.hotspots?.find(h => h.id === activeHotspot.value) ?? null
)
</script>

<template>
  <div class="app-tutorial-demo">
    <!-- Navbar mockup -->
    <div v-if="kind === 'navbar'" class="app-tutorial-demo__frame">
      <div class="app-tutorial-demo__navbar">
        <span class="app-tutorial-demo__logo">SLAVIA</span>
        <span class="app-tutorial-demo__nav-pill">Aktualności</span>
        <span class="app-tutorial-demo__nav-pill">Ranking</span>
        <span class="app-tutorial-demo__nav-spacer" />
        <UIcon name="i-lucide-search" class="size-4 text-muted" />
        <UIcon name="i-lucide-layout-dashboard" class="size-4 text-primary" />
        <span class="app-tutorial-demo__avatar" />
      </div>
      <button
        v-for="spot in hotspots"
        :key="spot.id"
        type="button"
        class="app-tutorial-demo__hotspot"
        :class="{ 'app-tutorial-demo__hotspot--active': activeHotspot === spot.id }"
        :style="{ left: `${spot.x}%`, top: `${spot.y}%` }"
        :aria-label="spot.label"
        @click="pickHotspot(spot.id)"
      >
        <span class="app-tutorial-demo__hotspot-ring" />
      </button>
    </div>

    <!-- Search demo -->
    <div v-else-if="kind === 'search'" class="app-tutorial-demo__panel">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Szukaj stron, modułów, zawodników…"
        size="lg"
        class="mb-3"
      />
      <p class="mb-2 text-xs text-muted">
        Wpisz np. „składki” lub „ranking” — to interaktywny podgląd, nie prawdziwa wyszukiwarka.
      </p>
      <ul class="space-y-1">
        <li
          v-for="(item, i) in filteredSearch"
          :key="i"
          class="flex cursor-default items-center gap-3 rounded-xl border border-default/50 bg-elevated/50 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <UIcon :name="item.icon" class="size-4 shrink-0 text-primary" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium">{{ item.label }}</div>
            <div class="truncate text-xs text-muted">{{ item.group }}</div>
          </div>
          <UIcon name="i-lucide-arrow-right" class="size-3.5 text-muted" />
        </li>
        <li v-if="!filteredSearch.length" class="py-6 text-center text-sm text-muted">
          Brak wyników — spróbuj innego słowa kluczowego.
        </li>
      </ul>
    </div>

    <!-- Sidebar / role switch -->
    <div v-else-if="kind === 'sidebar'" class="app-tutorial-demo__panel app-tutorial-demo__sidebar-mock">
      <div class="app-tutorial-demo__sidebar-brand">
        <UIcon name="i-lucide-dumbbell" class="size-4 text-primary" />
        <span>Slavia · Panel</span>
      </div>
      <p class="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted">Twoje panele</p>
      <button type="button" class="app-tutorial-demo__sidebar-item app-tutorial-demo__sidebar-item--active">
        <UIcon name="i-lucide-user" class="size-4" />
        Zawodnik
      </button>
      <button type="button" class="app-tutorial-demo__sidebar-item">
        <UIcon name="i-lucide-dumbbell" class="size-4" />
        Trener
      </button>
      <button type="button" class="app-tutorial-demo__sidebar-item">
        <UIcon name="i-lucide-shield" class="size-4" />
        Admin
      </button>
      <p class="mt-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted">Sekcje</p>
      <div class="app-tutorial-demo__sidebar-item opacity-70">
        <UIcon name="i-lucide-user" class="size-4" />
        Powitanie
      </div>
      <div class="app-tutorial-demo__sidebar-item opacity-70">
        <UIcon name="i-lucide-zap" class="size-4" />
        Szybkie akcje
      </div>
      <div class="app-tutorial-demo__sidebar-item opacity-70">
        <UIcon name="i-lucide-layout-grid" class="size-4" />
        Moduły
      </div>
    </div>

    <!-- Dashboard modules grid -->
    <div v-else-if="kind === 'dashboard'" class="app-tutorial-demo__panel">
      <p class="mb-3 text-xs text-muted">
        Kliknij kafelek — w prawdziwym panelu otworzy się moduł. Tutaj podświetlamy tylko układ.
      </p>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="(mod, i) in modulePreview"
          :key="mod.to"
          type="button"
          class="app-tutorial-demo__tile"
          :class="{ 'app-tutorial-demo__tile--active': activeHotspot === `mod-${i}` }"
          @click="activeHotspot = activeHotspot === `mod-${i}` ? null : `mod-${i}`"
        >
          <UIcon :name="mod.icon" class="size-5" :class="mod.color" />
          <span class="line-clamp-2 text-left text-xs font-semibold leading-tight">{{ mod.title }}</span>
        </button>
      </div>
      <p v-if="activeHotspot?.startsWith('mod-')" class="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-highlighted">
        {{ modulePreview[Number(activeHotspot.replace('mod-', ''))]?.description }}
      </p>
    </div>

    <!-- Generic flow -->
    <div v-else-if="kind === 'module-flow'" class="app-tutorial-demo__panel">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge color="neutral" variant="subtle">1. Wejście</UBadge>
        <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
        <UBadge color="primary" variant="subtle">2. Formularz / lista</UBadge>
        <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
        <UBadge color="warning" variant="subtle">3. Weryfikacja kadry</UBadge>
        <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
        <UBadge color="success" variant="subtle">4. Gotowe</UBadge>
      </div>
      <p class="mt-4 text-sm text-muted">
        Wiele modułów (składki, wyniki, obecność) działa według tego schematu: Ty wysyłasz zgłoszenie, kadra zatwierdza.
      </p>
    </div>

    <!-- Attendance -->
    <div v-else-if="kind === 'attendance'" class="app-tutorial-demo__panel">
      <p class="mb-3 text-sm text-muted">Wybierz status — zobacz, jak wygląda w module obecności:</p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="(st, i) in attendanceStatuses"
          :key="st.label"
          size="sm"
          :color="pickedStatus === i ? st.color : 'neutral'"
          :variant="pickedStatus === i ? 'solid' : 'outline'"
          @click="pickedStatus = i"
        >
          {{ st.label }}
        </UButton>
      </div>
      <div class="mt-4 rounded-xl border border-default/60 bg-elevated/40 p-4 text-sm">
        <template v-if="pickedStatus === 0">
          <strong class="text-success">Obecny</strong> — zatwierdzony przez trenera lub zeskanowany QR.
        </template>
        <template v-else-if="pickedStatus === 1">
          <strong class="text-warning">Oczekujący</strong> — zgłoszenie czeka na weryfikację kadry.
        </template>
        <template v-else>
          <strong class="text-error">Nieobecny</strong> — brak obecności lub odrzucone zgłoszenie.
        </template>
      </div>
    </div>

    <!-- Chat -->
    <div v-else-if="kind === 'chat'" class="app-tutorial-demo__panel app-tutorial-demo__chat">
      <div class="app-tutorial-demo__chat-list">
        <button
          v-for="(thread, i) in chatThreads"
          :key="thread.title"
          type="button"
          class="app-tutorial-demo__chat-thread"
          :class="{ 'app-tutorial-demo__chat-thread--active': activeThread === i }"
          @click="activeThread = i"
        >
          <span class="truncate font-medium">{{ thread.title }}</span>
          <UBadge v-if="thread.unread" color="primary" size="xs">Nowe</UBadge>
        </button>
      </div>
      <div class="app-tutorial-demo__chat-body">
        <p class="text-sm font-semibold">{{ chatThreads[activeThread]?.title }}</p>
        <p class="mt-2 text-sm text-muted">
          Tu pojawiają się wiadomości wątku. Trener zakłada tematy; zawodnik odpowiada w ramach wybranej rozmowy.
        </p>
      </div>
    </div>

    <!-- CMS -->
    <div v-else-if="kind === 'cms'" class="app-tutorial-demo__panel">
      <div class="mb-3 flex flex-wrap gap-1">
        <UButton
          v-for="tab in cmsTabs"
          :key="tab.id"
          size="xs"
          :variant="activeCmsTab === tab.id ? 'solid' : 'ghost'"
          :color="activeCmsTab === tab.id ? 'primary' : 'neutral'"
          @click="activeCmsTab = tab.id"
        >
          {{ tab.label }}
        </UButton>
      </div>
      <div class="rounded-xl border border-default/50 bg-elevated/30 p-4 text-sm">
        <template v-if="activeCmsTab === 'pages'">
          <p class="font-medium">Strona: <span class="text-primary">home</span></p>
          <p class="mt-2 text-muted">Pola: tytuł hero, lead, sekcje — odpowiadają blokom na stronie głównej.</p>
        </template>
        <template v-else-if="activeCmsTab === 'variables'">
          <p class="font-medium">Zmienne globalne</p>
          <p class="mt-2 font-mono text-xs text-primary">{{ cmsVariableTokenExample }}</p>
          <p class="mt-1 text-muted">Wstawiane w treści stron — aktualizacja w jednym miejscu.</p>
        </template>
        <template v-else-if="activeCmsTab === 'navigation'">
          <p class="font-medium">Menu główne</p>
          <p class="mt-2 text-muted">Kolejność i widoczność linków w belce nawigacji.</p>
        </template>
        <template v-else>
          <p class="font-medium">Historia wersji</p>
          <p class="mt-2 text-muted">Kto i kiedy zapisał zmiany w CMS — audyt treści.</p>
        </template>
      </div>
    </div>

    <!-- Documents -->
    <div v-else-if="kind === 'documents'" class="app-tutorial-demo__panel">
      <div class="grid gap-2 sm:grid-cols-3">
        <button
          v-for="folder in docFolders"
          :key="folder.name"
          type="button"
          class="app-tutorial-demo__tile"
          :class="{ 'app-tutorial-demo__tile--active': selectedFolder === folder.name }"
          @click="selectedFolder = selectedFolder === folder.name ? null : folder.name"
        >
          <UIcon :name="folder.icon" class="size-5 text-emerald-600" />
          <span class="text-xs font-semibold">{{ folder.name }}</span>
          <span class="text-[10px] text-muted">{{ folder.count }} plików</span>
        </button>
      </div>
      <p v-if="selectedFolder" class="mt-3 text-sm text-muted">
        Folder <strong class="text-highlighted">{{ selectedFolder }}</strong> — w repozytorium board/ na GitHubie. Kliknij plik w module, aby zobaczyć podgląd.
      </p>
    </div>

    <!-- Hotspot detail (navbar) -->
    <Transition name="slavia-fade">
      <div
        v-if="activeHotspotData"
        class="app-tutorial-demo__hotspot-detail"
      >
        <div class="flex items-start gap-2">
          <UIcon
            :name="activeHotspotData.icon ?? 'i-lucide-info'"
            class="mt-0.5 size-4 shrink-0 text-primary"
          />
          <div>
            <p class="font-semibold text-highlighted">{{ activeHotspotData.label }}</p>
            <p class="mt-1 text-sm text-muted">{{ activeHotspotData.description }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

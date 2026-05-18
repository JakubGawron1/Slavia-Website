<script setup lang="ts">
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useBrowserNotifications } from '~/composables/useBrowserNotifications'
import type { DevSuperadminLogLevel } from '~/composables/useDevSuperadminLogs'
import { useDevSuperadminLogs } from '~/composables/useDevSuperadminLogs'
import {
  DEV_TOOL_EXTERNAL_DOCS_GROUP,
  DEV_TOOL_ROUTE_SUPPLEMENT,
  DEV_TOOL_STACK_GROUP
} from '~/data/devToolsCatalog'
import type { ExperimentalFeatureId } from '~/data/experimentalFeaturesCatalog'
import {
  slaviaAppearanceStorageKeys,
  useSlaviaAppearance,
  type SlaviaThemePreset
} from '~/composables/useSlaviaAppearance'
import { getApiDetailedErrorMessage, getApiErrorMessage } from '~/composables/useApi'
import { apiRoutes } from '~/config/api'
import type { CompetitionResult, GroupedAdminAccounts } from '~/types/models'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Ustawienia developera — Superadmin',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const backendProvider = useBackendProvider()
const apiFetch = useApi()
const toast = useToast()
const experimental = useExperimentalFeatures()
const expDevBanPanel = useExperimentalFlag('developer_tools_ban_panel')
const {
  preset: themePreset,
  presets: themePresets,
  setPreset: setThemePreset,
  colorMode: themeColorMode,
  hydrate: hydrateThemeAppearance
} = useSlaviaAppearance()

const activePresetMeta = computed(() => {
  const id = themePreset.value
  return themePresets.find(p => p.id === id)
})

const domDataPresetAttr = ref<string | null>(null)

const banUserId = ref('')
const banUserOptions = ref<{ label: string, value: string }[]>([])
const banUserSelected = ref<string>('')
const banReason = ref('')
const banPending = ref(false)

async function refreshBanUsersCatalog() {
  try {
    const data = await apiFetch<GroupedAdminAccounts>('/api/admins/grouped')
    const all = [
      ...(data.admins ?? []),
      ...(data.trainers ?? []),
      ...(data.athletes ?? [])
    ]
    const seen = new Set<string>()
    const items = all
      .filter(u => {
        if (!u?.id || seen.has(u.id)) return false
        seen.add(u.id)
        return true
      })
      .map(u => {
        const roles = Array.isArray(u.roles) ? u.roles.join(', ') : ''
        const suffix = roles ? ` · ${roles}` : ''
        return { label: `${u.username}${suffix}`, value: u.id }
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'pl'))
    banUserOptions.value = [{ label: '— wybierz konto —', value: '' }, ...items]
  } catch {
    banUserOptions.value = [{ label: '— wybierz konto —', value: '' }]
  }
}

watch(banUserSelected, (id) => {
  if (typeof id === 'string') {
    banUserId.value = id
  }
})

async function devBanUser() {
  const id = banUserId.value.trim()
  if (!id) {
    toast.add({ title: 'Podaj user_id', color: 'warning' })
    return
  }
  banPending.value = true
  try {
    await apiFetch(`/api/admins/${encodeURIComponent(id)}/ban`, {
      method: 'PATCH',
      body: { reason: banReason.value.trim() || undefined }
    })
    toast.add({ title: 'Zbanowano konto', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Ban nieudany', description: getApiDetailedErrorMessage(e), color: 'error' })
  } finally {
    banPending.value = false
  }
}

async function devUnbanUser() {
  const id = banUserId.value.trim()
  if (!id) {
    toast.add({ title: 'Podaj user_id', color: 'warning' })
    return
  }
  banPending.value = true
  try {
    await apiFetch(`/api/admins/${encodeURIComponent(id)}/unban`, { method: 'PATCH' })
    toast.add({ title: 'Cofnięto bana', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Unban nieudany', description: getApiDetailedErrorMessage(e), color: 'error' })
  } finally {
    banPending.value = false
  }
}

// --- Konserwacja czatu: ręczne pruning bezczynnych wątków --------------------
// Backend ma background-task, ale czasem chcemy „posprzątać natychmiast" (np. po
// teście / incydencie). Endpoint domyślnie używa progu 30 dni; pole `days` pozwala
// wymusić agresywniejszy próg (1..=365) bez zmiany kodu.
const chatPruneDays = ref<number | null>(null)
const chatPruneRunning = ref(false)
const chatPruneLastResult = ref<{ deleted: number, inactivity_days: number, at: string } | null>(null)

async function runChatPrune() {
  if (chatPruneRunning.value) {
    return
  }
  const days = chatPruneDays.value
  if (days != null && (!Number.isFinite(days) || days < 1 || days > 365)) {
    toast.add({ title: 'Niepoprawne dni', description: 'Wartość musi być w zakresie 1..365.', color: 'warning' })
    return
  }
  chatPruneRunning.value = true
  try {
    const url = days != null
      ? `${apiRoutes.chat.adminPrune}?days=${encodeURIComponent(days)}`
      : apiRoutes.chat.adminPrune
    const res = await apiFetch<{ deleted: number, inactivity_days: number }>(url, { method: 'POST' })
    chatPruneLastResult.value = {
      deleted: res?.deleted ?? 0,
      inactivity_days: res?.inactivity_days ?? (days ?? 30),
      at: new Date().toLocaleString('pl-PL')
    }
    toast.add({
      title: 'Czyszczenie zakończone',
      description: `Usunięto ${chatPruneLastResult.value.deleted} wątków (próg ${chatPruneLastResult.value.inactivity_days} dni).`,
      color: 'success'
    })
  } catch (e) {
    toast.add({ title: 'Czyszczenie nieudane', description: getApiDetailedErrorMessage(e), color: 'error' })
  } finally {
    chatPruneRunning.value = false
  }
}

function refreshDomPresetAttr() {
  if (!import.meta.client) {
    return
  }
  domDataPresetAttr.value = document.documentElement.getAttribute('data-slavia-preset')
}

watch(themePreset, refreshDomPresetAttr)

async function copyThemeDiagnosticsJson() {
  if (!import.meta.client) {
    return
  }
  refreshDomPresetAttr()
  const u = auth.user.value
  const pref = themeColorMode.preference
  const preference = typeof pref === 'string' ? pref : String(pref ?? '')
  const payload = {
    capturedAt: new Date().toISOString(),
    presetActive: themePreset.value,
    presetDomAttr: domDataPresetAttr.value,
    colorModePreference: preference,
    resolvedColorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    server: u
      ? {
          ui_theme_preset: u.ui_theme_preset ?? null,
          ui_color_mode: u.ui_color_mode ?? null
        }
      : null,
    localStorageMirror: u
      ? {
          presetKey: localStorage.getItem(slaviaAppearanceStorageKeys(u.id).preset),
          modeKey: localStorage.getItem(slaviaAppearanceStorageKeys(u.id).mode)
        }
      : null
  }
  await copyToClipboard(JSON.stringify(payload, null, 2), 'Skopiowano diagnostykę motywu (JSON)')
}

function clearLocalAppearanceMirror() {
  if (!import.meta.client) {
    return
  }
  const uid = auth.user.value?.id
  if (!uid) {
    toast.add({ title: 'Brak zalogowanego użytkownika', color: 'warning' })
    return
  }
  const keys = slaviaAppearanceStorageKeys(uid)
  localStorage.removeItem(keys.preset)
  localStorage.removeItem(keys.mode)
  hydrateThemeAppearance()
  refreshDomPresetAttr()
  toast.add({
    title: 'Usunięto lokalny mirror motywu',
    description: 'Zsynchronizowano z danymi konta (hydracja).',
    color: 'success'
  })
}

function devSetColorMode(next: 'light' | 'dark' | 'system') {
  themeColorMode.preference = next
  refreshDomPresetAttr()
}

async function devQuickSetPreset(id: SlaviaThemePreset) {
  await setThemePreset(id)
  refreshDomPresetAttr()
}

function resetExperimentalDefaults() {
  experimental.resetAllToDefaults()
  toast.add({ title: 'Przywrócono domyślne wartości funkcji eksperymentalnych', color: 'success' })
}

/** Spłaszczone wartości dla USwitch (vue-tsc indeksuje poprawnie niż zagnieżdżony ComputedRef). */
const experimentalResolved = computed(() => experimental.enabledMap.value)

const experimentalKillDeploy = computed(() => experimental.killSwitchRaw.value)

const stableExperimentalIds = new Set<string>([
  'club_notification_bell',
  'admin_accounts_ban_ui',
  'athlete_reverse_account_linking',
  'ban_redirect_on_403',
  'barbell_pose_analysis',
  'dev_viewport_iframe_preview'
])

const experimentalVisibleDefs = computed(() =>
  (experimental.definitions || []).filter(d => !stableExperimentalIds.has(d.id))
)

const experimentalStableDefs = computed(() =>
  (experimental.definitions || [])
    .filter(d => stableExperimentalIds.has(d.id))
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, 'pl'))
)

async function setExperimentalFlag(id: string, value: boolean) {
  if (experimental.isForcedOffByDeploy(id)) {
    toast.add({
      title: 'Funkcja wyłączona na deployu',
      description: `Zmienna NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH blokuje „${id}”. Usuń ten identyfikator z listy i przebuduj aplikację.`,
      color: 'warning'
    })
    return
  }
  await experimental.setFlag(id as ExperimentalFeatureId, value)
}

function isExperimentalLocked(id: string) {
  return experimental.isForcedOffByDeploy(id)
}
const config = useRuntimeConfig()

type FeatureAdoptionRow = {
  module_key: string
  label: string
  unique_users_30d: number
  events_30d: number
}

const featureAdoptionRows = ref<FeatureAdoptionRow[]>([])
const featureAdoptionLoading = ref(false)
const cmsBaseConfigured = computed(() => Boolean(String(config.public.cmsBaseUrl || '').trim()))

async function refreshFeatureAdoption() {
  featureAdoptionLoading.value = true
  try {
    featureAdoptionRows.value = await apiFetch<FeatureAdoptionRow[]>(apiRoutes.system.featureAdoption)
  } catch (e) {
    featureAdoptionRows.value = []
    toast.add({ title: 'Adopcja modułów', description: getApiErrorMessage(e), color: 'warning' })
  } finally {
    featureAdoptionLoading.value = false
  }
}

const { enabled, permission, supported, requestPermission, setEnabled, notify } = useBrowserNotifications()
const userAgentDisplay = ref('')
const systemLogs = useDevSuperadminLogs()

const systemLogRows = computed(() => systemLogs.items.value)

const buildMeta = computed(() => `Środowisko: ${import.meta.dev ? 'development' : 'production'} · klient`)

const router = useRouter()

function iconForRoute(path: string) {
  if (path === '/') return 'i-lucide-home'
  if (path.startsWith('/superadmin')) return 'i-lucide-crown'
  if (path.startsWith('/admin')) return 'i-lucide-shield'
  if (path.startsWith('/trainer')) return 'i-lucide-dumbbell'
  if (path.startsWith('/athlete')) return 'i-lucide-user'
  if (path.startsWith('/aktualnosci')) return 'i-lucide-newspaper'
  if (path.startsWith('/ogloszenia')) return 'i-lucide-megaphone'
  if (path.startsWith('/galeria')) return 'i-lucide-images'
  if (path.startsWith('/kalendarz')) return 'i-lucide-calendar'
  if (path.startsWith('/kontakt')) return 'i-lucide-message-square'
  if (path.startsWith('/logowanie')) return 'i-lucide-log-in'
  if (path.startsWith('/profil')) return 'i-lucide-user-cog'
  return 'i-lucide-link'
}

/** Nuxt / Vue Router — trasy wewnętrzne do podglądu na mapie developera. */
function isInspectRoute(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('/__')) return false
  if (path.startsWith('/_nuxt')) return false
  if (path.includes('pathMatch')) return false
  return true
}

/** Grupa alfabetycznie po pierwszym segmencie URL (wspólna skala dla całej aplikacji). */
function routeMapGroupTitle(path: string): string {
  if (path === '/') return 'Trasy (auto): /'
  const seg = path.split('/').filter(Boolean)[0] || 'inne'
  return `Trasy (auto): /${seg}`
}

const autoRouteGroups = computed(() => {
  const records = router.getRoutes().filter(r => isInspectRoute(String(r.path || '')))
  const descriptionByPath = new Map<string, string>()
  for (const r of records) {
    const p = String(r.path || '')
    if (!descriptionByPath.has(p)) {
      const named = typeof r.name === 'string' && r.name.trim() ? r.name.trim() : ''
      descriptionByPath.set(p, named || 'Wygenerowane z routera Nuxt')
    }
  }
  const paths = [...descriptionByPath.keys()].sort((a, b) => a.localeCompare(b, 'pl'))

  const byTitle = new Map<string, Array<{ to: string, label: string, description: string, icon: string }>>()
  for (const p of paths) {
    const title = routeMapGroupTitle(p)
    const link = {
      to: p,
      label: p,
      description: descriptionByPath.get(p) || 'Wygenerowane z routera Nuxt',
      icon: iconForRoute(p)
    }
    const list = byTitle.get(title) || []
    list.push(link)
    byTitle.set(title, list)
  }

  return [...byTitle.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pl'))
    .map(([title, links]) => ({
      title,
      description: 'Lista tras z `router.getRoutes()` (w tym ścieżki z parametrami, np. `:slug`).',
      links: links.sort((x, y) => x.to.localeCompare(y.to, 'pl'))
    }))
})

const devLinkGroupsCombined = computed(() => {
  const seen = new Set<string>()
  const groups = [
    DEV_TOOL_STACK_GROUP,
    ...autoRouteGroups.value,
    ...DEV_TOOL_ROUTE_SUPPLEMENT,
    DEV_TOOL_EXTERNAL_DOCS_GROUP
  ]
  return groups
    .map((g) => {
      const links = (g.links || []).filter((l) => {
        const key = String(l.to || '')
        if (!key) return false
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      return { ...g, links }
    })
    .filter(g => g.links.length > 0)
})

function routeChipLabel(to: string) {
  const t = String(to || '')
  if (!t) return '—'
  if (t === '/') return '/'
  const nice = t.replace(/^\/+/, '')
  return nice.length > 28 ? `${nice.slice(0, 26)}…` : nice
}

const apiPingMs = ref<number | null>(null)
const backendProviderSaving = ref(false)
const backendProviderServerUpdatedAt = ref<string | null>(null)
const selectedBackendProvider = ref<'leapcell' | 'render'>(backendProvider.activeProvider.value)
const activeBackendProvider = computed(() => backendProvider.activeProvider.value)
const activeBackendApiBase = computed(() => backendProvider.activeApiBase.value)
const isLocalBackend = computed(() => {
  const u = String(activeBackendApiBase.value || '').toLowerCase()
  return u.includes('localhost') || u.includes('127.0.0.1')
})

watch(
  () => backendProvider.activeProvider.value,
  (next) => {
    selectedBackendProvider.value = next
  }
)

function isExternalHref(to: string) {
  return /^https?:\/\//i.test(to)
}

onMounted(() => {
  systemLogs.load()
  if (import.meta.client) {
    userAgentDisplay.value = navigator.userAgent
    refreshDomPresetAttr()
    syncMobilePreviewFromStorage()
    applyMobilePreviewDom(mobilePreviewOn.value, mobilePreviewWidth.value)
  }
  void refreshBanUsersCatalog()
  void refreshFeatureAdoption()
  void $fetch<{ active_provider: 'leapcell' | 'render', updated_at?: string | null }>('/api/system/backend-provider', {
    headers: auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : undefined
  })
    .then((res) => {
      if (res.active_provider === 'leapcell' || res.active_provider === 'render') {
        backendProvider.setActiveProvider(res.active_provider)
        selectedBackendProvider.value = res.active_provider
      }
      backendProviderServerUpdatedAt.value = res.updated_at ?? null
    })
    .catch(() => {})
  void experimental.hydrateFromApi()
})

function formatLogTs(ts: number) {
  return format(ts, 'dd.MM.yyyy HH:mm:ss', { locale: pl })
}

function logLevelColor(level: DevSuperadminLogLevel) {
  if (level === 'error') {
    return 'error'
  }
  if (level === 'warn') {
    return 'warning'
  }
  if (level === 'change') {
    return 'primary'
  }
  return 'neutral'
}

function downloadLogsExport() {
  if (!import.meta.client) {
    return
  }
  const blob = new Blob([systemLogs.exportJson()], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `slavia-dev-logs-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Wyeksportowano logi JSON', color: 'success' })
}

function toggleReducedMotionDev() {
  if (!import.meta.client) {
    return
  }
  const on = document.documentElement.classList.toggle('slavia-dev-force-reduced-motion')
  toast.add({
    title: on ? 'Włączono symulację „reduced motion”' : 'Wyłączono symulację „reduced motion”',
    color: 'info'
  })
}

const DEV_LS_MOBILE_PREVIEW = 'slavia-dev-mobile-preview'
const DEV_LS_MOBILE_PREVIEW_WIDTH = 'slavia-dev-mobile-preview-width'

const mobilePreviewOn = ref(false)
const mobilePreviewWidth = ref('390px')

const DEV_LS_VIEWPORT_MODE = 'slavia-dev-viewport-mode'
const DEV_LS_VIEWPORT_WIDTH = 'slavia-dev-viewport-width'

const viewportMode = ref<'off' | 'mobile' | 'desktop'>('off')
const viewportWidth = ref('390')

function syncMobilePreviewFromStorage() {
  if (!import.meta.client) return
  const on = (localStorage.getItem(DEV_LS_MOBILE_PREVIEW) || '') === '1'
  mobilePreviewOn.value = on
  const w = (localStorage.getItem(DEV_LS_MOBILE_PREVIEW_WIDTH) || '').trim()
  mobilePreviewWidth.value = w || '390px'

  const vm = (localStorage.getItem(DEV_LS_VIEWPORT_MODE) || 'off').trim()
  viewportMode.value = vm === 'mobile' || vm === 'desktop' ? vm : 'off'
  const vw = (localStorage.getItem(DEV_LS_VIEWPORT_WIDTH) || '').trim()
  viewportWidth.value = vw || (viewportMode.value === 'desktop' ? '1280' : '390')
}

function applyMobilePreviewDom(on: boolean, width: string) {
  if (!import.meta.client) return
  document.documentElement.classList.toggle('slavia-dev-mobile-preview', on)
  const w = (width || '').trim()
  if (w) {
    document.documentElement.style.setProperty('--slavia-dev-mobile-width', w)
  } else {
    document.documentElement.style.removeProperty('--slavia-dev-mobile-width')
  }
}

function toggleMobilePreview() {
  if (!import.meta.client) return
  const next = !mobilePreviewOn.value
  mobilePreviewOn.value = next
  localStorage.setItem(DEV_LS_MOBILE_PREVIEW, next ? '1' : '0')
  localStorage.setItem(DEV_LS_MOBILE_PREVIEW_WIDTH, mobilePreviewWidth.value)
  applyMobilePreviewDom(next, mobilePreviewWidth.value)
  toast.add({
    title: next ? 'Włączono podgląd mobilny' : 'Wyłączono podgląd mobilny',
    color: 'info'
  })
}

function clearDevIframeSessionFlag() {
  if (!import.meta.client) return
  try {
    sessionStorage.removeItem('slavia-dev__iframe_active')
  } catch {
    /* ignore */
  }
}

function applyViewportPreview(mode: 'off' | 'mobile' | 'desktop', width: string) {
  if (!import.meta.client) return
  viewportMode.value = mode
  viewportWidth.value = width
  localStorage.setItem(DEV_LS_VIEWPORT_MODE, mode)
  localStorage.setItem(DEV_LS_VIEWPORT_WIDTH, String(width || '').trim())
  if (mode === 'off') {
    clearDevIframeSessionFlag()
  }
  window.dispatchEvent(new Event('slavia-dev-viewport-changed'))
}

function toggleViewportMobile() {
  const next = viewportMode.value === 'mobile' ? 'off' : 'mobile'
  const w = String(viewportWidth.value || '').trim() || '390'
  applyViewportPreview(next, w)
  toast.add({ title: next === 'mobile' ? 'Włączono podgląd Mobile (iframe)' : 'Wyłączono podgląd Mobile', color: 'info' })
}

function toggleViewportDesktop() {
  const next = viewportMode.value === 'desktop' ? 'off' : 'desktop'
  const w = String(viewportWidth.value || '').trim() || '1280'
  applyViewportPreview(next, w)
  toast.add({ title: next === 'desktop' ? 'Włączono podgląd Desktop (iframe)' : 'Wyłączono podgląd Desktop', color: 'info' })
}

function cycleViewportWidth() {
  const cur = Number.parseInt(String(viewportWidth.value || ''), 10) || (viewportMode.value === 'desktop' ? 1280 : 390)
  const next = viewportMode.value === 'desktop'
    ? (cur === 1024 ? 1280 : cur === 1280 ? 1440 : 1024)
    : (cur === 375 ? 390 : cur === 390 ? 414 : 375)
  viewportWidth.value = String(next)
  toast.add({ title: `Iframe: ${next}px`, color: 'info' })
  if (import.meta.client && viewportMode.value !== 'off') {
    localStorage.setItem(DEV_LS_VIEWPORT_WIDTH, String(next))
  }
}

watch(mobilePreviewWidth, (w) => {
  if (!import.meta.client) return
  localStorage.setItem(DEV_LS_MOBILE_PREVIEW_WIDTH, w)
  if (mobilePreviewOn.value) {
    applyMobilePreviewDom(true, w)
  }
})

watch(viewportWidth, (w) => {
  if (!import.meta.client) return
  localStorage.setItem(DEV_LS_VIEWPORT_WIDTH, w)
})

function logRouteSummary() {
  if (!import.meta.client) {
    return
  }
  systemLogs.push({
    level: 'info',
    title: `Podgląd ścieżki: ${window.location.pathname}`,
    detail: window.location.href
  })
  toast.add({ title: 'Dodano wpis logu (ścieżka)', color: 'success' })
}

const {
  data: status,
  refresh: refreshDeveloperStatus,
  pending: developerStatusPending
} = await useAsyncData('superadmin-developer-status', async () => {
  const [posts, athletes, competitions, pending] = await Promise.all([
    apiFetch('/api/posts').catch(() => []),
    apiFetch('/api/athletes/admin').catch(() => []),
    apiFetch('/api/competitions').catch(() => []),
    apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
  ])

  return {
    postsCount: Array.isArray(posts) ? posts.length : 0,
    athletesCount: Array.isArray(athletes) ? athletes.length : 0,
    competitionsCount: Array.isArray(competitions) ? competitions.length : 0,
    pendingCount: Array.isArray(pending) ? pending.length : 0
  }
})

async function sendTestNotification() {
  if (!import.meta.client || !supported) {
    toast.add({ title: 'Twoja przeglądarka nie obsługuje systemowych powiadomień', color: 'warning' })
    return
  }

  const permissionResult = permission.value === 'granted' ? 'granted' : await requestPermission()
  if (permissionResult !== 'granted') {
    toast.add({ title: 'Powiadomienia blokowane', description: 'Ustaw uprawnienia przeglądarki, aby otrzymać testowe powiadomienie.', color: 'warning' })
    return
  }

  setEnabled(true)
  notify('Testowe powiadomienie', {
    body: 'To jest testowe powiadomienie systemowe z panelu developera.',
    icon: '/logo.png'
  })
  toast.add({ title: 'Testowe powiadomienie wysłane', color: 'success' })
}

async function copyToClipboard(text: string, successTitle: string) {
  if (!import.meta.client || !text) {
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: successTitle, color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się skopiować do schowka', color: 'error' })
  }
}

function copyCurrentUrl() {
  if (!import.meta.client) {
    return
  }
  void copyToClipboard(window.location.href, 'Skopiowano adres bieżącej strony')
}

function copySiteUrl() {
  const base = config.public.siteUrl?.replace(/\/$/, '') ?? ''
  void copyToClipboard(base, 'Skopiowano publiczny URL strony (siteUrl)')
}

function copyApiBase() {
  const base = config.public.apiBase?.replace(/\/$/, '') ?? ''
  void copyToClipboard(base, 'Skopiowano API base URL')
}

function hardReload() {
  if (!import.meta.client) {
    return
  }
  window.location.reload()
}

async function clearWebStorage() {
  if (!import.meta.client) {
    return
  }
  const ok = window.confirm('Wyczyścić localStorage i sessionStorage dla tej domeny? Wyloguje to sesje oparte o pamięć przeglądarki.')
  if (!ok) {
    return
  }
  try {
    localStorage.clear()
    sessionStorage.clear()
    toast.add({ title: 'Pamięć lokalna wyczyszczona', description: 'Odśwież stronę, jeśli coś działa nietypowo.', color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się wyczyścić pamięci', color: 'error' })
  }
}

async function unregisterServiceWorkers() {
  if (!import.meta.client || !('serviceWorker' in navigator)) {
    toast.add({ title: 'Brak service workerów w tej przeglądarce', color: 'warning' })
    return
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map(r => r.unregister()))
    toast.add({
      title: 'Service workery wyrejestrowane',
      description: regs.length ? `Liczba: ${regs.length}. Odśwież stronę, aby załadować SW od nowa.` : 'Nie znaleziono aktywnych rejestracji.',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'Nie udało się wyrejestrować SW', color: 'error' })
  }
}

function buildEnvDump(): Record<string, unknown> {
  const u = auth.user.value
  return {
    capturedAt: new Date().toISOString(),
    build: import.meta.dev ? 'development' : 'production',
    siteUrl: config.public.siteUrl ?? null,
    apiBase: config.public.apiBase ?? null,
    path: import.meta.client ? window.location.pathname : null,
    href: import.meta.client ? window.location.href : null,
    online: import.meta.client ? navigator.onLine : null,
    language: import.meta.client ? navigator.language : null,
    userAgent: import.meta.client ? navigator.userAgent : null,
    viewport: import.meta.client
      ? {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        }
      : null,
    user: u
      ? {
          id: u.id,
          username: u.username,
          roles: u.roles,
          ui_theme_preset: u.ui_theme_preset ?? null,
          ui_color_mode: u.ui_color_mode ?? null
        }
      : null
  }
}

async function copyEnvDumpJson() {
  await copyToClipboard(JSON.stringify(buildEnvDump(), null, 2), 'Skopiowano JSON środowiska (bez sekretów)')
}

async function copyNavigatorSummary() {
  if (!import.meta.client) {
    return
  }
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string, downlink?: number }
    deviceMemory?: number
  }
  const payload = {
    language: nav.language,
    languages: [...(nav.languages || [])],
    cookieEnabled: nav.cookieEnabled,
    platform: nav.platform,
    hardwareConcurrency: nav.hardwareConcurrency,
    maxTouchPoints: nav.maxTouchPoints,
    deviceMemory: nav.deviceMemory,
    connection: nav.connection
      ? {
          effectiveType: nav.connection.effectiveType,
          downlink: nav.connection.downlink
        }
      : undefined
  }
  await copyToClipboard(JSON.stringify(payload, null, 2), 'Skopiowano podsumowanie Navigator')
}

async function copyLocalStorageKeys() {
  if (!import.meta.client) {
    return
  }
  const keys = Object.keys(localStorage).sort()
  await copyToClipboard(keys.join('\n') || '(pusto)', 'Skopiowano klucze localStorage')
}

function copyViewportString() {
  if (!import.meta.client) {
    return
  }
  const s = `${window.innerWidth}×${window.innerHeight}px · DPR ${window.devicePixelRatio}`
  void copyToClipboard(s, 'Skopiowano rozmiar viewport')
}

async function copyAuthBearerToken() {
  if (!import.meta.client) return
  const t = String(auth.token.value || '').trim()
  if (!t) {
    toast.add({ title: 'Brak tokena', description: 'Zaloguj się ponownie, jeśli sesja jest pusta.', color: 'warning' })
    return
  }
  await copyToClipboard(`Bearer ${t}`, 'Skopiowano token Bearer (uwaga: wrażliwe)')
}

async function copyMemoryHint() {
  if (!import.meta.client) {
    return
  }
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number, totalJSHeapSize: number, jsHeapSizeLimit: number } }
  if (!perf.memory) {
    toast.add({ title: 'performance.memory niedostępne (np. Firefox)', color: 'warning' })
    return
  }
  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perf.memory
  const lines = [
    `usedJSHeapSize: ${usedJSHeapSize}`,
    `totalJSHeapSize: ${totalJSHeapSize}`,
    `jsHeapSizeLimit: ${jsHeapSizeLimit}`
  ]
  await copyToClipboard(lines.join('\n'), 'Skopiowano metryki heap (Chrome)')
}

async function pingApiLatency() {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  try {
    const ping = await apiFetch<{ ok?: boolean, instance?: string | null }>('/api/system/ping').catch(() => null)
    const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)
    apiPingMs.value = ms
    const inst = ping?.instance ? ` · instance: ${ping.instance}` : ''
    systemLogs.push({
      level: 'info',
      title: `Ping GET /api/system/ping`,
      detail: `${ms} ms${inst} (sprawdź log stdout backendu — println!)`
    })
    toast.add({ title: `API ~${ms} ms`, color: 'success' })
  } catch (e) {
    apiPingMs.value = null
    toast.add({ title: 'Żądanie nie powiodło się', description: String(e), color: 'error' })
  }
}

async function refreshBackendProviderSetting() {
  try {
    const res = await $fetch<{ active_provider: 'leapcell' | 'render', updated_at?: string | null }>('/api/system/backend-provider', {
      headers: auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : undefined
    })
    if (res.active_provider === 'leapcell' || res.active_provider === 'render') {
      backendProvider.setActiveProvider(res.active_provider)
      selectedBackendProvider.value = res.active_provider
    }
    backendProviderServerUpdatedAt.value = res.updated_at ?? null
    toast.add({ title: 'Odświeżono globalne ustawienie backendu', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się pobrać ustawienia backendu', description: getApiErrorMessage(e), color: 'error' })
  }
}

async function saveBackendProviderSetting() {
  backendProviderSaving.value = true
  try {
    const res = await $fetch<{ active_provider: 'leapcell' | 'render', updated_at?: string | null }>('/api/system/backend-provider', {
      method: 'PATCH',
      headers: auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : undefined,
      body: { active_provider: selectedBackendProvider.value }
    })
    backendProvider.setActiveProvider(res.active_provider)
    backendProviderServerUpdatedAt.value = res.updated_at ?? null
    systemLogs.push({
      level: 'change',
      title: `Przełączono backend: ${res.active_provider}`,
      detail: backendProvider.activeApiBase.value
    })
    console.info('[backend-provider] global switch saved', {
      provider: res.active_provider,
      apiBase: backendProvider.activeApiBase.value
    })
    toast.add({
      title: `Ustawiono backend: ${res.active_provider === 'render' ? 'Render' : 'Leapcell'}`,
      description: `Aktywny URL backendu: ${backendProvider.activeApiBase.value}`,
      color: 'success'
    })
  } catch (e) {
    const detail = getApiDetailedErrorMessage(e)
    systemLogs.push({
      level: 'error',
      title: 'Błąd zapisu ustawienia backendu',
      detail
    })
    console.error('[backend-provider] save failed', e)
    toast.add({ title: 'Nie udało się zapisać ustawienia backendu', description: detail, color: 'error' })
  } finally {
    backendProviderSaving.value = false
  }
}

async function clearBrowserCachesApi() {
  if (!import.meta.client || !('caches' in window)) {
    toast.add({ title: 'Cache Storage niedostępny', color: 'warning' })
    return
  }
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
    toast.add({
      title: 'Cache Storage wyczyszczony',
      description: keys.length ? `Liczba wpisów: ${keys.length}` : 'Brak wpisów cache.',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'Nie udało się wyczyścić Cache Storage', color: 'error' })
  }
}

async function clearIndexedDbDatabases() {
  if (!import.meta.client || !('indexedDB' in window)) {
    toast.add({ title: 'indexedDB niedostępne', color: 'warning' })
    return
  }
  const idb = indexedDB as IDBFactory & { databases?: () => Promise<Array<{ name?: string }>> }
  if (typeof idb.databases !== 'function') {
    toast.add({
      title: 'Brak listy baz IDB',
      description: 'Ta przeglądarka nie obsługuje indexedDB.databases().',
      color: 'warning'
    })
    return
  }
  try {
    const dbs = (await idb.databases()) || []
    const names = [...new Set(dbs.map(d => d?.name).filter(Boolean) as string[])]
    if (names.length === 0) {
      toast.add({ title: 'Brak baz IndexedDB', color: 'success' })
      return
    }
    await Promise.all(names.map((name) => new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(name)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })))
    systemLogs.push({
      level: 'change',
      title: 'Wyczyszczono IndexedDB',
      detail: names.join('\n')
    })
    toast.add({ title: `IndexedDB usunięte (${names.length})`, description: 'Szczegóły w logach.', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się wyczyścić IndexedDB', description: String(e), color: 'error' })
  }
}

function logOnlineStatus() {
  if (!import.meta.client) {
    return
  }
  systemLogs.push({
    level: 'info',
    title: `Navigator.onLine = ${navigator.onLine}`,
    detail: window.location.href
  })
  toast.add({ title: 'Status połączenia zapisany w logach', color: 'success' })
}

const DEV_LS_SELFTEST = 'slavia-developer-ls-selftest'
const DEV_SS_SELFTEST = 'slavia-developer-ss-selftest'

function testLocalStorageRoundtrip() {
  if (!import.meta.client) {
    return
  }
  try {
    const val = `ok@${Date.now()}`
    localStorage.setItem(DEV_LS_SELFTEST, val)
    const read = localStorage.getItem(DEV_LS_SELFTEST)
    localStorage.removeItem(DEV_LS_SELFTEST)
    const ok = read === val
    systemLogs.push({
      level: ok ? 'info' : 'error',
      title: 'Test localStorage (zapis / odczyt / kasowanie)',
      detail: ok ? 'Wynik zgodny z zapisem.' : `Oczekiwano „${val}”, odczyt: „${read ?? '(null)'}”.`
    })
    toast.add({
      title: ok ? 'localStorage działa poprawnie' : 'localStorage — niezgodność odczytu',
      color: ok ? 'success' : 'error'
    })
  } catch (e) {
    systemLogs.push({
      level: 'error',
      title: 'Test localStorage — wyjątek',
      detail: String(e)
    })
    toast.add({ title: 'localStorage niedostępny lub zablokowany', description: String(e), color: 'error' })
  }
}

function testSessionStorageRoundtrip() {
  if (!import.meta.client) {
    return
  }
  try {
    const val = `ss@${Date.now()}`
    sessionStorage.setItem(DEV_SS_SELFTEST, val)
    const read = sessionStorage.getItem(DEV_SS_SELFTEST)
    sessionStorage.removeItem(DEV_SS_SELFTEST)
    const ok = read === val
    systemLogs.push({
      level: ok ? 'info' : 'error',
      title: 'Test sessionStorage',
      detail: ok ? 'OK' : `Oczekiwano „${val}”, odczyt: „${read ?? '(null)'}”.`
    })
    toast.add({
      title: ok ? 'sessionStorage OK' : 'sessionStorage — błąd',
      color: ok ? 'success' : 'error'
    })
  } catch (e) {
    toast.add({ title: 'sessionStorage — wyjątek', description: String(e), color: 'error' })
  }
}

async function runApiSmokeTests() {
  const endpoints: { path: string, label: string }[] = [
    { path: '/api/posts', label: 'Blog (lista publiczna)' },
    { path: '/api/competitions', label: 'Zawody' },
    { path: '/api/competitions/recurring-training-cancellations', label: 'Treningi cykliczne — wyjątki (Pn/Śr/Pt)' },
    { path: '/api/auth/me', label: 'Sesja (/auth/me)' },
    { path: '/api/notifications', label: 'Powiadomienia (skrzynka)' }
  ]
  for (const { path, label } of endpoints) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    try {
      await apiFetch(path).catch(() => null)
      const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0)
      systemLogs.push({
        level: 'info',
        title: `Smoke API: ${label}`,
        detail: `${path} · ~${ms} ms`
      })
    } catch (e) {
      systemLogs.push({
        level: 'warn',
        title: `Smoke API: ${label}`,
        detail: `${path} · ${String(e)}`
      })
    }
  }
  toast.add({
    title: 'Smoke API — wykonano',
    description: `${endpoints.length} żądań zapisanych w logach lokalnych (patrz sekcja na dole strony).`,
    color: 'success'
  })
}

function logMediaAndUiCaps() {
  if (!import.meta.client) {
    return
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  const contrastMore = window.matchMedia('(prefers-contrast: more)').matches
  const standalone =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  const lines = [
    `prefers-reduced-motion: ${reducedMotion ? 'reduce' : 'no-preference'}`,
    `prefers-color-scheme: ${darkScheme ? 'dark' : 'light'}`,
    `prefers-contrast: ${contrastMore ? 'more' : 'normal'}`,
    `display-mode standalone: ${standalone ? 'tak' : 'nie'}`,
    `visibilityState: ${document.visibilityState}`,
    `document.hasFocus(): ${document.hasFocus()}`
  ].join('\n')
  systemLogs.push({
    level: 'info',
    title: 'Preferencje wyświetlania i stan dokumentu',
    detail: lines
  })
  toast.add({ title: 'Zapisano preferencje UI w logach', color: 'success' })
}

function logScreenGeometry() {
  if (!import.meta.client) {
    return
  }
  const so = screen.orientation?.type ?? '(brak API)'
  const angle = screen.orientation?.angle ?? NaN
  const detail = [
    `screen: ${screen.width}×${screen.height}`,
    `avail: ${screen.availWidth}×${screen.availHeight}`,
    `window (inner): ${window.innerWidth}×${window.innerHeight}`,
    `devicePixelRatio: ${window.devicePixelRatio}`,
    `orientation: ${so}${Number.isFinite(angle) ? ` (${angle}°)` : ''}`
  ].join('\n')
  systemLogs.push({ level: 'info', title: 'Geometria ekranu / okna', detail })
  toast.add({ title: 'Geometria ekranu — wpis w logach', color: 'success' })
}

async function toggleFullscreenDev() {
  if (!import.meta.client) {
    return
  }
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      toast.add({ title: 'Pełny ekran włączony', color: 'info' })
    } else {
      await document.exitFullscreen()
      toast.add({ title: 'Pełny ekran wyłączony', color: 'info' })
    }
  } catch (e) {
    toast.add({ title: 'Fullscreen niedostępny', description: String(e), color: 'warning' })
  }
}

function toastStorageApisAvailability() {
  if (!import.meta.client) {
    return
  }
  const idb = 'indexedDB' in window
  const caches = 'caches' in window
  const share = typeof navigator !== 'undefined' && 'share' in navigator
  const geo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const vibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  const detail = `indexedDB: ${idb ? 'tak' : 'nie'}\ncaches: ${caches ? 'tak' : 'nie'}\nnavigator.share: ${share ? 'tak' : 'nie'}\ngeolocation: ${geo ? 'tak' : 'nie'}\nvibrate: ${vibrate ? 'tak' : 'nie'}`
  systemLogs.push({ level: 'info', title: 'Dostępność API przeglądarki', detail })
  toast.add({ title: 'API (IDB / cache / share / geo / vibrate)', description: 'Szczegóły w logach.', color: 'success' })
}
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      eyebrow="Developer"
      title="Narzędzia superadmina"
      icon="i-lucide-terminal"
      description="Konfiguracja deployu, funkcje eksperymentalne, smoke API, schowek, motyw i mapa tras — pod szybki smoke i debug."
    >
      <template #actions>
        <UButton
          to="/superadmin"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
        >
          Panel
        </UButton>
      </template>
    </PanelPageHeader>

    <UCard class="mb-4 rounded-2xl border-primary/25 bg-linear-to-br from-primary/6 via-card to-card p-4 shadow-sm ring-1 ring-primary/15 sm:p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
            Publiczna konfiguracja (NUXT_PUBLIC_*)
          </p>
          <p class="mt-1 text-[11px] leading-relaxed text-muted sm:text-xs">
            Wartości trafiają do bundla klienta — <strong class="text-highlighted">bez sekretów</strong>. Zmiana wymaga ponownego deployu / restartu dev.
          </p>
        </div>
        <UBadge color="neutral" variant="subtle" size="xs" class="shrink-0 font-mono">
          X-API-Version: 1
        </UBadge>
      </div>
      <ul class="mt-3 grid gap-2 text-[11px] text-muted sm:grid-cols-2">
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_API_BASE_URL</span>
          — adres backendu (Leapcell / Render / localhost).
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_FEATURES_JSON</span>
          — obiekt JSON z flagami boolean (np.
          <code class="break-all font-mono text-[10px] text-primary">{"athleteCompare":false}</code>
          ); czyta composable <span class="font-mono text-[10px] text-highlighted">usePublicFeatures()</span>.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_FEATURE_ATHLETE_COMPARE</span>
          — <code class="font-mono">0</code> wyłącza link „Porównanie” na liście zawodników (domyślnie włączone bez zmiennej).
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH</span>
          — lista <code class="font-mono">id</code> z
          <code class="font-mono text-[10px]">experimentalFeaturesCatalog.ts</code>, rozdzielona przecinkami; wymusza wyłączenie na produkcji.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2 sm:col-span-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_SITE_URL</span>,
          <span class="font-mono text-[10px] text-highlighted">VERCEL_URL</span>,
          <span class="font-mono text-[10px] text-highlighted">NUXT_SOURCEMAP=1</span>
          — canonical / og:url, adres na Vercel, opcjonalne mapy przy buildzie.
        </li>
      </ul>
      <p class="mt-3 text-[10px] text-muted">
        Backend dokłada nagłówek odpowiedzi <span class="font-mono text-highlighted">X-API-Version: 1</span>
        — możesz go podejrzeć w zakładce Sieć / Network.
      </p>
    </UCard>

    <!-- Sekcja 1: statystyki / smoke API — zawsze nad narzędziami pomocniczymi -->
    <section aria-label="Statystyki i backend" class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-7">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Statystyki API
          </p>
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="developerStatusPending"
            @click="refreshDeveloperStatus(); refreshBanUsersCatalog()"
          >
            Odśwież
          </UButton>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Blog
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.postsCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Zawodnicy
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.athletesCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Zawody
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.competitionsCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Oczekujące
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ status?.pendingCount ?? 0 }}
            </p>
          </div>
        </div>
        <p
          v-if="apiPingMs != null"
          class="mt-2 text-center font-mono text-[10px] text-muted"
        >
          Ping GET /api/posts: <span class="text-highlighted">{{ apiPingMs }}</span> ms
        </p>
        <div class="mt-3 rounded-xl border border-default/60 bg-muted/10 p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Globalny provider backendu
            </p>
            <UBadge size="xs" variant="subtle" color="primary">
              aktywny: {{
                isLocalBackend
                  ? 'localhost'
                  : (activeBackendProvider === 'render' ? 'Render' : 'Leapcell')
              }}
            </UBadge>
          </div>
          <p class="mt-1 text-[11px] leading-snug text-muted">
            Ustawienie zapisuje się po stronie API i obowiązuje dla wszystkich urządzeń/kont.
          </p>
          <p class="mt-1 break-all font-mono text-[10px] text-muted">
            URL: {{ activeBackendApiBase }}
          </p>
          <div class="mt-2 flex flex-wrap gap-1">
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :disabled="isLocalBackend"
              :variant="selectedBackendProvider === 'leapcell' ? 'solid' : 'outline'"
              @click="selectedBackendProvider = 'leapcell'"
            >
              Leapcell
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :disabled="isLocalBackend"
              :variant="selectedBackendProvider === 'render' ? 'solid' : 'outline'"
              @click="selectedBackendProvider = 'render'"
            >
              Render
            </UButton>
          </div>
          <div class="mt-2 flex flex-wrap gap-1">
            <UButton
              size="xs"
              color="primary"
              icon="i-lucide-save"
              :loading="backendProviderSaving"
              @click="saveBackendProviderSetting"
            >
              Zapisz globalnie
            </UButton>
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              icon="i-lucide-refresh-cw"
              @click="refreshBackendProviderSetting"
            >
              Odśwież z serwera
            </UButton>
          </div>
          <p
            v-if="backendProviderServerUpdatedAt"
            class="mt-2 font-mono text-[10px] text-muted"
          >
            updated_at: {{ backendProviderServerUpdatedAt }}
          </p>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-5">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Eksperymentalne
            </p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">
              localStorage + opcjonalny <span class="font-mono">NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH</span>.
            </p>
            <UAlert
              v-if="experimentalKillDeploy"
              class="mt-2 text-[11px]"
              color="warning"
              variant="subtle"
              title="Kill switch"
            >
              <span class="break-all font-mono text-[10px]">{{ experimentalKillDeploy }}</span>
            </UAlert>
          </div>
          <UButton
            v-if="experimentalStableDefs.length > 0 || experimentalVisibleDefs.length > 0"
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-rotate-ccw"
            class="shrink-0"
            @click="resetExperimentalDefaults"
          >
            Reset
          </UButton>
        </div>

        <div v-if="experimentalStableDefs.length > 0" class="mt-3">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Włączone w produkcji (stabilne)
          </p>
          <p class="mt-0.5 text-[11px] text-muted">
            Domyślnie aktywne funkcje aplikacji; przełącznik zapisuje stan w przeglądarce jak pozostałe (kill switch deployu nadal ma pierwszeństwo).
          </p>
          <ul class="mt-2 divide-y divide-default/40 rounded-lg border border-default/50 bg-muted/5">
            <li
              v-for="def in experimentalStableDefs"
              :key="`stable-${def.id}`"
              class="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-highlighted">
                  {{ def.label }}
                </p>
                <p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                  {{ def.description }}
                </p>
                <p class="mt-2 font-mono text-[10px] text-muted/80">
                  {{ def.id }}
                  <UBadge
                    v-if="isExperimentalLocked(def.id)"
                    class="ml-2 align-middle"
                    color="warning"
                    variant="subtle"
                    size="xs"
                  >
                    deploy OFF
                  </UBadge>
                </p>
              </div>
              <USwitch
                :disabled="isExperimentalLocked(def.id)"
                :model-value="experimentalResolved[def.id] ?? def.defaultEnabled"
                @update:model-value="setExperimentalFlag(def.id, $event)"
              />
            </li>
          </ul>
        </div>

        <div
          v-if="experimentalVisibleDefs.length === 0"
          class="mt-3 rounded-lg border border-dashed border-default/60 bg-muted/10 px-3 py-4 text-center text-xs text-muted"
        >
          Brak eksperymentów (pozostałe są już stabilne) —
          <code class="font-mono text-[10px]">experimentalFeaturesCatalog.ts</code>
        </div>

        <template v-if="experimentalVisibleDefs.length > 0">
          <p class="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted">
            Eksperymenty (edycja)
          </p>
        </template>

        <ul
          v-if="experimentalVisibleDefs.length > 0"
          class="mt-2 divide-y divide-default/50 rounded-lg border border-default/60 bg-muted/5"
        >
          <li
            v-for="def in experimentalVisibleDefs"
            :key="def.id"
            class="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-highlighted">
                  {{ def.label }}
                </p>
                <p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                  {{ def.description }}
                </p>
                <p class="mt-2 font-mono text-[10px] text-muted/80">
                  {{ def.id }}
                  <span class="text-muted">
                    · domyślnie {{ def.defaultEnabled ? 'włączone' : 'wyłączone' }}
                  </span>
                  <UBadge
                    v-if="isExperimentalLocked(def.id)"
                    class="ml-2 align-middle"
                    color="warning"
                    variant="subtle"
                    size="xs"
                  >
                    deploy OFF
                  </UBadge>
                </p>
              </div>
              <USwitch
                :disabled="isExperimentalLocked(def.id)"
                :model-value="experimentalResolved[def.id] ?? def.defaultEnabled"
                @update:model-value="setExperimentalFlag(def.id, $event)"
              />
            </li>
          </ul>
        </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Motyw
            </p>
            <p class="text-[11px] text-muted">
              <span class="font-mono text-[10px]">data-slavia-preset</span>
              ·
              <NuxtLink
                class="font-medium text-primary underline-offset-2 hover:underline"
                to="/profil"
              >
                Profil
              </NuxtLink>
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <UButton
              variant="outline"
              color="neutral"
              size="xs"
              icon="i-lucide-refresh-cw"
              @click="
                hydrateThemeAppearance();
                refreshDomPresetAttr();
              "
            >
              Hydracja
            </UButton>
          </div>
        </div>

        <div class="mt-3 grid gap-3 lg:grid-cols-12 lg:items-start">
          <div class="rounded-lg border border-default/60 bg-muted/5 p-3 lg:col-span-3">
            <dl class="space-y-1 text-xs">
              <div class="flex justify-between gap-2">
                <dt class="text-muted">
                  Preset
                </dt>
                <dd class="truncate font-semibold text-highlighted">
                  {{ activePresetMeta?.label ?? themePreset }}
                </dd>
              </div>
              <div class="flex justify-between gap-2 font-mono text-[10px]">
                <dt class="text-muted">
                  ID / DOM
                </dt>
                <dd class="truncate text-right">
                  {{ themePreset }} · {{ domDataPresetAttr ?? '—' }}
                </dd>
              </div>
              <div class="flex justify-between gap-2">
                <dt class="text-muted">
                  Tryb
                </dt>
                <dd class="capitalize">
                  {{ themeColorMode.preference }}
                </dd>
              </div>
              <template v-if="auth.user.value">
                <div class="border-t border-default/40 pt-1 font-mono text-[10px]">
                  <span class="text-muted">srv:</span>
                  {{ auth.user.value.ui_theme_preset ?? '—' }}
                  /
                  {{ auth.user.value.ui_color_mode ?? '—' }}
                </div>
              </template>
            </dl>
          </div>

          <div class="min-w-0 lg:col-span-9">
            <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
              <UButton
                v-for="p in themePresets"
                :key="p.id"
                size="xs"
                class="min-h-9 touch-manipulation justify-start truncate text-left"
                :color="themePreset === p.id ? 'primary' : 'neutral'"
                :variant="themePreset === p.id ? 'solid' : 'outline'"
                :title="p.description"
                @click="devQuickSetPreset(p.id)"
              >
                {{ p.label }}
              </UButton>
            </div>
            <p
              v-if="activePresetMeta?.description"
              class="mt-2 line-clamp-2 text-[11px] leading-snug text-muted"
            >
              {{ activePresetMeta.description }}
            </p>
          </div>
        </div>

        <div class="mt-3 flex flex-col gap-2 border-t border-default/45 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div class="flex flex-wrap gap-1">
            <span class="mr-1 self-center text-[10px] font-bold uppercase text-muted">Tryb</span>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="themeColorMode.preference === 'light' ? 'solid' : 'outline'"
              @click="devSetColorMode('light')"
            >
              Jasny
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="themeColorMode.preference === 'dark' ? 'solid' : 'outline'"
              @click="devSetColorMode('dark')"
            >
              Ciemny
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="themeColorMode.preference === 'system' ? 'solid' : 'outline'"
              @click="devSetColorMode('system')"
            >
              System
            </UButton>
          </div>
          <div class="flex flex-1 flex-wrap gap-1 sm:justify-end">
            <UButton
              variant="outline"
              color="neutral"
              size="xs"
              icon="i-lucide-clipboard-copy"
              class="touch-manipulation"
              title="Diagnostyka motywu do schowka"
              @click="copyThemeDiagnosticsJson"
            >
              JSON
            </UButton>
            <UButton
              variant="outline"
              color="neutral"
              size="xs"
              icon="i-lucide-eraser"
              class="touch-manipulation"
              title="Usuń lokalny mirror motywu (localStorage)"
              @click="clearLocalAppearanceMirror"
            >
              Mirror
            </UButton>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="grid gap-4 lg:grid-cols-12 lg:items-start">
          <div class="space-y-3 lg:col-span-8">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Powiadomienia systemowe</span>
              <UButton
                color="primary"
                size="xs"
                class="touch-manipulation"
                @click="sendTestNotification"
              >
                Test notify
              </UButton>
            </div>
            <p class="rounded-lg border border-default/50 bg-muted/10 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-muted">
              obsługa: {{ supported ? 'tak' : 'nie' }} · upr.: {{ permission }} · sys.: {{ enabled ? 'tak' : 'nie' }}
            </p>

            <div class="border-t border-default/40 pt-3">
              <p class="mb-2 text-[10px] font-bold uppercase text-muted">
                API · storage · UI
              </p>
              <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-zap" class="touch-manipulation" @click="runApiSmokeTests">
                  <span class="truncate">Smoke API</span>
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-wifi" class="touch-manipulation" @click="pingApiLatency">
                  Ping
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-database" class="touch-manipulation" @click="testLocalStorageRoundtrip">
                  localStorage
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-layers" class="touch-manipulation" @click="testSessionStorageRoundtrip">
                  session
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-package-search" class="touch-manipulation" @click="toastStorageApisAvailability">
                  API przegl.
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-contrast" class="touch-manipulation" @click="logMediaAndUiCaps">
                  Motion/UI
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-monitor" class="touch-manipulation" @click="logScreenGeometry">
                  Ekran
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-maximize" class="touch-manipulation" @click="toggleFullscreenDev">
                  Fullscreen
                </UButton>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-default/60 bg-muted/5 p-3 lg:col-span-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Schowek · sieć
            </p>
            <div class="mt-2 grid grid-cols-2 gap-1.5">
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-braces" class="touch-manipulation" @click="copyEnvDumpJson">
                Env JSON
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-navigation" class="touch-manipulation" @click="copyNavigatorSummary">
                Navigator
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-list-tree" class="touch-manipulation" @click="copyLocalStorageKeys">
                Klucze LS
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-key-round" class="touch-manipulation" @click="copyAuthBearerToken">
                Token
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-activity" class="touch-manipulation" @click="logOnlineStatus">
                onLine
              </UButton>
              <UButton color="primary" variant="soft" size="xs" icon="i-lucide-wifi" class="touch-manipulation" @click="pingApiLatency">
                Ping
              </UButton>
              <UButton color="warning" variant="soft" size="xs" icon="i-lucide-database-zap" class="touch-manipulation" @click="clearBrowserCachesApi">
                Cache API
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p class="text-sm text-muted">
            <span class="font-semibold text-highlighted">{{ auth.user.value?.username }}</span>
            <span v-if="auth.rolesDisplayShort" class="text-muted"> · {{ auth.rolesDisplayShort }}</span>
          </p>
          <div class="flex flex-wrap gap-1">
            <UButton to="/superadmin" variant="outline" color="neutral" size="xs" icon="i-lucide-crown">
              SuperAdmin
            </UButton>
            <UButton to="/profil" variant="outline" color="neutral" size="xs" icon="i-lucide-palette">
              Profil
            </UButton>
            <UButton to="/aktualnosci/nowy" variant="outline" color="neutral" size="xs" icon="i-lucide-file-plus-2">
              Blog
            </UButton>
            <UButton to="/trainer/analiza-sztangi" variant="outline" color="neutral" size="xs" icon="i-lucide-scan-line">
              Sztanga
            </UButton>
            <UButton to="/admin/changelog" variant="outline" color="neutral" size="xs" icon="i-lucide-file-text">
              Changelog
            </UButton>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Przeglądarka (bez API)
        </p>
        <p class="mt-1 text-[11px] text-muted">
          Najedź na przycisk, aby zobaczyć podpowiedź — wpisy do schowka i akcje lokalne.
        </p>
        <div class="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-link" title="Pełny URL strony" class="touch-manipulation" @click="copyCurrentUrl">
            URL
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-globe" title="NUXT_PUBLIC_SITE_URL" class="touch-manipulation" @click="copySiteUrl">
            siteUrl
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-server" title="API base z runtime" class="touch-manipulation" @click="copyApiBase">
            API base
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-refresh-ccw" title="location.reload()" class="touch-manipulation" @click="hardReload">
            Reload
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-trash-2" title="Wyczyść localStorage i sessionStorage" class="touch-manipulation" @click="clearWebStorage">
            Wyczyść LS
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-database" title="Usuń bazy IndexedDB (Chrome/Edge)" class="touch-manipulation" @click="clearIndexedDbDatabases">
            Wyczyść IDB
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-rotate-ccw" title="Wyrejestruj service workery" class="touch-manipulation" @click="unregisterServiceWorkers">
            Wyrej. SW
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-accessibility" title="Symulacja prefers-reduced-motion" class="touch-manipulation" @click="toggleReducedMotionDev">
            Red. motion
          </UButton>
          <UButton
            color="neutral"
            :variant="mobilePreviewOn ? 'solid' : 'outline'"
            size="xs"
            icon="i-lucide-smartphone"
            title="Podgląd mobilny (ramka + ograniczenie szerokości aplikacji)"
            class="touch-manipulation"
            @click="toggleMobilePreview"
          >
            Mobile
          </UButton>
          <UButton
            color="neutral"
            :variant="viewportMode === 'mobile' ? 'solid' : 'outline'"
            size="xs"
            icon="i-lucide-smartphone"
            title="Podgląd Mobile w iframe (prawdziwe breakpointy)"
            class="touch-manipulation"
            @click="toggleViewportMobile"
          >
            Mobile (iframe)
          </UButton>
          <UButton
            color="neutral"
            :variant="viewportMode === 'desktop' ? 'solid' : 'outline'"
            size="xs"
            icon="i-lucide-monitor"
            title="Podgląd Desktop w iframe (na telefonie skaluje się do ekranu)"
            class="touch-manipulation"
            @click="toggleViewportDesktop"
          >
            Desktop (iframe)
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-ruler"
            title="Szerokość podglądu mobilnego (cyklicznie)"
            class="touch-manipulation"
            @click="() => {
              const cur = String(mobilePreviewWidth)
              const next = cur === '375px'
                ? '390px'
                : cur === '390px'
                  ? '414px'
                  : '375px'
              mobilePreviewWidth = next
              toast.add({ title: `Podgląd mobilny: ${next}`, color: 'info' })
            }"
          >
            {{ mobilePreviewWidth }}
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-ruler"
            title="Szerokość iframe (cyklicznie)"
            class="touch-manipulation"
            @click="cycleViewportWidth"
          >
            iframe {{ viewportWidth }}px
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-git-branch" title="Zapisz ścieżkę do logów" class="touch-manipulation" @click="logRouteSummary">
            URL → log
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-maximize-2" title="viewport + DPR" class="touch-manipulation" @click="copyViewportString">
            Viewport
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-cpu" title="performance.memory (Chrome)" class="touch-manipulation" @click="copyMemoryHint">
            Heap
          </UButton>
        </div>
        <div class="mt-3 rounded-lg border border-default/60 bg-muted/10 p-2">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-muted">
            User-Agent
          </p>
          <pre class="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all text-[10px] text-highlighted">{{ userAgentDisplay || '—' }}</pre>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Konserwacja czatu
            </p>
            <p class="mt-1 text-[11px] leading-snug text-muted">
              Ręczne wymuszenie czyszczenia bezczynnych wątków. Domyślnie usuwane są wątki bez wiadomości od 30 dni — pole „dni" pozwala wymusić agresywniejszy próg (1–365).
            </p>
          </div>
          <div class="flex flex-wrap items-end gap-2">
            <UFormField label="Dni bezczynności" size="xs" class="w-32">
              <UInput
                v-model.number="chatPruneDays"
                type="number"
                :min="1"
                :max="365"
                size="sm"
                placeholder="30"
              />
            </UFormField>
            <UButton
              icon="i-lucide-broom"
              size="sm"
              variant="soft"
              color="warning"
              :loading="chatPruneRunning"
              @click="runChatPrune()"
            >
              Wyczyść nieaktywne wątki
            </UButton>
          </div>
        </div>
        <p
          v-if="chatPruneLastResult"
          class="mt-3 rounded-lg border border-default/40 bg-muted/10 px-3 py-2 text-[11px] font-mono text-muted"
        >
          Ostatni przebieg: usunięto <strong class="font-bold text-highlighted">{{ chatPruneLastResult.deleted }}</strong> wątków
          (próg: {{ chatPruneLastResult.inactivity_days }} dni · {{ chatPruneLastResult.at }}).
        </p>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Mapa aplikacji
      </p>
      <p class="mt-1 text-[11px] text-muted">
        Mapa tras jest budowana z <span class="font-mono">router.getRoutes()</span> (w tym dynamiczne <span class="font-mono">:param</span>). Poniżej ewentualne kotwice oraz dokumentacja zewnętrzna — uzupełniaj ręcznie tylko wpisy, których router nie wystawia.
      </p>
        <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <div
          v-for="group in devLinkGroupsCombined"
          :key="group.title"
          class="rounded-xl border border-default/40 bg-muted/5 p-3"
        >
          <h2 class="text-sm font-bold text-highlighted">
            {{ group.title }}
          </h2>
          <p
            v-if="group.description"
            class="mt-0.5 text-[11px] leading-snug text-muted"
          >
            {{ group.description }}
          </p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <UButton
              v-for="link in group.links"
              :key="`${group.title}-${link.label}`"
              :to="link.to"
              variant="outline"
              color="neutral"
              size="sm"
              class="h-auto min-h-12 flex-col items-start gap-0.5 py-2 whitespace-normal text-left overflow-hidden"
              :target="isExternalHref(link.to) ? '_blank' : undefined"
              :rel="isExternalHref(link.to) ? 'noopener noreferrer' : undefined"
            >
              <span class="flex w-full items-center gap-2 font-semibold text-highlighted">
                <UIcon
                  :name="link.icon"
                  class="size-4 shrink-0 text-primary"
                />
                <span class="min-w-0 flex-1 break-all">
                  {{ routeChipLabel(link.label || link.to) }}
                </span>
              </span>
              <span class="w-full wrap-break-word text-[11px] font-normal leading-snug text-muted">
                {{ link.description }}
              </span>
            </UButton>
          </div>
        </div>
      </div>
      </UCard>

      <section id="ops-integrations" class="space-y-4 lg:col-span-12">
        <div class="flex items-center gap-3 px-1">
          <UIcon name="i-lucide-plug" class="size-6 text-primary" />
          <h2 class="text-xl font-black uppercase italic tracking-tight text-highlighted">
            Integracje i jakość danych
          </h2>
        </div>
        <UCard class="rounded-2xl border-default/60 p-4 shadow-sm space-y-4">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">QR check-in (WWW)</p>
            <p class="mt-1 text-sm text-muted">
              Flaga <code>attendance_qr_checkin</code> — skaner zawodnika: <NuxtLink to="/athlete/obecnosc-qr" class="text-primary underline">/athlete/obecnosc-qr</NuxtLink>,
              kadra: <NuxtLink to="/attendance" class="text-primary underline">/attendance</NuxtLink>.
            </p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Upload Cloudinary</p>
            <p class="mt-1 text-sm text-muted">
              Multipart: pole <code>file</code> (+ opcjonalnie <code>purpose</code>: avatar | athletes | gallery | blog).
              Limit body na backendzie: 45 MB. Klient nie ustawia <code>Content-Type</code> dla FormData.
            </p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Duplikaty (409)</p>
            <ul class="mt-1 list-disc ps-4 text-sm text-muted space-y-1">
              <li>Składki: ten sam miesiąc Pending / Approved</li>
              <li>Wyniki: Pending z tą samą datą i totalem (zawodnik)</li>
              <li>Obecności: ten sam dzień (zawodnik / QR już verified)</li>
            </ul>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Slavia-cms (GitHub)</p>
            <p class="mt-1 text-sm text-muted">
              <code>NUXT_PUBLIC_CMS_BASE_URL</code>:
              <span class="font-mono">{{ config.public.cmsBaseUrl || '— nie ustawiono —' }}</span>
              <UBadge class="ml-2" size="xs" :color="cmsBaseConfigured ? 'success' : 'warning'" variant="subtle">
                {{ cmsBaseConfigured ? 'skonfigurowane' : 'brak' }}
              </UBadge>
            </p>
            <ul class="mt-2 list-disc ps-4 text-xs text-muted space-y-1">
              <li><code>GITHUB_TOKEN</code> (PAT) — scope <code>repo</code> do prywatnego <code>JakubGawron1/Slavia-cms</code></li>
              <li>Struktura repo: <code>gallery/</code>, <code>media/</code> — ścieżki względne w DB galerii</li>
              <li>Deploy key / GitHub App — alternatywa dla CI uploadu bez PAT w runtime frontendu</li>
            </ul>
          </div>
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Feature adoption (30 dni)</p>
              <UButton size="xs" variant="soft" icon="i-lucide-refresh-cw" :loading="featureAdoptionLoading" @click="refreshFeatureAdoption">
                Odśwież
              </UButton>
            </div>
            <div class="mt-2 max-h-48 overflow-auto rounded-xl border border-default/50">
              <table class="w-full text-xs">
                <thead class="bg-muted/20">
                  <tr>
                    <th class="px-2 py-1 text-left">Moduł</th>
                    <th class="px-2 py-1 text-right">Użytk.</th>
                    <th class="px-2 py-1 text-right">Zdarz.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in featureAdoptionRows.slice(0, 20)" :key="row.module_key" class="border-t border-default/40">
                    <td class="px-2 py-1">{{ row.label }}</td>
                    <td class="px-2 py-1 text-right font-mono">{{ row.unique_users_30d }}</td>
                    <td class="px-2 py-1 text-right font-mono">{{ row.events_30d }}</td>
                  </tr>
                  <tr v-if="!featureAdoptionRows.length">
                    <td colspan="3" class="px-2 py-4 text-center text-muted">Brak danych audytu (30 dni).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Sentry / monitoring (ideas #200)</p>
            <p class="mt-1 text-xs text-muted">
              Produkcyjnie: <code>NUXT_PUBLIC_SENTRY_DSN</code>, <code>SENTRY_AUTH_TOKEN</code> w CI — integracja SDK opcjonalna w kolejnej iteracji.
            </p>
          </div>
        </UCard>
      </section>

      <section id="perf-audit" class="space-y-4">
        <div class="flex items-center gap-3 px-1">
          <UIcon name="i-lucide-gauge" class="size-6 text-primary" />
          <h2 class="text-xl font-black uppercase italic tracking-tight text-highlighted">
            Wydajność i SEO (Audit)
          </h2>
        </div>
        <UCard class="rounded-2xl border-default/60 bg-muted/5 shadow-sm">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-3">
              <p class="text-sm font-medium text-muted">PageSpeed Insights (PSI)</p>
              <div class="flex flex-col gap-2">
                <UButton
                  block
                  variant="soft"
                  color="neutral"
                  icon="i-lucide-external-link"
                  :to="`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(config.public.siteUrl || '')}`"
                  target="_blank"
                >
                  Audyt Strony Głównej
                </UButton>
                <UButton
                  block
                  variant="soft"
                  color="neutral"
                  icon="i-lucide-external-link"
                  :to="`https://pagespeed.web.dev/analysis?url=${encodeURIComponent((config.public.siteUrl || '') + '/logowanie')}`"
                  target="_blank"
                >
                  Audyt Panelu Logowania
                </UButton>
              </div>
            </div>
            <div class="rounded-xl border border-default/50 bg-muted/10 p-4 space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-widest text-primary mb-2">Wskazówki CWV (#31)</h3>
              <ul class="list-disc ps-4 text-xs space-y-1 text-muted">
                <li>Używaj <code>loading="lazy"</code> dla obrazów pod linią zgięcia.</li>
                <li>Optymalizuj formaty (WebP/AVIF) i wymiary obrazów.</li>
                <li>Unikaj Layout Shift (CLS) — rezerwuj miejsce na obrazy i reklamy.</li>
                <li>ISR/SWR na trasach publicznych znacząco poprawia TTFB.</li>
              </ul>
              <h3 class="text-xs font-bold uppercase tracking-widest text-primary">Audyt routeRules (#29)</h3>
              <ul class="list-disc ps-4 text-xs space-y-1 text-muted">
                <li>Strefy <code>/athlete/**</code>, <code>/trainer/**</code>, <code>/admin/**</code> — <code>private, no-store</code>.</li>
                <li>Publiczne ISR: <code>/</code>, <code>/aktualnosci</code>, <code>/galeria</code>, <code>/zawodnicy</code>.</li>
                <li>Nowe trasy chronione: dodaj regułę w <code>nuxt.config.ts</code> przed merge.</li>
                <li>Trasy panelu: <code>robots: noindex</code> w <code>useSeoMeta</code>.</li>
              </ul>
            </div>
          </div>
        </UCard>
      </section>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Logi (localStorage)
          </p>
          <p class="mt-0.5 font-mono text-[10px] text-muted">
            {{ buildMeta }}
          </p>
        </div>
        <div class="flex flex-wrap gap-1">
          <UButton size="xs" variant="soft" @click="systemLogs.demoPush('change')">
            +zm
          </UButton>
          <UButton size="xs" variant="soft" @click="systemLogs.demoPush('info')">
            +info
          </UButton>
          <UButton size="xs" variant="soft" color="warning" @click="systemLogs.demoPush('warn')">
            +warn
          </UButton>
          <UButton size="xs" variant="soft" color="error" @click="systemLogs.demoPush('error')">
            +err
          </UButton>
          <UButton size="xs" variant="outline" icon="i-lucide-download" @click="downloadLogsExport">
            Export
          </UButton>
          <UButton size="xs" color="error" variant="ghost" @click="systemLogs.clear">
            Clear
          </UButton>
        </div>
      </div>

      <div class="mt-3 max-h-[min(360px,48vh)] overflow-auto rounded-xl border border-default/60 bg-muted/10">
        <div
          v-for="entry in systemLogRows"
          :key="entry.id"
          class="border-b border-default/45 px-3 py-2 font-mono text-[10px] last:border-b-0"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted">{{ formatLogTs(entry.ts) }}</span>
            <UBadge size="xs" variant="subtle" :color="logLevelColor(entry.level)">
              {{ entry.level }}
            </UBadge>
          </div>
          <p class="mt-1 font-sans text-xs font-semibold text-highlighted">
            {{ entry.title }}
          </p>
          <p
            v-if="entry.detail"
            class="mt-0.5 font-sans text-[11px] leading-relaxed text-muted"
          >
            {{ entry.detail }}
          </p>
        </div>
        <p
          v-if="systemLogRows.length === 0"
          class="px-3 py-6 text-center text-xs text-muted"
        >
          Brak wpisów.
        </p>
      </div>
      </UCard>

      <UCard v-if="expDevBanPanel" class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Banowanie kont (dev)
          </p>
          <UBadge size="xs" variant="subtle" color="neutral">
            /api/admins/:id/(un)ban
          </UBadge>
        </div>
        <p class="mt-1 text-[11px] leading-snug text-muted">
          Szybka akcja do smoke testu — w panelu kont masz już przyciski „Banuj / Odbanuj”.
        </p>

        <div class="mt-3 space-y-3">
          <UFormField label="Konto (z listy)">
            <USelect
              v-model="banUserSelected"
              :items="banUserOptions"
              value-key="value"
              size="lg"
              class="w-full rounded-xl"
            />
          </UFormField>
          <UFormField label="user_id (UUID)">
            <UInput v-model="banUserId" placeholder="np. 2e0b...-..." class="w-full rounded-xl" />
          </UFormField>
          <UFormField label="Powód (opcjonalnie)">
            <UTextarea v-model="banReason" :rows="3" placeholder="np. Brak składek" class="w-full rounded-xl" />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <UButton color="warning" class="rounded-xl font-bold" :loading="banPending" @click="devBanUser">
              Zbanuj
            </UButton>
            <UButton color="success" variant="soft" class="rounded-xl font-bold" :loading="banPending" @click="devUnbanUser">
              Odbanuj
            </UButton>
          </div>
        </div>
      </UCard>
    </section>
  </PanelPageLayout>
</template>

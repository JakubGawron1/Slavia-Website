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
  useSlaviaAppearance
} from '~/composables/useSlaviaAppearance'
import type { SlaviaThemePreset } from '~/composables/useSlaviaCatalogs'
import { getApiDetailedErrorMessage, getApiErrorMessage } from '~/composables/useApi'
import { apiRoutes } from '~/config/api'
import type { CompetitionResult } from '~/types/models'
import {
  backendProviderLabel,
  isBackendProviderDeprecated,
  isBackendProviderId,
  type BackendProviderId
} from '~/utils/backendProviderTypes'

import type { DeveloperPageContext } from '~/composables/developer/types'
import { buildAutoRouteGroups, routeChipLabel } from '~/composables/developer/routeMapUtils'
export type { DeveloperPageContext }

export const DEVELOPER_PAGE_KEY: InjectionKey<DeveloperPageContext> = Symbol('developer-page')

export async function setupDeveloperPage() {
const auth = useAuth()
const { accountSettingsPath } = useRoleDashboardNav()
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
  return themePresets.value.find(p => p.id === id)
})

const domDataPresetAttr = ref<string | null>(null)

const {
  banUserId,
  banUserOptions,
  banUserSelected,
  banReason,
  banPending,
  refreshBanUsersCatalog,
  devBanUser,
  devUnbanUser
} = useDeveloperBanPanel()

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

type GithubMediaStatusDto = {
  repo: string
  branch: string
  media_root: string
  token_configured: boolean
  upload_ready: boolean
  public_base_url_hint: string
  last_upload_at?: string | null
  last_upload_path?: string | null
}

const githubMediaStatus = ref<GithubMediaStatusDto | null>(null)
const githubMediaStatusLoading = ref(false)

type AiPublicStatusDto = {
  enabled: boolean
  model: string
  message?: string
}

type AiCoachStatusDto = {
  configured: boolean
  model: string
  key_format_ok?: boolean
  setup_hint?: string | null
}

const aiPublicStatus = ref<AiPublicStatusDto | null>(null)
const aiPublicStatusLoading = ref(false)
const aiCoachStatus = ref<AiCoachStatusDto | null>(null)
const aiCoachStatusLoading = ref(false)

async function refreshAiPublicStatus() {
  aiPublicStatusLoading.value = true
  const { backendUrl } = useBackendDirectUrl()
  try {
    aiPublicStatus.value = await $fetch<AiPublicStatusDto>(backendUrl(apiRoutes.aiCoach.publicStatus), {
      timeout: 12_000
    })
  } catch (e) {
    aiPublicStatus.value = {
      enabled: false,
      model: '',
      message: getApiErrorMessage(e, 'GET /api/ai/coach/public/status niedostępny')
    }
  } finally {
    aiPublicStatusLoading.value = false
  }
}

async function refreshAiCoachStatus() {
  aiCoachStatusLoading.value = true
  try {
    aiCoachStatus.value = await apiFetch<AiCoachStatusDto>(apiRoutes.aiCoach.status)
  } catch (e) {
    aiCoachStatus.value = {
      configured: false,
      model: 'llama-3.1-70b-versatile',
      setup_hint: getApiErrorMessage(e, 'GET /api/ai/coach/status niedostępny')
    }
  } finally {
    aiCoachStatusLoading.value = false
  }
}

async function refreshGithubMediaStatus() {
  githubMediaStatusLoading.value = true
  try {
    githubMediaStatus.value = await apiFetch<GithubMediaStatusDto>(apiRoutes.system.cmsStatus)
  } catch (e) {
    githubMediaStatus.value = null
    toast.add({ title: 'Status mediów (GitHub)', description: getApiErrorMessage(e), color: 'warning' })
  } finally {
    githubMediaStatusLoading.value = false
  }
}

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

const autoRouteGroups = computed(() => buildAutoRouteGroups(router))

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

const apiPingMs = ref<number | null>(null)
const backendProviderSaving = ref(false)
const backendProviderServerUpdatedAt = ref<string | null>(null)
const selectedBackendProvider = ref<BackendProviderId>(backendProvider.activeProvider.value)
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
  void refreshGithubMediaStatus()
  void refreshFeatureAdoption()
  void refreshAiPublicStatus()
  void refreshAiCoachStatus()
  void $fetch<{ active_provider: BackendProviderId, updated_at?: string | null }>('/api/system/backend-provider', {
    headers: auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : undefined
  })
    .then((res) => {
      if (isBackendProviderId(res.active_provider)) {
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
    const res = await $fetch<{ active_provider: BackendProviderId, updated_at?: string | null }>('/api/system/backend-provider', {
      headers: auth.token.value ? { Authorization: `Bearer ${auth.token.value}` } : undefined
    })
    if (isBackendProviderId(res.active_provider)) {
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
    const res = await $fetch<{ active_provider: BackendProviderId, updated_at?: string | null }>('/api/system/backend-provider', {
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
      title: `Ustawiono backend: ${backendProviderLabel(res.active_provider)}`,
      description: isBackendProviderDeprecated(res.active_provider)
        ? `Render jest deprecated — rozważ Hugging Face. URL: ${backendProvider.activeApiBase.value}`
        : `Aktywny URL backendu: ${backendProvider.activeApiBase.value}`,
      color: isBackendProviderDeprecated(res.active_provider) ? 'warning' : 'success'
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
  const ctx = reactive({
    auth,
    accountSettingsPath,
    backendProvider,
    apiFetch,
    toast,
    experimental,
    expDevBanPanel,
    themePreset,
    themePresets,
    setThemePreset,
    themeColorMode,
    hydrateThemeAppearance,
    activePresetMeta,
    domDataPresetAttr,
    banUserId,
    banUserOptions,
    banUserSelected,
    banReason,
    banPending,
    refreshBanUsersCatalog,
    devBanUser,
    devUnbanUser,
    chatPruneDays,
    chatPruneRunning,
    chatPruneLastResult,
    runChatPrune,
    refreshDomPresetAttr,
    copyThemeDiagnosticsJson,
    clearLocalAppearanceMirror,
    devSetColorMode,
    devQuickSetPreset,
    resetExperimentalDefaults,
    experimentalResolved,
    experimentalKillDeploy,
    experimentalVisibleDefs,
    experimentalStableDefs,
    setExperimentalFlag,
    isExperimentalLocked,
    config,
    featureAdoptionRows,
    featureAdoptionLoading,
    cmsBaseConfigured,
    githubMediaStatus,
    githubMediaStatusLoading,
    refreshGithubMediaStatus,
    aiPublicStatus,
    aiPublicStatusLoading,
    refreshAiPublicStatus,
    aiCoachStatus,
    aiCoachStatusLoading,
    refreshAiCoachStatus,
    refreshFeatureAdoption,
    enabled,
    permission,
    supported,
    requestPermission,
    setEnabled,
    notify,
    userAgentDisplay,
    systemLogs,
    systemLogRows,
    buildMeta,
    devLinkGroupsCombined,
    routeChipLabel,
    apiPingMs,
    backendProviderSaving,
    backendProviderServerUpdatedAt,
    selectedBackendProvider,
    activeBackendProvider,
    activeBackendApiBase,
    isLocalBackend,
    isExternalHref,
    formatLogTs,
    logLevelColor,
    downloadLogsExport,
    toggleReducedMotionDev,
    mobilePreviewOn,
    mobilePreviewWidth,
    viewportMode,
    viewportWidth,
    toggleMobilePreview,
    toggleViewportMobile,
    toggleViewportDesktop,
    cycleViewportWidth,
    logRouteSummary,
    status,
    refreshDeveloperStatus,
    developerStatusPending,
    sendTestNotification,
    copyToClipboard,
    copyCurrentUrl,
    copySiteUrl,
    copyApiBase,
    hardReload,
    clearWebStorage,
    unregisterServiceWorkers,
    copyEnvDumpJson,
    copyNavigatorSummary,
    copyLocalStorageKeys,
    copyViewportString,
    copyAuthBearerToken,
    copyMemoryHint,
    pingApiLatency,
    refreshBackendProviderSetting,
    saveBackendProviderSetting,
    clearBrowserCachesApi,
    clearIndexedDbDatabases,
    logOnlineStatus,
    testLocalStorageRoundtrip,
    testSessionStorageRoundtrip,
    runApiSmokeTests,
    logMediaAndUiCaps,
    logScreenGeometry,
    toggleFullscreenDev,
    toastStorageApisAvailability
  }) as DeveloperPageContext

  return ctx
}

export function useDeveloperPage(): DeveloperPageContext {
  const ctx = inject(DEVELOPER_PAGE_KEY)
  if (!ctx) {
    throw new Error('useDeveloperPage() wymaga setupDeveloperPage() na stronie /superadmin/developer')
  }
  return ctx
}

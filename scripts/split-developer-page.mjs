import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const path = join(root, 'app/pages/superadmin/developer.vue')
const lines = readFileSync(path, 'utf8').split(/\r?\n/)

const scriptStart = lines.findIndex(l => l.includes('<script setup'))
const scriptEnd = lines.findIndex(l => l === '</script>')
const templateStart = lines.findIndex(l => l === '<template>')
const templateEnd = lines.findIndex((l, i) => i > templateStart && l === '</template>')

const scriptBody = lines.slice(scriptStart + 1, scriptEnd).join('\n').trim()
const templateLines = lines.slice(templateStart + 1, templateEnd)

const MARKER_RE = /<!--\s*dev-section:(\w+)\s*-->/

function findSectionRanges(lines) {
  const markers = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(MARKER_RE)
    if (m) markers.push({ name: m[1], line: i + 1 })
  }
  if (markers.length >= 2) {
    return markers.map((m, idx) => {
      const next = markers[idx + 1]
      return [m.name, m.line, next ? next.line - 1 : lines.length]
    })
  }
  return [
    ['Overview', 1198, 1327],
    ['Tools', 1329, 1851],
    ['Map', 1853, 1906],
    ['Ops', 1908, 2085]
  ]
}

const sectionRanges = findSectionRanges(lines)

const sectionsDir = join(root, 'app/components/dev/sections')
mkdirSync(sectionsDir, { recursive: true })

for (const [name, startLine, endLine] of sectionRanges) {
  let chunk = templateLines.slice(startLine - templateStart, endLine - templateStart).join('\n').trim()
  chunk = chunk.replace(MARKER_RE, '').trim()
  chunk = chunk.replace(
    /^ {2}<div v-show="devSection === '[^']+'" class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">/,
    '<div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">'
  )
  chunk = chunk.replace(/\n {2}<\/div>\s*$/, '')
  const comp = `<script setup lang="ts">
const d = useDeveloperPage()
</script>

<template>
${chunk}
</template>
`
  writeFileSync(join(sectionsDir, `Developer${name}Section.vue`), comp)
}

let body = scriptBody
  .replace(/^import[\s\S]*?(?=^const auth)/m, '')
  .replace(/^definePageMeta\([\s\S]*?\)\s*$/m, '')
  .replace(/^useSeoMeta\([\s\S]*?\)\s*$/m, '')

const composableHeader = `import { format } from 'date-fns'
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
import type { CompetitionResult } from '~/types/models'

export const DEVELOPER_PAGE_KEY: InjectionKey<Record<string, unknown>> = Symbol('developer-page')

export async function setupDeveloperPage() {
`

const composableFooter = `
  const ctx = {
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
  }

  provide(DEVELOPER_PAGE_KEY, ctx)
  return ctx
}

export function useDeveloperPage() {
  const ctx = inject(DEVELOPER_PAGE_KEY)
  if (!ctx) {
    throw new Error('useDeveloperPage() wymaga setupDeveloperPage() na stronie /superadmin/developer')
  }
  return ctx
}
`

writeFileSync(join(root, 'app/composables/useDeveloperPage.ts'), composableHeader + body + composableFooter)
console.log('OK: split developer page')

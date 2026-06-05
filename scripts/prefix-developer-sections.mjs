import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const keys = [
  'accountSettingsPath', 'activeBackendApiBase', 'activeBackendProvider', 'activePresetMeta',
  'apiPingMs', 'auth', 'backendProvider', 'backendProviderSaving', 'backendProviderServerUpdatedAt',
  'banPending', 'banReason', 'banUserId', 'banUserOptions', 'banUserSelected', 'buildMeta',
  'chatPruneDays', 'chatPruneLastResult', 'chatPruneRunning', 'cmsBaseConfigured', 'config',
  'developerStatusPending', 'domDataPresetAttr', 'enabled', 'expDevBanPanel',
  'experimentalKillDeploy', 'experimentalResolved', 'experimentalStableDefs', 'experimentalVisibleDefs',
  'featureAdoptionLoading', 'featureAdoptionRows', 'githubMediaStatus', 'githubMediaStatusLoading',
  'isExternalHref', 'isLocalBackend', 'mobilePreviewOn', 'mobilePreviewWidth', 'permission',
  'routeChipLabel', 'selectedBackendProvider', 'status', 'supported', 'systemLogRows', 'systemLogs',
  'themeColorMode', 'themePreset', 'themePresets', 'userAgentDisplay', 'viewportMode', 'viewportWidth',
  'devLinkGroupsCombined',
  'clearBrowserCachesApi', 'clearIndexedDbDatabases', 'clearLocalAppearanceMirror', 'clearWebStorage',
  'copyApiBase', 'copyAuthBearerToken', 'copyCurrentUrl', 'copyEnvDumpJson', 'copyLocalStorageKeys',
  'copyMemoryHint', 'copyNavigatorSummary', 'copySiteUrl', 'copyThemeDiagnosticsJson', 'copyToClipboard',
  'copyViewportString', 'cycleViewportWidth', 'devBanUser', 'devQuickSetPreset', 'devSetColorMode',
  'devUnbanUser', 'downloadLogsExport', 'formatLogTs', 'hardReload', 'hydrateThemeAppearance',
  'isExperimentalLocked', 'logLevelColor', 'logMediaAndUiCaps', 'logOnlineStatus', 'logRouteSummary',
  'logScreenGeometry', 'pingApiLatency', 'refreshBackendProviderSetting', 'refreshBanUsersCatalog',
  'refreshDeveloperStatus', 'refreshDomPresetAttr', 'refreshFeatureAdoption', 'refreshGithubMediaStatus',
  'requestPermission', 'resetExperimentalDefaults', 'runApiSmokeTests', 'runChatPrune',
  'saveBackendProviderSetting', 'sendTestNotification', 'setEnabled', 'setExperimentalFlag',
  'setThemePreset', 'testLocalStorageRoundtrip', 'testSessionStorageRoundtrip', 'toastStorageApisAvailability',
  'toggleFullscreenDev', 'toggleMobilePreview', 'toggleReducedMotionDev', 'toggleViewportDesktop',
  'toggleViewportMobile', 'unregisterServiceWorkers'
].sort((a, b) => b.length - a.length)

const dir = join(root, 'app/components/dev/sections')
for (const file of readdirSync(dir)) {
  if (!file.endsWith('.vue')) continue
  let content = readFileSync(join(dir, file), 'utf8')
  const parts = content.split('<template>')
  if (parts.length !== 2) continue
  let template = parts[1]
  for (const key of keys) {
    template = template.replace(new RegExp(`(?<!d\\.)\\b${key}\\b`, 'g'), `d.${key}`)
  }
  // fix double prefix
  template = template.replace(/d\.d\./g, 'd.')
  writeFileSync(join(dir, file), parts[0] + '<template>' + template)
  console.log('prefixed', file)
}

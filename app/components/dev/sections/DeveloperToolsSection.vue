<script setup lang="ts">
import type { DevToolActionGroup } from '~/components/dev/DevToolActionGrid.vue'

const d = useDeveloperPage()

const toolGroups = computed<DevToolActionGroup[]>(() => [
  {
    id: 'api',
    title: 'API i sieć',
    description: 'Smoke testy, ping i status połączenia — wyniki trafiają do logów lokalnych.',
    actions: [
      { id: 'smoke', label: 'Smoke API', icon: 'i-lucide-zap', onClick: () => d.runApiSmokeTests() },
      { id: 'ping', label: 'Ping', icon: 'i-lucide-wifi', onClick: () => d.pingApiLatency() },
      { id: 'online', label: 'onLine', icon: 'i-lucide-activity', onClick: () => d.logOnlineStatus() },
      { id: 'notify', label: 'Test notify', icon: 'i-lucide-bell', color: 'primary', onClick: () => d.sendTestNotification() }
    ]
  },
  {
    id: 'clipboard',
    title: 'Schowek',
    description: 'Diagnostyka bez wrażliwych sekretów serwera (token Bearer — uwaga).',
    actions: [
      { id: 'env', label: 'Env JSON', icon: 'i-lucide-braces', onClick: () => d.copyEnvDumpJson() },
      { id: 'build', label: 'Build JSON', icon: 'i-lucide-package', onClick: () => d.copyBuildInfoJson() },
      { id: 'nav', label: 'Navigator', icon: 'i-lucide-navigation', onClick: () => d.copyNavigatorSummary() },
      { id: 'ls-keys', label: 'Klucze LS', icon: 'i-lucide-list-tree', onClick: () => d.copyLocalStorageKeys() },
      { id: 'url', label: 'URL', icon: 'i-lucide-link', onClick: () => d.copyCurrentUrl() },
      { id: 'site', label: 'siteUrl', icon: 'i-lucide-globe', onClick: () => d.copySiteUrl() },
      { id: 'api-base', label: 'API base', icon: 'i-lucide-server', onClick: () => d.copyApiBase() },
      { id: 'token', label: 'Bearer', icon: 'i-lucide-key-round', color: 'warning', onClick: () => d.copyAuthBearerToken() },
      { id: 'viewport', label: 'Viewport', icon: 'i-lucide-maximize-2', onClick: () => d.copyViewportString() },
      { id: 'heap', label: 'Heap', icon: 'i-lucide-cpu', onClick: () => d.copyMemoryHint() }
    ]
  },
  {
    id: 'storage',
    title: 'Pamięć przeglądarki',
    description: 'Testy roundtrip i czyszczenie cache — może wylogować sesję.',
    actions: [
      { id: 'ls-test', label: 'Test LS', icon: 'i-lucide-database', onClick: () => d.testLocalStorageRoundtrip() },
      { id: 'ss-test', label: 'Test SS', icon: 'i-lucide-layers', onClick: () => d.testSessionStorageRoundtrip() },
      { id: 'clear-ls', label: 'Wyczyść LS', icon: 'i-lucide-trash-2', color: 'warning', variant: 'soft', onClick: () => d.clearWebStorage() },
      { id: 'clear-idb', label: 'Wyczyść IDB', icon: 'i-lucide-database-zap', color: 'warning', variant: 'soft', onClick: () => d.clearIndexedDbDatabases() },
      { id: 'clear-cache', label: 'Cache API', icon: 'i-lucide-hard-drive', color: 'warning', variant: 'soft', onClick: () => d.clearBrowserCachesApi() },
      { id: 'unregister-sw', label: 'Wyrej. SW', icon: 'i-lucide-rotate-ccw', color: 'warning', variant: 'soft', onClick: () => d.unregisterServiceWorkers() }
    ]
  },
  {
    id: 'viewport',
    title: 'Podgląd responsywny',
    description: 'Iframe daje prawdziwe breakpointy; ramka CSS jest lżejsza, ale bez osobnego viewportu.',
    actions: [
      {
        id: 'iframe-mobile',
        label: 'Mobile iframe',
        icon: 'i-lucide-smartphone',
        active: d.viewportMode === 'mobile',
        onClick: () => d.toggleViewportMobile()
      },
      {
        id: 'iframe-desktop',
        label: 'Desktop iframe',
        icon: 'i-lucide-monitor',
        active: d.viewportMode === 'desktop',
        onClick: () => d.toggleViewportDesktop()
      },
      {
        id: 'iframe-width',
        label: `${d.viewportWidth}px`,
        icon: 'i-lucide-ruler',
        title: 'Szerokość iframe (cyklicznie)',
        onClick: () => d.cycleViewportWidth()
      },
      {
        id: 'css-mobile',
        label: 'Ramka CSS',
        icon: 'i-lucide-frame',
        active: d.mobilePreviewOn,
        onClick: () => d.toggleMobilePreview()
      },
      {
        id: 'css-width',
        label: d.mobilePreviewWidth,
        icon: 'i-lucide-ruler',
        title: 'Szerokość ramki CSS',
        onClick: () => {
          const cur = String(d.mobilePreviewWidth)
          const next = cur === '375px' ? '390px' : cur === '390px' ? '414px' : '375px'
          d.mobilePreviewWidth = next
          d.toast.add({ title: `Ramka CSS: ${next}`, color: 'info' })
        }
      },
      { id: 'reduced', label: 'Red. motion', icon: 'i-lucide-accessibility', onClick: () => d.toggleReducedMotionDev() },
      { id: 'fullscreen', label: 'Fullscreen', icon: 'i-lucide-maximize', onClick: () => d.toggleFullscreenDev() }
    ]
  },
  {
    id: 'ui-diag',
    title: 'Diagnostyka UI',
    description: 'Preferencje systemowe, geometria ekranu i dostępność API.',
    actions: [
      { id: 'motion-ui', label: 'Motion/UI', icon: 'i-lucide-contrast', onClick: () => d.logMediaAndUiCaps() },
      { id: 'screen', label: 'Ekran', icon: 'i-lucide-monitor', onClick: () => d.logScreenGeometry() },
      { id: 'apis', label: 'API przegl.', icon: 'i-lucide-package-search', onClick: () => d.toastStorageApisAvailability() },
      { id: 'route-log', label: 'URL → log', icon: 'i-lucide-git-branch', onClick: () => d.logRouteSummary() },
      { id: 'reload', label: 'Reload', icon: 'i-lucide-refresh-ccw', onClick: () => d.hardReload() }
    ]
  }
])
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Motyw i wygląd
          </p>
          <p class="text-[11px] text-muted">
            <span class="font-mono text-[10px]">data-slavia-preset</span>
            ·
            <NuxtLink class="font-medium text-primary underline-offset-2 hover:underline" :to="d.accountSettingsPath">
              Ustawienia konta
            </NuxtLink>
          </p>
        </div>
        <UButton
          variant="outline"
          color="neutral"
          size="xs"
          icon="i-lucide-refresh-cw"
          @click="d.hydrateThemeAppearance(); d.refreshDomPresetAttr()"
        >
          Hydracja
        </UButton>
      </div>

      <div class="mt-3 grid gap-3 lg:grid-cols-12 lg:items-start">
        <div class="rounded-lg border border-default/60 bg-muted/5 p-3 lg:col-span-3">
          <dl class="space-y-1 text-xs">
            <div class="flex justify-between gap-2">
              <dt class="text-muted">Preset</dt>
              <dd class="truncate font-semibold text-highlighted">{{ d.activePresetMeta?.label ?? d.themePreset }}</dd>
            </div>
            <div class="flex justify-between gap-2 font-mono text-[10px]">
              <dt class="text-muted">DOM</dt>
              <dd class="truncate text-right">{{ d.domDataPresetAttr ?? '—' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-muted">Tryb</dt>
              <dd class="capitalize">{{ d.themeColorMode.preference }}</dd>
            </div>
          </dl>
        </div>
        <div class="min-w-0 lg:col-span-9">
          <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
            <UButton
              v-for="p in d.themePresets"
              :key="p.id"
              size="xs"
              class="min-h-9 touch-manipulation justify-start truncate text-left"
              :color="d.themePreset === p.id ? 'primary' : 'neutral'"
              :variant="d.themePreset === p.id ? 'solid' : 'outline'"
              :title="p.description"
              @click="d.devQuickSetPreset(p.id)"
            >
              {{ p.label }}
            </UButton>
          </div>
        </div>
      </div>

      <div class="mt-3 flex flex-col gap-2 border-t border-default/45 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div class="flex flex-wrap gap-1">
          <span class="mr-1 self-center text-[10px] font-bold uppercase text-muted">Tryb</span>
          <UButton size="xs" color="neutral" :variant="d.themeColorMode.preference === 'light' ? 'solid' : 'outline'" @click="d.devSetColorMode('light')">Jasny</UButton>
          <UButton size="xs" color="neutral" :variant="d.themeColorMode.preference === 'dark' ? 'solid' : 'outline'" @click="d.devSetColorMode('dark')">Ciemny</UButton>
          <UButton size="xs" color="neutral" :variant="d.themeColorMode.preference === 'system' ? 'solid' : 'outline'" @click="d.devSetColorMode('system')">System</UButton>
        </div>
        <div class="flex flex-1 flex-wrap gap-1 sm:justify-end">
          <UButton variant="outline" color="neutral" size="xs" icon="i-lucide-clipboard-copy" @click="d.copyThemeDiagnosticsJson">JSON motywu</UButton>
          <UButton variant="outline" color="neutral" size="xs" icon="i-lucide-eraser" @click="d.clearLocalAppearanceMirror">Wyczyść mirror</UButton>
        </div>
      </div>
    </UCard>

    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Narzędzia debugowania
      </p>
      <p class="mt-1 text-[11px] text-muted">
        Sesja: <span class="font-semibold text-highlighted">{{ d.auth.user.value?.username ?? '—' }}</span>
        <span v-if="d.auth.rolesDisplayShort"> · {{ d.auth.rolesDisplayShort }}</span>
      </p>
      <DevToolActionGrid class="mt-3" :groups="toolGroups" />
      <div class="mt-3 rounded-lg border border-default/60 bg-muted/10 p-2">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-muted">User-Agent</p>
        <pre class="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all text-[10px] text-highlighted">{{ d.userAgentDisplay || '—' }}</pre>
      </div>
    </UCard>

    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Konserwacja czatu</p>
          <p class="mt-1 text-[11px] leading-snug text-muted">
            Ręczne czyszczenie bezczynnych wątków (domyślnie 30 dni; pole „dni": 1–365).
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <UFormField label="Dni bezczynności" size="xs" class="w-32">
            <UInput v-model.number="d.chatPruneDays" type="number" :min="1" :max="365" size="sm" placeholder="30" />
          </UFormField>
          <UButton icon="i-lucide-broom" size="sm" variant="soft" color="warning" :loading="d.chatPruneRunning" @click="d.runChatPrune()">
            Wyczyść wątki
          </UButton>
        </div>
      </div>
      <p v-if="d.chatPruneLastResult" class="mt-3 rounded-lg border border-default/40 bg-muted/10 px-3 py-2 text-[11px] font-mono text-muted">
        Ostatni przebieg: usunięto <strong>{{ d.chatPruneLastResult.deleted }}</strong> wątków
        (próg {{ d.chatPruneLastResult.inactivity_days }} dni · {{ d.chatPruneLastResult.at }}).
      </p>
    </UCard>

    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Logi lokalne</p>
          <p class="mt-0.5 font-mono text-[10px] text-muted">{{ d.buildMeta }}</p>
        </div>
        <div class="flex flex-wrap gap-1">
          <UButton size="xs" variant="outline" icon="i-lucide-download" @click="d.downloadLogsExport">Export JSON</UButton>
          <UButton size="xs" color="error" variant="ghost" @click="d.systemLogs.clear">Wyczyść</UButton>
        </div>
      </div>
      <div class="mt-3 max-h-[min(360px,48vh)] overflow-auto rounded-xl border border-default/60 bg-muted/10">
        <div v-for="entry in d.systemLogRows" :key="entry.id" class="border-b border-default/45 px-3 py-2 font-mono text-[10px] last:border-b-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted">{{ d.formatLogTs(entry.ts) }}</span>
            <UBadge size="xs" variant="subtle" :color="d.logLevelColor(entry.level)">{{ entry.level }}</UBadge>
          </div>
          <p class="mt-1 font-sans text-xs font-semibold text-highlighted">{{ entry.title }}</p>
          <p v-if="entry.detail" class="mt-0.5 font-sans text-[11px] leading-relaxed text-muted">{{ entry.detail }}</p>
        </div>
        <p v-if="d.systemLogRows.length === 0" class="px-3 py-6 text-center text-xs text-muted">Brak wpisów — uruchom Smoke API lub Ping.</p>
      </div>
    </UCard>

    <UCard v-if="d.expDevBanPanel" class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Banowanie kont (smoke)</p>
        <UBadge size="xs" variant="subtle" color="neutral">/api/admins/:id/(un)ban</UBadge>
      </div>
      <div class="mt-3 grid gap-3 lg:grid-cols-2">
        <UFormField label="Konto (z listy)">
          <USelect v-model="d.banUserSelected" :items="d.banUserOptions" value-key="value" size="lg" class="w-full rounded-xl" />
        </UFormField>
        <UFormField label="user_id (UUID)">
          <UInput v-model="d.banUserId" placeholder="np. 2e0b...-..." class="w-full rounded-xl" />
        </UFormField>
        <UFormField label="Powód (opcjonalnie)" class="lg:col-span-2">
          <UTextarea v-model="d.banReason" :rows="2" placeholder="np. smoke test" class="w-full rounded-xl" />
        </UFormField>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <UButton color="warning" :loading="d.banPending" @click="d.devBanUser">Zbanuj</UButton>
        <UButton color="success" variant="soft" :loading="d.banPending" @click="d.devUnbanUser">Odbanuj</UButton>
      </div>
    </UCard>
  </div>
</template>

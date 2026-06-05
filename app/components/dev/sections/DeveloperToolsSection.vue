<script setup lang="ts">
const d = useDeveloperPage()
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
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
                :to="d.accountSettingsPath"
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
                d.hydrateThemeAppearance();
                d.refreshDomPresetAttr();
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
                  {{ d.activePresetMeta?.label ?? d.themePreset }}
                </dd>
              </div>
              <div class="flex justify-between gap-2 font-mono text-[10px]">
                <dt class="text-muted">
                  ID / DOM
                </dt>
                <dd class="truncate text-right">
                  {{ d.themePreset }} · {{ d.domDataPresetAttr ?? '—' }}
                </dd>
              </div>
              <div class="flex justify-between gap-2">
                <dt class="text-muted">
                  Tryb
                </dt>
                <dd class="capitalize">
                  {{ d.themeColorMode.preference }}
                </dd>
              </div>
              <template v-if="d.auth.user.value">
                <div class="border-t border-default/40 pt-1 font-mono text-[10px]">
                  <span class="text-muted">srv:</span>
                  {{ d.auth.user.value.ui_theme_preset ?? '—' }}
                  /
                  {{ d.auth.user.value.ui_color_mode ?? '—' }}
                </div>
              </template>
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
            <p
              v-if="d.activePresetMeta?.description"
              class="mt-2 line-clamp-2 text-[11px] leading-snug text-muted"
            >
              {{ d.activePresetMeta.description }}
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
              :variant="d.themeColorMode.preference === 'light' ? 'solid' : 'outline'"
              @click="d.devSetColorMode('light')"
            >
              Jasny
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="d.themeColorMode.preference === 'dark' ? 'solid' : 'outline'"
              @click="d.devSetColorMode('dark')"
            >
              Ciemny
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :variant="d.themeColorMode.preference === 'system' ? 'solid' : 'outline'"
              @click="d.devSetColorMode('system')"
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
              @click="d.copyThemeDiagnosticsJson"
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
              @click="d.clearLocalAppearanceMirror"
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
                @click="d.sendTestNotification"
              >
                Test notify
              </UButton>
            </div>
            <p class="rounded-lg border border-default/50 bg-muted/10 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-muted">
              obsługa: {{ d.supported ? 'tak' : 'nie' }} · upr.: {{ d.permission }} · sys.: {{ d.enabled ? 'tak' : 'nie' }}
            </p>

            <div class="border-t border-default/40 pt-3">
              <p class="mb-2 text-[10px] font-bold uppercase text-muted">
                API · storage · UI
              </p>
              <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-zap" class="touch-manipulation" @click="d.runApiSmokeTests">
                  <span class="truncate">Smoke API</span>
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-wifi" class="touch-manipulation" @click="d.pingApiLatency">
                  Ping
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-database" class="touch-manipulation" @click="d.testLocalStorageRoundtrip">
                  localStorage
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-layers" class="touch-manipulation" @click="d.testSessionStorageRoundtrip">
                  session
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-package-search" class="touch-manipulation" @click="d.toastStorageApisAvailability">
                  API przegl.
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-contrast" class="touch-manipulation" @click="d.logMediaAndUiCaps">
                  Motion/UI
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-monitor" class="touch-manipulation" @click="d.logScreenGeometry">
                  Ekran
                </UButton>
                <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-maximize" class="touch-manipulation" @click="d.toggleFullscreenDev">
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
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-braces" class="touch-manipulation" @click="d.copyEnvDumpJson">
                Env JSON
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-navigation" class="touch-manipulation" @click="d.copyNavigatorSummary">
                Navigator
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-list-tree" class="touch-manipulation" @click="d.copyLocalStorageKeys">
                Klucze LS
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-key-round" class="touch-manipulation" @click="d.copyAuthBearerToken">
                Token
              </UButton>
              <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-activity" class="touch-manipulation" @click="d.logOnlineStatus">
                onLine
              </UButton>
              <UButton color="primary" variant="soft" size="xs" icon="i-lucide-wifi" class="touch-manipulation" @click="d.pingApiLatency">
                Ping
              </UButton>
              <UButton color="warning" variant="soft" size="xs" icon="i-lucide-database-zap" class="touch-manipulation" @click="d.clearBrowserCachesApi">
                Cache API
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p class="text-sm text-muted">
            <span class="font-semibold text-highlighted">{{ d.auth.user.value?.username }}</span>
            <span v-if="d.auth.rolesDisplayShort" class="text-muted"> · {{ d.auth.rolesDisplayShort }}</span>
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
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-link" title="Pełny URL strony" class="touch-manipulation" @click="d.copyCurrentUrl">
            URL
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-globe" title="NUXT_PUBLIC_SITE_URL" class="touch-manipulation" @click="d.copySiteUrl">
            siteUrl
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-server" title="API base z runtime" class="touch-manipulation" @click="d.copyApiBase">
            API base
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-refresh-ccw" title="location.reload()" class="touch-manipulation" @click="d.hardReload">
            Reload
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-trash-2" title="Wyczyść localStorage i sessionStorage" class="touch-manipulation" @click="d.clearWebStorage">
            Wyczyść LS
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-database" title="Usuń bazy IndexedDB (Chrome/Edge)" class="touch-manipulation" @click="d.clearIndexedDbDatabases">
            Wyczyść IDB
          </UButton>
          <UButton color="warning" variant="soft" size="xs" icon="i-lucide-rotate-ccw" title="Wyrejestruj service workery" class="touch-manipulation" @click="d.unregisterServiceWorkers">
            Wyrej. SW
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-accessibility" title="Symulacja prefers-reduced-motion" class="touch-manipulation" @click="d.toggleReducedMotionDev">
            Red. motion
          </UButton>
          <UButton
            color="neutral"
            :variant="d.mobilePreviewOn ? 'solid' : 'outline'"
            size="xs"
            icon="i-lucide-smartphone"
            title="Podgląd mobilny (ramka + ograniczenie szerokości aplikacji)"
            class="touch-manipulation"
            @click="d.toggleMobilePreview"
          >
            Mobile
          </UButton>
          <UButton
            color="neutral"
            :variant="d.viewportMode === 'mobile' ? 'solid' : 'outline'"
            size="xs"
            icon="i-lucide-smartphone"
            title="Podgląd Mobile w iframe (prawdziwe breakpointy)"
            class="touch-manipulation"
            @click="d.toggleViewportMobile"
          >
            Mobile (iframe)
          </UButton>
          <UButton
            color="neutral"
            :variant="d.viewportMode === 'desktop' ? 'solid' : 'outline'"
            size="xs"
            icon="i-lucide-monitor"
            title="Podgląd Desktop w iframe (na telefonie skaluje się do ekranu)"
            class="touch-manipulation"
            @click="d.toggleViewportDesktop"
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
              const cur = String(d.mobilePreviewWidth)
              const next = cur === '375px'
                ? '390px'
                : cur === '390px'
                  ? '414px'
                  : '375px'
              d.mobilePreviewWidth = next
              d.toast.add({ title: `Podgląd mobilny: ${next}`, color: 'info' })
            }"
          >
            {{ d.mobilePreviewWidth }}
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-ruler"
            title="Szerokość iframe (cyklicznie)"
            class="touch-manipulation"
            @click="d.cycleViewportWidth"
          >
            iframe {{ d.viewportWidth }}px
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-git-branch" title="Zapisz ścieżkę do logów" class="touch-manipulation" @click="d.logRouteSummary">
            URL → log
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-maximize-2" title="viewport + DPR" class="touch-manipulation" @click="d.copyViewportString">
            Viewport
          </UButton>
          <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-cpu" title="performance.memory (Chrome)" class="touch-manipulation" @click="d.copyMemoryHint">
            Heap
          </UButton>
        </div>
        <div class="mt-3 rounded-lg border border-default/60 bg-muted/10 p-2">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-muted">
            User-Agent
          </p>
          <pre class="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-all text-[10px] text-highlighted">{{ d.userAgentDisplay || '—' }}</pre>
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
                v-model.number="d.chatPruneDays"
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
              :loading="d.chatPruneRunning"
              @click="d.runChatPrune()"
            >
              Wyczyść nieaktywne wątki
            </UButton>
          </div>
        </div>
        <p
          v-if="d.chatPruneLastResult"
          class="mt-3 rounded-lg border border-default/40 bg-muted/10 px-3 py-2 text-[11px] font-mono text-muted"
        >
          Ostatni przebieg: usunięto <strong class="font-bold text-highlighted">{{ d.chatPruneLastResult.deleted }}</strong> wątków
          (próg: {{ d.chatPruneLastResult.inactivity_days }} dni · {{ d.chatPruneLastResult.at }}).
        </p>
      </UCard>

      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Logi (localStorage)
          </p>
          <p class="mt-0.5 font-mono text-[10px] text-muted">
            {{ d.buildMeta }}
          </p>
        </div>
        <div class="flex flex-wrap gap-1">
          <UButton size="xs" variant="soft" @click="d.systemLogs.demoPush('change')">
            +zm
          </UButton>
          <UButton size="xs" variant="soft" @click="d.systemLogs.demoPush('info')">
            +info
          </UButton>
          <UButton size="xs" variant="soft" color="warning" @click="d.systemLogs.demoPush('warn')">
            +warn
          </UButton>
          <UButton size="xs" variant="soft" color="error" @click="d.systemLogs.demoPush('error')">
            +err
          </UButton>
          <UButton size="xs" variant="outline" icon="i-lucide-download" @click="d.downloadLogsExport">
            Export
          </UButton>
          <UButton size="xs" color="error" variant="ghost" @click="d.systemLogs.clear">
            Clear
          </UButton>
        </div>
      </div>

      <div class="mt-3 max-h-[min(360px,48vh)] overflow-auto rounded-xl border border-default/60 bg-muted/10">
        <div
          v-for="entry in d.systemLogRows"
          :key="entry.id"
          class="border-b border-default/45 px-3 py-2 font-mono text-[10px] last:border-b-0"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-muted">{{ d.formatLogTs(entry.ts) }}</span>
            <UBadge size="xs" variant="subtle" :color="d.logLevelColor(entry.level)">
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
          v-if="d.systemLogRows.length === 0"
          class="px-3 py-6 text-center text-xs text-muted"
        >
          Brak wpisów.
        </p>
      </div>
      </UCard>

      <UCard v-if="d.expDevBanPanel" class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-5">
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
              v-model="d.banUserSelected"
              :items="d.banUserOptions"
              value-key="value"
              size="lg"
              class="w-full rounded-xl"
            />
          </UFormField>
          <UFormField label="user_id (UUID)">
            <UInput v-model="d.banUserId" placeholder="np. 2e0b...-..." class="w-full rounded-xl" />
          </UFormField>
          <UFormField label="Powód (opcjonalnie)">
            <UTextarea v-model="d.banReason" :rows="3" placeholder="np. Brak składek" class="w-full rounded-xl" />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <UButton color="warning" class="rounded-xl font-bold" :loading="d.banPending" @click="d.devBanUser">
              Zbanuj
            </UButton>
            <UButton color="success" variant="soft" class="rounded-xl font-bold" :loading="d.banPending" @click="d.devUnbanUser">
              Odbanuj
            </UButton>
          </div>
        </div>
      </UCard>
  </div>
</template>

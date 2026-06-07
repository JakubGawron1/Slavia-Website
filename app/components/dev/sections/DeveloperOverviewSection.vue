<script setup lang="ts">
import { DEV_TOOL_SUPERADMIN_GROUP } from '~/data/devToolsCatalog'

const d = useDeveloperPage()
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Środowisko
          </p>
          <p class="mt-1 font-mono text-xs text-highlighted">
            {{ d.buildMeta }} · {{ d.config.public.appVersion }}
          </p>
          <p class="mt-1 break-all font-mono text-[10px] text-muted">
            API: {{ d.activeBackendApiBase }}
          </p>
        </div>
        <div class="flex flex-wrap gap-1">
          <UButton size="xs" variant="soft" color="neutral" icon="i-lucide-clipboard-copy" @click="d.copyBuildInfoJson">
            Build JSON
          </UButton>
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-zap"
            @click="d.pingApiLatency"
          >
            Ping API
          </UButton>
          <UButton
            size="xs"
            variant="soft"
            color="primary"
            icon="i-lucide-flask-conical"
            @click="d.runApiSmokeTests"
          >
            Smoke API
          </UButton>
        </div>
      </div>
    </UCard>

    <section aria-label="Statystyki i backend" class="contents">
      <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Statystyki API
          </p>
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="d.developerStatusPending"
            @click="d.refreshDeveloperStatus(); d.refreshBanUsersCatalog()"
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
              {{ d.status?.postsCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Zawodnicy
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ d.status?.athletesCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Zawody
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ d.status?.competitionsCount ?? 0 }}
            </p>
          </div>
          <div class="rounded-xl border border-default/60 bg-muted/10 px-2 py-2 text-center">
            <p class="text-[10px] uppercase tracking-wide text-muted">
              Oczekujące
            </p>
            <p class="mt-0.5 text-xl font-black tabular-nums text-highlighted">
              {{ d.status?.pendingCount ?? 0 }}
            </p>
          </div>
        </div>
        <p
          v-if="d.apiPingMs != null"
          class="mt-2 text-center font-mono text-[10px] text-muted"
        >
          Ostatni ping <span class="font-mono">/api/system/ping</span>:
          <span class="text-highlighted">{{ d.apiPingMs }}</span> ms
        </p>
        <div class="mt-3 rounded-xl border border-default/60 bg-muted/10 p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              Globalny provider backendu
            </p>
            <UBadge size="xs" variant="subtle" color="primary">
              aktywny: {{
                d.isLocalBackend
                  ? 'localhost'
                  : (d.activeBackendProvider === 'render' ? 'Render' : 'Leapcell')
              }}
            </UBadge>
          </div>
          <p class="mt-1 text-[11px] leading-snug text-muted">
            Ustawienie zapisuje się po stronie BFF i obowiązuje dla wszystkich urządzeń.
          </p>
          <p class="mt-1 break-all font-mono text-[10px] text-muted">
            URL: {{ d.activeBackendApiBase }}
          </p>
          <div class="mt-2 flex flex-wrap gap-1">
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :disabled="d.isLocalBackend"
              :variant="d.selectedBackendProvider === 'leapcell' ? 'solid' : 'outline'"
              @click="d.selectedBackendProvider = 'leapcell'"
            >
              Leapcell
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              class="touch-manipulation"
              :disabled="d.isLocalBackend"
              :variant="d.selectedBackendProvider === 'render' ? 'solid' : 'outline'"
              @click="d.selectedBackendProvider = 'render'"
            >
              Render
            </UButton>
          </div>
          <div class="mt-2 flex flex-wrap gap-1">
            <UButton
              size="xs"
              color="primary"
              icon="i-lucide-save"
              :loading="d.backendProviderSaving"
              @click="d.saveBackendProviderSetting"
            >
              Zapisz globalnie
            </UButton>
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              icon="i-lucide-refresh-cw"
              @click="d.refreshBackendProviderSetting"
            >
              Odśwież z serwera
            </UButton>
          </div>
          <p
            v-if="d.backendProviderServerUpdatedAt"
            class="mt-2 font-mono text-[10px] text-muted"
          >
            updated_at: {{ d.backendProviderServerUpdatedAt }}
          </p>
        </div>
      </UCard>
    </section>

    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        {{ DEV_TOOL_SUPERADMIN_GROUP.title }}
      </p>
      <p class="mt-1 text-[11px] text-muted">
        {{ DEV_TOOL_SUPERADMIN_GROUP.description }}
      </p>
      <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <UButton
          v-for="link in DEV_TOOL_SUPERADMIN_GROUP.links"
          :key="link.to"
          :to="link.to"
          variant="outline"
          color="neutral"
          size="sm"
          class="h-auto min-h-11 flex-col items-start gap-0.5 py-2 whitespace-normal text-left"
        >
          <span class="flex w-full items-center gap-2 font-semibold text-highlighted">
            <UIcon :name="link.icon" class="size-4 shrink-0 text-primary" />
            <span class="truncate">{{ link.label }}</span>
          </span>
          <span class="w-full text-[11px] font-normal text-muted">{{ link.description }}</span>
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const d = useDeveloperPage()
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
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
          Ping GET /api/posts: <span class="text-highlighted">{{ d.apiPingMs }}</span> ms
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
            Ustawienie zapisuje się po stronie API i obowiązuje dla wszystkich urządzeń/kont.
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
  </div>
</template>

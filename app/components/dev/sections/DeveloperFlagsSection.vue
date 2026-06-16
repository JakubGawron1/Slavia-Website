<script setup lang="ts">
const d = useDeveloperPage()
</script>

<template>
  <div class="space-y-4">
    <UCard class="rounded-2xl border-primary/25 bg-linear-to-br from-primary/6 via-card to-card p-4 shadow-sm ring-1 ring-primary/15 sm:p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
            Publiczna konfiguracja (NUXT_PUBLIC_*)
          </p>
          <p class="mt-1 text-[11px] leading-relaxed text-muted">
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
          — backend Hugging Face / Render (deprecated) / localhost.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_CMS_BASE_URL</span>
          — raw GitHub / Pages dla mediów Slavia-cms.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_FEATURES_JSON</span>
          — flagi boolean (<code class="font-mono text-[10px]">usePublicFeatures()</code>).
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH</span>
          — lista <code class="font-mono">id</code> z katalogu flag, wymuszone wyłączenie na produkcji.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_MOBILE_GITHUB_REPO</span>
          — proxy APK przez BFF <code class="font-mono">/api/mobile/latest-release</code>.
        </li>
        <li class="rounded-lg border border-default/50 bg-muted/10 px-3 py-2 sm:col-span-2">
          <span class="font-mono text-[10px] text-highlighted">NUXT_PUBLIC_SITE_URL</span>,
          <span class="font-mono text-[10px] text-highlighted">VERCEL_URL</span>,
          <span class="font-mono text-[10px] text-highlighted">NUXT_SOURCEMAP=1</span>
          — canonical, OG, opcjonalne mapy przy buildzie.
        </li>
      </ul>
    </UCard>

    <DevExperimentalFlagsPanel
      :stable-defs="d.experimentalStableDefs"
      :experiment-defs="d.experimentalVisibleDefs"
      :resolved="d.experimentalResolved"
      :kill-deploy="d.experimentalKillDeploy"
      :is-locked="d.isExperimentalLocked"
      @reset="d.resetExperimentalDefaults"
      @toggle="(id, v) => d.setExperimentalFlag(id, v)"
    />
  </div>
</template>

<script setup lang="ts">
const d = useDeveloperPage()
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
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
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Slavia-cms (GitHub) — media</p>
              <UButton
                size="xs"
                variant="soft"
                icon="i-lucide-refresh-cw"
                :loading="d.githubMediaStatusLoading"
                @click="d.refreshGithubMediaStatus"
              >
                Odśwież
              </UButton>
            </div>
            <p class="mt-1 text-sm text-muted">
              <code>NUXT_PUBLIC_CMS_BASE_URL</code>:
              <span class="font-mono">{{ d.config.public.cmsBaseUrl || '— nie ustawiono —' }}</span>
              <UBadge class="ml-2" size="xs" :color="d.cmsBaseConfigured ? 'success' : 'warning'" variant="subtle">
                {{ d.cmsBaseConfigured ? 'odczyt OK' : 'brak bazy URL' }}
              </UBadge>
            </p>
            <div
              v-if="d.githubMediaStatus"
              class="mt-2 space-y-1 rounded-xl border border-default/50 bg-muted/10 p-3 text-xs text-muted"
            >
              <p>
                Backend: repo <span class="font-mono">{{ d.githubMediaStatus.repo }}</span> · gałąź
                <span class="font-mono">{{ d.githubMediaStatus.branch }}</span> · root
                <span class="font-mono">{{ d.githubMediaStatus.media_root }}/</span>
              </p>
              <p class="flex flex-wrap items-center gap-2">
                <span>PAT (<code>GITHUB_TOKEN</code>):</span>
                <UBadge size="xs" :color="d.githubMediaStatus.token_configured ? 'success' : 'error'" variant="subtle">
                  {{ d.githubMediaStatus.token_configured ? 'ustawiony' : 'brak' }}
                </UBadge>
                <span>Upload mediów:</span>
                <UBadge size="xs" :color="d.githubMediaStatus.upload_ready ? 'success' : 'warning'" variant="subtle">
                  {{ d.githubMediaStatus.upload_ready ? 'gotowy' : 'niedostępny' }}
                </UBadge>
              </p>
              <p v-if="d.githubMediaStatus.last_upload_at">
                Ostatni upload: {{ d.githubMediaStatus.last_upload_at }}
                <span v-if="d.githubMediaStatus.last_upload_path" class="font-mono"> · {{ d.githubMediaStatus.last_upload_path }}</span>
              </p>
              <p v-else class="italic">
                Brak zapisu ostatniego uploadu do repo mediów.
              </p>
            </div>
            <ul class="mt-2 list-disc ps-4 text-xs text-muted space-y-1">
              <li><code>GITHUB_TOKEN</code> (PAT) — scope <code>repo</code> tylko na backendzie (Render/Leapcell)</li>
              <li>Struktura repo: <code>media/gallery/</code>, <code>media/blog/</code>, <code>media/announcements/</code></li>
              <li>Awatary i zdjęcia zawodników — Cloudinary (<code>purpose=avatar|athletes</code>)</li>
            </ul>
          </div>
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Feature adoption (30 dni)</p>
              <UButton size="xs" variant="soft" icon="i-lucide-refresh-cw" :loading="d.featureAdoptionLoading" @click="d.refreshFeatureAdoption">
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
                  <tr v-for="row in d.featureAdoptionRows.slice(0, 20)" :key="row.module_key" class="border-t border-default/40">
                    <td class="px-2 py-1">{{ row.label }}</td>
                    <td class="px-2 py-1 text-right font-mono">{{ row.unique_users_30d }}</td>
                    <td class="px-2 py-1 text-right font-mono">{{ row.events_30d }}</td>
                  </tr>
                  <tr v-if="!d.featureAdoptionRows.length">
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
                  :to="`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(d.config.public.siteUrl || '')}`"
                  target="_blank"
                >
                  Audyt Strony Głównej
                </UButton>
                <UButton
                  block
                  variant="soft"
                  color="neutral"
                  icon="i-lucide-external-link"
                  :to="`https://pagespeed.web.dev/analysis?url=${encodeURIComponent((d.config.public.siteUrl || '') + '/logowanie')}`"
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
                <li>Nowe trasy chronione: dodaj regułę w <code>config/routeRules.ts</code> przed merge.</li>
                <li>Trasy panelu: <code>robots: noindex</code> w <code>useSeoMeta</code>.</li>
              </ul>
            </div>
          </div>
        </UCard>
      </section>
  </div>
</template>

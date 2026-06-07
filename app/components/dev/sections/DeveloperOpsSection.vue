<script setup lang="ts">
const d = useDeveloperPage()
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
    <section id="ops-integrations" class="space-y-4 lg:col-span-12">
      <div class="flex items-center gap-3 px-1">
        <UIcon name="i-lucide-plug" class="size-6 text-primary" />
        <h2 class="text-lg font-black uppercase italic tracking-tight text-highlighted">
          Integracje
        </h2>
      </div>

      <UCard class="space-y-4 rounded-2xl border-default/60 p-4 shadow-sm">
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Asystent AI (publiczny)</p>
            <UButton size="xs" variant="soft" icon="i-lucide-refresh-cw" :loading="d.aiPublicStatusLoading" @click="d.refreshAiPublicStatus">
              Odśwież
            </UButton>
          </div>
          <p class="mt-1 text-sm text-muted">
            BFF <code class="font-mono text-xs">/api/ai/public/status</code> → backend coach. Widget na stronach publicznych klubu.
          </p>
          <div v-if="d.aiPublicStatus" class="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <UBadge size="xs" :color="d.aiPublicStatus.enabled ? 'success' : 'warning'" variant="subtle">
              {{ d.aiPublicStatus.enabled ? 'włączony' : 'wyłączony' }}
            </UBadge>
            <span v-if="d.aiPublicStatus.model" class="font-mono text-muted">model: {{ d.aiPublicStatus.model }}</span>
            <span v-if="d.aiPublicStatus.message" class="text-muted">{{ d.aiPublicStatus.message }}</span>
          </div>
        </div>

        <div class="border-t border-default/40 pt-4">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">CMS inline (dev-editcms)</p>
          <p class="mt-1 text-sm text-muted">
            Edycja treści na stronach publicznych — flaga eksperymentalna + backend <code class="font-mono text-xs">/api/cms/*</code>.
            Baza mediów: <code class="font-mono text-xs">NUXT_PUBLIC_CMS_BASE_URL</code>.
          </p>
        </div>

        <div class="border-t border-default/40 pt-4">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">QR check-in (WWW)</p>
          <p class="mt-1 text-sm text-muted">
            Flaga <code>attendance_qr_checkin</code> —
            <NuxtLink to="/athlete/obecnosc-qr" class="text-primary underline">/athlete/obecnosc-qr</NuxtLink>,
            kadra: <NuxtLink to="/attendance" class="text-primary underline">/attendance</NuxtLink>.
          </p>
        </div>

        <div class="border-t border-default/40 pt-4">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Upload Cloudinary</p>
          <p class="mt-1 text-sm text-muted">
            Multipart: pole <code>file</code> (+ opcjonalnie <code>purpose</code>: avatar | athletes | gallery | blog).
            Limit body: 45 MB. Klient nie ustawia <code>Content-Type</code> dla FormData.
          </p>
        </div>

        <div class="border-t border-default/40 pt-4">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Duplikaty HTTP 409</p>
          <ul class="mt-1 list-disc space-y-1 ps-4 text-sm text-muted">
            <li>Składki: ten sam miesiąc Pending / Approved</li>
            <li>Wyniki: Pending z tą samą datą i totalem (zawodnik)</li>
            <li>Obecności: ten sam dzień (zawodnik / QR już verified)</li>
          </ul>
        </div>

        <div class="border-t border-default/40 pt-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Slavia-cms (GitHub) — media</p>
            <UButton size="xs" variant="soft" icon="i-lucide-refresh-cw" :loading="d.githubMediaStatusLoading" @click="d.refreshGithubMediaStatus">
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
          <div v-if="d.githubMediaStatus" class="mt-2 space-y-1 rounded-xl border border-default/50 bg-muted/10 p-3 text-xs text-muted">
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
              <span>Upload:</span>
              <UBadge size="xs" :color="d.githubMediaStatus.upload_ready ? 'success' : 'warning'" variant="subtle">
                {{ d.githubMediaStatus.upload_ready ? 'gotowy' : 'niedostępny' }}
              </UBadge>
            </p>
          </div>
        </div>

        <div class="border-t border-default/40 pt-4">
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

        <div class="border-t border-default/40 pt-4">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Mobile APK (GitHub Releases)</p>
          <p class="mt-1 text-xs text-muted">
            Repo: <code class="font-mono">{{ d.config.public.mobileGithubRepo }}</code> —
            BFF <NuxtLink to="/api/mobile/latest-release" class="text-primary underline">/api/mobile/latest-release</NuxtLink>.
          </p>
        </div>
      </UCard>
    </section>

    <section id="perf-audit" class="space-y-4 lg:col-span-12">
      <div class="flex items-center gap-3 px-1">
        <UIcon name="i-lucide-gauge" class="size-6 text-primary" />
        <h2 class="text-lg font-black uppercase italic tracking-tight text-highlighted">
          Wydajność i cache
        </h2>
      </div>
      <UCard class="rounded-2xl border-default/60 bg-muted/5 p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="space-y-3">
            <p class="text-sm font-medium text-muted">PageSpeed Insights</p>
            <div class="flex flex-col gap-2">
              <UButton
                block
                variant="soft"
                color="neutral"
                icon="i-lucide-external-link"
                :to="`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(d.config.public.siteUrl || '')}`"
                target="_blank"
              >
                Strona główna
              </UButton>
              <UButton
                block
                variant="soft"
                color="neutral"
                icon="i-lucide-external-link"
                :to="`https://pagespeed.web.dev/analysis?url=${encodeURIComponent((d.config.public.siteUrl || '') + '/logowanie')}`"
                target="_blank"
              >
                Panel logowania
              </UButton>
            </div>
          </div>
          <div class="space-y-3 rounded-xl border border-default/50 bg-muted/10 p-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-primary">routeRules (skrót)</h3>
            <ul class="list-disc space-y-1 ps-4 text-xs text-muted">
              <li>Panele <code>/athlete/**</code>, <code>/trainer/**</code>, <code>/admin/**</code> — <code>no-store</code>.</li>
              <li>Publiczne ISR: <code>/</code>, <code>/aktualnosci</code>, <code>/galeria</code>, <code>/zawodnicy</code>.</li>
              <li>BFF <code>/api/public/*</code> — whitelist w <code>publicBackendProxy.ts</code>.</li>
              <li>Nowa trasa: dopisz regułę w <code>config/routeRules.ts</code> przed merge.</li>
            </ul>
          </div>
        </div>
      </UCard>
    </section>
  </div>
</template>

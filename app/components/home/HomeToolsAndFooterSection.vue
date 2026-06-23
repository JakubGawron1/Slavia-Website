<script setup lang="ts">
import { HOME_CLUB_TOOLS, HOME_FAQ, HOME_TRAINING_DAYS } from '~/data/homePageContent'
</script>

<template>
  <!-- NARZĘDZIA KLUBU (w tym galeria) -->
  <section class="slavia-public-section slavia-public-section--band">
    <UContainer>
      <PublicSectionHead>
        <template #eyebrow>
          <CmsEditable page-name="home" field-key="tools_eyebrow" type="text" label="Narzędzia — odznaka" fallback="Narzędzia" />
        </template>
        <template #title>
          <CmsEditable page-name="home" field-key="tools_title" type="text" label="Narzędzia — tytuł" tag="span" fallback="Wszystko w jednym miejscu" />
        </template>
        <template #lead>
          <CmsEditable
            page-name="home"
            field-key="tools_subtitle"
            type="text"
            label="Narzędzia — opis"
            tag="span"
            fallback="Ranking Sinclair, kalkulatory, blog, galeria i kontakt — żeby trenować mądrzej i być na bieżąco z życiem klubu."
          />
        </template>
      </PublicSectionHead>

      <div class="slavia-public-grid slavia-public-grid--tools slavia-public-grid--stagger">
        <NuxtLink
          v-for="t in HOME_CLUB_TOOLS"
          :key="t.to"
          :to="t.to"
          class="slavia-public-card slavia-public-card--glass group relative flex flex-row items-start gap-4 bg-card p-5 ring-1 ring-default/30"
        >
          <span class="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
            <UIcon :name="t.icon" class="size-6" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-black text-highlighted group-hover:text-primary">
              {{ t.label }}
            </p>
            <p class="mt-1 text-sm leading-relaxed text-muted">
              {{ t.description }}
            </p>
          </div>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="absolute right-4 top-4 size-4 text-muted opacity-0 transition-all group-hover:opacity-100"
          />
        </NuxtLink>
      </div>
    </UContainer>
  </section>

  <!-- LOKALIZACJA + KONTAKT -->
  <section class="relative py-12 lg:py-20">
    <UContainer>
      <div class="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
        <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
          <CmsEditable page-name="home" field-key="location_eyebrow" type="text" label="Lokalizacja — odznaka" fallback="Gdzie nas znaleźć" />
        </p>
        <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
          <CmsEditable
            page-name="home"
            field-key="location_title"
            type="text"
            label="Lokalizacja — tytuł"
            tag="span"
            fallback="Slavia. Ruda Śląska. Poniedziałek 15:00."
          />
        </h2>
      </div>

      <div class="grid gap-5 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <div class="overflow-hidden rounded-3xl border border-default/60 shadow-sm ring-1 ring-default/30">
            <iframe
              title="Mapa — CKS Slavia, ul. Konopnickiej 13, Ruda Śląska"
              src="https://www.openstreetmap.org/export/embed.html?bbox=18.845%2C50.308%2C18.865%2C50.323&amp;layer=mapnik&amp;marker=50.3156487%2C18.8550812"
              class="h-[320px] w-full border-0 sm:h-[420px]"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div class="space-y-4 lg:col-span-2">
          <div class="rounded-3xl border border-default/60 bg-card p-6 shadow-sm ring-1 ring-default/30">
            <div class="flex items-start gap-3">
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <UIcon name="i-lucide-map-pin" class="size-5" />
              </span>
              <div>
                <p class="font-black text-highlighted">
                  Adres sali treningowej
                </p>
                <div class="mt-1 text-sm leading-relaxed text-muted">
                  <CmsEditable
                    page-name="home"
                    field-key="location_address"
                    type="html"
                    label="Adres"
                    fallback="CKS Slavia Ruda Śląska<br>ul. Konopnickiej 13<br>41-700 Ruda Śląska"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-default/60 bg-card p-6 shadow-sm ring-1 ring-default/30">
            <div class="flex items-start gap-3">
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400">
                <UIcon name="i-lucide-clock" class="size-5" />
              </span>
              <div class="flex-1">
                <p class="font-black text-highlighted">
                  Godziny treningów
                </p>
                <ul class="mt-2 space-y-1 text-sm">
                  <li
                    v-for="d in HOME_TRAINING_DAYS"
                    :key="d.day"
                    class="flex items-center justify-between gap-3"
                  >
                    <span class="text-muted">{{ d.day }}</span>
                    <span class="font-mono font-bold text-highlighted tabular-nums">{{ d.hours }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <UButton
            to="/kontakt"
            size="lg"
            icon="i-lucide-mail"
            class="w-full justify-center font-bold"
          >
            Skontaktuj się z nami
          </UButton>
        </div>
      </div>
    </UContainer>
  </section>

  <!-- FAQ -->
  <section class="slavia-public-section slavia-public-section--band">
    <UContainer>
      <div class="mx-auto max-w-3xl">
        <PublicSectionHead
          eyebrow="Najczęstsze pytania"
          title="Zanim przyjdziesz po raz pierwszy"
        />

        <UAccordion
          :items="HOME_FAQ.map(f => ({ label: f.q, content: f.a }))"
          :ui="{
            item: 'rounded-2xl border border-default/60 bg-card mb-3 overflow-hidden ring-1 ring-default/20',
            trigger: 'px-5 py-4 text-base font-bold text-highlighted hover:bg-muted/20',
            content: 'px-5 pb-5 text-sm leading-relaxed text-muted'
          }"
        />
      </div>
    </UContainer>
  </section>

  <!-- CTA - DOŁĄCZ DO NAS -->
  <section class="relative pb-20 pt-12 lg:pb-28 lg:pt-16">
    <UContainer>
      <div class="relative overflow-hidden rounded-3xl border border-primary/30 bg-linear-to-br from-primary/15 via-card to-amber-500/10 p-8 shadow-xl ring-1 ring-primary/20 sm:p-12 lg:p-16">
        <div class="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div class="pointer-events-none absolute -bottom-20 -left-12 size-72 rounded-full bg-amber-500/15 blur-3xl" />

        <div class="relative mx-auto max-w-3xl text-center">
          <UIcon name="i-lucide-flame" class="mx-auto mb-4 size-12 text-primary" />
          <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
            Sprawdź, jak smakuje sztanga
          </h2>
          <p class="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted lg:text-lg">
            Pierwszy trening jest <strong class="text-highlighted">bez zobowiązań</strong>. Wpadnij na salę,
            poznaj trenerów i drużynę — a my pokażemy Ci, że ciężary są dla każdego, kto chce trochę popracować.
          </p>
          <div class="slavia-public-cta-row">
            <UButton
              to="/kontakt"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              class="font-bold"
            >
              Umów pierwszy trening
            </UButton>
            <UButton
              to="/zawodnicy"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-lucide-trophy"
              class="font-bold"
            >
              Zobacz drużynę
            </UButton>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>

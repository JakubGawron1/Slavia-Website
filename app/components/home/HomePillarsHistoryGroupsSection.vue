<script setup lang="ts">
import { HOME_TRAINING_GROUPS } from '~/data/homePageContent'
</script>

<template>
  <!-- TRZY FILARY -->
  <section class="slavia-public-section slavia-public-section--band">
    <UContainer>
      <PublicSectionHead>
        <template #eyebrow>
          <CmsEditable page-name="home" field-key="pillars_eyebrow" type="text" label="Filary — odznaka" fallback="Kim jesteśmy" />
        </template>
        <template #title>
          <CmsEditable page-name="home" field-key="pillars_title" type="text" label="Filary — tytuł" tag="span" fallback="Sport, ludzie i zdrowy progres" />
        </template>
        <template #lead>
          <CmsEditable
            page-name="home"
            field-key="pillars_subtitle"
            type="text"
            label="Filary — opis"
            tag="span"
            fallback="Slavia to nie tylko medalowe nazwiska — to przede wszystkim ludzie, codzienna praca i bezpieczna nauka techniki, która ma służyć zdrowiu na lata."
          />
        </template>
      </PublicSectionHead>

      <div class="slavia-public-grid slavia-public-grid--stagger">
        <div class="slavia-public-feature-card bg-linear-to-br from-card via-card to-primary/5 ring-1 ring-default/30 hover:ring-primary/30">
          <div class="slavia-public-feature-card__glow bg-primary/8 group-hover:bg-primary/15" />
          <div class="relative">
            <div class="slavia-public-feature-card__icon bg-primary/12 text-primary ring-1 ring-primary/25">
              <UIcon name="i-lucide-users-round" class="size-6" />
            </div>
            <h3 class="text-xl font-black text-highlighted">
              <CmsEditable page-name="home" field-key="pillar_community_title" type="text" label="Filar 1 — tytuł" tag="span" fallback="Społeczność" />
            </h3>
            <p class="mt-3 slavia-public-lead">
              <CmsEditable
                page-name="home"
                field-key="pillar_community_text"
                type="text"
                label="Filar 1 — tekst"
                tag="span"
                fallback="Trenerzy, zawodnicy i rodzice tworzą przyjazną atmosferę. Tu każdy zaczyna od solidnych podstaw — a po roku potrafi wstać po pierwszy medal."
              />
            </p>
          </div>
        </div>

        <div class="slavia-public-feature-card bg-linear-to-br from-card via-card to-amber-500/5 ring-1 ring-default/30 hover:ring-amber-500/30">
          <div class="slavia-public-feature-card__glow bg-amber-500/10" />
          <div class="relative">
            <div class="slavia-public-feature-card__icon bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
              <UIcon name="i-lucide-medal" class="size-6" />
            </div>
            <h3 class="text-xl font-black text-highlighted">
              <CmsEditable page-name="home" field-key="pillar_sport_title" type="text" label="Filar 2 — tytuł" tag="span" fallback="Sport i rozwój" />
            </h3>
            <p class="mt-3 slavia-public-lead">
              <CmsEditable
                page-name="home"
                field-key="pillar_sport_text"
                type="text"
                label="Filar 2 — tekst"
                tag="span"
                fallback="Starty w zawodach klubowych, lidze śląskiej i mistrzostwach Polski. Cele dopasowane do wieku i poziomu zaawansowania — bez przeskakiwania etapów."
              />
            </p>
          </div>
        </div>

        <div class="slavia-public-feature-card bg-linear-to-br from-card via-card to-success/5 ring-1 ring-default/30 hover:ring-success/30">
          <div class="slavia-public-feature-card__glow bg-success/12" />
          <div class="relative">
            <div class="slavia-public-feature-card__icon bg-success/12 text-success ring-1 ring-success/30">
              <UIcon name="i-lucide-heart-pulse" class="size-6" />
            </div>
            <h3 class="text-xl font-black text-highlighted">
              <CmsEditable page-name="home" field-key="pillar_health_title" type="text" label="Filar 3 — tytuł" tag="span" fallback="Zdrowy trening" />
            </h3>
            <p class="mt-3 slavia-public-lead">
              <CmsEditable
                page-name="home"
                field-key="pillar_health_text"
                type="text"
                label="Filar 3 — tekst"
                tag="span"
                fallback="Nacisk na technikę, regenerację i długofalowe bezpieczeństwo. Siła ma służyć przez lata — także po zakończeniu kariery startowej."
              />
            </p>
          </div>
        </div>
      </div>
    </UContainer>
  </section>

  <!-- HISTORIA KLUBU -->
  <section class="slavia-public-section slavia-public-section--band">
    <UContainer>
      <ClubHistoryTimeline
        page-name="o-klubie"
        :limit="4"
        compact
        heading-id="home-club-history-heading"
      />
      <div class="slavia-public-section-cta">
        <UButton
          to="/o-klubie"
          size="lg"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
          class="font-bold"
        >
          Pełna historia klubu
        </UButton>
      </div>
    </UContainer>
  </section>

  <!-- GRUPY TRENINGOWE -->
  <section class="slavia-public-section slavia-public-section--band">
    <UContainer>
      <PublicSectionHead
        eyebrow="Co Cię czeka na sali"
        title="Trzy grupy, jeden klub"
        lead="Niezależnie od tego czy masz 11 czy 41 lat — znajdziemy dla Ciebie miejsce. Trenujemy razem na sali, ale plan zawsze jest dopasowany do możliwości i celów."
      />

      <div class="grid gap-5 md:grid-cols-3">
        <div
          v-for="g in HOME_TRAINING_GROUPS"
          :key="g.id"
          class="group relative overflow-hidden rounded-3xl border bg-linear-to-br p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl lg:p-8"
          :class="g.accent"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="inline-flex size-12 items-center justify-center rounded-2xl bg-card/70 ring-1 ring-default/30">
              <UIcon :name="g.icon" class="size-6" />
            </div>
            <span class="rounded-full bg-card/80 px-3 py-1 text-[11px] font-black uppercase tracking-wider ring-1 ring-default/30">
              {{ g.ageRange }}
            </span>
          </div>
          <h3 class="mt-5 text-xl font-black text-highlighted">
            {{ g.label }}
          </h3>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            {{ g.description }}
          </p>
          <ul class="mt-5 space-y-2.5">
            <li
              v-for="h in g.highlights"
              :key="h"
              class="flex items-start gap-2.5 text-sm text-default"
            >
              <UIcon name="i-lucide-check-circle-2" class="mt-0.5 size-4 shrink-0" />
              <span class="leading-snug">{{ h }}</span>
            </li>
          </ul>
        </div>
      </div>
    </UContainer>
  </section>
</template>

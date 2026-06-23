<script setup lang="ts">
import type { Athlete } from '~/types/models'
import type { HomeChampionRow } from '~/data/homePageContent'
import { sinclairTotal, type SinclairGender } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'

useSeoMeta({
  title: 'CKS Slavia Ruda Śląska — klub podnoszenia ciężarów',
  description:
    'CKS Slavia Ruda Śląska — klub podnoszenia ciężarów z tradycją. Trenujemy młodzież i dorosłych, od pierwszych kroków na platformie po starty w zawodach ogólnopolskich.',
  ogTitle: 'CKS Slavia Ruda Śląska',
  ogDescription:
    'Klub podnoszenia ciężarów z Rudy Śląskiej. Treningi, wyniki, ranking Sinclair, narzędzia trenerskie i strefa dla zawodników.',
  twitterCard: 'summary_large_image'
})

interface BlogPost {
  id: string
  title: string
  content?: string
  image_url?: string
  created_at: string
  published?: boolean
}

/** Strona główna — publiczny BFF (`/api/public/*`) pod SSG/ISR na Vercel. */
const {
  data: athletes,
  pending: _athletesPending
} = await usePublicLazyFetch<Athlete[]>('athletes', {
  key: 'home-athletes',
  default: () => [] as Athlete[]
})

const {
  data: posts,
  pending: _postsPending
} = await usePublicLazyFetch<BlogPost[]>('posts', {
  key: 'home-posts',
  default: () => [] as BlogPost[]
})

await useCmsPageHydrate('home')

function genderForSinclair(g?: string | null): SinclairGender | null {
  return g === 'male' || g === 'female' ? g : null
}

/** Top 3 zawodników klubu liczeni po Sinclairze z PB (wpisywane przez trenera/admina). */
const champions = computed<HomeChampionRow[]>(() => {
  return athletes.value
    .filter(a => a.is_active !== false)
    .map((a) => {
      const sg = genderForSinclair(a.gender ?? undefined)
      const totalKg = Number(a.total_kg ?? 0)
      const bodyweight = effectiveBodyweightKgForSinclair({
        bodyweight: a.bodyweight ?? null,
        weight_category: a.weight_category ?? null
      })
      const sc = sg && totalKg > 0 && bodyweight > 0 ? sinclairTotal(totalKg, bodyweight, sg) : 0
      return {
        id: a.id,
        full_name: a.full_name,
        image_url: a.image_url ?? null,
        total: totalKg,
        sinclair: Number(sc.toFixed(2)),
        weightCategory: a.weight_category ?? null,
        birthYear: a.birth_year ?? null
      }
    })
    .filter(r => r.total > 0 && r.sinclair > 0)
    .sort((a, b) => b.sinclair - a.sinclair)
    .slice(0, 3)
})

/** Najnowsze opublikowane aktualności — pierwsze trzy. */
const latestPosts = computed(() => {
  return posts.value
    .filter(p => p.published !== false)
    .slice()
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 3)
})

const stats = computed(() => {
  const active = athletes.value.filter(a => a.is_active !== false)
  const bestSinclair = champions.value[0]?.sinclair ?? 0
  const heaviestTotal = Math.max(0, ...active.map(a => Number(a.total_kg ?? 0)))
  const womenCount = active.filter(a => a.gender === 'female').length
  const menCount = active.filter(a => a.gender === 'male').length
  return {
    activeCount: active.length,
    bestSinclair,
    heaviestTotal,
    womenCount,
    menCount
  }
})

useProvideCmsPageData('home', () => ({
  liczba_zawodnikow: stats.value.activeCount,
  liczba_kobiet: stats.value.womenCount,
  liczba_mezczyzn: stats.value.menCount,
  najlepszy_sinclair:
    stats.value.bestSinclair > 0 ? stats.value.bestSinclair.toFixed(1) : '',
  najciezszy_total:
    stats.value.heaviestTotal > 0 ? `${stats.value.heaviestTotal} kg` : '',
  imie_zawodnika: champions.value[0]?.full_name ?? '',
  sinclair_lidera:
    champions.value[0]?.sinclair ? String(champions.value[0].sinclair) : '',
  imie_zawodnika_2: champions.value[1]?.full_name ?? '',
  imie_zawodnika_3: champions.value[2]?.full_name ?? ''
}))

const { mobileDownloadHref, mobileDownloadLabel } = useMobileAppRelease()
</script>

<template>
  <div class="animate-page-in relative min-w-0 overflow-x-clip">
    <!-- Dekoracyjne plamy światła w tle -->
    <div
      class="pointer-events-none absolute -left-32 top-12 size-[420px] rounded-full bg-primary/10 blur-3xl dark:bg-primary/20"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-24 top-[36vh] size-[340px] rounded-full bg-amber-400/8 blur-3xl dark:bg-amber-400/15"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute left-1/2 top-[88vh] hidden size-[280px] -translate-x-1/2 rounded-full bg-info/12 blur-3xl opacity-70 dark:bg-info/18 lg:block"
      aria-hidden="true"
    />

    <!-- HERO -->
    <section class="relative pb-12 pt-16 sm:pt-20 lg:pt-24 lg:pb-16">
      <UContainer>
        <div class="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-primary backdrop-blur">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-primary/70 opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <CmsEditable
              page-name="home"
              field-key="hero_badge"
              type="text"
              label="Odznaka hero"
              fallback="CKS Slavia Ruda Śląska"
            />
          </div>

          <h1 class="text-balance text-4xl font-black uppercase italic leading-[0.95] tracking-tight text-highlighted sm:text-5xl md:text-6xl lg:text-7xl">
            <CmsEditable
              page-name="home"
              field-key="hero_title"
              type="text"
              label="Tytuł hero"
              tag="span"
              fallback="Sztanga, drużyna,"
            />
            <CmsEditable
              page-name="home"
              field-key="hero_title_accent"
              type="text"
              label="Akcent tytułu"
              tag="span"
              fallback="Slavia."
              class="bg-linear-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent"
            />
          </h1>

          <div class="slavia-public-lead mt-6 max-w-3xl text-pretty sm:text-lg lg:text-xl">
            <CmsEditable
              page-name="home"
              field-key="hero_subtitle"
              type="html"
              label="Podtytuł hero"
              fallback="Klub podnoszenia ciężarów z tradycją i pasją. Trenujemy młodzież i dorosłych — od pierwszych kroków na platformie po starty w zawodach ogólnopolskich. Zapraszamy do <strong>Rudy Śląskiej</strong>."
            />
          </div>

          <div class="slavia-public-cta-row">
            <UButton
              to="/zawodnicy"
              prefetch
              prefetch-on="interaction"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              class="font-bold"
            >
              Poznaj zawodników
            </UButton>
            <UButton
              to="/aktualnosci"
              prefetch
              prefetch-on="interaction"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-lucide-newspaper"
              class="font-bold"
            >
              Aktualności
            </UButton>
            <UButton
              to="/kontakt"
              prefetch
              prefetch-on="interaction"
              size="xl"
              color="neutral"
              variant="outline"
              icon="i-lucide-mail"
              class="font-bold"
            >
              Dołącz do nas
            </UButton>
            <UButton
              v-if="mobileDownloadHref"
              :to="mobileDownloadHref"
              external
              target="_blank"
              rel="noopener noreferrer"
              size="xl"
              color="success"
              variant="outline"
              icon="i-lucide-smartphone"
              class="font-bold"
            >
              {{ mobileDownloadLabel }}
            </UButton>
          </div>
        </div>

        <!-- Pasek statystyk klubu -->
        <div
          v-slavia-reveal="'fade-up'"
          class="slavia-public-kpi-band"
        >
          <div class="slavia-public-kpi bg-primary/5 ring-1 ring-primary/15">
            <div class="slavia-public-kpi__label text-primary">
              <UIcon name="i-lucide-users" class="size-4" />
              Aktywni zawodnicy
            </div>
            <p class="slavia-public-kpi__value">
              {{ stats.activeCount }}
            </p>
            <p class="slavia-public-kpi__hint">
              w tym {{ stats.womenCount }} K · {{ stats.menCount }} M
            </p>
          </div>

          <div class="slavia-public-kpi bg-amber-500/5 ring-1 ring-amber-500/15">
            <div class="slavia-public-kpi__label text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-trophy" class="size-4" />
              Najlepszy Sinclair
            </div>
            <p class="slavia-public-kpi__value">
              {{ stats.bestSinclair > 0 ? stats.bestSinclair.toFixed(1) : '—' }}
            </p>
            <p class="slavia-public-kpi__hint">
              w klubie (2025–2028)
            </p>
          </div>

          <div class="slavia-public-kpi bg-info/6 ring-1 ring-info/20">
            <div class="slavia-public-kpi__label text-info">
              <UIcon name="i-lucide-dumbbell" class="size-4" />
              Najwyższa suma
            </div>
            <p class="slavia-public-kpi__value">
              {{ stats.heaviestTotal > 0 ? `${stats.heaviestTotal} kg` : '—' }}
            </p>
            <p class="slavia-public-kpi__hint">
              klubowy rekord PB
            </p>
          </div>

          <div class="slavia-public-kpi bg-success/6 ring-1 ring-success/20">
            <div class="slavia-public-kpi__label text-success">
              <UIcon name="i-lucide-calendar-days" class="size-4" />
              Treningi
            </div>
            <p class="slavia-public-kpi__value">
              3×
            </p>
            <p class="slavia-public-kpi__hint">
              w tygodniu, Pon–Śr–Pt
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Sekcje poniżej hero — lazy hydrate (SSG HTML + IntersectionObserver) -->
    <LazyHomePillarsHistoryGroupsSection
      hydrate-on-visible
      data-home-section="pillars-history-groups"
    />

    <LazyHomeChampionsSection
      v-if="champions.length > 0"
      hydrate-on-visible
      data-home-section="ranking"
      :champions="champions"
    />

    <LazyHomeNewsSection
      v-if="latestPosts.length > 0"
      hydrate-on-visible
      data-home-section="news"
      :posts="latestPosts"
    />

    <LazyHomeToolsAndFooterSection
      hydrate-on-visible
      data-home-section="tools-gallery-footer"
    />
  </div>
</template>

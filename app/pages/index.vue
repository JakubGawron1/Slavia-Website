<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { Athlete } from '~/types/models'
import { sinclairTotal, type SinclairGender } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'
import { athleteProfilePath, blogPostPath } from '~/utils/slug'
import { resolveCmsMediaUrl } from '~/utils/cmsAssets'
import { stripHtmlTags } from '~/utils/html'

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

const config = useRuntimeConfig()

function postImageSrc(url?: string) {
  return resolveCmsMediaUrl(url || '', String(config.public.cmsBaseUrl || ''))
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

interface ChampionRow {
  id: string
  full_name: string
  image_url?: string | null
  total: number
  sinclair: number
  weightCategory: string | null
  birthYear: number | null
}

/** Top 3 zawodników klubu liczeni po Sinclairze z PB (wpisywane przez trenera/admina). */
const champions = computed<ChampionRow[]>(() => {
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

function formatPostDate(d?: string | null) {
  if (!d) return ''
  try {
    return format(parseISO(d), "d MMM yyyy", { locale: pl })
  } catch {
    return ''
  }
}

function postExcerpt(p: BlogPost, maxLen = 160) {
  const txt = stripHtmlTags(p.content ?? '').replace(/\s+/g, ' ').trim()
  if (txt.length <= maxLen) return txt
  return `${txt.slice(0, maxLen).trim()}…`
}

const { mobileDownloadHref, mobileDownloadLabel } = useMobileAppRelease()

interface TrainingGroup {
  id: string
  label: string
  ageRange: string
  description: string
  highlights: string[]
  icon: string
  accent: string
}

const groups: TrainingGroup[] = [
  {
    id: 'youth',
    label: 'Młodzicy / Młodziczki',
    ageRange: '11–14 lat',
    description:
      'Pierwszy kontakt ze sztangą — technika ćwiczeń pomocniczych, koordynacja i ogólnorozwojówka. Bez ścigania się z ciężarem.',
    highlights: [
      'Bezpieczna nauka rwania i podrzutu',
      'Mobilność i stabilizacja na lata',
      'Aktywne zabawy i wzmacnianie ogółu'
    ],
    icon: 'i-lucide-sparkles',
    accent: 'from-success/15 to-success/0 border-success/35 text-success'
  },
  {
    id: 'junior',
    label: 'Juniorzy / Juniorki',
    ageRange: '15–20 lat',
    description:
      'Pełnoprawne treningi dwuboju — progres techniczny, plan startowy i pierwsze poważne zawody. Łączymy szkołę ze sportem.',
    highlights: [
      'Indywidualne plany treningowe',
      'Starty w lidze śląskiej i mistrzostwach Polski',
      'Prowadzenie obozów i zgrupowań'
    ],
    icon: 'i-lucide-trending-up',
    accent: 'from-amber-500/15 to-amber-500/0 border-amber-500/30 text-amber-600 dark:text-amber-300'
  },
  {
    id: 'senior',
    label: 'Senior / Open',
    ageRange: '20+ lat',
    description:
      'Trening dla dorosłych — od „chcę spróbować" po starty w zawodach mastersów. Praca pod indywidualne cele i tryb życia.',
    highlights: [
      'Plan dopasowany do pracy/życia',
      'Konsultacje techniczne i wideoanaliza',
      'Możliwość startu w zawodach klubowych'
    ],
    icon: 'i-lucide-flame',
    accent: 'from-primary/20 to-primary/0 border-primary/30 text-primary'
  }
]

interface ClubTool {
  to: string
  label: string
  description: string
  icon: string
}

const tools: ClubTool[] = [
  {
    to: '/zawodnicy',
    label: 'Zawodnicy i wyniki',
    description: 'Pełna lista kadry, ranking Sinclair i tablica startów z zawodów.',
    icon: 'i-lucide-trophy'
  },
  {
    to: '/kalkulator-sinclair',
    label: 'Kalkulator Sinclair',
    description: 'Przelicz dwubój na punkty Sinclair zgodnie ze wzorem 2025–2028.',
    icon: 'i-lucide-calculator'
  },
  {
    to: '/kalkulator-proporcji',
    label: 'Kalkulator proporcji',
    description: '„Złote standardy" relacji między bojami — szybki audyt swoich maxów.',
    icon: 'i-lucide-sliders-horizontal'
  },
  {
    to: '/kalkulator-max-pr',
    label: 'Kalkulator Max PR',
    description: 'Szacuj 1RM z ciężaru i powtórzeń — przysiad, wycisk, martwy i inne ćwiczenia.',
    icon: 'i-lucide-dumbbell'
  },
  {
    to: '/aktualnosci',
    label: 'Aktualności klubu',
    description: 'Relacje z zawodów, nowinki organizacyjne i życie sekcji.',
    icon: 'i-lucide-newspaper'
  },
  {
    to: '/galeria',
    label: 'Galeria',
    description: 'Zdjęcia i filmy z treningów oraz startów na zawodach.',
    icon: 'i-lucide-camera'
  },
  {
    to: '/o-klubie',
    label: 'O klubie',
    description: 'Historia sekcji, kamienie milowe i tradycja CKS Slavia od założenia.',
    icon: 'i-lucide-history'
  },
  {
    to: '/kontakt',
    label: 'Kontakt',
    description: 'Napisz do nas — pomożemy zacząć przygodę z ciężarami.',
    icon: 'i-lucide-mail'
  }
]

interface FaqItem {
  q: string
  a: string
}

const faq: FaqItem[] = [
  {
    q: 'Czy muszę mieć doświadczenie, żeby zacząć trenować?',
    a: 'Nie. Zdecydowana większość zawodników i zawodniczek przyszła do nas „z ulicy". Pierwsze tygodnie to bezpieczna nauka techniki i ogólnorozwojówka — bez ścigania się z ciężarami.'
  },
  {
    q: 'Czy potrzebuję własnego sprzętu na początek?',
    a: 'Wystarczą wygodne ubrania sportowe i zmienne obuwie. Sztangi, krążki i sprzęt techniczny — wszystko mamy na sali. Buty „lifterki" przydają się dopiero, gdy serio zaczynasz trenować dwubój.'
  },
  {
    q: 'Od jakiego wieku można dołączyć?',
    a: 'Standardowo prowadzimy grupy od ok. 11 roku życia. W indywidualnych przypadkach (np. rodzeństwo starszych zawodników) decyzję podejmuje trener po krótkim spotkaniu zapoznawczym.'
  },
  {
    q: 'Jak wygląda pierwszy trening?',
    a: 'Spokojnie. Zaczynamy od rozmowy o celach i zdrowiu, potem rozgrzewka, podstawowe ćwiczenia ogólnorozwojowe i pierwsze próby z drążkiem PCV lub bardzo lekką sztangą. Bez stresu.'
  },
  {
    q: 'Czy w klubie startują też dziewczyny i kobiety?',
    a: 'Oczywiście. Sekcja kobieca rośnie z roku na rok — startują w zawodach śląskich i ogólnopolskich, a sala zawsze jest „miksowana".'
  }
]

const trainingDays = [
  { day: 'Poniedziałek', hours: '15:00 – 18:00' },
  { day: 'Środa', hours: '15:00 – 18:00' },
  { day: 'Piątek', hours: '15:00 – 18:00' }
]
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
            <span class="bg-linear-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
              <CmsEditable
                page-name="home"
                field-key="hero_title_accent"
                type="text"
                label="Akcent tytułu"
                tag="span"
                fallback="Slavia."
              />
            </span>
          </h1>

          <p class="mt-6 max-w-3xl text-pretty text-base leading-relaxed text-muted sm:text-lg lg:text-xl">
            <CmsEditable
              page-name="home"
              field-key="hero_subtitle"
              type="html"
              label="Podtytuł hero"
              tag="span"
              fallback="Klub podnoszenia ciężarów z tradycją i pasją. Trenujemy młodzież i dorosłych — od pierwszych kroków na platformie po starty w zawodach ogólnopolskich. Zapraszamy do <strong>Rudy Śląskiej</strong>."
            />
          </p>

          <div class="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:gap-4">
            <UButton
              to="/zawodnicy"
              prefetch
              prefetch-on="interaction"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              class="min-h-12 justify-center font-bold sm:min-h-0"
            >
              Poznaj zawodników
            </UButton>
            <UButton
              to="/aktualnosci"
              prefetch
              prefetch-on="interaction"
              size="xl"
              color="neutral"
              variant="subtle"
              icon="i-lucide-newspaper"
              class="min-h-12 justify-center font-bold sm:min-h-0"
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
              class="min-h-12 justify-center font-bold sm:min-h-0"
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
              variant="subtle"
              icon="i-lucide-smartphone"
              class="min-h-12 justify-center font-bold sm:min-h-0"
            >
              {{ mobileDownloadLabel }}
            </UButton>
          </div>
        </div>

        <!-- Pasek statystyk klubu -->
        <div class="mt-14 grid gap-3 rounded-3xl border border-default/60 bg-elevated/75 p-5 shadow-sm ring-1 ring-default/30 backdrop-blur-sm dark:bg-card/95 sm:p-6 lg:mt-20 lg:grid-cols-4">
          <div class="flex flex-col items-start gap-1 rounded-2xl bg-primary/5 p-5 ring-1 ring-primary/15 lg:items-center lg:text-center">
            <div class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              <UIcon name="i-lucide-users" class="size-4" />
              Aktywni zawodnicy
            </div>
            <p class="font-mono text-3xl font-black text-highlighted tabular-nums sm:text-4xl">
              {{ stats.activeCount }}
            </p>
            <p class="text-xs text-muted">
              w tym {{ stats.womenCount }} K · {{ stats.menCount }} M
            </p>
          </div>

          <div class="flex flex-col items-start gap-1 rounded-2xl bg-amber-500/5 p-5 ring-1 ring-amber-500/15 lg:items-center lg:text-center">
            <div class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-trophy" class="size-4" />
              Najlepszy Sinclair
            </div>
            <p class="font-mono text-3xl font-black text-highlighted tabular-nums sm:text-4xl">
              {{ stats.bestSinclair > 0 ? stats.bestSinclair.toFixed(1) : '—' }}
            </p>
            <p class="text-xs text-muted">
              w klubie (2025–2028)
            </p>
          </div>

          <div class="flex flex-col items-start gap-1 rounded-2xl bg-info/6 p-5 ring-1 ring-info/20 lg:items-center lg:text-center">
            <div class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-info">
              <UIcon name="i-lucide-dumbbell" class="size-4" />
              Najwyższa suma
            </div>
            <p class="font-mono text-3xl font-black text-highlighted tabular-nums sm:text-4xl">
              {{ stats.heaviestTotal > 0 ? `${stats.heaviestTotal} kg` : '—' }}
            </p>
            <p class="text-xs text-muted">
              klubowy rekord PB
            </p>
          </div>

          <div class="flex flex-col items-start gap-1 rounded-2xl bg-success/6 p-5 ring-1 ring-success/20 lg:items-center lg:text-center">
            <div class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-success">
              <UIcon name="i-lucide-calendar-days" class="size-4" />
              Treningi
            </div>
            <p class="font-mono text-3xl font-black text-highlighted tabular-nums sm:text-4xl">
              3×
            </p>
            <p class="text-xs text-muted">
              w tygodniu, Pon–Śr–Pt
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- TRZY FILARY -->
    <section class="relative py-12 lg:py-20">
      <UContainer>
        <div class="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
          <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            <CmsEditable page-name="home" field-key="pillars_eyebrow" type="text" label="Filary — odznaka" fallback="Kim jesteśmy" />
          </p>
          <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
            <CmsEditable page-name="home" field-key="pillars_title" type="text" label="Filary — tytuł" tag="span" fallback="Sport, ludzie i zdrowy progres" />
          </h2>
          <p class="mt-4 text-pretty text-base leading-relaxed text-muted lg:text-lg">
            <CmsEditable
              page-name="home"
              field-key="pillars_subtitle"
              type="text"
              label="Filary — opis"
              tag="span"
              fallback="Slavia to nie tylko medalowe nazwiska — to przede wszystkim ludzie, codzienna praca i bezpieczna nauka techniki, która ma służyć zdrowiu na lata."
            />
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-3">
          <div class="group relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-card via-card to-primary/5 p-6 shadow-sm ring-1 ring-default/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-primary/30 lg:p-8">
            <div class="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/8 blur-2xl transition-all group-hover:bg-primary/15" />
            <div class="relative">
              <div class="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
                <UIcon name="i-lucide-users-round" class="size-6" />
              </div>
              <h3 class="text-xl font-black text-highlighted">
                <CmsEditable page-name="home" field-key="pillar_community_title" type="text" label="Filar 1 — tytuł" tag="span" fallback="Społeczność" />
              </h3>
              <p class="mt-3 text-sm leading-relaxed text-muted">
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

          <div class="group relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-card via-card to-amber-500/5 p-6 shadow-sm ring-1 ring-default/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-amber-500/30 lg:p-8">
            <div class="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
            <div class="relative">
              <div class="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
                <UIcon name="i-lucide-medal" class="size-6" />
              </div>
              <h3 class="text-xl font-black text-highlighted">
                <CmsEditable page-name="home" field-key="pillar_sport_title" type="text" label="Filar 2 — tytuł" tag="span" fallback="Sport i rozwój" />
              </h3>
              <p class="mt-3 text-sm leading-relaxed text-muted">
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

          <div class="group relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-card via-card to-success/5 p-6 shadow-sm ring-1 ring-default/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-success/30 lg:p-8">
            <div class="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-success/12 blur-2xl transition-all group-hover:bg-success/22" />
            <div class="relative">
              <div class="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-success/12 text-success ring-1 ring-success/30">
                <UIcon name="i-lucide-heart-pulse" class="size-6" />
              </div>
              <h3 class="text-xl font-black text-highlighted">
                <CmsEditable page-name="home" field-key="pillar_health_title" type="text" label="Filar 3 — tytuł" tag="span" fallback="Zdrowy trening" />
              </h3>
              <p class="mt-3 text-sm leading-relaxed text-muted">
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

    <!-- MISTRZOWIE KLUBU - top 3 Sinclair -->
    <section
      v-if="champions.length > 0"
      class="relative py-12 lg:py-20"
    >
      <UContainer>
        <div class="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
          <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
            Mistrzowie klubu
          </p>
          <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
            Top {{ champions.length }} Sinclair
          </h2>
          <p class="mt-4 text-pretty text-base leading-relaxed text-muted lg:text-lg">
            Aktualne podium klubowe według punktów Sinclair (wzór IWF 2025–2028) — niezależne od kategorii wagowej i płci.
          </p>
        </div>

        <div class="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3 sm:items-end sm:gap-6">
          <NuxtLink
            v-for="p in champions"
            :key="`pod-${p.id}`"
            :to="athleteProfilePath(p.full_name, p.id)"
            class="group relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-b from-card to-card/80 p-5 text-center shadow-sm ring-1 ring-default/30 transition-all hover:-translate-y-1 hover:shadow-xl"
            :class="{
              'order-1 sm:order-2 sm:scale-105 sm:border-amber-500/40 sm:ring-amber-500/30 sm:shadow-lg': p === champions[0],
              'order-2 sm:order-1 sm:border-slate-400/30 sm:ring-slate-400/20': p === champions[1],
              'order-3 sm:order-3 sm:border-amber-700/30 sm:ring-amber-700/20': p === champions[2]
            }"
          >
            <div
              class="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl"
              :class="{
                'bg-linear-to-r from-amber-300 via-amber-500 to-amber-300': p === champions[0],
                'bg-linear-to-r from-slate-300 via-slate-400 to-slate-300': p === champions[1],
                'bg-linear-to-r from-amber-600 via-amber-700 to-amber-600': p === champions[2]
              }"
            />
            <div class="relative mx-auto mt-3 size-24 sm:size-28">
              <UAvatar
                :src="p.image_url || undefined"
                :alt="p.full_name"
                size="3xl"
                class="size-full ring-4 ring-card shadow-lg"
              />
              <div
                class="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full text-sm font-black text-white shadow-lg ring-4 ring-card"
                :class="{
                  'bg-amber-500': p === champions[0],
                  'bg-slate-500': p === champions[1],
                  'bg-amber-700': p === champions[2]
                }"
              >
                {{ p === champions[0] ? '1' : p === champions[1] ? '2' : '3' }}
              </div>
            </div>
            <p class="mt-5 text-base font-black text-highlighted group-hover:text-primary">
              {{ p.full_name }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ p.weightCategory || '—' }}
            </p>
            <div class="mt-4 flex items-center justify-center gap-3 text-sm">
              <span class="rounded-full bg-muted/30 px-3 py-1 font-mono font-bold text-highlighted tabular-nums">
                {{ p.total }} kg
              </span>
              <span class="rounded-full bg-amber-500/15 px-3 py-1 font-mono font-black text-amber-700 tabular-nums dark:text-amber-300">
                {{ p.sinclair }}
              </span>
            </div>
          </NuxtLink>
        </div>

        <div class="mt-10 flex justify-center">
          <UButton
            to="/zawodnicy"
            size="lg"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-arrow-right"
            class="font-bold"
          >
            Pełny ranking i lista zawodników
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- HISTORIA KLUBU -->
    <section class="relative py-12 lg:py-20">
      <UContainer>
        <ClubHistoryTimeline
          :limit="4"
          compact
          heading-id="home-club-history-heading"
        />
        <div class="mt-10 flex justify-center">
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
    <section class="relative py-12 lg:py-20">
      <UContainer>
        <div class="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
          <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            Co Cię czeka na sali
          </p>
          <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
            Trzy grupy, jeden klub
          </h2>
          <p class="mt-4 text-pretty text-base leading-relaxed text-muted lg:text-lg">
            Niezależnie od tego czy masz 11 czy 41 lat — znajdziemy dla Ciebie miejsce. Trenujemy razem na sali, ale plan
            zawsze jest dopasowany do możliwości i celów.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-3">
          <div
            v-for="g in groups"
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

    <!-- AKTUALNOŚCI -->
    <section
      v-if="latestPosts.length > 0"
      class="relative py-12 lg:py-20"
    >
      <UContainer>
        <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
          <div class="min-w-0">
            <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
              Z życia klubu
            </p>
            <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
              Najnowsze aktualności
            </h2>
          </div>
          <UButton
            to="/aktualnosci"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-arrow-right"
            size="md"
            class="self-start font-bold sm:self-auto"
          >
            Wszystkie wpisy
          </UButton>
        </div>

        <div class="grid gap-5 md:grid-cols-3">
          <NuxtLink
            v-for="p in latestPosts"
            :key="p.id"
            :to="blogPostPath(p.title, p.id)"
            class="group flex flex-col overflow-hidden rounded-3xl border border-default/60 bg-card shadow-sm ring-1 ring-default/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-primary/30"
          >
            <div class="aspect-16/10 w-full overflow-hidden bg-muted/30">
              <img
                v-if="p.image_url"
                :src="postImageSrc(p.image_url)"
                :alt="p.title"
                width="640"
                height="400"
                class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              >
              <div
                v-else
                class="flex size-full items-center justify-center bg-linear-to-br from-primary/20 via-primary/5 to-amber-500/10"
              >
                <UIcon name="i-lucide-newspaper" class="size-12 text-primary/40" />
              </div>
            </div>
            <div class="flex flex-1 flex-col p-5">
              <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
                {{ formatPostDate(p.created_at) }}
              </p>
              <h3 class="mt-2 text-lg font-black leading-tight text-highlighted group-hover:text-primary">
                {{ p.title }}
              </h3>
              <p class="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {{ postExcerpt(p) }}
              </p>
              <div class="mt-5 flex items-center gap-2 text-sm font-bold text-primary">
                Czytaj dalej
                <UIcon name="i-lucide-arrow-right" class="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </NuxtLink>
        </div>
      </UContainer>
    </section>

    <!-- NARZĘDZIA KLUBU -->
    <section class="relative py-12 lg:py-20">
      <UContainer>
        <div class="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
          <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            <CmsEditable page-name="home" field-key="tools_eyebrow" type="text" label="Narzędzia — odznaka" fallback="Narzędzia" />
          </p>
          <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
            <CmsEditable page-name="home" field-key="tools_title" type="text" label="Narzędzia — tytuł" tag="span" fallback="Wszystko w jednym miejscu" />
          </h2>
          <p class="mt-4 text-pretty text-base leading-relaxed text-muted lg:text-lg">
            <CmsEditable
              page-name="home"
              field-key="tools_subtitle"
              type="text"
              label="Narzędzia — opis"
              tag="span"
              fallback="Ranking Sinclair, kalkulatory, blog, galeria i kontakt — żeby trenować mądrzej i być na bieżąco z życiem klubu."
            />
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="t in tools"
            :key="t.to"
            :to="t.to"
            class="group relative flex items-start gap-4 rounded-2xl border border-default/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
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
                  <p class="mt-1 text-sm leading-relaxed text-muted">
                    <CmsEditable
                      page-name="home"
                      field-key="location_address"
                      type="html"
                      label="Adres"
                      tag="span"
                      fallback="CKS Slavia Ruda Śląska<br>ul. Konopnickiej 13<br>41-700 Ruda Śląska"
                    />
                  </p>
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
                      v-for="d in trainingDays"
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
    <section class="relative py-12 lg:py-20">
      <UContainer>
        <div class="mx-auto max-w-3xl">
          <div class="mb-10 text-center lg:mb-14">
            <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
              Najczęstsze pytania
            </p>
            <h2 class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
              Zanim przyjdziesz po raz pierwszy
            </h2>
          </div>

          <UAccordion
            :items="faq.map(f => ({ label: f.q, content: f.a }))"
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
            <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
              <UButton
                to="/kontakt"
                size="xl"
                trailing-icon="i-lucide-arrow-right"
                class="min-h-12 justify-center font-bold sm:min-h-0"
              >
                Umów pierwszy trening
              </UButton>
              <UButton
                to="/zawodnicy"
                size="xl"
                color="neutral"
                variant="subtle"
                icon="i-lucide-trophy"
                class="min-h-12 justify-center font-bold sm:min-h-0"
              >
                Zobacz drużynę
              </UButton>
            </div>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

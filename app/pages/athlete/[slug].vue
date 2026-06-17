<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { SinclairGender } from '~/utils/sinclair'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'
import { cmsRoutePageName } from '~/utils/cmsRoutePage'
import AthleteProgressChart from '~/components/AthleteProgressChart.vue'
import AthleteCombinedChart from '~/components/AthleteCombinedChart.vue'

const route = useRoute()
const auth = useAuth()
const toast = useToast()
const requestUrlState = useRequestURL()

definePageMeta({
  backTo: '/zawodnicy',
  backLabel: 'Lista zawodników'
})

const {
  shareLite,
  athleteId,
  canViewAthleteTraining,
  canEditAthlete,
  athlete,
  error,
  results,
  trainingResults
} = await useAthletePublicProfilePage()

if (error.value || !athlete.value) {
  throw createError({ statusCode: 404, statusMessage: 'Zawodnik nie znaleziony', fatal: true })
}

const profileHeroBio = computed(
  () =>
    athlete.value?.public_bio?.trim()
    || athlete.value?.profile_tagline?.trim()
    || `Profil zawodnika ${athlete.value!.full_name} w CKS Slavia Ruda Śląska.`
)

const publicProfileUrl = computed(() => {
  const base = String(requestUrlState.origin || '').replace(/\/$/, '')
  return `${base}${route.path}`
})

useSeoMeta({
  title: `${athlete.value.full_name} — Slavia`,
  description: profileHeroBio.value.slice(0, 320),
  ogTitle: athlete.value.full_name,
  ogDescription: profileHeroBio.value.slice(0, 300),
  ogImage: athlete.value.image_url || '/logo.png',
  ogType: 'profile'
})

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: athlete.value?.full_name,
        url: publicProfileUrl.value,
        image: athlete.value?.image_url || undefined,
        description: profileHeroBio.value,
        memberOf: {
          '@type': 'SportsOrganization',
          name: 'CKS Slavia Ruda Śląska'
        }
      })
    }
  ]
}))

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: pl })
  } catch {
    return dateStr
  }
}

function formatBoardDate(d: string) {
  try {
    return format(parseISO(d.slice(0, 10)), 'd MMM yyyy', { locale: pl })
  } catch {
    return d.slice(0, 10)
  }
}

function genderLabel(g: string | null | undefined) {
  if (g === 'male') return 'Mężczyzna'
  if (g === 'female') return 'Kobieta'
  return null
}

function cardGender(g: string | null | undefined): SinclairGender | null {
  return g === 'male' || g === 'female' ? g : null
}

const {
  approvedResults,
  approvedTraining,
  approvedTrainingSorted,
  competitionPbDisplay,
  trainingStripKpi,
  progressSeries,
  combinedSeries,
  combinedStats,
  showCombinedSection,
  publicStats,
  approvedSinclair
} = useAthletePublicProfileCharts({
  athlete,
  results,
  trainingResults,
  canViewAthleteTraining,
  isLoggedIn: auth.isLoggedIn,
  shareLite
})

const cmsAthletePageName = computed(() => cmsRoutePageName(route.path as string))

useProvideCmsPageData(cmsAthletePageName, () => {
  const a = athlete.value
  if (!a) return {}
  const sg = cardGender(a.gender ?? undefined)
  const eff = effectiveBodyweightKgForSinclair(a)
  const bestTotal = publicStats.value.bestTotal
  let bestSinclair = ''
  if (sg && bestTotal && eff > 0) {
    bestSinclair = sinclairTotal(bestTotal, eff, sg).toFixed(2)
  }
  return {
    imie_zawodnika: a.full_name,
    kategoria_wagowa: a.weight_category ?? '',
    rok_urodzenia: a.birth_year ?? '',
    plec_zawodnika: a.gender === 'female' ? 'K' : a.gender === 'male' ? 'M' : '',
    najlepszy_total: bestTotal != null ? `${bestTotal} kg` : '',
    najlepszy_sinclair: bestSinclair,
    liczba_startow: publicStats.value.totalStarts
  }
})

const nameInitials = computed(() => {
  const name = (athlete.value?.full_name || '').trim()
  if (!name) return ''
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
})

const profileTagline = computed(() => athlete.value?.profile_tagline?.trim() || '')
const publicBioText = computed(() => athlete.value?.public_bio?.trim() || '')
const heroDescription = computed(() => {
  if (profileTagline.value) return profileTagline.value
  return ''
})
const showBioSection = computed(() => {
  const bio = publicBioText.value
  const tagline = profileTagline.value
  return !!(bio && (!tagline || bio !== tagline))
})

const resumeShareUrl = computed(() => `${requestUrlState.origin}${route.path}?share=1`)

async function copyResumeShareLink() {
  if (!import.meta.client || !resumeShareUrl.value) return
  try {
    await navigator.clipboard.writeText(resumeShareUrl.value)
    toast.add({
      title: 'Skopiowano link publiczny',
      description: 'Widok dla mediów bez sekcji treningowych (?share=1).',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'Nie udało się skopiować linku', color: 'warning' })
  }
}

function printAthleteResume() {
  if (import.meta.client) window.print()
}

const profileMoreActions = computed(() => {
  if (approvedResults.value.length === 0) return []
  const items = [
    { label: 'Kopiuj link (media)', icon: 'i-lucide-share-2', onSelect: () => copyResumeShareLink() }
  ]
  if (shareLite.value) {
    items.push({ label: 'Drukuj', icon: 'i-lucide-printer', onSelect: async () => { printAthleteResume() } })
  }
  return [items]
})
</script>

<template>
  <PublicPageLayout padding="flush" :ambient="false">
    <section class="border-b border-default/60">
      <div class="py-5 sm:py-7">
        <PublicPageHeader
          back-to="/zawodnicy"
          back-label="Lista zawodników"
          class="mb-4 sm:mb-5"
        />

        <article class="slavia-page-card overflow-hidden">
          <div class="flex flex-col sm:flex-row">
            <div class="relative mx-auto w-full max-w-xs shrink-0 bg-muted/20 sm:mx-0 sm:max-w-[11.5rem] md:max-w-[13rem]">
              <img
                v-if="athlete!.image_url"
                :src="athlete!.image_url"
                :alt="`Zdjęcie ${athlete!.full_name}`"
                class="aspect-4/5 w-full object-cover sm:aspect-auto sm:h-full sm:min-h-52"
              >
              <div
                v-else
                class="flex aspect-4/5 w-full items-center justify-center bg-muted/30 sm:aspect-auto sm:min-h-52"
              >
                <span class="font-display text-5xl font-black text-muted/50">
                  {{ nameInitials || '—' }}
                </span>
              </div>
            </div>

            <div class="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    CKS Slavia Ruda Śląska
                  </p>
                  <h1 class="mt-1 text-2xl font-black leading-tight tracking-tight text-highlighted sm:text-3xl">
                    {{ athlete!.full_name }}
                  </h1>
                </div>
                <UBadge
                  v-if="athlete && athlete.is_active === false"
                  color="warning"
                  variant="subtle"
                  size="sm"
                >
                  Nieaktywny
                </UBadge>
                <UBadge
                  v-else
                  color="success"
                  variant="subtle"
                  size="sm"
                >
                  Aktywny
                </UBadge>
              </div>

              <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
                <div v-if="athlete!.weight_category">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-muted">
                    Kategoria
                  </dt>
                  <dd class="mt-0.5 font-semibold text-highlighted">
                    {{ athlete!.weight_category }}
                  </dd>
                </div>
                <div v-if="athlete!.bodyweight != null">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-muted">
                    Waga
                  </dt>
                  <dd class="mt-0.5 font-mono font-semibold text-highlighted">
                    {{ athlete!.bodyweight }} kg
                  </dd>
                </div>
                <div v-if="genderLabel(athlete!.gender)">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-muted">
                    Płeć
                  </dt>
                  <dd class="mt-0.5 font-semibold text-highlighted">
                    {{ genderLabel(athlete!.gender) }}
                  </dd>
                </div>
                <div v-if="athlete!.birth_year">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-muted">
                    Rocznik
                  </dt>
                  <dd class="mt-0.5 font-semibold text-highlighted">
                    {{ athlete!.birth_year }}
                  </dd>
                </div>
                <div v-if="publicStats.totalStarts > 0">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-muted">
                    Starty
                  </dt>
                  <dd class="mt-0.5 font-semibold text-highlighted">
                    {{ publicStats.totalStarts }}
                  </dd>
                </div>
              </dl>

              <p
                v-if="heroDescription"
                class="mt-4 text-sm leading-relaxed text-muted"
              >
                {{ heroDescription }}
              </p>

              <UAlert
                v-if="athlete && athlete.is_active === false"
                class="mt-4"
                color="warning"
                variant="subtle"
                icon="i-lucide-user-x"
                title="Profil w archiwum kadry"
                description="Dane historyczne pozostają dostępne — zawodnik nie jest na liście aktywnej kadry."
              />

              <div class="mt-5 flex flex-wrap items-center gap-2">
                <UButton
                  v-if="canEditAthlete && athleteId"
                  :to="`/trainer/zawodnicy?edit=${encodeURIComponent(String(athleteId))}`"
                  color="primary"
                  size="sm"
                  icon="i-lucide-pencil"
                >
                  Edytuj profil
                </UButton>
                <UButton
                  v-if="approvedResults.length > 0"
                  to="#progres"
                  variant="soft"
                  color="primary"
                  size="sm"
                  icon="i-lucide-trending-up"
                >
                  Progres
                </UButton>
                <UButton
                  v-if="approvedResults.length > 0"
                  to="#historia-startow"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  icon="i-lucide-list"
                >
                  Historia
                </UButton>
                <UDropdownMenu
                  v-if="profileMoreActions.length > 0"
                  :items="profileMoreActions"
                >
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    icon="i-lucide-ellipsis"
                    aria-label="Więcej akcji"
                  />
                </UDropdownMenu>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- ========== KPI STRIP (zawody / publiczne) ========== -->
    <section class="slavia-page-bleed border-b border-default/60 bg-muted/5">
      <div class="py-0">
        <p
          v-if="approvedResults.length > 0"
          class="border-b border-default/40 bg-muted/30 px-5 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90 sm:px-6"
        >
          Rekordy z zatwierdzonych startów zawodowych
        </p>
        <div class="grid grid-cols-2 gap-px bg-default/40 lg:grid-cols-4">
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-up" class="size-4" />
              Rwanie · PB
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ competitionPbDisplay.snatch ?? '—' }}
              <span
                v-if="competitionPbDisplay.snatch != null"
                class="text-sm font-semibold text-muted"
              >kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-down" class="size-4" />
              Podrzut · PB
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ competitionPbDisplay.cleanJerk ?? '—' }}
              <span
                v-if="competitionPbDisplay.cleanJerk != null"
                class="text-sm font-semibold text-muted"
              >kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-success dark:text-success">
              <UIcon name="i-lucide-trophy" class="size-4" />
              Total · rekord
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-success dark:text-success sm:text-4xl">
              {{ competitionPbDisplay.total ?? '—' }}
              <span
                v-if="competitionPbDisplay.total != null"
                class="text-sm font-semibold text-muted"
              >kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-star" class="size-4" />
              Sinclair
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-amber-600 dark:text-amber-300 sm:text-4xl">
              {{ approvedSinclair ?? '—' }}
              <span
                v-if="approvedSinclair != null"
                class="text-sm font-semibold text-muted"
              >pkt</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== KPI TRENING (tylko zalogowani) — ta sama siatka co zawody, inna etykieta ========== -->
    <section
      v-if="canViewAthleteTraining && trainingStripKpi && !shareLite"
      class="slavia-page-bleed border-b border-default/60 bg-muted/5"
    >
      <div class="py-0">
        <p class="border-b border-default/40 bg-muted/30 px-5 py-2.5 text-center sm:px-6">
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90">Trening (sala)</span>
          <span class="mx-2 hidden text-default/35 sm:inline">·</span>
          <span class="mt-1 block text-[11px] font-medium leading-snug tracking-normal text-muted sm:mt-0 sm:inline">
            Osobno od zawodów — bez wpływu na PB i ranking publiczny.
          </span>
        </p>
        <div class="grid grid-cols-2 gap-px bg-default/40 lg:grid-cols-4">
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-up" class="size-4" />
              Rwanie · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ trainingStripKpi.snatch }}
              <span class="text-sm font-semibold text-muted">kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
              <UIcon name="i-game-icons-weight-lifting-down" class="size-4" />
              Podrzut · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-primary sm:text-4xl">
              {{ trainingStripKpi.cleanJerk }}
              <span class="text-sm font-semibold text-muted">kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-success dark:text-success">
              <UIcon name="i-lucide-dumbbell" class="size-4 opacity-90" />
              Total · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-success dark:text-success sm:text-4xl">
              {{ trainingStripKpi.total }}
              <span class="text-sm font-semibold text-muted">kg</span>
            </p>
          </div>
          <div class="bg-background/95 px-5 py-6 sm:px-6 sm:py-7">
            <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              <UIcon name="i-lucide-star" class="size-4" />
              Sinclair · trening
            </p>
            <p class="mt-2 font-mono text-3xl font-black text-amber-600 dark:text-amber-300 sm:text-4xl">
              {{ trainingStripKpi.sinclair ?? '—' }}
              <span
                v-if="trainingStripKpi.sinclair != null"
                class="text-sm font-semibold text-muted"
              >pkt</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <div class="slavia-content-well space-y-12 py-8 sm:py-10 lg:space-y-16 lg:py-12">
        <!-- ========== BIO PULL-QUOTE ========== -->
        <section
          v-if="showBioSection"
          class="slavia-public-section relative"
        >
          <div class="slavia-page-card relative mx-auto max-w-4xl p-6 sm:p-8">
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              O zawodniku
            </p>
            <p class="mt-3 whitespace-pre-wrap text-base leading-relaxed text-highlighted/95">
              {{ publicBioText }}
            </p>
          </div>
        </section>

        <!-- ========== QUICK STATS ========== -->
        <section
          v-if="publicStats.totalStarts > 0"
          class="slavia-public-section"
        >
          <PublicSectionHead
            split
            eyebrow="Zawody"
            title="Statystyki w skrócie"
            lead="Podsumowanie zatwierdzonych startów — bez wpisów treningowych z sali."
          />
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="slavia-page-card slavia-page-card--flat p-5 transition hover:border-primary/30">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Liczba startów
              </p>
              <p class="mt-2 font-mono text-3xl font-bold text-highlighted">
                {{ publicStats.totalStarts }}
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Zatwierdzone starty z zawodów (bez treningów salowych).
              </p>
            </div>
            <div class="slavia-page-card slavia-page-card--flat p-5 transition hover:border-primary/30">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Średni total
              </p>
              <p class="mt-2 font-mono text-3xl font-bold text-highlighted">
                {{ publicStats.avgTotal ?? '—' }}<span v-if="publicStats.avgTotal != null" class="ml-1 text-sm font-semibold text-muted">kg</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Średnia z zatwierdzonych startów.
              </p>
            </div>
            <div class="slavia-page-card slavia-page-card--flat border-success/30 bg-linear-to-br from-success/12 to-success/6 p-5">
              <p class="text-[10px] font-bold uppercase tracking-wide text-success dark:text-success">
                Najlepszy total
              </p>
              <p class="mt-2 font-mono text-3xl font-bold text-success dark:text-success">
                {{ publicStats.bestTotal ?? '—' }}<span v-if="publicStats.bestTotal != null" class="ml-1 text-sm font-semibold text-muted">kg</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Maksimum z historii startów.
              </p>
            </div>
            <div class="slavia-page-card slavia-page-card--flat p-5 transition hover:border-primary/30">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Ostatni start
              </p>
              <p class="mt-2 font-mono text-2xl font-bold text-highlighted">
                <template v-if="publicStats.daysSinceLast == null">—</template>
                <template v-else-if="publicStats.daysSinceLast === 0">dziś</template>
                <template v-else>{{ publicStats.daysSinceLast }} <span class="text-sm font-semibold text-muted">dni temu</span></template>
              </p>
              <p
                v-if="publicStats.lastDate"
                class="mt-1 text-[11px] text-muted truncate"
              >
                {{ formatDate(publicStats.lastDate) }}<template v-if="publicStats.lastLocation"> · {{ publicStats.lastLocation }}</template>
              </p>
            </div>
          </div>
        </section>

        <!-- ========== WYKRES PROGRESJI ========== -->
        <section
          v-if="approvedResults.length > 0"
          id="progres"
          class="slavia-public-section scroll-mt-24"
        >
          <PublicSectionHead
            split
            eyebrow="Pomost"
            title="Progresja totalu — zawody"
            lead="Najedź punkt na wykresie — szczegóły startu."
          />
          <div class="slavia-page-card p-5 sm:p-7">
            <AthleteProgressChart :series="progressSeries" :height="260" />
          </div>
        </section>

        <!-- ========== ANALIZA ŁĄCZONA (auth) ========== -->
        <section
          v-if="showCombinedSection"
          id="analiza"
          class="slavia-public-section scroll-mt-24"
        >
          <PublicSectionHead
            split
            eyebrow="Trening + zawody"
            title="Analiza łączona"
            lead="Porównanie formy z sali i wyników z pomostu — widoczne po zalogowaniu."
          >
            <template #actions>
              <div class="flex flex-wrap items-center gap-3 text-[11px]">
                <span class="flex items-center gap-1.5">
                  <span class="inline-block h-2 w-3 rounded-full bg-primary" />
                  <span class="font-semibold text-highlighted">Zawody</span>
                  <span class="text-muted">({{ combinedStats.competitions }})</span>
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="inline-block h-1 w-3 rounded-full bg-info" />
                  <span class="font-semibold text-highlighted">Trening</span>
                  <span class="text-muted">({{ combinedStats.trainings }})</span>
                </span>
              </div>
            </template>
          </PublicSectionHead>

          <div class="slavia-page-card p-5 sm:p-7">
            <AthleteCombinedChart :series="combinedSeries" :height="260" />
            <p class="mt-3 text-right text-[11px] text-muted">
              Linia ciągła = zawody, przerywana = trening.
            </p>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-success/30 bg-linear-to-br from-success/12 to-success/6 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-success dark:text-success">
                Najlepszy total (łącznie)
              </p>
              <p class="mt-1.5 font-mono text-2xl font-bold text-success dark:text-success">
                {{ combinedStats.bestCombinedTotal ?? '—' }}<span v-if="combinedStats.bestCombinedTotal != null" class="ml-1 text-xs font-semibold text-muted">kg</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Z: <span class="font-mono font-semibold text-highlighted">{{ combinedStats.bestCompetitionTotal ?? '—' }}</span>
                · T: <span class="font-mono font-semibold text-highlighted">{{ combinedStats.bestTrainingTotal ?? '—' }}</span>
              </p>
            </div>
            <div class="rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/5 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Realizacja formy
              </p>
              <p class="mt-1.5 font-mono text-2xl font-bold text-amber-600 dark:text-amber-300">
                {{ combinedStats.formRealisationPct != null ? combinedStats.formRealisationPct + '%' : '—' }}
              </p>
              <p class="mt-1 text-[11px] leading-snug text-muted">
                <template v-if="combinedStats.formRealisationPct != null && combinedStats.formRealisationPct >= 100">
                  Pełna forma z sali na pomoście.
                </template>
                <template v-else-if="combinedStats.formRealisationPct != null">
                  Zostawia <span class="font-semibold text-highlighted">{{ (100 - combinedStats.formRealisationPct).toFixed(1) }}%</span> potencjału.
                </template>
                <template v-else>
                  Brak pary do porównania.
                </template>
              </p>
            </div>
            <div class="rounded-2xl border border-primary/25 bg-linear-to-br from-primary/10 to-primary/5 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-primary">
                Trend (90 dni)
              </p>
              <p
                class="mt-1.5 font-mono text-2xl font-bold"
                :class="combinedStats.trendKgLast90Days == null
                  ? 'text-muted'
                  : combinedStats.trendKgLast90Days > 0
                    ? 'text-success'
                    : combinedStats.trendKgLast90Days < 0
                      ? 'text-error'
                      : 'text-highlighted'"
              >
                <template v-if="combinedStats.trendKgLast90Days == null">—</template>
                <template v-else>
                  {{ combinedStats.trendKgLast90Days > 0 ? '+' : '' }}{{ combinedStats.trendKgLast90Days }}<span class="ml-1 text-xs font-semibold text-muted">kg</span>
                </template>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Δ średniego totalu vs. poprzednie 90 dni.
              </p>
            </div>
            <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Pobite rekordy
              </p>
              <p class="mt-1.5 font-mono text-2xl font-bold text-success">
                {{ combinedStats.pbCount }} <span class="text-xs font-normal text-muted">razy ↑</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Liczba PB w historii.
              </p>
            </div>
          </div>

          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-default/50 bg-background/60 p-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Średni total
              </p>
              <p class="mt-1 font-mono text-sm font-semibold text-highlighted">
                <span class="text-primary">Z</span> {{ combinedStats.avgCompetitionTotal ?? '—' }}
                <span class="mx-1 text-muted">/</span>
                <span class="font-semibold text-info">T</span> {{ combinedStats.avgTrainingTotal ?? '—' }}
              </p>
            </div>
            <div class="rounded-xl border border-default/50 bg-background/60 p-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Best Sinclair
              </p>
              <p class="mt-1 font-mono text-sm font-semibold text-amber-500 dark:text-amber-300">
                <span class="text-primary">Z</span> {{ combinedStats.bestSinclairCompetition ?? '—' }}
                <span class="mx-1 text-muted">/</span>
                <span class="font-semibold text-info">T</span> {{ combinedStats.bestSinclairTraining ?? '—' }}
              </p>
            </div>
            <div class="rounded-xl border border-default/50 bg-background/60 p-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                Najlepsze boje (łącznie)
              </p>
              <p class="mt-1 font-mono text-sm font-semibold text-highlighted">
                Rwanie {{ combinedStats.bestSnatch ?? '—' }}
                <span class="mx-1 text-muted">·</span>
                Podrzut {{ combinedStats.bestCleanJerk ?? '—' }}
              </p>
            </div>
          </div>
        </section>

        <!-- ========== HISTORIA STARTÓW ========== -->
        <section
          id="historia-startow"
          class="slavia-public-section scroll-mt-24"
        >
          <PublicSectionHead
            split
            eyebrow="Pomost i sala"
            title="Historia startów"
            lead="Zatwierdzone wyniki z zawodów; wpisy treningowe widoczne dla kadry i właściciela profilu."
          />

          <div
            class="grid gap-6"
            :class="canViewAthleteTraining ? 'lg:grid-cols-2' : ''"
          >
            <!-- ZAWODY -->
            <div class="slavia-page-card min-h-0 min-w-0 p-5 sm:p-6">
              <div class="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    <UIcon name="i-lucide-medal" class="size-4" />
                    Zawody
                  </p>
                  <p class="mt-0.5 text-xs text-muted">
                    Widok publiczny.
                  </p>
                </div>
                <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {{ approvedResults.length }} {{ approvedResults.length === 1 ? 'wpis' : 'wpisów' }}
                </span>
              </div>
              <div
                class="min-h-0 max-h-[min(70vh,34rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-0.5"
              >
              <ol class="relative space-y-3 border-l-2 border-primary/20 pl-5">
                <li
                  v-for="result in approvedResults.slice(0, 12)"
                  :key="result.id"
                  class="relative"
                >
                  <span class="absolute left-[-27px] top-2 size-3 rounded-full border-2 border-primary bg-background" />
                  <div class="rounded-xl border border-default/50 bg-background/60 p-4 transition hover:border-primary/40 hover:shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-highlighted">
                          {{ formatDate(result.date) }}
                        </p>
                        <p
                          v-if="result.location"
                          class="mt-0.5 flex items-center gap-1 text-xs text-muted"
                        >
                          <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
                          <span class="truncate">{{ result.location }}</span>
                        </p>
                      </div>
                      <p class="font-mono text-lg font-bold text-primary">
                        {{ result.total }} <span class="text-xs font-semibold text-muted">kg</span>
                      </p>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <p class="rounded-md bg-muted/10 px-2 py-1 text-muted">
                        Rwanie <span class="font-mono font-semibold text-highlighted">{{ result.snatch }}</span>
                      </p>
                      <p class="rounded-md bg-muted/10 px-2 py-1 text-muted">
                        Podrzut <span class="font-mono font-semibold text-highlighted">{{ result.clean_and_jerk }}</span>
                      </p>
                    </div>
                  </div>
                </li>
                <li v-if="approvedResults.length === 0" class="list-none pl-0">
                  <PublicEmptyState
                    compact
                    icon="i-lucide-medal"
                    title="Brak zatwierdzonych wyników"
                    description="Wyniki z zawodów pojawią się po weryfikacji przez trenera lub administrację."
                  />
                </li>
              </ol>
              </div>
              <p
                v-if="approvedResults.length > 12"
                class="mt-3 text-center text-[11px] text-muted"
              >
                Pokazano 12 najnowszych z {{ approvedResults.length }}.
              </p>
            </div>

            <!-- TRENING (auth only) — tabela ostatnich wpisów (tylko ten zawodnik) -->
            <div
              v-if="canViewAthleteTraining"
              class="slavia-page-card min-h-0 min-w-0 p-5 sm:p-6"
            >
              <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    <UIcon name="i-lucide-dumbbell" class="size-4 text-primary/85" />
                    Ostatnie wpisy treningowe
                  </p>
                  <p class="mt-0.5 text-xs text-muted">
                    Widok kadry lub Twój własny profil — wpisy nie zmieniają publicznego PB ani rankingu zawodów.
                  </p>
                </div>
                <span class="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {{ approvedTraining.length }} {{ approvedTraining.length === 1 ? 'wpis' : 'wpisów' }}
                </span>
              </div>

              <PublicEmptyState
                v-if="approvedTrainingSorted.length === 0"
                compact
                icon="i-lucide-dumbbell"
                title="Brak wpisów treningowych"
                description="Zatwierdzone wyniki z sali pojawią się tutaj po weryfikacji."
              />

              <div
                v-else
                class="overflow-hidden rounded-xl border border-info/25 bg-linear-to-b from-info/6 to-background shadow-lg ring-1 ring-info/12"
              >
                <div class="border-b border-default/50 bg-muted/30 px-3 py-2 sm:px-4">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-info">
                    Kronika sali
                  </p>
                </div>
                <div class="max-h-[min(70vh,36rem)] overflow-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                  <div class="min-w-0 overflow-x-auto">
                    <table class="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr class="border-b border-default/60 bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted">
                          <th class="px-3 py-3 sm:px-4">Data</th>
                          <th class="hidden px-3 py-3 sm:table-cell sm:px-4">Miejsce</th>
                          <th class="px-3 py-3 text-right sm:px-4">Rwanie</th>
                          <th class="px-3 py-3 text-right sm:px-4">Podrzut</th>
                          <th class="px-3 py-3 text-right font-semibold sm:px-4">Razem</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-default/50">
                        <tr
                          v-for="r in approvedTrainingSorted.slice(0, 12)"
                          :key="`train-row-${r.id}`"
                          class="bg-background/80 transition-colors hover:bg-info/8"
                        >
                          <td class="whitespace-nowrap px-3 py-3 text-muted sm:px-4">
                            {{ formatBoardDate(r.date) }}
                          </td>
                          <td class="hidden max-w-40 truncate px-3 py-3 text-xs text-muted sm:table-cell sm:px-4">
                            <template v-if="r.location">{{ r.location }}</template>
                            <template v-else>—</template>
                          </td>
                          <td class="px-3 py-3 text-right tabular-nums text-muted sm:px-4">{{ r.snatch }} kg</td>
                          <td class="px-3 py-3 text-right tabular-nums text-muted sm:px-4">{{ r.clean_and_jerk }} kg</td>
                          <td class="px-3 py-3 text-right tabular-nums font-bold text-info sm:px-4">
                            {{ r.total }} kg
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <p
                v-if="approvedTrainingSorted.length > 12"
                class="mt-3 text-center text-[11px] text-muted"
              >
                Pokazano 12 najnowszych z {{ approvedTrainingSorted.length }}.
              </p>
            </div>
          </div>
        </section>

        <!-- ========== FOOTER NAVIGATION ========== -->
        <section class="slavia-page-card p-6 text-center sm:p-8">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Nawigacja
          </p>
          <h3 class="mt-2 text-xl font-bold text-highlighted sm:text-2xl">
            Sprawdź pozostałych zawodników klubu
          </h3>
          <p class="mt-2 mx-auto max-w-2xl text-sm leading-relaxed text-muted">
            Rozbudowany opis i slogan ustawiają trener, administrator lub superadministrator w panelu kadry.
          </p>
          <div class="mt-5 flex flex-wrap justify-center gap-2">
            <UButton
              to="/zawodnicy"
              color="primary"
              size="lg"
              icon="i-lucide-users"
            >
              Lista zawodników
            </UButton>
            <UButton
              to="/zawodnicy#wyniki-zawodow"
              variant="soft"
              color="primary"
              size="lg"
              icon="i-lucide-medal"
            >
              Wszystkie wyniki klubu
            </UButton>
          </div>
        </section>
      </div>
  </PublicPageLayout>
</template>

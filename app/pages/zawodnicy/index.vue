<script setup lang="ts">
import ClubHallOfFameRecordCard from '~/components/club/ClubHallOfFameRecordCard.vue'
import { athleteProfilePath } from '~/utils/slug'
import { zawodnikCardToHallRecordCard } from '~/utils/zawodnicyRanking'

const {
  players,
  bundlePending,
  error,
  status,
  categories,
  selectedCategory,
  filterActiveOnly,
  filterWeightThreshold,
  filterPaymentStaff,
  canUseStaffFilters,
  weightCategoryFilterOptions,
  mappedPlayers,
  podium,
  filteredRankings,
  trainingRanking,
  showTrainingSection,
  trainingPodium,
  exportKind,
  downloadRankingCsv,
  canSeeClubTrainingRanking
} = await useZawodnicyPage()

useProvideCmsPageData('zawodnicy', () => ({
  liczba_w_rankingu: filteredRankings.value.length,
  imie_zawodnika: podium.value[0]?.name ?? '',
  sinclair_lidera: podium.value[0]?.sinclair ? String(podium.value[0].sinclair) : '',
  imie_zawodnika_2: podium.value[1]?.name ?? '',
  imie_zawodnika_3: podium.value[2]?.name ?? ''
}))

useSeoMeta({
  title: 'Zawodnicy i ranking — Slavia Ruda Śląska',
  description:
    'Kadra CKS Slavia Ruda Śląska oraz ranking Sinclair. Kadra po zalogowaniu widzi wewnętrzny ranking treningowy klubu.',
  ogTitle: 'Zawodnicy i ranking CKS Slavia',
  ogDescription: 'Poznaj kadrę Slavia i sprawdź klasyfikację Sinclair.',
  twitterCard: 'summary'
})

const terms = useSlaviaCopy()
const runtimePublic = useRuntimeConfig().public
const publicFeaturesMap = usePublicFeatures()
/** `NUXT_PUBLIC_FEATURE_ATHLETE_COMPARE=0` lub `featuresJson.athleteCompare: false` wyłącza link. */
const showAthleteCompareLink = computed(() => {
  if (!runtimePublic.featureAthleteCompare) return false
  return publicFeaturesMap.value.athleteCompare !== false
})

const {
  athletePrefetchHandlers,
  rescanPrefetchContainers,
  disconnectPrefetchContainers
} = useAthletePublicProfilePrefetch()

const rankingTableRef = ref<HTMLElement | null>(null)
const trainingRankingRef = ref<HTMLElement | null>(null)
const athleteCardsRef = ref<HTMLElement | null>(null)

function rescanAthletePrefetch() {
  nextTick(() => {
    rescanPrefetchContainers(rankingTableRef.value, trainingRankingRef.value, athleteCardsRef.value)
  })
}

watch([filteredRankings, trainingRanking, mappedPlayers], rescanAthletePrefetch)

onMounted(rescanAthletePrefetch)
onBeforeUnmount(disconnectPrefetchContainers)

</script>

<template>
  <PublicPageLayout padding="compact">
    <PublicPageHeader
      variant="centered"
      compact
      eyebrow="Kadra i Ranking"
      icon="i-lucide-trophy"
      description="Poznaj naszych reprezentantów. Ranking i wykresy na kartach bazują wyłącznie na zatwierdzonych zgłoszeniach wyników (po weryfikacji przez trenera lub administrację)."
    >
      <template #title>
        Elita <span class="text-primary">Slavii</span>
      </template>
    </PublicPageHeader>

    <!-- Podium Section -->
    <div
      v-if="podium.length > 0"
      class="slavia-zawodnicy-podium relative mb-10 mt-4 sm:mb-12 sm:mt-5 md:mt-6"
    >
      <div class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary/5 to-transparent blur-3xl opacity-50" />
      <div class="mx-auto grid max-w-4xl grid-cols-1 items-end gap-8 px-2 sm:gap-10 sm:px-4 md:grid-cols-3 md:pt-2">
        <!-- 2nd Place -->
        <NuxtLink
          v-if="podium[1]"
          :to="athleteProfilePath(podium[1].name, podium[1].id)"
          prefetch
          prefetch-on="visibility"
          v-bind="athletePrefetchHandlers(podium[1].id, podium[1].name)"
          :data-athlete-prefetch-id="podium[1].id"
          :data-athlete-prefetch-name="podium[1].name"
          class="order-2 md:order-1 group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
        >
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img
                :src="podium[1].photo || '/athlete-placeholder.svg'"
                alt=""
                width="128"
                height="128"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 128px, 128px"
                class="size-32 rounded-full border-4 border-slate-400/50 object-cover shadow-xl grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
              >
              <div class="absolute -bottom-2 -right-2 bg-slate-400 text-slate-950 size-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-background">
                2
              </div>
            </div>
            <div class="text-center p-4 bg-slate-400/10 rounded-t-2xl w-full border-t border-x border-slate-400/30 backdrop-blur-md">
              <h3 class="text-base font-black text-highlighted truncate uppercase italic">
                {{ podium[1].name }}
              </h3>
              <p class="text-primary font-mono font-black text-lg">
                {{ podium[1].sinclair }}
              </p>
            </div>
            <div class="h-24 w-full bg-linear-to-b from-slate-400 to-slate-700 rounded-b-xl shadow-xl flex items-center justify-center">
              <span class="text-white/10 text-4xl font-black tracking-tighter">SILVER</span>
            </div>
          </div>
        </NuxtLink>

        <!-- 1st Place -->
        <NuxtLink
          v-if="podium[0]"
          :to="athleteProfilePath(podium[0].name, podium[0].id)"
          prefetch
          prefetch-on="visibility"
          v-bind="athletePrefetchHandlers(podium[0].id, podium[0].name)"
          :data-athlete-prefetch-id="podium[0].id"
          :data-athlete-prefetch-name="podium[0].name"
          class="order-1 md:order-2 group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
        >
          <div class="flex flex-col items-center">
            <div class="relative mb-6 pt-9 md:pt-10">
              <div class="absolute top-0 left-1/2 -translate-x-1/2 text-yellow-500 animate-pulse">
                <UIcon
                  name="i-lucide-crown"
                  class="size-11 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] md:size-12"
                />
              </div>
              <img
                :src="podium[0].photo || '/athlete-placeholder.svg'"
                alt=""
                width="192"
                height="192"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 192px, 192px"
                class="size-48 rounded-full border-4 border-yellow-500 object-cover shadow-[0_0_30px_rgba(234,179,8,0.3)] ring-6 ring-yellow-500/10 group-hover:scale-110 transition-all duration-700"
              >
              <div class="absolute -bottom-2 -right-2 bg-yellow-500 text-yellow-950 size-14 rounded-full flex items-center justify-center font-black text-2xl shadow-xl ring-4 ring-background">
                1
              </div>
            </div>
            <div class="text-center p-6 bg-yellow-500/10 rounded-t-2xl w-full border-t border-x border-yellow-500/30 backdrop-blur-md">
              <h3 class="text-xl font-black text-highlighted truncate uppercase italic">
                {{ podium[0].name }}
              </h3>
              <p class="text-primary text-2xl font-mono font-black">
                {{ podium[0].sinclair }}
              </p>
            </div>
            <div class="h-40 w-full bg-linear-to-b from-yellow-400 to-yellow-600 rounded-b-xl shadow-[0_15px_30px_rgba(234,179,8,0.2)] flex items-center justify-center">
              <span class="text-white/20 text-6xl font-black tracking-tighter">GOLD</span>
            </div>
          </div>
        </NuxtLink>

        <!-- 3rd Place -->
        <NuxtLink
          v-if="podium[2]"
          :to="athleteProfilePath(podium[2].name, podium[2].id)"
          prefetch
          prefetch-on="visibility"
          v-bind="athletePrefetchHandlers(podium[2].id, podium[2].name)"
          :data-athlete-prefetch-id="podium[2].id"
          :data-athlete-prefetch-name="podium[2].name"
          class="order-3 md:order-3 group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
        >
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img
                :src="podium[2].photo || '/athlete-placeholder.svg'"
                alt=""
                width="112"
                height="112"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 112px, 112px"
                class="size-28 rounded-full border-4 border-amber-700/50 object-cover shadow-lg grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
              >
              <div class="absolute -bottom-2 -right-2 bg-amber-700 text-white size-8 rounded-full flex items-center justify-center font-black text-lg shadow-lg ring-4 ring-background">
                3
              </div>
            </div>
            <div class="text-center p-3 bg-amber-700/10 rounded-t-2xl w-full border-t border-x border-amber-700/30 backdrop-blur-md">
              <h3 class="text-base font-black text-highlighted truncate uppercase italic">
                {{ podium[2].name }}
              </h3>
              <p class="text-primary font-mono font-black text-lg">
                {{ podium[2].sinclair }}
              </p>
            </div>
            <div class="h-20 w-full bg-linear-to-b from-amber-600 to-amber-900 rounded-b-xl shadow-lg flex items-center justify-center">
              <span class="text-white/10 text-3xl font-black tracking-tighter">BRONZE</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Ranking Table Section -->
    <section class="slavia-content-well slavia-public-section mb-10 sm:mb-12 lg:mb-14">
      <PublicSectionHead
        split
        eyebrow="Ranking zawodów"
        title="Tabela rankingowa"
        lead="Zestawienie Sinclair — uwzględniani są tylko zawodnicy z co najmniej jednym zatwierdzonym wynikiem."
      >
        <template #actions>
          <div
            class="flex w-full flex-wrap gap-2 rounded-2xl border border-default bg-muted/30 p-1.5 md:inline-flex md:w-auto md:flex-nowrap lg:p-2"
            role="tablist"
          >
            <UButton
              v-for="c in categories"
              :key="c.value"
              size="sm"
              class="min-h-11 min-w-0 flex-1 sm:min-h-10 sm:flex-none md:shrink-0"
              :variant="selectedCategory === c.value ? 'solid' : 'ghost'"
              :color="selectedCategory === c.value ? 'primary' : 'neutral'"
              @click="selectedCategory = c.value"
            >
              {{ c.label }}
            </UButton>
          </div>
        </template>
      </PublicSectionHead>

      <div
        v-if="canSeeClubTrainingRanking"
        class="mb-6 flex flex-wrap items-center gap-2"
      >
        <USelect
          v-model="exportKind"
          :items="[
            { label: 'Eksport: zawody', value: 'competition' },
            { label: 'Eksport: trening', value: 'training' }
          ]"
          class="w-44"
          size="sm"
        />
        <UButton
          size="sm"
          variant="soft"
          icon="i-lucide-download"
          :disabled="(exportKind === 'training' ? trainingRanking : filteredRankings).length === 0"
          @click="downloadRankingCsv"
        >
          CSV na zebranie
        </UButton>
      </div>

      <div
        class="mb-6 flex flex-col gap-4 rounded-2xl border border-default/60 bg-muted/15 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <UFormField
          label="Kategoria wagowa (limit)"
          class="w-full min-w-0 sm:w-52"
        >
          <select
            v-model="filterWeightThreshold"
            class="slavia-select min-h-11 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          >
            <option value="all">
              Dowolna
            </option>
            <option
              v-for="w in weightCategoryFilterOptions"
              :key="`wc-${w}`"
              :value="String(w)"
            >
              {{ w }} kg
            </option>
          </select>
        </UFormField>
        <div class="flex min-h-11 w-full items-center gap-2 sm:w-auto">
          <input
            id="zaw-filter-active"
            v-model="filterActiveOnly"
            type="checkbox"
            class="size-4 shrink-0 accent-primary"
          >
          <label
            for="zaw-filter-active"
            class="text-sm font-medium text-muted"
          >Tylko aktywni w systemie</label>
        </div>
        <UFormField
          v-if="canUseStaffFilters"
          label="Składka (bieżący miesiąc)"
          class="w-full min-w-0 sm:w-56"
        >
          <select
            v-model="filterPaymentStaff"
            class="slavia-select min-h-11 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          >
            <option value="all">
              Dowolnie
            </option>
            <option value="paid">
              Opłacona
            </option>
            <option value="unpaid">
              Brak zatwierdzonej wpłaty
            </option>
            <option value="standing">
              {{ terms.paymentStandingOrder() }}
            </option>
          </select>
        </UFormField>
        <NuxtLink
          v-if="showAthleteCompareLink"
          to="/zawodnicy/porownanie"
          class="ms-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/15"
        >
          Porównaj zawodników
        </NuxtLink>
      </div>

      <UAlert
        v-if="filteredRankings.length === 0 && players.length > 0"
        color="neutral"
        variant="subtle"
        class="mb-6"
        title="Ranking Sinclair jest pusty"
        description="Żaden zawodnik nie ma jeszcze zatwierdzonego wyniku w systemie zgłoszeń. Po akceptacji wpisów przez trenera lub administrację pozycje pojawią się tutaj automatycznie."
      />

      <div
        v-if="filteredRankings.length > 0"
        v-slavia-reveal="'scale'"
        class="slavia-page-card overflow-hidden"
      >
        <div class="slavia-data-table overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th class="w-16">
                  Msc.
                </th>
                <th>
                  Zawodnik
                </th>
                <th class="hidden text-right md:table-cell">
                  Waga
                </th>
                <th class="text-right">
                  Dwubój
                </th>
                <th class="text-right">
                  Sinclair
                </th>
              </tr>
            </thead>
            <tbody ref="rankingTableRef">
              <tr
                v-for="(p, idx) in filteredRankings"
                :key="p.id"
                class="group"
                :data-athlete-prefetch-id="p.id"
                :data-athlete-prefetch-name="p.name"
              >
                <td>
                  <span class="font-mono text-sm font-bold tabular-nums text-muted transition-colors group-hover:text-primary sm:text-base">
                    {{ (idx + 1).toString().padStart(2, '0') }}
                  </span>
                </td>
                <td class="min-w-0">
                  <NuxtLink
                    :to="athleteProfilePath(p.name, p.id)"
                    prefetch
                    prefetch-on="visibility"
                    v-bind="athletePrefetchHandlers(p.id, p.name)"
                    class="flex min-w-0 items-center gap-2 sm:gap-3 rounded-lg text-left outline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <UAvatar
                      :src="p.photo"
                      :alt="p.name"
                      size="sm"
                      class="shrink-0 ring-1 ring-default/40"
                    />
                    <span class="truncate font-bold text-highlighted group-hover:text-primary">{{ p.name }}</span>
                  </NuxtLink>
                  <p class="mt-0.5 font-mono text-[11px] text-muted md:hidden">
                    {{ p.weightCategoryText }}
                  </p>
                </td>
                <td class="hidden text-right font-mono text-sm text-muted md:table-cell">
                  {{ p.weightCategoryText }}
                </td>
                <td class="text-right font-mono text-sm font-bold tabular-nums text-highlighted">
                  {{ p.total }} kg
                </td>
                <td class="text-right">
                  <span class="inline-block rounded-full bg-primary/12 px-2.5 py-1 font-mono text-sm font-bold text-primary ring-1 ring-primary/20 sm:px-3">
                    {{ p.sinclair }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Sekcja TRENINGOWA (tylko dla zalogowanych) -->
    <section
      v-if="showTrainingSection"
      class="slavia-content-well slavia-public-section mb-10 sm:mb-12"
    >
      <PublicSectionHead
        split
        eyebrow="Sekcja dla zalogowanych"
        title="Wyniki treningowe"
        lead="Wewnętrzny ranking treningowy klubu. Te wpisy nie wpływają na publiczne PB ani na ranking zawodów — pokazujemy je tylko zalogowanym członkom klubu."
      />

      <!-- Podium treningowe — stonowana paleta, więcej oddechu pod nagłówkiem -->
      <div
        v-if="trainingPodium.length > 0"
        class="relative mb-10 pt-2 sm:mb-12"
      >
        <div class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-info/5 via-transparent to-transparent blur-3xl opacity-50" />
        <p class="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Podium treningowe (Sinclair z najlepszego treningu)
        </p>
        <div class="mx-auto grid max-w-4xl grid-cols-1 items-end gap-10 px-3 sm:gap-12 sm:px-6 md:grid-cols-3 md:gap-8 lg:gap-10">
          <NuxtLink
            v-if="trainingPodium[1]"
            :to="athleteProfilePath(trainingPodium[1].name, trainingPodium[1].id)"
            prefetch
            prefetch-on="visibility"
            v-bind="athletePrefetchHandlers(trainingPodium[1].id, trainingPodium[1].name)"
            :data-athlete-prefetch-id="trainingPodium[1].id"
            :data-athlete-prefetch-name="trainingPodium[1].name"
            class="order-2 md:order-1 group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40"
          >
            <div class="flex flex-col items-center">
              <div class="relative mb-5">
                <img
                  :src="trainingPodium[1].photo || '/athlete-placeholder.svg'"
                  class="size-32 rounded-full border-2 border-default/50 object-cover shadow-md grayscale-[0.2] transition-all duration-500 group-hover:border-info/30 group-hover:shadow-lg group-hover:grayscale-0"
                >
                <div class="absolute -bottom-1.5 -right-1.5 flex size-9 items-center justify-center rounded-full border border-default/40 bg-muted font-black text-sm text-highlighted shadow-sm ring-2 ring-background">
                  2
                </div>
              </div>
              <div class="w-full rounded-t-2xl border border-b-0 border-default/45 bg-muted/25 px-4 py-5 text-center sm:px-5">
                <h3 class="truncate text-base font-black uppercase italic leading-snug text-highlighted">
                  {{ trainingPodium[1].name }}
                </h3>
                <p class="mt-1.5 font-mono text-base font-bold tabular-nums text-info/85 dark:text-info/90 sm:text-lg">
                  {{ trainingPodium[1].sinclair }}
                </p>
              </div>
              <div class="flex h-20 w-full items-center justify-center rounded-b-2xl border border-t-0 border-default/40 bg-linear-to-b from-muted/50 to-muted/25">
                <span class="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Sala</span>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            v-if="trainingPodium[0]"
            :to="athleteProfilePath(trainingPodium[0].name, trainingPodium[0].id)"
            prefetch
            prefetch-on="visibility"
            v-bind="athletePrefetchHandlers(trainingPodium[0].id, trainingPodium[0].name)"
            :data-athlete-prefetch-id="trainingPodium[0].id"
            :data-athlete-prefetch-name="trainingPodium[0].name"
            class="order-1 md:order-2 group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40 md:-mt-3"
          >
            <div class="flex flex-col items-center pt-8 md:pt-10">
              <div class="relative mb-6">
                <div class="absolute -top-7 left-1/2 flex -translate-x-1/2 text-info/50 dark:text-info/45 md:-top-8">
                  <UIcon name="i-lucide-dumbbell" class="size-9 md:size-10" />
                </div>
                <img
                  :src="trainingPodium[0].photo || '/athlete-placeholder.svg'"
                  class="size-40 rounded-full border-2 border-info/35 object-cover shadow-md ring-1 ring-info/10 transition-all duration-500 group-hover:border-info/50 group-hover:shadow-lg md:size-44"
                >
                <div class="absolute -bottom-1.5 -right-1.5 flex size-11 items-center justify-center rounded-full border border-info/25 bg-info/90 font-black text-xl text-white shadow-md ring-2 ring-background dark:bg-info/85">
                  1
                </div>
              </div>
              <div class="w-full rounded-t-2xl border border-b-0 border-default/50 bg-muted/35 px-5 py-6 text-center sm:px-6">
                <h3 class="truncate text-lg font-black uppercase italic leading-snug text-highlighted md:text-xl">
                  {{ trainingPodium[0].name }}
                </h3>
                <p class="mt-2 font-mono text-xl font-bold tabular-nums text-info/90 dark:text-info/90 md:text-2xl">
                  {{ trainingPodium[0].sinclair }}
                </p>
              </div>
              <div class="flex h-28 w-full items-center justify-center rounded-b-2xl border border-t-0 border-default/45 bg-linear-to-b from-info/18 to-info/12 dark:from-info/14 dark:to-muted/35">
                <span class="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Trening</span>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            v-if="trainingPodium[2]"
            :to="athleteProfilePath(trainingPodium[2].name, trainingPodium[2].id)"
            prefetch
            prefetch-on="visibility"
            v-bind="athletePrefetchHandlers(trainingPodium[2].id, trainingPodium[2].name)"
            :data-athlete-prefetch-id="trainingPodium[2].id"
            :data-athlete-prefetch-name="trainingPodium[2].name"
            class="order-3 group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40"
          >
            <div class="flex flex-col items-center">
              <div class="relative mb-5">
                <img
                  :src="trainingPodium[2].photo || '/athlete-placeholder.svg'"
                  class="size-28 rounded-full border-2 border-default/55 object-cover shadow-md grayscale-[0.25] transition-all duration-500 group-hover:border-default/80 group-hover:grayscale-0"
                >
                <div class="absolute -bottom-1.5 -right-1.5 flex size-8 items-center justify-center rounded-full border border-default/45 bg-muted font-black text-sm text-highlighted shadow-sm ring-2 ring-background">
                  3
                </div>
              </div>
              <div class="w-full rounded-t-2xl border border-b-0 border-default/45 bg-muted/20 px-4 py-4 text-center sm:px-5">
                <h3 class="truncate text-base font-black uppercase italic leading-snug text-highlighted">
                  {{ trainingPodium[2].name }}
                </h3>
                <p class="mt-1.5 font-mono text-base font-bold tabular-nums text-info/85 dark:text-info/90 sm:text-lg">
                  {{ trainingPodium[2].sinclair }}
                </p>
              </div>
              <div class="flex h-16 w-full items-center justify-center rounded-b-2xl border border-t-0 border-default/40 bg-linear-to-b from-muted/45 to-muted/20">
                <span class="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">Sala</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <UCard
        v-if="trainingRanking.length > 0"
        class="mb-6 overflow-hidden border-info/25 bg-linear-to-b from-info/8 via-background to-background shadow-xl ring-1 ring-info/15 backdrop-blur-md"
      >
        <div class="border-b border-default/50 bg-muted/30 px-4 py-3 sm:px-6">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-info">
            Top 12 — ranking treningowy (Sinclair)
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-default/60 bg-muted/40">
                <th class="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Msc.
                </th>
                <th class="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Zawodnik
                </th>
                <th class="hidden px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted md:table-cell md:px-6 md:py-4 md:text-xs">
                  Waga
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Trening total
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted sm:px-6 sm:py-4 sm:text-xs">
                  Sinclair
                </th>
                <th class="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-muted/70 sm:px-6 sm:py-4 sm:text-xs">
                  Wpisów
                </th>
              </tr>
            </thead>
            <tbody ref="trainingRankingRef" class="divide-y divide-default/50">
              <tr
                v-for="(p, idx) in trainingRanking.slice(0, 12)"
                :key="`tr-${p.id}`"
                class="group transition-colors hover:bg-info/8"
                :data-athlete-prefetch-id="p.id"
                :data-athlete-prefetch-name="p.name"
              >
                <td class="px-3 py-4 font-mono text-base font-black text-muted/60 transition-colors group-hover:text-info dark:group-hover:text-info sm:px-6 sm:py-5">
                  {{ (idx + 1).toString().padStart(2, '0') }}
                </td>
                <td class="min-w-0 px-3 py-4 sm:px-6 sm:py-5">
                  <NuxtLink
                    :to="athleteProfilePath(p.name, p.id)"
                    prefetch
                    prefetch-on="visibility"
                    v-bind="athletePrefetchHandlers(p.id, p.name)"
                    class="flex items-center gap-2 rounded-lg outline-offset-2 hover:text-info focus-visible:outline-2 focus-visible:outline-info dark:hover:text-info"
                  >
                    <UAvatar :src="p.photo" :alt="p.name" size="sm" class="shrink-0 ring-1 ring-default/30" />
                    <span class="truncate font-bold text-highlighted">{{ p.name }}</span>
                  </NuxtLink>
                  <p class="mt-0.5 font-mono text-[11px] text-muted md:hidden">
                    {{ p.weightCategoryText }}
                  </p>
                </td>
                <td class="hidden px-3 py-4 text-right font-mono text-muted md:table-cell md:px-6 md:py-5">
                  {{ p.weightCategoryText }}
                </td>
                <td class="px-3 py-4 text-right font-mono text-sm font-bold text-highlighted sm:px-6 sm:py-5 sm:text-base">
                  {{ p.total }} kg
                </td>
                <td class="px-3 py-4 text-right sm:px-6 sm:py-5">
                  <span class="inline-block rounded-full bg-info/15 px-3 py-1 font-mono text-sm font-black text-info ring-1 ring-info/25 dark:text-info">
                    {{ p.sinclair }}
                  </span>
                </td>
                <td class="px-3 py-4 text-right text-xs text-muted sm:px-6 sm:py-5">
                  {{ p.entries }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <PublicEmptyState
        v-if="trainingRanking.length === 0"
        icon="i-lucide-dumbbell"
        title="Brak wyników treningowych"
        description="Gdy pojawią się zatwierdzone wpisy treningowe, ranking wewnętrzny wypełni się automatycznie."
        compact
      />
    </section>

    <!-- Full Athlete List Section -->
    <section
      v-if="mappedPlayers.length > 0"
      class="slavia-public-section slavia-page-bleed mb-10 sm:mb-12"
    >
      <PublicSectionHead
        eyebrow="Kadra"
        title="Karty zawodników"
        lead="Profile z wykresami progresu i najlepszymi wynikami z zatwierdzonych startów."
      />
      <div
        ref="athleteCardsRef"
        class="slavia-public-grid slavia-public-grid--stagger"
      >
        <div
          v-for="player in mappedPlayers"
          :key="player.id"
          v-bind="athletePrefetchHandlers(player.id, player.name)"
          :data-athlete-prefetch-id="player.id"
          :data-athlete-prefetch-name="player.name"
          class="block"
        >
          <ClubHallOfFameRecordCard
            :record="zawodnikCardToHallRecordCard(player)"
          />
        </div>
      </div>
    </section>

    <section
      v-else-if="bundlePending"
      class="slavia-public-section slavia-page-bleed mb-10 sm:mb-12"
    >
      <PublicSectionHead
        eyebrow="Kadra"
        title="Karty zawodników"
        lead="Ładowanie profili zawodników…"
      />
      <div class="slavia-public-grid slavia-public-grid--stagger">
        <div
          v-for="i in 6"
          :key="`player-skel-${i}`"
          class="overflow-hidden rounded-3xl border border-default/40 bg-card shadow-sm ring-1 ring-default/3"
        >
          <div class="animate-pulse">
            <div class="flex flex-col gap-4 border-b border-default/35 p-4 sm:flex-row sm:items-start sm:p-5">
              <div class="mx-auto h-28 w-28 shrink-0 rounded-xl bg-muted/35 ring-2 ring-default/20 sm:mx-0 sm:h-32 sm:w-32" />
              <div class="min-w-0 flex-1 space-y-3">
                <div class="mx-auto h-7 w-[70%] max-w-xs rounded-lg bg-muted/40 sm:mx-0 sm:ml-0" />
                <div class="mx-auto h-4 w-24 rounded bg-muted/25 sm:mx-0" />
                <div class="flex justify-center gap-2 sm:justify-start">
                  <div class="h-6 w-28 rounded-full bg-muted/30" />
                  <div class="h-6 w-24 rounded-full bg-muted/25" />
                </div>
              </div>
            </div>
            <div class="border-b border-default/30">
              <div class="h-10 border-l-4 border-default/35 bg-muted/20" />
              <div class="grid grid-cols-4 divide-x divide-default/25 bg-muted/15">
                <div v-for="j in 4" :key="`sk-${i}-${j}`" class="min-h-20 bg-muted/20" />
              </div>
            </div>
            <div class="p-4 sm:p-5">
              <div class="mb-3 h-5 w-40 rounded bg-muted/25" />
              <div class="h-29 rounded-xl border border-default/30 bg-muted/15" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="slavia-content-well slavia-public-section mb-10 sm:mb-12">
      <div class="slavia-public-card slavia-public-card--glass slavia-page-card slavia-public-card--flat p-5 sm:p-6">
        <PublicSectionHead
          split
          eyebrow="Historia"
          title="Archiwum kadry"
          lead="Byli zawodnicy klubu — profile historyczne poza bieżącym rankingiem i listą aktywnej kadry."
        >
          <template #actions>
            <NuxtLink
              to="/zawodnicy/archiwum"
              class="slavia-public-inline-link inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-5 text-sm font-bold no-underline transition-colors hover:bg-primary/15"
            >
              Zobacz archiwum
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </NuxtLink>
          </template>
        </PublicSectionHead>
      </div>
    </section>

    <UAlert
      v-if="mappedPlayers.length === 0 && !bundlePending && status !== 'pending' && !error"
      color="info"
      variant="subtle"
      title="Brak zawodników"
      description="Obecnie lista zawodników jest pusta."
      class="mb-12"
    />
  </PublicPageLayout>
</template>

<script setup lang="ts">
import AthleteCard from '~/components/AthleteCard.vue'
import { athleteProfilePath } from '~/utils/slug'
import { mapArchivedAthleteToCard } from '~/utils/athleteArchiveCard'
import type { Athlete as AthleteModel } from '~/types/models'

definePageMeta({
  backTo: '/zawodnicy',
  backLabel: 'Wróć do kadry i rankingu'
})

const {
  data: archivedRaw,
  pending,
  error
} = await usePublicLazyFetch<AthleteModel[]>('athletes/archive', {
  key: 'players-public-archived',
  default: () => [] as AthleteModel[]
})

const selectedCategory = ref<'all' | 'male' | 'female'>('all')

const archivedPlayers = computed(() => {
  const list = (archivedRaw.value ?? []).slice()
  const filtered = selectedCategory.value === 'all'
    ? list
    : list.filter(p => p.gender === selectedCategory.value)
  return filtered
    .map(p => mapArchivedAthleteToCard(p))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
})

useSeoMeta({
  title: 'Archiwum kadry — Slavia Ruda Śląska',
  description:
    'Byli zawodnicy CKS Slavia Ruda Śląska. Profile historyczne — bez udziału w bieżącym rankingu klubu.',
  robots: 'index, follow'
})
</script>

<template>
  <PublicPageLayout padding="compact">
    <PublicPageHeader
      variant="hero"
      eyebrow="Kadra"
      icon="i-lucide-archive"
      title="Archiwum zawodników"
      description="Osoby oznaczone jako nieaktywne w kadrze klubu. Dane i profile pozostają dostępne do wglądu — nie są uwzględniane w rankingu ani na liście aktywnej kadry."
      back-to="/zawodnicy"
      back-label="Wróć do kadry i rankingu"
    />

    <div class="slavia-content-well slavia-public-section">
      <div class="mb-8 flex flex-wrap items-end gap-4">
        <UFormField
          label="Płeć"
          class="w-full min-w-0 sm:w-48"
        >
          <select
            v-model="selectedCategory"
            class="slavia-select min-h-11 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm"
          >
            <option value="all">
              Wszyscy
            </option>
            <option value="male">
              Mężczyźni
            </option>
            <option value="female">
              Kobiety
            </option>
          </select>
        </UFormField>
        <p
          v-if="!pending && archivedPlayers.length > 0"
          class="ms-auto text-sm text-muted"
        >
          {{ archivedPlayers.length }}
          {{ archivedPlayers.length === 1 ? 'profil' : archivedPlayers.length < 5 ? 'profile' : 'profili' }}
        </p>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        title="Nie udało się wczytać archiwum"
        description="Spróbuj odświeżyć stronę za chwilę."
        class="mb-8"
      />

      <div
        v-if="pending"
        class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div
          v-for="i in 4"
          :key="`arch-skel-${i}`"
          class="h-80 animate-pulse rounded-3xl border border-default/40 bg-muted/20"
        />
      </div>

      <div
        v-else-if="archivedPlayers.length > 0"
        class="slavia-public-grid slavia-public-grid--2 slavia-public-grid--stagger"
      >
        <NuxtLink
          v-for="player in archivedPlayers"
          :key="player.id"
          :to="athleteProfilePath(player.name, player.id!)"
          prefetch
          prefetch-on="interaction"
          class="block"
        >
          <AthleteCard :model-value="player" />
        </NuxtLink>
      </div>

      <PublicEmptyState
        v-else-if="!error"
        icon="i-lucide-archive"
        title="Archiwum jest puste"
        description="Gdy zawodnik zostanie oznaczony jako nieaktywny w panelu kadry, jego profil pojawi się tutaj."
        compact
      />
    </div>
  </PublicPageLayout>
</template>

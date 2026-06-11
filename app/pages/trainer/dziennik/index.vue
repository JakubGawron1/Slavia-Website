<script setup lang="ts">
import type { Athlete } from '~/types/models'
import { trainerDiaryAthletePath } from '~/utils/slug'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Dzienniki treningów — trener',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()

const { data: athletes, pending } = await useAsyncData(
  'trainer-diary-picker-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)

const q = ref('')
const filtered = computed(() => {
  const list = ((athletes.value || []) as Athlete[]).filter(a => a.is_active !== false)
  const s = q.value.trim().toLowerCase()
  if (!s) {
    return list
  }
  return list.filter(a => a.full_name.toLowerCase().includes(s))
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Dzienniki treningów"
      icon="i-lucide-book-marked"
      description="Wybierz zawodnika, aby dodać lub edytować wpisy z jednostek treningowych — zawodnik zobaczy je u siebie w panelu."
    >
      <template #actions>
        <UButton to="/trainer" variant="soft" color="neutral" size="sm" icon="i-lucide-layout-dashboard">
          Panel
        </UButton>
      </template>
    </PanelPageHeader>

    <div class="mb-6 max-w-md">
      <UInput
        v-model="q"
        icon="i-lucide-search"
        placeholder="Szukaj po nazwisku…"
        class="w-full"
      />
    </div>

    <PanelLoadingState
      v-if="pending"
      variant="cards"
      :count="6"
      label="Ładowanie listy zawodników…"
    />

    <PublicEmptyState
      v-else-if="filtered.length === 0"
      icon="i-lucide-user-round-search"
      title="Brak wyników"
      description="Spróbuj innej frazy wyszukiwania lub wyczyść filtr."
    />

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <NuxtLink
        v-for="a in filtered"
        :key="a.id"
        :to="trainerDiaryAthletePath(a.full_name, a.id)"
        class="slavia-athlete-picker-card group"
      >
        <div class="min-w-0">
          <p class="font-semibold text-highlighted truncate group-hover:text-primary">
            {{ a.full_name }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ a.weight_category || '—' }}
            <span v-if="a.birth_year"> · r. {{ a.birth_year }}</span>
          </p>
        </div>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-5 shrink-0 text-muted group-hover:text-primary"
        />
      </NuxtLink>
    </div>

    <div class="mt-10">
      <UButton
        to="/trainer"
        variant="soft"
        color="neutral"
        icon="i-lucide-arrow-left"
      >
        Wróć do panelu trenera
      </UButton>
    </div>
  </PanelPageLayout>
</template>

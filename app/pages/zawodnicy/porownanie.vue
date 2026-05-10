<script setup lang="ts">
import { athleteProfilePath } from '~/utils/slug'
import type { Athlete as AthleteModel } from '~/types/models'

const config = useRuntimeConfig()
const base = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

const { data: playersRaw, pending } = await useLazyFetch<AthleteModel[]>(
  () => `${base.value}/api/athletes`,
  {
    key: 'compare-athletes-list',
    default: () => [] as AthleteModel[],
    server: true
  }
)

const players = computed(() => playersRaw.value ?? [])

const selectedIds = ref<string[]>([])

function toggleAthlete(id: string) {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) {
    selectedIds.value.splice(i, 1)
  } else if (selectedIds.value.length < 3) {
    selectedIds.value.push(id)
  }
}

const selectedRows = computed(() => {
  const m = new Map(players.value.map(p => [p.id, p]))
  return selectedIds.value.map(id => m.get(id)).filter(Boolean) as AthleteModel[]
})

useSeoMeta({
  title: 'Porównanie zawodników — Slavia',
  description: 'Porównanie do trzech zawodników: kategoria, PB z profilu.',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-8 md:py-14">
    <div class="mb-8">
      <NuxtLink
        to="/zawodnicy"
        class="text-sm font-semibold text-primary hover:underline"
      >
        ← Wróć do listy i rankingu
      </NuxtLink>
      <h1 class="mt-4 text-3xl font-black tracking-tight text-highlighted">
        Porównanie zawodników
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-muted">
        Wybierz maksymalnie trzy osoby z kadry. Wykresy czasowe możesz otworzyć z linków do profili.
      </p>
    </div>

    <UCard class="mb-8">
      <div class="max-h-80 space-y-1 overflow-y-auto p-3 sm:p-4">
        <div v-if="pending" class="text-sm text-muted">
          Ładowanie listy…
        </div>
        <template v-else>
          <label
            v-for="p in players"
            :key="p.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/30"
          >
            <input
              type="checkbox"
              class="size-4 accent-primary"
              :checked="selectedIds.includes(p.id)"
              :disabled="!selectedIds.includes(p.id) && selectedIds.length >= 3"
              @click.prevent="toggleAthlete(p.id)"
            >
            <span class="min-w-0 flex-1 text-sm font-medium text-highlighted">{{ p.full_name }}</span>
            <span class="text-xs text-muted">{{ p.gender === 'female' ? 'K' : p.gender === 'male' ? 'M' : '—' }}</span>
          </label>
        </template>
      </div>
    </UCard>

    <UCard v-if="selectedRows.length > 0" :ui="{ body: 'p-0 overflow-x-auto' }">
      <table class="w-full min-w-[520px] text-sm">
        <thead class="border-b border-default bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left">
              Zawodnik
            </th>
            <th class="px-4 py-3 text-right">
              Total (profil)
            </th>
            <th class="px-4 py-3 text-right">
              Rwanie
            </th>
            <th class="px-4 py-3 text-right">
              Podrzut
            </th>
            <th class="px-4 py-3 text-left">
              Profil
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="p in selectedRows" :key="p.id">
            <td class="px-4 py-3 font-semibold text-highlighted">
              {{ p.full_name }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              {{ p.total_kg ?? '—' }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              {{ p.best_snatch_kg ?? '—' }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              {{ p.best_clean_jerk_kg ?? '—' }}
            </td>
            <td class="px-4 py-3">
              <NuxtLink
                class="text-primary font-semibold hover:underline"
                :to="athleteProfilePath(p.full_name, p.id)"
              >
                Otwórz
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>

    <UAlert
      v-else
      color="neutral"
      variant="subtle"
      title="Nic nie wybrano"
      description="Zaznacz co najmniej jednego zawodnika powyżej."
    />
  </UContainer>
</template>

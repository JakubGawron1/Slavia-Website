<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import type { Athlete } from '~/types/models'

useSeoMeta({
  title: 'Rekordy klubu — Hall of Fame',
  description: 'Najlepsze wyniki zawodników CKS Slavia w podziale na kategorie wagowe i płeć.',
  robots: 'index, follow'
})

const config = useRuntimeConfig()
const base = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

const period = ref<'all' | 'year'>('all')
const currentYear = new Date().getFullYear()

const { data: athletes } = await useAsyncData('hall-of-fame-athletes', async () => {
  if (!base.value) return [] as Athlete[]
  return await $fetch<Athlete[]>(`${base.value}${apiRoutes.athletes.list}`).catch(() => [])
}, { default: () => [] as Athlete[] })

type RecordRow = {
  athleteId: string
  name: string
  gender: string
  weightCategory: string
  total: number
  snatch: number
  cleanJerk: number
}

const recordBoard = computed(() => {
  const list = (athletes.value ?? []).filter(a => a.is_active !== false && (a.total_kg ?? 0) > 0)
  const buckets = new Map<string, RecordRow>()
  for (const a of list) {
    const key = `${a.gender || 'unknown'}|${a.weight_category || '?'}`
    const row: RecordRow = {
      athleteId: a.id,
      name: a.full_name,
      gender: a.gender || '',
      weightCategory: a.weight_category || '—',
      total: a.total_kg ?? 0,
      snatch: a.best_snatch_kg ?? 0,
      cleanJerk: a.best_clean_jerk_kg ?? 0
    }
    const prev = buckets.get(key)
    if (!prev || row.total > prev.total) {
      buckets.set(key, row)
    }
  }
  return [...buckets.values()].sort((a, b) => b.total - a.total)
})

function genderLabel(g: string) {
  if (g === 'male') return 'Mężczyźni'
  if (g === 'female') return 'Kobiety'
  return 'Inne'
}
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <div class="mb-8">
      <h1 class="text-3xl font-black uppercase italic tracking-tight text-highlighted sm:text-4xl">
        Hall of Fame — rekordy klubu
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Najlepsze totale z profili zawodników (PB). Filtr „bieżący rok” — w rozszerzeniu po dacie wyników z API.
      </p>
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <UButton
        size="sm"
        :variant="period === 'all' ? 'solid' : 'ghost'"
        @click="period = 'all'"
      >
        Wszech czasów
      </UButton>
      <UButton
        size="sm"
        :variant="period === 'year' ? 'solid' : 'ghost'"
        @click="period = 'year'"
      >
        Bieżący rok ({{ currentYear }})
      </UButton>
    </div>

    <UAlert
      v-if="period === 'year'"
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Widok roczny (MVP)"
      description="Pełny filtr po dacie wyniku wymaga agregacji z /api/results — obecnie pokazujemy te same PB co „wszech czasów”."
      class="mb-6 rounded-2xl"
    />

    <div v-if="recordBoard.length === 0" class="text-muted">
      Brak danych rekordowych.
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UCard
        v-for="row in recordBoard"
        :key="`${row.gender}-${row.weightCategory}`"
        class="rounded-2xl border-default/70"
      >
        <p class="text-xs font-bold uppercase tracking-wider text-primary">
          {{ genderLabel(row.gender) }} · {{ row.weightCategory }}
        </p>
        <p class="mt-2 text-lg font-black text-highlighted">
          {{ row.name }}
        </p>
        <dl class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <dt class="text-muted">Total</dt>
            <dd class="font-mono font-bold">{{ row.total }} kg</dd>
          </div>
          <div>
            <dt class="text-muted">Rwanie</dt>
            <dd class="font-mono font-bold">{{ row.snatch }} kg</dd>
          </div>
          <div>
            <dt class="text-muted">Podrzut</dt>
            <dd class="font-mono font-bold">{{ row.cleanJerk }} kg</dd>
          </div>
        </dl>
        <UButton
          class="mt-4"
          size="sm"
          variant="soft"
          :to="`/athlete/${row.athleteId}`"
        >
          Profil
        </UButton>
      </UCard>
    </div>
  </UContainer>
</template>

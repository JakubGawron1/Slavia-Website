<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import type { Athlete } from '~/types/models'
import { athleteProfilePath } from '~/utils/slug'

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
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="Klub"
      icon="i-lucide-trophy"
      title="Hall of Fame — rekordy klubu"
      description="Najlepsze totale z profili zawodników (PB). Filtr „bieżący rok” — w rozszerzeniu po dacie wyników z API."
      back-to="/zawodnicy"
      back-label="Wróć do kadry"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2">
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
      </template>
    </PublicPageHeader>

    <UAlert
      v-if="period === 'year'"
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      class="mb-6"
      title="Filtr roku"
      description="W tej wersji ranking opiera się na PB z profilu. Pełny filtr po dacie zawodów pojawi się po rozszerzeniu API wyników."
    />

    <div class="slavia-public-section grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard
        v-for="row in recordBoard"
        :key="`${row.gender}-${row.weightCategory}`"
        class="rounded-2xl border-default/70 shadow-sm ring-1 ring-default/40"
      >
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          {{ genderLabel(row.gender) }} · {{ row.weightCategory }}
        </p>
        <NuxtLink
          :to="athleteProfilePath(row.name, row.athleteId)"
          class="mt-2 block text-lg font-bold text-highlighted hover:text-primary"
        >
          {{ row.name }}
        </NuxtLink>
        <UButton
          class="mt-4"
          size="sm"
          variant="soft"
          :to="athleteProfilePath(row.name, row.athleteId)"
        >
          Profil
        </UButton>
        <dl class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div class="rounded-lg bg-muted/15 px-2 py-2">
            <dt class="text-muted">
              Total
            </dt>
            <dd class="font-mono font-bold text-highlighted">
              {{ row.total }}
            </dd>
          </div>
          <div class="rounded-lg bg-muted/15 px-2 py-2">
            <dt class="text-muted">
              Rwanie
            </dt>
            <dd class="font-mono font-bold text-highlighted">
              {{ row.snatch }}
            </dd>
          </div>
          <div class="rounded-lg bg-muted/15 px-2 py-2">
            <dt class="text-muted">
              Podrzut
            </dt>
            <dd class="font-mono font-bold text-highlighted">
              {{ row.cleanJerk }}
            </dd>
          </div>
        </dl>
      </UCard>
    </div>

    <UAlert
      v-if="!recordBoard.length"
      class="mt-8"
      color="neutral"
      variant="subtle"
      title="Brak rekordów"
      description="Gdy zawodnicy uzupełnią wyniki w profilach, tablica wypełni się automatycznie."
    />
  </PublicPageLayout>
</template>

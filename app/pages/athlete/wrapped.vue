<script setup lang="ts">
import type { Athlete, CompetitionResult } from '~/types/models'

definePageMeta({ middleware: 'auth' })

const apiFetch = useApi()
const auth = useAuth()

const year = new Date().getFullYear()

const { data: bundle } = await useAsyncData('athlete-wrapped', async () => {
  if (!auth.isAthlete.value && !auth.isSuperAdmin.value) {
    return { athlete: null as Athlete | null, results: [] as CompetitionResult[] }
  }
  const athlete = await apiFetch<Athlete | null>('/api/athletes/me').catch(() => null)
  const results = athlete?.id
    ? await apiFetch<CompetitionResult[]>(`/api/results/athlete/${athlete.id}`).catch(() => [])
    : []
  return { athlete, results }
})

const yearResults = computed(() => {
  const list = bundle.value?.results ?? []
  return list.filter((r) => {
    const d = r.date?.slice(0, 4)
    return d === String(year) && r.status === 'Approved'
  })
})

const stats = computed(() => {
  const rows = yearResults.value
  let tonnage = 0
  let bestTotal = 0
  for (const r of rows) {
    tonnage += r.total || 0
    if ((r.total || 0) > bestTotal) bestTotal = r.total || 0
  }
  return {
    starts: rows.length,
    tonnage,
    bestTotal,
    prCount: rows.filter((r) => (r.total || 0) >= bestTotal * 0.99).length
  }
})

useSeoMeta({
  title: `Slavia Wrapped ${year}`,
  robots: 'noindex, nofollow'
})
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <div class="mx-auto max-w-2xl text-center">
      <p class="text-xs font-bold uppercase tracking-widest text-primary">
        Podsumowanie roku
      </p>
      <h1 class="mt-2 text-3xl font-black text-highlighted sm:text-4xl">
        Slavia Wrapped {{ year }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ bundle?.athlete?.full_name || auth.user.value?.username || 'Zawodniku' }} — Twoja sezonowa statystyka.
      </p>
    </div>

    <div v-if="!auth.isAthlete.value" class="mt-8 rounded-2xl border border-warning/30 bg-warning/10 p-6 text-sm">
      Widok dla konta z rolą Zawodnik.
    </div>

    <div v-else class="mt-10 grid gap-4 sm:grid-cols-2">
      <UCard class="text-center">
        <p class="text-[10px] font-bold uppercase text-muted">Starty (zatwierdzone)</p>
        <p class="text-3xl font-black text-primary">{{ stats.starts }}</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-[10px] font-bold uppercase text-muted">Łączny tonaż</p>
        <p class="text-3xl font-black text-success">{{ stats.tonnage }} kg</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-[10px] font-bold uppercase text-muted">Najlepszy total</p>
        <p class="text-3xl font-black text-warning">{{ stats.bestTotal }} kg</p>
      </UCard>
      <UCard class="text-center">
        <p class="text-[10px] font-bold uppercase text-muted">Kamienie milowe</p>
        <p class="text-3xl font-black text-info">{{ stats.prCount }}</p>
      </UCard>
    </div>

    <div class="mt-8 flex justify-center gap-3">
      <UButton to="/athlete" variant="soft" color="primary">
        Wróć do panelu
      </UButton>
      <UButton to="/athlete/timeline" variant="outline" color="neutral">
        Oś czasu
      </UButton>
    </div>
  </UContainer>
</template>

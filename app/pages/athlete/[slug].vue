<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { AthletePublicProfile, CompetitionResult } from '~/types/models'
import type { SinclairGender } from '~/utils/sinclair'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'
import { parseSlugId } from '~/utils/slug'

const route = useRoute()
const apiFetch = useApi()
const auth = useAuth()

const athleteId = computed(() => parseSlugId(String(route.params.slug || '')))
const canEditAthlete = computed(() => auth.isTrainer.value)

const athleteDetailKey = computed(() => `athlete-detail-${athleteId.value}`)
const { data: athlete, error } = await useAsyncData(
  athleteDetailKey,
  async () => {
    if (!athleteId.value) {
      return null
    }
    return await apiFetch<AthletePublicProfile>(
      `/api/athletes/${encodeURIComponent(athleteId.value)}`
    )
  },
  { watch: [athleteId] }
)

const athleteResultsKey = computed(() => `athlete-results-${athleteId.value}`)
const { data: results } = await useAsyncData(
  athleteResultsKey,
  async () => {
    if (!athleteId.value) {
      return []
    }
    return await apiFetch<CompetitionResult[]>(
      `/api/results/athlete/${encodeURIComponent(athleteId.value)}`
    )
  },
  { watch: [athleteId], default: () => [] }
)

if (error.value || !athlete.value) {
  throw createError({ statusCode: 404, statusMessage: 'Zawodnik nie znaleziony', fatal: true })
}

const profileHeroBio = computed(
  () =>
    athlete.value?.public_bio?.trim()
    || athlete.value?.profile_tagline?.trim()
    || `Profil zawodnika ${athlete.value!.full_name} w CKS Slavia Ruda Śląska.`
)

useSeoMeta({
  title: `${athlete.value.full_name} — Slavia`,
  description: profileHeroBio.value.slice(0, 320),
  ogTitle: athlete.value.full_name,
  ogDescription: profileHeroBio.value.slice(0, 300),
  ogImage: athlete.value.image_url || '/logo.png'
})

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: pl })
  } catch {
    return dateStr
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

const approvedResults = computed(() => (results.value || []).filter(r => r.status === 'Approved'))

const approvedSinclair = computed(() => {
  const p = athlete.value
  if (!p) return null
  const sg = cardGender(p.gender ?? undefined)
  const approved = approvedResults.value
  let bestRow: CompetitionResult | null = null
  for (const r of approved) {
    if (
      !bestRow
      || r.total > bestRow.total
      || (r.total === bestRow.total && r.date.localeCompare(bestRow.date) > 0)
    ) {
      bestRow = r
    }
  }
  const totalKg = bestRow?.total ?? p.total_kg ?? 0
  const effectiveWeight = effectiveBodyweightKgForSinclair(p)
  if (totalKg <= 0 || effectiveWeight <= 0 || !sg) return null
  const calculated = sinclairTotal(totalKg, effectiveWeight, sg)
  if (Number.isNaN(calculated)) return null
  return Number(calculated.toFixed(2))
})
</script>

<template>
  <UContainer class="py-8 sm:py-12 lg:py-16">
    <div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.25em] text-primary">
          Profil zawodnika
        </p>
        <h1 class="mt-3 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
          {{ athlete!.full_name }}
        </h1>
        <p
          v-if="athlete!.profile_tagline?.trim()"
          class="mt-2 text-lg font-semibold text-primary/90"
        >
          {{ athlete!.profile_tagline!.trim() }}
        </p>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {{ profileHeroBio }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          to="/zawodnicy"
          variant="soft"
          color="neutral"
          icon="i-lucide-arrow-left"
        >
          Powrót do listy
        </UButton>
        <UButton
          v-if="canEditAthlete && athleteId"
          :to="`/trainer/zawodnicy?edit=${encodeURIComponent(String(athleteId))}`"
          color="primary"
          variant="soft"
          icon="i-lucide-pencil"
        >
          Edytuj
        </UButton>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1.9fr_1.1fr]">
      <div class="space-y-6">
        <UCard class="overflow-hidden border-default/60 shadow-md">
          <div class="relative overflow-hidden rounded-3xl bg-slate-950/80">
            <img
              v-if="athlete!.image_url"
              :src="athlete!.image_url"
              :alt="`Zdjęcie ${athlete!.full_name}`"
              class="h-80 w-full object-cover"
            >
            <div
              v-else
              class="flex h-80 items-center justify-center bg-linear-to-br from-primary/20 to-neutral-900"
            >
              <UIcon
                name="i-lucide-user"
                class="size-16 text-primary/40"
              />
            </div>
            <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-6">
              <p class="text-sm uppercase tracking-[0.2em] text-primary/80">
                Zawodnik klubu
              </p>
              <h2 class="mt-2 text-3xl font-extrabold text-white">
                {{ athlete!.full_name }}
              </h2>
              <p
                v-if="athlete!.profile_tagline?.trim()"
                class="mt-1 text-sm text-white/85"
              >
                {{ athlete!.profile_tagline!.trim() }}
              </p>
            </div>
          </div>

          <div class="p-6 space-y-5">
            <div
              v-if="athlete!.public_bio?.trim()"
              class="rounded-2xl border border-primary/25 bg-primary/5 p-4"
            >
              <p class="text-xs uppercase tracking-[0.18em] text-primary font-bold">
                O zawodniku
              </p>
              <p class="mt-3 text-sm leading-relaxed text-muted whitespace-pre-wrap">
                {{ athlete!.public_bio!.trim() }}
              </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-muted">
                  Data urodzenia
                </p>
                <p class="mt-2 text-lg font-semibold text-highlighted">
                  {{ athlete!.birth_year || '—' }}
                </p>
              </div>
              <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-muted">
                  Płeć
                </p>
                <p class="mt-2 text-lg font-semibold text-highlighted">
                  {{ genderLabel(athlete!.gender) || '—' }}
                </p>
              </div>
              <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-muted">
                  Kategoria / waga ciała
                </p>
                <p class="mt-2 text-lg font-semibold text-highlighted">
                  <template v-if="athlete!.weight_category">
                    {{ athlete!.weight_category }}
                  </template>
                  <template v-if="athlete!.bodyweight != null">
                    <span v-if="athlete!.weight_category"> · </span>{{ athlete!.bodyweight }} kg
                  </template>
                  <template v-if="!athlete!.weight_category && athlete!.bodyweight == null">
                    —
                  </template>
                </p>
              </div>
            </div>

            <div
              v-if="
                athlete!.best_snatch_kg != null
                  || athlete!.best_clean_jerk_kg != null
                  || athlete!.total_kg != null
                  || approvedSinclair != null
              "
              class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div class="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-4 text-center">
                <p class="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide text-primary/75 font-bold">
                  <UIcon
                    name="i-game-icons-weight-lifting-up"
                    class="size-4 shrink-0 text-primary/90"
                  />
                  Rwanie
                </p>
                <p class="mt-2 font-mono text-2xl font-bold text-primary">
                  {{ athlete!.best_snatch_kg ?? '—' }}
                  <span
                    v-if="athlete!.best_snatch_kg != null"
                    class="text-xs font-semibold text-muted"
                  >kg</span>
                </p>
              </div>
              <div class="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-4 text-center">
                <p class="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide text-primary/75 font-bold">
                  <UIcon
                    name="i-game-icons-weight-lifting-down"
                    class="size-4 shrink-0 text-primary/90"
                  />
                  Podrzut
                </p>
                <p class="mt-2 font-mono text-2xl font-bold text-primary">
                  {{ athlete!.best_clean_jerk_kg ?? '—' }}
                  <span
                    v-if="athlete!.best_clean_jerk_kg != null"
                    class="text-xs font-semibold text-muted"
                  >kg</span>
                </p>
              </div>
              <div class="rounded-2xl border border-emerald-500/30 bg-linear-to-br from-emerald-500/10 to-primary/10 p-4 text-center">
                <p class="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-bold">
                  Total (rekord)
                </p>
                <p class="mt-2 font-mono text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                  {{ athlete!.total_kg ?? '—' }}
                  <span
                    v-if="athlete!.total_kg != null"
                    class="text-xs font-semibold text-muted"
                  >kg</span>
                </p>
              </div>
              <div class="rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/10 p-4 text-center">
                <p class="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-bold">
                  Sinclair
                </p>
                <p class="mt-2 font-mono text-2xl font-bold text-amber-600 dark:text-amber-300">
                  {{ approvedSinclair ?? '—' }}
                  <span
                    v-if="approvedSinclair != null"
                    class="text-xs font-semibold text-muted"
                  >pkt</span>
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-3xl border-default/60 p-6 shadow-md">
          <div class="flex items-center justify-between gap-4 mb-5">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Wyniki
              </p>
              <p class="text-sm text-muted">
                Zatwierdzone zgłoszenia z zawodów (widok publiczny).
              </p>
            </div>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{{
              approvedResults.length
            }}
              wpisów</span>
          </div>

          <div class="space-y-4">
            <div
              v-for="result in approvedResults.slice(0, 12)"
              :key="result.id"
              class="rounded-2xl border border-default/60 bg-background/80 p-4"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-highlighted">
                    {{ formatDate(result.date) }}
                  </p>
                </div>
                <div class="text-right font-mono text-lg font-bold text-primary">
                  {{ result.total }} kg
                </div>
              </div>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <p class="text-sm text-muted">
                  Rwanie: {{ result.snatch }} kg
                </p>
                <p class="text-sm text-muted">
                  Podrzut: {{ result.clean_and_jerk }} kg
                </p>
              </div>
            </div>
            <p
              v-if="approvedResults.length === 0"
              class="text-sm text-muted"
            >
              Brak zatwierdzonych wyników do wyświetlenia.
            </p>
          </div>
        </UCard>
      </div>

      <aside class="space-y-6">
        <UCard class="rounded-3xl border-default/60 p-6 shadow-md">
          <p class="text-xs uppercase tracking-[0.18em] text-muted">
            Nawigacja
          </p>
          <div class="mt-4 space-y-3">
            <UButton
              to="/zawodnicy"
              color="primary"
              block
            >
              Lista zawodników
            </UButton>
          </div>
          <p class="mt-4 text-xs leading-relaxed text-muted">
            Rozbudowany opis i slogan ustawiają trener, administrator lub superadministrator w panelu kadry.
          </p>
        </UCard>
      </aside>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { SinclairGender } from '~/utils/sinclair'
import { sinclair2025_2028, sinclairCoefficient, sinclairTotal } from '~/utils/sinclair'
import { parseLiveNumber } from '~/utils/liveNumber'

const gender = ref<SinclairGender>('male')
const bodyweight = ref<number | undefined>(undefined)
const total = ref<number | undefined>(undefined)

const consts = computed(() => sinclair2025_2028[gender.value])

const coefficient = computed(() => {
  const bw = bodyweight.value
  if (bw === undefined || bw === null || Number.isNaN(bw)) return null
  return sinclairCoefficient(bw, gender.value)
})

const bodyweightRaw = ref('')
const totalRaw = ref('')

watch(bodyweightRaw, (newVal) => {
  bodyweight.value = parseLiveNumber(newVal)
})

watch(totalRaw, (newVal) => {
  total.value = parseLiveNumber(newVal)
})

const sinclairResult = computed(() => {
  const bw = bodyweight.value
  const t = total.value
  if (
    bw === undefined || bw === null || Number.isNaN(bw)
    || t === undefined || t === null || Number.isNaN(t)
  ) {
    return null
  }
  return sinclairTotal(t, bw, gender.value)
})

function fmt(n: number | null, digits = 3) {
  if (n === null || Number.isNaN(n)) return '—'
  return n.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  })
}

useSeoMeta({
  title: 'Kalkulator Sinclair (2025–2028) — Slavia Ruda Śląska',
  description: 'Współczynnik i Total Sinclair 2025–2028 — te same założenia co kalkulator na PodnoszenieCiężarów.pl.'
})
</script>

<template>
  <div>
    <UContainer class="py-8 md:py-14 lg:py-16">
      <div class="mx-auto max-w-3xl text-center">
        <p class="text-sm font-medium uppercase tracking-wider text-primary">
          Narzędzie
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
          Kalkulator Sinclair
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Przelicznik na okres <strong class="text-default">2025–2028</strong> — porównywanie wyników zawodników o różnej masie ciała (dwubój: rwanie + podrzut).
        </p>
      </div>

      <div class="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-5">
        <UCard class="border-default/80 shadow-sm lg:col-span-2">
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">
              Dane
            </h2>
          </template>
          <div class="space-y-6">
            <UFormField label="Płeć">
              <USelect
                v-model="gender"
                size="lg"
                :items="[
                  { label: 'Mężczyzna', value: 'male' },
                  { label: 'Kobieta', value: 'female' }
                ]"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Masa ciała z ważenia"
              description="kg — rzeczywista masa w zawodach"
            >
              <UInput
                v-model="bodyweightRaw"
                inputmode="decimal"
                size="lg"
                placeholder="np. 81,4"
                class="w-full tabular-nums"
              />
            </UFormField>

            <UFormField
              label="Dwubój (total)"
              description="kg — suma najlepszego rwania i podrzutu"
            >
              <UInput
                v-model="totalRaw"
                inputmode="decimal"
                size="lg"
                class="w-full tabular-nums"
                placeholder="np. 280"
              />
            </UFormField>

            <div class="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted">
              Stałe dla tej płci: <span class="font-mono text-default">A = {{ consts.A }}</span>,
              <span class="font-mono text-default">b = {{ consts.b }} kg</span>
            </div>
          </div>
        </UCard>

        <UCard
          class="border-primary/20 bg-linear-to-br from-primary/5 to-transparent shadow-md lg:col-span-3"
          :ui="{ body: 'flex flex-col justify-center min-h-[280px]' }"
        >
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">
              Wynik
            </h2>
          </template>

          <div class="grid gap-8 sm:grid-cols-2">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-muted">
                Współczynnik Sinclair
              </p>
              <p class="mt-2 font-mono text-4xl font-bold tabular-nums text-primary sm:text-5xl">
                {{ fmt(coefficient, 4) }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-muted">
                Total Sinclair
              </p>
              <p class="mt-2 font-mono text-4xl font-bold tabular-nums text-highlighted sm:text-5xl">
                {{ fmt(sinclairResult, 2) }}
                <span class="text-xl font-semibold text-muted">pkt</span>
              </p>
            </div>
          </div>

          <USeparator class="my-8" />

          <div class="space-y-3 text-sm text-muted">
            <p>
              Jeśli masa ciała <span class="font-mono text-default">≥ b</span>, współczynnik wynosi
              <strong class="text-default">1</strong> — bez podwyższenia wyniku względem rzeczywistego totalu.
            </p>
            <p>
              Dla mas niższych niż <span class="font-mono text-default">b</span> stosuje się wzór:
              <span class="block mt-2 rounded-md bg-muted/50 p-3 font-mono text-xs text-default sm:text-sm">
                10<sup class="text-[0.65em]">(A × log₁₀(x/b)²)</sup>
              </span>
            </p>
          </div>
        </UCard>
      </div>

      <div class="mx-auto mt-10 max-w-3xl">
        <UAlert
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          title="Informacja"
          description="Przelicznik jest liczony jak na podnoszenieciezarow.pl (okres 2025–2028): mężczyźni b = 201 kg, kobiety b = 164 kg; stała A dopasowana do ich tabeli. Ewentualne różnice w ostatnich miejscach wynikają z zaokrągleń po stronie serwisu referencyjnego."
        />
      </div>
    </UContainer>
  </div>
</template>

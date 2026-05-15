<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import { athleteProfilePath } from '~/utils/slug'

type LeaderboardRow = {
  athlete_id: string
  full_name: string
  session_count: number
}

type ApiResponse = {
  month: string
  metric: string
  leaderboard: LeaderboardRow[]
}

const config = useRuntimeConfig()
const monthInput = ref('')
/** `null` = bieżący miesiąc po stronie API. */
const activeMonth = ref<string | null>(null)

function publicApiBase() {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

function requestUrl(month: string | null) {
  const u = new URL(`${publicApiBase()}${apiRoutes.challenges.monthlyTrainingSessions}`)
  if (month?.trim()) {
    u.searchParams.set('month', month.trim())
  }
  return u.toString()
}

const data = shallowRef<ApiResponse>({
  month: '',
  metric: '',
  leaderboard: []
})
const pending = ref(true)
const error = ref(false)

async function load() {
  pending.value = true
  error.value = false
  try {
    data.value = await $fetch<ApiResponse>(requestUrl(activeMonth.value))
  } catch {
    error.value = true
    data.value = { month: '', metric: '', leaderboard: [] }
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  void load()
})

watch(activeMonth, () => {
  void load()
})

useSeoMeta({
  title: 'Wyzwania klubu — Slavia',
  description:
    'Ranking aktywności w dzienniku treningów — CKS Slavia Ruda Śląska.',
  ogTitle: 'Wyzwania klubu — CKS Slavia',
  robots: 'index, follow'
})

function applyMonthFilter() {
  const m = monthInput.value.trim()
  if (!m) {
    activeMonth.value = null
    return
  }
  if (!/^\d{4}-\d{2}$/.test(m)) {
    return
  }
  activeMonth.value = m
}

const rows = computed(() => data.value?.leaderboard ?? [])

function athleteHref(row: LeaderboardRow) {
  return athleteProfilePath(row.full_name, row.athlete_id)
}
</script>

<template>
  <UContainer class="py-10 md:py-14">
    <header class="mb-10 max-w-3xl">
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-primary">
        Klub · community
      </p>
      <h1 class="mt-2 text-3xl font-black tracking-tight text-highlighted md:text-4xl">
        Wyzwanie miesiąca
      </h1>
      <p class="mt-3 text-muted leading-relaxed">
        Ranking oparty na liczbie
        <strong class="text-highlighted">wpisów w dzienniku treningów</strong>
        w wybranym miesiącu (MVP „community challenges”; pełny tonnage — po rozszerzeniu modelu wpisów).
      </p>
    </header>

    <UCard class="mb-8 border-default/60">
      <div class="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
        <UFormField label="Miesiąc (YYYY-MM)" class="max-w-xs">
          <div class="flex gap-2">
            <UInput
              v-model="monthInput"
              placeholder="puste = bieżący"
              size="lg"
              class="font-mono"
            />
            <UButton size="lg" variant="soft" color="primary" @click="applyMonthFilter">
              Pokaż
            </UButton>
          </div>
        </UFormField>
        <UButton icon="i-lucide-refresh-ccw" variant="ghost" color="neutral" @click="load()">
          Odśwież
        </UButton>
      </div>
      <p v-if="data.month" class="mt-4 text-sm text-muted">
        Ranking za <span class="font-semibold text-highlighted">{{ data.month }}</span>.
      </p>
    </UCard>

    <div v-if="pending && rows.length === 0" class="flex items-center gap-2 py-16 text-muted">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      Wczytywanie rankingu…
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      title="Nie udało się pobrać rankingu"
      description="Sprawdź połączenie lub popraw format miesiąca."
    />

    <div
      v-else-if="rows.length === 0"
      class="rounded-2xl border border-dashed border-default py-16 text-center text-muted"
    >
      Brak wpisów w dzienniku w tym miesiącu.
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-default/60">
      <table class="w-full text-left text-sm">
        <thead class="bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted">
          <tr>
            <th class="px-4 py-3">
              #
            </th>
            <th class="px-4 py-3">
              Zawodnik
            </th>
            <th class="px-4 py-3 text-right">
              Jednostki (wpisy)
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default/50">
          <tr
            v-for="(row, idx) in rows"
            :key="row.athlete_id"
            class="bg-background/80 hover:bg-primary/5"
          >
            <td class="px-4 py-3 font-mono font-bold text-primary">
              {{ idx + 1 }}
            </td>
            <td class="px-4 py-3 font-semibold text-highlighted">
              <NuxtLink
                :to="athleteHref(row)"
                class="hover:text-primary hover:underline"
              >
                {{ row.full_name }}
              </NuxtLink>
            </td>
            <td class="px-4 py-3 text-right font-mono tabular-nums">
              {{ row.session_count }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UContainer>
</template>

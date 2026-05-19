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
  <PublicPageLayout>
    <PublicPageHeader
      eyebrow="Klub · community"
      title="Wyzwanie miesiąca"
      description="Ranking oparty na liczbie wpisów w dzienniku treningów w wybranym miesiącu."
    />

    <UCard class="slavia-page-card mb-8">
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

    <PublicEmptyState
      v-else-if="rows.length === 0"
      icon="i-lucide-flame"
      title="Brak wpisów w tym miesiącu"
      description="Ranking wypełni się, gdy zawodnicy zapiszą jednostki w dzienniku treningowym."
    />

    <template v-else>
      <div class="slavia-page-card hidden overflow-hidden md:block">
        <div class="slavia-data-table overflow-x-auto p-2 sm:p-4">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Zawodnik</th>
                <th class="text-right">
                  Jednostki (wpisy)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in rows"
                :key="row.athlete_id"
              >
                <td class="font-mono font-bold text-primary">
                  {{ idx + 1 }}
                </td>
                <td class="font-semibold text-highlighted">
                  <NuxtLink
                    :to="athleteHref(row)"
                    class="hover:text-primary hover:underline"
                  >
                    {{ row.full_name }}
                  </NuxtLink>
                </td>
                <td class="text-right font-mono tabular-nums">
                  {{ row.session_count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid gap-3 md:hidden">
        <UCard
          v-for="(row, idx) in rows"
          :key="`m-${row.athlete_id}`"
          class="slavia-page-card"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="font-mono text-lg font-black text-primary">#{{ idx + 1 }}</span>
            <span class="font-mono text-sm tabular-nums text-muted">{{ row.session_count }} wpisów</span>
          </div>
          <NuxtLink
            :to="athleteHref(row)"
            class="mt-2 block text-base font-bold text-highlighted hover:text-primary"
          >
            {{ row.full_name }}
          </NuxtLink>
        </UCard>
      </div>
    </template>
  </PublicPageLayout>
</template>

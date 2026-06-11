<script setup lang="ts">
import type { Player } from '~/types/models'

const api = useApi()

const players = ref<Player[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    players.value = await api<Player[]>('/api/athletes').catch(() => [])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})

const withAccount = computed(() =>
  (players.value || []).filter(p => p.user_id)
)
const withoutAccount = computed(() =>
  (players.value || []).filter(p => p.is_active !== false && !p.user_id)
)

const toolbarSummary = computed(() => {
  if (loading.value) return undefined
  return `${withAccount.value.length} z kontem · ${withoutAccount.value.length} bez konta`
})
</script>

<template>
  <div class="space-y-4">
    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Konta logowania zawodników"
      description="Jako trener tworzysz lub prosisz o konto w zakładce Zawodnicy — w modalu edycji, sekcja „Konto i dostęp”. Pełna lista kont systemowych jest dostępna administratorowi."
      class="rounded-2xl"
    />

    <PanelDataToolbar :summary="toolbarSummary" />

    <PanelLoadingState
      v-if="loading"
      label="Ładowanie powiązań kont…"
      compact
    />

    <div
      v-else
      class="grid gap-4 lg:grid-cols-2"
    >
      <UCard class="rounded-2xl">
        <h3 class="text-sm font-bold text-highlighted">
          Z kontem ({{ withAccount.length }})
        </h3>
        <ul
          v-if="withAccount.length"
          class="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm"
        >
          <li
            v-for="p in withAccount"
            :key="p.id"
            class="flex justify-between gap-2 rounded-lg border border-default/50 px-3 py-2"
          >
            <span class="font-medium">{{ p.full_name }}</span>
            <UBadge size="xs" variant="soft" color="success">Konto</UBadge>
          </li>
        </ul>
        <SlaviaEmptyState
          v-else
          compact
          icon="i-lucide-user-check"
          title="Brak powiązanych kont"
          description="Aktywni zawodnicy bez loginu pojawią się w kolumnie obok."
          class="mt-3"
        />
      </UCard>

      <UCard class="rounded-2xl border-warning/25">
        <h3 class="text-sm font-bold text-highlighted">
          Bez konta ({{ withoutAccount.length }})
        </h3>
        <p class="mt-1 text-xs text-muted">
          Otwórz zawodnika w zakładce „Zawodnicy” i włącz „Utwórz konto” lub wyślij prośbę do admina.
        </p>
        <ul
          v-if="withoutAccount.length"
          class="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm"
        >
          <li
            v-for="p in withoutAccount.slice(0, 20)"
            :key="p.id"
            class="rounded-lg border border-default/50 px-3 py-2 text-muted"
          >
            {{ p.full_name }}
          </li>
        </ul>
        <SlaviaEmptyState
          v-else
          compact
          icon="i-lucide-key-round"
          title="Wszyscy aktywni mają konta"
          description="Nowi zawodnicy bez loginu pojawią się na tej liście."
          class="mt-3"
        />
      </UCard>
    </div>
  </div>
</template>

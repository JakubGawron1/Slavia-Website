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
</script>

<template>
  <UAlert
    color="info"
    variant="subtle"
    icon="i-lucide-info"
    title="Konta logowania zawodników"
    description="Jako trener tworzysz lub prosisz o konto w zakładce Zawodnicy — w modalu edycji, sekcja „Konto i dostęp”. Pełna lista kont systemowych jest dostępna administratorowi."
    class="mb-6 rounded-2xl"
  />

  <div class="grid gap-4 lg:grid-cols-2">
    <UCard class="rounded-2xl">
      <h3 class="text-sm font-bold text-highlighted">
        Z kontem ({{ withAccount.length }})
      </h3>
      <ul v-if="!loading && withAccount.length" class="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
        <li
          v-for="p in withAccount"
          :key="p.id"
          class="flex justify-between gap-2 rounded-lg border border-default/50 px-3 py-2"
        >
          <span class="font-medium">{{ p.full_name }}</span>
          <UBadge size="xs" variant="soft" color="success">Konto</UBadge>
        </li>
      </ul>
      <p v-else-if="!loading" class="mt-3 text-sm text-muted">Brak powiązanych kont.</p>
      <UIcon v-else name="i-lucide-loader-2" class="mt-4 size-6 animate-spin text-muted" />
    </UCard>

    <UCard class="rounded-2xl border-warning/25">
      <h3 class="text-sm font-bold text-highlighted">
        Bez konta ({{ withoutAccount.length }})
      </h3>
      <p class="mt-1 text-xs text-muted">
        Otwórz zawodnika w zakładce „Zawodnicy” i włącz „Utwórz konto” lub wyślij prośbę do admina.
      </p>
      <ul v-if="!loading && withoutAccount.length" class="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
        <li
          v-for="p in withoutAccount.slice(0, 20)"
          :key="p.id"
          class="rounded-lg border border-default/50 px-3 py-2 text-muted"
        >
          {{ p.full_name }}
        </li>
      </ul>
      <p v-else-if="!loading" class="mt-3 text-sm text-muted">Wszyscy aktywni mają konta.</p>
    </UCard>
  </div>

  <div class="mt-6">
    <UButton
      to="/trainer/zawodnicy"
      color="primary"
      variant="soft"
      icon="i-lucide-users"
    >
      Przejdź do zawodników
    </UButton>
  </div>
</template>

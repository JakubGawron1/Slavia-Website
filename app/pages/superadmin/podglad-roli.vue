<script setup lang="ts">
import type { AuthUser } from '~/types/models'

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Podgląd roli — SuperAdmin',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const preview = useRolePreview()
const toast = useToast()

type Grouped = { admins: AuthUser[], trainers: AuthUser[], athletes: AuthUser[] }

const { data: grouped, pending } = await useAsyncData('role-preview-accounts', () =>
  apiFetch<Grouped>('/api/admins/grouped').catch(() => ({ admins: [], trainers: [], athletes: [] }))
)

const search = ref('')
const selectedUserId = ref<string | null>(null)
const selectedRole = ref<'Athlete' | 'Trainer' | 'Admin'>('Athlete')
const contextLoading = ref(false)
const starting = ref(false)
const previewContext = ref<Awaited<ReturnType<typeof preview.fetchContext>> | null>(null)

type AccountRow = { user: AuthUser, bucket: string }

const ATHLETE_PREVIEW_MODULES = [
  { label: 'Panel', to: '/athlete', icon: 'i-lucide-layout-dashboard' },
  { label: 'Dziennik', to: '/athlete/dziennik', icon: 'i-lucide-book-marked' },
  { label: 'Plany', to: '/athlete/plany', icon: 'i-lucide-clipboard-list' },
  { label: 'Składki', to: '/athlete/skladki', icon: 'i-lucide-banknote' },
  { label: 'Kalendarz startów', to: '/athlete/kalendarz', icon: 'i-lucide-calendar-heart' },
  { label: 'Wyniki', to: '/athlete/wyniki', icon: 'i-lucide-trophy' },
  { label: 'Regeneracja', to: '/athlete/regeneracja', icon: 'i-lucide-heart-pulse' },
  { label: 'Oś czasu', to: '/athlete/timeline', icon: 'i-lucide-timeline' },
  { label: 'Inne ćwiczenia', to: '/athlete/exercises', icon: 'i-lucide-bar-chart-3' },
  { label: 'Trener AI', to: '/athlete/ai-coach', icon: 'i-lucide-sparkles' },
  { label: 'Slavia Wrapped', to: '/athlete/wrapped', icon: 'i-lucide-party-popper' },
  { label: 'Analiza sztangi', to: '/athlete/analiza-sztangi', icon: 'i-lucide-scan-line' },
  { label: 'Czat', to: '/klub/czat', icon: 'i-lucide-messages-square' },
  { label: 'Powiadomienia', to: '/klub/powiadomienia', icon: 'i-lucide-bell' }
] as const

const allAccounts = computed((): AccountRow[] => {
  const g = grouped.value
  if (!g) return []
  const rows: AccountRow[] = []
  for (const u of g.admins ?? []) rows.push({ user: u, bucket: 'Admin' })
  for (const u of g.trainers ?? []) rows.push({ user: u, bucket: 'Trener' })
  for (const u of g.athletes ?? []) rows.push({ user: u, bucket: 'Zawodnik' })
  return rows.sort((a, b) => a.user.username.localeCompare(b.user.username, 'pl'))
})

const filteredAccounts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allAccounts.value
  return allAccounts.value.filter((row) => {
    const roles = (row.user.roles ?? []).join(' ').toLowerCase()
    return row.user.username.toLowerCase().includes(q) || roles.includes(q)
  })
})

const roleOptions = computed(() => {
  const roles = previewContext.value?.preview_roles ?? []
  const labels: Record<string, string> = {
    Athlete: 'Zawodnik — panel /athlete',
    Trainer: 'Trener — panel /trainer',
    Admin: 'Administrator — panel /admin'
  }
  return roles.map(r => ({
    value: r as 'Athlete' | 'Trainer' | 'Admin',
    label: labels[r] ?? r
  }))
})

watch(selectedUserId, async (id) => {
  previewContext.value = null
  if (!id) return
  contextLoading.value = true
  try {
    previewContext.value = await preview.fetchContext(id)
    const first = previewContext.value.preview_roles[0] as 'Athlete' | 'Trainer' | 'Admin' | undefined
    if (first) selectedRole.value = first
  } catch (e) {
    toast.add({ title: 'Błąd', description: getApiErrorMessage(e), color: 'error' })
    selectedUserId.value = null
  } finally {
    contextLoading.value = false
  }
})

async function start() {
  if (!selectedUserId.value || starting.value) return
  starting.value = true
  try {
    await preview.startPreview(selectedUserId.value, selectedRole.value)
    toast.add({
      title: 'Podgląd rozpoczęty',
      description: 'Tryb read-only — zapis jest zablokowany. Operacja zapisana w audycie.',
      color: 'success'
    })
  } catch (e) {
    toast.add({ title: 'Nie udało się', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      eyebrow="SuperAdmin"
      title="Podgląd roli"
      icon="i-lucide-eye"
      description="Symulator read-only: zobacz panel jako wybrane konto bez logowania na nie. Każde uruchomienie i zakończenie trafia do logów audytu."
      :breadcrumbs="[
        { label: 'SuperAdmin', to: '/superadmin', icon: 'i-lucide-shield-check' },
        { label: 'Podgląd roli', icon: 'i-lucide-eye' }
      ]"
    />

    <UCard
      v-if="preview.isActive.value"
      class="mb-6 overflow-hidden rounded-2xl border-warning/40 bg-warning/5 ring-1 ring-warning/25"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm">
          Aktywny podgląd:
          <strong>{{ preview.state.value?.targetUsername }}</strong>
          ({{ preview.state.value?.previewRole }})
        </p>
        <UButton color="warning" variant="soft" @click="preview.endPreview()">
          Zakończ podgląd
        </UButton>
      </div>
    </UCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <UCard class="overflow-hidden rounded-2xl border-default/70 ring-1 ring-default/20">
        <template #header>
          <h2 class="text-base font-semibold">
            Wybierz konto
          </h2>
        </template>
        <PanelDataToolbar
          v-if="!pending && allAccounts.length"
          :summary="`${filteredAccounts.length} z ${allAccounts.length} kont`"
        >
          <template #filters>
            <UFormField label="Szukaj" class="w-full">
              <UInput
                v-model="search"
                icon="i-lucide-search"
                placeholder="Login lub rola…"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </template>
        </PanelDataToolbar>
        <PanelLoadingState
          v-if="pending"
          compact
          label="Wczytywanie kont…"
        />
        <ul
          v-else-if="filteredAccounts.length"
          class="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-default/60 p-1"
          role="listbox"
        >
          <li
            v-for="row in filteredAccounts"
            :key="row.user.id"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
              :class="selectedUserId === row.user.id ? 'bg-primary/10 ring-1 ring-primary/30' : ''"
              @click="selectedUserId = row.user.id"
            >
              <span class="font-medium">{{ row.user.username }}</span>
              <UBadge variant="subtle" size="xs">
                {{ row.bucket }}
              </UBadge>
            </button>
          </li>
        </ul>
        <SlaviaEmptyState
          v-else
          icon="i-lucide-users"
          title="Brak kont"
          description="Nie znaleziono kont pasujących do wyszukiwania."
        />
      </UCard>

      <UCard class="overflow-hidden rounded-2xl border-default/70 ring-1 ring-default/20">
        <template #header>
          <h2 class="text-base font-semibold">
            Perspektywa panelu
          </h2>
        </template>
        <div v-if="!selectedUserId" class="text-sm text-muted">
          Wybierz konto z listy po lewej.
        </div>
        <PanelLoadingState
          v-else-if="contextLoading"
          compact
          label="Weryfikacja ról…"
        />
        <div v-else-if="previewContext" class="space-y-4">
          <dl class="grid gap-2 text-sm">
            <div class="flex gap-2">
              <dt class="text-muted">
                Login:
              </dt>
              <dd class="font-medium">
                {{ previewContext.username }}
              </dd>
            </div>
            <div class="flex flex-wrap gap-1">
              <dt class="sr-only">
                Role konta
              </dt>
              <UBadge
                v-for="r in previewContext.roles"
                :key="r"
                variant="subtle"
                size="xs"
              >
                {{ r }}
              </UBadge>
            </div>
            <div v-if="previewContext.athlete_name" class="flex gap-2">
              <dt class="text-muted">
                Profil sportowy:
              </dt>
              <dd>{{ previewContext.athlete_name }}</dd>
            </div>
          </dl>

          <UFormField label="Panel do podglądu">
            <URadioGroup
              v-model="selectedRole"
              :options="roleOptions"
            />
          </UFormField>

          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-shield-alert"
            title="Tylko odczyt"
            description="Nie możesz zapisywać ani usuwać danych w tym trybie. SuperAdmin pozostaje zalogowany — token JWT się nie zmienia."
          />

          <UButton
            color="primary"
            icon="i-lucide-play"
            :loading="starting"
            :disabled="!roleOptions.length"
            @click="start"
          >
            Rozpocznij podgląd
          </UButton>
        </div>
      </UCard>
    </div>

    <UCard class="mt-6 overflow-hidden rounded-2xl border-default/70 ring-1 ring-default/20">
      <template #header>
        <h2 class="text-base font-semibold">
          Zakres podglądu zawodnika
        </h2>
      </template>
      <p class="mb-4 text-sm text-muted">
        Po starcie podglądu dane „moje” (w tym czat i powiadomienia) są przepisywane na konto wybranego użytkownika (bez zmiany JWT). Moduły objęte podglądem zawodnika:
      </p>
      <ul class="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="item in ATHLETE_PREVIEW_MODULES"
          :key="item.to"
          class="flex items-center gap-2 rounded-lg border border-default/60 px-3 py-2"
        >
          <UIcon :name="item.icon" class="size-4 shrink-0 text-primary" />
          <NuxtLink :to="item.to" class="font-medium hover:text-primary">
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
      <p class="mt-4 text-xs text-muted">
        Trener i Admin: nawigacja w ich panelu (dane klubowe współdzielone). Zapis wszędzie zablokowany — nagłówek „Podgląd read-only”.
      </p>
    </UCard>
  </PanelPageLayout>
</template>

<script setup lang="ts">
import type { Athlete, TrainingLogEntry } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import { isProbablyRichHtml } from '~/utils/html'

definePageMeta({ middleware: 'athlete-dziennik' })

useSeoMeta({
  title: 'Dziennik treningów — Slavia',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const toast = useToast()
const auth = useAuth()

const redagujBase = '/athlete/dziennik/redaguj'

function isEntryMine(e: TrainingLogEntry) {
  const uid = auth.user.value?.id
  return !!uid && e.author_user_id === uid
}

type DiaryBundle = { athlete: Athlete | null, entries: TrainingLogEntry[] }

const { data: bundle, pending, refresh } = await useAsyncData(
  'athlete-diary-bundle',
  async (): Promise<DiaryBundle> => {
    const athlete = await apiFetch<Athlete>('/api/athletes/me').catch(() => null)
    if (!athlete?.id) {
      return { athlete: null, entries: [] }
    }
    const entries = await apiFetch<TrainingLogEntry[]>(`/api/athletes/${athlete.id}/training-log`).catch(
      () => [] as TrainingLogEntry[]
    )
    return { athlete, entries }
  },
  { default: () => ({ athlete: null, entries: [] }) }
)

const meAthlete = computed(() => bundle.value?.athlete ?? null)
const entries = computed(() => bundle.value?.entries ?? [])
const athleteId = computed(() => meAthlete.value?.id ?? '')

async function removeEntry(e: TrainingLogEntry) {
  const aid = athleteId.value
  if (!aid) {
    return
  }
  if (!isEntryMine(e)) {
    toast.add({
      title: 'Brak uprawnień',
      description: 'Możesz usuwać tylko wpisy, które sam utworzyłeś.',
      color: 'warning'
    })
    return
  }
  if (!confirm(`Usunąć wpis z dnia ${e.session_date.slice(0, 10)}?`)) {
    return
  }
  try {
    await apiFetch(`/api/athletes/${aid}/training-log/${e.id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({
      title: 'Nie udało się usunąć',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="athlete"
      title="Dziennik treningów"
      icon="i-lucide-book-marked"
      description="Dodawaj własne notatki po jednostkach — widzą je także trenerzy i administracja. Pełna edycja (TipTap) jest na osobnej stronie."
    >
      <template #actions>
        <UButton
          v-if="meAthlete"
          :to="redagujBase"
          color="primary"
          icon="i-lucide-maximize-2"
        >
          Nowy wpis (pełny ekran)
        </UButton>
        <UButton
          icon="i-lucide-refresh-ccw"
          variant="soft"
          :loading="pending"
          @click="refresh()"
        >
          Odśwież
        </UButton>
        <UButton
          to="/athlete"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
        >
          Wróć do panelu
        </UButton>
      </template>
    </PanelPageHeader>

    <div
      v-if="pending"
      class="flex items-center gap-2 py-12 text-muted"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin"
      />
      Ładowanie…
    </div>

    <UAlert
      v-else-if="!meAthlete"
      color="warning"
      variant="subtle"
      title="Brak profilu zawodnika"
      description="Twoje konto nie jest powiązane z rekordem zawodnika. Skontaktuj się z klubem."
    />

    <template v-else>
      <h2 class="mb-4 text-xl font-bold text-highlighted">
        Historia wpisów
      </h2>

      <PublicEmptyState
        v-if="entries.length === 0"
        icon="i-lucide-book-open"
        title="Brak wpisów w dzienniku"
        description="Dodaj pierwszą jednostkę lub poczekaj na notatkę od trenera."
      >
        <UButton :to="redagujBase" color="primary" icon="i-lucide-plus">
          Dodaj pierwszą jednostkę
        </UButton>
      </PublicEmptyState>

      <div
        v-else
        class="space-y-4"
      >
        <UCard
          v-for="e in entries"
          :key="e.id"
          class="overflow-hidden"
        >
          <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div class="min-w-0 flex-1 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  color="primary"
                  variant="subtle"
                >
                  {{ e.session_date.slice(0, 10) }}
                </UBadge>
                <span
                  v-if="e.title"
                  class="font-semibold text-highlighted"
                >{{ e.title }}</span>
              </div>
              <SlaviaSafeHtml
                v-if="isProbablyRichHtml(e.notes)"
                class="slavia-rich-content text-sm leading-relaxed text-highlighted"
                :html="e.notes"
              />
              <p
                v-else
                class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed"
              >
                {{ e.notes }}
              </p>
              <p class="text-[11px] text-muted">
                <span v-if="e.author_username">Dodał: {{ e.author_username }}</span>
                <span v-if="e.created_at">{{ e.author_username ? ' · ' : '' }}{{ e.created_at.slice(0, 16).replace('T', ' ') }}</span>
              </p>
            </div>
            <div class="flex shrink-0 gap-1 sm:flex-col">
              <template v-if="isEntryMine(e)">
                <UButton
                  size="xs"
                  variant="soft"
                  icon="i-lucide-pencil"
                  :to="{ path: redagujBase, query: { wpis: e.id } }"
                >
                  Edytuj
                </UButton>
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="removeEntry(e)"
                >
                  Usuń
                </UButton>
              </template>
              <span
                v-else
                class="max-w-[9rem] self-center text-center text-[11px] leading-snug text-muted sm:self-start sm:max-w-[11rem] sm:pt-0.5 sm:text-right"
              >
                Tylko podgląd — edycję wpisu kadry zostaw trenerowi.
              </span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </PanelPageLayout>
</template>

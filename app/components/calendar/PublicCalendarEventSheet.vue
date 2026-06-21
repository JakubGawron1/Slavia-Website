<script setup lang="ts">
import type { CalendarEvent } from '~/types/models'

const open = defineModel<boolean>('open', { required: true })
const participantIds = defineModel<string[]>('participantIds', { required: true })
const formState = defineModel<{
  title: string
  date: string
  location: string
  description: string
  category: string
  status: string
  club_participates: boolean
}>('formState', { required: true })

defineProps<{
  title: string
  readOnlyEvent: boolean
  editingId: string | null
  isSubmitting: boolean
  bannerEvent: CalendarEvent | null
  canManageEvents: boolean
  isEditingClubRecurringTraining: boolean
  categories: Array<{ value: string, label: string, desc: string }>
  athletesPickList: Array<{ id: string, full_name: string }>
  canExportReadOnlyCompetitionIcs: boolean
  canShowCalendarDeleteButton: boolean
}>()

const emit = defineEmits<{
  save: []
  delete: [id: string]
  exportIcs: []
}>()
</script>

<template>
  <SlaviaEditorSheet
    v-model:open="open"
    :title="title"
    size="lg"
    :prevent-close="isSubmitting"
    scroll-restore-key="kalendarz-event-sheet"
  >
    <div class="slavia-form-stack">
      <div
        v-if="readOnlyEvent"
        class="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100"
      >
        <template v-if="bannerEvent?.external_source || bannerEvent?.type === 'external'">
          <span v-if="canManageEvents">Zawody z kalendarza zewnętrznego (PZPC lub PodnoszenieCiezarow.pl) — nazwa i termin są aktualizowane przy synchronizacji. Możesz zmienić status oraz przypisać zawodników klubu.</span>
          <span v-else>Importer z krajowych kalendarzy — szczegóły tylko do odczytu. Przypisania widzą zawodnicy po zalogowaniu.</span>
        </template>
        <template v-else-if="bannerEvent?.type === 'training'">
          <span v-if="canManageEvents">Stałe treningi (Pn, Śr, Pt). Zmiana <strong>statusu</strong> (np. odwołane, przesunięte) i przycisk „Usuń z kalendarza” zapisują się w bazie — <strong>ten sam widok mają zawodnicy</strong> w „Mój kalendarz”. Pełna siatka: przycisk przywrócenia u góry.</span>
          <span v-else>To stały wpis treningowy z grafiku — podgląd bez edycji. Wydarzenia klubu dodaje trener lub administrator po zalogowaniu.</span>
        </template>
        <template v-else>
          Podgląd tylko do odczytu. Zaloguj się jako trener lub administrator, aby dodawać i edytować wydarzenia z bazy klubu.
        </template>
      </div>
      <UFormField
        label="Kategoria"
        required
      >
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="cat in categories"
            :key="cat.value"
            type="button"
            class="p-2.5 rounded-xl border-2 text-[11px] font-bold text-center transition-all"
            :class="formState.category === cat.value
              ? cat.value === 'championship' ? 'bg-red-500/20 border-red-500 text-red-400'
                : cat.value === 'league' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-teal-500/20 border-teal-500 text-teal-400'
              : 'border-default bg-muted/10 text-muted hover:bg-muted/30'"
            :disabled="readOnlyEvent || isEditingClubRecurringTraining"
            @click="!readOnlyEvent && !isEditingClubRecurringTraining && (formState.category = cat.value)"
          >
            {{ cat.label }}
          </button>
        </div>
      </UFormField>

      <UFormField
        label="Nazwa"
        required
      >
        <UInput
          v-model="formState.title"
          placeholder="Mistrzostwa Polski..."
          size="lg"
          class="w-full"
          :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
        />
      </UFormField>
      <div class="slavia-form-grid grid-cols-1 sm:grid-cols-2">
        <UFormField
          label="Data"
          required
        >
          <UInput
            v-model="formState.date"
            type="date"
            size="lg"
            class="w-full"
            :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
          />
        </UFormField>
        <UFormField
          label="Lokalizacja"
          required
        >
          <UInput
            v-model="formState.location"
            placeholder="Ruda Śląska"
            size="lg"
            class="w-full"
            :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
          />
        </UFormField>
      </div>
      <UFormField label="Status">
        <SlaviaFormNativeSelect
          v-model="formState.status"
          :disabled="readOnlyEvent && !bannerEvent?.external_source"
        >
          <option value="scheduled">
            Zaplanowane
          </option>
          <option value="cancelled">
            Odwołane
          </option>
          <option value="moved">
            Przesunięte
          </option>
        </SlaviaFormNativeSelect>
      </UFormField>
      <div
        v-if="canManageEvents && !isEditingClubRecurringTraining && (editingId == null || !String(editingId).startsWith('training-'))"
        class="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-1"
      >
        <label class="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            v-model="formState.club_participates"
            type="checkbox"
            class="rounded border-default"
          >
          <span>Klub bierze udział w zawodach</span>
        </label>
        <p class="text-xs text-muted pl-6">
          Bez przypisywania zawodników — wpis liczy się w statystykach na stronie Klub.
        </p>
      </div>
      <div
        v-else-if="formState.club_participates && bannerEvent?.type !== 'training'"
        class="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-primary"
      >
        Klub bierze udział w tych zawodach.
      </div>
      <div
        v-if="canManageEvents && !readOnlyEvent && athletesPickList.length && (editingId == null || !String(editingId).startsWith('training-'))"
        class="rounded-xl border border-default p-3 space-y-2"
      >
        <p class="text-xs font-bold text-muted uppercase tracking-wide">
          Przypisani zawodnicy (startują razem)
        </p>
        <div class="max-h-40 overflow-y-auto space-y-2">
          <label
            v-for="a in athletesPickList"
            :key="a.id"
            class="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              v-model="participantIds"
              type="checkbox"
              :value="a.id"
              class="rounded border-default"
            >
            <span>{{ a.full_name }}</span>
          </label>
        </div>
      </div>
      <UFormField label="Opis">
        <UTextarea
          v-model="formState.description"
          placeholder="Szczegóły..."
          :rows="4"
          class="w-full"
          :disabled="readOnlyEvent || !!bannerEvent?.external_source || isEditingClubRecurringTraining"
        />
      </UFormField>
      <div
        v-if="bannerEvent?.external_url"
        class="text-sm"
      >
        <a
          :href="bannerEvent.external_url"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-primary underline underline-offset-2 hover:no-underline"
        >
          Otwórz stronę źródła zawodów
        </a>
      </div>
    </div>
    <template #footer>
      <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-h-10 shrink-0 flex-wrap items-center gap-2">
          <UButton
            v-if="canExportReadOnlyCompetitionIcs"
            variant="soft"
            color="primary"
            size="lg"
            icon="i-lucide-calendar-plus"
            @click="emit('exportIcs')"
          >
            Dodaj do kalendarza (.ics)
          </UButton>
          <UButton
            v-if="canShowCalendarDeleteButton"
            color="error"
            variant="ghost"
            size="lg"
            icon="i-lucide-trash-2"
            @click="editingId && emit('delete', editingId)"
          >
            {{ typeof editingId === 'string' && editingId.startsWith('training-') ? 'Usuń z kalendarza' : 'Usuń' }}
          </UButton>
        </div>
        <div class="slavia-form-actions w-full sm:w-auto">
          <UButton
            color="neutral"
            variant="soft"
            size="lg"
            @click="open = false"
          >
            Anuluj
          </UButton>
          <UButton
            size="lg"
            :loading="isSubmitting"
            :disabled="readOnlyEvent && !bannerEvent?.external_source"
            @click="emit('save')"
          >
            Zapisz
          </UButton>
        </div>
      </div>
    </template>
  </SlaviaEditorSheet>
</template>

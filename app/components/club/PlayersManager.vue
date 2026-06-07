<script setup lang="ts">
import { athleteProfilePath } from '~/utils/slug'
import { usePlayersManagerList } from '~/composables/usePlayersManagerList'
import { usePlayersManagerEditor } from '~/composables/usePlayersManagerEditor'
import { PLAYERS_EDITOR_KEY } from '~/components/club/players/playersEditorContext'

const route = useRoute()

const {
  players,
  loading,
  searchQuery,
  filterActive,
  filterGender,
  playersFiltered,
  activeFilterItems,
  genderFilterItems,
  loadPlayers
} = usePlayersManagerList()

const editor = usePlayersManagerEditor({ players, loadPlayers })
provide(PLAYERS_EDITOR_KEY, editor)

const {
  modalOpen,
  deleteModalOpen,
  editorTabs,
  activeEditorTab,
  saving,
  deleting,
  editingId,
  form,
  editingPlayer,
  isDirty,
  pendingDelete,
  canDeleteAthlete,
  closeEditModal,
  setEditorTab,
  openCreate,
  openEdit,
  askDelete,
  cancelDelete,
  confirmDelete,
  tryOpenEditFromQuery
} = editor

const publicProfilePath = computed(() => {
  const p = editingPlayer.value
  if (!p?.id || !p.full_name.trim()) return null
  return athleteProfilePath(p.full_name, p.id)
})

onMounted(async () => {
  await loadPlayers()
  tryOpenEditFromQuery()
})

watch(
  () => route.query.edit,
  () => {
    if (!players.value.length) return
    tryOpenEditFromQuery()
  }
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">
        Zarządzaj rekordami zgodnie z danymi w systemie klubowym.
      </p>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Dodaj zawodnika
      </UButton>
    </div>

    <ClubPlayersListPanel
      :players="playersFiltered"
      :loading="loading"
      :search-query="searchQuery"
      :filter-active="filterActive"
      :filter-gender="filterGender"
      :active-filter-items="activeFilterItems"
      :gender-filter-items="genderFilterItems"
      :can-delete-athlete="canDeleteAthlete"
      @update:search-query="searchQuery = $event"
      @update:filter-active="filterActive = $event"
      @update:filter-gender="filterGender = $event"
      @edit="openEdit"
      @delete="askDelete"
    />

    <SlaviaEditorSheet
      v-model:open="modalOpen"
      :title="editingId ? 'Edycja zawodnika' : 'Nowy zawodnik'"
      size="2xl"
      :prevent-close="saving"
      :is-dirty="isDirty"
      scroll-restore-key="players-manager-sheet"
    >
      <template #header>
        <div class="slavia-editor-hero">
          <UAvatar
            :src="form.image_url"
            :alt="form.full_name || 'Zawodnik'"
            size="xl"
            class="ring-2 ring-default/60"
          />
          <div class="slavia-editor-hero__meta">
            <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
              {{ editingId ? 'Edycja zawodnika' : 'Nowy zawodnik' }}
            </p>
            <h2 class="truncate text-lg font-bold text-highlighted sm:text-xl">
              {{ form.full_name.trim() || (editingId ? 'Zawodnik' : 'Nowy rekord') }}
            </h2>
            <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
              <UBadge :color="form.is_active ? 'success' : 'neutral'" variant="subtle" size="sm">
                {{ form.is_active ? 'Aktywny' : 'Nieaktywny' }}
              </UBadge>
              <UBadge v-if="form.has_standing_order" color="success" variant="subtle" size="sm">
                Przelew stały
              </UBadge>
              <UBadge v-if="editingPlayer?.user_id" color="primary" variant="subtle" size="sm">
                Konto
              </UBadge>
              <UButton
                v-if="publicProfilePath"
                :to="publicProfilePath"
                target="_blank"
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-external-link"
                class="ml-1"
              >
                Profil publiczny
              </UButton>
            </div>
          </div>
        </div>
      </template>

      <template #tabs>
        <nav class="slavia-editor-tabs" aria-label="Sekcje formularza">
          <button
            v-for="tab in editorTabs"
            :key="tab.id"
            type="button"
            class="slavia-editor-tab"
            :class="{ 'slavia-editor-tab--active': activeEditorTab === tab.id }"
            @click="setEditorTab(tab.id)"
          >
            <UIcon :name="tab.icon" class="size-4 shrink-0" />
            {{ tab.label }}
          </button>
        </nav>
      </template>

      <ClubPlayersEditorForm />

      <template #footer>
        <div class="slavia-form-actions">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="lg"
            :disabled="saving"
            @click="closeEditModal"
          >
            Anuluj
          </UButton>
          <UButton type="submit" form="players-editor-form" size="lg" :loading="saving">
            Zapisz
          </UButton>
        </div>
      </template>
    </SlaviaEditorSheet>

    <SlaviaModal
      v-model:open="deleteModalOpen"
      title="Usunąć zawodnika?"
      description="Tej operacji nie cofniesz."
      :dismissible="!deleting"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #body>
        <p v-if="pendingDelete" class="text-sm leading-relaxed text-muted">
          Czy na pewno usunąć
          <span class="font-semibold text-highlighted">„{{ pendingDelete.full_name }}”</span>?
          Rekord zostanie trwale usunięty z bazy.
        </p>
      </template>
      <template #footer>
        <div class="slavia-form-actions w-full">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="lg"
            :disabled="deleting"
            @click="cancelDelete"
          >
            Wróć
          </UButton>
          <UButton type="button" color="error" size="lg" :loading="deleting" @click="confirmDelete">
            Usuń
          </UButton>
        </div>
      </template>
    </SlaviaModal>
  </div>
</template>

<script setup lang="ts">
import { CMS_MODULE_VERSION } from '~/types/cms'

const cms = useCms()

onMounted(() => {
  cms.restoreEditModeFromStorage()
})

watch(
  () => cms.canEdit.value,
  (allowed) => {
    if (allowed) cms.restoreEditModeFromStorage()
  },
  { immediate: true }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="cms.showGlobalEditToggle.value"
      class="cms-global-edit"
      :class="{ 'cms-global-edit--active': cms.editMode.value }"
    >
      <button
        type="button"
        class="cms-global-edit__fab"
        :aria-pressed="cms.editMode.value"
        :aria-label="cms.editMode.value ? 'Wyłącz tryb edycji CMS' : 'Włącz tryb edycji CMS'"
        @click="cms.toggleEditMode()"
      >
        <UIcon
          :name="cms.editMode.value ? 'i-lucide-check' : 'i-lucide-pencil'"
          class="size-5"
        />
        <span class="cms-global-edit__label">
          {{ cms.editMode.value ? 'Gotowe' : 'Edytuj' }}
        </span>
        <span class="cms-global-edit__version">v{{ CMS_MODULE_VERSION }}</span>
      </button>
    </div>
  </Teleport>
</template>

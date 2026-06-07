<script setup lang="ts">
const cms = useCms()
const config = useRuntimeConfig()
const appReleaseLabel = computed(() => String(config.public.appVersion ?? ''))

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
        <span
          v-if="appReleaseLabel"
          class="cms-global-edit__version"
        >{{ appReleaseLabel }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import type { CmsPageField, CmsVariableType } from '~/types/cms'

const cms = useCms()
const editOpen = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const activeFieldKey = ref('')
const draft = ref('')
const draftType = ref<CmsVariableType>('text')
const newFieldKey = ref('')
const showNewField = ref(false)

const pageName = computed(() => cms.routePageName.value)

const pageFields = computed(() => {
  const fields = cms.pages.value[pageName.value]?.fields ?? {}
  return Object.entries(fields).map(([key, field]) => ({ key, field }))
})

const visible = computed(
  () =>
    cms.editMode.value
    && cms.canEdit.value
    && cms.cmsEnabledOnRoute.value
)

watch(pageName, () => {
  void cms.fetchPage(pageName.value).catch(() => null)
})

watch(visible, (on) => {
  if (on) void cms.fetchPage(pageName.value).catch(() => null)
})

function openField(key: string, field?: CmsPageField) {
  activeFieldKey.value = key
  draft.value = String(field?.value ?? '')
  draftType.value = (field?.type as CmsVariableType) ?? 'text'
  errorMsg.value = ''
  editOpen.value = true
}

function openNewField() {
  const key = newFieldKey.value.trim()
  if (!key) return
  activeFieldKey.value = key
  draft.value = ''
  draftType.value = 'text'
  showNewField.value = false
  newFieldKey.value = ''
  editOpen.value = true
}

async function saveField() {
  if (!activeFieldKey.value) return
  saving.value = true
  errorMsg.value = ''
  try {
    const page = cms.pages.value[pageName.value]
    const fields = { ...(page?.fields ?? {}) }
    fields[activeFieldKey.value] = {
      type: draftType.value,
      value: draft.value,
      label: activeFieldKey.value
    }
    await cms.savePage(pageName.value, fields)
    editOpen.value = false
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <aside
      v-if="visible"
      class="cms-page-bar"
      aria-label="Pola CMS bieżącej strony"
    >
      <p class="cms-page-bar__title">
        Strona: <code>{{ pageName }}</code>
      </p>
      <p class="cms-page-bar__hint">
        Kliknij podświetlone pole na stronie lub wybierz poniżej. Zmienne zapisuj jako <code>{nazwa_zmiennej}</code>.
      </p>
      <div class="cms-page-bar__fields">
        <UButton
          v-for="item in pageFields"
          :key="item.key"
          size="xs"
          variant="soft"
          color="primary"
          class="font-mono"
          @click="openField(item.key, item.field)"
        >
          {{ item.key }}
        </UButton>
        <UButton
          size="xs"
          variant="outline"
          icon="i-lucide-plus"
          @click="showNewField = !showNewField"
        >
          Pole
        </UButton>
      </div>
      <div v-if="showNewField" class="cms-page-bar__new">
        <UInput
          v-model="newFieldKey"
          placeholder="klucz_pola"
          size="xs"
          class="font-mono"
        />
        <UButton size="xs" @click="openNewField">
          Dodaj
        </UButton>
      </div>
    </aside>

    <SlaviaModal
      v-model:open="editOpen"
      :title="`Edycja: ${activeFieldKey}`"
      description="Wartość pola na tej stronie. Użyj {nazwa_zmiennej} dla danych globalnych."
      modal-class="max-w-xl"
    >
      <template #body>
        <div class="flex flex-col gap-4 p-4 sm:p-6">
          <UFormField label="Typ">
            <USelect
              v-model="draftType"
              :items="[
                { label: 'Tekst', value: 'text' },
                { label: 'HTML', value: 'html' },
                { label: 'Obraz (URL)', value: 'image' },
                { label: 'Liczba', value: 'number' },
                { label: 'Tak/Nie', value: 'boolean' }
              ]"
            />
          </UFormField>
          <UFormField label="Treść">
            <UTextarea
              v-if="draftType === 'text' || draftType === 'html'"
              v-model="draft"
              :rows="draftType === 'html' ? 8 : 3"
              class="font-mono text-sm"
              placeholder="{nazwa_zmiennej}"
            />
            <UInput v-else v-model="draft" />
          </UFormField>
          <p v-if="errorMsg" class="text-sm text-error">
            {{ errorMsg }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="editOpen = false">
              Anuluj
            </UButton>
            <UButton :loading="saving" @click="saveField">
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>
  </Teleport>
</template>

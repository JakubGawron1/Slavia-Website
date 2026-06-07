<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import type { CmsVariableType } from '~/types/cms'
import { extractVariableRefs, isVariablePlaceholder } from '~/utils/cmsVariables'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'

const props = withDefaults(
  defineProps<{
    pageName?: string
    fieldKey: string
    type?: CmsVariableType
    label?: string
    fallback?: string
    tag?: string
  }>(),
  {
    pageName: undefined,
    type: 'text',
    label: undefined,
    fallback: '',
    tag: 'span'
  }
)

const cms = useCms()
const editOpen = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const draft = ref('')
const draftType = ref<CmsVariableType>(props.type)
const selectedVarKey = ref('')
const newVarKey = ref('')
const newVarMode = ref(false)

const resolvedPageName = computed(
  () => props.pageName || cms.routePageName.value
)

const isInteractive = computed(
  () =>
    cms.canEdit.value
    && cms.editMode.value
    && cms.cmsEnabledOnRoute.value
)

const displayContent = computed(() => {
  if (cms.editMode.value && cms.canEdit.value) {
    return cms.getPageFieldRaw(resolvedPageName.value, props.fieldKey, props.fallback)
  }
  return cms.getPageField(resolvedPageName.value, props.fieldKey, props.fallback)
})

watch(editOpen, async (open) => {
  if (!open) return
  errorMsg.value = ''
  const pageName = resolvedPageName.value
  if (!cms.pages.value[pageName]) {
    await cms.fetchPage(pageName).catch(() => null)
  }
  const field = cms.pages.value[pageName]?.fields?.[props.fieldKey]
  draft.value = String(field?.value ?? props.fallback ?? '')
  draftType.value = (field?.type as CmsVariableType) ?? props.type
  selectedVarKey.value = ''
  newVarKey.value = ''
  newVarMode.value = false
})

const variableRefs = computed(() => extractVariableRefs(draft.value))

const variableRefsLabel = computed(() =>
  variableRefs.value.map(k => `{${k}}`).join(', ')
)

function openEditor() {
  if (!isInteractive.value) return
  editOpen.value = true
}

function onKeydown(e: KeyboardEvent) {
  if (!isInteractive.value) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openEditor()
  }
}

async function save() {
  saving.value = true
  errorMsg.value = ''
  try {
    const pageName = resolvedPageName.value
    const page = cms.pages.value[pageName]
    const fields = { ...(page?.fields ?? {}) }
    let value: string | number | boolean = draft.value
    if (draftType.value === 'html') {
      value = sanitizeRichHtml(draft.value)
    } else if (draftType.value === 'number') {
      value = Number(draft.value) || 0
    } else if (draftType.value === 'boolean') {
      value = draft.value === 'true' || draft.value === '1'
    }
    fields[props.fieldKey] = {
      type: draftType.value,
      value,
      label: props.label ?? props.fieldKey
    }
    await cms.savePage(pageName, fields)
    editOpen.value = false
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

function insertVariable(key: string) {
  draft.value = `${draft.value}{${key}}`
}

async function createAndInsertVariable() {
  const key = newVarKey.value.trim()
  if (!key) return
  await cms.saveVariable(key, '', 'text', true)
  insertVariable(key)
  newVarMode.value = false
  newVarKey.value = ''
}

function bindExistingVariable(key: string) {
  draft.value = `{${key}}`
  selectedVarKey.value = key
}
</script>

<template>
  <component
    :is="tag"
    class="cms-editable"
    :class="{ 'cms-editable--interactive': isInteractive }"
    :data-cms-page="resolvedPageName"
    :data-cms-field="fieldKey"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @click="openEditor"
    @keydown="onKeydown"
  >
    <span
      v-if="type === 'html' && !(cms.editMode.value && cms.canEdit.value)"
      v-html="displayContent"
    />
    <span
      v-else-if="type === 'html' && cms.editMode.value && cms.canEdit.value"
      class="whitespace-pre-wrap font-mono text-sm"
    >
      {{ displayContent }}
    </span>
    <template v-else>
      {{ displayContent }}
    </template>

    <SlaviaModal
      v-model:open="editOpen"
      :title="label || `Edycja: ${fieldKey}`"
      description="Treść widoczna po zapisie. W trybie edycji używaj {nazwa_zmiennej} — podgląd pokazuje surowe odwołania."
      modal-class="max-w-2xl"
    >
      <template #body>
        <div class="flex flex-col gap-4 p-4 sm:p-6">
          <UFormField label="Typ treści">
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

          <UFormField :label="draftType === 'html' ? 'Treść HTML' : 'Treść'">
            <UTextarea
              v-if="draftType === 'html' || draftType === 'text'"
              v-model="draft"
              :rows="draftType === 'html' ? 10 : 4"
              class="w-full font-mono text-sm"
              placeholder="Tekst lub {nazwa_zmiennej}"
            />
            <UInput
              v-else-if="draftType === 'image'"
              v-model="draft"
              placeholder="media/gallery/… lub https://"
            />
            <UInput
              v-else-if="draftType === 'number'"
              v-model="draft"
              type="number"
            />
            <USelect
              v-else
              v-model="draft"
              :items="[
                { label: 'Tak', value: 'true' },
                { label: 'Nie', value: 'false' }
              ]"
            />
          </UFormField>

          <div
            v-if="isVariablePlaceholder(draft)"
            class="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            To pole jest powiązane ze zmienną <code>{{ draft }}</code> — edytuj wartość w panelu CMS → Zmienne.
          </div>

          <div class="rounded-lg border border-default bg-muted/30 p-3">
            <p class="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Zmienne CMS
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="v in cms.variables.value"
                :key="v.key"
                size="xs"
                :variant="selectedVarKey === v.key ? 'solid' : 'soft'"
                color="primary"
                @click="bindExistingVariable(v.key)"
              >
                {{ '{' + v.key + '}' }}
              </UButton>
              <UButton
                size="xs"
                variant="outline"
                icon="i-lucide-plus"
                @click="newVarMode = !newVarMode"
              >
                Nowa zmienna
              </UButton>
            </div>
            <div
              v-if="newVarMode"
              class="mt-3 flex gap-2"
            >
              <UInput
                v-model="newVarKey"
                placeholder="nazwa_zmiennej"
                class="flex-1"
              />
              <UButton
                size="sm"
                :loading="saving"
                @click="createAndInsertVariable"
              >
                Utwórz
              </UButton>
            </div>
            <p
              v-if="variableRefs.length"
              class="mt-2 text-xs text-muted"
            >
              Odwołania: {{ variableRefsLabel }}
            </p>
          </div>

          <p
            v-if="errorMsg"
            class="text-sm text-error"
          >
            {{ errorMsg }}
          </p>

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="editOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              :loading="saving"
              @click="save"
            >
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>
  </component>
</template>

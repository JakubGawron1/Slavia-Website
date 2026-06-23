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
const newVarKey = ref('')
const newVarMode = ref(false)

const resolvedPageName = computed(
  () => props.pageName || cms.routePageName.value
)

const isInteractive = computed(
  () =>
    cms.canEdit.value
    && cms.inlineEditEnabled.value
    && cms.editMode.value
    && cms.cmsEnabledOnRoute.value
)

/** Na stronie zawsze podgląd z interpolacją {zmiennych}; surowe odwołania tylko w modalu edycji. */
const displayContent = computed(() =>
  cms.getPageField(resolvedPageName.value, props.fieldKey, props.fallback)
)

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
  newVarKey.value = ''
  newVarMode.value = false
})

const variableRefs = computed(() => extractVariableRefs(draft.value))

const variableRefsLabel = computed(() =>
  variableRefs.value.map(k => `{${k}}`).join(', ')
)

const placeholderKey = computed(() => {
  if (!isVariablePlaceholder(draft.value)) return ''
  return draft.value.slice(1, -1)
})

const placeholderEffective = computed(() => {
  if (!placeholderKey.value) return ''
  return cms.variableMapForPage(resolvedPageName.value)[placeholderKey.value] ?? ''
})

const placeholderLive = computed(() => {
  if (!placeholderKey.value) return ''
  return cms.getLiveVariableValue(placeholderKey.value, resolvedPageName.value)
})

const placeholderIsData = computed(() => {
  if (!placeholderKey.value) return false
  return cms.getLiveVariableValue(placeholderKey.value, resolvedPageName.value) !== ''
    || cms.isVariableOverridden(placeholderKey.value)
})

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
}

/** HTML z CMS renderuje blokowy `SlaviaSafeHtml` — nie owijaj w `<span>` (psuje DOM przy hydracji). */
const wrapperTag = computed(() => (props.type === 'html' ? 'div' : props.tag))
</script>

<template>
  <component
    :is="wrapperTag"
    class="cms-editable"
    :class="{ 'cms-editable--interactive': isInteractive }"
    :data-cms-page="resolvedPageName"
    :data-cms-field="fieldKey"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @click="openEditor"
    @keydown="onKeydown"
  >
    <SlaviaSafeHtml
      v-if="type === 'html'"
      class="slavia-rich-content"
      :html="String(displayContent ?? '')"
    />
    <template v-else>
      {{ displayContent }}
    </template>

    <SlaviaModal
      v-model:open="editOpen"
      :title="label || `Edycja: ${fieldKey}`"
      description="Po zapisie na stronie widać wartość {zmiennych}. W modalu edytujesz surowe odwołania."
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
            v-if="placeholderKey && !placeholderIsData"
            class="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            Zmienna globalna <code>{{ draft }}</code> — edytuj wartość poniżej (inline) lub w panelu CMS → Zmienne.
          </div>
          <div
            v-else-if="placeholderKey && placeholderIsData"
            class="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info"
          >
            Zmienna z bazy <code>{{ draft }}</code> — podgląd: <strong>{{ placeholderEffective || '—' }}</strong>.
            <span v-if="cms.isVariableOverridden(placeholderKey)"> (nadpisane w CMS)</span>
            <span v-else-if="placeholderLive"> · z API: {{ placeholderLive }}</span>
            Edytuj wartość w sekcji „Zmienne” poniżej (ołówek) — możesz nadpisać wartość z API.
          </div>

          <div class="rounded-lg border border-default bg-muted/30 p-3">
            <p class="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Zmienne
            </p>
            <CmsVariablePicker
              :page-name="resolvedPageName"
              mode="insert"
              show-value-editor
              :used-keys="variableRefs"
              @insert="bindExistingVariable"
            />
            <UButton
              size="xs"
              variant="outline"
              icon="i-lucide-plus"
              class="mt-3"
              @click="newVarMode = !newVarMode"
            >
              Nowa zmienna globalna
            </UButton>
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

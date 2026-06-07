<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import type { CmsEditorVariableItem } from '~/composables/useCmsVariableList'

const props = withDefaults(
  defineProps<{
    pageName: string
    /** Wstaw do pola (modal) vs kopiuj / edytuj (pasek boczny). */
    mode?: 'insert' | 'copy'
    /** W trybie insert — dodatkowa lista z edycją wartości (modal pola). */
    showValueEditor?: boolean
    /** Edycja wartości bez flagi cms_inline_edit (np. panel /admin/cms). */
    enableValueEdit?: boolean
    /** Tylko zmienne z bazy (bez sekcji globalnych). */
    dataOnly?: boolean
    usedKeys?: string[]
    compact?: boolean
  }>(),
  {
    mode: 'insert',
    showValueEditor: false,
    enableValueEdit: false,
    dataOnly: false,
    usedKeys: () => [],
    compact: false
  }
)

const emit = defineEmits<{
  insert: [key: string]
  copy: [key: string]
}>()

const cms = useCms()
const toast = useToast()
const { globalVariables, dataVariables, allVariables } = useCmsVariableList(
  () => props.pageName
)

const editingKey = ref<string | null>(null)
const editDraft = ref('')
const editSaving = ref(false)
const editError = ref('')

const canEditValues = computed(() => {
  if (!cms.canEdit.value) return false
  if (props.mode !== 'copy' && !props.showValueEditor) return false
  if (props.enableValueEdit) return true
  return cms.inlineEditEnabled.value
})

const showValueList = computed(
  () => props.mode === 'copy' || props.showValueEditor
)

function isUsed(key: string) {
  return props.usedKeys.includes(key)
}

async function copyToken(item: CmsEditorVariableItem) {
  try {
    await navigator.clipboard.writeText(item.token)
    toast.add({
      title: 'Skopiowano do schowka',
      description: item.token,
      color: 'success'
    })
  } catch {
    toast.add({ title: item.token, description: 'Skopiuj ręcznie', color: 'neutral' })
  }
  emit('copy', item.key)
}

function onPick(item: CmsEditorVariableItem) {
  if (props.mode === 'copy') {
    void copyToken(item)
    return
  }
  emit('insert', item.key)
}

function startEdit(item: CmsEditorVariableItem, e?: Event) {
  e?.stopPropagation()
  editingKey.value = item.key
  editDraft.value = cms.variableMapForPage(props.pageName)[item.key] ?? ''
  editError.value = ''
}

function cancelEdit() {
  editingKey.value = null
  editDraft.value = ''
  editError.value = ''
}

async function saveEdit(key: string) {
  editSaving.value = true
  editError.value = ''
  try {
    await cms.saveVariableOverride(key, editDraft.value)
    toast.add({ title: 'Zapisano zmienną', description: `{${key}}`, color: 'success' })
    cancelEdit()
  } catch (e) {
    editError.value = getApiErrorMessage(e)
  } finally {
    editSaving.value = false
  }
}

async function resetToLive(key: string) {
  editSaving.value = true
  editError.value = ''
  try {
    await cms.resetVariableOverride(key)
    editDraft.value = cms.getLiveVariableValue(key, props.pageName)
    toast.add({
      title: 'Przywrócono wartość z bazy',
      description: `{${key}}`,
      color: 'neutral'
    })
    if (!editDraft.value) cancelEdit()
  } catch (e) {
    editError.value = getApiErrorMessage(e)
  } finally {
    editSaving.value = false
  }
}
</script>

<template>
  <div class="cms-var-picker">
    <template v-if="dataVariables.length && showValueList">
      <p class="cms-var-picker__heading">
        Z bazy danych
        <span
          v-if="canEditValues"
          class="cms-var-picker__hint"
        >— kliknij wiersz, aby skopiować; ołówek edytuje wartość inline</span>
        <span
          v-else
          class="cms-var-picker__hint"
        >— wartość na żywo z API</span>
      </p>

      <div class="cms-var-picker__list">
        <div
          v-for="item in dataVariables"
          :key="`data-${item.key}`"
          class="cms-var-picker__row"
        >
          <button
            type="button"
            class="cms-page-bar__var cms-page-bar__var--data flex-1"
            :class="{ 'cms-page-bar__var--used': isUsed(item.key) }"
            :title="`${item.token}${item.label ? ` — ${item.label}` : ''} · ${item.preview}`"
            @click="onPick(item)"
          >
            <span class="cms-page-bar__var-key">{{ item.token }}</span>
            <span
              v-if="item.label"
              class="cms-var-picker__label"
            >{{ item.label }}</span>
            <span class="cms-page-bar__var-preview">
              {{ item.preview }}
              <span
                v-if="item.overridden"
                class="cms-var-picker__override-badge"
              >nadpisane</span>
            </span>
          </button>
          <UButton
            v-if="canEditValues"
            size="xs"
            variant="ghost"
            color="info"
            icon="i-lucide-pencil"
            :aria-label="`Edytuj ${item.token}`"
            @click="startEdit(item, $event)"
          />
          <div
            v-if="editingKey === item.key"
            class="cms-var-picker__edit"
          >
            <UInput
              v-model="editDraft"
              size="sm"
              class="font-mono text-sm"
              :placeholder="item.livePreview"
            />
            <p
              v-if="item.livePreview && item.livePreview !== '— brak danych —'"
              class="cms-var-picker__live-hint"
            >
              Z bazy: {{ item.livePreview }}
            </p>
            <p
              v-if="editError"
              class="text-xs text-error"
            >
              {{ editError }}
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                size="xs"
                :loading="editSaving"
                @click="saveEdit(item.key)"
              >
                Zapisz
              </UButton>
              <UButton
                v-if="item.overridden || item.source === 'data'"
                size="xs"
                variant="soft"
                color="neutral"
                :loading="editSaving"
                @click="resetToLive(item.key)"
              >
                Przywróć z bazy
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                @click="cancelEdit"
              >
                Anuluj
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="globalVariables.length && showValueList && !dataOnly">
      <p
        class="cms-var-picker__heading"
        :class="{ 'cms-var-picker__heading--spaced': dataVariables.length }"
      >
        Globalne
        <span
          v-if="canEditValues"
          class="cms-var-picker__hint"
        >— edycja inline lub w panelu CMS → Zmienne</span>
      </p>
      <div class="cms-var-picker__list">
        <div
          v-for="item in globalVariables"
          :key="`global-${item.key}`"
          class="cms-var-picker__row"
        >
          <button
            type="button"
            class="cms-page-bar__var flex-1"
            :class="{ 'cms-page-bar__var--used': isUsed(item.key) }"
            :title="`${item.token} — ${item.preview}`"
            @click="onPick(item)"
          >
            <span class="cms-page-bar__var-key">{{ item.token }}</span>
            <span class="cms-page-bar__var-preview">{{ item.preview }}</span>
          </button>
          <UButton
            v-if="canEditValues"
            size="xs"
            variant="ghost"
            color="primary"
            icon="i-lucide-pencil"
            :aria-label="`Edytuj ${item.token}`"
            @click="startEdit(item, $event)"
          />
          <div
            v-if="editingKey === item.key"
            class="cms-var-picker__edit"
          >
            <UInput
              v-model="editDraft"
              size="sm"
              class="font-mono text-sm"
            />
            <p
              v-if="editError"
              class="text-xs text-error"
            >
              {{ editError }}
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                size="xs"
                :loading="editSaving"
                @click="saveEdit(item.key)"
              >
                Zapisz
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                @click="cancelEdit"
              >
                Anuluj
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="mode === 'insert' && (dataVariables.length || globalVariables.length)">
      <p
        class="cms-var-picker__heading"
        :class="{ 'cms-var-picker__heading--spaced': showValueList }"
      >
        Wstaw odwołanie
      </p>
      <div class="cms-var-picker__chips">
        <UButton
          v-for="item in dataVariables"
          :key="`ins-data-${item.key}`"
          size="xs"
          variant="soft"
          color="info"
          class="font-mono"
          :title="`${item.label ?? item.key} · ${item.preview}`"
          @click="onPick(item)"
        >
          {{ item.token }}
        </UButton>
        <template v-if="!dataOnly">
          <UButton
            v-for="item in globalVariables"
            :key="`ins-global-${item.key}`"
            size="xs"
            variant="soft"
            color="primary"
            class="font-mono"
            :title="item.preview"
            @click="onPick(item)"
          >
            {{ item.token }}
          </UButton>
        </template>
      </div>
    </template>

    <p
      v-if="!allVariables.length"
      class="cms-page-bar__empty"
    >
      Brak zmiennych —
      <NuxtLink
        to="/admin/cms"
        class="text-primary underline"
      >
        utwórz globalne w panelu CMS
      </NuxtLink>
      lub użyj zmiennych z bazy (np. <code>{imie_zawodnika}</code>).
    </p>
  </div>
</template>

<style scoped lang="scss">
.cms-var-picker__heading {
  margin: 0 0 0.45rem;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ui-text-muted);

  &--spaced {
    margin-top: 0.75rem;
  }
}

.cms-var-picker__hint {
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  opacity: 0.85;
}

.cms-var-picker__list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cms-var-picker__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.25rem;
}

.cms-var-picker__edit {
  flex: 1 1 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.55rem;
  border: 1px solid color-mix(in srgb, var(--ui-primary) 25%, transparent);
  background: color-mix(in srgb, var(--ui-bg) 94%, var(--ui-primary) 6%);
}

.cms-var-picker__live-hint {
  margin: 0;
  font-size: 0.625rem;
  color: var(--ui-text-muted);
}

.cms-var-picker__override-badge {
  margin-left: 0.35rem;
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ui-warning);
}

.cms-var-picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.cms-var-picker__label {
  font-size: 0.625rem;
  line-height: 1.3;
  color: var(--ui-text-toned);
}
</style>

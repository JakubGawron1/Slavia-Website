<script setup lang="ts">
import type { CmsVariable, CmsVariableType } from '~/types/cms'
import type { DashboardNavRole } from '~/utils/dashboardNavRole'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { buildUploadFormData } from '~/utils/uploadFormData'

definePageMeta({ middleware: ['auth', 'editor-or-admin'] })

useSeoMeta({
  title: 'CMS — Panel treści',
  robots: 'noindex, nofollow'
})

const cms = useCms()
const tab = ref<'pages' | 'variables' | 'navigation' | 'history'>('pages')
const navRole = ref<DashboardNavRole>('admin')
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')

const pages = ref<{ page_name: string, fields: Record<string, unknown> }[]>([])
const variables = ref<CmsVariable[]>([])
const history = ref<Awaited<ReturnType<typeof cms.fetchHistory>>>([])

const newVarKey = ref('')
const newVarType = ref<CmsVariableType>('text')
const newVarValue = ref('')
const editPageName = ref('home')
const editPageFields = ref<Record<string, { type: CmsVariableType, value: string, label: string }>>({})

async function loadAll() {
  loading.value = true
  errorMsg.value = ''
  try {
    const [p, v] = await Promise.all([cms.fetchPages(), cms.fetchVariables()])
    pages.value = p.map(pg => ({ page_name: pg.page_name, fields: pg.fields }))
    variables.value = v
    if (tab.value === 'history') {
      history.value = await cms.fetchHistory({ limit: 80 })
    }
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
watch(tab, async (t) => {
  if (t === 'history') {
    history.value = await cms.fetchHistory({ limit: 80 }).catch(() => [])
  }
})

const apiFetch = useApi()

async function uploadImage(file: File): Promise<string> {
  const res = await apiFetch<{ url?: string, path?: string }>(apiRoutes.upload, {
    method: 'POST',
    body: buildUploadFormData(file, 'gallery')
  })
  return res.path || res.url || ''
}

async function onImageUpload(e: Event, target: 'new' | CmsVariable) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const path = await uploadImage(file)
    if (target === 'new') newVarValue.value = path
    else target.value = path
  } catch (err) {
    errorMsg.value = getApiErrorMessage(err)
  } finally {
    input.value = ''
  }
}

async function createVariable() {
  if (!newVarKey.value.trim()) return
  saving.value = true
  try {
    await cms.saveVariable(newVarKey.value.trim(), newVarValue.value, newVarType.value, true)
    newVarKey.value = ''
    newVarValue.value = ''
    variables.value = await cms.fetchVariables()
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

async function updateVariable(v: CmsVariable) {
  saving.value = true
  try {
    await cms.saveVariable(v.key, v.value, v.type, false)
    variables.value = await cms.fetchVariables()
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

async function removeVariable(key: string) {
  if (!confirm(`Usunąć zmienną „${key}"?`)) return
  await cms.deleteVariable(key)
  variables.value = await cms.fetchVariables()
}

async function loadPageEditor() {
  const pg = await cms.fetchPage(editPageName.value)
  const fields: Record<string, { type: CmsVariableType, value: string, label: string }> = {}
  for (const [k, f] of Object.entries(pg.fields || {})) {
    fields[k] = {
      type: (f.type as CmsVariableType) || 'text',
      value: String(f.value ?? ''),
      label: f.label || k
    }
  }
  editPageFields.value = fields
}

async function savePageEditor() {
  saving.value = true
  try {
    const out: Record<string, { type: CmsVariableType, value: string | number | boolean, label: string }> = {}
    for (const [k, f] of Object.entries(editPageFields.value)) {
      let val: string | number | boolean = f.value
      if (f.type === 'number') val = Number(f.value) || 0
      if (f.type === 'boolean') val = f.value === 'true'
      out[k] = { type: f.type, value: val, label: f.label }
    }
    await cms.savePage(editPageName.value, out)
    await loadAll()
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

function addPageField() {
  const key = `field_${Object.keys(editPageFields.value).length + 1}`
  editPageFields.value[key] = { type: 'text', value: '', label: key }
}

onMounted(loadPageEditor)
watch(editPageName, loadPageEditor)
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="admin"
      title="CMS — treści strony"
      description="Inline CMS v4.0 — edycja tekstów, zmiennych i nawigacji paneli. Globalny tryb edycji (ołówek) na każdej stronie."
      icon="i-lucide-layout-template"
    />

    <div class="mt-6 flex flex-wrap gap-2">
      <UButton
        :variant="tab === 'pages' ? 'solid' : 'soft'"
        @click="tab = 'pages'"
      >
        Strony
      </UButton>
      <UButton
        :variant="tab === 'variables' ? 'solid' : 'soft'"
        @click="tab = 'variables'"
      >
        Zmienne
      </UButton>
      <UButton
        :variant="tab === 'navigation' ? 'solid' : 'soft'"
        @click="tab = 'navigation'"
      >
        Nawigacja
      </UButton>
      <UButton
        :variant="tab === 'history' ? 'solid' : 'soft'"
        @click="tab = 'history'"
      >
        Historia
      </UButton>
    </div>

    <p
      v-if="errorMsg"
      class="mt-4 text-sm text-error"
    >
      {{ errorMsg }}
    </p>

    <UCard
      v-if="tab === 'pages'"
      class="mt-6"
    >
      <div class="flex flex-col gap-4 p-4 sm:p-6">
        <UFormField label="Nazwa strony (slug)">
          <UInput
            v-model="editPageName"
            placeholder="home"
          />
        </UFormField>

        <div
          v-for="(field, key) in editPageFields"
          :key="key"
          class="grid gap-2 rounded-lg border border-default p-3 sm:grid-cols-4"
        >
          <UInput
            v-model="field.label"
            placeholder="Etykieta"
          />
          <USelect
            v-model="field.type"
            :items="[
              { label: 'Tekst', value: 'text' },
              { label: 'HTML', value: 'html' },
              { label: 'Obraz', value: 'image' },
              { label: 'Liczba', value: 'number' },
              { label: 'Boolean', value: 'boolean' }
            ]"
          />
          <UTextarea
            v-model="field.value"
            :rows="2"
            class="sm:col-span-2"
            :placeholder="`{zmienna} lub treść — klucz: ${key}`"
          />
        </div>

        <div class="flex gap-2">
          <UButton
            variant="outline"
            icon="i-lucide-plus"
            @click="addPageField"
          >
            Pole
          </UButton>
          <UButton
            :loading="saving"
            @click="savePageEditor"
          >
            Zapisz stronę
          </UButton>
        </div>

        <div
          v-if="pages.length"
          class="mt-4 text-sm text-muted"
        >
          Zapisane strony: {{ pages.map(p => p.page_name).join(', ') }}
        </div>
      </div>
    </UCard>

    <UCard
      v-else-if="tab === 'variables'"
      class="mt-6"
    >
      <div class="flex flex-col gap-4 p-4 sm:p-6">
        <div class="grid gap-3 sm:grid-cols-4">
          <UInput
            v-model="newVarKey"
            placeholder="klucz_zmiennej"
          />
          <USelect
            v-model="newVarType"
            :items="[
              { label: 'Tekst', value: 'text' },
              { label: 'HTML', value: 'html' },
              { label: 'Obraz', value: 'image' },
              { label: 'Liczba', value: 'number' },
              { label: 'Boolean', value: 'boolean' }
            ]"
          />
          <div class="flex gap-2 sm:col-span-2">
            <UInput
              v-model="newVarValue"
              placeholder="Wartość lub URL obrazu"
              class="flex-1"
            />
            <label
              v-if="newVarType === 'image'"
              class="inline-flex cursor-pointer items-center"
            >
              <input
                type="file"
                accept="image/*"
                class="sr-only"
                @change="onImageUpload($event, 'new')"
              >
              <UButton
                size="sm"
                variant="outline"
                icon="i-lucide-upload"
                as="span"
              >
                Upload
              </UButton>
            </label>
          </div>
        </div>
        <UButton
          size="sm"
          :loading="saving"
          @click="createVariable"
        >
          Dodaj zmienną
        </UButton>

        <div
          v-if="loading"
          class="py-6 text-center text-muted"
        >
          Ładowanie…
        </div>
        <div
          v-for="v in variables"
          v-else
          :key="v.key"
          class="grid gap-2 rounded-lg border border-default p-3 sm:grid-cols-5"
        >
          <code class="text-sm font-bold">{{ v.key }}</code>
          <USelect
            v-model="v.type"
            :items="[
              { label: 'text', value: 'text' },
              { label: 'html', value: 'html' },
              { label: 'image', value: 'image' },
              { label: 'number', value: 'number' },
              { label: 'boolean', value: 'boolean' }
            ]"
          />
          <div class="flex gap-2 sm:col-span-2">
            <UInput
              v-model="v.value as string"
              class="flex-1"
            />
            <label
              v-if="v.type === 'image'"
              class="inline-flex cursor-pointer items-center"
            >
              <input
                type="file"
                accept="image/*"
                class="sr-only"
                @change="onImageUpload($event, v)"
              >
              <UButton
                size="xs"
                variant="outline"
                icon="i-lucide-upload"
                as="span"
              >
                Upload
              </UButton>
            </label>
          </div>
          <div class="flex gap-1">
            <UButton
              size="xs"
              @click="updateVariable(v)"
            >
              Zapisz
            </UButton>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              @click="removeVariable(v.key)"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UCard
      v-else-if="tab === 'navigation'"
      class="mt-6"
    >
      <div class="p-4 sm:p-6">
        <UFormField
          label="Rola panelu"
          class="mb-4 max-w-xs"
        >
          <USelect
            v-model="navRole"
            :items="[
              { label: 'SuperAdmin', value: 'superadmin' },
              { label: 'Admin', value: 'admin' },
              { label: 'Trener', value: 'trainer' },
              { label: 'Zawodnik', value: 'athlete' }
            ]"
          />
        </UFormField>
        <CmsNavigationEditor :role="navRole" />
      </div>
    </UCard>

    <UCard
      v-else
      class="mt-6"
    >
      <div class="overflow-x-auto p-4 sm:p-6">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-default text-muted">
              <th class="py-2 pr-4">
                Data
              </th>
              <th class="py-2 pr-4">
                Typ
              </th>
              <th class="py-2 pr-4">
                Klucz
              </th>
              <th class="py-2">
                Autor
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in history"
              :key="h.id"
              class="border-b border-default/50"
            >
              <td class="py-2 pr-4 whitespace-nowrap text-muted">
                {{ h.created_at }}
              </td>
              <td class="py-2 pr-4">
                {{ h.entity_type }}
              </td>
              <td class="py-2 pr-4 font-mono text-xs">
                {{ h.entity_key }}
              </td>
              <td class="py-2 text-muted">
                {{ h.changed_by || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </PanelPageLayout>
</template>

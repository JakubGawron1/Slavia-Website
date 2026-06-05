<script setup lang="ts">
import type { CmsNavigationItem } from '~/types/cms'
import type { DashboardNavRole } from '~/utils/dashboardNavRole'
import { getApiErrorMessage } from '~/composables/useApi'

const props = defineProps<{
  role: DashboardNavRole
}>()

const cms = useCms()
const items = ref<CmsNavigationItem[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')
const dragIndex = ref<number | null>(null)

async function load() {
  loading.value = true
  try {
    items.value = await cms.fetchNavigation(props.role)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.role, load)

function addItem() {
  items.value.push({
    id: '',
    role: props.role,
    label: 'Nowy moduł',
    icon: 'i-lucide-circle',
    url: '/',
    order_index: items.value.length,
    group_name: 'Ogólne',
    created_at: '',
    updated_at: ''
  })
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

function onDragStart(idx: number) {
  dragIndex.value = idx
}

function onDrop(targetIdx: number) {
  if (dragIndex.value == null || dragIndex.value === targetIdx) return
  const moved = items.value.splice(dragIndex.value, 1)[0]
  if (!moved) return
  items.value.splice(targetIdx, 0, moved)
  dragIndex.value = null
}

async function save() {
  saving.value = true
  errorMsg.value = ''
  try {
    await cms.saveNavigation(items.value)
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-muted">
        Przeciągnij wiersze, aby zmienić kolejność kafelków na dashboardzie roli <strong>{{ role }}</strong>.
      </p>
      <div class="flex gap-2">
        <UButton
          size="sm"
          variant="outline"
          icon="i-lucide-plus"
          @click="addItem"
        >
          Dodaj
        </UButton>
        <UButton
          size="sm"
          :loading="saving"
          @click="save"
        >
          Zapisz nawigację
        </UButton>
      </div>
    </div>

    <div
      v-if="loading"
      class="py-8 text-center text-muted"
    >
      Ładowanie…
    </div>

    <div
      v-else-if="!items.length"
      class="rounded-xl border border-dashed border-default p-8 text-center text-muted"
    >
      Brak niestandardowej nawigacji — używany jest katalog domyślny. Dodaj pozycje, aby nadpisać.
    </div>

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="(item, idx) in items"
        :key="item.id || `new-${idx}`"
        draggable="true"
        class="flex cursor-grab flex-wrap items-center gap-2 rounded-xl border border-default bg-elevated p-3 active:cursor-grabbing"
        @dragstart="onDragStart(idx)"
        @dragover.prevent
        @drop="onDrop(idx)"
      >
        <UIcon
          name="i-lucide-grip-vertical"
          class="size-5 shrink-0 text-muted"
        />
        <UInput
          v-model="item.label"
          placeholder="Nazwa"
          class="min-w-[120px] flex-1"
        />
        <UInput
          v-model="item.icon"
          placeholder="i-lucide-…"
          class="w-36"
        />
        <UInput
          v-model="item.url"
          placeholder="/ścieżka"
          class="min-w-[140px] flex-1"
        />
        <UInput
          :model-value="item.group_name ?? ''"
          placeholder="Grupa"
          class="w-32"
          @update:model-value="item.group_name = $event || null"
        />
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          icon="i-lucide-trash-2"
          @click="removeItem(idx)"
        />
      </li>
    </ul>

    <p
      v-if="errorMsg"
      class="text-sm text-error"
    >
      {{ errorMsg }}
    </p>
  </div>
</template>

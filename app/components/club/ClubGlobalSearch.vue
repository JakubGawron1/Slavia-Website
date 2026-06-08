<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * Jedna wyszukiwarka z belki — strony klubu, treść CMS, zawodnicy, wydarzenia,
 * aktualności oraz moduły paneli z podziałem na role (zawodnik / trener / admin / SA).
 */
const auth = useAuth()
const open = ref(false)
const searchTerm = ref('')

const { loading, paletteGroups, loadIndex, pickSearchItem, registerCloseHandler } = useGlobalSearchIndex()

const fuseOverride = computed(() => ({
  fuseOptions: {
    ignoreLocation: true,
    threshold: 0.28,
    keys: ['label', 'suffix', 'description']
  },
  resultLimit: 64
}))

const searchDescription = computed(() => {
  const parts = ['strony klubu', 'zawodnicy', 'kalendarz', 'aktualności']
  if (auth.isLoggedIn.value) {
    parts.push('ogłoszenia', 'moduły panelu')
  }
  return `${parts.join(', ')} — wyniki dopasowane do Twoich ról.`
})

function closePalette() {
  open.value = false
  searchTerm.value = ''
}

registerCloseHandler(closePalette)

type PaletteRow = {
  id?: string
  to?: RouteLocationRaw
  label?: string
  description?: string
  icon?: string
  labelHtml?: string
  disabled?: boolean
}

function onPickRow(item: PaletteRow) {
  if (item.disabled) return
  pickSearchItem({ id: item.id, to: item.to })
}

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      open.value = !open.value
    }
  },
  ctrl_k: {
    usingInput: true,
    handler: () => {
      open.value = !open.value
    }
  },
  '/': {
    handler: () => {
      open.value = !open.value
    }
  }
})

function onCommandPaletteOpen(v: boolean) {
  open.value = v
}

watch(open, (v) => {
  if (v) void loadIndex()
  else searchTerm.value = ''
})
</script>

<template>
  <div class="flex shrink-0 items-center">
    <UButton
      color="neutral"
      variant="ghost"
      size="lg"
      square
      class="touch-manipulation rounded-xl"
      icon="i-lucide-search"
      aria-label="Szukaj (Ctrl+K, ⌘K lub / poza formularzem)"
      @click="open = true"
    />
    <SlaviaModal
      v-model:open="open"
      title="Szukaj"
      :description="searchDescription"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <UCommandPalette
          v-model:search-term="searchTerm"
          :loading="loading"
          :groups="paletteGroups"
          :fuse="fuseOverride"
          :close="false"
          icon="i-lucide-search"
          placeholder="Szukaj stron, modułów, zawodników, treści…"
          :input="{ fixed: true }"
          class="max-h-[min(70vh,520px)]"
          preserve-group-order
          @update:model-value="pickSearchItem"
          @update:open="onCommandPaletteOpen"
        >
          <template #item="{ item }">
            <div
              class="flex w-full min-w-0 cursor-pointer items-center gap-3 text-left"
              @click.stop.prevent="onPickRow(item)"
            >
              <UIcon
                v-if="item.icon"
                :name="item.icon"
                class="size-5 shrink-0 text-muted"
              />
              <div class="min-w-0 flex-1">
                <div
                  v-if="item.labelHtml"
                  class="truncate text-sm font-medium text-highlighted"
                  v-html="item.labelHtml"
                />
                <div
                  v-else
                  class="truncate text-sm font-medium text-highlighted"
                >
                  {{ item.label }}
                </div>
                <div
                  v-if="item.description"
                  class="truncate text-xs text-muted"
                >
                  {{ item.description }}
                </div>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4 shrink-0 text-muted/70"
              />
            </div>
          </template>
        </UCommandPalette>
      </template>
    </SlaviaModal>
  </div>
</template>

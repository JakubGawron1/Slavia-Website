<script setup lang="ts">
/**
 * Punkt „ideas”: jedna wyszukiwarka z belki — zawodnicy (dane jak na publicznej liście), zawody, aktualności.
 * Wyniki ograniczone do publicznego API (bez adresów wyłącznie administracyjnych).
 */
import { publicApiUrl } from '~/composables/usePublicFetch'
import type { Athlete, Competition } from '~/types/models'
import { blogPostPath, slugify, athleteProfilePath } from '~/utils/slug'

type BlogBrief = { id: string, title: string }

const open = ref(false)
const searchTerm = ref('')
const paletteLoading = ref(false)
type CmdItem = Record<string, unknown>

const fuseOverride = computed(() => ({
  fuseOptions: {
    ignoreLocation: true,
    threshold: 0.28,
    keys: ['label', 'suffix', 'description']
  },
  resultLimit: 36
}))

const athleteItems = shallowRef<CmdItem[]>([])
const competitionItems = shallowRef<CmdItem[]>([])
const postItems = shallowRef<CmdItem[]>([])

async function loadIndex() {
  paletteLoading.value = true
  try {
    const [athletes, comps, posts] = await Promise.all([
      $fetch<Athlete[]>(publicApiUrl('athletes')).catch(() => []),
      $fetch<Competition[]>(publicApiUrl('competitions')).catch(() => []),
      $fetch<BlogBrief[]>(publicApiUrl('posts')).catch(() => [])
    ])

    athleteItems.value = (Array.isArray(athletes) ? athletes : []).map((a) => {
      const label = String(a.full_name || '').trim() || 'Zawodnik'
      const desc = ['Zawodnik', a.profile_tagline || a.weight_category || ''].filter(Boolean).join(' · ')
      const suffix = `${label} ${a.weight_category ?? ''}`
      return {
        id: `a-${a.id}`,
        label,
        description: desc,
        suffix,
        icon: 'i-lucide-user',
        to: athleteProfilePath(label, a.id),
        onSelect: () => {
          open.value = false
        }
      }
    })

    competitionItems.value = (Array.isArray(comps) ? comps : []).map((c) => {
      const ds = typeof c.date === 'string' ? c.date.slice(0, 10) : ''
      const label = String(c.title || '').trim() || 'Wydarzenie'
      const loc = String(c.location || '').trim()
      const desc = [ds, loc].filter(Boolean).join(' · ')
      const suffix = `${label} ${ds} ${loc}`.trim()
      return {
        id: `c-${c.id}`,
        label,
        description: desc || 'Kalendarz',
        suffix,
        icon: 'i-lucide-calendar',
        to: '/kalendarz',
        onSelect: () => {
          open.value = false
        }
      }
    })

    postItems.value = (Array.isArray(posts) ? posts : []).map((p) => {
      const label = String(p.title || '').trim() || 'Aktualność'
      const slug = slugify(label)
      return {
        id: `p-${p.id}`,
        label,
        description: 'Aktualność',
        suffix: label,
        icon: 'i-lucide-newspaper',
        to: blogPostPath(slug, p.id),
        onSelect: () => {
          open.value = false
        }
      }
    })
  } finally {
    paletteLoading.value = false
  }
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
  /** Poza polami INPUT/TEXTAREA/contentEditable — nie koliduje z wpisywaniem „/”. */
  '/': {
    handler: () => {
      open.value = !open.value
    }
  }
})

const groups = computed(() => {
  const g: Array<{ id: string, label: string, items: CmdItem[] }> = []
  if (athleteItems.value.length) {
    g.push({ id: 'athletes', label: 'Zawodnicy', items: [...athleteItems.value] })
  }
  if (competitionItems.value.length) {
    g.push({ id: 'competitions', label: 'Kalendarz (zawody / wydarzenia)', items: [...competitionItems.value] })
  }
  if (postItems.value.length) {
    g.push({ id: 'posts', label: 'Aktualności', items: [...postItems.value] })
  }
  return g
})

function onPaletteSelect() {
  open.value = false
  searchTerm.value = ''
}

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
      description="Zawodnicy, kalendarz i aktualności — tylko publicznie dostępne dane."
      :dismissible="true"
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <UCommandPalette
          v-model:search-term="searchTerm"
          :loading="paletteLoading"
          :groups="groups"
          :fuse="fuseOverride"
          :close="false"
          icon="i-lucide-search"
          placeholder="Szukaj po nazwie, dacie, miejscu…"
          :input="{ fixed: true }"
          class="max-h-[min(70vh,520px)]"
          preserve-group-order
          @update:model-value="onPaletteSelect"
          @update:open="onCommandPaletteOpen"
        />
      </template>
    </SlaviaModal>
  </div>
</template>

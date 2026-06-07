<script setup lang="ts">
import type {
  ExperimentalFeatureDefinition,
  ExperimentalFeatureGroup
} from '~/data/experimentalFeaturesCatalog'
import { EXPERIMENTAL_FEATURE_GROUP_LABELS } from '~/data/experimentalFeaturesCatalog'

const props = defineProps<{
  stableDefs: ExperimentalFeatureDefinition[]
  experimentDefs: ExperimentalFeatureDefinition[]
  resolved: Record<string, boolean>
  killDeploy: string
  isLocked: (id: string) => boolean
}>()

const emit = defineEmits<{
  reset: []
  toggle: [id: string, value: boolean]
}>()

const searchQuery = ref('')

function onToggle(id: string, value: boolean) {
  emit('toggle', id, value)
}

function matchesSearch(def: ExperimentalFeatureDefinition): boolean {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return true
  return (
    def.id.toLowerCase().includes(q)
    || def.label.toLowerCase().includes(q)
    || def.description.toLowerCase().includes(q)
  )
}

function filterDefs(defs: ExperimentalFeatureDefinition[]) {
  return defs.filter(matchesSearch)
}

const filteredStable = computed(() => filterDefs(props.stableDefs))
const filteredExperiment = computed(() => filterDefs(props.experimentDefs))

const GROUP_ORDER: ExperimentalFeatureGroup[] = [
  'cms',
  'www',
  'club',
  'chat',
  'mobile',
  'dev'
]

function groupExperimentDefs(defs: ExperimentalFeatureDefinition[]) {
  const buckets = new Map<ExperimentalFeatureGroup, ExperimentalFeatureDefinition[]>()
  for (const group of GROUP_ORDER) {
    buckets.set(group, [])
  }
  for (const def of defs) {
    const group = def.group ?? 'www'
    const list = buckets.get(group as ExperimentalFeatureGroup) ?? buckets.get('www')!
    list.push(def)
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => a.label.localeCompare(b.label, 'pl'))
  }
  return GROUP_ORDER
    .map(group => ({ group, defs: buckets.get(group) ?? [] }))
    .filter(section => section.defs.length > 0)
}

const experimentSections = computed(() =>
  groupExperimentDefs(filteredExperiment.value)
)

const totalVisible = computed(
  () => filteredStable.value.length + filteredExperiment.value.length
)
</script>

<template>
  <UCard class="overflow-hidden rounded-2xl border-primary/20 bg-linear-to-br from-primary/5 via-card to-card shadow-sm ring-1 ring-primary/10">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-default/50 px-4 py-3 sm:px-5">
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
          Funkcje eksperymentalne
        </p>
        <p class="mt-0.5 text-[11px] leading-snug text-muted">
          Siatka flag z wyszukiwaniem — ustawienia zapisują się w przeglądarce (localStorage).
        </p>
        <UAlert
          v-if="killDeploy"
          class="mt-2 text-[11px]"
          color="warning"
          variant="subtle"
          title="Kill switch (deploy)"
        >
          <span class="break-all font-mono text-[10px]">{{ killDeploy }}</span>
        </UAlert>
      </div>
      <UButton
        v-if="stableDefs.length + experimentDefs.length > 0"
        size="xs"
        variant="soft"
        color="neutral"
        icon="i-lucide-rotate-ccw"
        class="shrink-0"
        @click="emit('reset')"
      >
        Reset domyślnych
      </UButton>
    </div>

    <div class="border-b border-default/40 px-4 py-3 sm:px-5">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Szukaj flagi (nazwa, id, opis)…"
        size="sm"
        class="max-w-xl"
      />
      <p
        v-if="searchQuery.trim()"
        class="mt-2 text-[11px] text-muted"
      >
        Wyniki: {{ totalVisible }} / {{ stableDefs.length + experimentDefs.length }}
      </p>
    </div>

    <div
      v-if="filteredStable.length > 0"
      class="px-4 pt-4 sm:px-5"
    >
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Stabilne (produkcja)
      </p>
      <div class="dev-flags-grid mt-3">
        <article
          v-for="def in filteredStable"
          :key="`stable-${def.id}`"
          class="dev-flags-card dev-flags-card--stable"
          :class="{ 'dev-flags-card--on': resolved[def.id] }"
        >
          <div class="dev-flags-card__head">
            <p class="dev-flags-card__title">
              {{ def.label }}
            </p>
            <USwitch
              :disabled="isLocked(def.id)"
              :model-value="resolved[def.id] ?? def.defaultEnabled"
              @update:model-value="onToggle(def.id, $event)"
            />
          </div>
          <p class="dev-flags-card__desc">
            {{ def.description }}
          </p>
          <p class="dev-flags-card__id">
            {{ def.id }}
          </p>
        </article>
      </div>
    </div>

    <div class="px-4 py-4 sm:px-5">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Eksperymenty
      </p>

      <p
        v-if="filteredExperiment.length === 0 && experimentDefs.length > 0"
        class="mt-3 text-sm text-muted"
      >
        Brak wyników dla „{{ searchQuery.trim() }}”.
      </p>

      <div
        v-for="section in experimentSections"
        :key="section.group"
        class="mt-4 first:mt-3"
      >
        <p class="dev-flags-group-label">
          {{ EXPERIMENTAL_FEATURE_GROUP_LABELS[section.group] }}
        </p>
        <div class="dev-flags-grid mt-2">
          <article
            v-for="def in section.defs"
            :key="def.id"
            class="dev-flags-card dev-flags-card--experiment"
            :class="{ 'dev-flags-card--on': resolved[def.id] }"
          >
            <div class="dev-flags-card__head">
              <p class="dev-flags-card__title">
                {{ def.label }}
              </p>
              <USwitch
                :disabled="isLocked(def.id)"
                :model-value="resolved[def.id] ?? def.defaultEnabled"
                @update:model-value="onToggle(def.id, $event)"
              />
            </div>
            <p class="dev-flags-card__desc">
              {{ def.description }}
            </p>
            <p class="dev-flags-card__id">
              {{ def.id }}
            </p>
            <p
              v-if="!def.defaultEnabled"
              class="dev-flags-card__badge"
            >
              Domyślnie wyłączone
            </p>
          </article>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { ExperimentalFeatureDefinition } from '~/data/experimentalFeaturesCatalog'

defineProps<{
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

function onToggle(id: string, value: boolean) {
  emit('toggle', id, value)
}
</script>

<template>
  <UCard class="overflow-hidden rounded-2xl border-primary/20 bg-linear-to-br from-primary/5 via-card to-card shadow-sm ring-1 ring-primary/10">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-default/50 px-4 py-3 sm:px-5">
      <div class="min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
          Funkcje eksperymentalne
        </p>
        <p class="mt-0.5 text-[11px] leading-snug text-muted">
          Przewiń w poziomie — przełączniki zapisują się w przeglądarce.
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

    <div v-if="stableDefs.length > 0" class="px-4 pt-4 sm:px-5">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Stabilne (produkcja)
      </p>
      <div
        class="scrollbar-hide -mx-1 mt-2 flex gap-2 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory"
      >
        <article
          v-for="def in stableDefs"
          :key="`stable-${def.id}`"
          class="flex min-w-[200px] max-w-[240px] shrink-0 snap-start flex-col rounded-xl border border-default/60 bg-muted/10 p-3"
          :class="resolved[def.id] ? 'ring-1 ring-primary/30' : ''"
        >
          <p class="text-sm font-semibold text-highlighted">
            {{ def.label }}
          </p>
          <p class="mt-1 line-clamp-3 text-[11px] text-muted">
            {{ def.description }}
          </p>
          <p class="mt-2 font-mono text-[10px] text-muted/80">
            {{ def.id }}
          </p>
          <div class="mt-3 flex items-center justify-between border-t border-default/40 pt-2">
            <span class="text-[10px] text-muted">{{ resolved[def.id] ? 'Włączone' : 'Wyłączone' }}</span>
            <USwitch
              :disabled="isLocked(def.id)"
              :model-value="resolved[def.id] ?? def.defaultEnabled"
              @update:model-value="onToggle(def.id, $event)"
            />
          </div>
        </article>
      </div>
    </div>

    <div class="px-4 py-4 sm:px-5">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Eksperymenty
      </p>
      <div
        v-if="experimentDefs.length > 0"
        class="scrollbar-hide -mx-1 mt-2 flex gap-2 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory"
      >
        <article
          v-for="def in experimentDefs"
          :key="def.id"
          class="flex min-w-[220px] max-w-[260px] shrink-0 snap-start flex-col rounded-xl border border-dashed border-primary/25 bg-card p-3"
          :class="resolved[def.id] ? 'ring-1 ring-primary/40' : ''"
        >
          <p class="text-sm font-semibold text-highlighted">
            {{ def.label }}
          </p>
          <p class="mt-1 line-clamp-3 text-[11px] text-muted">
            {{ def.description }}
          </p>
          <p class="mt-2 font-mono text-[10px] text-muted/80">
            {{ def.id }}
          </p>
          <div class="mt-3 flex items-center justify-between border-t border-default/40 pt-2">
            <span class="text-[10px] text-muted">{{ resolved[def.id] ? 'Włączone' : 'Wyłączone' }}</span>
            <USwitch
              :disabled="isLocked(def.id)"
              :model-value="resolved[def.id] ?? def.defaultEnabled"
              @update:model-value="onToggle(def.id, $event)"
            />
          </div>
        </article>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>

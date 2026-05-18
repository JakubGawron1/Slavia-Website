<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { ExperimentalFeatureDefinition } from '~/data/experimentalFeaturesCatalog'

type ScrollRefTarget = Element | ComponentPublicInstance | null

function bindScrollEl(elRef: Ref<HTMLElement | null>, n: ScrollRefTarget) {
  elRef.value = n instanceof HTMLElement ? n : null
}

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

function onToggle(id: string, value: boolean) {
  emit('toggle', id, value)
}

const scrollStep = 260

function useHorizontalScroll() {
  const el = ref<HTMLElement | null>(null)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)

  function updateEdges() {
    const node = el.value
    if (!node) {
      canScrollLeft.value = false
      canScrollRight.value = false
      return
    }
    const max = node.scrollWidth - node.clientWidth
    canScrollLeft.value = node.scrollLeft > 4
    canScrollRight.value = max > 4 && node.scrollLeft < max - 4
  }

  function scrollBy(delta: number) {
    el.value?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  onMounted(() => {
    updateEdges()
    el.value?.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges, { passive: true })
  })

  onBeforeUnmount(() => {
    el.value?.removeEventListener('scroll', updateEdges)
    window.removeEventListener('resize', updateEdges)
  })

  watch(el, () => nextTick(updateEdges))

  return { el, canScrollLeft, canScrollRight, updateEdges, scrollBy }
}

const stableScroll = useHorizontalScroll()
const experimentScroll = useHorizontalScroll()

function setStableScrollEl(n: ScrollRefTarget) {
  bindScrollEl(stableScroll.el, n)
}

function setExperimentScrollEl(n: ScrollRefTarget) {
  bindScrollEl(experimentScroll.el, n)
}

watch(
  () => [props.stableDefs.length, props.experimentDefs.length, props.resolved],
  () => {
    nextTick(() => {
      stableScroll.updateEdges()
      experimentScroll.updateEdges()
    })
  },
  { deep: true }
)
</script>

<template>
  <UCard class="overflow-hidden rounded-2xl border-primary/20 bg-linear-to-br from-primary/5 via-card to-card shadow-sm ring-1 ring-primary/10">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-default/50 px-4 py-3 sm:px-5">
      <div class="min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
          Funkcje eksperymentalne
        </p>
        <p class="mt-0.5 text-[11px] leading-snug text-muted">
          Przewiń w poziomie strzałkami, paskiem lub gestem — ustawienia zapisują się w przeglądarce.
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
      <div class="flex items-center justify-between gap-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Stabilne (produkcja)
        </p>
        <div class="flex shrink-0 gap-1">
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-chevron-left"
            :disabled="!stableScroll.canScrollLeft.value"
            aria-label="Przewiń stabilne w lewo"
            @click="stableScroll.scrollBy(-scrollStep)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-chevron-right"
            :disabled="!stableScroll.canScrollRight.value"
            aria-label="Przewiń stabilne w prawo"
            @click="stableScroll.scrollBy(scrollStep)"
          />
        </div>
      </div>
      <div class="dev-flags-scroll-wrap relative mt-2">
        <div
          v-show="stableScroll.canScrollLeft.value"
          class="dev-flags-scroll-fade dev-flags-scroll-fade--left pointer-events-none"
          aria-hidden="true"
        />
        <div
          v-show="stableScroll.canScrollRight.value"
          class="dev-flags-scroll-fade dev-flags-scroll-fade--right pointer-events-none"
          aria-hidden="true"
        />
        <div
          :ref="setStableScrollEl"
          class="dev-flags-scroll -mx-1 flex gap-2 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory"
          tabindex="0"
          role="region"
          aria-label="Stabilne funkcje eksperymentalne"
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
    </div>

    <div class="px-4 py-4 sm:px-5">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
          Eksperymenty
        </p>
        <div class="flex shrink-0 gap-1">
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-chevron-left"
            :disabled="!experimentScroll.canScrollLeft.value"
            aria-label="Przewiń eksperymenty w lewo"
            @click="experimentScroll.scrollBy(-scrollStep)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-chevron-right"
            :disabled="!experimentScroll.canScrollRight.value"
            aria-label="Przewiń eksperymenty w prawo"
            @click="experimentScroll.scrollBy(scrollStep)"
          />
        </div>
      </div>
      <div
        v-if="experimentDefs.length > 0"
        class="dev-flags-scroll-wrap relative mt-2"
      >
        <div
          v-show="experimentScroll.canScrollLeft.value"
          class="dev-flags-scroll-fade dev-flags-scroll-fade--left pointer-events-none"
          aria-hidden="true"
        />
        <div
          v-show="experimentScroll.canScrollRight.value"
          class="dev-flags-scroll-fade dev-flags-scroll-fade--right pointer-events-none"
          aria-hidden="true"
        />
        <div
          :ref="setExperimentScrollEl"
          class="dev-flags-scroll -mx-1 flex gap-2 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory"
          tabindex="0"
          role="region"
          aria-label="Eksperymentalne funkcje"
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
    </div>
  </UCard>
</template>

<style scoped>
.dev-flags-scroll-wrap {
  min-width: 0;
}

.dev-flags-scroll {
  scroll-padding-inline: 0.25rem;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--ui-primary) 45%, transparent) transparent;
}

.dev-flags-scroll::-webkit-scrollbar {
  height: 8px;
}

.dev-flags-scroll::-webkit-scrollbar-track {
  margin-inline: 0.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-bg-muted) 55%, transparent);
}

.dev-flags-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-primary) 50%, var(--ui-border));
}

.dev-flags-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--ui-primary);
}

.dev-flags-scroll-fade {
  position: absolute;
  top: 0;
  bottom: 8px;
  z-index: 1;
  width: 2.5rem;
}

.dev-flags-scroll-fade--left {
  left: 0;
  background: linear-gradient(to right, var(--ui-bg-elevated, var(--ui-bg)) 15%, transparent);
}

.dev-flags-scroll-fade--right {
  right: 0;
  background: linear-gradient(to left, var(--ui-bg-elevated, var(--ui-bg)) 15%, transparent);
}
</style>

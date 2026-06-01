<script setup lang="ts">
import {
  clubHistoryCategoryLabels,
  clubHistoryMilestones,
  type ClubHistoryMilestone
} from '~/data/clubHistoryMilestones'

const props = withDefaults(
  defineProps<{
    /** Ogranicza liczbę widocznych kamieni milowych (np. podgląd na stronie głównej). */
    limit?: number
    /** Id nagłówka sekcji — dla `aria-labelledby`. */
    headingId?: string
    /** Ukrywa wewnętrzny nagłówek sekcji (gdy rodzic dostarcza własny). */
    hideHeading?: boolean
    /** Kompaktowy układ — mniejsze odstępy między elementami. */
    compact?: boolean
  }>(),
  {
    limit: undefined,
    headingId: 'club-history-heading',
    hideHeading: false,
    compact: false
  }
)

const milestones = computed<ClubHistoryMilestone[]>(() => {
  const list = clubHistoryMilestones
  if (props.limit == null || props.limit >= list.length) return list
  return list.slice(-props.limit)
})

const sectionRef = ref<HTMLElement | null>(null)
const visibleIds = ref<Set<string>>(new Set())

let observer: IntersectionObserver | null = null

function prefersReducedMotion(): boolean {
  if (!import.meta.client) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function markAllVisible() {
  visibleIds.value = new Set(milestones.value.map(m => m.id))
}

function setupObserver() {
  if (!import.meta.client || !sectionRef.value) return
  observer?.disconnect()

  if (prefersReducedMotion()) {
    markAllVisible()
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const id = (entry.target as HTMLElement).dataset.milestoneId
        if (!id) continue
        visibleIds.value = new Set([...visibleIds.value, id])
        observer?.unobserve(entry.target)
      }
    },
    { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  )

  sectionRef.value.querySelectorAll('[data-milestone-id]').forEach((el) => {
    observer?.observe(el)
  })
}

onMounted(() => {
  nextTick(() => setupObserver())
})

watch(milestones, () => {
  visibleIds.value = new Set()
  nextTick(() => setupObserver())
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

function isVisible(id: string) {
  return visibleIds.value.has(id)
}

function categoryLabel(category: ClubHistoryMilestone['category']) {
  return clubHistoryCategoryLabels[category]
}
</script>

<template>
  <section
    ref="sectionRef"
    class="club-history-timeline"
    :class="compact ? 'club-history-timeline--compact' : undefined"
    :aria-labelledby="hideHeading ? undefined : headingId"
  >
    <header
      v-if="!hideHeading"
      class="mx-auto mb-8 max-w-3xl text-center lg:mb-12"
    >
      <p class="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
        O nas
      </p>
      <h2
        :id="headingId"
        class="text-balance text-3xl font-black uppercase italic leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl"
      >
        Historia klubu
      </h2>
      <p class="mt-4 text-pretty text-base leading-relaxed text-muted lg:text-lg">
        Od pierwszych treningów na śląskiej sali po dzisiejszą kadrę startującą w całej Polsce —
        kamienie milowe CKS Slavia Ruda Śląska.
      </p>
    </header>

    <ol
      class="club-history-timeline__list relative mx-auto max-w-4xl list-none p-0"
      role="list"
    >
      <li
        v-for="(m, index) in milestones"
        :key="m.id"
        :data-milestone-id="m.id"
        class="club-history-timeline__item"
        :class="[
          index % 2 === 0 ? 'club-history-timeline__item--left' : 'club-history-timeline__item--right',
          isVisible(m.id) ? 'club-history-timeline__item--visible' : undefined
        ]"
      >
        <article
          class="club-history-timeline__card group rounded-3xl border border-default/60 bg-card/90 p-5 shadow-sm ring-1 ring-default/30 backdrop-blur-sm sm:p-6"
          :aria-label="`${m.year}: ${m.title}`"
        >
          <div class="flex flex-wrap items-center gap-2">
            <time
              :datetime="String(m.year)"
              class="font-mono text-2xl font-black tabular-nums text-primary sm:text-3xl"
            >
              {{ m.year }}
            </time>
            <span
              class="rounded-full bg-muted/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-muted"
            >
              {{ categoryLabel(m.category) }}
            </span>
          </div>

          <div class="club-history-timeline__body mt-4 flex items-start gap-3">
            <span
              class="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25 transition-colors group-hover:bg-primary/15"
              aria-hidden="true"
            >
              <UIcon :name="m.icon" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-black leading-tight text-highlighted sm:text-xl">
                {{ m.title }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
                {{ m.description }}
              </p>
            </div>
          </div>
        </article>

        <div
          class="club-history-timeline__node"
          aria-hidden="true"
        >
          <span class="club-history-timeline__dot" />
        </div>
      </li>
    </ol>
  </section>
</template>



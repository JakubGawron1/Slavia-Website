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

<style scoped>
.club-history-timeline__list::before {
  content: '';
  position: absolute;
  left: 1.125rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 2px;
  border-radius: 9999px;
  background: linear-gradient(
    to bottom,
    color-mix(in oklab, var(--ui-color-primary-500) 35%, transparent),
    color-mix(in oklab, var(--ui-color-primary-500) 12%, transparent)
  );
}

.club-history-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 2.25rem 1fr;
  gap: 0.75rem 1rem;
  padding-bottom: 1.75rem;
  opacity: 0;
  transform: translateY(1.25rem);
  transition:
    opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.club-history-timeline--compact .club-history-timeline__item {
  padding-bottom: 1.25rem;
}

.club-history-timeline__item--visible {
  opacity: 1;
  transform: translateY(0);
}

.club-history-timeline__item:last-child {
  padding-bottom: 0;
}

.club-history-timeline__node {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  justify-content: center;
  padding-top: 1.35rem;
  z-index: 1;
}

.club-history-timeline__dot {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  background: var(--ui-color-primary-500);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--ui-color-primary-500) 22%, transparent);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.club-history-timeline__item--visible .club-history-timeline__dot {
  transform: scale(1.15);
  box-shadow: 0 0 0 6px color-mix(in oklab, var(--ui-color-primary-500) 28%, transparent);
}

.club-history-timeline__card {
  grid-column: 2;
  grid-row: 1;
}

@media (min-width: 1024px) {
  .club-history-timeline__list::before {
    left: 50%;
    transform: translateX(-50%);
  }

  .club-history-timeline__item {
    grid-template-columns: 1fr 2.75rem 1fr;
    gap: 0 1.5rem;
    align-items: start;
    padding-bottom: 2.5rem;
  }

  .club-history-timeline__item--left .club-history-timeline__card {
    grid-column: 1;
    text-align: right;
  }

  .club-history-timeline__item--left .club-history-timeline__body {
    flex-direction: row-reverse;
  }

  .club-history-timeline__item--right .club-history-timeline__card {
    grid-column: 3;
  }

  .club-history-timeline__node {
    grid-column: 2;
    padding-top: 1.5rem;
  }

  .club-history-timeline__item--left .club-history-timeline__card h3,
  .club-history-timeline__item--left .club-history-timeline__card p {
    text-align: right;
  }
}

@media (prefers-reduced-motion: reduce) {
  .club-history-timeline__item {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .club-history-timeline__item--visible .club-history-timeline__dot {
    transform: none;
  }
}
</style>

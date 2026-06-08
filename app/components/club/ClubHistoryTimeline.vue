<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import { useClubHistoryMilestones } from '~/composables/useClubHistoryMilestones'
import {
  clubHistoryCategoryLabels,
  type ClubHistoryMilestone
} from '~/data/clubHistoryMilestones'
import { newClubHistoryMilestone } from '~/utils/clubHistoryMilestonesCms'

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
    /** Strona CMS z polem `timeline_milestones` (np. `o-klubie`). */
    pageName?: string
  }>(),
  {
    limit: undefined,
    headingId: 'club-history-heading',
    hideHeading: false,
    compact: false,
    pageName: undefined
  }
)

const cms = useCms()
const { milestones: cmsMilestones, saveMilestones } = useClubHistoryMilestones(
  () => props.pageName
)

const milestones = computed<ClubHistoryMilestone[]>(() => {
  const list = cmsMilestones.value
  if (props.limit == null || props.limit >= list.length) return list
  return list.slice(-props.limit)
})

const canEditTimeline = computed(
  () =>
    Boolean(props.pageName)
    && cms.canEdit.value
    && cms.inlineEditEnabled.value
    && cms.editMode.value
    && cms.cmsEnabledOnRoute.value
    && props.pageName === cms.routePageName.value
)

const editOpen = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const editingIndex = ref<number | null>(null)
const draft = ref<ClubHistoryMilestone>(newClubHistoryMilestone())

const categoryItems = Object.entries(clubHistoryCategoryLabels).map(([value, label]) => ({
  label,
  value
}))

const iconItems = [
  { label: 'Flaga', value: 'i-lucide-flag' },
  { label: 'Medal', value: 'i-lucide-medal' },
  { label: 'Budynek', value: 'i-lucide-building-2' },
  { label: 'Tarcza', value: 'i-lucide-shield-check' },
  { label: 'Ludzie', value: 'i-lucide-users-round' },
  { label: 'Puchar', value: 'i-lucide-trophy' },
  { label: 'Telefon', value: 'i-lucide-smartphone' },
  { label: 'Kalendarz', value: 'i-lucide-calendar' },
  { label: 'Gwiazda', value: 'i-lucide-star' },
  { label: 'Serce', value: 'i-lucide-heart' },
  { label: 'Koło', value: 'i-lucide-circle' }
]

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

function fullMilestoneList(): ClubHistoryMilestone[] {
  return props.pageName ? [...cmsMilestones.value] : []
}

function openEditor(index: number) {
  if (!canEditTimeline.value) return
  editingIndex.value = index
  draft.value = { ...milestones.value[index]! }
  errorMsg.value = ''
  editOpen.value = true
}

function openAddEditor() {
  if (!canEditTimeline.value) return
  editingIndex.value = null
  draft.value = newClubHistoryMilestone()
  errorMsg.value = ''
  editOpen.value = true
}

function onMilestoneKeydown(e: KeyboardEvent, index: number) {
  if (!canEditTimeline.value) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openEditor(index)
  }
}

async function saveDraft() {
  if (!props.pageName) return
  saving.value = true
  errorMsg.value = ''
  try {
    const list = fullMilestoneList()
    const next = {
      ...draft.value,
      year: Math.round(Number(draft.value.year) || 0),
      title: draft.value.title.trim(),
      description: draft.value.description.trim()
    }
    if (!next.title) {
      errorMsg.value = 'Tytuł jest wymagany.'
      return
    }
    if (!next.year) {
      errorMsg.value = 'Rok jest wymagany.'
      return
    }

    if (editingIndex.value == null) {
      list.push(next)
    } else {
      const fullIndex = props.limit != null
        ? cmsMilestones.value.findIndex(m => m.id === milestones.value[editingIndex.value!]?.id)
        : editingIndex.value
      if (fullIndex >= 0) {
        list[fullIndex] = next
      } else {
        list.push(next)
      }
    }

    await saveMilestones(list)
    editOpen.value = false
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

async function removeDraft() {
  if (!props.pageName || editingIndex.value == null) return
  saving.value = true
  errorMsg.value = ''
  try {
    const targetId = milestones.value[editingIndex.value]?.id
    const list = fullMilestoneList().filter(m => m.id !== targetId)
    await saveMilestones(list)
    editOpen.value = false
  } catch (e) {
    errorMsg.value = getApiErrorMessage(e)
  } finally {
    saving.value = false
  }
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
          :class="{ 'cms-editable cms-editable--interactive': canEditTimeline }"
          :aria-label="`${m.year}: ${m.title}`"
          :role="canEditTimeline ? 'button' : undefined"
          :tabindex="canEditTimeline ? 0 : undefined"
          @click="openEditor(index)"
          @keydown="onMilestoneKeydown($event, index)"
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

    <div
      v-if="canEditTimeline"
      class="mx-auto mt-8 flex max-w-4xl justify-center"
    >
      <UButton
        size="lg"
        variant="outline"
        icon="i-lucide-plus"
        class="font-bold"
        @click="openAddEditor"
      >
        Dodaj kamień milowy
      </UButton>
    </div>

    <SlaviaModal
      v-model:open="editOpen"
      :title="editingIndex == null ? 'Nowy kamień milowy' : 'Edycja kamienia milowego'"
      description="Zmiany zapisują się w CMS strony o klubie i są widoczne też na podglądzie na stronie głównej."
      modal-class="max-w-2xl"
    >
      <template #body>
        <div class="flex flex-col gap-4 p-4 sm:p-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Rok">
              <UInput
                v-model.number="draft.year"
                type="number"
                min="1900"
                max="2100"
              />
            </UFormField>
            <UFormField label="Kategoria">
              <USelect
                v-model="draft.category"
                :items="categoryItems"
              />
            </UFormField>
          </div>

          <UFormField label="Tytuł">
            <UInput v-model="draft.title" />
          </UFormField>

          <UFormField label="Opis">
            <UTextarea
              v-model="draft.description"
              :rows="4"
            />
          </UFormField>

          <UFormField label="Ikona">
            <USelect
              v-model="draft.icon"
              :items="iconItems"
            />
          </UFormField>

          <p
            v-if="errorMsg"
            class="text-sm text-error"
          >
            {{ errorMsg }}
          </p>

          <div class="flex flex-wrap justify-between gap-2">
            <UButton
              v-if="editingIndex != null"
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              :loading="saving"
              @click="removeDraft"
            >
              Usuń
            </UButton>
            <div class="ms-auto flex gap-2">
              <UButton
                variant="ghost"
                @click="editOpen = false"
              >
                Anuluj
              </UButton>
              <UButton
                :loading="saving"
                @click="saveDraft"
              >
                Zapisz
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </SlaviaModal>
  </section>
</template>

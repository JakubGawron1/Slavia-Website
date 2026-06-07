<script setup lang="ts">
import type { DashboardSectionHandle } from '~/composables/useDashboardSections'

const props = withDefaults(
  defineProps<{
    title: string
    icon?: string
    badge?: string
    defaultOpen?: boolean
    /** Id sekcji — persystencja i sterowanie zbiorcze z dashboardu. */
    sectionId?: string
    /** Bez własnej ramki — dla komponentów z gotowym UI (np. PanelModuleNav). */
    embedded?: boolean
    class?: string
  }>(),
  {
    icon: undefined,
    badge: undefined,
    defaultOpen: false,
    sectionId: undefined,
    embedded: false,
    class: ''
  }
)

const open = defineModel<boolean>('open', { default: undefined })

const sections = useDashboardSections()
const internalOpen = ref(
  props.sectionId && sections
    ? sections.getStoredOpen(props.sectionId, props.defaultOpen ?? false)
    : (props.defaultOpen ?? false)
)

const isOpen = computed({
  get: () => (open.value !== undefined ? open.value : internalOpen.value),
  set: (value: boolean) => {
    if (open.value !== undefined) {
      open.value = value
    } else {
      internalOpen.value = value
    }
    if (props.sectionId && sections) {
      sections.persistOpen(props.sectionId, value)
    }
  }
})

const handle: DashboardSectionHandle = {
  setOpen: (value: boolean) => {
    isOpen.value = value
  },
  isOpen: () => isOpen.value
}

onMounted(() => {
  if (!props.sectionId || !sections) return
  sections.register(props.sectionId, handle)
})

onBeforeUnmount(() => {
  if (!props.sectionId || !sections) return
  sections.unregister(props.sectionId)
})
</script>

<template>
  <div
    class="panel-collapsible-section"
    :class="[
      props.class,
      embedded ? '' : 'overflow-hidden rounded-2xl border border-default/65 bg-card shadow-sm ring-1 ring-default/25'
    ]"
  >
    <button
      type="button"
      class="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/15 sm:px-5"
      :class="embedded ? 'rounded-xl border border-default/60 bg-card/80 ring-1 ring-default/20' : ''"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <UIcon
        v-if="icon"
        :name="icon"
        class="size-5 shrink-0 text-primary"
      />
      <span class="min-w-0 flex-1 text-base font-bold text-highlighted sm:text-lg">{{ title }}</span>
      <UBadge
        v-if="badge"
        variant="soft"
        color="neutral"
        size="xs"
      >
        {{ badge }}
      </UBadge>
      <UIcon
        name="i-lucide-chevron-down"
        class="size-5 shrink-0 text-muted transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>
    <div
      v-show="isOpen"
      :class="embedded ? 'pt-3' : 'border-t border-default/50 px-4 pb-5 pt-4 sm:px-5'"
    >
      <slot />
    </div>
  </div>
</template>

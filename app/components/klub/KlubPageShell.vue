<script setup lang="ts">
import type { PanelBreadcrumbItem } from '~/components/panel/PanelBreadcrumb.vue'
import { panelAreaFromPath } from '~/composables/useSlaviaPanelArea'

const props = withDefaults(
  defineProps<{
    icon?: string
    eyebrow?: string
    /** Nadpisanie tytułu (domyślnie z useRoleAwareCopy.pick). */
    title?: string
    description?: string
    staffTitle?: string
    staffDescription?: string
    athleteTitle?: string
    athleteDescription?: string
    /** Etykieta bieżącej podstrony w breadcrumb (hub → podstrona). */
    pageLabel?: string
    pageIcon?: string
    breadcrumbs?: PanelBreadcrumbItem[]
  }>(),
  {
    icon: 'i-lucide-users',
    eyebrow: 'Klub',
    title: undefined,
    description: undefined,
    staffTitle: undefined,
    staffDescription: undefined,
    athleteTitle: undefined,
    athleteDescription: undefined,
    pageLabel: undefined,
    pageIcon: undefined,
    breadcrumbs: undefined
  }
)

const route = useRoute()
const copy = useRoleAwareCopy()
const panelArea = computed(() => panelAreaFromPath(route.path))

const resolvedTitle = computed(
  () =>
    props.title
    ?? copy.pick({
      staff: props.staffTitle,
      athlete: props.athleteTitle,
      default: props.staffTitle ?? props.athleteTitle ?? 'Klub'
    })
    ?? 'Klub'
)

const resolvedDescription = computed(
  () =>
    props.description
    ?? copy.pick({
      staff: props.staffDescription,
      athlete: props.athleteDescription,
      default: props.staffDescription ?? props.athleteDescription
    })
)

const resolvedBreadcrumbs = computed((): PanelBreadcrumbItem[] => {
  if (props.breadcrumbs?.length) return props.breadcrumbs
  const hub = { label: 'Strefa klubu', to: '/klub', icon: 'i-lucide-layout-grid' }
  if (props.pageLabel) {
    return [hub, { label: props.pageLabel, icon: props.pageIcon }]
  }
  return [{ label: resolvedTitle.value, icon: props.icon }]
})
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      :area="panelArea"
      :eyebrow="eyebrow"
      :icon="icon"
      :title="resolvedTitle"
      :description="resolvedDescription"
      :breadcrumbs="resolvedBreadcrumbs"
    >
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </PanelPageHeader>

    <nav
      v-if="$slots.subnav"
      class="mb-6 flex flex-wrap gap-2"
      aria-label="Nawigacja modułu klubu"
    >
      <slot name="subnav" />
    </nav>

    <slot />
  </PanelPageLayout>
</template>

<script setup lang="ts">
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
  }>(),
  {
    icon: 'i-lucide-users',
    eyebrow: 'Klub'
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
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      :area="panelArea"
      :eyebrow="eyebrow"
      :icon="icon"
      :title="resolvedTitle"
      :description="resolvedDescription"
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

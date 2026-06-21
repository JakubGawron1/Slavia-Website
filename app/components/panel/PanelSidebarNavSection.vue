<script setup lang="ts">
import type { PanelSidebarNavGroup } from '~/data/panelSidebarNavigation'
import { sidebarGroupHasActiveRoute } from '~/data/panelSidebarNavigation'

const props = defineProps<{
  group: PanelSidebarNavGroup
  open: boolean
  collapsed?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()

const hasActiveChild = computed(() =>
  sidebarGroupHasActiveRoute(props.group.items, route)
)

const sectionId = computed(() => `sidebar-section-${props.group.id}`)
</script>

<template>
  <section
    class="slavia-panel-sidebar-section"
    :class="{
      'slavia-panel-sidebar-section--collapsed': collapsed,
      'slavia-panel-sidebar-section--open': open,
      'slavia-panel-sidebar-section--active': hasActiveChild
    }"
    :aria-labelledby="collapsed ? undefined : sectionId"
  >
    <button
      v-if="!collapsed"
      :id="sectionId"
      type="button"
      class="slavia-panel-sidebar-section__toggle"
      :aria-expanded="open"
      @click="emit('toggle')"
    >
      <span class="slavia-panel-sidebar-section__title truncate">{{ group.title }}</span>
      <UIcon
        name="i-lucide-chevron-down"
        class="slavia-panel-sidebar-section__chevron size-3.5 shrink-0"
        aria-hidden="true"
      />
    </button>

    <div
      v-show="collapsed || open"
      class="slavia-panel-sidebar-section__body"
      :class="collapsed ? 'slavia-panel-sidebar-section__body--flat' : ''"
    >
      <PanelSidebarLink
        v-for="item in group.items"
        :key="`${group.id}-${item.to}-${item.title}`"
        :title="item.title"
        :icon="item.icon"
        :to="item.to"
        :icon-wrapper-class="item.bg ? `${item.bg} ${item.color}` : null"
        :collapsed="collapsed"
      />
    </div>
  </section>
</template>

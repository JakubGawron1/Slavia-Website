<script setup lang="ts">
const props = defineProps<{
  title: string
  icon: string
  to: string
  iconWrapperClass?: string | null
  collapsed?: boolean
}>()

const route = useRoute()
const { panelSidebarNavTargetMatches } = usePanelSidebarNav()

const isActive = computed(() => panelSidebarNavTargetMatches(route, props.to))

const iconWrapClass = computed(() => {
  if (props.collapsed) {
    return isActive.value
      ? 'slavia-panel-sidebar-link__icon--collapsed-active'
      : 'slavia-panel-sidebar-link__icon--collapsed'
  }

  const custom = props.iconWrapperClass?.trim()
  if (custom) return `${custom} ring-1 ring-inset ring-current/10`
  return isActive.value
    ? 'bg-primary/16 text-primary ring-1 ring-primary/25'
    : 'bg-muted/15 text-muted group-hover:bg-primary/10 group-hover:text-primary'
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="slavia-panel-sidebar-link group"
    :class="[
      isActive ? 'slavia-panel-sidebar-link--active' : '',
      collapsed ? 'slavia-panel-sidebar-link--collapsed' : ''
    ]"
    :title="collapsed ? title : undefined"
    :aria-label="collapsed ? title : undefined"
    :aria-current="isActive ? 'page' : undefined"
  >
    <span
      class="slavia-panel-sidebar-link__icon"
      :class="iconWrapClass"
    >
      <UIcon :name="icon" class="size-4" />
    </span>
    <span
      class="slavia-panel-sidebar-link__label truncate"
      :class="collapsed ? 'slavia-panel-sidebar-link__label--hidden' : ''"
    >
      {{ title }}
    </span>
  </NuxtLink>
</template>

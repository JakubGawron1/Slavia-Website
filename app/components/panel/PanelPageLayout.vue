<script setup lang="ts">
const { presetLayoutClass } = useSlaviaAppearance()

const props = withDefaults(
  defineProps<{
    /** Wewnętrzny panel kadry — max-width 80rem */
    panel?: boolean
    /** Wąski układ (formularze, analiza) */
    narrow?: boolean
    padding?: 'default' | 'compact' | 'flush'
    animate?: boolean
  }>(),
  {
    panel: true,
    narrow: false,
    padding: 'default',
    animate: true
  }
)

const { showSidebarForRoute, sidebarArea } = usePanelSidebarNav()

const containerClass = computed(() => {
  const c: string[] = ['slavia-below-site-header', 'mx-auto', 'w-full', 'min-w-0']
  if (props.panel) c.push('slavia-panel-page')
  if (props.narrow) c.push('max-w-5xl')
  if (props.padding === 'default') c.push('pt-8 pb-6 md:pt-10 md:pb-8 lg:pt-12 lg:pb-10')
  else if (props.padding === 'compact') c.push('pt-6 pb-5 sm:pt-8 sm:pb-7 md:pt-10 md:pb-8')
  if (props.animate) c.push('animate-page-in')
  const layoutClass = presetLayoutClass.value
  if (layoutClass) c.push(layoutClass)
  return c
})
</script>

<template>
  <PanelSidebarShell
    v-if="showSidebarForRoute && sidebarArea"
    :area="sidebarArea"
  >
    <UContainer :class="containerClass">
      <div class="slavia-page-flow">
        <slot />
      </div>
    </UContainer>
  </PanelSidebarShell>
  <UContainer
    v-else
    :class="containerClass"
  >
    <div class="slavia-page-flow">
      <slot />
    </div>
  </UContainer>
</template>

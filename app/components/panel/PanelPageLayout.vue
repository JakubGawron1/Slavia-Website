<script setup lang="ts">
const { presetLayoutClass } = useSlaviaAppearance()
const auth = useAuth()
const toast = useToast()

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

async function retrySession() {
  await auth.refreshSession()
  if (auth.sessionLoadError.value) {
    toast.add({
      title: 'Brak połączenia',
      description: 'Nie udało się odświeżyć sesji. Spróbuj ponownie za chwilę.',
      color: 'error'
    })
  }
}
</script>

<template>
  <PanelSidebarShell
    v-if="showSidebarForRoute && sidebarArea"
    :area="sidebarArea"
  >
    <UContainer :class="containerClass">
      <div class="slavia-page-flow">
        <UAlert
          v-if="auth.sessionLoadError.value"
          class="mb-4"
          color="warning"
          variant="subtle"
          icon="i-lucide-cloud-off"
          title="Nie udało się załadować sesji"
          description="Backend może się budzić lub wystąpił chwilowy błąd sieci. Możesz spróbować ponownie bez wylogowywania."
        >
          <template #actions>
            <UButton size="sm" color="warning" variant="soft" @click="retrySession">
              Spróbuj ponownie
            </UButton>
          </template>
        </UAlert>
        <slot />
      </div>
    </UContainer>
  </PanelSidebarShell>
  <UContainer
    v-else
    :class="containerClass"
  >
    <div class="slavia-page-flow">
      <UAlert
        v-if="auth.sessionLoadError.value"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="i-lucide-cloud-off"
        title="Nie udało się załadować sesji"
        description="Backend może się budzić lub wystąpił chwilowy błąd sieci. Możesz spróbować ponownie bez wylogowywania."
      >
        <template #actions>
          <UButton size="sm" color="warning" variant="soft" @click="retrySession">
            Spróbuj ponownie
          </UButton>
        </template>
      </UAlert>
      <slot />
    </div>
  </UContainer>
</template>

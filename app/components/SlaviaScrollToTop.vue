<template>
  <div
    class="slavia-scroll-to-top"
    :class="{
      'slavia-scroll-to-top--panel': panel,
      'slavia-scroll-to-top--panel-collapsed': panel && panelSidebarCollapsed
    }"
  >
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <button
        v-show="visible"
        type="button"
        class="slavia-scroll-to-top__button"
        aria-label="Przewiń na górę strony"
        @click="scrollToTop"
      >
        <UIcon
          name="i-lucide-arrow-up"
          class="size-5 sm:size-6"
        />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const SCROLL_THRESHOLD_PX = 500

withDefaults(
  defineProps<{
    /** Wyśrodkowanie względem kolumny treści panelu (obok sidebara). */
    panel?: boolean
    panelSidebarCollapsed?: boolean
  }>(),
  { panel: false, panelSidebarCollapsed: false }
)

const visible = ref(false)

function updateVisibility() {
  if (!import.meta.client) return
  visible.value = window.scrollY > SCROLL_THRESHOLD_PX
}

function scrollToTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', updateVisibility, { passive: true })
  updateVisibility()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateVisibility)
})
</script>

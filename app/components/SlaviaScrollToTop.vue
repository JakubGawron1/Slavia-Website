<script setup lang="ts">
const SCROLL_THRESHOLD_PX = 500

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

<template>
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
      class="fixed bottom-6 right-5 z-50 flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-2 ring-primary/30 transition hover:scale-105 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:bottom-8 sm:right-8 sm:size-12"
      aria-label="Przewiń na górę strony"
      @click="scrollToTop"
    >
      <UIcon
        name="i-lucide-arrow-up"
        class="size-5 sm:size-6"
      />
    </button>
  </Transition>
</template>

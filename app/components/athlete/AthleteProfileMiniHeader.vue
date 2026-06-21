<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  name: string
  weightCategory?: string | null
}>()

const ariaLabel = computed(() => {
  const parts = [props.name]
  if (props.weightCategory?.trim()) {
    parts.push(`kategoria ${props.weightCategory.trim()}`)
  }
  return parts.join(', ')
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-show="visible"
        class="slavia-athlete-profile-mini-header"
        role="region"
        :aria-label="ariaLabel"
      >
        <div class="slavia-athlete-profile-mini-header__inner">
          <p class="slavia-athlete-profile-mini-header__name">
            {{ name }}
          </p>
          <p
            v-if="weightCategory"
            class="slavia-athlete-profile-mini-header__category"
          >
            <span class="sr-only">Kategoria wagowa: </span>
            {{ weightCategory }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

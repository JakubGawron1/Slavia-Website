<script setup lang="ts">
import { useFormField } from '@nuxt/ui/composables/useFormField'

const props = defineProps<{
  modelValue?: string | number | null
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { id, disabled: formDisabled } = useFormField(props, { bind: false })

const isDisabled = computed(() => props.disabled || formDisabled.value)

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <select
    :id="id"
    :value="modelValue ?? ''"
    :disabled="isDisabled"
    class="slavia-select w-full py-3 text-[15px]"
    :class="props.class"
    @change="onChange"
  >
    <slot />
  </select>
</template>

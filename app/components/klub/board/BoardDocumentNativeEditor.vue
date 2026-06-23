<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  mimeType: string
  readonly?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  save: [value: string]
}>()

const localContent = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const isHtml = computed(() => props.mimeType.toLowerCase().includes('html'))

const label = computed(() => {
  if (isHtml.value) return 'Treść HTML'
  if (props.mimeType.toLowerCase().includes('csv')) return 'Treść CSV'
  return 'Treść dokumentu'
})

function onSave() {
  emit('save', localContent.value)
}
</script>

<template>
  <div class="space-y-3">
    <UAlert
      v-if="isHtml"
      color="info"
      variant="subtle"
      icon="i-lucide-shield-check"
      title="Edycja HTML"
      description="Treść zostanie z sanityzowaną przy zapisie (jak w CMS). Używaj prostego HTML lub skopiuj z szablonu."
    />
    <UFormField :label="label">
      <UTextarea
        v-model="localContent"
        :readonly="readonly"
        :rows="isHtml ? 18 : 14"
        class="w-full font-mono text-sm"
        :disabled="readonly || saving"
      />
    </UFormField>
    <div v-if="!readonly" class="flex flex-wrap gap-2">
      <UButton
        color="primary"
        icon="i-lucide-save"
        :loading="saving"
        @click="onSave"
      >
        Zapisz zmiany
      </UButton>
    </div>
  </div>
</template>

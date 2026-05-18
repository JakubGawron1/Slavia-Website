<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { buildUploadFormData } from '~/utils/uploadFormData'

const props = withDefaults(
  defineProps<{
    modelValue: string
    purpose?: string
    label?: string
    hint?: string
    showUrlField?: boolean
    disabled?: boolean
    avatarAlt?: string
    initials?: string
  }>(),
  {
    purpose: 'avatar',
    label: 'Zdjęcie profilowe',
    hint: 'JPG, PNG lub WebP — maks. ok. 10 MB. Po wgraniu zapisz formularz, jeśli edytujesz inne konto.',
    showUrlField: true,
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const toast = useToast()
const api = useApi()

const uploadLoading = ref(false)
const avatarBroken = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const previewSrc = computed(() => props.modelValue?.trim() || '')

watch(previewSrc, () => {
  avatarBroken.value = false
})

function clickFileInput() {
  if (props.disabled) return
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.add({ title: 'Wybierz plik graficzny (JPG, PNG, WebP)', color: 'warning' })
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ title: 'Plik jest za duży', description: 'Maksymalny rozmiar to ok. 10 MB.', color: 'warning' })
    return
  }
  uploadLoading.value = true
  try {
    const fd = buildUploadFormData(file, props.purpose)
    const res = await api<{ url: string }>(apiRoutes.upload, { method: 'POST', body: fd })
    const url = (res.url || '').trim()
    if (!url) {
      toast.add({ title: 'Serwer nie zwrócił adresu obrazka', color: 'warning' })
      return
    }
    emit('update:modelValue', url)
    toast.add({ title: 'Zdjęcie wgrane', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'Upload nie powiódł się',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  } finally {
    uploadLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <UAvatar
        :src="previewSrc && !avatarBroken ? previewSrc : undefined"
        :alt="avatarAlt"
        :text="previewSrc && !avatarBroken ? undefined : initials"
        size="3xl"
        class="size-20 shrink-0 ring-2 ring-primary/20 sm:size-24"
        @error="avatarBroken = true"
      />
      <div class="min-w-0 flex-1 space-y-2">
        <p class="text-sm font-bold text-highlighted">
          {{ label }}
        </p>
        <p v-if="hint" class="text-xs leading-relaxed text-muted">
          {{ hint }}
        </p>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          :disabled="disabled"
          @change="onFileChange"
        >
        <UButton
          color="primary"
          variant="outline"
          icon="i-lucide-upload"
          size="md"
          class="w-full justify-center sm:w-auto"
          :loading="uploadLoading"
          :disabled="disabled"
          @click="clickFileInput"
        >
          Wybierz plik
        </UButton>
      </div>
    </div>
    <UFormField
      v-if="showUrlField"
      label="Adres obrazka (Cloudinary)"
      :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }"
    >
      <UInput
        :model-value="modelValue"
        type="url"
        placeholder="https://res.cloudinary.com/…"
        size="md"
        class="font-mono text-sm"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import { getApiDetailedErrorMessage } from '~/composables/useApi'

const props = defineProps<{
  error: unknown
}>()

const emit = defineEmits<{
  retry: []
}>()

const message = computed(() =>
  props.error ? getApiDetailedErrorMessage(props.error) : ''
)
</script>

<template>
  <UAlert
    v-if="error"
    class="mb-4"
    color="error"
    variant="subtle"
    icon="i-lucide-cloud-off"
    title="Nie udało się załadować danych"
    :description="message"
  >
    <template #actions>
      <UButton size="sm" color="error" variant="soft" @click="emit('retry')">
        Spróbuj ponownie
      </UButton>
    </template>
  </UAlert>
</template>

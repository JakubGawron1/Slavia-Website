<script setup lang="ts">
import type { OlympicCoachMessage, OlympicCoachMode } from '~/composables/useOlympicCoachAi'
import type { OlympicCoachAttachmentDraft } from '~/utils/olympicCoachAttachments'

defineProps<{
  messages: OlympicCoachMessage[]
  loading: boolean
  importing: boolean
  isStaff: boolean
}>()

const emit = defineEmits<{
  importPlan: [content: string]
}>()

function attachmentIcon(kind: OlympicCoachAttachmentDraft['kind']) {
  if (kind === 'image') return 'i-lucide-image'
  if (kind === 'video') return 'i-lucide-video'
  return 'i-lucide-file-text'
}

function canImportMessage(msg: { role: string, mode: OlympicCoachMode }, isStaff: boolean) {
  return isStaff && msg.role === 'assistant' && msg.mode === 'plan'
}
</script>

<template>
  <div
    v-for="msg in messages"
    :key="msg.id"
    class="olympic-coach__row"
    :class="{ 'olympic-coach__row--user': msg.role === 'user' }"
  >
    <div
      class="olympic-coach__avatar"
      :class="msg.role === 'user' ? 'olympic-coach__avatar--user' : 'olympic-coach__avatar--ai'"
      aria-hidden="true"
    >
      <UIcon
        :name="msg.role === 'user' ? 'i-lucide-user' : 'i-lucide-sparkles'"
        class="size-3.5"
      />
    </div>
    <div
      class="olympic-coach__bubble"
      :class="msg.role === 'user' ? 'olympic-coach__bubble--user' : 'olympic-coach__bubble--ai'"
    >
      <div
        v-if="msg.attachments?.length"
        class="olympic-coach__msg-attachments"
      >
        <span
          v-for="att in msg.attachments"
          :key="att.id"
          class="olympic-coach__msg-attachment"
        >
          <img
            v-if="att.previewUrl && att.kind === 'image'"
            :src="att.previewUrl"
            :alt="att.name"
          >
          <span
            v-else
            class="olympic-coach__attachment-thumb"
            aria-hidden="true"
          >
            <UIcon
              :name="attachmentIcon(att.kind)"
              class="size-3.5"
            />
          </span>
          <span class="truncate">{{ att.name }}</span>
        </span>
      </div>
      <SlaviaChatMarkdown
        :source="msg.content"
        root-class="olympic-coach__bubble-md"
      />
      <div
        v-if="canImportMessage(msg, isStaff)"
        class="olympic-coach__bubble-actions"
      >
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-lucide-file-input"
          :disabled="importing || loading"
          @click="emit('importPlan', msg.content)"
        >
          Importuj do planów
        </UButton>
      </div>
    </div>
  </div>
</template>

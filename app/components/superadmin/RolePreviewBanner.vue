<script setup lang="ts">
const { isActive, state, endPreview: endPreviewAction } = useRolePreview()

const roleLabel = computed(() => {
  const r = state.value?.previewRole
  if (r === 'Athlete') return 'zawodnik'
  if (r === 'Trainer') return 'trener'
  if (r === 'Admin') return 'administrator'
  return r ?? ''
})

const displayName = computed(() => {
  const s = state.value
  if (!s) return ''
  return s.athleteName?.trim() || s.targetUsername
})

const ending = ref(false)

async function exitPreview() {
  if (ending.value) return
  ending.value = true
  try {
    await endPreviewAction()
  } finally {
    ending.value = false
  }
}
</script>

<template>
  <div
    v-if="isActive"
    class="role-preview-banner"
    role="status"
    aria-live="polite"
  >
    <div class="role-preview-banner__inner">
      <UIcon name="i-lucide-eye" class="size-4 shrink-0 opacity-90" aria-hidden="true" />
      <p class="role-preview-banner__text">
        <strong>Podgląd read-only</strong>
        — widzisz panel jako
        <strong>{{ roleLabel }}</strong>:
        {{ displayName }}
        <span class="hidden sm:inline">(bez logowania na to konto)</span>
      </p>
      <UButton
        size="xs"
        color="neutral"
        variant="solid"
        class="shrink-0"
        :loading="ending"
        @click="exitPreview"
      >
        Zakończ podgląd
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.role-preview-banner {
  position: sticky;
  top: 0;
  z-index: 45;
  border-bottom: 1px solid color-mix(in srgb, var(--ui-warning) 35%, transparent);
  background: color-mix(in srgb, var(--ui-warning) 14%, var(--ui-bg));
}

.role-preview-banner__inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0.5rem 1rem;
}

.role-preview-banner__text {
  flex: 1;
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--ui-text);
}
</style>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

definePageMeta({ middleware: 'auth' })

const { items, loading, refresh, markRead, markAllRead, deleteAll, remove } = useNotifications()
const toast = useToast()
const copy = useSlaviaCopy()
const deletingAll = ref(false)

async function onDeleteAll() {
  if (!items.value.length) return
  deletingAll.value = true
  try {
    await deleteAll()
    toast.add({ title: 'Usunięto wszystkie powiadomienia', color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się usunąć powiadomień', color: 'error' })
  } finally {
    deletingAll.value = false
  }
}
const { resolveLink } = useNotificationLinks()

function relative(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: pl })
  } catch {
    return iso
  }
}

onMounted(() => {
  void refresh()
})
</script>

<template>
  <UContainer class="py-8">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-bold text-highlighted">Powiadomienia</h1>
      <div class="flex flex-wrap gap-2">
        <UButton variant="soft" icon="i-lucide-refresh-cw" @click="refresh">Odśwież</UButton>
        <UButton variant="soft" color="primary" icon="i-lucide-check-check" @click="markAllRead">Oznacz wszystko</UButton>
        <UButton
          variant="soft"
          color="error"
          icon="i-lucide-trash-2"
          :loading="deletingAll"
          :disabled="items.length === 0"
          @click="onDeleteAll"
        >
          Usuń wszystkie
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-muted">Ładowanie…</div>
    <div v-else class="space-y-3">
      <UCard v-for="n in items" :key="n.id" :class="n.is_read ? '' : 'ring-1 ring-primary/30'">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <UBadge
              size="xs"
              variant="subtle"
              color="neutral"
              class="mb-1 font-semibold uppercase tracking-wide"
            >
              {{ copy.notificationKindLabel(n.kind) }}
            </UBadge>
            <p class="font-semibold text-highlighted">{{ n.title }}</p>
            <p class="mt-1 text-sm text-muted">{{ n.body }}</p>
            <p class="mt-1 text-xs text-muted">{{ relative(n.created_at) }}</p>
          </div>
          <div class="flex shrink-0 gap-1">
            <UButton v-if="resolveLink(n)" size="xs" variant="ghost" icon="i-lucide-arrow-right" :to="resolveLink(n) || undefined">Przejdź</UButton>
            <UButton v-if="!n.is_read" size="xs" color="primary" variant="soft" icon="i-lucide-check" @click="markRead(n.id)">Przeczytane</UButton>
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-trash-2" @click="remove(n.id)" />
          </div>
        </div>
      </UCard>
      <p v-if="items.length === 0" class="text-sm text-muted">Brak powiadomień.</p>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { panelAreaFromPath } from '~/composables/useSlaviaPanelArea'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const panelArea = computed(() => panelAreaFromPath(route.path))
const { primaryDashboardPath } = useRoleDashboardNav()
const rolePreviewState = useRolePreviewState()
const { items, loading, refresh, markRead, markAllRead, deleteAll, remove } = useNotifications()
const toast = useToast()
const copy = useSlaviaCopy()
const deletingAll = ref(false)

const unreadCount = computed(() => items.value.filter(n => !n.is_read).length)

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
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      :area="panelArea"
      eyebrow="Klub"
      title="Powiadomienia"
      icon="i-lucide-bell"
      description="Alerty od systemu i kadry."
      :breadcrumbs="[
        { label: 'Strefa klubu', to: '/klub', icon: 'i-lucide-layout-grid' },
        { label: 'Powiadomienia', icon: 'i-lucide-bell' }
      ]"
    >
      <template #badges>
        <UBadge
          v-if="unreadCount"
          color="primary"
          variant="subtle"
        >
          {{ unreadCount }} nieprzeczytanych
        </UBadge>
        <UBadge
          color="neutral"
          variant="subtle"
        >
          {{ items.length }} łącznie
        </UBadge>
      </template>
      <template #actions>
        <UButton
          :to="primaryDashboardPath"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-layout-dashboard"
        >
          Panel
        </UButton>
        <UButton
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refresh"
        >
          Odśwież
        </UButton>
        <UButton
          v-if="!rolePreviewState.isReadOnly.value"
          variant="soft"
          color="primary"
          icon="i-lucide-check-check"
          :disabled="!unreadCount"
          @click="markAllRead"
        >
          Oznacz wszystko
        </UButton>
        <UButton
          v-if="!rolePreviewState.isReadOnly.value"
          variant="soft"
          color="error"
          icon="i-lucide-trash-2"
          :loading="deletingAll"
          :disabled="items.length === 0"
          @click="onDeleteAll"
        >
          Usuń wszystkie
        </UButton>
      </template>
    </PanelPageHeader>

    <UAlert
      v-if="rolePreviewState.isReadOnly.value"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="i-lucide-eye"
      title="Podgląd read-only"
      description="Widzisz powiadomienia wybranego użytkownika — oznaczanie i usuwanie są wyłączone."
    />

    <PanelDataToolbar
      v-if="!loading && items.length"
      :summary="`${items.length} powiadomień${unreadCount ? ` · ${unreadCount} nieprzeczytanych` : ''}`"
      sticky
    />

    <PanelLoadingState
      v-if="loading"
      label="Wczytywanie powiadomień…"
    />

    <SlaviaEmptyState
      v-else-if="items.length === 0"
      icon="i-lucide-bell-off"
      title="Brak powiadomień"
      description="Gdy pojawią się alerty od systemu lub kadry, zobaczysz je tutaj."
    />

    <div
      v-else
      class="space-y-3"
    >
      <UCard
        v-for="n in items"
        :key="n.id"
        class="slavia-page-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        :class="n.is_read ? '' : 'ring-1 ring-primary/30'"
        :ui="{ body: 'p-0' }"
      >
        <div class="flex items-start justify-between gap-3 p-4 sm:p-5">
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
            <UButton
              v-if="resolveLink(n)"
              size="xs"
              variant="ghost"
              icon="i-lucide-arrow-right"
              :to="resolveLink(n) || undefined"
            >
              Przejdź
            </UButton>
            <UButton
              v-if="!rolePreviewState.isReadOnly.value && !n.is_read"
              size="xs"
              color="primary"
              variant="soft"
              icon="i-lucide-check"
              @click="markRead(n.id)"
            >
              Przeczytane
            </UButton>
            <UButton
              v-if="!rolePreviewState.isReadOnly.value"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="remove(n.id)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </PanelPageLayout>
</template>

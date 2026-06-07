<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { ClubNotification } from '~/types/notifications'
import { getApiErrorMessage } from '~/composables/useApi'
import { useBrowserNotifications } from '~/composables/useBrowserNotifications'

const auth = useAuth()
const toast = useToast()
const copy = useSlaviaCopy()
const { resolveLink } = useNotificationLinks()
const { items, loading, refresh, remove, markRead, markAllRead, clearLocal } = useNotifications()
const {
  enabled: systemNotificationsEnabled,
  permission,
  supported,
  hasPermission,
  requestPermission,
  setEnabled,
  notify
} = useBrowserNotifications()

const popoverOpen = ref(false)
const knownNotificationIds = ref<Set<string>>(new Set())
let pollTimer: ReturnType<typeof setInterval> | undefined

function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: pl })
  } catch {
    return ''
  }
}

async function loadNotifications() {
  if (!auth.isLoggedIn.value) return
  await refresh()

  const newNotifications = items.value.filter((item) => !knownNotificationIds.value.has(item.id))
  if (newNotifications.length > 0 && systemNotificationsEnabled.value && hasPermission.value) {
    newNotifications.slice(0, 2).forEach((n) => {
      notify(n.title, {
        body: n.body,
        tag: n.id,
        icon: '/logo.png'
      })
    })
  }

  knownNotificationIds.value = new Set(items.value.map((item) => item.id))
}

async function onRemove(id: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  try {
    await remove(id)
  } catch (err) {
    toast.add({
      title: 'Nie udało się usunąć powiadomienia',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}

async function onMarkRead(id: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  try {
    await markRead(id)
  } catch (err) {
    toast.add({
      title: 'Nie udało się oznaczyć jako przeczytane',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}

async function onMarkAllRead() {
  try {
    await markAllRead()
  } catch (err) {
    toast.add({
      title: 'Nie udało się oznaczyć wszystkich jako przeczytane',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}

function onRowClick(n: ClubNotification) {
  const to = resolveLink(n)
  if (to) {
    popoverOpen.value = false
    navigateTo(to)
  }
}

watch(popoverOpen, (open) => {
  if (open) loadNotifications()
})

watch(
  () => auth.isLoggedIn.value,
  (loggedIn) => {
    if (loggedIn) loadNotifications()
    else clearLocal()
  }
)

watch(systemNotificationsEnabled, async (enabled) => {
  if (!import.meta.client || !enabled || permission.value === 'granted') return
  const result = await requestPermission()
  if (result !== 'granted') {
    setEnabled(false)
    toast.add({
      title: 'Powiadomienia systemowe zablokowane',
      description: 'Aby je włączyć, pozwól na powiadomienia w ustawieniach przeglądarki.',
      color: 'warning'
    })
  }
})

onMounted(() => {
  if (auth.isLoggedIn.value) loadNotifications()
  pollTimer = setInterval(() => {
    if (!auth.isLoggedIn.value || !import.meta.client) return
    if (typeof document !== 'undefined' && document.hidden) return
    loadNotifications()
  }, 90_000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <UPopover
    v-if="auth.isLoggedIn.value"
    v-model:open="popoverOpen"
    :content="{ side: 'bottom', align: 'end' }"
    :ui="{
      content:
        'p-0 overflow-hidden min-w-[min(100vw-2rem,21rem)] max-w-sm rounded-xl shadow-xl ring-1 ring-default/60'
    }"
  >
    <div class="relative inline-flex">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-bell"
        :aria-label="'Powiadomienia'"
        :loading="loading && items.length === 0"
        class="rounded-full"
      />
      <span
        v-if="items.length > 0"
        class="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-bg"
      >
        {{ items.length > 99 ? '99+' : items.length }}
      </span>
    </div>

    <template #content>
      <div class="border-b border-default bg-muted/30 px-4 py-2.5">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            Powiadomienia
          </p>
          <div class="flex items-center gap-1.5">
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-list" to="/klub/powiadomienia">
              Skrzynka
            </UButton>
            <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-check-check" @click="onMarkAllRead">
              Oznacz wszystko
            </UButton>
          </div>
        </div>
      </div>

      <div class="border-b border-default px-4 py-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-highlighted">Powiadomienia systemowe</p>
            <p class="mt-1 text-xs text-muted/80">Włącz, aby otrzymywać nowe powiadomienia jako alerty systemowe.</p>
          </div>
          <USwitch v-model="systemNotificationsEnabled" :disabled="!supported" />
        </div>
        <p v-if="!supported" class="mt-3 text-xs text-warning">Przeglądarka nie obsługuje notyfikacji systemowych.</p>
        <p v-else-if="permission === 'denied'" class="mt-3 text-xs text-warning">Powiadomienia zablokowane w ustawieniach przeglądarki.</p>
      </div>

      <div class="max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain">
        <div
          v-if="!loading && items.length === 0"
          class="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted"
        >
          <UIcon
            name="i-lucide-bell-off"
            class="size-9 opacity-40"
          />
          <span>Brak powiadomień</span>
        </div>

        <div
          v-for="n in items"
          :key="n.id"
          role="button"
          tabindex="0"
          class="group flex gap-2 border-b border-default px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/[0.06]"
          :class="[
            n.is_read ? '' : 'bg-primary/[0.05]',
            resolveLink(n) ? 'cursor-pointer' : 'cursor-default'
          ]"
          @click="onRowClick(n)"
          @keydown.enter="onRowClick(n)"
        >
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <UBadge
                size="xs"
                variant="subtle"
                color="neutral"
                class="font-semibold uppercase tracking-wide"
              >
                {{ copy.notificationKindLabel(n.kind) }}
              </UBadge>
            </div>
            <p class="text-sm font-semibold leading-snug text-highlighted">
              {{ n.title }}
            </p>
            <p class="mt-1 text-xs leading-snug text-muted">
              {{ n.body }}
            </p>
            <p class="mt-1.5 text-[10px] text-muted/75">
              {{ relativeTime(n.created_at) }}
            </p>
          </div>
          <UButton
            v-if="!n.is_read"
            color="primary"
            variant="ghost"
            size="xs"
            icon="i-lucide-check"
            square
            aria-label="Oznacz jako przeczytane"
            type="button"
            @click.stop="onMarkRead(n.id, $event)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            class="shrink-0 opacity-60 hover:opacity-100"
            square
            aria-label="Usuń powiadomienie"
            type="button"
            @click.stop="onRemove(n.id, $event)"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>

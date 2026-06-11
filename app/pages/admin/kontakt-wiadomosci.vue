<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { getApiErrorMessage } from '~/composables/useApi'
import { apiRoutes } from '~/config/api'

definePageMeta({ middleware: 'admin' })

interface ContactMessage {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  message: string
  created_at: string
  is_read: boolean
}

useSeoMeta({
  title: 'Wiadomości z formularza kontaktowego — Admin',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const toast = useToast()

const { data: messages, refresh, pending } = await useAsyncData(
  'admin-contact-inbox',
  () => apiFetch<ContactMessage[]>('/api/contact/manage').catch(() => [] as ContactMessage[]),
  { default: () => [] as ContactMessage[] }
)

const unreadCount = computed(() => (messages.value || []).filter(m => !m.is_read).length)

const readFilter = ref<'all' | 'unread' | 'read'>('all')

const filteredMessages = computed(() => {
  const list = messages.value || []
  if (readFilter.value === 'unread') return list.filter(m => !m.is_read)
  if (readFilter.value === 'read') return list.filter(m => m.is_read)
  return list
})

const readFilterItems = [
  { label: 'Wszystkie', value: 'all' },
  { label: 'Nieprzeczytane', value: 'unread' },
  { label: 'Przeczytane', value: 'read' }
] as const

async function markRead(id: string, is_read: boolean) {
  try {
    await apiFetch(apiRoutes.contact.manageOne(id), {
      method: 'PATCH',
      body: { is_read }
    } as Parameters<typeof apiFetch>[1])
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Błąd',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function remove(id: string) {
  if (!confirm('Usunąć wiadomość na stałe?')) return
  try {
    await apiFetch(apiRoutes.contact.manageOne(id), { method: 'DELETE' } as Parameters<typeof apiFetch>[1])
    toast.add({ title: 'Usunięto', color: 'success' })
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Błąd',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

function formatDate(d: string) {
  try {
    return format(parseISO(d), 'd MMM yyyy, HH:mm', { locale: pl })
  } catch {
    return d
  }
}
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="admin"
      title="Formularz kontaktowy"
      icon="i-lucide-mail"
      eyebrow="Skrzynka"
      description="Wiadomości z publicznego formularza kontaktowego — oznaczaj jako przeczytane i archiwizuj."
      :breadcrumbs="[
        { label: 'Administracja', to: '/admin', icon: 'i-lucide-shield' },
        { label: 'Formularz kontaktowy', icon: 'i-lucide-mail' }
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
          {{ (messages || []).length }} łącznie
        </UBadge>
      </template>
      <template #actions>
        <UButton
          to="/admin"
          variant="outline"
          color="neutral"
        >
          Panel admina
        </UButton>
      </template>
    </PanelPageHeader>

    <PanelDataToolbar
      v-if="!pending && messages && messages.length"
      :summary="`${filteredMessages.length} z ${messages.length} wiadomości`"
      sticky
    >
      <template #filters>
        <UFormField label="Filtr" class="w-full sm:w-52">
          <SlaviaOverlaySelect
            v-model="readFilter"
            :items="[...readFilterItems]"
            value-key="value"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </template>
      <template #actions>
        <UButton
          variant="soft"
          icon="i-lucide-refresh-ccw"
          :loading="pending"
          @click="refresh()"
        >
          Odśwież
        </UButton>
      </template>
    </PanelDataToolbar>

    <PanelLoadingState
      v-if="pending"
      label="Wczytywanie skrzynki…"
    />

    <SlaviaEmptyState
      v-else-if="!(messages && messages.length)"
      icon="i-lucide-mail"
      title="Brak wiadomości"
      description="Gdy ktoś wyśle formularz kontaktowy na stronie klubu, wiadomość pojawi się tutaj."
    />

    <SlaviaEmptyState
      v-else-if="!filteredMessages.length"
      icon="i-lucide-filter-x"
      title="Brak wiadomości w tym filtrze"
      description="Zmień filtr lub odśwież listę."
    />

    <div
      v-else
      class="space-y-4"
    >
      <UCard
        v-for="m in filteredMessages"
        :key="m.id"
        class="overflow-hidden rounded-2xl border-default/70 ring-1 ring-default/15 border-default"
        :class="!m.is_read ? 'ring-2 ring-primary/25 bg-primary/5' : ''"
      >
        <div class="flex flex-col gap-4 p-4 sm:flex-row sm:justify-between">
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                v-if="!m.is_read"
                color="primary"
                size="xs"
              >
                Nowe
              </UBadge>
              <span class="text-xs text-muted">{{ formatDate(m.created_at) }}</span>
            </div>
            <p class="font-semibold text-highlighted">
              {{ m.name }}
            </p>
            <p class="text-sm">
              <span class="flex flex-wrap gap-x-3 gap-y-1">
                <template v-if="m.email">
                  <a
                    :href="`mailto:${m.email}`"
                    class="text-muted underline-offset-2 hover:underline"
                  >{{ m.email }}</a>
                </template>
                <template v-if="m.phone">
                  <a
                    :href="`tel:${m.phone}`"
                    class="text-muted underline-offset-2 hover:underline"
                  >{{ m.phone }}</a>
                </template>
                <template v-if="!m.email && !m.phone">
                  <span class="text-muted">Brak danych kontaktowych</span>
                </template>
              </span>
            </p>
            <p class="whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {{ m.message }}
            </p>
          </div>
          <div class="flex shrink-0 flex-row flex-wrap gap-2 sm:flex-col">
            <UButton
              v-if="!m.is_read"
              size="sm"
              variant="soft"
              @click="markRead(m.id, true)"
            >
              Oznacz przeczytane
            </UButton>
            <UButton
              v-else
              size="sm"
              variant="ghost"
              color="neutral"
              @click="markRead(m.id, false)"
            >
              Oznacz nieprzeczytane
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              @click="remove(m.id)"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </PanelPageLayout>
</template>

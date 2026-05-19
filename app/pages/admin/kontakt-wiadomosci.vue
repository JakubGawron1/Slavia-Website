<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { getApiErrorMessage } from '~/composables/useApi'

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

async function markRead(id: string, is_read: boolean) {
  try {
    await apiFetch(`/api/contact/manage/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { is_read }
    })
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
    await apiFetch(`/api/contact/manage/${encodeURIComponent(id)}`, { method: 'DELETE' })
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
    >
      <template #description>
        Nieprzeczytane: <span class="font-semibold text-highlighted">{{ unreadCount }}</span>
      </template>
      <template #actions>
        <UButton
          variant="soft"
          icon="i-lucide-refresh-ccw"
          @click="refresh()"
        >
          Odśwież
        </UButton>
        <UButton
          to="/admin"
          variant="outline"
          color="neutral"
        >
          Panel admina
        </UButton>
      </template>
    </PanelPageHeader>

    <div
      v-if="pending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary"
      />
    </div>

    <PublicEmptyState
      v-else-if="!(messages && messages.length)"
      icon="i-lucide-mail"
      title="Brak wiadomości"
      description="Gdy ktoś wyśle formularz kontaktowy na stronie klubu, wiadomość pojawi się tutaj."
    />

    <div
      v-else
      class="space-y-4"
    >
      <UCard
        v-for="m in messages"
        :key="m.id"
        class="border-default"
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

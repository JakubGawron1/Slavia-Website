<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth'
})

interface Announcement {
  id: string
  title: string
  body: string
  pinned: boolean
  sort_order: number
  published: boolean
  author_id: string
  created_at: string
}

useSeoMeta({
  title: 'Tablica ogłoszeń — Slavia Ruda Śląska',
  description: 'Ważne komunikaty i informacje organizacyjne klubu CKS Slavia.',
  robots: 'index, follow'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const isAdmin = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)

async function fetchList(): Promise<Announcement[]> {
  if (isAdmin.value && auth.token.value) {
    try {
      return await apiFetch<Announcement[]>('/api/announcements/manage')
    } catch {
      return await apiFetch<Announcement[]>('/api/announcements').catch(() => [])
    }
  }
  return await apiFetch<Announcement[]>('/api/announcements').catch(() => [])
}

const { data: items, refresh, pending } = await useAsyncData('club-announcements', fetchList, {
  watch: [() => isAdmin.value, () => auth.token.value],
  default: () => [] as Announcement[]
})

const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive({
  title: '',
  body: '',
  pinned: false,
  sort_order: 0,
  published: true
})

function openCreate() {
  editingId.value = null
  draft.title = ''
  draft.body = ''
  draft.pinned = false
  draft.sort_order = 0
  draft.published = true
  modalOpen.value = true
}

function openEdit(a: Announcement) {
  editingId.value = a.id
  draft.title = a.title
  draft.body = a.body
  draft.pinned = !!a.pinned
  draft.sort_order = Number(a.sort_order) || 0
  draft.published = a.published !== false
  modalOpen.value = true
}

async function save() {
  if (!isAdmin.value) return
  const title = draft.title.trim()
  const body = draft.body.trim()
  if (!title || !body) {
    toast.add({ title: 'Uzupełnij tytuł i treść', color: 'warning' })
    return
  }
  try {
    if (editingId.value) {
      await apiFetch(`/api/announcements/${editingId.value}`, {
        method: 'PATCH',
        body: {
          title,
          body,
          pinned: draft.pinned,
          sort_order: draft.sort_order,
          published: draft.published
        }
      })
      toast.add({ title: 'Zapisano ogłoszenie', color: 'success' })
    } else {
      await apiFetch('/api/announcements', {
        method: 'POST',
        body: {
          title,
          body,
          pinned: draft.pinned,
          sort_order: draft.sort_order,
          published: draft.published
        }
      })
      toast.add({ title: 'Dodano ogłoszenie', color: 'success' })
    }
    modalOpen.value = false
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zapisać',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function remove(id: string) {
  if (!isAdmin.value) return
  if (!confirm('Usunąć to ogłoszenie?')) return
  try {
    await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    await refresh()
  } catch (e) {
    toast.add({
      title: 'Błąd usuwania',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

function formatDate(d: string) {
  try {
    return format(parseISO(d), 'd MMMM yyyy, HH:mm', { locale: pl })
  } catch {
    return d
  }
}

const sortedPublic = computed(() => {
  const list = [...(items.value || [])]
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return String(b.created_at).localeCompare(String(a.created_at))
  })
})
</script>

<template>
  <UContainer class="animate-page-in py-8 sm:py-12 lg:py-14">
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl lg:text-4xl">
          Tablica ogłoszeń
        </h1>
        <p class="mt-2 text-sm text-muted sm:text-base lg:leading-relaxed">
          Komunikaty organizacyjne i ważne daty — widoczne dla wszystkich; edycja wyłącznie dla administratorów.
        </p>
      </div>
      <UButton
        v-if="isAdmin"
        icon="i-lucide-megaphone"
        color="primary"
        class="min-h-11 w-full shrink-0 justify-center md:w-auto"
        @click="openCreate"
      >
        Dodaj ogłoszenie
      </UButton>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-14"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary"
      />
    </div>

    <div
      v-else-if="!sortedPublic.length"
      class="rounded-2xl border border-dashed border-default bg-muted/10 px-6 py-14 text-center text-muted"
    >
      Brak ogłoszeń.
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <UCard
        v-for="a in sortedPublic"
        :key="a.id"
        class="overflow-hidden border-default transition-colors"
        :class="a.pinned ? 'ring-2 ring-primary/35 bg-primary/5' : ''"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <UBadge
                v-if="a.pinned"
                color="primary"
                variant="subtle"
                size="xs"
              >
                Przypięte
              </UBadge>
              <UBadge
                v-if="isAdmin && !a.published"
                color="warning"
                variant="subtle"
                size="xs"
              >
                Szkic
              </UBadge>
              <span class="text-xs text-muted">{{ formatDate(a.created_at) }}</span>
            </div>
            <h2 class="text-lg font-semibold text-highlighted sm:text-xl">
              {{ a.title }}
            </h2>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted sm:text-base">
              {{ a.body }}
            </p>
          </div>
          <div
            v-if="isAdmin"
            class="flex shrink-0 flex-wrap gap-2"
          >
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-lucide-pencil"
              class="min-h-10"
              @click="openEdit(a)"
            >
              Edytuj
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              class="min-h-10"
              @click="remove(a.id)"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Edytuj ogłoszenie' : 'Nowe ogłoszenie'"
      :dismissible="true"
      :ui="{ content: 'max-h-[90vh] overflow-y-auto sm:max-w-3xl md:max-w-4xl lg:max-w-5xl' }"
    >
      <template #content>
        <div class="flex flex-col gap-4 p-4 sm:p-6">
          <UFormField
            label="Tytuł"
            required
          >
            <UInput
              v-model="draft.title"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Treść"
            required
          >
            <UTextarea
              v-model="draft.body"
              class="w-full min-h-36"
              autoresize
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Kolejność (mniejsza = wyżej przy tym samym pinie)">
              <UInput
                v-model.number="draft.sort_order"
                type="number"
                class="w-full"
              />
            </UFormField>
            <div class="flex flex-col gap-4 pt-6 sm:pt-8">
              <label class="flex cursor-pointer items-center gap-3 text-sm text-highlighted">
                <USwitch v-model="draft.pinned" />
                Przypnij na górze tablicy
              </label>
              <label class="flex cursor-pointer items-center gap-3 text-sm text-highlighted">
                <USwitch v-model="draft.published" />
                Opublikowane (widoczne publicznie)
              </label>
            </div>
          </div>
          <div class="flex flex-wrap justify-end gap-2 border-t border-default pt-4">
            <UButton
              variant="ghost"
              color="neutral"
              @click="modalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              color="primary"
              @click="save"
            >
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { getApiErrorMessage } from '~/composables/useApi'
import { renderSimpleMarkdown } from '~/utils/renderSimpleMarkdown'

const { accountSettingsPath } = useRoleDashboardNav()

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

const { auth, canManage, showManageActions, sessionReady } = useClubContentAdmin()
const apiFetch = useApi()
const toast = useToast()

async function fetchList(): Promise<Announcement[]> {
  if (canManage.value && auth.token.value) {
    try {
      return await apiFetch<Announcement[]>('/api/announcements/manage')
    } catch {
      return await apiFetch<Announcement[]>('/api/announcements').catch(() => [])
    }
  }
  return await apiFetch<Announcement[]>('/api/announcements').catch(() => [])
}

const { data: items, refresh, pending } = await useAsyncData('club-announcements', fetchList, {
  watch: [() => canManage.value, () => auth.token.value],
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
  if (!canManage.value) return
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
  if (!canManage.value) return
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

const boardStats = computed(() => {
  const list = items.value || []
  return {
    total: list.length,
    pinned: list.filter(a => a.pinned).length,
    drafts: list.filter(a => !a.published).length
  }
})

function bodyPreview(text: string, max = 100) {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}
</script>

<template>
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="CKS Slavia"
      icon="i-lucide-megaphone"
      title="Tablica ogłoszeń"
      description="Komunikaty organizacyjne i ważne daty — widoczne dla wszystkich; edycja wyłącznie dla administratorów."
    >
      <template
        v-if="!pending && sortedPublic.length"
        #badges
      >
        <UBadge color="neutral" variant="subtle" size="sm">
          Łącznie: {{ boardStats.total }}
        </UBadge>
        <UBadge v-if="boardStats.pinned" color="primary" variant="subtle" size="sm">
          Przypięte: {{ boardStats.pinned }}
        </UBadge>
        <UBadge v-if="canManage && boardStats.drafts" color="warning" variant="subtle" size="sm">
          Szkice: {{ boardStats.drafts }}
        </UBadge>
      </template>
      <template #actions>
        <UButton
          v-if="showManageActions"
          icon="i-lucide-megaphone"
          color="primary"
          size="lg"
          class="min-h-11 w-full shrink-0 justify-center font-semibold sm:w-auto"
          @click="openCreate"
        >
          Dodaj ogłoszenie
        </UButton>
      </template>
    </PublicPageHeader>

    <div class="slavia-content-well slavia-public-section">
    <div
      v-if="pending"
      class="py-14"
    >
      <div class="mx-auto max-w-4xl space-y-4">
        <div
          v-for="i in 4"
          :key="`ann-skel-${i}`"
          class="rounded-2xl border border-default bg-card p-5 shadow-sm"
        >
          <div class="flex flex-wrap items-center gap-2">
            <div class="h-5 w-16 rounded bg-muted/30 animate-pulse" />
            <div class="h-4 w-28 rounded bg-muted/25 animate-pulse" />
          </div>
          <div class="mt-3 h-6 w-[70%] rounded bg-muted/35 animate-pulse" />
          <div class="mt-4 space-y-2">
            <div class="h-4 w-full rounded bg-muted/25 animate-pulse" />
            <div class="h-4 w-[92%] rounded bg-muted/25 animate-pulse" />
            <div class="h-4 w-[78%] rounded bg-muted/25 animate-pulse" />
          </div>
        </div>
      </div>
    </div>

    <PublicEmptyState
      v-else-if="!sortedPublic.length"
      icon="i-lucide-megaphone"
      title="Brak ogłoszeń"
      description="Gdy pojawią się komunikaty organizacyjne, zobaczysz je tutaj na pierwszym planie."
    >
      <UButton
        v-if="showManageActions"
        icon="i-lucide-megaphone"
        color="primary"
        size="lg"
        class="min-h-11 w-auto shrink-0 font-semibold"
        @click="openCreate"
      >
        Dodaj pierwsze ogłoszenie
      </UButton>
      <template
        v-if="auth.isLoggedIn && !canManage && sessionReady"
        #hint
      >
        Tablicę uzupełniają konta Administrator lub SuperAdmin.
        <NuxtLink :to="accountSettingsPath" class="font-semibold text-primary underline">
          Sprawdź swoje role
        </NuxtLink>
        — po zmianie roli wyloguj się i zaloguj ponownie.
      </template>
    </PublicEmptyState>

    <template v-else>
      <div
        v-if="showManageActions"
        class="mb-6 flex flex-wrap items-center justify-center gap-2 sm:justify-end"
      >
        <UButton
          icon="i-lucide-megaphone"
          color="primary"
          size="lg"
          class="min-h-11 w-full shrink-0 justify-center font-semibold sm:w-auto"
          @click="openCreate"
        >
          Dodaj ogłoszenie
        </UButton>
      </div>

      <div
        v-if="canManage"
        class="slavia-page-card mb-8 hidden overflow-hidden md:block"
      >
        <div class="border-b border-default/50 bg-muted/15 px-4 py-3 sm:px-5">
          <p class="text-xs font-bold uppercase tracking-wider text-muted">
            Zarządzanie ogłoszeniami
          </p>
        </div>
        <div class="slavia-data-table overflow-x-auto p-2 sm:p-4">
          <table>
            <thead>
              <tr>
                <th>Tytuł</th>
                <th class="w-28">Status</th>
                <th class="w-40">Data</th>
                <th class="w-32 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="a in sortedPublic"
                :key="`tbl-${a.id}`"
                class="slavia-announcement-row"
                :class="a.pinned ? 'slavia-announcement-pin' : ''"
              >
                <td>
                  <p class="font-semibold text-highlighted">{{ a.title }}</p>
                  <p class="mt-0.5 line-clamp-2 text-xs text-muted">{{ bodyPreview(a.body) }}</p>
                </td>
                <td>
                  <UBadge v-if="a.pinned" color="primary" variant="subtle" size="xs">Pin</UBadge>
                  <UBadge v-else-if="!a.published" color="warning" variant="subtle" size="xs">Szkic</UBadge>
                  <UBadge v-else color="success" variant="subtle" size="xs">Live</UBadge>
                </td>
                <td class="text-xs text-muted whitespace-nowrap">{{ formatDate(a.created_at) }}</td>
                <td class="text-right">
                  <div class="inline-flex flex-wrap justify-end gap-1">
                    <UButton size="xs" variant="soft" icon="i-lucide-pencil" aria-label="Edytuj" @click="openEdit(a)" />
                    <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" aria-label="Usuń" @click="remove(a.id)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        class="grid gap-5 sm:gap-6"
        :class="canManage ? 'md:hidden lg:grid-cols-2' : 'lg:grid-cols-2'"
      >
        <article
          v-for="a in sortedPublic"
          :key="a.id"
          class="slavia-page-card overflow-hidden p-5 transition-all duration-200 sm:p-6"
          :class="a.pinned ? 'slavia-announcement-pin bg-primary/[0.04] ring-1 ring-primary/25' : ''"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">
              <div class="mb-3 flex flex-wrap items-center gap-2">
              <UBadge
                v-if="a.pinned"
                color="primary"
                variant="subtle"
                size="xs"
              >
                Przypięte
              </UBadge>
              <UBadge
                v-if="canManage && !a.published"
                color="warning"
                variant="subtle"
                size="xs"
              >
                Szkic
              </UBadge>
              <span class="text-xs text-muted">{{ formatDate(a.created_at) }}</span>
            </div>
            <h2 class="text-lg font-bold tracking-tight text-highlighted sm:text-xl">
              {{ a.title }}
            </h2>
            <!-- eslint-disable vue/no-v-html — renderSimpleMarkdown (DOMPurify) -->
            <div
              class="prose prose-sm mt-3 max-w-none leading-relaxed text-muted prose-headings:text-highlighted sm:prose-base"
              v-html="renderSimpleMarkdown(a.body)"
            />
            <!-- eslint-enable vue/no-v-html -->
          </div>
          <div
            v-if="canManage"
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
      </article>
      </div>
    </template>
    </div>

    <SlaviaModal
      v-model:open="modalOpen"
      :title="editingId ? 'Edytuj ogłoszenie' : 'Nowe ogłoszenie'"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-3xl md:max-w-4xl lg:max-w-5xl' }"
    >
      <template #body>
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
    </SlaviaModal>
  </PublicPageLayout>
</template>

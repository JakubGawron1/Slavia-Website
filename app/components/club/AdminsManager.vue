<script setup lang="ts">
import { apiRoutes, urlAdminAccount, urlAdminBan, urlAdminUnban, urlSuperadminAdmin } from '~/config/api'
import type { AdminAccount, Athlete, GroupedAdminAccounts, UserRole } from '~/types/models'

const api = useApi()
const auth = useAuth()
const toast = useToast()
const expBanUi = useExperimentalFlag('admin_accounts_ban_ui')

/** Do szablonu (TS nie widzi auto-unwrap Ref z useState w zagnieżdżonym obiekcie). */
const authUserId = computed(() => auth.user.value?.id ?? null)

const canSuper = computed(() => auth.isSuperAdmin.value)
const canEditAccount = computed(() => auth.isAdmin.value)

const bucketAdmins = ref<AdminAccount[]>([])
const bucketTrainers = ref<AdminAccount[]>([])
const bucketAthletes = ref<AdminAccount[]>([])
const loading = ref(true)

/** Kolejność i zestaw ról nadawalnych przez superadmina. */
const ALL_ROLES: UserRole[] = ['SuperAdmin', 'Admin', 'Trainer', 'Athlete']

const ROLE_LABELS: Record<UserRole, string> = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  Trainer: 'Trener',
  Athlete: 'Zawodnik'
}

const ROLE_FILTER_META: Record<UserRole, { hint: string, pillClass: string }> = {
  SuperAdmin: {
    hint: 'Pełny dostęp administracyjny',
    pillClass: 'border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300'
  },
  Admin: {
    hint: 'Panel administracyjny',
    pillClass: 'border-info/35 bg-info/10 text-info'
  },
  Trainer: {
    hint: 'Panel trenera',
    pillClass: 'border-success/35 bg-success/10 text-success'
  },
  Athlete: {
    hint: 'Strefa zawodnika',
    pillClass: 'border-default bg-muted/40 text-highlighted'
  }
}

/** Synonimy wyszukiwania po „roli” (wpisy użytkownika po polsku / skróty). */
const ROLE_SEARCH_ALIASES: Record<UserRole, string[]> = {
  SuperAdmin: ['superadmin', 'super', 'administrator główny'],
  Admin: ['administrator', 'administracja', 'panel admina', 'admin i trener', 'admin trener'],
  Trainer: ['trener', 'coach', 'panel trenera', 'admin i trener', 'admin trener'],
  Athlete: ['zawodnik', 'zawodniczka', 'sportowiec', 'sport']
}

const searchQuery = ref('')

/** Zaznaczone role — jeśli zaznaczone są wszystkie, filtr ról jest wyłączony. */
const roleChecks = reactive(
  Object.fromEntries(ALL_ROLES.map(r => [r, true])) as Record<UserRole, boolean>
)

const allAccounts = computed(() => {
  const seen = new Set<string>()
  const rows: AdminAccount[] = []
  for (const a of [...bucketAdmins.value, ...bucketTrainers.value, ...bucketAthletes.value]) {
    if (!seen.has(a.id)) {
      seen.add(a.id)
      rows.push(a)
    }
  }
  rows.sort((a, b) => a.username.localeCompare(b.username, 'pl'))
  return rows
})

function roleFilterHaystack(a: AdminAccount): string {
  return a.roles
    .map((r) => {
      const ur = r as UserRole
      const label = ROLE_LABELS[ur] ?? r
      const aliases = ROLE_SEARCH_ALIASES[ur] ?? []
      return [r, label, ...aliases].join(' ')
    })
    .join(' ')
    .toLowerCase()
}

function rowMatchesRoleChecks(a: AdminAccount): boolean {
  const checkedRoles = ALL_ROLES.filter(r => roleChecks[r])
  if (checkedRoles.length === ALL_ROLES.length) {
    return true
  }
  if (checkedRoles.length === 0) {
    return false
  }
  return a.roles.some(r => checkedRoles.includes(r as UserRole))
}

function rowMatchesSearch(a: AdminAccount): boolean {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return true
  if (a.username.toLowerCase().includes(q)) return true
  if (roleFilterHaystack(a).includes(q)) return true
  return false
}

const displayedAccounts = computed(() =>
  allAccounts.value.filter(a => rowMatchesRoleChecks(a) && rowMatchesSearch(a))
)

const filtersDirty = computed(
  () =>
    !!searchQuery.value.trim()
    || ALL_ROLES.some(r => !roleChecks[r])
)

const totalAccountsCount = computed(() => allAccounts.value.length)

function initialsFromUsername(username: string) {
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean)
  const first = parts[0]
  const second = parts[1]
  if (first && second) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase()
  }
  const slice = username.trim().slice(0, 2).toUpperCase()
  return slice || '?'
}

function roleBadgeColor(role: UserRole): 'primary' | 'info' | 'success' | 'neutral' {
  switch (role) {
    case 'SuperAdmin':
      return 'primary'
    case 'Admin':
      return 'info'
    case 'Trainer':
      return 'success'
    default:
      return 'neutral'
  }
}

const modalOpen = ref(false)
const saving = ref(false)
const username = ref('')
const password = ref('')
/** Opcjonalnie: powiązanie nowego konta z profilem zawodnika bez `user_id` (rola Athlete). */
const linkAthleteId = ref<string>('')
const athletesForLink = ref<{ label: string, value: string }[]>([])
/** Role początkowe nowego konta (backend domyślnie [`Admin`], jeśli nie wyślesz). */
const createRoles = ref<UserRole[]>(['Admin'])

const deleteModalOpen = ref(false)
const pendingDelete = ref<AdminAccount | null>(null)
const deleting = ref(false)

const roleEditId = ref<string | null>(null)
const roleEditValue = ref<UserRole[]>([])

const accountModalOpen = ref(false)
const accountSaving = ref(false)
const accountTarget = ref<AdminAccount | null>(null)
const accountUsername = ref('')
const accountPassword = ref('')

const banModalOpen = ref(false)
const banSaving = ref(false)
const banTarget = ref<AdminAccount | null>(null)
const banReason = ref('')

const rolesAvailableToAddInEdit = computed(() =>
  ALL_ROLES.filter(r => !roleEditValue.value.includes(r))
)

const createRolesAvailable = computed(() =>
  ALL_ROLES.filter(r => !createRoles.value.includes(r))
)

function canEditAccountFor(a: AdminAccount) {
  if (!canEditAccount.value || auth.user.value?.id === a.id) return false
  if (a.roles.includes('SuperAdmin') && !canSuper.value) return false
  return true
}

function canEditRoleFor(a: AdminAccount) {
  return canSuper.value && auth.user.value?.id !== a.id
}

function canDeleteAccount(a: AdminAccount) {
  return canSuper.value && auth.user.value?.id !== a.id
}

function canBanFor(a: AdminAccount) {
  if (!expBanUi.value) return false
  if (!canEditAccount.value) return false
  if (auth.user.value?.id === a.id) return false
  if (a.roles.includes('SuperAdmin')) return false
  return true
}

function openBanModal(a: AdminAccount) {
  if (!canBanFor(a)) return
  banTarget.value = a
  banReason.value = a.banned_reason ?? ''
  banModalOpen.value = true
}

async function confirmBan() {
  if (!banTarget.value) return
  banSaving.value = true
  try {
    await api(urlAdminBan(banTarget.value.id), {
      method: 'PATCH',
      body: { reason: banReason.value.trim() || undefined }
    })
    toast.add({ title: 'Konto zbanowane', color: 'success' })
    banModalOpen.value = false
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zbanować',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    banSaving.value = false
  }
}

async function quickUnban(a: AdminAccount) {
  if (!canBanFor(a)) return
  banSaving.value = true
  try {
    await api(urlAdminUnban(a.id), { method: 'PATCH' })
    toast.add({ title: 'Cofnięto bana', color: 'success' })
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się odbanować',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    banSaving.value = false
  }
}

function startRoleEdit(a: AdminAccount) {
  roleEditId.value = a.id
  roleEditValue.value = [...a.roles] as UserRole[]
}

function addRoleToEdit(r: UserRole) {
  if (roleEditValue.value.includes(r)) return
  roleEditValue.value = [...roleEditValue.value, r]
}

function removeRoleFromEdit(r: UserRole) {
  if (roleEditValue.value.length <= 1) {
    toast.add({ title: 'Zostaw co najmniej jedną rolę', color: 'warning' })
    return
  }
  roleEditValue.value = roleEditValue.value.filter(x => x !== r)
}

function addCreateRole(r: UserRole) {
  if (createRoles.value.includes(r)) return
  createRoles.value = [...createRoles.value, r]
}

function removeCreateRole(r: UserRole) {
  if (createRoles.value.length <= 1) {
    toast.add({ title: 'Nowe konto musi mieć co najmniej jedną rolę', color: 'warning' })
    return
  }
  createRoles.value = createRoles.value.filter(x => x !== r)
  if (r === 'Athlete') {
    linkAthleteId.value = ''
  }
}

function clearFilters() {
  searchQuery.value = ''
  for (const r of ALL_ROLES) {
    roleChecks[r] = true
  }
}

function openAccountEdit(a: AdminAccount) {
  accountTarget.value = a
  accountUsername.value = a.username
  accountPassword.value = ''
  accountModalOpen.value = true
}

async function saveAccountEdit() {
  if (!accountTarget.value) return
  if (!accountUsername.value.trim()) {
    toast.add({ title: 'Login jest wymagany', color: 'warning' })
    return
  }
  accountSaving.value = true
  try {
    const body: Record<string, string> = {
      username: accountUsername.value.trim()
    }
    if (accountPassword.value) {
      body.password = accountPassword.value
    }
    await api(urlAdminAccount(accountTarget.value.id), {
      method: 'PATCH',
      body
    })
    toast.add({ title: 'Konto zaktualizowane', color: 'success' })
    accountModalOpen.value = false
    accountPassword.value = ''
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zapisać',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    accountSaving.value = false
  }
}

async function changeRole(adminId: string, newRoles: UserRole[]) {
  if (!newRoles.length) {
    toast.add({ title: 'Wybierz co najmniej jedną rolę', color: 'warning' })
    return
  }
  try {
    await api(`${apiRoutes.superadmin.admins}/${adminId}/role`, {
      method: 'PATCH',
      body: { roles: newRoles }
    })
    toast.add({ title: 'Role zaktualizowane', color: 'success' })
    roleEditId.value = null
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się zmienić ról',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function loadAdmins() {
  loading.value = true
  try {
    const data = await api<GroupedAdminAccounts>(apiRoutes.superadmin.adminsGrouped)
    bucketAdmins.value = data.admins ?? []
    bucketTrainers.value = data.trainers ?? []
    bucketAthletes.value = data.athletes ?? []
  } catch (e) {
    toast.add({
      title: 'Nie udało się wczytać kont',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadAthletesForLink() {
  try {
    const list = await api<Athlete[]>(apiRoutes.athletes.listAdmin)
    athletesForLink.value = (Array.isArray(list) ? list : [])
      .filter(a => !(a.user_id && String(a.user_id).trim()))
      .map(a => ({ label: a.full_name, value: a.id }))
      .sort((x, y) => x.label.localeCompare(y.label, 'pl'))
  } catch {
    athletesForLink.value = []
  }
}

function openCreate() {
  username.value = ''
  password.value = ''
  createRoles.value = ['Admin']
  linkAthleteId.value = ''
  modalOpen.value = true
  void loadAthletesForLink()
}

async function saveAdmin() {
  if (!username.value.trim() || !password.value) {
    toast.add({ title: 'Podaj nazwę użytkownika i hasło', color: 'warning' })
    return
  }
  if (!createRoles.value.length) {
    toast.add({ title: 'Wybierz co najmniej jedną rolę', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const created = await api<{ id: string }>(apiRoutes.superadmin.admins, {
      method: 'POST',
      body: {
        username: username.value.trim(),
        password: password.value,
        roles: createRoles.value
      }
    })
    if (createRoles.value.includes('Athlete') && linkAthleteId.value.trim()) {
      await api(apiRoutes.athletes.attachUser(linkAthleteId.value.trim()), {
        method: 'POST',
        body: { user_id: created.id }
      })
    }
    toast.add({ title: 'Dodano konto', color: 'success', icon: 'i-lucide-check' })
    modalOpen.value = false
    password.value = ''
    linkAthleteId.value = ''
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się dodać konta',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function askDelete(a: AdminAccount) {
  pendingDelete.value = a
  deleteModalOpen.value = true
}

function cancelDelete() {
  deleteModalOpen.value = false
  pendingDelete.value = null
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  deleting.value = true
  try {
    await api(urlSuperadminAdmin(pendingDelete.value.id), { method: 'DELETE' })
    toast.add({ title: 'Usunięto konto', color: 'success' })
    cancelDelete()
    await loadAdmins()
  } catch (e) {
    toast.add({
      title: 'Nie udało się usunąć',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadAdmins()
})
</script>

<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Nagłówek operacji -->
    <div
      class="relative overflow-hidden rounded-[1.35rem] border border-default/70 bg-linear-to-br from-card via-card to-primary/6 p-5 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.35)] ring-1 ring-white/10 sm:rounded-[1.75rem] sm:p-8 dark:from-elevated dark:via-card dark:to-primary/9 dark:shadow-[0_24px_70px_-30px_rgba(0,0,0,0.65)]"
    >
      <div class="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
      <div class="pointer-events-none absolute -bottom-24 left-1/4 size-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0 max-w-2xl space-y-3">
          <div class="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <UIcon
              name="i-lucide-users-round"
              class="size-3.5"
            />
            Konta systemowe
          </div>
          <p class="text-sm leading-relaxed text-muted sm:text-[15px]">
            <span v-if="canSuper">Jedna lista użytkowników — filtry ról, szybkie wyszukiwanie, edycja przypisań. Konta tworzysz i usuwasz jako superadmin; własnego konta nie zmienisz z tego widoku.</span>
            <span v-else>Możesz edytować login, e-mail i hasło przypisanych kont. Przypisywanie ról pozostaje po stronie superadministratora.</span>
          </p>
        </div>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            class="flex w-full items-center justify-center gap-3 rounded-2xl border border-default/80 bg-background/80 px-4 py-3 backdrop-blur-md sm:w-auto sm:justify-start dark:bg-background/40"
          >
            <div class="text-center">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                W bazie
              </p>
              <p class="text-2xl font-black tabular-nums text-highlighted">
                <template v-if="loading">
                  <SlaviaShimmerText width="4.5rem" height="1.35em" />
                </template>
                <template v-else>
                  {{ totalAccountsCount }}
                </template>
              </p>
            </div>
            <div class="h-10 w-px bg-default/60" />
            <div class="text-center">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                Po filtrach
              </p>
              <p class="text-2xl font-black tabular-nums text-primary">
                <template v-if="loading">
                  <SlaviaShimmerText width="3.5rem" height="1.35em" />
                </template>
                <template v-else>
                  {{ displayedAccounts.length }}
                </template>
              </p>
            </div>
          </div>
          <UButton
            v-if="canSuper"
            icon="i-lucide-user-plus"
            size="lg"
            class="min-h-11 w-full touch-manipulation rounded-xl px-5 font-bold shadow-lg shadow-primary/20 sm:w-auto"
            @click="openCreate"
          >
            Nowe konto
          </UButton>
        </div>
      </div>
    </div>

    <!-- Filtry -->
    <div
      v-if="!loading"
      class="rounded-2xl border border-default/60 bg-muted/15 p-4 backdrop-blur-sm dark:bg-muted/10 sm:p-6"
    >
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 class="text-sm font-black uppercase tracking-[0.18em] text-muted">
            Filtry
          </h2>
          <p class="mt-1 max-w-xl text-xs text-muted">
            Kliknij rolę, by wykluczyć konta bez niej. Wszystkie aktywne = pełna lista.
          </p>
        </div>
        <UButton
          v-if="filtersDirty"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-filter-x"
          class="rounded-full"
          @click="clearFilters"
        >
          Wyczyść
        </UButton>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <button
          v-for="r in ALL_ROLES"
          :key="r"
          type="button"
          class="group flex min-h-13 w-full touch-manipulation flex-col rounded-2xl border-2 px-4 py-3 text-left transition-all"
          :class="[
            roleChecks[r]
              ? ROLE_FILTER_META[r].pillClass + ' ring-2 ring-primary/25 shadow-md'
              : 'border-default/50 bg-muted/20 opacity-55 grayscale hover:opacity-90'
          ]"
          @click="roleChecks[r] = !roleChecks[r]"
        >
          <span class="flex items-center justify-between gap-2">
            <span class="text-xs font-black uppercase tracking-wide text-highlighted">{{ ROLE_LABELS[r] }}</span>
            <UIcon
              :name="roleChecks[r] ? 'i-lucide-check-circle-2' : 'i-lucide-circle-dashed'"
              class="size-4 shrink-0 opacity-80"
            />
          </span>
          <span class="mt-1 text-[10px] leading-snug text-muted">{{ ROLE_FILTER_META[r].hint }}</span>
        </button>
      </div>

      <UInput
        v-model="searchQuery"
        placeholder="Szukaj: login, e-mail, trener, SuperAdmin…"
        icon="i-lucide-search"
        size="lg"
        class="w-full min-h-11 touch-manipulation rounded-xl text-base"
      />
    </div>

    <!-- Stan ładowania -->
    <div
      v-if="loading"
      class="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-default bg-muted/10 py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-10 animate-spin text-primary"
      />
      <p class="text-sm font-medium text-muted">
        Ładowanie kont…
      </p>
    </div>

    <!-- Lista kont -->
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-if="displayedAccounts.length === 0"
        class="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-default bg-muted/10 px-6 py-16 text-center"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-default/50">
          <UIcon
            name="i-lucide-search-x"
            class="size-7 text-muted"
          />
        </div>
        <div>
          <p class="font-bold text-highlighted">
            Brak wyników
          </p>
          <p class="mt-1 max-w-sm text-sm text-muted">
            Dostosuj filtry ról albo wpisz inne kryterium wyszukiwania.
          </p>
        </div>
        <UButton
          v-if="filtersDirty"
          variant="outline"
          color="neutral"
          @click="clearFilters"
        >
          Reset filtrów
        </UButton>
      </div>

      <article
        v-for="a in displayedAccounts"
        :key="a.id"
        class="group relative overflow-hidden rounded-[1.35rem] border border-default/70 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-[0_16px_48px_-20px_rgba(0,0,0,0.22)] dark:hover:shadow-[0_20px_55px_-22px_rgba(0,0,0,0.55)]"
      >
        <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div class="flex flex-col gap-5 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <!-- Avatar + user -->
          <div class="flex min-w-0 flex-1 gap-4">
            <div
              class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/25 to-primary/5 text-lg font-black text-primary ring-2 ring-primary/20 sm:size-16 sm:text-xl"
            >
              {{ initialsFromUsername(a.username) }}
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-lg font-bold tracking-tight text-highlighted">
                  {{ a.username }}
                </h3>
                <UBadge
                  v-if="authUserId === a.id"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                >
                  Ty
                </UBadge>
                <UBadge
                  v-if="a.is_banned"
                  color="warning"
                  variant="subtle"
                  size="xs"
                  :title="a.banned_reason ? `Powód bana: ${a.banned_reason}` : 'Konto jest zbanowane'"
                >
                  Zbanowany
                </UBadge>
              </div>
              <p class="text-xs italic text-muted">
                Konto bez e-maila
              </p>
            </div>
          </div>

          <!-- Role -->
          <div class="min-w-0 flex-[1.15] space-y-3 border-t border-default/50 pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 md:max-w-xl">
            <div
              v-if="canEditRoleFor(a) && roleEditId === a.id"
              class="space-y-3"
            >
              <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
                Edycja ról
              </p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="r in roleEditValue"
                  :key="r"
                  :color="roleBadgeColor(r)"
                  variant="subtle"
                  class="inline-flex items-center gap-1 pr-0.5"
                >
                  {{ ROLE_LABELS[r] }}
                  <UButton
                    icon="i-lucide-x"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    class="h-5 min-w-5 p-0"
                    :aria-label="`Usuń rolę ${ROLE_LABELS[r]}`"
                    @click="removeRoleFromEdit(r)"
                  />
                </UBadge>
              </div>
              <div
                v-if="rolesAvailableToAddInEdit.length > 0"
                class="flex flex-wrap gap-1.5"
              >
                <UButton
                  v-for="r in rolesAvailableToAddInEdit"
                  :key="r"
                  size="xs"
                  variant="outline"
                  color="neutral"
                  class="rounded-full"
                  @click="addRoleToEdit(r)"
                >
                  + {{ ROLE_LABELS[r] }}
                </UButton>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  size="sm"
                  class="rounded-full font-semibold"
                  @click="changeRole(a.id, roleEditValue)"
                >
                  Zapisz role
                </UButton>
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  class="rounded-full"
                  @click="roleEditId = null"
                >
                  Anuluj
                </UButton>
              </div>
            </div>
            <div
              v-else
              class="space-y-2"
            >
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  v-for="role in a.roles"
                  :key="role"
                  :color="roleBadgeColor(role as UserRole)"
                  variant="subtle"
                  size="md"
                  class="font-semibold"
                >
                  {{ ROLE_LABELS[role as UserRole] ?? role }}
                </UBadge>
                <UButton
                  v-if="canEditRoleFor(a)"
                  size="xs"
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-pencil"
                  class="rounded-full"
                  @click="startRoleEdit(a)"
                >
                  Role
                </UButton>
              </div>
              <p
                v-if="a.roles.includes('Athlete')"
                class="text-[11px] leading-snug text-muted"
              >
                Profil sportowy edytujesz w module zawodników.
              </p>
              <p
                v-else-if="a.roles.includes('Trainer') && !a.roles.some(r => ['SuperAdmin', 'Admin'].includes(r))"
                class="text-[11px] leading-snug text-muted"
              >
                Dostęp do panelu trenera bez roli administratora.
              </p>
              <p
                v-else-if="a.roles.includes('Admin') && a.roles.includes('Trainer')"
                class="text-[11px] leading-snug text-muted"
              >
                Administrator i trener — osobno panel admina i trenera.
              </p>
            </div>
          </div>

          <!-- Akcje -->
          <div class="flex w-full shrink-0 flex-row gap-2 border-t border-default/50 pt-4 sm:w-auto sm:flex-col sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <UButton
              v-if="canBanFor(a)"
              :color="a.is_banned ? 'success' : 'warning'"
              variant="soft"
              :icon="a.is_banned ? 'i-lucide-shield-check' : 'i-lucide-shield-ban'"
              block
              class="min-h-11 flex-1 touch-manipulation justify-center rounded-xl font-semibold sm:min-h-10 sm:min-w-34 sm:flex-none"
              :loading="banSaving && banTarget?.id === a.id"
              @click="a.is_banned ? quickUnban(a) : openBanModal(a)"
            >
              {{ a.is_banned ? 'Odbanuj' : 'Banuj' }}
            </UButton>
            <UButton
              v-if="canEditAccountFor(a)"
              variant="soft"
              color="neutral"
              icon="i-lucide-key-round"
              block
              class="min-h-11 flex-1 touch-manipulation justify-center rounded-xl font-semibold sm:min-h-10 sm:min-w-34 sm:flex-none"
              @click="openAccountEdit(a)"
            >
              Konto
            </UButton>
            <UButton
              v-if="canDeleteAccount(a)"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              block
              class="min-h-11 flex-1 touch-manipulation justify-center rounded-xl font-semibold sm:min-h-10 sm:min-w-34 sm:flex-none"
              @click="askDelete(a)"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </article>
    </div>

    <UModal
      v-model:open="modalOpen"
      title="Nowe konto"
      :dismissible="true"
      :ui="{ content: 'rounded-3xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl' }"
    >
      <template #content>
        <div class="slavia-form-modal">
          <form
            class="slavia-form-stack"
            @submit.prevent="saveAdmin"
          >
            <div class="slavia-form-panel rounded-2xl ring-1 ring-default/40">
              <div class="slavia-form-panel__header rounded-t-2xl bg-linear-to-r from-primary/12 to-transparent">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon rounded-xl bg-primary/20 text-primary">
                    <UIcon
                      name="i-lucide-user-plus"
                      class="size-4"
                    />
                  </span>
                  Dane konta i role
                </div>
              </div>
              <div class="slavia-form-panel__body space-y-5">
                <UFormField
                  label="Login (nazwa użytkownika)"
                  required
                >
                  <UInput
                    v-model="username"
                    autocomplete="username"
                    size="lg"
                    placeholder="np. admin_klubu"
                    class="w-full rounded-xl"
                  />
                </UFormField>
                <UFormField
                  label="Hasło"
                  required
                >
                  <UInput
                    v-model="password"
                    type="password"
                    autocomplete="new-password"
                    size="lg"
                    class="w-full rounded-xl"
                  />
                </UFormField>
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted">
                    Role startowe
                  </p>
                  <div class="flex flex-wrap gap-1.5">
                    <UBadge
                      v-for="r in createRoles"
                      :key="r"
                      :color="roleBadgeColor(r)"
                      variant="subtle"
                      class="inline-flex items-center gap-1 pr-0.5"
                    >
                      {{ ROLE_LABELS[r] }}
                      <UButton
                        v-if="createRoles.length > 1"
                        icon="i-lucide-x"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        class="h-5 min-w-5 p-0"
                        @click="removeCreateRole(r)"
                      />
                    </UBadge>
                  </div>
                  <div
                    v-if="createRolesAvailable.length > 0"
                    class="flex flex-wrap gap-1.5 pt-1"
                  >
                    <UButton
                      v-for="r in createRolesAvailable"
                      :key="r"
                      size="xs"
                      variant="outline"
                      color="neutral"
                      class="rounded-full"
                      @click="addCreateRole(r)"
                    >
                      + {{ ROLE_LABELS[r] }}
                    </UButton>
                  </div>
                </div>
                <UFormField
                  v-if="createRoles.includes('Athlete')"
                  label="Przypisz profil zawodnika"
                  description="Opcjonalnie — tylko rekordy bez wcześniejszego konta logowania."
                >
                  <USelect
                    v-model="linkAthleteId"
                    :items="[{ label: '— bez profilu —', value: '' }, ...athletesForLink]"
                    value-key="value"
                    size="lg"
                    class="w-full rounded-xl"
                  />
                </UFormField>
              </div>
            </div>
            <div class="slavia-form-actions border-t border-default/60 pt-4">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                size="lg"
                class="rounded-xl"
                @click="modalOpen = false"
              >
                Anuluj
              </UButton>
              <UButton
                type="submit"
                size="lg"
                class="rounded-xl font-bold shadow-md shadow-primary/15"
                :loading="saving"
              >
                Utwórz
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="accountModalOpen"
      title="Edycja konta"
      :dismissible="true"
      :ui="{ content: 'rounded-3xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl' }"
    >
      <template #content>
        <div class="slavia-form-modal">
          <div class="slavia-form-panel rounded-2xl ring-1 ring-default/40">
            <div class="slavia-form-panel__header rounded-t-2xl bg-linear-to-r from-neutral-500/10 to-transparent dark:from-white/5">
              <div class="slavia-form-panel__title">
                <span class="slavia-form-panel__icon rounded-xl bg-muted text-highlighted">
                  <UIcon
                    name="i-lucide-pencil"
                    class="size-4"
                  />
                </span>
                Dane logowania
              </div>
            </div>
            <div class="slavia-form-panel__body space-y-4">
              <UFormField
                label="Login"
                required
              >
                <UInput
                  v-model="accountUsername"
                  autocomplete="username"
                  size="lg"
                  class="w-full rounded-xl"
                />
              </UFormField>
              <UFormField label="Nowe hasło (pozostaw puste, by nie zmieniać)">
                <UInput
                  v-model="accountPassword"
                  type="password"
                  autocomplete="new-password"
                  size="lg"
                  class="w-full rounded-xl"
                />
              </UFormField>
            </div>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="rounded-xl"
              @click="accountModalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              size="lg"
              class="rounded-xl font-bold"
              :loading="accountSaving"
              @click="saveAccountEdit"
            >
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="deleteModalOpen"
      title="Usunąć konto?"
      :dismissible="true"
      :ui="{ content: 'rounded-3xl sm:max-w-sm' }"
    >
      <template #content>
        <div class="slavia-form-modal space-y-4">
          <div
            v-if="pendingDelete"
            class="rounded-2xl border border-error/25 bg-error/5 px-4 py-3 text-sm text-highlighted"
          >
            <p class="font-semibold text-error">
              {{ pendingDelete.username }}
            </p>
            <p class="mt-2 text-muted">
              Tej operacji nie cofniesz. Upewnij się, że konto nie jest potrzebne do logowania ani powiązań.
            </p>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="rounded-xl"
              @click="cancelDelete"
            >
              Wróć
            </UButton>
            <UButton
              color="error"
              size="lg"
              class="rounded-xl font-bold"
              :loading="deleting"
              @click="confirmDelete"
            >
              Usuń na stałe
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="banModalOpen"
      title="Zbanować konto?"
      :dismissible="true"
      :ui="{ content: 'rounded-3xl sm:max-w-md' }"
    >
      <template #content>
        <div class="slavia-form-modal space-y-4">
          <div
            v-if="banTarget"
            class="rounded-2xl border border-warning/25 bg-warning/5 px-4 py-3 text-sm text-highlighted"
          >
            <p class="font-semibold text-warning">
              {{ banTarget.username }}
            </p>
            <p class="mt-2 text-muted">
              Po banie konto będzie widzieć tylko stronę z komunikatem.
            </p>
          </div>

          <UFormField
            label="Powód (opcjonalnie)"
            description="Jeśli podasz, pokażemy go na stronie „Konto zbanowane”."
          >
            <UTextarea
              v-model="banReason"
              :rows="4"
              placeholder="np. Brak składek od 3 miesięcy"
              class="w-full rounded-xl"
            />
          </UFormField>

          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="rounded-xl"
              @click="banModalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              color="warning"
              size="lg"
              class="rounded-xl font-bold"
              :loading="banSaving"
              @click="confirmBan"
            >
              Zbanuj
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

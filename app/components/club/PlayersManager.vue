<script setup lang="ts">
import { apiRoutes, urlAdminPlayer } from '~/config/api'
import {
  formatPzpcWeightCategory,
  parsePzpcWeightCategoryStored,
  PZPC_AGE_GROUPS,
  pzpcWeightClassLabels,
  type PzpcAgeGroupId
} from '~/data/pzpcWeightCategories'
import type { Competition, GroupedAdminAccounts, Player, UserRole } from '~/types/models'
import { useFormFieldScrollRestore } from '~/composables/useFormFieldScrollRestore'
import { buildUploadFormData } from '~/utils/uploadFormData'

const api = useApi()
const formScroll = useFormFieldScrollRestore('players-manager-modal')
const toast = useToast()
const auth = useAuth()
const expReverseLink = useExperimentalFlag('athlete_reverse_account_linking')
const route = useRoute()
const router = useRouter()

/** Tworzenie konta `users` bezpośrednio — tylko Admin / SuperAdmin (spójnie z backendem). */
const canManageAthleteLogin = computed(() => auth.isAdmin.value)

/** Usuwanie rekordu zawodnika — tylko administratorzy (backend: RequireAdminOrSuperAdmin). */
const canDeleteAthlete = computed(() => auth.isAdmin.value)

const players = ref<Player[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const deleteModalOpen = ref(false)

/** Zamykanie modala edycji — zawsze przez funkcję (pewna aktualizacja ref w handlerach). */
function closeEditModal() {
  modalOpen.value = false
}
const pendingDelete = ref<Player | null>(null)
const saving = ref(false)
const deleting = ref(false)

const editingId = ref<string | null>(null)

const fileInputRef = ref<HTMLInputElement>()

const form = reactive<{
  full_name: string
  birth_year: number | null
  gender: string
  pzpc_age_group: PzpcAgeGroupId
  /** Pusta wartość — brak wyboru kategorii startowej (np. tylko masa ciała). */
  pzpc_weight_class: string
  bodyweight: number | null
  best_snatch_kg: number | null
  best_clean_jerk_kg: number | null
  total_kg: number | null
  image_url: string | undefined
  notes: string | undefined
  profile_tagline: string | undefined
  public_bio: string | undefined
  is_active: boolean
  /** Przelew stały — system co miesiąc automatycznie tworzy Approved-składkę. */
  has_standing_order: boolean
  create_account: boolean
  username: string
  password: string
}>({
  full_name: '',
  birth_year: null,
  gender: 'male',
  pzpc_age_group: 'Senior',
  pzpc_weight_class: '',
  bodyweight: null,
  best_snatch_kg: null,
  best_clean_jerk_kg: null,
  total_kg: null,
  image_url: undefined,
  notes: undefined,
  profile_tagline: undefined,
  public_bio: undefined,
  is_active: true,
  has_standing_order: false,
  // Account fields
  create_account: false,
  username: '',
  password: ''
})

/** Stan flagi przy otwarciu modala — żeby przy zapisie wysłać PATCH tylko gdy się zmienił. */
const standingOrderInitial = ref(false)

const uploadLoading = ref(false)

/** Surowy tekst kategorii z bazy — jeśli nie da się sparsować (stary format), zachowujemy przy zapisie. */
const legacyWeightCategoryRaw = ref('')

const pzpcAgeSelectItems = PZPC_AGE_GROUPS.map(x => ({ label: x.label, value: x.id }))

const pzpcWeightSelectItems = computed(() => {
  const g = form.gender === 'female' ? 'female' : 'male'
  return pzpcWeightClassLabels(form.pzpc_age_group, g).map(k => ({
    label: k.startsWith('+') ? `${k} kg` : `${k} kg`,
    value: k
  }))
})

const legacyWeightCategoryHint = computed(() => {
  const raw = legacyWeightCategoryRaw.value.trim()
  if (!raw) return ''
  if (parsePzpcWeightCategoryStored(raw)) return ''
  return `W bazie jest wpis „${raw}”. Wybierz kategorię z listy PZPC — przy zapisie bez wyboru pozostawimy ten tekst.`
})

watch(
  () => [form.pzpc_age_group, form.gender] as const,
  () => {
    const ok = pzpcWeightSelectItems.value.some(i => i.value === form.pzpc_weight_class)
    if (!ok) {
      form.pzpc_weight_class = ''
    }
  }
)

function resolvedWeightCategoryForSave(): string | null {
  const cls = form.pzpc_weight_class.trim()
  if (cls) {
    return formatPzpcWeightCategory(
      form.pzpc_age_group,
      form.gender === 'female' ? 'female' : 'male',
      cls
    )
  }
  const leg = legacyWeightCategoryRaw.value.trim()
  return leg || null
}

const competitionsCatalog = ref<Competition[]>([])
const assignedCompetitionIds = ref<string[]>([])
const assignmentsLoading = ref(false)

const athleteAccountOptions = ref<{ label: string, value: string }[]>([])
const athleteAccountSelected = ref<string>('')
const athleteAccountSaving = ref(false)
const athleteAccountUsernameById = ref<Record<string, string>>({})

const editingPlayer = computed(() =>
  editingId.value ? players.value.find(p => p.id === editingId.value) ?? null : null
)

async function refreshAthleteAccountCatalog() {
  if (!canManageAthleteLogin.value) {
    athleteAccountOptions.value = [{ label: '— tylko Admin/SuperAdmin —', value: '' }]
    athleteAccountUsernameById.value = {}
    return
  }
  try {
    const data = await api<GroupedAdminAccounts>(apiRoutes.superadmin.adminsGrouped)
    const all = [
      ...(data.admins ?? []),
      ...(data.trainers ?? []),
      ...(data.athletes ?? [])
    ]
    const seen = new Set<string>()
    const items = all
      .filter(u => {
        if (!u?.id || seen.has(u.id)) return false
        seen.add(u.id)
        return true
      })
      .filter(u => Array.isArray(u.roles) && (u.roles as UserRole[]).includes('Athlete'))
      .map(u => ({ label: `${u.username} · ${u.roles.join(', ')}`, value: u.id, username: u.username }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pl'))
    const linked = editingPlayer.value?.user_id ?? ''
    athleteAccountUsernameById.value = Object.fromEntries(items.map(i => [i.value, i.username]))
    athleteAccountOptions.value = [
      { label: '— wybierz konto —', value: '' },
      ...items.map(i => ({
        value: i.value,
        label: linked && i.value === linked ? `${i.label} (już przypięte)` : i.label
      }))
    ]
  } catch {
    athleteAccountOptions.value = [{ label: '— wybierz konto —', value: '' }]
    athleteAccountUsernameById.value = {}
  }
}

const linkedAthleteAccountUsername = computed(() => {
  const id = editingPlayer.value?.user_id ?? ''
  if (!id) return ''
  return athleteAccountUsernameById.value[id] || id
})

async function attachExistingAccountToAthlete() {
  if (!editingId.value) return
  const selectedUserId = athleteAccountSelected.value.trim()
  if (!selectedUserId) {
    toast.add({ title: 'Wybierz konto z listy', color: 'warning' })
    return
  }
  athleteAccountSaving.value = true
  try {
    await api(apiRoutes.athletes.attachUser(editingId.value), {
      method: 'POST',
      body: { user_id: selectedUserId }
    })
    toast.add({ title: 'Przypisano konto do zawodnika', color: 'success' })
    await loadPlayers()
  } catch (e) {
    toast.add({
      title: 'Nie udało się przypisać konta',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    athleteAccountSaving.value = false
  }
}

async function detachAccountFromAthlete() {
  if (!editingId.value) return
  athleteAccountSaving.value = true
  try {
    await api(apiRoutes.athletes.detachUser(editingId.value), { method: 'POST' })
    toast.add({ title: 'Odłączono konto od zawodnika', color: 'success' })
    await loadPlayers()
  } catch (e) {
    toast.add({
      title: 'Nie udało się odłączyć konta',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    athleteAccountSaving.value = false
  }
}

async function loadAthleteAssignments(athleteId: string) {
  assignmentsLoading.value = true
  try {
    const mine = await api<Competition[]>(apiRoutes.athletes.competitions(athleteId))
    assignedCompetitionIds.value = mine.map(c => c.id)
  } catch {
    assignedCompetitionIds.value = []
  } finally {
    assignmentsLoading.value = false
  }
}

watch(modalOpen, async (open) => {
  if (!open) {
    return
  }
  if (!editingId.value) {
    competitionsCatalog.value = []
    assignedCompetitionIds.value = []
    athleteAccountSelected.value = ''
    return
  }
  void refreshAthleteAccountCatalog()
  try {
    const rows = await api<Competition[]>(apiRoutes.competitions.collection)
    competitionsCatalog.value = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    competitionsCatalog.value = []
  }
  await loadAthleteAssignments(editingId.value)
})

function resetForm() {
  editingId.value = null
  legacyWeightCategoryRaw.value = ''
  form.full_name = ''
  form.birth_year = null
  form.gender = 'male'
  form.pzpc_age_group = 'Senior'
  form.pzpc_weight_class = ''
  form.bodyweight = null
  form.best_snatch_kg = null
  form.best_clean_jerk_kg = null
  form.total_kg = null
  form.image_url = undefined
  form.notes = undefined
  form.profile_tagline = undefined
  form.public_bio = undefined
  form.is_active = true
  form.has_standing_order = false
  standingOrderInitial.value = false
  form.create_account = false
  form.username = ''
  form.password = ''
  assignedCompetitionIds.value = []
  athleteAccountSelected.value = ''
}

watch(() => [form.best_snatch_kg, form.best_clean_jerk_kg], ([snatch, cj]) => {
  form.total_kg = (snatch || 0) + (cj || 0)
})

const currentYear = new Date().getFullYear()

/** Rok jako liczba całkowita bez separatorów (UInputNumber potrafiło pokazywać „2 010”). */
function setBirthYear(v: string | number | null | undefined) {
  if (v === null || v === undefined) {
    form.birth_year = null
    return
  }
  const s = String(v)
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/\s/g, '')
    .replace(/,/g, '')
  if (s === '') {
    form.birth_year = null
    return
  }
  const n = Number.parseInt(s, 10)
  form.birth_year = Number.isFinite(n) ? n : null
}

async function loadPlayers() {
  loading.value = true
  try {
    players.value = await api<Player[]>(apiRoutes.athletes.listAdmin)
  } catch (e) {
    toast.add({
      title: 'Nie udało się wczytać zawodników',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function tryOpenEditFromQuery() {
  const raw = route.query.edit
  const editId = typeof raw === 'string' ? raw.trim() : ''
  if (!editId) return
  const p = players.value.find(x => x.id === editId)
  if (!p) return
  openEdit(p)
  const { edit, ...rest } = route.query
  void router.replace({ query: rest })
}

function openCreate() {
  resetForm()
  modalOpen.value = true
}

function openEdit(p: Player) {
  editingId.value = p.id
  legacyWeightCategoryRaw.value = (p.weight_category ?? '').trim()
  const parsed = parsePzpcWeightCategoryStored(p.weight_category ?? undefined)
  form.full_name = p.full_name
  form.birth_year = p.birth_year ?? null
  form.gender = (parsed?.gender ?? p.gender ?? 'male')
  form.pzpc_age_group = parsed?.age ?? 'Senior'
  form.pzpc_weight_class = parsed?.classLabel ?? ''
  form.bodyweight = p.bodyweight ?? null
  form.best_snatch_kg = p.best_snatch_kg ?? null
  form.best_clean_jerk_kg = p.best_clean_jerk_kg ?? null
  form.total_kg = p.total_kg ?? null
  form.image_url = p.image_url || undefined
  form.notes = p.notes ?? undefined
  form.profile_tagline = p.profile_tagline ?? undefined
  form.public_bio = p.public_bio ?? undefined
  form.is_active = p.is_active !== false
  form.has_standing_order = p.has_standing_order === true
  standingOrderInitial.value = form.has_standing_order
  athleteAccountSelected.value = p.user_id ?? ''
  modalOpen.value = true
  nextTick(() => formScroll.restoreScroll())
}

function clickFileInput() {
  fileInputRef.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0] as File
  const formData = buildUploadFormData(file, 'athletes')

  uploadLoading.value = true
  try {
    const res = await api<{ url: string }>(apiRoutes.upload, {
      method: 'POST',
      body: formData
    })
    form.image_url = res.url
    toast.add({ title: 'Zdjęcie przesłane', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Błąd uploadu', description: getApiErrorMessage(err), color: 'error' })
  } finally {
    uploadLoading.value = false
  }
}

async function savePlayer() {
  if (!form.full_name.trim()) {
    toast.add({ title: 'Uzupełnij nazwisko i imię', color: 'warning' })
    return
  }
  if (form.create_account && !canManageAthleteLogin.value && !form.username.trim()) {
    toast.add({
      title: 'Podaj proponowany login',
      description: 'Trener nie tworzy konta — wpisz login, który ma ustawić administrator po powiadomieniu.',
      color: 'warning'
    })
    return
  }
  saving.value = true
  const wasEditing = !!editingId.value
  const willRequestAccountFromAdmin =
    !canManageAthleteLogin.value && form.create_account && !!form.username.trim()
  try {
    const body: Record<string, unknown> = {
      full_name: form.full_name.trim(),
      birth_year: form.birth_year,
      gender: form.gender,
      weight_category: resolvedWeightCategoryForSave(),
      bodyweight: form.bodyweight,
      best_snatch_kg: form.best_snatch_kg,
      best_clean_jerk_kg: form.best_clean_jerk_kg,
      total_kg: form.total_kg,
      image_url: form.image_url,
      notes: form.notes || null,
      profile_tagline: form.profile_tagline?.trim() || null,
      public_bio: form.public_bio?.trim() || null,
      is_active: form.is_active,
      username: form.create_account ? form.username : undefined,
      password: form.create_account ? form.password : undefined
    }
    let athleteId: string
    if (editingId.value) {
      await api(urlAdminPlayer(editingId.value), { method: 'PATCH', body })
      athleteId = editingId.value
      toast.add({
        title: 'Zapisano zmiany',
        description: willRequestAccountFromAdmin
          ? 'Administratorzy otrzymali prośbę o utworzenie konta logowania.'
          : undefined,
        color: 'success',
        icon: 'i-lucide-check'
      })
    } else {
      const created = await api<Player>(apiRoutes.admin.players, { method: 'POST', body })
      athleteId = created.id
      toast.add({
        title: 'Dodano zawodnika',
        description: willRequestAccountFromAdmin
          ? 'Administratorzy otrzymali prośbę o utworzenie konta logowania.'
          : undefined,
        color: 'success',
        icon: 'i-lucide-check'
      })
    }

    if (wasEditing) {
      try {
        await api(apiRoutes.athletes.competitions(athleteId), {
          method: 'PUT',
          body: { competition_ids: [...assignedCompetitionIds.value] }
        })
      } catch (e) {
        toast.add({
          title: 'Zapisano zawodnika — nie zapisano przypisań do zawodów',
          description: getApiErrorMessage(e),
          color: 'warning'
        })
      }
    }

    // „Przelew stały" — wysyłamy patch tylko jeśli wartość się zmieniła (lub przy create + on).
    const standingOrderChanged = wasEditing
      ? form.has_standing_order !== standingOrderInitial.value
      : form.has_standing_order
    if (standingOrderChanged) {
      try {
        await api(apiRoutes.payments.standingOrder(athleteId), {
          method: 'PATCH',
          body: { enabled: form.has_standing_order }
        })
        if (form.has_standing_order) {
          toast.add({
            title: 'Włączono przelew stały',
            description: 'System automatycznie zapisuje opłaconą składkę co miesiąc.',
            color: 'success'
          })
        }
      } catch (e) {
        toast.add({
          title: 'Zapisano zawodnika — nie udało się zaktualizować przelewu stałego',
          description: getApiErrorMessage(e),
          color: 'warning'
        })
      }
    }

    closeEditModal()
    resetForm()
    await loadPlayers()
  } catch (e) {
    toast.add({
      title: 'Operacja nie powiodła się',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function askDelete(p: Player) {
  pendingDelete.value = p
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
    await api(urlAdminPlayer(pendingDelete.value.id), { method: 'DELETE' })
    toast.add({ title: 'Usunięto zawodnika', color: 'success' })
    pendingDelete.value = null
    deleteModalOpen.value = false
    await loadPlayers()
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

onMounted(async () => {
  await loadPlayers()
  tryOpenEditFromQuery()
})

watch(
  () => route.query.edit,
  () => {
    if (!players.value.length) return
    tryOpenEditFromQuery()
  }
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">
        Zarządzaj rekordami zgodnie z danymi w systemie klubowym.
      </p>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Dodaj zawodnika
      </UButton>
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead class="border-b border-default bg-muted/30">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-muted">
                Zawodnik
              </th>
              <th class="px-4 py-3 text-center font-semibold text-muted">
                Rok ur.
              </th>
              <th class="px-4 py-3 text-center font-semibold text-muted">
                Kat.
              </th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">
                Rw.
              </th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">
                Podrzut
              </th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">
                Suma
              </th>
              <th class="px-4 py-3 text-center font-semibold text-muted">
                Aktywny
              </th>
              <th class="px-4 py-3 text-right font-semibold text-muted">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-if="loading">
              <td
                colspan="8"
                class="px-4 py-8"
              >
                <div class="flex flex-col gap-3">
                  <SlaviaShimmerText block width="100%" height="0.9rem" />
                  <SlaviaShimmerText block width="92%" height="0.9rem" />
                  <SlaviaShimmerText block width="86%" height="0.9rem" />
                </div>
              </td>
            </tr>
            <tr
              v-for="p in players"
              v-else
              :key="p.id"
              class="hover:bg-muted/20"
            >
              <td class="px-4 py-3 font-medium">
                <div class="flex items-center gap-3">
                  <UAvatar
                    :src="(p as any).image_url"
                    size="xs"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <p>{{ p.full_name }}</p>
                      <UTooltip
                        v-if="p.user_id"
                        text="Konto powiązane"
                      >
                        <UIcon
                          name="i-lucide-user-check"
                          class="size-3.5 text-primary"
                        />
                      </UTooltip>
                      <UTooltip
                        v-if="p.has_standing_order"
                        text="Przelew stały — auto-składka co miesiąc"
                      >
                        <UIcon
                          name="i-lucide-repeat"
                          class="size-3.5 text-success"
                        />
                      </UTooltip>
                    </div>
                    <p class="text-[10px] uppercase font-bold text-muted">
                      {{ (p as any).gender === 'male' ? 'Mężczyzna' : 'Kobieta' }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-center tabular-nums text-muted">
                {{ p.birth_year ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center text-muted">
                {{ p.weight_category ?? '—' }}
                <span
                  v-if="(p as any).bodyweight"
                  class="block text-[10px]"
                >({{ (p as any).bodyweight }} kg)</span>
              </td>
              <td class="px-4 py-3 text-center tabular-nums">
                {{ p.best_snatch_kg ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center tabular-nums">
                {{ p.best_clean_jerk_kg ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center tabular-nums font-medium">
                {{ p.total_kg ?? '—' }}
              </td>
              <td class="px-4 py-3 text-center">
                <UBadge
                  v-if="p.is_active !== false"
                  color="success"
                  variant="subtle"
                >
                  Tak
                </UBadge>
                <UBadge
                  v-else
                  color="neutral"
                  variant="subtle"
                >
                  Nie
                </UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton
                    icon="i-lucide-pencil"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="openEdit(p)"
                  />
                  <UButton
                    v-if="canDeleteAthlete"
                    icon="i-lucide-trash-2"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="askDelete(p)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!loading && players.length === 0"
          class="px-4 py-10 text-center text-muted"
        >
          Brak zawodników — dodaj pierwszego rekord.
        </div>
      </div>
    </UCard>

    <SlaviaModal
      v-model:open="modalOpen"
      :title="editingId ? 'Edycja zawodnika' : 'Nowy zawodnik'"
      :ui="{
        content: 'rounded-3xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl'
      }"
    >
      <template #body="{ close }">
        <div class="slavia-form-modal slavia-form-modal--umodal-body">
          <form
            class="slavia-form-stack"
            @submit.prevent="savePlayer"
          >
            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-user"
                      class="size-4"
                    />
                  </span>
                  Dane podstawowe
                </div>
              </div>
              <div class="slavia-form-panel__body">
                <UFormField
                  label="Nazwisko i imię"
                  required
                >
                  <UInput
                    v-model="form.full_name"
                    autocomplete="name"
                    placeholder="np. Kowalski Jan"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
                <div class="grid gap-5 md:grid-cols-2">
                  <UFormField
                    label="Płeć"
                    required
                  >
                    <select
                      v-model="form.gender"
                      class="slavia-select w-full py-3 text-[15px]"
                    >
                      <option value="male">
                        Mężczyzna
                      </option>
                      <option value="female">
                        Kobieta
                      </option>
                    </select>
                  </UFormField>
                  <UFormField label="Zdjęcie (URL lub wgrywanie)">
                    <div class="flex flex-wrap items-center gap-2">
                      <UInput
                        v-model="form.image_url"
                        placeholder="https://..."
                        size="lg"
                        class="min-w-0 flex-1"
                      />
                      <UButton
                        icon="i-lucide-upload"
                        color="neutral"
                        variant="soft"
                        size="lg"
                        :loading="uploadLoading"
                        @click="clickFileInput"
                      />
                      <input
                        ref="fileInputRef"
                        type="file"
                        hidden
                        accept="image/*"
                        @change="onFileChange"
                      >
                    </div>
                  </UFormField>
                </div>
              </div>
            </div>

            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-dumbbell"
                      class="size-4"
                    />
                  </span>
                  Parametry sportowe
                </div>
                <p class="slavia-form-panel__desc">
                  Rok urodzenia jako cztery cyfry — bez przecinka ani spacji.
                </p>
              </div>
              <div class="slavia-form-panel__body">
                <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <UFormField label="Rok urodzenia">
                    <UInput
                      :model-value="form.birth_year === null || form.birth_year === undefined ? '' : String(form.birth_year)"
                      type="number"
                      inputmode="numeric"
                      size="lg"
                      class="w-full tabular-nums"
                      :min="1950"
                      :max="currentYear"
                      placeholder="np. 2010"
                      @update:model-value="setBirthYear"
                    />
                  </UFormField>
                  <UFormField
                    label="Grupa wiekowa (PZPC)"
                    description="Lista klas wagowych zależy od grupy i płci."
                  >
                    <USelect
                      v-model="form.pzpc_age_group"
                      value-key="value"
                      :items="pzpcAgeSelectItems"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField
                    label="Kategoria wagowa (startowa)"
                    description="Z aktualnych widełek PZPC dla wybranej grupy."
                  >
                    <USelect
                      v-model="form.pzpc_weight_class"
                      value-key="value"
                      :items="[{ label: '— wybierz —', value: '' }, ...pzpcWeightSelectItems]"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField
                    label="Aktualna masa ciała (kg)"
                    description="Rzeczywisty pomiar, nie limit kategorii."
                  >
                    <UInputNumber
                      v-model="form.bodyweight"
                      :min="0"
                      :max="300"
                      :step="0.1"
                      placeholder="np. 72.5"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <p
                  v-if="legacyWeightCategoryHint"
                  class="text-xs leading-snug text-amber-700 dark:text-amber-400"
                >
                  {{ legacyWeightCategoryHint }}
                </p>
                <div class="grid gap-5 md:grid-cols-3">
                  <UFormField label="Rwanie (kg)">
                    <UInputNumber
                      v-model="form.best_snatch_kg"
                      :min="0"
                      placeholder="—"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Podrzut (kg)">
                    <UInputNumber
                      v-model="form.best_clean_jerk_kg"
                      :min="0"
                      placeholder="—"
                      size="lg"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Suma (kg)">
                    <UInputNumber
                      v-model="form.total_kg"
                      :min="0"
                      placeholder="—"
                      size="lg"
                      class="w-full"
                      disabled
                    />
                  </UFormField>
                </div>
              </div>
            </div>

            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-key-round"
                      class="size-4"
                    />
                  </span>
                  Konto i dostęp
                </div>
              </div>
              <div class="slavia-form-panel__body space-y-5">
                <div
                  v-if="editingId && canManageAthleteLogin && expReverseLink"
                  class="rounded-xl border border-default/70 bg-muted/10 p-4 dark:bg-muted/5"
                >
                  <p class="text-sm font-bold text-highlighted">
                    Powiązane konto zawodnika
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    Wybierz istniejące konto z rolą „Athlete” i przypisz do tego profilu.
                  </p>

                  <div class="mt-4 grid gap-4 md:grid-cols-2">
                    <UFormField label="Konto (Athlete)">
                      <USelect
                        v-model="athleteAccountSelected"
                        :items="athleteAccountOptions"
                        value-key="value"
                        size="lg"
                        class="w-full"
                      />
                    </UFormField>
                    <div class="flex items-end gap-2">
                      <UButton
                        color="primary"
                        size="lg"
                        class="rounded-xl font-bold"
                        :loading="athleteAccountSaving"
                        @click="attachExistingAccountToAthlete"
                      >
                        Przypisz konto
                      </UButton>
                      <UButton
                        v-if="editingPlayer?.user_id"
                        color="neutral"
                        variant="outline"
                        size="lg"
                        class="rounded-xl font-bold"
                        :loading="athleteAccountSaving"
                        @click="detachAccountFromAthlete"
                      >
                        Odłącz
                      </UButton>
                    </div>
                  </div>
                  <p v-if="editingPlayer?.user_id" class="mt-3 text-[11px] text-muted">
                    Aktualnie przypięte konto: <span class="font-mono">{{ linkedAthleteAccountUsername }}</span>
                  </p>
                </div>

                <div v-if="!editingId || !editingPlayer?.user_id">
                  <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default/60 bg-muted/20 px-4 py-3 dark:bg-muted/10">
                    <div>
                      <p class="text-sm font-bold text-highlighted">
                        {{ canManageAthleteLogin ? 'Utwórz konto logowania' : 'Prośba o konto u administratora' }}
                      </p>
                      <p class="text-xs text-muted">
                        <template v-if="canManageAthleteLogin">
                          Zawodnik zaloguje się do panelu i edytuje swój profil.
                        </template>
                        <template v-else>
                          Jako trener nie tworzysz konta — zaznacz i podaj proponowany login; administrator lub superadministrator dostanie powiadomienie i utworzy dostęp.
                        </template>
                      </p>
                    </div>
                    <USwitch v-model="form.create_account" />
                  </div>
                  <div
                    v-if="form.create_account"
                    class="mt-5 slavia-form-grid grid-cols-1 sm:grid-cols-2"
                  >
                    <UFormField
                      label="Login"
                      required
                    >
                      <UInput
                        v-model="form.username"
                        placeholder="np. login"
                        size="lg"
                        class="w-full"
                      />
                    </UFormField>
                    <UFormField
                      v-if="canManageAthleteLogin"
                      label="Hasło (opcjonalnie)"
                    >
                      <UInput
                        v-model="form.password"
                        type="password"
                        placeholder="Domyślnie: Slavia2026"
                        size="lg"
                        class="w-full"
                      />
                    </UFormField>
                    <UFormField
                      v-else
                      label="Hasło"
                      description="Po akceptacji prośby ustawi je administrator."
                    >
                      <UInput
                        disabled
                        placeholder="—"
                        size="lg"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </div>
                <div
                  v-else
                  class="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3"
                >
                  <UIcon
                    name="i-lucide-user-check"
                    class="size-5 shrink-0 text-primary"
                  />
                  <div>
                    <p class="text-sm font-bold text-primary">
                      Konto powiązane
                    </p>
                    <p class="text-xs text-muted">
                      Ten zawodnik ma już konto w systemie.
                    </p>
                  </div>
                </div>

                <template v-if="editingId">
                  <div class="rounded-xl border border-default/70 bg-muted/10 p-4 dark:bg-muted/5">
                    <p class="text-sm font-bold text-highlighted">
                      Przypisania do zawodów
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      Zaznaczone pozycje trafiają do osobistego kalendarza zawodnika.
                    </p>
                    <div
                      v-if="assignmentsLoading"
                      class="mt-4 flex items-center gap-2 text-sm text-muted"
                    >
                      <UIcon
                        name="i-lucide-loader-2"
                        class="size-4 animate-spin shrink-0"
                      />
                      Wczytywanie…
                    </div>
                    <div
                      v-else-if="!competitionsCatalog.length"
                      class="mt-3 text-xs text-muted"
                    >
                      Brak wpisów w kalendarzu — dodaj wydarzenie w zakładce Kalendarz.
                    </div>
                    <div
                      v-else
                      class="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1"
                    >
                      <label
                        v-for="c in competitionsCatalog"
                        :key="c.id"
                        class="flex cursor-pointer items-start gap-3 rounded-lg border border-default/60 bg-background/80 px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-primary/5"
                      >
                        <input
                          v-model="assignedCompetitionIds"
                          type="checkbox"
                          :value="c.id"
                          class="mt-1 size-4 rounded border-default text-primary focus:ring-primary/40"
                        >
                        <span class="text-sm leading-snug">
                          <span class="font-semibold text-highlighted">{{ c.title }}</span>
                          <span class="block text-xs text-muted tabular-nums">{{ (c.date || '').slice(0, 10) }} · {{ c.location }}</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-globe"
                      class="size-4"
                    />
                  </span>
                  Profil publiczny
                </div>
                <p class="slavia-form-panel__desc">
                  Widoczne na stronie „Zawodnicy” i na publicznym profilu pod adresem /athlete/…
                </p>
              </div>
              <div class="slavia-form-panel__body space-y-5">
                <UFormField
                  label="Slogan / krótki podtytuł"
                  hint="Np. rola w klubie, kategoria wiekowa."
                >
                  <UInput
                    v-model="form.profile_tagline"
                    placeholder="np. Junior · waga 75 kg"
                    size="lg"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Rozbudowany opis (bio)"
                  hint="To jest główny tekst na publicznym profilu zawodnika."
                >
                  <UTextarea
                    v-model="form.public_bio"
                    :rows="5"
                    autoresize
                    placeholder="Osiągnięcia, styl startów, cele…"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <div class="slavia-form-panel">
              <div class="slavia-form-panel__header">
                <div class="slavia-form-panel__title">
                  <span class="slavia-form-panel__icon">
                    <UIcon
                      name="i-lucide-sticky-note"
                      class="size-4"
                    />
                  </span>
                  Notatki i status
                </div>
              </div>
              <div class="slavia-form-panel__body">
                <UFormField label="Notatki wewnętrzne">
                  <UTextarea
                    v-model="form.notes"
                    :rows="3"
                    autoresize
                    placeholder="Tylko dla kadry — nie pokazujemy na publicznym profilu."
                    class="w-full"
                  />
                </UFormField>
                <div class="flex flex-col gap-4 border-t border-default/60 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div class="flex items-center gap-3">
                      <USwitch v-model="form.is_active" />
                      <span class="text-sm font-semibold text-highlighted">Aktywny w kadrze</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <USwitch v-model="form.has_standing_order" />
                      <div class="flex flex-col">
                        <span class="flex items-center gap-1.5 text-sm font-semibold text-highlighted">
                          <UIcon name="i-lucide-repeat" class="size-3.5 text-success" />
                          Przelew stały (auto-składka)
                        </span>
                        <span class="text-[11px] text-muted">
                          Co miesiąc system sam zaznacza składkę jako opłaconą.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="slavia-form-actions w-full sm:w-auto">
                    <UButton
                      type="button"
                      color="neutral"
                      variant="outline"
                      size="lg"
                      @click="() => { close(); closeEditModal() }"
                    >
                      Anuluj
                    </UButton>
                    <UButton
                      type="submit"
                      size="lg"
                      :loading="saving"
                    >
                      Zapisz
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </template>
    </SlaviaModal>

    <SlaviaModal
      v-model:open="deleteModalOpen"
      title="Usunąć zawodnika?"
      description="Tej operacji nie cofniesz."
    >
      <template #body="{ close }">
        <div class="slavia-form-modal slavia-form-modal--umodal-body">
          <p
            v-if="pendingDelete"
            class="text-muted leading-relaxed"
          >
            Czy na pewno usunąć „{{ pendingDelete.full_name }}”?
          </p>
          <div class="slavia-form-actions border-t border-default/60 pt-4">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              @click="() => { close(); cancelDelete() }"
            >
              Wróć
            </UButton>
            <UButton
              color="error"
              size="lg"
              :loading="deleting"
              @click="confirmDelete"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>
  </div>
</template>

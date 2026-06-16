import { apiRoutes, urlAdminPlayer } from '~/config/api'
import {
  formatPzpcWeightCategory,
  parsePzpcWeightCategoryStored,
  PZPC_AGE_GROUPS,
  pzpcWeightClassLabels,
  type PzpcAgeGroupId
} from '~/data/pzpcWeightCategories'
import type { GroupedAdminAccounts, Player, UserRole } from '~/types/models'
import { useFormFieldScrollRestore } from '~/composables/useFormFieldScrollRestore'
import { useFormDirtyGuard } from '~/composables/useFormDirtyGuard'
import { buildUploadFormData } from '~/utils/uploadFormData'

export type PlayersEditorTab = 'profile' | 'sport' | 'account' | 'public' | 'status'

export const PLAYERS_EDITOR_TABS = [
  { id: 'profile' as const, label: 'Profil', icon: 'i-lucide-user' },
  { id: 'sport' as const, label: 'Sport', icon: 'i-lucide-dumbbell' },
  { id: 'account' as const, label: 'Konto', icon: 'i-lucide-key-round' },
  { id: 'public' as const, label: 'Publiczny', icon: 'i-lucide-globe' },
  { id: 'status' as const, label: 'Status', icon: 'i-lucide-sliders-horizontal' }
]

export function createEmptyPlayerForm() {
  return {
    full_name: '',
    birth_year: null as number | null,
    gender: 'male',
    pzpc_age_group: 'Senior' as PzpcAgeGroupId,
    pzpc_weight_class: '',
    bodyweight: null as number | null,
    best_snatch_kg: null as number | null,
    best_clean_jerk_kg: null as number | null,
    total_kg: null as number | null,
    image_url: undefined as string | undefined,
    notes: undefined as string | undefined,
    profile_tagline: undefined as string | undefined,
    public_bio: undefined as string | undefined,
    is_active: true,
    has_standing_order: false,
    create_account: false,
    username: '',
    password: ''
  }
}

export function usePlayersManagerEditor(options: {
  players: Ref<Player[]>
  loadPlayers: () => Promise<void>
}) {
  const api = useApi()
  const formScroll = useFormFieldScrollRestore('players-manager-sheet')
  const toast = useToast()
  const auth = useAuth()
  const expReverseLink = useExperimentalFlag('athlete_reverse_account_linking')
  const route = useRoute()
  const router = useRouter()

  const canManageAthleteLogin = computed(() => auth.isAdmin.value)
  const canDeleteAthlete = computed(() => auth.isAdmin.value)

  const modalOpen = ref(false)
  const deleteModalOpen = ref(false)
  const editorTab = ref<PlayersEditorTab>('profile')
  const activeEditorTab = computed(() => editorTab.value)
  const pendingDelete = ref<Player | null>(null)
  const saving = ref(false)
  const deleting = ref(false)
  const editingId = ref<string | null>(null)
  const fileInputRef = ref<HTMLInputElement>()
  const form = reactive(createEmptyPlayerForm())
  const standingOrderInitial = ref(false)
  const uploadLoading = ref(false)
  const legacyWeightCategoryRaw = ref('')
  const athleteAccountOptions = ref<{ label: string, value: string }[]>([])
  const athleteAccountSelected = ref<string>('')
  const athleteAccountSaving = ref(false)
  const athleteAccountUsernameById = ref<Record<string, string>>({})

  const pzpcAgeSelectItems = PZPC_AGE_GROUPS.map(x => ({ label: x.label, value: x.id }))
  const genderSelectItems = [
    { label: 'Mężczyzna', value: 'male' },
    { label: 'Kobieta', value: 'female' }
  ]
  const currentYear = new Date().getFullYear()

  const editingPlayer = computed(() =>
    editingId.value ? options.players.value.find(p => p.id === editingId.value) ?? null : null
  )

  const dirtyGuard = useFormDirtyGuard(() => ({
    form: { ...form },
    athleteAccountSelected: athleteAccountSelected.value
  }))

  function closeEditModal() {
    if (!dirtyGuard.confirmDiscard()) return
    modalOpen.value = false
    dirtyGuard.resetBaseline()
  }

  function scrollEditorSheetBodyTop() {
    if (!import.meta.client) return
    document
      .querySelector('[data-slavia-editor-sheet="open"] .slavia-editor-sheet__body')
      ?.scrollTo({ top: 0 })
  }

  function setEditorTab(tab: PlayersEditorTab) {
    if (editorTab.value === tab) return
    if (import.meta.client) {
      (document.activeElement as HTMLElement | null)?.blur()
    }
    editorTab.value = tab
  }

  watch(editorTab, () => {
    nextTick(scrollEditorSheetBodyTop)
  })

  function setOptionalNumber(
    field: 'bodyweight' | 'best_snatch_kg' | 'best_clean_jerk_kg' | 'total_kg',
    v: string | number | null | undefined
  ) {
    if (v === null || v === undefined || v === '') {
      form[field] = null
      return
    }
    const n = typeof v === 'number' ? v : Number.parseFloat(String(v).replace(',', '.'))
    form[field] = Number.isFinite(n) ? n : null
  }

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
    return `W bazie jest wpis „${raw}". Wybierz kategorię z listy PZPC — przy zapisie bez wyboru pozostawimy ten tekst.`
  })

  watch(
    () => [form.pzpc_age_group, form.gender] as const,
    () => {
      const ok = pzpcWeightSelectItems.value.some(i => i.value === form.pzpc_weight_class)
      if (!ok) form.pzpc_weight_class = ''
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

  async function refreshAthleteAccountCatalog() {
    if (!canManageAthleteLogin.value) {
      athleteAccountOptions.value = [{ label: '— tylko Admin/SuperAdmin —', value: '' }]
      athleteAccountUsernameById.value = {}
      return
    }
    try {
      const data = await api<GroupedAdminAccounts>(apiRoutes.superadmin.adminsGrouped)
      const all = [...(data.admins ?? []), ...(data.trainers ?? []), ...(data.athletes ?? [])]
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
      await options.loadPlayers()
    } catch (e) {
      toast.add({ title: 'Nie udało się przypisać konta', description: getApiErrorMessage(e), color: 'error' })
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
      await options.loadPlayers()
    } catch (e) {
      toast.add({ title: 'Nie udało się odłączyć konta', description: getApiErrorMessage(e), color: 'error' })
    } finally {
      athleteAccountSaving.value = false
    }
  }

  watch(modalOpen, async (open) => {
    if (!open) return
    editorTab.value = 'profile'
    nextTick(scrollEditorSheetBodyTop)
    if (editingId.value) {
      void refreshAthleteAccountCatalog()
    } else {
      athleteAccountSelected.value = ''
    }
    nextTick(() => dirtyGuard.captureBaseline())
  })

  function resetForm() {
    editingId.value = null
    legacyWeightCategoryRaw.value = ''
    Object.assign(form, createEmptyPlayerForm())
    standingOrderInitial.value = false
    athleteAccountSelected.value = ''
    dirtyGuard.resetBaseline()
  }

  watch(() => [form.best_snatch_kg, form.best_clean_jerk_kg], ([snatch, cj]) => {
    form.total_kg = (snatch || 0) + (cj || 0)
  })

  function setBirthYear(v: string | number | null | undefined) {
    if (v === null || v === undefined) {
      form.birth_year = null
      return
    }
    const s = String(v).trim().replace(/\u00a0/g, ' ').replace(/\s/g, '').replace(/,/g, '')
    if (s === '') {
      form.birth_year = null
      return
    }
    const n = Number.parseInt(s, 10)
    form.birth_year = Number.isFinite(n) ? n : null
  }

  function tryOpenEditFromQuery() {
    const raw = route.query.edit
    const editId = typeof raw === 'string' ? raw.trim() : ''
    if (!editId) return
    const p = options.players.value.find(x => x.id === editId)
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
      const res = await api<{ url: string }>(apiRoutes.upload, { method: 'POST', body: formData })
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

      modalOpen.value = false
      dirtyGuard.resetBaseline()
      resetForm()
      await options.loadPlayers()
    } catch (e) {
      toast.add({ title: 'Operacja nie powiodła się', description: getApiErrorMessage(e), color: 'error' })
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
      await options.loadPlayers()
    } catch (e) {
      toast.add({ title: 'Nie udało się usunąć', description: getApiErrorMessage(e), color: 'error' })
    } finally {
      deleting.value = false
    }
  }

  return {
    expReverseLink,
    canManageAthleteLogin,
    canDeleteAthlete,
    modalOpen,
    deleteModalOpen,
    editorTab,
    activeEditorTab,
    editorTabs: PLAYERS_EDITOR_TABS,
    pendingDelete,
    saving,
    deleting,
    editingId,
    fileInputRef,
    form,
    uploadLoading,
    pzpcAgeSelectItems,
    genderSelectItems,
    pzpcWeightSelectItems,
    legacyWeightCategoryHint,
    currentYear,
    athleteAccountOptions,
    athleteAccountSelected,
    athleteAccountSaving,
    editingPlayer,
    linkedAthleteAccountUsername,
    isDirty: dirtyGuard.isDirty,
    closeEditModal,
    setEditorTab,
    setOptionalNumber,
    setBirthYear,
    openCreate,
    openEdit,
    clickFileInput,
    onFileChange,
    attachExistingAccountToAthlete,
    detachAccountFromAthlete,
    savePlayer,
    askDelete,
    cancelDelete,
    confirmDelete,
    tryOpenEditFromQuery
  }
}

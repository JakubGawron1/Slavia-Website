import { BOARD_DOCUMENT_CATEGORY_LABELS } from '~/data/boardDocumentCatalog'
import type { BoardDocumentCategoryId, BoardDocumentTypeDefinition } from '~/types/boardDocuments'

export function useBoardDocumentTypeEditorPage() {
  const auth = useAuth()
  const toast = useToast()
  const { allTypes, customTypes, pending, error, source, loadCustomTypes, addCustomType } =
    useBoardDocumentTypes()

  const categoryFilter = ref<BoardDocumentCategoryId | 'all'>('all')
  const searchQuery = ref('')
  const newTypeLabel = ref('')
  const newTypeCategory = ref('')
  const saving = ref(false)

  const canManageCustom = computed(() => auth.isBoardDocsFullAccess.value)

  const groupedBuiltin = computed(() => {
    const groups = new Map<BoardDocumentCategoryId, BoardDocumentTypeDefinition[]>()
    for (const type of allTypes.value.filter(t => t.builtin)) {
      const list = groups.get(type.category) ?? []
      list.push(type)
      groups.set(type.category, list)
    }
    return [...groups.entries()]
      .filter(([cat]) => categoryFilter.value === 'all' || cat === categoryFilter.value)
      .map(([category, types]) => ({
        category,
        label: BOARD_DOCUMENT_CATEGORY_LABELS[category],
        types: types
          .filter(t => {
            const q = searchQuery.value.trim().toLowerCase()
            if (!q) return true
            return `${t.label} ${t.id} ${t.description ?? ''}`.toLowerCase().includes(q)
          })
          .sort((a, b) => a.label.localeCompare(b.label, 'pl'))
      }))
      .filter(g => g.types.length > 0)
  })

  const filteredCustom = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return customTypes.value.filter(t => {
      if (!q) return true
      return `${t.label} ${t.id} ${t.category ?? ''}`.toLowerCase().includes(q)
    })
  })

  const categoryFilterOptions = computed(() => [
    { label: 'Wszystkie kategorie', value: 'all' },
    ...Object.entries(BOARD_DOCUMENT_CATEGORY_LABELS)
      .filter(([id]) => id !== 'custom')
      .map(([value, label]) => ({ label, value }))
  ])

  async function submitCustomType() {
    const label = newTypeLabel.value.trim()
    if (!label) {
      toast.add({ title: 'Podaj nazwę typu', color: 'warning' })
      return
    }
    saving.value = true
    try {
      await addCustomType(label, newTypeCategory.value.trim() || undefined)
      newTypeLabel.value = ''
      newTypeCategory.value = ''
      toast.add({ title: 'Dodano typ własny', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Nie udało się dodać typu',
        description: e instanceof Error ? e.message : undefined,
        color: 'error'
      })
    } finally {
      saving.value = false
    }
  }

  async function refresh() {
    await loadCustomTypes()
  }

  return {
    allTypes,
    customTypes,
    groupedBuiltin,
    filteredCustom,
    categoryFilter,
    searchQuery,
    newTypeLabel,
    newTypeCategory,
    categoryFilterOptions,
    pending,
    error,
    source,
    saving,
    canManageCustom,
    refresh,
    submitCustomType
  }
}

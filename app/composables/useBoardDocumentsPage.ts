import {
  BOARD_DOCUMENT_CATEGORY_LABELS,
  boardDocumentCategoryForType,
  boardDocumentTypeLabel
} from '~/data/boardDocumentCatalog'
import type { BoardDocumentCategoryId, BoardDocumentEntry } from '~/types/boardDocuments'

export type BoardDocumentsListFilters = {
  query: string
  category: BoardDocumentCategoryId | 'all'
  docType: string | 'all'
  folder: string | 'all'
}

export function useBoardDocumentsPage() {
  const {
    documents,
    pending,
    error,
    backendUnavailable,
    boardStatus,
    fetchManifest,
    fetchBoardStatus
  } = useBoardDocuments()
  const { allTypes, loadCustomTypes } = useBoardDocumentTypes()

  const filters = reactive<BoardDocumentsListFilters>({
    query: '',
    category: 'all',
    docType: 'all',
    folder: 'all'
  })

  const folderOptions = computed(() => {
    const folders = new Set<string>()
    for (const doc of documents.value) {
      if (doc.folder?.trim()) folders.add(doc.folder.trim())
    }
    return [...folders].sort((a, b) => a.localeCompare(b, 'pl'))
  })

  const filteredDocuments = computed(() => {
    const q = filters.query.trim().toLowerCase()
    return documents.value
      .filter((doc: BoardDocumentEntry) => {
        if (filters.category !== 'all') {
          const cat = boardDocumentCategoryForType(doc.doc_type)
          if (cat !== filters.category) return false
        }
        if (filters.docType !== 'all' && doc.doc_type !== filters.docType) return false
        if (filters.folder !== 'all' && doc.folder !== filters.folder) return false
        if (!q) return true
        const hay = [doc.title, doc.doc_type, doc.folder, doc.mime_type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => {
        const da = a.updated_at ?? a.created_at ?? ''
        const db = b.updated_at ?? b.created_at ?? ''
        return db.localeCompare(da)
      })
  })

  const recentDocuments = computed(() => filteredDocuments.value.slice(0, 5))

  const categoryOptions = computed(() => [
    { label: 'Wszystkie kategorie', value: 'all' },
    ...Object.entries(BOARD_DOCUMENT_CATEGORY_LABELS)
      .filter(([id]) => id !== 'custom')
      .map(([value, label]) => ({ label, value }))
  ])

  const docTypeOptions = computed(() => [
    { label: 'Wszystkie typy', value: 'all' },
    ...allTypes.value.map(t => ({ label: t.label, value: t.id }))
  ])

  const folderFilterOptions = computed(() => [
    { label: 'Wszystkie foldery', value: 'all' },
    ...folderOptions.value.map(f => ({ label: f, value: f }))
  ])

  function docTypeLabel(typeId: string | null | undefined) {
    return boardDocumentTypeLabel(typeId)
  }

  function resetFilters() {
    filters.query = ''
    filters.category = 'all'
    filters.docType = 'all'
    filters.folder = 'all'
  }

  async function refresh() {
    await Promise.all([fetchManifest(), fetchBoardStatus().catch(() => null), loadCustomTypes()])
  }

  return {
    documents,
    filteredDocuments,
    recentDocuments,
    filters,
    folderOptions,
    categoryOptions,
    docTypeOptions,
    folderFilterOptions,
    pending,
    error,
    backendUnavailable,
    boardStatus,
    docTypeLabel,
    resetFilters,
    refresh
  }
}

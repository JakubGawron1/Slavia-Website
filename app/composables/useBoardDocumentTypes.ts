import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import {
  BUILTIN_BOARD_DOCUMENT_TYPES,
  BUILTIN_BOARD_DOCUMENT_TYPE_MAP
} from '~/data/boardDocumentCatalog'
import type {
  BoardCustomDocumentType,
  BoardDocumentManifest,
  BoardDocumentTypeDefinition
} from '~/types/boardDocuments'

const CUSTOM_TYPES_CACHE_KEY = 'slavia-board-custom-document-types-cache'

function readCachedCustomTypes(): BoardCustomDocumentType[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(CUSTOM_TYPES_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BoardCustomDocumentType[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCachedCustomTypes(types: BoardCustomDocumentType[]) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(CUSTOM_TYPES_CACHE_KEY, JSON.stringify(types))
  } catch {
    /* ignore */
  }
}

function customToDefinition(custom: BoardCustomDocumentType): BoardDocumentTypeDefinition {
  return {
    id: custom.id,
    label: custom.label,
    domain: 'administration',
    category: 'custom',
    folder: custom.category?.trim() || 'archive',
    defaultExtension: 'csv',
    builtin: false,
    generatorKind: null,
    description: 'Typ własny zarządu'
  }
}

export type BoardDocumentTypesSource = 'api' | 'cache' | 'empty'

export function useBoardDocumentTypes() {
  const api = useApi()
  const auth = useAuth()

  const customTypes = ref<BoardCustomDocumentType[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const source = ref<BoardDocumentTypesSource>('empty')

  const allTypes = computed<BoardDocumentTypeDefinition[]>(() => {
    const customDefs = customTypes.value.map(customToDefinition)
    const builtinIds = new Set(BUILTIN_BOARD_DOCUMENT_TYPES.map(t => t.id))
    const uniqueCustom = customDefs.filter(t => !builtinIds.has(t.id))
    return [...BUILTIN_BOARD_DOCUMENT_TYPES, ...uniqueCustom]
  })

  const typeMap = computed(() => new Map(allTypes.value.map(t => [t.id, t])))

  function getType(id: string | null | undefined): BoardDocumentTypeDefinition | undefined {
    if (!id) return undefined
    return typeMap.value.get(id) ?? BUILTIN_BOARD_DOCUMENT_TYPE_MAP.get(id)
  }

  function applyCustomTypes(fromApi: BoardCustomDocumentType[], origin: BoardDocumentTypesSource) {
    customTypes.value = fromApi
    source.value = origin
    if (origin === 'api') {
      writeCachedCustomTypes(fromApi)
    }
  }

  async function loadCustomTypes() {
    pending.value = true
    error.value = null
    try {
      const manifest = await api<BoardDocumentManifest>(apiRoutes.boardDocuments.documents)
      const fromManifest = Array.isArray(manifest?.custom_types) ? manifest.custom_types : []
      applyCustomTypes(fromManifest, 'api')
      return customTypes.value
    } catch (e) {
      const cached = readCachedCustomTypes()
      if (cached.length) {
        applyCustomTypes(cached, 'cache')
      } else {
        customTypes.value = []
        source.value = 'empty'
      }
      error.value = getApiErrorMessage(e)
      return customTypes.value
    } finally {
      pending.value = false
    }
  }

  async function addCustomType(label: string, category?: string) {
    const id = `custom_${label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')}`

    const entry: BoardCustomDocumentType = { id, label, category: category ?? null }

    if (!auth.isBoardDocsFullAccess.value) {
      throw new Error('Dodawanie typów wymaga pełnego dostępu zarządu.')
    }

    const saved = await api<BoardCustomDocumentType>(apiRoutes.boardDocuments.documentTypes, {
      method: 'POST',
      body: entry
    })
    customTypes.value = [...customTypes.value.filter(t => t.id !== saved.id), saved]
    source.value = 'api'
    writeCachedCustomTypes(customTypes.value)
    return saved
  }

  return {
    customTypes,
    allTypes,
    typeMap,
    pending,
    error,
    source,
    getType,
    loadCustomTypes,
    addCustomType
  }
}

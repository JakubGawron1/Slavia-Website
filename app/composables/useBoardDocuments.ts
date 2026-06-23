import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type {
  BoardDocumentEntry,
  BoardDocumentManifest,
  BoardDocumentPreviewMeta,
  BoardDocsStatus,
  DeleteBoardDocumentRequest,
  GenerateBoardDocumentRequest,
  GenerateBoardDocumentResponse,
  SaveBoardDocumentRequest
} from '~/types/boardDocuments'

export type {
  BoardDocumentEntry,
  BoardDocumentManifest,
  BoardDocumentPreviewMeta,
  BoardDocumentVersion,
  BoardDocsStatus,
  GenerateBoardDocumentRequest,
  GenerateBoardDocumentResponse,
  SaveBoardDocumentRequest
} from '~/types/boardDocuments'

export function useBoardDocuments() {
  const api = useApi()
  const auth = useAuth()

  const manifest = ref<BoardDocumentManifest | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)
  const boardStatus = ref<BoardDocsStatus | null>(null)

  const documents = computed(() => manifest.value?.documents ?? [])
  const backendUnavailable = computed(() => Boolean(error.value))

  async function fetchManifest() {
    pending.value = true
    error.value = null
    try {
      const res = await api<BoardDocumentManifest>(apiRoutes.boardDocuments.documents)
      manifest.value = {
        documents: Array.isArray(res?.documents) ? res.documents : [],
        updated_at: res?.updated_at ?? null,
        custom_types: Array.isArray(res?.custom_types) ? res.custom_types : []
      }
      return manifest.value
    } catch (e) {
      manifest.value = null
      error.value = getApiErrorMessage(e)
      return null
    } finally {
      pending.value = false
    }
  }

  async function fetchBoardStatus() {
    try {
      boardStatus.value = await api<BoardDocsStatus>(apiRoutes.boardDocuments.boardDocsStatus)
      return boardStatus.value
    } catch (e) {
      boardStatus.value = null
      throw e
    }
  }

  async function fetchDocument(id: string) {
    return api<BoardDocumentEntry>(apiRoutes.boardDocuments.document(id))
  }

  async function fetchContent(id: string) {
    return api<string>(apiRoutes.boardDocuments.documentContent(id), {
      responseType: 'text',
      headers: { Accept: 'text/plain, text/html, text/csv, application/json, */*' }
    })
  }

  async function getPreviewMeta(id: string) {
    return api<BoardDocumentPreviewMeta>(apiRoutes.boardDocuments.documentPreview(id))
  }

  async function saveContent(id: string, content: string) {
    if (!auth.isBoardDocsFullAccess.value) {
      throw new Error('Brak uprawnień do zapisu dokumentów zarządu.')
    }
    return api(apiRoutes.boardDocuments.documentContent(id), {
      method: 'PATCH',
      body: { content }
    })
  }

  async function generateDocument(body: GenerateBoardDocumentRequest) {
    return api<GenerateBoardDocumentResponse>(apiRoutes.boardDocuments.generate, {
      method: 'POST',
      body
    })
  }

  async function saveDocument(body: SaveBoardDocumentRequest) {
    if (!auth.isBoardDocsFullAccess.value) {
      throw new Error('Brak uprawnień do zapisu dokumentów zarządu.')
    }
    return api<BoardDocumentEntry>(apiRoutes.boardDocuments.save, {
      method: 'POST',
      body
    })
  }

  async function deleteDocument(body: DeleteBoardDocumentRequest) {
    if (!auth.isBoardDocsFullAccess.value) {
      throw new Error('Brak uprawnień do usuwania dokumentów zarządu.')
    }
    return api(apiRoutes.boardDocuments.delete, {
      method: 'POST',
      body
    })
  }

  return {
    manifest,
    documents,
    boardStatus,
    pending,
    error,
    backendUnavailable,
    fetchManifest,
    fetchBoardStatus,
    fetchDocument,
    fetchContent,
    getPreviewMeta,
    saveContent,
    generateDocument,
    saveDocument,
    deleteDocument
  }
}

import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

export type BoardDocumentVersion = {
  version_no: number
  created_at: string
  created_by?: string | null
  edit_source?: 'native' | 'iframe' | 'upload' | 'generator' | null
  generator_params?: Record<string, unknown> | null
}

export type BoardDocumentEntry = {
  id: string
  title: string
  doc_type?: string | null
  folder?: string | null
  mime_type?: string | null
  updated_at?: string | null
  versions?: BoardDocumentVersion[]
}

export type BoardDocumentManifest = {
  documents: BoardDocumentEntry[]
}

export type BoardDocumentPreviewMeta = {
  mime_type: string
  edit_mode: 'native' | 'iframe' | 'download_only'
  iframe_url?: string | null
}

export function useBoardDocuments() {
  const api = useApi()
  const auth = useAuth()

  const manifest = ref<BoardDocumentManifest | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  const documents = computed(() => manifest.value?.documents ?? [])
  const backendUnavailable = computed(() => Boolean(error.value))

  async function fetchManifest() {
    pending.value = true
    error.value = null
    try {
      const res = await api<BoardDocumentManifest>(apiRoutes.boardDocuments.documents)
      manifest.value = {
        documents: Array.isArray(res?.documents) ? res.documents : []
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

  async function fetchDocument(id: string) {
    return api<BoardDocumentEntry>(apiRoutes.boardDocuments.document(id))
  }

  async function fetchContent(id: string) {
    return api<string>(apiRoutes.boardDocuments.documentContent(id))
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

  return {
    manifest,
    documents,
    pending,
    error,
    backendUnavailable,
    fetchManifest,
    fetchDocument,
    fetchContent,
    getPreviewMeta,
    saveContent
  }
}

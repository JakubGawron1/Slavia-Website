import { apiRoutes } from '~/config/api'
import { buildBoardDocumentSkeleton, mimeFromExtension } from '~/data/boardDocumentSkeletons'
import { findBuiltinBoardDocumentType } from '~/data/boardDocumentCatalog'
import { getApiErrorMessage } from '~/composables/useApi'
import type { BoardDocumentEntry, BoardDocumentTypeDefinition } from '~/types/boardDocuments'

export type BoardPreviewSource = 'document' | 'repo_template' | 'embed_template' | 'skeleton'

export type BoardPreviewPayload = {
  title: string
  content: string
  mimeType: string
  source: BoardPreviewSource
  blobUrl?: string | null
  pdfFields?: string[]
  documentId?: string
  docType?: string | null
}

export function useBoardDocumentPreview() {
  const api = useApi()
  const { fetchContent, getPreviewMeta } = useBoardDocuments()

  const pending = ref(false)
  const error = ref<string | null>(null)

  function revokeBlob(url: string | null | undefined) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  async function fetchTemplateFromRepo(docType: string): Promise<{ content: string, source: BoardPreviewSource } | null> {
    try {
      const res = await api.raw(apiRoutes.boardDocuments.template(docType), {
        method: 'GET',
        headers: { Accept: 'text/html, text/csv, text/plain, */*' }
      })
      const sourceHeader = res.headers.get('X-Slavia-Template-Source')
      const content = await res.text()
      return {
        content,
        source: sourceHeader === 'embed' ? 'embed_template' : 'repo_template'
      }
    } catch {
      return null
    }
  }

  async function fetchDocumentBlob(documentId: string): Promise<Blob> {
    return await api<Blob>(apiRoutes.boardDocuments.documentContent(documentId), {
      responseType: 'blob',
      headers: { Accept: '*/*' }
    })
  }

  async function loadDocumentPreview(doc: BoardDocumentEntry): Promise<BoardPreviewPayload> {
    pending.value = true
    error.value = null
    let blobUrl: string | null = null
    try {
      const meta = await getPreviewMeta(doc.id).catch(() => null)
      const mime = meta?.mime_type ?? doc.mime_type ?? 'text/plain'
      const mimeLower = mime.toLowerCase()

      if (mimeLower.includes('pdf') || mimeLower.startsWith('image/')) {
        const blob = await fetchDocumentBlob(doc.id)
        blobUrl = URL.createObjectURL(blob)
        return {
          title: doc.title,
          content: '',
          mimeType: mime,
          source: 'document',
          blobUrl,
          documentId: doc.id,
          docType: doc.doc_type
        }
      }

      const text = await fetchContent(doc.id)
      return {
        title: doc.title,
        content: text,
        mimeType: mime,
        source: 'document',
        documentId: doc.id,
        docType: doc.doc_type
      }
    } catch (e) {
      error.value = getApiErrorMessage(e)
      throw e
    } finally {
      pending.value = false
    }
  }

  async function loadTypeSkeletonPreview(
    type: BoardDocumentTypeDefinition | string
  ): Promise<BoardPreviewPayload> {
    pending.value = true
    error.value = null
    try {
      const def =
        typeof type === 'string'
          ? findBuiltinBoardDocumentType(type) ?? {
              id: type,
              label: type,
              domain: 'administration' as const,
              category: 'custom' as const,
              folder: 'custom',
              defaultExtension: 'txt' as const,
              builtin: false
            }
          : type

      const repoTemplate = await fetchTemplateFromRepo(def.id)
      if (repoTemplate) {
        return {
          title: `Szkielet: ${def.label}`,
          content: repoTemplate.content,
          mimeType: mimeFromExtension(def.defaultExtension),
          source: repoTemplate.source,
          docType: def.id
        }
      }

      const skeleton = buildBoardDocumentSkeleton(def)
      return {
        title: `Szkielet: ${def.label}`,
        content: skeleton.content,
        mimeType: skeleton.mimeType,
        source: 'skeleton',
        pdfFields: skeleton.fields,
        docType: def.id
      }
    } catch (e) {
      error.value = getApiErrorMessage(e)
      throw e
    } finally {
      pending.value = false
    }
  }

  function cleanupPreview(payload: BoardPreviewPayload | null) {
    if (payload?.blobUrl) revokeBlob(payload.blobUrl)
  }

  return {
    pending,
    error,
    loadDocumentPreview,
    loadTypeSkeletonPreview,
    cleanupPreview
  }
}

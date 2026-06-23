/** Domena dokumentu w repozytorium Slavia-cms (`board/`). */
export type BoardDocumentDomain = 'sports' | 'administration'

/** Kategorie dokumentów — grupowanie w UI i folderach repo. */
export type BoardDocumentCategoryId =
  | 'sports_athlete'
  | 'sports_coach'
  | 'sports_competition'
  | 'sports_equipment'
  | 'admin_organizational'
  | 'admin_financial'
  | 'admin_hr'
  | 'admin_legal'
  | 'admin_marketing'
  | 'custom'

export type BoardDocumentTypeId = string

export type BoardDocumentTypeDefinition = {
  id: BoardDocumentTypeId
  label: string
  description?: string
  domain: BoardDocumentDomain
  category: BoardDocumentCategoryId
  /** Podfolder w `board/` (np. `athletes`, `meeting-reports`). */
  folder: string
  /** Domyślne rozszerzenie pliku przy tworzeniu z szablonu. */
  defaultExtension: 'csv' | 'html' | 'pdf' | 'txt'
  /** Czy typ jest dostępny w generatorze raportów. */
  generatorKind?: 'meeting_report' | 'competition_start_list' | null
  builtin: boolean
}

export type BoardCustomDocumentType = {
  id: string
  label: string
  category?: string | null
}

export type BoardDocumentVersion = {
  version_no: number
  created_at: string
  created_by?: string | null
  created_by_username?: string | null
  edit_source?: 'native' | 'upload' | 'generator' | null
  generator_params?: Record<string, unknown> | null
  note?: string | null
  git_sha?: string | null
}

export type BoardDocumentEntry = {
  id: string
  title: string
  doc_type?: string | null
  folder?: string | null
  repo_path?: string | null
  mime_type?: string | null
  updated_at?: string | null
  created_at?: string | null
  created_by_username?: string | null
  latest_version_no?: number
  versions?: BoardDocumentVersion[]
}

export type BoardDocumentManifest = {
  documents: BoardDocumentEntry[]
  updated_at?: string | null
  custom_types?: BoardCustomDocumentType[]
}

export type BoardDocumentEditMode = 'native' | 'download_only'

export type BoardDocumentPreviewMeta = {
  mime_type: string
  edit_mode: BoardDocumentEditMode
}

export type BoardDocsStatus = {
  repo: string
  branch: string
  board_root: string
  token_configured: boolean
  board_docs_ready: boolean
  manifest_path: string
}

export type GenerateBoardDocumentRequest = {
  kind: 'meeting_report' | 'competition_start_list'
  save_to_repo?: boolean
  title?: string
  meeting_date?: string
  competition_id?: string
}

export type GenerateBoardDocumentResponse = {
  content: string
  mime_type: string
  filename: string
  document?: BoardDocumentEntry | null
}

export type SaveBoardDocumentRequest = {
  title: string
  doc_type: string
  folder: string
  filename: string
  content: string
  mime_type?: string
}

export type DeleteBoardDocumentRequest = {
  id: string
}

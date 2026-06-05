export type CmsVariableType = 'text' | 'html' | 'image' | 'number' | 'boolean'

export interface CmsVariable {
  id: string
  key: string
  value: string | number | boolean | null
  type: CmsVariableType
  created_at: string
  updated_at: string
}

export interface CmsPageField {
  type: CmsVariableType
  value: string | number | boolean | null
  label?: string
}

export interface CmsPage {
  id: string
  page_name: string
  fields: Record<string, CmsPageField>
  created_at: string
  updated_at: string
}

export interface CmsNavigationItem {
  id: string
  role: 'admin' | 'trainer' | 'athlete' | 'superadmin'
  label: string
  icon: string
  url: string
  order_index: number
  group_name?: string | null
  created_at: string
  updated_at: string
}

export interface CmsVersionEntry {
  id: string
  entity_type: string
  entity_key: string
  old_value?: string | null
  new_value?: string | null
  changed_by?: string | null
  created_at: string
}

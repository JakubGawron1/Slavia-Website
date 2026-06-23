import type { RouteLocationRaw } from 'vue-router'
import type { PanelNavRole } from '~/data/panelNavigationCatalog'

/** Kto może zobaczyć wynik wyszukiwania. */
export type GlobalSearchAudience =
  | 'public'
  | 'guest'
  | 'loggedIn'
  | 'athlete'
  | 'trainer'
  | 'admin'
  | 'editor'
  | 'superadmin'
  | 'board'

export type GlobalSearchGroupId =
  | 'pages'
  | 'athletes'
  | 'competitions'
  | 'posts'
  | 'gallery'
  | 'announcements'
  | 'athlete-panel'
  | 'trainer-panel'
  | 'admin-panel'
  | 'superadmin'
  | 'account'

export type GlobalSearchItem = {
  id: string
  label: string
  description: string
  suffix: string
  icon: string
  to: RouteLocationRaw
  audiences: GlobalSearchAudience[]
  groupId: GlobalSearchGroupId
  panelNavId?: string
  gateRoute?: boolean
}

export type GlobalSearchGroup = {
  id: GlobalSearchGroupId
  label: string
  order: number
  items: GlobalSearchItem[]
}

export const GLOBAL_SEARCH_GROUP_LABELS: Record<GlobalSearchGroupId, string> = {
  pages: 'Strony klubu',
  athletes: 'Zawodnicy',
  competitions: 'Kalendarz (zawody / wydarzenia)',
  posts: 'Aktualności',
  gallery: 'Galeria',
  announcements: 'Ogłoszenia',
  'athlete-panel': 'Panel zawodnika',
  'trainer-panel': 'Panel trenera',
  'admin-panel': 'Panel admina',
  superadmin: 'SuperAdmin',
  account: 'Konto i panele'
}

export const GLOBAL_SEARCH_GROUP_ORDER: GlobalSearchGroupId[] = [
  'pages',
  'athletes',
  'competitions',
  'posts',
  'gallery',
  'announcements',
  'account',
  'athlete-panel',
  'trainer-panel',
  'admin-panel',
  'superadmin'
]

export type PanelNavRoleForSearch = PanelNavRole

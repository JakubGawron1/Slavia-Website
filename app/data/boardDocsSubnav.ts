import { KLUB_BOARD_ROUTES } from '~/config/klubRoutes'

export type BoardDocsSubnavItem = {
  id: string
  label: string
  to: string
  icon: string
  description?: string
}

export const BOARD_DOCS_SUBNAV: BoardDocsSubnavItem[] = [
  {
    id: 'list',
    label: 'Repozytorium',
    to: KLUB_BOARD_ROUTES.dokumenty,
    icon: 'i-lucide-folder-lock',
    description: 'Lista dokumentów w Slavia-cms'
  },
  {
    id: 'generator',
    label: 'Generator',
    to: KLUB_BOARD_ROUTES.generator,
    icon: 'i-lucide-wand-sparkles',
    description: 'Raporty i listy startowe'
  },
  {
    id: 'types',
    label: 'Typy dokumentów',
    to: KLUB_BOARD_ROUTES.typy,
    icon: 'i-lucide-tags',
    description: 'Katalog i typy własne'
  }
]

export function isBoardDocsSubnavActive(path: string, item: BoardDocsSubnavItem): boolean {
  const normalized = path.replace(/\/$/, '') || '/'
  if (item.id === 'list') {
    return normalized === KLUB_BOARD_ROUTES.dokumenty
  }
  return normalized === item.to || normalized.startsWith(`${item.to}/`)
}

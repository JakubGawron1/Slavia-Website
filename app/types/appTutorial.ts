export type TutorialTrackId = 'common' | 'athlete' | 'trainer' | 'admin' | 'editor' | 'board'

export type TutorialDemoKind =
  | 'navbar'
  | 'search'
  | 'dashboard'
  | 'sidebar'
  | 'module-flow'
  | 'attendance'
  | 'chat'
  | 'documents'
  | 'cms'
  | null

export type TutorialHotspot = {
  id: string
  label: string
  /** Pozycja X w procentach (0–100) względem mockupu. */
  x: number
  /** Pozycja Y w procentach (0–100) względem mockupu. */
  y: number
  description: string
  icon?: string
}

export type TutorialStep = {
  id: string
  title: string
  icon: string
  summary: string
  paragraphs: string[]
  bullets?: string[]
  demo?: TutorialDemoKind
  hotspots?: TutorialHotspot[]
  actionTo?: string
  actionLabel?: string
}

export type TutorialTrack = {
  id: TutorialTrackId
  label: string
  shortLabel: string
  icon: string
  description: string
  color: string
  bg: string
  steps: TutorialStep[]
}

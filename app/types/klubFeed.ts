export type KlubFeedItem = {
  id: string
  kind: 'post' | 'announcement' | 'event'
  title: string
  summary: string
  at: string
  pinned: boolean
  category?: string | null
  location?: string | null
  status?: string | null
}

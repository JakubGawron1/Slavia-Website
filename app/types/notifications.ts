/** Powiadomienie in-app zwracane przez GET /api/notifications */
export interface ClubNotification {
  id: string
  kind: string
  title: string
  body: string
  payload?: string | null
  created_at: string
  is_read: boolean
}

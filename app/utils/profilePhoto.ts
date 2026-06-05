import type { AuthUser } from '~/types/models'

/**
 * Zdjęcie „jak w navbarze”: najpierw `avatar_url` konta, potem zdjęcie profilu sportowego (`athletes.image_url`),
 * gdy backend je zwraca w `/api/auth/me` jako `athlete_image_url`.
 */
export function resolveAuthProfilePhotoSrc(user: AuthUser | null | undefined): string | undefined {
  if (!user) return undefined
  const av = user.avatar_url?.trim()
  if (av) return av
  const sport = user.athlete_image_url?.trim()
  if (sport) return sport
  return undefined
}

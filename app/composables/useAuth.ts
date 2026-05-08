import { apiRoutes } from '~/config/api'
import type { AuthUser, LoginResponse, UserRole } from '~/types/models'

const USER_STATE_KEY = 'slavia-auth-user'

const ROLE_LABELS: Record<UserRole, string> = {
  SuperAdmin: 'Superadmin',
  Admin: 'Administrator',
  Trainer: 'Trener',
  Athlete: 'Zawodnik'
}

const ROLE_ORDER: UserRole[] = ['SuperAdmin', 'Admin', 'Trainer', 'Athlete']

/** Domyślna strona po logowaniu (bez `redirect` z query) — pierwsza pasująca rola wg hierarchii. */
export function pickPostLoginPath(roleList: UserRole[]): string {
  const r = new Set(roleList)
  if (r.has('SuperAdmin')) return '/superadmin'
  if (r.has('Admin')) return '/admin'
  if (r.has('Trainer')) return '/trainer'
  if (r.has('Athlete')) return '/athlete'
  return '/'
}

export function useAuth() {
  const backendProvider = useBackendProvider()
  const token = useCookie<string | null>('slavia_token', {
    maxAge: 60 * 60 * 24 * 14,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/'
  })
  const user = useState<AuthUser | null>(USER_STATE_KEY, () => null)

  const apiBase = computed(() => backendProvider.activeApiBase.value)

  const isLoggedIn = computed(() => !!token.value)

  const roles = computed(() => user.value?.roles ?? [])

  const isSuperAdmin = computed(() => roles.value.includes('SuperAdmin'))

  /** Kadra (trener) — admin nie jest już traktowany jako trener. */
  const isTrainer = computed(() =>
    roles.value.some(role =>
      ['Trainer', 'SuperAdmin'].includes(role)
    )
  )

  const isAdmin = computed(() =>
    roles.value.some(role => ['Admin', 'SuperAdmin'].includes(role))
  )

  /** Konto ma przypisaną rolę zawodnika (bez konfliktu z kadrowymi flagami). */
  const isAthlete = computed(() => roles.value.includes('Athlete'))

  /** Wejście na ścieżki `/athlete/*` — zawodnik lub SuperAdmin (pełny dostęp). */
  const canAccessAthletePortal = computed(
    () => roles.value.includes('Athlete') || roles.value.includes('SuperAdmin')
  )

  /** Krótki opis wszystkich ról konta (np. „Superadmin · Trener · Zawodnik”). */
  const rolesDisplayShort = computed(() => {
    const uniq = [...new Set(roles.value)] as UserRole[]
    uniq.sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
    return uniq.map(r => ROLE_LABELS[r]).join(' · ')
  })

  async function fetchMe(): Promise<AuthUser | null> {
    if (!token.value) {
      user.value = null
      return null
    }
    try {
      const me = await $fetch<AuthUser>(`${apiBase.value}${apiRoutes.auth.me}`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      user.value = me
      return me
    } catch {
      token.value = null
      user.value = null
      return null
    }
  }

  async function login(username: string, password: string) {
    const res = await $fetch<LoginResponse>(`${apiBase.value}${apiRoutes.auth.login}`, {
      method: 'POST',
      body: { username, password }
    })
    token.value = res.token

    user.value = {
      id: res.user_id,
      username,
      roles: res.roles,
      is_banned: false,
      banned_reason: null
    }
    await fetchMe()
    return user.value
  }

  function logout() {
    token.value = null
    user.value = null
  }

  /** Używane w middleware: odśwież sesję jeśli jest token. */
  async function ensureSession() {
    if (!token.value) {
      user.value = null
      return
    }
    if (user.value) return
    await fetchMe()
  }

  return {
    token,
    user,
    apiBase,
    roles,
    isLoggedIn,
    isAdmin,
    isTrainer,
    isSuperAdmin,
    isAthlete,
    canAccessAthletePortal,
    rolesDisplayShort,
    login,
    logout,
    fetchMe,
    ensureSession
  }
}

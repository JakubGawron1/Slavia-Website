import { KLUB_BOARD_ROUTES } from '~/config/klubRoutes'
import { clearAthleteDashboardCache } from '~/utils/athleteDashboardCache'
import type { AuthUser, LoginResponse, UserRole } from '~/types/models'
import type { FetchError } from 'ofetch'

/** Limit cold start HF — nie blokuj publicznych stron na wiszącym /auth/me. */
export const AUTH_FETCH_ME_TIMEOUT_MS = 12_000

const USER_STATE_KEY = 'slavia-auth-user'

const ROLE_LABELS: Record<UserRole, string> = {
  SuperAdmin: 'Superadmin',
  Admin: 'Administrator',
  Editor: 'Redaktor',
  Trainer: 'Trener',
  Athlete: 'Zawodnik',
  BoardMember: 'Członek zarządu',
  BoardDocsFullAccess: 'Zarząd (pełny dostęp)'
}

const ROLE_ORDER: UserRole[] = [
  'SuperAdmin',
  'Admin',
  'Editor',
  'BoardDocsFullAccess',
  'BoardMember',
  'Trainer',
  'Athlete'
]

const KNOWN_ROLES = new Set<UserRole>([
  'SuperAdmin',
  'Admin',
  'Editor',
  'Trainer',
  'Athlete',
  'BoardMember',
  'BoardDocsFullAccess'
])

/** Normalizuje role z API / JWT (string lub legacy obiekt z serde). */
export function normalizeUserRoles(raw: unknown): UserRole[] {
  if (!Array.isArray(raw)) return []
  const out: UserRole[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      if (KNOWN_ROLES.has(item as UserRole)) out.push(item as UserRole)
      continue
    }
    if (item && typeof item === 'object') {
      const key = Object.keys(item as Record<string, unknown>)[0]
      if (key === 'TrainerAdmin') {
        out.push('Admin', 'Trainer')
      } else if (key && KNOWN_ROLES.has(key as UserRole)) {
        out.push(key as UserRole)
      }
    }
  }
  return [...new Set(out)]
}

/** Domyślna strona po logowaniu (bez `redirect` z query) — pierwsza pasująca rola wg hierarchii. */
export function pickPostLoginPath(roleList: UserRole[]): string {
  const r = new Set(roleList)
  if (r.has('SuperAdmin')) return '/superadmin'
  if (r.has('Admin')) return '/admin'
  if (r.has('Editor')) return '/admin/cms'
  if (r.has('Trainer')) return '/trainer'
  if (r.has('Athlete')) return '/athlete'
  if (r.has('BoardDocsFullAccess') || r.has('BoardMember')) return KLUB_BOARD_ROUTES.dokumenty
  return '/'
}

export function useAuth() {
  const backendProvider = useBackendProvider()
  const TOKEN_COOKIE_KEY = 'slavia_token'
  const TOKEN_LS_KEY = 'slavia_token_ls'

  const tokenCookie = useCookie<string | null>(TOKEN_COOKIE_KEY, {
    maxAge: 60 * 60 * 24 * 14,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/'
  })

  // Brave (i podobne) potrafią blokować zapis cookie per‑site. Trzymamy więc token także w localStorage.
  // Cookie nadal jest preferowane (SSR + standard), a LS działa jako fallback per‑browser.
  const token = computed<string | null>({
    get() {
      if (tokenCookie.value) return tokenCookie.value
      if (!import.meta.client) return null
      const ls = localStorage.getItem(TOKEN_LS_KEY)
      return ls && ls.trim() ? ls : null
    },
    set(v) {
      tokenCookie.value = v
      if (!import.meta.client) return
      try {
        if (v && v.trim()) localStorage.setItem(TOKEN_LS_KEY, v)
        else localStorage.removeItem(TOKEN_LS_KEY)
      } catch {
        // ignore (np. blokada storage)
      }
    }
  })

  if (import.meta.client) {
    try {
      // Jeśli mamy token w LS, ale cookie jest puste, spróbuj go przywrócić do cookie.
      // Gdy przeglądarka blokuje cookies, to i tak pozostanie LS fallback.
      if (!tokenCookie.value) {
        const ls = localStorage.getItem(TOKEN_LS_KEY)
        if (ls && ls.trim()) {
          tokenCookie.value = ls
        }
      }
    } catch {
      // ignore
    }
  }
  const user = useState<AuthUser | null>(USER_STATE_KEY, () => null)
  /** Token jest, ale GET /auth/me nie powiódł się (sieć/5xx) — nie traktuj jak wylogowania. */
  const sessionLoadError = useState<boolean>('slavia-auth-session-load-error', () => false)

  const apiBase = computed(() => backendProvider.activeApiBase.value)

  const isLoggedIn = computed(() => !!token.value)

  const roles = computed(() => normalizeUserRoles(user.value?.roles ?? []))

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

  /** Blog, galeria, ogłoszenia — Admin lub SuperAdmin (role z bazy przez GET /me). */
  const canManageClubContent = computed(() => isAdmin.value)

  /** CMS — Editor, Admin lub SuperAdmin. */
  const canEditCms = computed(() =>
    roles.value.some(r => ['Editor', 'Admin', 'SuperAdmin'].includes(r))
  )

  const isEditor = computed(() => roles.value.includes('Editor'))

  /** Konto ma przypisaną rolę zawodnika (bez konfliktu z kadrowymi flagami). */
  const isAthlete = computed(() => roles.value.includes('Athlete'))

  /** Wejście na ścieżki `/athlete/*` — zawodnik lub SuperAdmin (pełny dostęp). */
  const canAccessAthletePortal = computed(
    () => roles.value.includes('Athlete') || roles.value.includes('SuperAdmin')
  )

  /** Sekcja dokumentów zarządu (`/klub/dokumenty/**`). */
  const isBoardMember = computed(() =>
    roles.value.some(r =>
      ['BoardMember', 'BoardDocsFullAccess', 'SuperAdmin'].includes(r)
    )
  )

  /** Zapis i wersjonowanie repozytorium dokumentów (prezes/wice). */
  const isBoardDocsFullAccess = computed(() =>
    roles.value.some(r => ['BoardDocsFullAccess', 'SuperAdmin'].includes(r))
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
      sessionLoadError.value = false
      return null
    }
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const me = await $fetch<AuthUser>('/api/auth/me', {
          headers: { Authorization: `Bearer ${token.value}` },
          timeout: AUTH_FETCH_ME_TIMEOUT_MS
        })
        user.value = { ...me, roles: normalizeUserRoles(me.roles) }
        sessionLoadError.value = false
        return user.value
      } catch (e) {
        const err = e as FetchError
        const status = (typeof err?.statusCode === 'number' ? err.statusCode : (err as unknown as { status?: number })?.status)
        if (status === 401 || status === 403) {
          token.value = null
          user.value = null
          sessionLoadError.value = false
          return null
        }
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 800 * attempt))
          continue
        }
        sessionLoadError.value = true
        console.error('[auth] fetchMe failed (keeping token)', {
          apiBase: apiBase.value,
          status,
          message: String(err?.message || e)
        })
        return null
      }
    }
    return null
  }

  async function login(username: string, password: string, totpCode?: string | null) {
    const code = totpCode?.trim()
    const res = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: {
        username,
        password,
        ...(code ? { totp_code: code } : {})
      },
      timeout: 25_000
    })
    token.value = res.token

    user.value = {
      id: res.user_id,
      username,
      roles: normalizeUserRoles(res.roles),
      is_banned: false,
      banned_reason: null
    }
    // Jeśli /me się wysypie (np. prod backend/secret/timeout), nie blokuj samego logowania.
    await fetchMe()
    return user.value
  }

  function logout() {
    clearAthleteDashboardCache()
    token.value = null
    user.value = null
    sessionLoadError.value = false
  }

  /** Używane w middleware: odśwież sesję jeśli jest token. */
  async function ensureSession(options?: { force?: boolean }) {
    if (!token.value) {
      user.value = null
      return
    }
    // Po logowaniu mamy już role z POST /login — nie nadpisuj sesji przy chwilowych 5xx /auth/me.
    if (!options?.force && user.value) return
    await fetchMe()
  }

  async function refreshSession() {
    await ensureSession({ force: true })
  }

  return {
    token,
    user,
    sessionLoadError,
    apiBase,
    roles,
    isLoggedIn,
    isAdmin,
    canManageClubContent,
    canEditCms,
    isEditor,
    isTrainer,
    isSuperAdmin,
    isAthlete,
    canAccessAthletePortal,
    isBoardMember,
    isBoardDocsFullAccess,
    rolesDisplayShort,
    login,
    logout,
    fetchMe,
    ensureSession,
    refreshSession
  }
}

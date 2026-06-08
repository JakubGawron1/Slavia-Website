import { GLOBAL_SEARCH_EXTRAS } from '~/data/globalSearchExtras'
import {
  PANEL_NAV_MODULES,
  panelNavRolesForUserRoles,
  type PanelNavRole
} from '~/data/panelNavigationCatalog'
import { PUBLIC_SITE_SEARCH_CATALOG } from '~/data/publicSiteSearchCatalog'
import {
  SUPERADMIN_DASHBOARD_ENTRY,
  SUPERADMIN_SEARCH_CATALOG
} from '~/data/superadminSearchCatalog'
import { publicApiUrl } from '~/composables/usePublicFetch'
import type { CmsPage } from '~/types/cms'
import type {
  GlobalSearchAudience,
  GlobalSearchGroup,
  GlobalSearchGroupId,
  GlobalSearchItem
} from '~/types/globalSearch'
import {
  GLOBAL_SEARCH_GROUP_LABELS,
  GLOBAL_SEARCH_GROUP_ORDER
} from '~/types/globalSearch'
import type { RouteLocationRaw } from 'vue-router'
import type { Athlete, Competition } from '~/types/models'
import { extractCmsPageSearchText } from '~/utils/cmsSearchText'
import { stripHtmlTags } from '~/utils/html'
import { athleteProfilePath, blogPostPath, slugify } from '~/utils/slug'

function pathFromRoute(to: RouteLocationRaw): string {
  if (typeof to === 'string') {
    return to.split('?')[0]!.split('#')[0]!
  }
  if ('path' in to && typeof to.path === 'string' && to.path) {
    return to.path
  }
  return ''
}

type BlogBrief = { id: string, title: string, content?: string }
type GalleryPhoto = { id: string, caption?: string | null }
type AnnouncementBrief = { id: string, title: string, body?: string }

type SearchContext = {
  isLoggedIn: boolean
  roles: Set<string>
  isSuperAdmin: boolean
}

function panelRoleToAudience(role: PanelNavRole): GlobalSearchAudience {
  return role
}

function matchesAudience(audiences: GlobalSearchAudience[], ctx: SearchContext): boolean {
  return audiences.some((a) => {
    switch (a) {
      case 'public':
        return true
      case 'guest':
        return !ctx.isLoggedIn
      case 'loggedIn':
        return ctx.isLoggedIn
      case 'athlete':
        return ctx.roles.has('Athlete') || ctx.isSuperAdmin
      case 'trainer':
        return ctx.roles.has('Trainer') || ctx.isSuperAdmin
      case 'admin':
        return ctx.roles.has('Admin') || ctx.isSuperAdmin
      case 'editor':
        return ctx.roles.has('Editor') || ctx.roles.has('Admin') || ctx.isSuperAdmin
      case 'superadmin':
        return ctx.isSuperAdmin
      default:
        return false
    }
  })
}

function makeSuffix(...parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export type GlobalSearchPaletteItem = {
  id: string
  label: string
  description: string
  suffix: string
  icon: string
}

function toCmdItem(item: GlobalSearchItem): GlobalSearchPaletteItem {
  return {
    id: item.id,
    label: item.label,
    description: item.description,
    suffix: item.suffix,
    icon: item.icon
  }
}

export function useGlobalSearchIndex() {
  const auth = useAuth()
  const router = useRouter()
  const panelNav = usePanelNavigationFlags()
  const { accountSettingsPath } = useRoleDashboardNav()

  const loading = ref(false)
  const rawGroups = shallowRef<GlobalSearchGroup[]>([])
  const routesById = shallowRef(new Map<string, RouteLocationRaw>())
  const closePalette = ref<(() => void) | null>(null)

  function searchContext(): SearchContext {
    return {
      isLoggedIn: auth.isLoggedIn.value,
      roles: new Set(auth.roles.value),
      isSuperAdmin: auth.isSuperAdmin.value
    }
  }

  function isItemVisible(item: Pick<GlobalSearchItem, 'audiences' | 'panelNavId' | 'gateRoute' | 'to'>): boolean {
    const ctx = searchContext()
    if (!matchesAudience(item.audiences, ctx)) return false
    if (item.panelNavId && !panelNav.isEnabled(item.panelNavId) && !ctx.isSuperAdmin) return false
    if (item.gateRoute && auth.isLoggedIn.value && !panelNav.canAccessPath(pathFromRoute(item.to)) && !ctx.isSuperAdmin) {
      return false
    }
    return true
  }

  function pushItem(bucket: Map<GlobalSearchGroupId, GlobalSearchItem[]>, item: GlobalSearchItem) {
    if (!isItemVisible(item)) return
    const list = bucket.get(item.groupId) ?? []
    list.push(item)
    bucket.set(item.groupId, list)
  }

  function panelGroupId(role: PanelNavRole): GlobalSearchGroupId {
    if (role === 'athlete') return 'athlete-panel'
    if (role === 'trainer') return 'trainer-panel'
    return 'admin-panel'
  }

  function buildGroupsMap(): Map<GlobalSearchGroupId, GlobalSearchItem[]> {
    const bucket = new Map<GlobalSearchGroupId, GlobalSearchItem[]>()
    return bucket
  }

  function buildPageItems(cmsPages: CmsPage[], bucket: Map<GlobalSearchGroupId, GlobalSearchItem[]>) {
    const cmsByName = new Map(
      (Array.isArray(cmsPages) ? cmsPages : []).map(p => [p.page_name, p])
    )

    for (const entry of PUBLIC_SITE_SEARCH_CATALOG) {
      const cms = entry.cmsPageName ? cmsByName.get(entry.cmsPageName) : undefined
      const cmsText = extractCmsPageSearchText(cms)
      pushItem(bucket, {
        id: `s-${entry.id}`,
        label: entry.label,
        description: entry.description,
        suffix: makeSuffix(entry.label, entry.description, entry.keywords, cmsText),
        icon: entry.icon,
        to: entry.to,
        audiences: entry.audiences ?? ['public'],
        groupId: 'pages'
      })
    }
  }

  function buildPanelItems(bucket: Map<GlobalSearchGroupId, GlobalSearchItem[]>) {
    const userPanelRoles = new Set(panelNavRolesForUserRoles(auth.roles.value))
    for (const def of PANEL_NAV_MODULES) {
      if (!userPanelRoles.has(def.role)) continue
      pushItem(bucket, {
        id: `pn-${def.id}`,
        label: def.title,
        description: `${def.group} · ${def.description}`,
        suffix: makeSuffix(def.title, def.group, def.description, def.to),
        icon: def.icon,
        to: def.to,
        audiences: [panelRoleToAudience(def.role)],
        groupId: panelGroupId(def.role),
        panelNavId: def.id,
        gateRoute: def.gateRoute
      })
    }
  }

  function buildExtraItems(bucket: Map<GlobalSearchGroupId, GlobalSearchItem[]>) {
    for (const entry of GLOBAL_SEARCH_EXTRAS) {
      pushItem(bucket, {
        id: `x-${entry.id}`,
        label: entry.label,
        description: entry.description,
        suffix: makeSuffix(entry.label, entry.description, entry.keywords),
        icon: entry.icon,
        to: entry.to,
        audiences: entry.audiences,
        groupId: entry.audiences.includes('superadmin')
          ? 'superadmin'
          : entry.audiences.some(a => a === 'athlete')
            ? 'athlete-panel'
            : entry.audiences.some(a => a === 'trainer')
              ? 'trainer-panel'
              : entry.audiences.some(a => a === 'admin' || a === 'editor')
                ? 'admin-panel'
                : 'account',
        panelNavId: entry.panelNavId,
        gateRoute: entry.gateRoute
      })
    }

    if (searchContext().isLoggedIn) {
      pushItem(bucket, {
        id: 'account-settings',
        label: 'Ustawienia konta',
        description: 'Profil, wygląd, 2FA i sesje',
        suffix: makeSuffix('ustawienia konto profil wygląd 2fa hasło'),
        icon: 'i-lucide-user-circle',
        to: accountSettingsPath.value,
        audiences: ['loggedIn'],
        groupId: 'account'
      })
    }
  }

  function buildSuperadminItems(bucket: Map<GlobalSearchGroupId, GlobalSearchItem[]>) {
    if (!auth.isSuperAdmin.value) return

    const all = [SUPERADMIN_DASHBOARD_ENTRY, ...SUPERADMIN_SEARCH_CATALOG]
    for (const entry of all) {
      pushItem(bucket, {
        id: `sa-${entry.id}`,
        label: entry.label,
        description: entry.description,
        suffix: makeSuffix(entry.label, entry.description, entry.keywords),
        icon: entry.icon,
        to: entry.to,
        audiences: ['superadmin'],
        groupId: 'superadmin'
      })
    }
  }

  async function loadIndex() {
    loading.value = true
    try {
      if (auth.isLoggedIn.value) {
        await panelNav.hydrateFromApi().catch(() => undefined)
      }
      const ctx = searchContext()
      const fetches: Promise<unknown>[] = [
        Promise.all([
          $fetch<Athlete[]>(publicApiUrl('athletes')).catch(() => []),
          $fetch<Athlete[]>(publicApiUrl('athletes/archive')).catch(() => [])
        ]).then(([active, archived]) => [
          ...(Array.isArray(active) ? active : []),
          ...(Array.isArray(archived) ? archived : [])
        ]),
        $fetch<Competition[]>(publicApiUrl('competitions')).catch(() => []),
        $fetch<BlogBrief[]>(publicApiUrl('posts')).catch(() => []),
        $fetch<CmsPage[]>(publicApiUrl('cms/pages')).catch(() => []),
        $fetch<GalleryPhoto[]>(publicApiUrl('gallery')).catch(() => [])
      ]
      if (ctx.isLoggedIn) {
        fetches.push($fetch<AnnouncementBrief[]>(publicApiUrl('announcements')).catch(() => []))
      }

      const results = await Promise.all(fetches)
      const athletes = results[0] as Athlete[]
      const comps = results[1] as Competition[]
      const posts = results[2] as BlogBrief[]
      const cmsPages = results[3] as CmsPage[]
      const gallery = results[4] as GalleryPhoto[]
      const announcements = ctx.isLoggedIn ? (results[5] as AnnouncementBrief[] | undefined) : undefined

      const bucket = buildGroupsMap()
      buildPageItems(cmsPages, bucket)
      buildPanelItems(bucket)
      buildExtraItems(bucket)
      buildSuperadminItems(bucket)

      const seenAthleteIds = new Set<string>()
      for (const a of Array.isArray(athletes) ? athletes : []) {
        if (seenAthleteIds.has(a.id)) continue
        seenAthleteIds.add(a.id)
        const label = String(a.full_name || '').trim() || 'Zawodnik'
        const archived = a.is_active === false
        pushItem(bucket, {
          id: `a-${a.id}`,
          label: archived ? `${label} (archiwum)` : label,
          description: [
            archived ? 'Archiwum' : 'Zawodnik',
            a.profile_tagline || a.weight_category || ''
          ].filter(Boolean).join(' · '),
          suffix: makeSuffix(label, a.profile_tagline, a.weight_category, a.public_bio),
          icon: 'i-lucide-user',
          to: athleteProfilePath(label, a.id),
          audiences: ['public'],
          groupId: 'athletes'
        })
      }

      for (const c of Array.isArray(comps) ? comps : []) {
        const ds = typeof c.date === 'string' ? c.date.slice(0, 10) : ''
        const label = String(c.title || '').trim() || 'Wydarzenie'
        const loc = String(c.location || '').trim()
        pushItem(bucket, {
          id: `c-${c.id}`,
          label,
          description: [ds, loc].filter(Boolean).join(' · ') || 'Kalendarz',
          suffix: makeSuffix(label, ds, loc, c.description),
          icon: 'i-lucide-calendar',
          to: '/kalendarz',
          audiences: ['public'],
          groupId: 'competitions'
        })
      }

      for (const p of Array.isArray(posts) ? posts : []) {
        const label = String(p.title || '').trim() || 'Aktualność'
        const slug = slugify(label)
        const contentPlain = p.content ? stripHtmlTags(p.content) : ''
        pushItem(bucket, {
          id: `p-${p.id}`,
          label,
          description: 'Aktualność',
          suffix: makeSuffix(label, contentPlain),
          icon: 'i-lucide-newspaper',
          to: blogPostPath(slug, p.id),
          audiences: ['public'],
          groupId: 'posts'
        })
      }

      for (const photo of Array.isArray(gallery) ? gallery : []) {
        const caption = String(photo.caption || '').trim()
        if (!caption) continue
        pushItem(bucket, {
          id: `g-${photo.id}`,
          label: caption,
          description: 'Galeria — zdjęcie lub film',
          suffix: makeSuffix(caption, 'galeria zdjęcie film'),
          icon: 'i-lucide-image',
          to: '/galeria',
          audiences: ['public'],
          groupId: 'gallery'
        })
      }

      if (Array.isArray(announcements)) {
        for (const ann of announcements) {
          const label = String(ann.title || '').trim() || 'Ogłoszenie'
          const bodyPlain = ann.body ? stripHtmlTags(ann.body) : ''
          pushItem(bucket, {
            id: `ann-${ann.id}`,
            label,
            description: 'Ogłoszenie klubowe',
            suffix: makeSuffix(label, bodyPlain),
            icon: 'i-lucide-megaphone',
            to: '/ogloszenia',
            audiences: ['loggedIn'],
            groupId: 'announcements'
          })
        }
      }

      const groups: GlobalSearchGroup[] = []
      const routeMap = new Map<string, RouteLocationRaw>()
      for (const groupId of GLOBAL_SEARCH_GROUP_ORDER) {
        const items = bucket.get(groupId)
        if (!items?.length) continue
        for (const item of items) {
          routeMap.set(item.id, item.to)
        }
        groups.push({
          id: groupId,
          label: GLOBAL_SEARCH_GROUP_LABELS[groupId],
          order: GLOBAL_SEARCH_GROUP_ORDER.indexOf(groupId),
          items
        })
      }
      routesById.value = routeMap
      rawGroups.value = groups
    } finally {
      loading.value = false
    }
  }

  function resolveTarget(payload?: { id?: string, to?: RouteLocationRaw } | null): RouteLocationRaw | null {
    if (!payload) return null
    if (payload.to != null && payload.to !== '') return payload.to
    if (payload.id) return routesById.value.get(payload.id) ?? null
    return null
  }

  let pickInFlight: string | null = null

  function pickSearchItem(payload?: { id?: string, to?: RouteLocationRaw } | null) {
    const target = resolveTarget(payload)
    if (target == null || target === '') return
    const key = typeof target === 'string' ? target : JSON.stringify(target)
    if (pickInFlight === key) return
    pickInFlight = key
    void router.push(target).finally(() => {
      pickInFlight = null
      closePalette.value?.()
    })
  }

  const paletteGroups = computed(() =>
    rawGroups.value.map(g => ({
      id: g.id,
      label: g.label,
      items: g.items.map((item) => {
        const cmd = toCmdItem(item) as GlobalSearchPaletteItem & { onSelect?: () => void }
        cmd.onSelect = () => pickSearchItem({ id: item.id, to: item.to })
        return cmd
      })
    }))
  )

  function registerCloseHandler(fn: () => void) {
    closePalette.value = fn
  }

  return {
    loading,
    paletteGroups,
    loadIndex,
    pickSearchItem,
    registerCloseHandler
  }
}

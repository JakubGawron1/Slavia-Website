import type { ComputedRef } from 'vue'
import { getApiErrorMessage } from '~/composables/useApi'
import {
  buildPanelModuleGroups,
  type PanelModuleGroup,
  type PanelNavRole
} from '~/data/panelNavigationCatalog'
import type { CmsNavigationItem } from '~/types/cms'
import type { DashboardNavRole } from '~/utils/dashboardNavRole'
import type { DashboardModuleLink } from '~/utils/dashboardLink'

/** Spłaszcza grupy dashboardu do listy pozycji CMS (kolejność globalna). */
export function cmsNavItemsFromGroups(
  groups: PanelModuleGroup[],
  role: DashboardNavRole
): CmsNavigationItem[] {
  const out: CmsNavigationItem[] = []
  let order = 0
  for (const group of groups) {
    for (const item of group.items) {
      out.push({
        id: '',
        role,
        label: item.title,
        icon: item.icon,
        url: item.to,
        order_index: order,
        group_name: group.title,
        created_at: '',
        updated_at: ''
      })
      order += 1
    }
  }
  return out
}

/** Grupy dashboardu z zapisanych pozycji CMS lub katalogu / fallbacku. */
export function cmsNavGroupsFromItems(
  role: DashboardNavRole,
  cmsItems: CmsNavigationItem[],
  fallbackGroups: PanelModuleGroup[] = []
): PanelModuleGroup[] {
  const roleItems = cmsItems
    .filter(n => n.role === role)
    .sort((a, b) => a.order_index - b.order_index)
  if (roleItems.length === 0) {
    if (role === 'superadmin') return fallbackGroups
    return buildPanelModuleGroups(role as PanelNavRole)
  }
  const byGroup = new Map<string, DashboardModuleLink[]>()
  for (const item of roleItems) {
    const group = item.group_name?.trim() || 'Moduły'
    const list = byGroup.get(group) ?? []
    list.push({
      title: item.label,
      description: item.url,
      icon: item.icon,
      to: item.url,
      color: 'text-primary',
      bg: 'bg-primary/10'
    })
    byGroup.set(group, list)
  }
  return [...byGroup.entries()].map(([title, items]) => ({ title, items }))
}

/** Zachowuje strukturę grup, zmienia kolejność tylko widocznych na ekranie pozycji. */
export function applyPartialNavReorder(
  persistGroups: PanelModuleGroup[],
  draftGroups: PanelModuleGroup[]
): PanelModuleGroup[] {
  const visibleOrder = draftGroups.flatMap(g => g.items.map(i => i.to))
  const visibleSet = new Set(visibleOrder)
  const flat = persistGroups.flatMap(g => g.items)
  const byUrl = new Map(flat.map(i => [i.to, i]))

  const reorderedQueue = visibleOrder
    .map(url => byUrl.get(url))
    .filter((item): item is DashboardModuleLink => !!item)

  let queueIndex = 0
  const reorderedFlat = flat.map((item) => {
    if (!visibleSet.has(item.to)) return item
    const next = reorderedQueue[queueIndex]
    queueIndex += 1
    return next ?? item
  })

  let offset = 0
  return persistGroups.map((group) => {
    const items = reorderedFlat.slice(offset, offset + group.items.length)
    offset += group.items.length
    return { title: group.title, items }
  })
}

export function useCmsDashboardNav(
  role: ComputedRef<DashboardNavRole | null>,
  sourceGroups: ComputedRef<PanelModuleGroup[]>,
  persistGroups?: ComputedRef<PanelModuleGroup[] | null>
) {
  const cms = useCms()

  const localEditMode = ref(false)
  const draftGroups = ref<PanelModuleGroup[]>([])
  const dragSource = ref<{ gi: number, ii: number } | null>(null)
  const saving = ref(false)
  const errorMsg = ref('')

  const canEditNav = computed(() => cms.canEdit.value && !!role.value)

  const editMode = computed(
    () => (cms.editMode.value && canEditNav.value) || localEditMode.value
  )

  function cloneGroups(src: PanelModuleGroup[]): PanelModuleGroup[] {
    return src.map(g => ({
      title: g.title,
      items: g.items.map(i => ({ ...i }))
    }))
  }

  function resetDraft() {
    draftGroups.value = cloneGroups(sourceGroups.value)
    dragSource.value = null
  }

  watch(sourceGroups, (g) => {
    if (!editMode.value) draftGroups.value = cloneGroups(g)
  }, { immediate: true, deep: true })

  watch(
    () => cms.editMode.value,
    (on, wasOn) => {
      if (on && canEditNav.value) {
        resetDraft()
        errorMsg.value = ''
        return
      }
      if (wasOn && !on) {
        localEditMode.value = false
        resetDraft()
      }
    }
  )

  function startEdit() {
    resetDraft()
    localEditMode.value = true
    errorMsg.value = ''
  }

  function cancelEdit() {
    localEditMode.value = false
    resetDraft()
  }

  function onDragStart(gi: number, ii: number) {
    dragSource.value = { gi, ii }
  }

  function onDrop(targetGi: number, targetIi: number) {
    const src = dragSource.value
    if (!src) return
    if (src.gi === targetGi && src.ii === targetIi) {
      dragSource.value = null
      return
    }
    const fromGroup = draftGroups.value[src.gi]
    const toGroup = draftGroups.value[targetGi]
    if (!fromGroup || !toGroup) return
    const [moved] = fromGroup.items.splice(src.ii, 1)
    if (!moved) return
    toGroup.items.splice(targetIi, 0, moved)
    dragSource.value = null
  }

  async function saveOrder() {
    const r = role.value
    if (!r) return
    saving.value = true
    errorMsg.value = ''
    try {
      const persist = persistGroups?.value
      const groupsToPersist = persist?.length
        ? applyPartialNavReorder(persist, draftGroups.value)
        : draftGroups.value

      const existing = cms.navigation.value.filter(n => n.role !== r)
      const roleItems = cmsNavItemsFromGroups(groupsToPersist, r)
      const merged = [
        ...existing,
        ...roleItems.map((it, idx) => ({
          ...it,
          order_index: idx
        }))
      ]
      await cms.saveNavigation(merged)
      localEditMode.value = false
    } catch (e) {
      errorMsg.value = getApiErrorMessage(e)
    } finally {
      saving.value = false
    }
  }

  const displayGroups = computed(() =>
    editMode.value ? draftGroups.value : sourceGroups.value
  )

  return {
    displayGroups,
    editMode,
    canEditNav,
    saving,
    errorMsg,
    startEdit,
    cancelEdit,
    onDragStart,
    onDrop,
    saveOrder
  }
}

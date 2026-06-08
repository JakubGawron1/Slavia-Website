import type { ClubHistoryMilestone } from '~/data/clubHistoryMilestones'
import {
  CLUB_HISTORY_TIMELINE_FIELD,
  defaultClubHistoryMilestones,
  parseClubHistoryMilestones,
  serializeClubHistoryMilestones
} from '~/utils/clubHistoryMilestonesCms'

export function useClubHistoryMilestones(pageName?: MaybeRefOrGetter<string | undefined>) {
  const cms = useCms()
  const resolvedPageName = computed(() => toValue(pageName)?.trim() || '')

  async function ensurePageLoaded(name: string) {
    if (!name || cms.pages.value[name]) return
    await cms.fetchPagePublic(name).catch(() => null)
  }

  if (import.meta.client) {
    watch(
      resolvedPageName,
      (name) => {
        if (name) void ensurePageLoaded(name)
      },
      { immediate: true }
    )
  }

  const milestones = computed<ClubHistoryMilestone[]>(() => {
    const name = resolvedPageName.value
    if (!name) return defaultClubHistoryMilestones()
    const field = cms.pages.value[name]?.fields?.[CLUB_HISTORY_TIMELINE_FIELD]
    const parsed = parseClubHistoryMilestones(field?.value)
    return parsed ?? defaultClubHistoryMilestones()
  })

  const usesCmsOverride = computed(() => {
    const name = resolvedPageName.value
    if (!name) return false
    const field = cms.pages.value[name]?.fields?.[CLUB_HISTORY_TIMELINE_FIELD]
    return parseClubHistoryMilestones(field?.value) != null
  })

  async function saveMilestones(list: ClubHistoryMilestone[]) {
    const name = resolvedPageName.value
    if (!name) throw new Error('Brak nazwy strony CMS')
    await ensurePageLoaded(name)
    const page = cms.pages.value[name]
    const fields = { ...(page?.fields ?? {}) }
    fields[CLUB_HISTORY_TIMELINE_FIELD] = {
      type: 'text',
      value: serializeClubHistoryMilestones(list),
      label: 'Oś czasu — kamienie milowe'
    }
    await cms.savePage(name, fields)
  }

  return {
    milestones,
    usesCmsOverride,
    saveMilestones,
    ensurePageLoaded
  }
}

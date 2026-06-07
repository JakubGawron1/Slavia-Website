import type { CmsVariable } from '~/types/cms'
import { cmsDataVariableDefs } from '~/data/cmsPageDataVariables'

export interface CmsEditorVariableItem {
  key: string
  token: string
  /** Aktualna wartość po merge (API + ewentualne nadpisanie CMS). */
  preview: string
  /** Wartość na żywo z API — do podglądu i przywracania. */
  livePreview: string
  label?: string
  source: 'global' | 'data'
  /** Czy wartość została nadpisana w cms_variables. */
  overridden: boolean
}

function variablePreviewValue(value: string): string {
  if (!value) return '— brak danych —'
  return value.length > 48 ? `${value.slice(0, 48)}…` : value
}

function globalToItem(v: CmsVariable, effective: string): CmsEditorVariableItem {
  const raw = v.value == null ? '' : String(v.value)
  return {
    key: v.key,
    token: `{${v.key}}`,
    preview: raw ? variablePreviewValue(effective || raw) : '— pusta —',
    livePreview: raw ? variablePreviewValue(raw) : '— pusta —',
    source: 'global',
    overridden: true
  }
}

/** Lista zmiennych do UI edycji CMS (globalne + dynamiczne z bazy). */
export function useCmsVariableList(pageName: MaybeRefOrGetter<string>) {
  const cms = useCms()

  const globalVariables = computed(() => {
    const name = toValue(pageName)
    const map = cms.variableMapForPage(name)
    return [...cms.variables.value]
      .sort((a, b) => a.key.localeCompare(b.key, 'pl'))
      .map(v => globalToItem(v, map[v.key] ?? ''))
  })

  const dataVariables = computed((): CmsEditorVariableItem[] => {
    const name = toValue(pageName)
    const map = cms.variableMapForPage(name)
    const storedKeys = new Set(cms.variables.value.map(v => v.key))
    return cmsDataVariableDefs(name).map((def) => {
      const effective = map[def.key] ?? ''
      const live = cms.getLiveVariableValue(def.key, name)
      return {
        key: def.key,
        token: `{${def.key}}`,
        preview: variablePreviewValue(effective),
        livePreview: variablePreviewValue(live),
        label: def.label,
        source: 'data',
        overridden: storedKeys.has(def.key)
      }
    })
  })

  /** Globalne, które nie są w katalogu danych bieżącej strony. */
  const globalOnlyVariables = computed(() => {
    const dataKeys = new Set(dataVariables.value.map(d => d.key))
    return globalVariables.value.filter(g => !dataKeys.has(g.key))
  })

  const allVariables = computed(() => {
    const seen = new Set<string>()
    const out: CmsEditorVariableItem[] = []
    for (const item of [...dataVariables.value, ...globalOnlyVariables.value]) {
      if (seen.has(item.key)) continue
      seen.add(item.key)
      out.push(item)
    }
    return out.sort((a, b) => a.key.localeCompare(b.key, 'pl'))
  })

  return {
    globalVariables: globalOnlyVariables,
    dataVariables,
    allVariables
  }
}

export function cmsVariableToken(key: string) {
  return `{${key}}`
}

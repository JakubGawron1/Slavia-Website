import type { CmsVariable } from '~/types/cms'

const VAR_PATTERN = /\{([a-zA-Z0-9_-]+)\}/g

/** Wykrywa odwołania `{nazwa_zmiennej}` w treści. */
export function extractVariableRefs(content: string): string[] {
  const keys = new Set<string>()
  for (const m of content.matchAll(VAR_PATTERN)) {
    if (m[1]) keys.add(m[1])
  }
  return [...keys]
}

/** Podmienia `{klucz}` wartościami zmiennych CMS. */
export function interpolateCmsVariables(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(VAR_PATTERN, (_full, key: string) => {
    if (key in variables) return variables[key] ?? ''
    return `{${key}}`
  })
}

export function variablesToMap(vars: CmsVariable[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const v of vars) {
    if (v.value == null) continue
    out[v.key] = String(v.value)
  }
  return out
}

/** Czy fragment to odwołanie do zmiennej (nie zwykły tekst). */
export function isVariablePlaceholder(text: string): boolean {
  return /^\{[a-zA-Z0-9_-]+\}$/.test(text.trim())
}

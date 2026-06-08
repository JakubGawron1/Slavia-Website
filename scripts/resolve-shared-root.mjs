import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Lokalny dev: preferuj osobny klon `../Slavia-shared` (pełny folder projektu).
 * CI / Vercel: fallback na submodule `./Slavia-shared`.
 */
export function resolveSharedRoot(fromDir) {
  const root = fromDir ?? resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const sibling = resolve(root, '../Slavia-shared')
  if (existsSync(resolve(sibling, 'package.json'))) {
    return sibling
  }
  const submodule = resolve(root, 'Slavia-shared')
  if (existsSync(resolve(submodule, 'package.json'))) {
    return submodule
  }
  return submodule
}

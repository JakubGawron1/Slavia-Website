import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Lokalny dev: ../Slavia-shared; CI/Vercel: submodule ./Slavia-shared */
export function resolveSlaviaSharedRoot(projectRoot: string): string {
  const sibling = resolve(projectRoot, '../Slavia-shared')
  if (existsSync(resolve(sibling, 'package.json'))) {
    return sibling
  }
  return resolve(projectRoot, 'Slavia-shared')
}

/**
 * Mapuje `exports` z package.json shared na aliasy Vite (tylko subpath).
 * Nie aliasujemy `@slavia/shared` (root) — prefix kradnie podścieżki
 * (`/data/theme-presets.json` → `index.ts/data/...`).
 */
export function slaviaSharedViteAliases(sharedRoot: string): Record<string, string> {
  const pkgPath = resolve(sharedRoot, 'package.json')
  if (!existsSync(pkgPath)) {
    return {}
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    exports?: Record<string, string>
  }

  const aliases: Record<string, string> = {}
  for (const [subpath, target] of Object.entries(pkg.exports ?? {})) {
    if (subpath === '.' || typeof target !== 'string') continue
    if (!subpath.startsWith('./')) continue
    aliases[`@slavia/shared/${subpath.slice(2)}`] = resolve(sharedRoot, target.replace(/^\.\//, ''))
  }
  return aliases
}

export function slaviaSharedRootFromConfigDir(): string {
  const configDir = dirname(fileURLToPath(import.meta.url))
  return resolveSlaviaSharedRoot(resolve(configDir, '..'))
}

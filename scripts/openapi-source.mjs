import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const OPENAPI_PATHS = {
  backend: resolve(root, '../Slavia-backend/src/embed/openapi.json'),
  generated: resolve(root, 'app/types/generated/openapi.types.ts')
}

/** Backend lokalnie lub shallow clone w CI (`../Slavia-backend`). */
export function resolveOpenApiSource() {
  if (existsSync(OPENAPI_PATHS.backend)) {
    return { path: OPENAPI_PATHS.backend, kind: 'backend' }
  }
  return null
}

export function countOpenApiPaths(path) {
  const doc = JSON.parse(readFileSync(path, 'utf8'))
  return Object.keys(doc.paths ?? {}).filter(p => p.startsWith('/api/')).length
}

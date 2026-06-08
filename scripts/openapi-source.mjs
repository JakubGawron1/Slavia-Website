import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Submodule w repo frontendu (CI / Vercel) lub klon obok (`../Slavia-shared`) lokalnie. */
function resolveSharedRoot() {
  const inRepo = resolve(root, 'Slavia-shared')
  if (existsSync(inRepo)) return inRepo
  const sibling = resolve(root, '../Slavia-shared')
  if (existsSync(sibling)) return sibling
  return inRepo
}

const sharedRoot = resolveSharedRoot()

export const OPENAPI_PATHS = {
  backend: resolve(root, '../Slavia-backend/src/embed/openapi.json'),
  shared: resolve(sharedRoot, 'openapi/openapi.json'),
  sharedSha: resolve(sharedRoot, 'openapi/openapi.sha256'),
  snapshot: resolve(sharedRoot, 'openapi/openapi.json'),
  snapshotSha: resolve(sharedRoot, 'openapi/openapi.sha256'),
  generated: resolve(root, 'app/types/generated/openapi.types.ts')
}

/** Backend lokalnie; w CI / Vercel — kanoniczny snapshot w Slavia-shared (submodule). */
export function resolveOpenApiSource() {
  if (existsSync(OPENAPI_PATHS.backend)) {
    return { path: OPENAPI_PATHS.backend, kind: 'backend' }
  }
  if (existsSync(OPENAPI_PATHS.shared)) {
    return { path: OPENAPI_PATHS.shared, kind: 'shared' }
  }
  return null
}

export function sha256File(path) {
  const raw = readFileSync(path)
  return createHash('sha256').update(raw).digest('hex')
}

export function countOpenApiPaths(path) {
  const doc = JSON.parse(readFileSync(path, 'utf8'))
  return Object.keys(doc.paths ?? {}).length
}

export function readSnapshotSha() {
  if (!existsSync(OPENAPI_PATHS.sharedSha)) return null
  return readFileSync(OPENAPI_PATHS.sharedSha, 'utf8').trim().split(/\s+/)[0] ?? null
}

export function writeSnapshotSha(hash) {
  writeFileSync(OPENAPI_PATHS.sharedSha, `${hash}\n`, 'utf8')
}

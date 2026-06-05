import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const OPENAPI_PATHS = {
  backend: resolve(root, '../Slavia-backend/src/embed/openapi.json'),
  snapshot: resolve(root, 'openapi/openapi.snapshot.json'),
  snapshotSha: resolve(root, 'openapi/openapi.snapshot.sha256'),
  generated: resolve(root, 'app/types/generated/openapi.types.ts')
}

/** Backend lokalnie, w CI — commitowany snapshot. */
export function resolveOpenApiSource() {
  if (existsSync(OPENAPI_PATHS.backend)) {
    return { path: OPENAPI_PATHS.backend, kind: 'backend' }
  }
  if (existsSync(OPENAPI_PATHS.snapshot)) {
    return { path: OPENAPI_PATHS.snapshot, kind: 'snapshot' }
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
  if (!existsSync(OPENAPI_PATHS.snapshotSha)) return null
  return readFileSync(OPENAPI_PATHS.snapshotSha, 'utf8').trim().split(/\s+/)[0] ?? null
}

export function writeSnapshotSha(hash) {
  writeFileSync(OPENAPI_PATHS.snapshotSha, `${hash}\n`, 'utf8')
}

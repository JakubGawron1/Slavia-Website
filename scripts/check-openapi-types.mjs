#!/usr/bin/env node
/**
 * Weryfikuje drift typów OpenAPI względem backendu lub commitowanego snapshotu.
 * CI nie wymaga sąsiedniego Slavia-backend — wystarczy openapi/openapi.snapshot.json + .sha256.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  OPENAPI_PATHS,
  countOpenApiPaths,
  readSnapshotSha,
  resolveOpenApiSource,
  sha256File
} from './openapi-source.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function validateGenerated(ts, expectedPathCount) {
  if (!ts.includes('export interface paths')) {
    console.error('openapi.types.ts — brak `export interface paths`')
    process.exit(1)
  }
  const pathKeys = [...ts.matchAll(/^\s{4}"(\/api\/[^"]+)":/gm)]
  if (pathKeys.length < expectedPathCount) {
    console.error(
      `openapi.types.ts — oczekiwano >= ${expectedPathCount} ścieżek, znaleziono ${pathKeys.length}`
    )
    process.exit(1)
  }
  if (ts.includes('schemas: never')) {
    console.warn(
      'UWAGA: OpenAPI nie definiuje components.schemas — typy domenowe nadal w models.ts.\n'
      + '  Rozszerz embed openapi.json w backendzie, potem pnpm openapi:snapshot.'
    )
  }
}

if (!existsSync(OPENAPI_PATHS.generated)) {
  console.error('Brak app/types/generated/openapi.types.ts — uruchom: pnpm openapi:types')
  process.exit(1)
}

const source = resolveOpenApiSource()
if (!source) {
  console.error(
    'Brak źródła OpenAPI (backend ani openapi/openapi.snapshot.json).\n'
    + 'CI wymaga commitowanego snapshotu — uruchom lokalnie: pnpm openapi:snapshot'
  )
  process.exit(1)
}

if (source.kind === 'snapshot') {
  const expectedSha = readSnapshotSha()
  if (!expectedSha) {
    console.error('Brak openapi/openapi.snapshot.sha256 — uruchom: pnpm openapi:snapshot')
    process.exit(1)
  }
  const actualSha = sha256File(source.path)
  if (actualSha !== expectedSha) {
    console.error(
      'Hash snapshotu OpenAPI nie zgadza się z openapi/openapi.snapshot.sha256.\n'
      + `  oczekiwano: ${expectedSha}\n`
      + `  aktualny:   ${actualSha}\n`
      + 'Uruchom: pnpm openapi:snapshot'
    )
    process.exit(1)
  }
}

const expectedPathCount = countOpenApiPaths(source.path)
const before = readFileSync(OPENAPI_PATHS.generated, 'utf8')

try {
  execSync(`node scripts/openapi-generate-types.mjs`, {
    cwd: root,
    stdio: 'pipe',
    env: process.env
  })
} catch (e) {
  console.error('Generowanie typów nie powiodło się:', e.stderr?.toString() || e.message)
  process.exit(1)
}

const after = readFileSync(OPENAPI_PATHS.generated, 'utf8')
validateGenerated(after, expectedPathCount)

if (before !== after) {
  console.error(
    'Typy OpenAPI są niezsynchronizowane.\n'
    + 'Uruchom lokalnie: pnpm openapi:types\n'
    + 'Jeśli zmienił się backend: pnpm openapi:snapshot && pnpm openapi:types\n'
    + 'Zacommituj: openapi/ oraz app/types/generated/openapi.types.ts'
  )
  process.exit(1)
}

console.log(`OK: openapi.types.ts zsynchronizowany (${source.kind}, ${expectedPathCount} ścieżek)`)

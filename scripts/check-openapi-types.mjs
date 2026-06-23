#!/usr/bin/env node
/**
 * Weryfikuje drift typów OpenAPI względem backendu (`../Slavia-backend`).
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  OPENAPI_PATHS,
  countOpenApiPaths,
  resolveOpenApiSource
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
      + '  Rozszerz embed openapi.json w backendzie, potem pnpm openapi:types.'
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
    'Brak źródła OpenAPI (../Slavia-backend/src/embed/openapi.json).\n'
    + 'CI: shallow clone Slavia-backend obok workspace.\n'
    + 'Lokalnie: sklonuj backend obok frontendu.'
  )
  process.exit(1)
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
    + 'Jeśli zmienił się backend: zaktualizuj embed w Slavia-backend, potem pnpm openapi:types\n'
    + 'Zacommituj: app/types/generated/openapi.types.ts'
  )
  process.exit(1)
}

console.log(`OK: openapi.types.ts zsynchronizowany (${source.kind}, ${expectedPathCount} ścieżek)`)

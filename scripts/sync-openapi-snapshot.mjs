#!/usr/bin/env node
/**
 * Kopiuje openapi.json z backendu do Slavia-shared (kanoniczny kontrakt API).
 * Uruchom po zmianie kontraktu API w Slavia-backend.
 */
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  OPENAPI_PATHS,
  sha256File,
  writeSnapshotSha
} from './openapi-source.mjs'
import { resolveSharedRoot } from './resolve-shared-root.mjs'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (!existsSync(OPENAPI_PATHS.backend)) {
  console.error('Brak ../Slavia-backend/src/embed/openapi.json — uruchom z klonem backendu obok frontendu.')
  process.exit(1)
}

if (!existsSync(OPENAPI_PATHS.shared.replace(/openapi\.json$/, ''))) {
  console.error(
    'Brak Slavia-shared/openapi — zainicjuj submodule:\n'
    + '  git submodule update --init --recursive'
  )
  process.exit(1)
}

copyFileSync(OPENAPI_PATHS.backend, OPENAPI_PATHS.shared)
const hash = sha256File(OPENAPI_PATHS.shared)
writeSnapshotSha(hash)
const sharedRoot = resolveSharedRoot(frontendRoot)
const isSubmodule = resolve(sharedRoot) === resolve(frontendRoot, 'Slavia-shared')
const sharedLabel = isSubmodule
  ? 'Slavia-frontend/Slavia-shared (submodule)'
  : 'Slavia-shared (osobny klon)'

console.log('OK: zsynchronizowano Slavia-shared/openapi/openapi.json')
console.log('SHA256:', hash)
console.log(`Zapisano w: ${sharedRoot}`)
console.log('')
console.log('Następnie:')
console.log(`  1. W ${sharedLabel}:`)
console.log('       git add openapi/openapi.json openapi/openapi.sha256')
console.log('       git commit -m "chore(openapi): sync snapshot from backend"')
console.log('       git push')
console.log('  2. W Slavia-frontend:')
console.log('       pnpm openapi:types')
console.log('       git add app/types/generated/openapi.types.ts')
console.log('')
console.log('Uwaga: nie używaj git add Slavia-shared/openapi/ z poziomu frontendu — to submodule; commit openapi idzie w repo Slavia-shared.')

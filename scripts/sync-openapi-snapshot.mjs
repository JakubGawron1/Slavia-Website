#!/usr/bin/env node
/**
 * Kopiuje openapi.json z backendu do Slavia-shared (kanoniczny kontrakt API).
 * Uruchom po zmianie kontraktu API w Slavia-backend.
 */
import { copyFileSync, existsSync } from 'node:fs'
import {
  OPENAPI_PATHS,
  sha256File,
  writeSnapshotSha
} from './openapi-source.mjs'

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
console.log('OK: zsynchronizowano Slavia-shared/openapi/openapi.json')
console.log('SHA256:', hash)
console.log('Następnie: pnpm openapi:types && git add Slavia-shared/openapi/ app/types/generated/openapi.types.ts')

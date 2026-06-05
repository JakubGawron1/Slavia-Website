#!/usr/bin/env node
/**
 * Kopiuje openapi.json z backendu do openapi/openapi.snapshot.json (commit w repo frontend).
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

copyFileSync(OPENAPI_PATHS.backend, OPENAPI_PATHS.snapshot)
const hash = sha256File(OPENAPI_PATHS.snapshot)
writeSnapshotSha(hash)
console.log('OK: zsynchronizowano openapi/openapi.snapshot.json')
console.log('SHA256:', hash)
console.log('Następnie: pnpm openapi:types && git add openapi/ app/types/generated/openapi.types.ts')

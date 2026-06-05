#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OPENAPI_PATHS, resolveOpenApiSource } from './openapi-source.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolveOpenApiSource()

if (!source) {
  console.error(
    'Brak źródła OpenAPI.\n'
    + '  — lokalnie: sklonuj Slavia-backend obok frontendu, lub\n'
    + '  — uruchom: pnpm openapi:snapshot (wymaga backendu), lub\n'
    + '  — zacommituj openapi/openapi.snapshot.json w repozytorium.'
  )
  process.exit(1)
}

execSync(
  `pnpm exec openapi-typescript "${source.path}" -o "${OPENAPI_PATHS.generated}"`,
  { cwd: root, stdio: 'inherit', env: process.env }
)

console.log(`Wygenerowano typy z: ${source.kind} (${source.path})`)

#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveSharedRoot } from './resolve-shared-root.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const shared = resolveSharedRoot(root)
execSync('npm test', { cwd: shared, stdio: 'inherit' })

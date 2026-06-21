#!/usr/bin/env node
/**
 * F-13 — raport rozmiaru chunków JS po `pnpm build`.
 *
 * Skanuje `.output/public/_nuxt` (rekurencyjnie pliki `.js`), sumuje bajty i ostrzega gdy próg przekroczony.
 * Domyślnie exit 0 (tylko ostrzeżenie); `--fail` kończy z kodem 1 dla CI po ustaleniu progu.
 *
 * @example
 * pnpm build && pnpm bundle:report
 * SLAVIA_BUNDLE_JS_MAX_KB=10240 pnpm bundle:report --fail
 * node scripts/bundle-report.mjs --dir=.output/public/_nuxt --top=15
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** @type {number} Lokalny fallback (tylko ostrzeżenie); CI: 5500 KiB (~4415 KiB baseline + headroom). */
const DEFAULT_MAX_JS_KB = 12_288

function parseArgs(argv) {
  const out = {
    dir: join(root, '.output', 'public', '_nuxt'),
    maxKb: null,
    top: 10,
    fail: false,
    json: false
  }
  for (const arg of argv) {
    if (arg === '--fail') out.fail = true
    if (arg === '--json') out.json = true
    if (arg.startsWith('--dir=')) out.dir = resolve(arg.slice(6))
    if (arg.startsWith('--top=')) out.top = Math.max(1, Number.parseInt(arg.slice(6), 10) || 10)
    if (arg.startsWith('--max-kb=')) out.maxKb = Number.parseInt(arg.slice(9), 10)
  }
  return out
}

function resolveMaxKb(cliMaxKb) {
  if (cliMaxKb != null && Number.isFinite(cliMaxKb) && cliMaxKb > 0) {
    return cliMaxKb
  }
  const env = process.env.SLAVIA_BUNDLE_JS_MAX_KB
  if (env) {
    const parsed = Number.parseInt(env, 10)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return DEFAULT_MAX_JS_KB
}

/**
 * @param {string} dir
 * @returns {{ path: string; bytes: number }[]}
 */
function collectJsFiles(dir) {
  /** @type {{ path: string; bytes: number }[]} */
  const files = []
  if (!existsSync(dir)) return files

  /** @param {string} current */
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push({ path: full, bytes: statSync(full).size })
      }
    }
  }

  walk(dir)
  return files
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

function formatMiB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const maxKb = resolveMaxKb(args.maxKb)
  const maxBytes = maxKb * 1024
  const nuxtDir = args.dir

  if (!existsSync(nuxtDir)) {
    console.error(
      `Brak katalogu chunków: ${relative(root, nuxtDir) || nuxtDir}\n`
      + '  Uruchom najpierw: pnpm build'
    )
    process.exit(1)
  }

  const files = collectJsFiles(nuxtDir)
  if (files.length === 0) {
    console.error(
      `Brak plików .js w ${relative(root, nuxtDir) || nuxtDir}.\n`
      + '  Sprawdź czy build Nuxt zakończył się poprawnie.'
    )
    process.exit(1)
  }

  files.sort((a, b) => b.bytes - a.bytes)
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0)
  const overThreshold = totalBytes > maxBytes

  if (args.json) {
    const payload = {
      dir: relative(root, nuxtDir) || nuxtDir,
      fileCount: files.length,
      totalBytes,
      totalKiB: Math.round(totalBytes / 1024),
      maxKb,
      overThreshold,
      top: files.slice(0, args.top).map((f) => ({
        file: relative(nuxtDir, f.path).replace(/\\/g, '/'),
        bytes: f.bytes
      }))
    }
    console.log(JSON.stringify(payload, null, 2))
  } else {
    console.log('== Slavia bundle report (F-13) ==')
    console.log(`Katalog: ${relative(root, nuxtDir) || nuxtDir}`)
    console.log(`Pliki JS: ${files.length}`)
    console.log(`Suma JS:  ${formatKiB(totalBytes)} (${formatMiB(totalBytes)})`)
    console.log(`Próg:     ${maxKb} KiB (${formatMiB(maxBytes)})`)
    console.log('')
    console.log(`Top ${Math.min(args.top, files.length)} chunków:`)
    for (const file of files.slice(0, args.top)) {
      const name = relative(nuxtDir, file.path).replace(/\\/g, '/')
      console.log(`  ${formatKiB(file.bytes).padStart(12)}  ${name}`)
    }
    if (overThreshold) {
      const overKiB = Math.ceil((totalBytes - maxBytes) / 1024)
      console.warn(
        `\nUWAGA: suma JS przekracza próg o ~${overKiB} KiB.`
        + ' TODO(F-13): dostosuj DEFAULT_MAX_JS_KB po pomiarze baseline.'
      )
    } else {
      console.log('\nOK: suma JS w progu.')
    }
  }

  if (overThreshold && args.fail) {
    process.exit(1)
  }
}

main()

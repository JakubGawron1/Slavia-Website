#!/usr/bin/env node
/**
 * Post-deploy smoke — Hugging Face backend + Vercel frontend.
 *
 * Sprawdza:
 *   1. GET {HF}/api/health (lub SLAVIA_HF_HEALTH_PATH)
 *   2. GET {SITE}/api/system/backend-provider (lub SLAVIA_SITE_SMOKE_PATH, np. /)
 *
 * Exit 0 = OK, 1 = błąd (CI, ręczny release check).
 *
 * @example
 * SLAVIA_HF_API_URL=https://koliber-cks-slavia.hf.space \
 * SLAVIA_SITE_URL=https://cksslavia.vercel.app \
 * node scripts/post-deploy-smoke.mjs
 */
const TIMEOUT_MS = 20_000

function trimSlash(url) {
  return url.replace(/\/$/, '')
}

function parseArgs(argv) {
  const out = {}
  for (const arg of argv) {
    if (arg.startsWith('--hf-url=')) out.hfUrl = arg.slice(9)
    if (arg.startsWith('--site-url=')) out.siteUrl = arg.slice(11)
    if (arg.startsWith('--site-path=')) out.sitePath = arg.slice(12)
    if (arg.startsWith('--hf-health-path=')) out.hfHealthPath = arg.slice(17)
  }
  return out
}

function resolveConfig(args) {
  const hfUrl = trimSlash(
    args.hfUrl
    || process.env.SLAVIA_HF_API_URL
    || process.env.SLAVIA_API_BASE_URL
    || process.env.NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE
    || ''
  )
  const siteUrl = trimSlash(
    args.siteUrl
    || process.env.SLAVIA_SITE_URL
    || process.env.SLAVIA_BFF_URL
    || process.env.NUXT_PUBLIC_SITE_URL
    || ''
  )
  const hfHealthPath = args.hfHealthPath
    || process.env.SLAVIA_HF_HEALTH_PATH
    || '/api/health'
  const sitePath = args.sitePath
    || process.env.SLAVIA_SITE_SMOKE_PATH
    || '/api/system/backend-provider'

  return { hfUrl, siteUrl, hfHealthPath, sitePath }
}

function joinUrl(base, path) {
  if (!path.startsWith('/')) {
    return `${base}/${path}`
  }
  return `${base}${path}`
}

/**
 * @param {string} label
 * @param {string} url
 * @param {(res: Response) => Promise<boolean> | boolean} [validate]
 */
async function ping(label, url, validate) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: '*/*' }
    })
    if (!res.ok) {
      console.error(`FAIL ${label}: ${url} → HTTP ${res.status}`)
      return false
    }
    if (validate) {
      const valid = await validate(res)
      if (!valid) {
        console.error(`FAIL ${label}: ${url} → nieprawidłowa odpowiedź`)
        return false
      }
    }
    console.log(`OK   ${label}: ${url} → ${res.status}`)
    return true
  } catch (err) {
    const message = err instanceof Error
      ? (err.name === 'AbortError' ? 'timeout' : err.message)
      : String(err)
    console.error(`FAIL ${label}: ${url} → ${message}`)
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function validateHealthResponse(res) {
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (!ct.includes('json')) {
    return true
  }
  try {
    const body = await res.json()
    if (body && typeof body === 'object' && 'ok' in body && body.ok === false) {
      return false
    }
    return true
  } catch {
    return false
  }
}

async function validateSiteResponse(res, sitePath) {
  if (sitePath === '/' || sitePath === '') {
    return true
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (!ct.includes('json')) {
    return false
  }
  try {
    const body = await res.json()
    return body?.active_provider === 'huggingface' || body?.active_provider === 'render'
  } catch {
    return false
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { hfUrl, siteUrl, hfHealthPath, sitePath } = resolveConfig(args)

  if (!hfUrl) {
    console.error(
      'Brak URL backendu HF.\n'
      + '  Ustaw SLAVIA_HF_API_URL, SLAVIA_API_BASE_URL lub --hf-url=https://…'
    )
    process.exit(1)
  }
  if (!siteUrl) {
    console.error(
      'Brak URL frontendu Vercel.\n'
      + '  Ustaw SLAVIA_SITE_URL, SLAVIA_BFF_URL, NUXT_PUBLIC_SITE_URL lub --site-url=https://…'
    )
    process.exit(1)
  }

  const hfTarget = joinUrl(hfUrl, hfHealthPath)
  const siteTarget = joinUrl(siteUrl, sitePath)

  console.log('== Slavia post-deploy smoke ==')
  console.log(`HF:   ${hfTarget}`)
  console.log(`Site: ${siteTarget}`)
  console.log('')

  const hfOk = await ping('HF /api/health', hfTarget, validateHealthResponse)
  const siteOk = await ping(
    `Vercel ${sitePath}`,
    siteTarget,
    (res) => validateSiteResponse(res, sitePath)
  )

  if (hfOk && siteOk) {
    console.log('\nPost-deploy smoke OK.')
    process.exit(0)
  }

  console.error('\nPost-deploy smoke FAILED.')
  process.exit(1)
}

main()

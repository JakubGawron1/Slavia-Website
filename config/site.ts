import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { backendProviderFromEnv } from '../app/utils/backendProviderTypes'

export function readPackageJsonVersion(): string {
  const path = fileURLToPath(new URL('../package.json', import.meta.url))
  const pkg = JSON.parse(readFileSync(path, 'utf-8')) as { version?: string }
  return pkg.version?.trim() || '0.0.0'
}

/** Etykieta w UI — jak w package.json, z prefiksem `v`. */
export function formatPublicAppVersion(raw: string): string {
  return raw.startsWith('v') ? raw : `v${raw}`
}

/** Publiczny URL aplikacji: jawna zmienna albo automatycznie na Vercel (Preview/Production). */
export function resolvePublicSiteUrl(): string {
  const explicit = (process.env.NUXT_PUBLIC_SITE_URL || '').trim()
  if (explicit) {
    return explicit
  }
  const vercel = (process.env.VERCEL_URL || '').trim()
  if (vercel) {
    return `https://${vercel}`
  }
  return 'http://localhost:3000'
}

function isLocalhostApiUrl(url: string): boolean {
  const u = url.trim().toLowerCase()
  return !u || u.includes('127.0.0.1') || u.includes('localhost')
}

/** Lokalny dev: honoruj .env (localhost:8080 OK). Na Vercel: Hugging Face (domyślnie) lub Render. */
export function resolveBuildTimeApiBase(): string {
  const explicit = (process.env.NUXT_PUBLIC_API_BASE_URL || '').trim()
  const render = (process.env.NUXT_PUBLIC_API_BASE_URL_RENDER || explicit || '').trim()
  const huggingface = (process.env.NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE || explicit || '').trim()
  const provider = backendProviderFromEnv()

  const ordered = provider === 'render'
    ? [render, huggingface, explicit]
    : [huggingface, render, explicit]

  if (!process.env.VERCEL) {
    for (const candidate of ordered) {
      if (candidate) {
        return candidate.replace(/\/$/, '')
      }
    }
    return 'http://127.0.0.1:8080'
  }

  for (const candidate of ordered) {
    if (candidate && !isLocalhostApiUrl(candidate)) {
      return candidate.replace(/\/$/, '')
    }
  }
  return 'http://127.0.0.1:8080'
}

import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const dir = resolve(process.cwd(), '.nuxt', 'cache', 'nuxt', 'payload')

// Uruchom od razu przy imporcie modułu (zanim przyjdą requesty).
try {
  mkdirSync(dir, { recursive: true })
} catch {
  // ignore
}

export default defineNitroPlugin(() => {
  // Dev: Nuxt zapisuje cache payloadu SSR — na Windows katalog potrafi nie istnieć (ENOENT).
  if (!import.meta.dev) return
  try {
    mkdirSync(dir, { recursive: true })
  } catch {
    // Cicho — brak możliwości zapisu i tak ujawni się przy renderze.
  }
})


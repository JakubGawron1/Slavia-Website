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
  // Dev-only: Nuxt/Nitro zapisuje cache payloadu dla ISR.
  // Na Windows katalog potrafi nie istnieć i zapis kończy się ENOENT.
  if (!import.meta.dev) return
  try {
    mkdirSync(dir, { recursive: true })
  } catch {
    // Cicho — brak możliwości zapisu i tak ujawni się przy renderze.
  }
})


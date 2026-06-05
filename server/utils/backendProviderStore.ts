type BackendProvider = 'leapcell' | 'render'

/**
 * Vercel Blob domyślnie wyłączony. Jawne włączenie: `SLAVIA_ENABLE_BLOB=1` (produkcja + token).
 * Awaryjne wyłączenie mimo flagi: `SLAVIA_DISABLE_BLOB=1` lub `DISABLE_VERCEL_BLOB=1`.
 */
function blobGloballyEnabled(): boolean {
  const kill = (process.env.SLAVIA_DISABLE_BLOB || process.env.DISABLE_VERCEL_BLOB || '').trim().toLowerCase()
  if (kill === '1' || kill === 'true' || kill === 'yes') {
    return false
  }
  const v = (process.env.SLAVIA_ENABLE_BLOB || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

const STORE_KEY = 'active_backend_provider'
const VER_CEL_BLOB_PATH = 'slavia-config/active_backend_provider.json'
const VERCEL_BLOB_PREFIX = 'slavia-config/'

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

function normalizeProvider(raw: unknown): BackendProvider {
  if (typeof raw === 'string') {
    const normalized = raw.toLowerCase()
    if (normalized === 'render') {
      return 'render'
    }
  }
  return 'leapcell'
}

async function readFromNetlify(): Promise<BackendProvider | null> {
  if (process.env.NETLIFY !== 'true') return null
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('slavia-config')
    const val = await store.get(STORE_KEY)
    return normalizeProvider(val)
  } catch {
    return null
  }
}

async function writeToNetlify(provider: BackendProvider): Promise<boolean> {
  if (process.env.NETLIFY !== 'true') return false
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('slavia-config')
    await store.set(STORE_KEY, provider)
    return true
  } catch {
    return false
  }
}

async function readFromVercelBlob(): Promise<BackendProvider | null> {
  if (!blobGloballyEnabled()) return null
  if (!isProductionRuntime() || !process.env.BLOB_READ_WRITE_TOKEN) return null
  try {
    const { list } = await import('@vercel/blob')
    const listed = await list({ prefix: VERCEL_BLOB_PREFIX, limit: 100 })
    const blob = listed.blobs
      .filter(b => b.pathname === VER_CEL_BLOB_PATH)
      .sort((a, b) => (new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()))[0]
    if (!blob?.url) return null
    const candidateUrl =
      ((blob as unknown as { downloadUrl?: string }).downloadUrl && String((blob as unknown as { downloadUrl?: string }).downloadUrl))
      || blob.url
    const res = await fetch(candidateUrl, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Vercel Blob read failed: HTTP ${res.status}`)
    }
    const payload = (await res.json()) as { active_provider?: string }
    return normalizeProvider(payload.active_provider)
  } catch (e) {
    console.error('[backendProviderStore] readFromVercelBlob error:', e)
    return null
  }
}

async function writeToVercelBlob(provider: BackendProvider): Promise<boolean> {
  if (!blobGloballyEnabled()) return false
  if (!isProductionRuntime()) return false
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Brak BLOB_READ_WRITE_TOKEN w środowisku Vercel.'
    })
  }
  try {
    const { put } = await import('@vercel/blob')
    await put(
      VER_CEL_BLOB_PATH,
      JSON.stringify({
        active_provider: provider,
        updated_at: new Date().toISOString()
      }),
      {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      }
    )
    return true
  } catch (e) {
    console.error('[backendProviderStore] writeToVercelBlob error:', e)
    return false
  }
}

export async function getGlobalBackendProvider(): Promise<BackendProvider> {
  const netlify = await readFromNetlify()
  if (netlify) return netlify
  const vercel = await readFromVercelBlob()
  if (vercel) return vercel
  return normalizeProvider(process.env.DEFAULT_BACKEND_PROVIDER)
}

export async function setGlobalBackendProvider(providerRaw: unknown): Promise<BackendProvider> {
  const provider = normalizeProvider(providerRaw)
  const netlifyOk = await writeToNetlify(provider)
  if (netlifyOk) return provider
  const vercelOk = await writeToVercelBlob(provider)
  if (vercelOk) return provider
  throw createError({
    statusCode: 500,
    statusMessage: 'Brak skonfigurowanego storage (Netlify Blobs / Vercel Blob).'
  })
}


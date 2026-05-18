/**
 * Zasoby galerii / mediów z repozytorium Slavia-cms (GitHub raw lub Pages).
 *
 * Konfiguracja: `NUXT_PUBLIC_CMS_BASE_URL` — np.
 * `https://raw.githubusercontent.com/JakubGawron1/Slavia-cms/main`
 * lub `https://jakubgawron1.github.io/Slavia-cms`
 */
export function cmsAssetUrl(path: string, cmsBase?: string): string {
  const base = (cmsBase || '').replace(/\/$/, '')
  if (!base) {
    return path
  }
  const clean = path.replace(/^\//, '')
  return `${base}/${clean}`
}

/** Czy URL wygląda jak zasób z CMS (raw GitHub / github.io). */
export function isCmsAssetUrl(url: string): boolean {
  const u = url.trim().toLowerCase()
  return u.includes('raw.githubusercontent.com/') && u.includes('slavia-cms')
    || u.includes('github.io/slavia-cms')
}

/**
 * Dla wpisów galerii: jeśli `image_url` to ścieżka względna (`gallery/...`), dołącz bazę CMS.
 */
export function resolveGalleryImageUrl(imageUrl: string, cmsBase?: string): string {
  const raw = (imageUrl || '').trim()
  if (!raw) {
    return ''
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw
  }
  return cmsAssetUrl(raw, cmsBase)
}

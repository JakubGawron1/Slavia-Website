/**
 * Proxy do GitHub API — unika CORS i pozwala dodać token serwerowy (GITHUB_TOKEN) przy limitach.
 * Repozytorium: `NUXT_PUBLIC_MOBILE_GITHUB_REPO` w formacie `właściciel/nazwa`.
 *
 * Uwaga: `/releases/latest` pomija prerelease (np. `v0.9.3-dev`) — wtedy bierzemy pierwszy z listy.
 */
type GhRelease = {
  tag_name?: string
  name?: string
  html_url?: string
  published_at?: string
  assets?: Array<{ name: string; browser_download_url: string }>
}

function pickApk(assets: GhRelease['assets']) {
  const list = assets ?? []
  return (
    list.find(a => a.name.toLowerCase().endsWith('.apk'))
    ?? list.find(a => /\.apk$/i.test(a.name))
  )
}

function mapRelease(data: GhRelease, fallbackUrl: string) {
  const apk = pickApk(data.assets)
  return {
    configured: true as const,
    tagName: data.tag_name ?? '',
    name: data.name ?? '',
    htmlUrl: data.html_url ?? fallbackUrl,
    apkDownloadUrl: apk?.browser_download_url ?? null,
    publishedAt: data.published_at ?? null,
    fallbackUrl
  }
}

function isNotFound(err: unknown) {
  const e = err as { statusCode?: number, response?: { status?: number } }
  return e?.statusCode === 404 || e?.response?.status === 404
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const repo = String(config.public.mobileGithubRepo || '').trim()
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return { configured: false as const }
  }

  const fallbackUrl = `https://github.com/${repo}/releases/latest`
  const token = String(config.githubApiToken || '').trim()
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Slavia-CKS-Website'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const base = `https://api.github.com/repos/${repo}`

  async function fetchReleaseList() {
    const list = await $fetch<GhRelease[]>(`${base}/releases`, {
      headers,
      query: { per_page: 30 }
    })
    return Array.isArray(list) ? list[0] : undefined
  }

  try {
    const data = await $fetch<GhRelease>(`${base}/releases/latest`, { headers })
    return mapRelease(data, fallbackUrl)
  } catch (err) {
    if (!isNotFound(err)) {
      try {
        const first = await fetchReleaseList()
        if (first?.tag_name) {
          return mapRelease(first, fallbackUrl)
        }
      } catch {
        /* ignore */
      }
      return {
        configured: true as const,
        tagName: '',
        name: '',
        htmlUrl: fallbackUrl,
        apkDownloadUrl: null,
        publishedAt: null,
        fallbackUrl,
        apiError: true as const
      }
    }

    try {
      const first = await fetchReleaseList()
      if (first) {
        return mapRelease(first, fallbackUrl)
      }
    } catch {
      /* ignore */
    }

    return {
      configured: true as const,
      tagName: '',
      name: '',
      htmlUrl: fallbackUrl,
      apkDownloadUrl: null,
      publishedAt: null,
      fallbackUrl,
      apiError: true as const
    }
  }
})

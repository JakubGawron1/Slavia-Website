/**
 * Proxy do GitHub API — unika CORS i pozwala dodać token serwerowy (GITHUB_TOKEN) przy limitach.
 * Repozytorium: `NUXT_PUBLIC_MOBILE_GITHUB_REPO` w formacie `właściciel/nazwa`.
 */
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

  try {
    const data = await $fetch<{
      tag_name?: string
      name?: string
      html_url?: string
      published_at?: string
      assets?: Array<{ name: string; browser_download_url: string }>
    }>(`https://api.github.com/repos/${repo}/releases/latest`, { headers })

    const assets = data.assets ?? []
    const apk =
      assets.find((a) => a.name.toLowerCase().endsWith('.apk'))
      ?? assets.find((a) => /\.apk$/i.test(a.name))

    return {
      configured: true as const,
      tagName: data.tag_name ?? '',
      name: data.name ?? '',
      htmlUrl: data.html_url ?? fallbackUrl,
      apkDownloadUrl: apk?.browser_download_url ?? null,
      publishedAt: data.published_at ?? null,
      fallbackUrl
    }
  } catch {
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

/** Rozszerzenie typów `useRuntimeConfig().public` (np. dla zmiennych z `nuxt.config`). */
declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    apiBase: string
    apiBaseLeapcell: string
    apiBaseRender: string
    apiBaseHuggingface: string
    siteUrl: string
    /** Z `package.json` → `version`, z prefiksem `v` (build-time), np. `v3.0.0-dev`. */
    appVersion: string
    /** Lista rozdzielona przecinkami — identyfikatory funkcji eksperymentalnych wymuszonych jako wyłączone. */
    experimentalKillSwitch: string
    /** Repozytorium GitHub aplikacji mobilnej (`owner/repo`) — najnowszy release / APK. */
    mobileGithubRepo: string
  }
}

export {}

/**
 * Globalne raportowanie błędów Vue i nieobsłużonych promise rejection.
 * Loguje kontekst (trasa, rola) — gotowe pod podłączenie Sentry/Datadog w przyszłości.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuth()

  function buildContext(extra?: Record<string, unknown>) {
    const route = useRoute()
    return {
      route: route.fullPath,
      roles: auth.user.value?.roles ?? [],
      userId: auth.user.value?.id ?? null,
      at: new Date().toISOString(),
      ...extra
    }
  }

  function report(error: unknown, context?: Record<string, unknown>) {
    console.error('[slavia-error]', error, buildContext(context))
  }

  nuxtApp.vueApp.config.errorHandler = (error, _instance, info) => {
    report(error, { source: 'vue', vueInfo: info })
  }

  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      report(event.reason, { source: 'unhandledrejection' })
    })
  }

  nuxtApp.hook('app:error', (error) => {
    report(error, { source: 'app:error' })
  })

  return {
    provide: {
      reportError: report
    }
  }
})

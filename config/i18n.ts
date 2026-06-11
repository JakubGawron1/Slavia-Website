/**
 * Fundament i18n — pełna integracja `@nuxtjs/i18n` odłożona (Fala 4).
 * UI pozostaje monojęzykowy PL; ten plik centralizuje stałe na przyszły rollout EN.
 */
export const defaultLocale = 'pl' as const
export const availableLocales = [defaultLocale] as const
export type SlaviaLocale = (typeof availableLocales)[number]

/** Docelowy zestaw tłumaczeń publicznego www (backlog). */
export const deferredPublicLocales = ['en'] as const

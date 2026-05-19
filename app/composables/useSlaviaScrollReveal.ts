/**
 * Scroll reveal — IntersectionObserver + klasy `.slavia-reveal` / `.is-revealed`.
 * Preferuj dyrektywę `v-slavia-reveal` (plugin `app/plugins/slavia-reveal.client.ts`).
 *
 * Przykład: `<section v-slavia-reveal="'fade-up'">` lub `v-slavia-reveal="{ variant: 'scale', delay: 80 }"`.
 */

export type SlaviaRevealVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'blur-in'

export interface SlaviaRevealOptions {
  variant?: SlaviaRevealVariant
  /** Opóźnienie w ms — ustawiane jako `--slavia-reveal-delay`. */
  delay?: number
  threshold?: number
  rootMargin?: string
}

const REVEAL_VARIANTS: SlaviaRevealVariant[] = ['fade-up', 'fade-left', 'fade-right', 'scale', 'blur-in']

export function isSlaviaRevealVariant(value: string): value is SlaviaRevealVariant {
  return (REVEAL_VARIANTS as string[]).includes(value)
}

export function prefersSlaviaReducedMotion(): boolean {
  if (!import.meta.client) return false
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.classList.contains('slavia-dev-force-reduced-motion')
  )
}

export function applySlaviaRevealClasses(el: HTMLElement, variant: SlaviaRevealVariant) {
  el.classList.add('slavia-reveal', `slavia-reveal--${variant}`)
}

export function revealSlaviaElement(el: HTMLElement) {
  el.classList.add('is-revealed')
}

export function setSlaviaRevealDelay(el: HTMLElement, delayMs?: number) {
  if (delayMs != null && delayMs > 0) {
    el.style.setProperty('--slavia-reveal-delay', `${delayMs}ms`)
  } else {
    el.style.removeProperty('--slavia-reveal-delay')
  }
}

export function parseSlaviaRevealBinding(
  value: unknown
): SlaviaRevealOptions {
  if (value == null || value === false) {
    return { variant: 'fade-up' }
  }
  if (typeof value === 'string') {
    return { variant: isSlaviaRevealVariant(value) ? value : 'fade-up' }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const o = value as SlaviaRevealOptions
    const variant = o.variant && isSlaviaRevealVariant(o.variant) ? o.variant : 'fade-up'
    return { ...o, variant }
  }
  return { variant: 'fade-up' }
}

/** Podłącza obserwator; zwraca funkcję czyszczącą. */
export function observeSlaviaReveal(el: HTMLElement, options: SlaviaRevealOptions = {}): () => void {
  const variant = options.variant ?? 'fade-up'
  applySlaviaRevealClasses(el, variant)
  setSlaviaRevealDelay(el, options.delay)

  if (!import.meta.client) {
    revealSlaviaElement(el)
    return () => {}
  }

  if (prefersSlaviaReducedMotion()) {
    revealSlaviaElement(el)
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        revealSlaviaElement(entry.target as HTMLElement)
        observer.unobserve(entry.target)
      }
    },
    {
      root: null,
      rootMargin: options.rootMargin ?? '0px 0px -6% 0px',
      threshold: options.threshold ?? 0.08
    }
  )

  observer.observe(el)
  return () => observer.disconnect()
}

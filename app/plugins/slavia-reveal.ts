import type { ObjectDirective } from 'vue'
import {
  applySlaviaRevealClasses,
  observeSlaviaReveal,
  parseSlaviaRevealBinding,
  revealSlaviaElement,
  setSlaviaRevealDelay,
  type SlaviaRevealOptions
} from '~/composables/useSlaviaScrollReveal'

const cleanups = new WeakMap<HTMLElement, () => void>()

type SlaviaRevealBinding = SlaviaRevealOptions | string | false | undefined

function applySlaviaRevealSSR(el: HTMLElement, binding: SlaviaRevealBinding) {
  if (binding === false) return
  const options = parseSlaviaRevealBinding(binding)
  const variant = options.variant ?? 'fade-up'
  applySlaviaRevealClasses(el, variant)
  setSlaviaRevealDelay(el, options.delay)
  revealSlaviaElement(el)
}

/**
 * Scroll reveal — działa na kliencie (IntersectionObserver) i przy SSR/prerender
 * (treść widoczna od razu, bez wywołania getSSRProps na undefined).
 */
const slaviaRevealDirective: ObjectDirective<HTMLElement, SlaviaRevealBinding> = {
  getSSRProps() {
    return {}
  },

  beforeMount(el, binding) {
    if (!import.meta.server) return
    applySlaviaRevealSSR(el, binding.value)
  },

  mounted(el, binding) {
    if (import.meta.server) return
    if (binding.value === false) return
    const options = parseSlaviaRevealBinding(binding.value)
    cleanups.set(el, observeSlaviaReveal(el, options))
  },

  updated(el, binding) {
    if (import.meta.server) return
    if (binding.value === false) return
    cleanups.get(el)?.()
    const options = parseSlaviaRevealBinding(binding.value)
    cleanups.set(el, observeSlaviaReveal(el, options))
  },

  unmounted(el) {
    cleanups.get(el)?.()
    cleanups.delete(el)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('slavia-reveal', slaviaRevealDirective)
})

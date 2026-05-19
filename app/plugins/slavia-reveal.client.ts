import type { ObjectDirective } from 'vue'
import {
  observeSlaviaReveal,
  parseSlaviaRevealBinding,
  type SlaviaRevealOptions
} from '~/composables/useSlaviaScrollReveal'

const cleanups = new WeakMap<HTMLElement, () => void>()

type SlaviaRevealBinding = SlaviaRevealOptions | string | false | undefined

const slaviaRevealDirective: ObjectDirective<HTMLElement, SlaviaRevealBinding> = {
  mounted(el, binding) {
    if (binding.value === false) return
    const options = parseSlaviaRevealBinding(binding.value)
    cleanups.set(el, observeSlaviaReveal(el, options))
  },
  updated(el, binding) {
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

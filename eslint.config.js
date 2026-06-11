// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

/** v-html tylko w komponentach z DOMPurify — reszta kodu: error. */
const safeHtmlComponents = [
  '**/SlaviaSafeHtml.vue',
  '**/SlaviaChatMarkdown.vue',
  '**/SlaviaSimpleMarkdown.vue'
]

export default withNuxt(
  {
    rules: {
      'vue/no-v-html': 'error'
    }
  },
  {
    files: safeHtmlComponents,
    rules: {
      'vue/no-v-html': 'off'
    }
  }
)

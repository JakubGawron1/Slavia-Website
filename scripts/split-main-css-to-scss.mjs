/**
 * Jednorazowy podział app/assets/css/main.css → app/assets/scss/**
 * Uruchom: node scripts/split-main-css-to-scss.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const mainPath = join(root, 'app/assets/css/main.css')
const presetsPath = join(root, 'app/assets/css/themes-presets.css')
const scssDir = join(root, 'app/assets/scss')

const lines = readFileSync(mainPath, 'utf-8').split(/\r?\n/)

/** [startLine 1-based inclusive, endLine inclusive, relative path under scss/] */
const chunks = [
  [4, 29, 'base/_reset.scss'],
  [31, 80, 'abstracts/_tokens.scss'],
  [82, 99, 'base/_typography.scss'],
  [101, 287, 'layout/_layout.scss'],
  [288, 456, 'components/_cards.scss'],
  [457, 630, 'components/_states.scss'],
  [631, 704, 'components/_nav.scss'],
  [705, 749, 'components/_tables.scss'],
  [751, 765, 'abstracts/_theme-tailwind.scss'],
  [767, 930, 'utilities/_animations.scss'],
  [932, 976, 'base/_enhancements.scss'],
  [977, 2172, 'themes/_presets-core.scss'],
  [2173, 2258, 'components/_select.scss'],
  [2260, 2470, 'components/_forms.scss'],
  [2472, 2889, 'components/_messenger.scss'],
  [2891, 3086, 'utilities/_backdrop.scss'],
  [3087, lines.length, 'utilities/_reveal.scss']
]

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n').trimEnd() + '\n'
}

mkdirSync(scssDir, { recursive: true })

for (const [start, end, rel] of chunks) {
  const out = join(scssDir, rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, slice(start, end), 'utf-8')
  console.log('wrote', rel, `(${end - start + 1} lines)`)
}

const presets = readFileSync(presetsPath, 'utf-8').trimEnd() + '\n'
writeFileSync(join(scssDir, 'themes/_presets.scss'), presets, 'utf-8')
console.log('wrote themes/_presets.scss')

const slaviaImports = [
  'abstracts/tokens',
  'abstracts/theme-tailwind',
  'base/reset',
  'base/typography',
  'base/enhancements',
  'layout/layout',
  'components/cards',
  'components/states',
  'components/nav',
  'components/tables',
  'components/select',
  'components/forms',
  'components/messenger',
  'utilities/animations',
  'utilities/backdrop',
  'utilities/reveal',
  'themes/presets-core',
  'themes/presets'
].map((p) => `@import '${p}';`).join('\n')

writeFileSync(
  join(scssDir, 'slavia.scss'),
  `/**
 * Globalne style Slavia — importowane z main.css po Tailwind i Nuxt UI.
 * Nie dodawaj tutaj @import tailwindcss / @nuxt/ui.
 */
${slaviaImports}
`,
  'utf-8'
)
console.log('wrote slavia.scss')

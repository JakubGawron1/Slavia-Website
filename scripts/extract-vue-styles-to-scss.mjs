/**
 * Wyciąga <style scoped> z Vue → pliki SCSS (globalne klasy BEM).
 * Uruchom: node scripts/extract-vue-styles-to-scss.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

const jobs = [
  { vue: 'app/pages/logowanie.vue', scss: 'components/_auth.scss' },
  { vue: 'app/components/club/ClubHistoryTimeline.vue', scss: 'components/_timeline.scss' },
  { vue: 'app/components/dev/DevExperimentalFlagsPanel.vue', scss: 'components/_dev-flags.scss' },
  { vue: 'app/pages/kalendarz.vue', scss: 'components/_calendar.scss' },
  { vue: 'app/pages/athlete/kalendarz.vue', scss: null, removeOnly: true },
  { vue: 'app/components/trainer/TrainingPlanBuilder.vue', scss: 'base/_vue-transitions.scss' },
  { vue: 'app/pages/athlete/plany.vue', scss: null, removeOnly: true },
  { vue: 'app/components/AthleteBadges.vue', scss: 'utilities/_confetti.scss' },
  { vue: 'app/app.vue', scss: 'base/_app-transitions.scss', unscoped: true }
]

function stripScoped(css) {
  return css
    .replace(/:deep\(([^)]+)\)/g, '$1')
    .trim()
}

for (const job of jobs) {
  const vuePath = join(root, job.vue)
  let src = readFileSync(vuePath, 'utf-8')
  const re = job.unscoped
    ? /<style>([\s\S]*?)<\/style>/
    : /<style scoped>([\s\S]*?)<\/style>/
  const m = src.match(re)
  if (!m) {
    console.warn('skip (no style):', job.vue)
    continue
  }
  const css = stripScoped(m[1])
  if (job.scss) {
    const out = join(root, 'app/assets/scss', job.scss)
    mkdirSync(dirname(out), { recursive: true })
    const header = `/** Z ${job.vue} — globalne klasy (bez scoped). */\n`
    writeFileSync(out, header + css + '\n', 'utf-8')
    console.log('wrote', job.scss)
  }
  src = src.replace(re, '').replace(/\n{3,}/g, '\n\n')
  writeFileSync(vuePath, src, 'utf-8')
  console.log('stripped style from', job.vue)
}

const slaviaPath = join(root, 'app/assets/scss/slavia.scss')
let slavia = readFileSync(slaviaPath, 'utf-8')
const extra = [
  'base/app-transitions',
  'base/vue-transitions',
  'components/auth',
  'components/timeline',
  'components/dev-flags',
  'components/calendar',
  'utilities/confetti'
]
for (const imp of extra) {
  const line = `@import '${imp}';`
  if (!slavia.includes(line)) {
    slavia = slavia.trimEnd() + '\n' + line + '\n'
  }
}
writeFileSync(slaviaPath, slavia, 'utf-8')
console.log('updated slavia.scss')

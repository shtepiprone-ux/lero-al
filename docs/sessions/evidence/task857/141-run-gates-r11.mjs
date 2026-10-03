// Revision 11 gate block (kickoff §29.6, §28.6 renamed 141*-r11). Unpiped capture, EXIT_CODE appended, BOM-free. Storybook build and app build
// run BEFORE the tests (overlay-dual-declaration needs .next/static/css). Every output has a 141 name.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const ev = 'docs/sessions/evidence/task857'
const gates = [
  ['141b-census-r11', 'node scripts/check-surface-census.mjs --surface src/app/admin/listings/page.tsx'],
  ['141d-typecheck-r11', 'npm run typecheck'],
  ['141e-lint-r11', 'npm run lint'],
  ['141f-story-coverage-r11', 'npm run check:story-coverage'],
  ['141g-rendered-scope-r11', 'npm run check:rendered-scope'],
  ['141h-census-changed-r11', 'npm run check:surface-census:changed -- --base HEAD'],
  ['141i-design-tokens-r11', 'npm run check:design-tokens'],
  ['141j-enrolled-tailwind-r11', 'npm run check:enrolled-tailwind'],
  ['141k-i18n-r11', 'npm run check:i18n'],
  ['141l-type-responsive-r11', 'npm run check:type-responsive'],
  ['141m-file-integrity-r11', 'npm run check:file-integrity'],
  ['141n-mojibake-r11', 'npm run check:mojibake'],
  ['141o-listing-visibility-r11', 'npm run check:listing-visibility'],
  ['141t-pattern-enrolment-r11', 'npm run check:pattern-enrolment'],
  ['141p-storybook-build-r11', 'npm run build-storybook'],
  ['141q-build-r11', 'npm run build'],
  ['141c-tests-r11', 'npx vitest run --testTimeout=60000 --no-file-parallelism'],
]
fs.writeFileSync(`${ev}/141-platform-r11.txt`, `${process.platform} ${process.version} ${process.cwd()}\n`)
const summary = []
for (const [name, cmd] of gates) {
  const file = `${ev}/${name}.txt`
  const fd = fs.openSync(file, 'w')
  const r = spawnSync(cmd, { shell: true, stdio: ['ignore', fd, fd] })
  fs.closeSync(fd)
  let txt = fs.readFileSync(file, 'utf8').replace(/^﻿/, '')
  txt += `\nEXIT_CODE=${r.status}\n`
  fs.writeFileSync(file, txt)
  summary.push(`${name}: ${r.status}`)
  console.log(`${name}: ${r.status}`)
}
const st = spawnSync('git', ['--no-optional-locks', 'status', '--porcelain'], { encoding: 'utf8' })
fs.writeFileSync(`${ev}/141r-status-after-r11.txt`, st.stdout)
fs.writeFileSync(`${ev}/141-summary-r11.txt`, summary.join('\n') + '\n')
const files = [
  'scripts/check-design-tokens.mjs',
  'scripts/__tests__/check-design-tokens.test.ts',
  'src/design-system/mantine/patterns/MantineDataTableToCards.tsx',
  'src/design-system/mantine/patterns/__tests__/MantineDataTableToCards.thead.test.tsx',
]
const hashes = files.map((f) => `${spawnSync('git', ['hash-object', f], { encoding: 'utf8' }).stdout.trim()}  ${f}`)
fs.writeFileSync(`${ev}/141s-hash-object-r11.txt`, hashes.join('\n') + '\n')

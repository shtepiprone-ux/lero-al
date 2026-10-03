// Revision 12 gate block (kickoff §31.6, renamed 150*-r12). Unpiped capture, EXIT_CODE appended, BOM-free. Storybook build and app build
// run BEFORE the tests (overlay-dual-declaration needs .next/static/css). Every output has a 141 name.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const ev = 'docs/sessions/evidence/task857'
const gates = [
  ['150b-census-r12', 'node scripts/check-surface-census.mjs --surface src/app/admin/listings/page.tsx'],
  ['150d-typecheck-r12', 'npm run typecheck'],
  ['150e-lint-r12', 'npm run lint'],
  ['150f-story-coverage-r12', 'npm run check:story-coverage'],
  ['150g-rendered-scope-r12', 'npm run check:rendered-scope'],
  ['150h-census-changed-r12', 'npm run check:surface-census:changed -- --base HEAD'],
  ['150i-design-tokens-r12', 'npm run check:design-tokens'],
  ['150j-enrolled-tailwind-r12', 'npm run check:enrolled-tailwind'],
  ['150k-i18n-r12', 'npm run check:i18n'],
  ['150l-type-responsive-r12', 'npm run check:type-responsive'],
  ['150m-file-integrity-r12', 'npm run check:file-integrity'],
  ['150n-mojibake-r12', 'npm run check:mojibake'],
  ['150o-listing-visibility-r12', 'npm run check:listing-visibility'],
  ['150t-pattern-enrolment-r12', 'npm run check:pattern-enrolment'],
  ['150p-storybook-build-r12', 'npm run build-storybook'],
  ['150q-build-r12', 'npm run build'],
  ['150c-tests-r12', 'npx vitest run --testTimeout=60000 --no-file-parallelism'],
]
fs.writeFileSync(`${ev}/150-platform-r12.txt`, `${process.platform} ${process.version} ${process.cwd()}\n`)
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
fs.writeFileSync(`${ev}/150r-status-after-r12.txt`, st.stdout)
fs.writeFileSync(`${ev}/150-summary-r12.txt`, summary.join('\n') + '\n')
const files = [
  'src/design-system/mantine/patterns/MantineDataTableToCards.tsx',
  'src/design-system/mantine/patterns/__tests__/MantineDataTableToCards.thead.test.tsx',
]
const hashes = files.map((f) => `${spawnSync('git', ['hash-object', f], { encoding: 'utf8' }).stdout.trim()}  ${f}`)
fs.writeFileSync(`${ev}/150s-hash-object-r12.txt`, hashes.join('\n') + '\n')

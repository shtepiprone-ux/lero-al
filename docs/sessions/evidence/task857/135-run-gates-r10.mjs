// Revision 10 gate block (kickoff §28.6, §26.5 renamed 135*-r10). Unpiped capture, EXIT_CODE appended, BOM-free. Storybook build and app build
// run BEFORE the tests (overlay-dual-declaration needs .next/static/css). Every output, the i18n gate included, has a 135 name.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const ev = 'docs/sessions/evidence/task857'
const gates = [
  ['135b-census-r10', 'node scripts/check-surface-census.mjs --surface src/app/admin/listings/page.tsx'],
  ['135d-typecheck-r10', 'npm run typecheck'],
  ['135e-lint-r10', 'npm run lint'],
  ['135f-story-coverage-r10', 'npm run check:story-coverage'],
  ['135g-rendered-scope-r10', 'npm run check:rendered-scope'],
  ['135h-census-changed-r10', 'npm run check:surface-census:changed -- --base HEAD'],
  ['135i-design-tokens-r10', 'npm run check:design-tokens'],
  ['135j-enrolled-tailwind-r10', 'npm run check:enrolled-tailwind'],
  ['135k-i18n-r10', 'npm run check:i18n'],
  ['135l-type-responsive-r10', 'npm run check:type-responsive'],
  ['135m-file-integrity-r10', 'npm run check:file-integrity'],
  ['135n-mojibake-r10', 'npm run check:mojibake'],
  ['135o-listing-visibility-r10', 'npm run check:listing-visibility'],
  ['135t-pattern-enrolment-r10', 'npm run check:pattern-enrolment'],
  ['135p-storybook-build-r10', 'npm run build-storybook'],
  ['135q-build-r10', 'npm run build'],
  ['135c-tests-r10', 'npx vitest run --testTimeout=60000 --no-file-parallelism'],
]
fs.writeFileSync(`${ev}/135-platform-r10.txt`, `${process.platform} ${process.version} ${process.cwd()}\n`)
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
fs.writeFileSync(`${ev}/135r-status-after-r10.txt`, st.stdout)
fs.writeFileSync(`${ev}/135-summary-r10.txt`, summary.join('\n') + '\n')
const files = ['src/design-system/mantine/patterns/MantineNavRowList.module.css']
const hashes = files.map((f) => `${spawnSync('git', ['hash-object', f], { encoding: 'utf8' }).stdout.trim()}  ${f}`)
fs.writeFileSync(`${ev}/135s-hash-object-r10.txt`, hashes.join('\n') + '\n')

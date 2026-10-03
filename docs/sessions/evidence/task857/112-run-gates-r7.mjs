// Revision 7 gate block (§21.6 renamed 112*-r7 + check:pattern-enrolment). Unpiped capture, EXIT_CODE appended, BOM-free.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const ev = 'docs/sessions/evidence/task857'
const gates = [
  ['112b-census-r7', 'node scripts/check-surface-census.mjs --surface src/app/admin/listings/page.tsx'],
  ['112c-tests-r7', 'npx vitest run --testTimeout=60000 --no-file-parallelism'],
  ['112d-typecheck-r7', 'npm run typecheck'],
  ['112e-lint-r7', 'npm run lint'],
  ['112f-story-coverage-r7', 'npm run check:story-coverage'],
  ['112g-rendered-scope-r7', 'npm run check:rendered-scope'],
  ['112h-census-changed-r7', 'npm run check:surface-census:changed -- --base HEAD'],
  ['112i-design-tokens-r7', 'npm run check:design-tokens'],
  ['112j-enrolled-tailwind-r7', 'npm run check:enrolled-tailwind'],
  ['112k-i18n-r7', 'npm run check:i18n'],
  ['112l-type-responsive-r7', 'npm run check:type-responsive'],
  ['112m-file-integrity-r7', 'npm run check:file-integrity'],
  ['112n-mojibake-r7', 'npm run check:mojibake'],
  ['112o-listing-visibility-r7', 'npm run check:listing-visibility'],
  ['112t-pattern-enrolment-r7', 'npm run check:pattern-enrolment'],
  ['112p-storybook-build-r7', 'npm run build-storybook'],
  ['112q-build-r7', 'npm run build'],
]
fs.writeFileSync(`${ev}/112-platform-r7.txt`, `${process.platform} ${process.version} ${process.cwd()}\n`)
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
fs.writeFileSync(`${ev}/112r-status-after-r7.txt`, st.stdout)
fs.writeFileSync(`${ev}/112-summary-r7.txt`, summary.join('\n') + '\n')

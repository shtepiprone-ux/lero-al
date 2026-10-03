// Revision 8 gate block (renamed 119*-r8 + check:pattern-enrolment). Unpiped capture, EXIT_CODE appended, BOM-free.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const ev = 'docs/sessions/evidence/task857'
const gates = [
  ['119b-census-r8', 'node scripts/check-surface-census.mjs --surface src/app/admin/listings/page.tsx'],
  ['119c-tests-r8', 'npx vitest run --testTimeout=60000 --no-file-parallelism'],
  ['119d-typecheck-r8', 'npm run typecheck'],
  ['119e-lint-r8', 'npm run lint'],
  ['119f-story-coverage-r8', 'npm run check:story-coverage'],
  ['119g-rendered-scope-r8', 'npm run check:rendered-scope'],
  ['119h-census-changed-r8', 'npm run check:surface-census:changed -- --base HEAD'],
  ['119i-design-tokens-r8', 'npm run check:design-tokens'],
  ['119j-enrolled-tailwind-r8', 'npm run check:enrolled-tailwind'],
  ['112k-i18n-r7', 'npm run check:i18n'],
  ['119l-type-responsive-r8', 'npm run check:type-responsive'],
  ['119m-file-integrity-r8', 'npm run check:file-integrity'],
  ['119n-mojibake-r8', 'npm run check:mojibake'],
  ['119o-listing-visibility-r8', 'npm run check:listing-visibility'],
  ['119t-pattern-enrolment-r8', 'npm run check:pattern-enrolment'],
  ['119p-storybook-build-r8', 'npm run build-storybook'],
  ['119q-build-r8', 'npm run build'],
]
fs.writeFileSync(`${ev}/119-platform-r8.txt`, `${process.platform} ${process.version} ${process.cwd()}\n`)
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
fs.writeFileSync(`${ev}/119r-status-after-r8.txt`, st.stdout)
fs.writeFileSync(`${ev}/119-summary-r8.txt`, summary.join('\n') + '\n')

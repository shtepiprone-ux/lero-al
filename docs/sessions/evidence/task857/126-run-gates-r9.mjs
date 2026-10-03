// Revision 9 gate block (§24.10 renamed 126*-r9). Unpiped capture, EXIT_CODE appended, BOM-free. Build BEFORE tests (so the
// overlay-dual-declaration gate finds .next/static/css). Every output, the i18n gate included, has a 126 name.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const ev = 'docs/sessions/evidence/task857'
const gates = [
  ['126b-census-r9', 'node scripts/check-surface-census.mjs --surface src/app/admin/listings/page.tsx'],
  ['126d-typecheck-r9', 'npm run typecheck'],
  ['126e-lint-r9', 'npm run lint'],
  ['126f-story-coverage-r9', 'npm run check:story-coverage'],
  ['126g-rendered-scope-r9', 'npm run check:rendered-scope'],
  ['126h-census-changed-r9', 'npm run check:surface-census:changed -- --base HEAD'],
  ['126i-design-tokens-r9', 'npm run check:design-tokens'],
  ['126j-enrolled-tailwind-r9', 'npm run check:enrolled-tailwind'],
  ['126k-i18n-r9', 'npm run check:i18n'],
  ['126l-type-responsive-r9', 'npm run check:type-responsive'],
  ['126m-file-integrity-r9', 'npm run check:file-integrity'],
  ['126n-mojibake-r9', 'npm run check:mojibake'],
  ['126o-listing-visibility-r9', 'npm run check:listing-visibility'],
  ['126t-pattern-enrolment-r9', 'npm run check:pattern-enrolment'],
  ['126p-storybook-build-r9', 'npm run build-storybook'],
  ['126q-build-r9', 'npm run build'],
  ['126c-tests-r9', 'npx vitest run --testTimeout=60000 --no-file-parallelism'],
]
fs.writeFileSync(`${ev}/126-platform-r9.txt`, `${process.platform} ${process.version} ${process.cwd()}\n`)
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
fs.writeFileSync(`${ev}/126r-status-after-r9.txt`, st.stdout)
fs.writeFileSync(`${ev}/126-summary-r9.txt`, summary.join('\n') + '\n')

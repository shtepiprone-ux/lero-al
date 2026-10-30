// Task 923 Revision 58 R176 (c): the full unit run against the 17 failing IDs of review-62/rv62-11-unit-compare.txt, by file and full name.
// Prints only; writes no file. Run from the project root: node docs/sessions/evidence/task923/revision-58/r58-03b-unit-compare.mjs
import { readFileSync } from 'node:fs'
const rel = (n) => n.replace(/\\/g, '/').replace(/^.*lero-al\//, '')
const run = JSON.parse(readFileSync('docs/sessions/evidence/task923/revision-58/r58-03a-unit-full.json', 'utf8'))
const failed = []
const status = new Map()
for (const t of run.testResults) {
  for (const a of t.assertionResults) {
    status.set(`${rel(t.name)} :: ${a.fullName}`, a.status)
    if (a.status === 'failed') failed.push(`${rel(t.name)} :: ${a.fullName}`)
  }
}
failed.sort()
const base = readFileSync('docs/sessions/evidence/task923/review-62/rv62-11-unit-compare.txt', 'utf8')
  .split('\n').filter((l) => l.startsWith('FAILED ')).map((l) => l.slice('FAILED '.length)).sort()
console.log(`run: total ${run.numTotalTests} passed ${run.numPassedTests} failed ${run.numFailedTests} pending ${run.numPendingTests} suites ${run.numTotalTestSuites} failedSuites ${run.numFailedTestSuites}`)
console.log(`baseline failing IDs (rv62-11): ${base.length}`)
const missing = base.filter((x) => !failed.includes(x))
const extra = failed.filter((x) => !base.includes(x))
console.log(`failing now but not in the baseline: ${extra.length}`)
extra.forEach((x) => console.log(`  EXTRA ${x}`))
console.log(`in the baseline but not failing now: ${missing.length}`)
missing.forEach((x) => console.log(`  MISSING ${x}`))
console.log(`same failing IDs as the baseline: ${JSON.stringify(failed) === JSON.stringify(base)}`)
const mine = [...status.entries()].filter(([k]) => k.startsWith('src/modules/admin/lib/__tests__/userLocation.test.ts') || k.startsWith('src/app/admin/users/__tests__/adminUserGone.security.test.ts') || (k.startsWith('src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx') && k.includes('T11')))
console.log(`R175 tests in this run: ${mine.length}; not passed: ${mine.filter(([, s]) => s !== 'passed').length}`)
mine.forEach(([k, s]) => console.log(`  ${s} ${k}`))
failed.forEach((x) => console.log(`FAILED ${x}`))

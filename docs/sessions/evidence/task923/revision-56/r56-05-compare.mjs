// Task 923 Revision 56 (R173 (c)): compares the failures of the full unit run with the 17 IDs of review-62/rv62-11-unit-compare.txt, by file and full test name.
// usage: node docs/sessions/evidence/task923/revision-56/r56-05-compare.mjs
import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const ROOT = resolve('.')
const expectedText = readFileSync('docs/sessions/evidence/task923/review-62/rv62-11-unit-compare.txt', 'utf8')
const expected = expectedText.split(/\r?\n/).filter((l) => l.startsWith('FAILED ')).map((l) => l.slice('FAILED '.length))
const data = JSON.parse(readFileSync('docs/sessions/evidence/task923/revision-56/r56-05-unit-full.json', 'utf8'))
const actual = []
for (const f of data.testResults ?? []) {
  const file = relative(ROOT, f.name).replaceAll('\\', '/')
  for (const a of f.assertionResults ?? []) if (a.status === 'failed') actual.push(`${file} :: ${a.fullName}`)
  if (f.status === 'failed' && !(f.assertionResults ?? []).some((a) => a.status === 'failed')) actual.push(`${file} :: <FILE FAILED WITHOUT A FAILED TEST> ${String(f.message ?? '').slice(0, 200)}`)
}
const missing = expected.filter((e) => !actual.includes(e))
const extra = actual.filter((a) => !expected.includes(a))
const names = new Set((data.testResults ?? []).flatMap((f) => (f.assertionResults ?? []).map((a) => a.fullName)))
const newOnes = ['[SEC-X-SRV-VIEW-DENY]', '[SEC-X-SRV-PROFILE-PROTECTED-DENY]'].map((id) => {
  const hit = (data.testResults ?? []).flatMap((f) => f.assertionResults ?? []).filter((a) => a.fullName.includes(id))
  return `${id} collected ${hit.length}, statuses ${hit.map((h) => h.status).join(',')}`
})
console.log(`total ${data.numTotalTests} passed ${data.numPassedTests} failed ${data.numFailedTests} pending ${data.numPendingTests} todo ${data.numTodoTests} files ${data.numTotalTestSuites} suites; failed suites ${data.numFailedTestSuites}; distinct names ${names.size}`)
console.log(`expected failing IDs (rv62-11): ${expected.length}; actual failing IDs: ${actual.length}`)
console.log(`expected but not failing: ${missing.length}`)
missing.forEach((m) => console.log(`  MISSING ${m}`))
console.log(`failing but not expected: ${extra.length}`)
extra.forEach((x) => console.log(`  EXTRA ${x}`))
newOnes.forEach((n) => console.log(n))
const same = expected.length === 17 && !missing.length && !extra.length
console.log(`exactly the 17 listed IDs: ${same}`)
process.exitCode = same ? 0 : 1

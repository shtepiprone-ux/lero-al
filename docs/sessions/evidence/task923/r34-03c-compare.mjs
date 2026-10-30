// Task 923 R116 (e), r34-03: the failing test IDs of a vitest JSON report, compared with the pinned baseline r32-03d-failing-ids.txt in both directions.
// Usage: node docs/sessions/evidence/task923/r34-03c-compare.mjs <report.json> <out-failing-ids.txt>
// Control: the same derivation, applied to r33-full-suite.json, must reproduce r33-03d-failing-ids.txt exactly, so that the ID format is the baseline's.
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ids = (reportPath) => {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  const out = []
  for (const file of report.testResults) {
    const rel = path.relative(root, file.name).split(path.sep).join('/')
    for (const t of file.assertionResults) if (t.status === 'failed') out.push(`${rel} > ${t.ancestorTitles.concat(t.title).join(' > ')}`)
  }
  return { ids: [...new Set(out)].sort(), total: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests, suitesFailed: report.numFailedTestSuites }
}
const readList = (p) => fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean)
const sorted = (a) => [...a].sort()

const [reportPath, outPath] = process.argv.slice(2)
const baseline = readList('docs/sessions/evidence/task923/r32-03d-failing-ids.txt')

const control = ids('test-results/r33-full-suite.json')
const r33Recorded = readList('docs/sessions/evidence/task923/r33-03d-failing-ids.txt')
const controlOk = JSON.stringify(control.ids) === JSON.stringify(sorted(r33Recorded))
console.log(`control: derivation on r33-full-suite.json gives ${control.ids.length} IDs; recorded r33-03d has ${r33Recorded.length}; identical: ${controlOk}`)

const now = ids(reportPath)
fs.writeFileSync(outPath, now.ids.join('\n') + '\n')
const base = new Set(baseline)
const cur = new Set(now.ids)
const onlyNow = now.ids.filter((id) => !base.has(id))
const onlyBase = baseline.filter((id) => !cur.has(id))
console.log(`report ${reportPath}: total ${now.total}, passed ${now.passed}, failed ${now.failed}, failed suites ${now.suitesFailed}`)
console.log(`failing IDs now: ${now.ids.length}; baseline r32-03d: ${baseline.length}`)
console.log(`only in this run (not in the baseline): ${onlyNow.length}`)
for (const id of onlyNow) console.log(`  + ${id}`)
console.log(`only in the baseline (not failing now): ${onlyBase.length}`)
for (const id of onlyBase) console.log(`  - ${id}`)
process.exit(controlOk && onlyNow.length === 0 ? 0 : 1)

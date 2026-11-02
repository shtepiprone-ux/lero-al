// Builds docs/sessions/evidence/task931/security/report.json for the Task 931 security contract, by the rules of
// .claude/rules/shared/workflow-gates.md "Evidence and limits" (modelled on docs/sessions/evidence/task923/security/owner-fixes-report.mjs).
// It never invents a result:
//  - the mapped tests are run by the gate's OWN runMappedTests (unit project only: every Task 931 case has boundary "unit");
//    any error there stops the report (no report is written for a failing run);
//  - `status` of a case is the collected status of its exact mapped test (file + full name) in the raw JSON that run retained
//    under test-results/workflow-gates/security-runs/;
//  - `assertionCount` is the number of `expect(` calls in the body of the mapped test (static count; the run itself uses
//    expect.requireAssertions, so a passed case has at least one);
//  - no case is critical (see the contract), so no `sensitivity` is attached; the six planted breaks are retained separately
//    under docs/sessions/evidence/task931/impl/sensitivity/;
//  - `cleanup`: the cases use in-memory doubles only and create no database row, so nothing exists to clean up (0 remaining).
// Run: node docs/sessions/evidence/task931/security/report.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { digest, planDigest, scopeDigest, validateReport } from '../../../../../scripts/workflow-gates/contract.mjs'
import { readJson, runMappedTests } from '../../../../../scripts/workflow-gates/cli.mjs'

const ROOT = resolve(fileURLToPath(new URL('../../../../../', import.meta.url)))
const CONTRACT = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json'
const contract = readJson(ROOT, CONTRACT)

const errors = runMappedTests(ROOT, contract)
if (errors.length) { errors.forEach((e) => console.error(`NOT REPORTED: ${e}`)); process.exit(1) }

const runDir = join(ROOT, 'test-results/workflow-gates/security-runs', digest(ROOT, [], { task: contract.task }).slice(0, 16))
const data = JSON.parse(readFileSync(join(runDir, 'unit.json'), 'utf8'))
const unitTests = (data.testResults ?? []).flatMap((f) =>
  (f.assertionResults ?? []).map((a) => ({ file: relative(ROOT, f.name).replaceAll('\\', '/'), fullName: a.fullName, status: a.status })),
)

/** the `expect(` calls inside the body of the test that carries `[id]` in its title */
function assertionCount(testFile, id) {
  const source = readFileSync(join(ROOT, testFile), 'utf8')
  const at = source.indexOf(`[${id}]`)
  if (at < 0) return 0
  const open = source.indexOf('{', source.indexOf('=>', at))
  let depth = 0
  let end = open
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) { end = i; break }
  }
  return (source.slice(open, end).match(/\bexpect\s*[(.]/g) ?? []).length
}

const cases = contract.cases.map((row) => {
  const hit = unitTests.filter((t) => t.file === row.testFile && t.fullName === row.testName)
  return {
    id: row.id,
    status: hit.length === 1 ? hit[0].status : 'missing',
    assertionCount: assertionCount(row.testFile, row.id),
  }
})

const report = {
  version: 1,
  status: 'passed',
  generatedAt: new Date().toISOString(),
  contractSha256: planDigest(ROOT, contract),
  scopeSha256: scopeDigest(ROOT, contract),
  errors: [],
  vulnerabilities: [],
  cleanup: { verified: true, remaining: 0, errors: [] },
  cases,
}
const problems = validateReport(ROOT, contract, report)
if (problems.length) { problems.forEach((p) => console.error(`NOT REPORTED: ${p}`)); process.exit(1) }
writeFileSync(join(ROOT, contract.report), JSON.stringify(report, null, 1))
console.log(`report written: ${contract.report} (${cases.length} cases)`)

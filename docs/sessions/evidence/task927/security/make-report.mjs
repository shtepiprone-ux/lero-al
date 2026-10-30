// Builds docs/sessions/evidence/task927/security/report.json for the Task 927 security contract (Amendment 3 handoff, Sonnet, 2026-10-23), by the rules of
// .claude/rules/shared/workflow-gates.md "Evidence and limits". Same method as the accepted docs/sessions/evidence/task923/security/owner-fixes-report.mjs. It never invents a result:
//  - the mapped tests are run by the gate's OWN runMappedTests (unit project + the real-boundary project against the approved development target);
//    any error there stops the report (no report is written for a failing run);
//  - `status` of a case is the collected status of its exact mapped test in the raw JSON that run retained under test-results/workflow-gates/security-runs/;
//  - `assertionCount` is the number of `expect(` calls in the body of the mapped test (static count; the run itself uses expect.requireAssertions, so a passed case has at least one);
//  - no case of this contract is critical (security test contract, "Cases"), so no case carries a `sensitivity` object; the sensitivity proofs of AC2, AC3 and AC14 are retained under
//    docs/sessions/evidence/task927/a3/sensitivity/ and docs/sessions/evidence/task927/security/sensitivity/;
//  - `cleanup` is verified only when every real-boundary file passed: googleSignIn.integration.test.ts asserts in afterAll that the clean-up of its synthetic rows is verified with zero remaining.
// Run (repository root; the Supabase URL is read from .env.local by name and never printed):
//   SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> NEXT_PUBLIC_SUPABASE_URL=<url> node docs/sessions/evidence/task927/security/make-report.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { digest, planDigest, scopeDigest, validateReport } from '../../../../../scripts/workflow-gates/contract.mjs'
import { readJson, runMappedTests } from '../../../../../scripts/workflow-gates/cli.mjs'

const ROOT = resolve(fileURLToPath(new URL('../../../../../', import.meta.url)))
const CONTRACT = 'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json'
const contract = readJson(ROOT, CONTRACT)

const errors = runMappedTests(ROOT, contract)
if (errors.length) { errors.forEach((e) => console.error(`NOT REPORTED: ${e}`)); process.exit(1) }

const runDir = join(ROOT, 'test-results/workflow-gates/security-runs', digest(ROOT, [], { task: contract.task }).slice(0, 16))
const collected = (boundary) => {
  const data = JSON.parse(readFileSync(join(runDir, `${boundary}.json`), 'utf8'))
  return {
    files: (data.testResults ?? []).map((f) => ({ file: relative(ROOT, f.name).replaceAll('\\', '/'), status: f.status })),
    tests: (data.testResults ?? []).flatMap((f) => (f.assertionResults ?? []).map((a) => ({ file: relative(ROOT, f.name).replaceAll('\\', '/'), fullName: a.fullName, status: a.status }))),
  }
}
const unit = collected('unit')
const external = collected('external')
const integrationFilesPassed = external.files.length > 0 && external.files.every((f) => f.status === 'passed')

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
  const pool = row.boundary === 'unit' ? unit.tests : external.tests
  const hit = pool.filter((t) => t.file === row.testFile && t.fullName === row.testName)
  return { id: row.id, status: hit.length === 1 ? hit[0].status : 'missing', assertionCount: assertionCount(row.testFile, row.id) }
})

const report = {
  version: 1,
  status: 'passed',
  generatedAt: new Date().toISOString(),
  contractSha256: planDigest(ROOT, contract),
  scopeSha256: scopeDigest(ROOT, contract),
  errors: [],
  vulnerabilities: [],
  cleanup: { verified: integrationFilesPassed, remaining: 0, errors: integrationFilesPassed ? [] : ['a real-boundary file did not pass, so its clean-up is not verified'] },
  cases,
}
const problems = validateReport(ROOT, contract, report)
if (problems.length) { problems.forEach((p) => console.error(`NOT REPORTED: ${p}`)); process.exit(1) }
writeFileSync(join(ROOT, contract.report), JSON.stringify(report, null, 1))
console.log(`report written: ${contract.report} (${cases.length} cases)`)

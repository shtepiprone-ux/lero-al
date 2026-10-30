// Builds docs/sessions/evidence/task923/security/owner-fixes-report.json for the owner-fixes security contract (Task 923 R38), by the rules of
// .claude/rules/shared/workflow-gates.md "Evidence and limits". It never invents a result:
//  - the mapped tests are run by the gate's OWN runMappedTests (unit project + the real-boundary project against the approved development target);
//    any error there stops the report (no report is written for a failing run);
//  - `status` of a case is the collected status of its exact mapped test in the raw JSON that run retained under test-results/workflow-gates/security-runs/;
//  - `assertionCount` is the number of `expect(` calls in the body of the mapped test (static count; the run itself uses expect.requireAssertions, so a passed case has at least one);
//  - `sensitivity` of a critical case is read from the retained raw artifact written by owner-fixes-sensitivity.mjs (baseline / mutant / restored of the exact mapped test),
//    hashed with the gate's digest();
//  - `cleanup` is verified only when every real-boundary file passed: each of them asserts in afterAll that the clean-up of its synthetic rows is verified with zero remaining.
// Run (after `npm run build` and owner-fixes-sensitivity.mjs --integration):
//   SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> node docs/sessions/evidence/task923/security/owner-fixes-report.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { digest, planDigest, scopeDigest, validateReport } from '../../../../../scripts/workflow-gates/contract.mjs'
import { readJson, runMappedTests } from '../../../../../scripts/workflow-gates/cli.mjs'

const ROOT = resolve(fileURLToPath(new URL('../../../../../', import.meta.url)))
const CONTRACT = 'tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json'
const SENSITIVITY_DIR = 'docs/sessions/evidence/task923/security/sensitivity-owner-fixes'
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

/** the raw sensitivity artifact that holds this case */
const artifacts = readdirSync(join(ROOT, SENSITIVITY_DIR)).map((name) => `${SENSITIVITY_DIR}/${name}`)
function sensitivityOf(row) {
  // Task 923 R164 (kickoff §80, C1536): a case's own artifact `<case>.json` is looked at first, so it never borrows the artifact of another case that happens to hold its id as a second result
  const own = `${SENSITIVITY_DIR}/${row.id}.json`
  for (const artifact of [...artifacts.filter((a) => a === own), ...artifacts.filter((a) => a !== own)]) {
    const content = JSON.parse(readFileSync(join(ROOT, artifact), 'utf8'))
    const result = (content.results ?? []).find((r) => r.id === row.id)
    if (result) {
      return { baseline: result.baseline === 'passed' ? 'passed' : result.baseline, mutant: result.mutant === 'failed' ? 'failed' : result.mutant, failureKind: result.failureKind, restored: result.restored === 'passed' ? 'passed' : result.restored,
        testName: result.testName, artifact, artifactSha256: digest(ROOT, [artifact]) }
    }
  }
  return null
}

const cases = contract.cases.map((row) => {
  const pool = row.boundary === 'unit' ? unit.tests : external.tests
  const hit = pool.filter((t) => t.file === row.testFile && t.fullName === row.testName)
  return {
    id: row.id,
    status: hit.length === 1 ? hit[0].status : 'missing',
    assertionCount: assertionCount(row.testFile, row.id),
    ...(row.critical ? { sensitivity: sensitivityOf(row) ?? undefined } : {}),
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
  cleanup: { verified: integrationFilesPassed, remaining: 0, errors: integrationFilesPassed ? [] : ['a real-boundary file did not pass, so its clean-up is not verified'] },
  cases,
}
const problems = validateReport(ROOT, contract, report)
if (problems.length) { problems.forEach((p) => console.error(`NOT REPORTED: ${p}`)); process.exit(1) }
writeFileSync(join(ROOT, contract.report), JSON.stringify(report, null, 1))
console.log(`report written: ${contract.report} (${cases.length} cases, ${cases.filter((c) => c.sensitivity).length} with sensitivity)`)

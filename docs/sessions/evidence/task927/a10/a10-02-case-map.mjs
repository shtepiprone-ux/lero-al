// Task 927 Amendment 10, AC39 (a10-02): maps every unit-boundary case of the contract to a collected, passed test of the vitest JSON result. Read-only.
// Usage (repository root): node docs/sessions/evidence/task927/a10/a10-02-case-map.mjs <outfile> <vitest-json> [<vitest-json> ...]
// A case is mapped when a test with exactly the case's `testName` passed in exactly the case's `testFile`. The integration cases (boundary "integration") run through
// vitest.integration.config.ts and are not collected here.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const [outFile, ...resultFiles] = process.argv.slice(2)
const contract = JSON.parse(fs.readFileSync('tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json', 'utf8'))
const results = resultFiles.map(file => JSON.parse(fs.readFileSync(file, 'utf8')))
const result = {
  numTotalTestSuites: results.reduce((sum, r) => sum + r.numTotalTestSuites, 0), numTotalTests: results.reduce((sum, r) => sum + r.numTotalTests, 0),
  numPassedTests: results.reduce((sum, r) => sum + r.numPassedTests, 0), numFailedTests: results.reduce((sum, r) => sum + r.numFailedTests, 0), numPendingTests: results.reduce((sum, r) => sum + r.numPendingTests, 0),
}
const norm = file => path.relative(process.cwd(), file).replaceAll('\\', '/')
const collected = new Map()
for (const each of results) for (const suite of each.testResults) for (const test of suite.assertionResults) collected.set(`${norm(suite.name)}\u0000${test.fullName}`, test.status)

const lines = [`platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, `command: node docs/sessions/evidence/task927/a10/a10-02-case-map.mjs ${outFile} ${resultFiles.join(' ')}`,
  `vitest: ${result.numTotalTestSuites} suites, ${result.numTotalTests} tests, ${result.numPassedTests} passed, ${result.numFailedTests} failed, ${result.numPendingTests} pending`, '']
let missing = 0
let mapped = 0
for (const testCase of contract.cases) {
  if (testCase.boundary !== 'unit') { lines.push(`${testCase.id.padEnd(40)} ${testCase.boundary} (not collected by vitest.config.ts)`); continue }
  const status = collected.get(`${testCase.testFile}\u0000${testCase.testName}`)
  if (status === 'passed') mapped++
  else missing++
  lines.push(`${testCase.id.padEnd(40)} ${status ?? 'NOT COLLECTED'}  ${testCase.testFile}`)
}
const unitCases = contract.cases.filter(testCase => testCase.boundary === 'unit').length
lines.push('', `unit cases of the contract: ${unitCases}; passed and mapped: ${mapped}; missing or not passed: ${missing}`, `exit code: ${missing || result.numFailedTests ? 1 : 0}`)
fs.writeFileSync(outFile, lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(missing || result.numFailedTests ? 1 : 0)

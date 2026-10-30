// Task 927 Amendment 12, AC46 (a12-02): maps every unit-boundary case of the contract whose test file is among those a12-02 ran to a collected, passed test of the vitest JSON result. Read-only.
// Usage (repository root): node docs/sessions/evidence/task927/a12/a12-02-case-map.mjs <outfile> <vitest-json> [<vitest-json> ...]
// A case is mapped when a test with exactly the case's `testName` passed in exactly the case's `testFile`. Cases of other files are listed as not part of this run.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const [outFile, ...resultFiles] = process.argv.slice(2)
const contract = JSON.parse(fs.readFileSync('tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json', 'utf8'))
const results = resultFiles.map(file => JSON.parse(fs.readFileSync(file, 'utf8')))
const sum = key => results.reduce((total, r) => total + r[key], 0)
const norm = file => path.relative(process.cwd(), file).replaceAll('\\', '/')
const collected = new Map()
const filesRun = new Set()
for (const each of results) for (const suite of each.testResults) {
  filesRun.add(norm(suite.name))
  for (const test of suite.assertionResults) collected.set(`${norm(suite.name)}\u0000${test.fullName}`, test.status)
}

const lines = [`platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, `command: node docs/sessions/evidence/task927/a12/a12-02-case-map.mjs ${outFile} ${resultFiles.join(' ')}`,
  `vitest: ${sum('numTotalTestSuites')} suites, ${sum('numTotalTests')} tests, ${sum('numPassedTests')} passed, ${sum('numFailedTests')} failed, ${sum('numPendingTests')} pending`, `files run: ${filesRun.size}`, '']
let missing = 0
let mapped = 0
for (const testCase of contract.cases) {
  if (testCase.boundary !== 'unit') { lines.push(`${testCase.id.padEnd(40)} ${testCase.boundary} (not collected by vitest.config.ts)`); continue }
  if (!filesRun.has(testCase.testFile)) { lines.push(`${testCase.id.padEnd(40)} file not part of this run  ${testCase.testFile}`); continue }
  const status = collected.get(`${testCase.testFile}\u0000${testCase.testName}`)
  if (status === 'passed') mapped++
  else missing++
  lines.push(`${testCase.id.padEnd(40)} ${status ?? 'NOT COLLECTED'}  ${testCase.testFile}`)
}
lines.push('', `unit cases whose file was run: ${mapped + missing}; passed and mapped: ${mapped}; missing or not passed: ${missing}`, `exit code: ${missing || sum('numFailedTests') ? 1 : 0}`)
fs.writeFileSync(outFile, lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(missing || sum('numFailedTests') ? 1 : 0)

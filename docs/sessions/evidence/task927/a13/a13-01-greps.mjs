// Task 927 Amendment 13, AC49 (a13-01): the greps, each with its expected result. Read-only.
// Usage (repository root): node docs/sessions/evidence/task927/a13/a13-01-greps.mjs
import fs from 'node:fs'
import os from 'node:os'

const FILE = 'src/lib/auth/googleSignIn.integration.test.ts'
const hitsOf = needle => fs.readFileSync(FILE, 'utf8').split(/\r?\n/).flatMap((line, index) => (line.includes(needle) ? [`${FILE}:${index + 1}: ${line.trim().slice(0, 170)}`] : []))

let failed = 0
const lines = [`platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, 'command: node docs/sessions/evidence/task927/a13/a13-01-greps.mjs', '']
const report = (label, expected, hits, ok) => {
  if (!ok) failed++
  lines.push(`## ${label}`, `expected: ${expected}`, `hits: ${hits.length}`, ...hits.map(hit => `  ${hit}`), `verdict: ${ok ? 'as expected' : 'NOT as expected'}`, '')
}

const invite = hitsOf("generateLink({ type: 'invite'")
report(`generateLink({ type: 'invite' in ${FILE}`, 'exactly once', invite, invite.length === 1)
const created = hitsOf('createUser({ email: noPasswordEmail')
report(`createUser({ email: noPasswordEmail in ${FILE}`, 'nowhere', created, created.length === 0)

lines.push(`exit code: ${failed ? 1 : 0}`)
fs.writeFileSync('docs/sessions/evidence/task927/a13/a13-01-greps.txt', lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(failed ? 1 : 0)

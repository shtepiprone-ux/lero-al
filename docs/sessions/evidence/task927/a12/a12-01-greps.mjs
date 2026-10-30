// Task 927 Amendment 12, AC46 (a12-01): the greps, each with its expected result. Read-only.
// Usage (repository root): node docs/sessions/evidence/task927/a12/a12-01-greps.mjs
import fs from 'node:fs'
import os from 'node:os'

const ACTIONS = 'src/modules/cabinet/actions/index.ts'
const NINE = [
  'src/lib/account/deleteAccount.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetFailures.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetSessions.security.test.ts',
  'src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts',
  'src/modules/cabinet/actions/__tests__/emailChange.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauth.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauthLimit.security.test.ts',
]

const hitsOf = (file, needle) => fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line, index) => (line.includes(needle) ? [`${file}:${index + 1}: ${line.trim().slice(0, 170)}`] : []))

let failed = 0
const lines = [`platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, 'command: node docs/sessions/evidence/task927/a12/a12-01-greps.mjs', '']
const report = (label, expected, hits, ok) => {
  if (!ok) failed++
  lines.push(`## ${label}`, `expected: ${expected}`, `hits: ${hits.length}`, ...hits.map(hit => `  ${hit}`), `verdict: ${ok ? 'as expected' : 'NOT as expected'}`, '')
}

const providers = hitsOf(ACTIONS, "providers.includes('email')")
report(`providers.includes('email') in ${ACTIONS}`, 'nowhere', providers, providers.length === 0)

const call = hitsOf(ACTIONS, "rpc('account_has_password', { p_user: userId })")
report(`rpc('account_has_password', { p_user: userId }) in ${ACTIONS}`, 'exactly once', call, call.length === 1)

for (const file of NINE) {
  const hits = hitsOf(file, 'account_has_password')
  report(`account_has_password in ${file}`, 'at least once', hits, hits.length >= 1)
}

lines.push(`exit code: ${failed ? 1 : 0}`)
fs.writeFileSync('docs/sessions/evidence/task927/a12/a12-01-greps.txt', lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(failed ? 1 : 0)

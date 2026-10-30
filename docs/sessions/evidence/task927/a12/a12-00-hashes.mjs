// Task 927 Amendment 12: records the sha256 of the raw bytes of every path R59-R63 may change.
// Usage (repository root): node docs/sessions/evidence/task927/a12/a12-00-hashes.mjs <outfile> <label>
// Writes platform, Node, cwd, command, one "sha256  path" line per path (ABSENT for a path that does not exist) and the exit code.
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import os from 'node:os'

const PATHS = [
  'docs/sessions/evidence/task927/a12/a12-account-has-password.sql',
  'docs/sessions/evidence/task927/a12/a12-account-has-password.dryrun.sql',
  'docs/sessions/evidence/task927/a12/a12-account-has-password-rollback.sql',
  'src/modules/cabinet/actions/index.ts',
  'src/lib/account/deleteAccount.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetFailures.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetSessions.security.test.ts',
  'src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts',
  'src/modules/cabinet/actions/__tests__/emailChange.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauth.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauthLimit.security.test.ts',
  'src/lib/auth/googleSignIn.integration.test.ts',
]

const [outFile, label] = process.argv.slice(2)
const lines = [
  `# ${label}`,
  `platform: ${os.platform()} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task927/a12/a12-00-hashes.mjs ${outFile} "${label}"`,
  `date: ${new Date().toISOString()}`,
  `paths: ${PATHS.length}`,
  '',
]
for (const p of PATHS) {
  const abs = path.resolve(p)
  lines.push(fs.existsSync(abs) ? `${crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex')}  ${p}` : `ABSENT  ${p}`)
}
lines.push('', 'exit code: 0')
fs.writeFileSync(outFile, lines.join('\n') + '\n')
console.log(lines.join('\n'))

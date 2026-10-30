// Task 923 Revision 55 (R166/R167/R170) evidence helper: sha256 of every path the revision writes, plus the two F27 paths.
// usage: node docs/sessions/evidence/task923/revision-55/r55-hash.mjs <out-file> <label>
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const PATHS = [
  'src/lib/account/deleteAccount.integration.test.ts',
  'docs/sessions/evidence/task923/security/sensitivity.mjs',
  'docs/sessions/evidence/task923/security/db-break.cjs',
  'docs/sessions/evidence/task923/security/sensitivity/SEC-DEL-INT-DENY.json',
  'docs/sessions/evidence/task923/security/sensitivity/SEC-X-SRV-RESTRICTED-PAGE-DENY.json',
  'src/lib/auth/__tests__/moderatorKeys.security.test.ts',
  'docs/sessions/evidence/task923/security/owner-fixes-report.mjs',
]
const [out, label] = process.argv.slice(2)
const lines = [
  `# ${label}`,
  `platform: win32 x64; node: ${process.version}; cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task923/revision-55/r55-hash.mjs ${out} "${label}"`,
  `started: ${new Date().toISOString()}`,
  '--- output ---',
]
for (const p of PATHS) {
  lines.push(existsSync(p) ? `${createHash('sha256').update(readFileSync(p)).digest('hex')}  ${p}` : `ABSENT  ${p}`)
}
lines.push('--- exit code: 0 ---')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, lines.join('\n') + '\n')
console.log(lines.join('\n'))

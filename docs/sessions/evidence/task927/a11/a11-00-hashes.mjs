// Task 927 Amendment 11: records the sha256 of the raw bytes of every path R53-R58 may change.
// Usage (repository root): node docs/sessions/evidence/task927/a11/a11-00-hashes.mjs <outfile> <label>
// Writes platform, Node, cwd, command, one "sha256  path" line per path (ABSENT for a path that does not exist) and the exit code.
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import os from 'node:os'

const PATHS = [
  'src/lib/auth/googlePopup.ts',
  'src/components/auth/GoogleSignInButton.tsx',
  'src/__tests__/security/clientSinks.test.ts',
  'src/lib/analytics/beforeSend.ts',
  'src/lib/analytics/__tests__/beforeSend.security.test.ts',
  'src/app/layout.tsx',
  'src/modules/auth/components/AuthSheet.banned.security.test.tsx',
  'src/lib/auth/__tests__/googlePopup.test.ts',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/components/layout/__tests__/Header.google.security.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx',
  'src/lib/auth/googleIdentity.ts',
  'src/components/auth/GoogleSignInSlot.tsx',
  'src/app/auth/google/callback/GoogleCallbackRelay.tsx',
  'src/app/auth/google/callback/page.tsx',
]

const [outFile, label] = process.argv.slice(2)
const lines = [
  `# ${label}`,
  `platform: ${os.platform()} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task927/a11/a11-00-hashes.mjs ${outFile} "${label}"`,
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

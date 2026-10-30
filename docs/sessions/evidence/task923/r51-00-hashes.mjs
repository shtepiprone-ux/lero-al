// Task 923 Revision 51 (Sonnet executor, 2026-10-25), AC151 r51-00 / r51-00b: the sha256 of the 8 write paths of C1504. Run before the first edit it writes r51-00-hashes-before.txt,
// run after the last edit it writes r51-00b-hashes-after.txt. The hash is the plain sha256 of the file bytes, as in r49-02-breaks.mjs.
// Usage (repository root): node docs/sessions/evidence/task923/r51-00-hashes.mjs before|after
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'

const phase = process.argv[2]
if (phase !== 'before' && phase !== 'after') throw new Error('usage: node docs/sessions/evidence/task923/r51-00-hashes.mjs before|after')

const paths = [
  'src/modules/cabinet/actions/index.ts',
  'src/modules/cabinet/components/CabinetPasswordSection.tsx',
  'src/modules/cabinet/actions/__tests__/cabinetSessions.security.test.ts',
  'src/modules/cabinet/actions/__tests__/changePassword.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts',
  'src/modules/cabinet/actions/__tests__/cabinetFailures.security.test.ts',
  'src/modules/cabinet/components/__tests__/CabinetPasswordSection.signOut.security.test.tsx',
  'src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx',
]

const file = phase === 'before' ? 'docs/sessions/evidence/task923/r51-00-hashes-before.txt' : 'docs/sessions/evidence/task923/r51-00b-hashes-after.txt'
const out = [
  `# r51-00${phase === 'before' ? '' : 'b'}: sha256 of the 8 paths of C1504, ${phase === 'before' ? 'before the first edit' : 'after the last edit'} (Task 923 Revision 51, R156)`,
  `platform: ${process.platform} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task923/r51-00-hashes.mjs ${phase}`,
  `date: ${new Date().toISOString()}`,
  '--- output ---',
]
for (const path of paths) out.push(`${crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}  ${path}`)
out.push('exit code: 0')
fs.writeFileSync(file, out.join('\n') + '\n')
console.log(out.join('\n'))

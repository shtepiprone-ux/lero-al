// Task 923 Revision 53 (Sonnet executor, 2026-10-25), AC153 r53-00 / r53-00b: the sha256 of the 3 write paths of C1526. Run before the first edit it writes r53-00-hashes-before.txt,
// run after the last edit it writes r53-00b-hashes-after.txt. The hash is the plain sha256 of the file bytes, as in r51-00-hashes.mjs.
// Usage (repository root): node docs/sessions/evidence/task923/r53-00-hashes.mjs before|after
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'

const phase = process.argv[2]
if (phase !== 'before' && phase !== 'after') throw new Error('usage: node docs/sessions/evidence/task923/r53-00-hashes.mjs before|after')

const paths = [
  'src/modules/auth/components/AuthRedirect.tsx',
  'src/modules/auth/components/__tests__/authClientParts.test.tsx',
  'src/modules/auth/components/__tests__/staleSession.security.test.tsx',
]

const file = phase === 'before' ? 'docs/sessions/evidence/task923/r53-00-hashes-before.txt' : 'docs/sessions/evidence/task923/r53-00b-hashes-after.txt'
const out = [
  `# r53-00${phase === 'before' ? '' : 'b'}: sha256 of the 3 paths of C1526, ${phase === 'before' ? 'before the first edit' : 'after the last edit'} (Task 923 Revision 53, R158)`,
  `platform: ${process.platform} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task923/r53-00-hashes.mjs ${phase}`,
  `date: ${new Date().toISOString()}`,
  '--- output ---',
]
for (const path of paths) out.push(`${crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}  ${path}`)
out.push('exit code: 0')
fs.writeFileSync(file, out.join('\n') + '\n')
console.log(out.join('\n'))

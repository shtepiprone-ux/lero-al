// Task 927 Amendment 7: records the sha256 of the raw bytes of the four paths R30-R32 edit.
// Usage (repository root): node docs/sessions/evidence/task927/a7/a7-00-hashes.mjs <outfile> <label>
// Writes platform, Node, cwd, command, one "sha256  path" line per path and the exit code.
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import os from 'node:os'

const PATHS = [
  'src/modules/cabinet/components/ProfileTab.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  'src/stories/mantine/primitives/Modal.stories.tsx',
]

const [outFile, label] = process.argv.slice(2)
const lines = [
  `# ${label}`,
  `platform: ${os.platform()} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: node docs/sessions/evidence/task927/a7/a7-00-hashes.mjs ${outFile} "${label}"`,
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

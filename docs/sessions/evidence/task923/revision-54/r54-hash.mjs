// Task 923 Revision 54 (§80, AC154): sha256 of every path the revision writes.
// Usage: node r54-hash.mjs <out-file> <label> [extra paths...]   Paths come from r54-paths.json plus the extras.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..', '..', '..', '..')
const [out, label, ...extra] = process.argv.slice(2)
const listed = JSON.parse(readFileSync(resolve(import.meta.dirname, 'r54-paths.json'), 'utf8'))
const paths = [...new Set([...listed, ...extra])]
const lines = [
  `# ${label}`,
  `platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${root}`,
  `command: node ${process.argv.slice(1).join(' ')}`,
  '',
]
for (const p of paths) {
  const full = resolve(root, p)
  lines.push(`${existsSync(full) ? createHash('sha256').update(readFileSync(full)).digest('hex') : 'ABSENT'}  ${p}`)
}
lines.push('', `exit 0; ${paths.length} paths`)
writeFileSync(resolve(root, out), lines.join('\n') + '\n')
console.log(lines.join('\n'))

// Task 927 Amendment 5 (a5-10): the commit-based gate `check:ui-contract --base` cannot see uncommitted work, so this lists the components enrolled in the working tree's
// manifest but not in HEAD's, and checks that each has a registry row whose component and Story exist and whose Story exports exist.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const head = JSON.parse(execFileSync('git', ['show', 'HEAD:scripts/mantine-migration-scope.json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
const work = JSON.parse(fs.readFileSync('scripts/mantine-migration-scope.json', 'utf8'))
const manifest = (m) => (Array.isArray(m) ? m : m.components ?? m.paths ?? Object.values(m).find(Array.isArray))
const added = manifest(work).filter((p) => !manifest(head).includes(p))
const registry = JSON.parse(fs.readFileSync('scripts/ui-contract-registry.json', 'utf8'))
const lines = ['# a5-10: components newly enrolled in the working tree (against HEAD) and their registry rows', `platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, '']
let bad = 0
for (const component of added) {
  const row = registry.contracts?.find?.((r) => r.component === component) ?? (registry.rows ?? registry.entries ?? []).find?.((r) => r.component === component) ?? Object.values(registry).flat().find?.((r) => r && r.component === component)
  const stories = row?.stories ?? []
  const exportsOk = (row?.parity ?? []).every((p) => p.storyExports.every((name) => stories.some((s) => fs.existsSync(s) && new RegExp(`export const ${name}\\b`).test(fs.readFileSync(s, 'utf8')))))
  const ok = Boolean(row) && fs.existsSync(component) && stories.every((s) => fs.existsSync(s)) && exportsOk
  if (!ok) bad++
  lines.push(`${ok ? 'OK ' : 'FAIL'} ${component} -> row ${row ? row.id : 'MISSING'}; stories ${stories.join(', ')}; exports exist: ${exportsOk}`)
}
lines.push('', `newly enrolled: ${added.length}; without a complete row: ${bad}`, `exit code: ${bad ? 1 : 0}`)
fs.writeFileSync('docs/sessions/evidence/task927/a5/a5-10-newly-enrolled.txt', lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exitCode = bad ? 1 : 0

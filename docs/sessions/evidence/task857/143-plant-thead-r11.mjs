// Task 857 Revision 11, AC42 plant: set borderTop unconditionally; only the "without tableHeader" arm must fail. Node I/O only.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const ev = 'docs/sessions/evidence/task857'
const target = 'src/design-system/mantine/patterns/MantineDataTableToCards.tsx'
const test = 'src/design-system/mantine/patterns/__tests__/MantineDataTableToCards.thead.test.tsx'
const hash = () => spawnSync('git', ['hash-object', target], { encoding: 'utf8' }).stdout.trim()
const original = fs.readFileSync(target, 'utf8')
const needle = "...(tableHeader ? { borderTop: '1px solid var(--mantine-color-gray-1)' } : {}),"
const planted = "borderTop: '1px solid var(--mantine-color-gray-1)',"
if (original.split(needle).length !== 2) throw new Error('SCOPE GUARD FAILED: needle not unique')
const out = []
out.push(`before:   ${hash()}`)
try {
  fs.writeFileSync(target, original.replace(needle, planted))
  out.push(`planted:  ${hash()}`)
  const r = spawnSync('npx', ['vitest', 'run', test], { shell: true, encoding: 'utf8' })
  out.push(`planted run exit=${r.status}`)
  out.push((r.stdout + r.stderr).split('\n').filter((l) => /×|✓|FAIL|Tests |AssertionError|expected/.test(l)).join('\n'))
} finally {
  fs.writeFileSync(target, original)
}
out.push(`restored: ${hash()}`)
const r2 = spawnSync('npx', ['vitest', 'run', test], { shell: true, encoding: 'utf8' })
out.push(`restored run exit=${r2.status}`)
out.push((r2.stdout + r2.stderr).split('\n').filter((l) => /Tests /.test(l)).join('\n'))
fs.writeFileSync(`${ev}/143-plant-thead-r11.txt`, out.join('\n') + '\n')
console.log(out.join('\n'))

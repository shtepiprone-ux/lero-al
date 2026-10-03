// Task 857 Revision 12 AC45 — plant: put back stickyProps(idx, 'gray.0') on the header cell; restore; hashes via Node I/O.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
const ROOT = 'C:/Claude_Code_Projects/lero-al'
const F = 'src/design-system/mantine/patterns/MantineDataTableToCards.tsx'
const T = 'src/design-system/mantine/patterns/__tests__/MantineDataTableToCards.thead.test.tsx'
const MANIFEST = [F]
console.log('MANIFEST', MANIFEST.join(', '))
const abs = `${ROOT}/${F}`
const hash = () => spawnSync('git', ['hash-object', F], { cwd: ROOT, encoding: 'utf8' }).stdout.trim()
const run = () => spawnSync(`npx vitest run ${T}`, { cwd: ROOT, shell: true, encoding: 'utf8' })
const original = fs.readFileSync(abs, 'utf8')
const needle = `Table.Th\n                  key={col.key}\n                  visibleFrom={col.visibleFrom}\n                  {...stickyProps(idx, 'var(--mantine-color-body)')}`
if (original.split(needle).length !== 2) throw new Error('SCOPE GUARD FAILED: plant needle not unique')
const out = []
out.push(`before ${hash()}`)
fs.writeFileSync(abs, original.replace(needle, needle.replace("'var(--mantine-color-body)'", "'gray.0'")), 'utf8')
out.push(`planted ${hash()}`)
let r
try { r = run() } finally { fs.writeFileSync(abs, original, 'utf8') }
out.push(`restored ${hash()}`)
const planted = (r.stdout + r.stderr).split('\n').filter((l) => /×|✓|FAIL|Tests |passed|failed/.test(l)).join('\n')
out.push(`--- planted run (exit ${r.status}) ---\n${planted}`)
const r2 = run()
out.push(`--- restored run (exit ${r2.status}) ---\n${(r2.stdout + r2.stderr).split('\n').filter((l) => /×|✓|Tests /.test(l)).join('\n')}`)
fs.writeFileSync(`${ROOT}/docs/sessions/evidence/task857/146-plant-sticky-th-r12.txt`, out.join('\n') + '\n')
console.log(out.join('\n'))

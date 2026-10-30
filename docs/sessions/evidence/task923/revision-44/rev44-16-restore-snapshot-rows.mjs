// Task 923 Revision 44 (Opus, 2026-10-24): the second locator refresh (1 inserted row, rev44-08b) rewrote rev44-08-head-lines.txt with its header only, so 8 rows that the
// first refresh (rev44-08-refresh-locators.txt) had pointed into that snapshot cite missing lines. This puts each of them back on the locator the first refresh found
// it on, so that a rerun of the refresh rebuilds the snapshot. Claims and observed literals are unchanged. Keeps line endings. Usage (repository root): node rev44-16-restore-snapshot-rows.mjs
import fs from 'node:fs'

const K = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const SNAP = 'docs/sessions/evidence/task923/revision-44/rev44-08-head-lines.txt'
const first = fs.readFileSync('docs/sessions/evidence/task923/revision-44/rev44-08-refresh-locators.txt', 'utf8').split(/\r?\n/)
const raw = fs.readFileSync(K, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.replace(/\r\n/g, '\n').split('\n')
let n = 0
for (const l of first) {
  const m = l.match(/^(C\d+) (\S+):(\d+)(?:-(\d+))? -> (\S+):(\d+)-(\d+)$/)
  if (!m || m[5] !== SNAP) continue
  const [, id, src, a, b, , c, d] = m
  const i = lines.findIndex((r) => r.startsWith(`| ${id} | FACT |`))
  const from = `\`${SNAP}:${c}-${d}\``
  const to = `\`${src}:${a}-${b ?? a}\``
  if (i < 0 || !lines[i].includes(from)) throw new Error(`${id}: snapshot locator absent`)
  lines[i] = lines[i].replace(from, to)
  n++
  console.log(`${id} ${from} -> ${to}`)
}
fs.writeFileSync(K, lines.join('\n').replace(/\n/g, eol))
console.log(`restored ${n}`)

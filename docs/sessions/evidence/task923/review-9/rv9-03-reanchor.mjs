// Task 923 review 9: re-anchor kickoff claims whose literal moved or was removed by the session's own changes.
// 1. Literal still in the current file -> cite its nearest current line.
// 2. Literal gone from the file but present at HEAD -> copy the HEAD line(s) into rv9-03-base-snapshot.txt and cite that.
// 3. Literal of an untracked file now gone -> cite the named earlier evidence file that retains it.
// Dry run by default; `--apply` writes the snapshot and the kickoff ledger. The claim text is not changed.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const K = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const SNAP = 'docs/sessions/evidence/task923/review-9/rv9-03-base-snapshot.txt'
const HEAD_SHA = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const FALLBACK = {
  C273: 'docs/sessions/evidence/task923/design-r8/role-guard-inventory.json',
  C277: 'docs/sessions/evidence/task923/r9-40-vitest-after-r44.txt',
  C288: 'docs/sessions/evidence/task923/db-catalog/proposed-hardening.v3.sql.bak',
  C289: 'docs/sessions/evidence/task923/db-catalog/proposed-hardening.v3.sql.bak',
}
const norm = s => s.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim()
const findAll = (lines, span, lit) => {
  const hits = []
  for (let j = 0; j + span < lines.length; j++) if (norm(lines.slice(j, j + span + 1).join('\n')).includes(norm(lit))) hits.push(j + 1)
  return hits
}
const nearest = (hits, st) => hits.reduce((a, b) => (Math.abs(b - st) < Math.abs(a - st) ? b : a))

const text = fs.readFileSync(K, 'utf8')
const rows = text.split('\n')
const snap = [`# Task 923 review 9 - base-state lines copied from HEAD ${HEAD_SHA} for kickoff claims whose literal the session's changes removed`, '']
const changes = []
const unresolved = []
for (const [i, row] of rows.entries()) {
  const m = row.match(/^\| (C\d+) \| FACT \|.*?source:\s*`([^\s`;]+):(\d+)(?:-(\d+))?`;\s*observed:\s*`([^`]+)`/)
  if (!m) continue
  const [, id, p, s, e = s, lit] = m
  const st = +s, en = +e, span = en - st
  const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8').split(/\r?\n/) : []
  if (norm(cur.slice(st - 1, en).join('\n')).includes(norm(lit))) continue
  let source
  const curHits = findAll(cur, span, lit)
  if (curHits.length) {
    const n = nearest(curHits, st)
    source = `${p}:${n}-${n + span}`
  } else {
    let head = null
    try { head = execFileSync('git', ['show', `HEAD:${p}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 }).split(/\r?\n/) } catch { head = null }
    const headHits = head ? findAll(head, span, lit) : []
    if (headHits.length) {
      const n = nearest(headHits, st)
      snap.push(`## ${id} - ${p}:${n}-${n + span} at HEAD`)
      const a = snap.length + 1
      snap.push(...head.slice(n - 1, n + span))
      snap.push('')
      source = `${SNAP}:${a}-${a + span}`
    } else if (FALLBACK[id]) {
      const f = fs.readFileSync(FALLBACK[id], 'utf8').split(/\r?\n/)
      const hits = findAll(f, 0, lit)
      if (hits.length) source = `${FALLBACK[id]}:${hits[0]}-${hits[0]}`
    }
  }
  if (!source) { unresolved.push(id); continue }
  const updated = row.replace(/source:\s*`[^`]+`/, `source: \`${source}\``)
  changes.push({ id, from: `${p}:${st}-${en}`, to: source })
  rows[i] = updated
}
for (const c of changes) console.log(`${c.id}: ${c.from} -> ${c.to}`)
console.log(`re-anchored ${changes.length}; unresolved ${unresolved.length} ${unresolved.join(', ')}`)
if (process.argv.includes('--apply')) {
  fs.writeFileSync(SNAP, snap.join('\n') + '\n')
  fs.writeFileSync(K, rows.join('\n'))
  console.log('applied')
}

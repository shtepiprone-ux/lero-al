// Task 923 Review 37 / Revision 34 (Opus, 2026-10-23): refresh the LOCATORS of claim rows whose cited line no longer holds the observed literal. Causes: the
// uncommitted R110–R113 code moved, changed or deleted cited lines, and this revision's 14 inserted ledger rows shifted the kickoff's citations of itself. The claim and
// the observed literal of each row are never changed; only `path:start-end` is. Copied from revision-34/rv34-07-refresh-locators.mjs with its own snapshot path.
//  1. A citation of the kickoff itself is searched in the kickoff outside the Claim ledger, nearest to the original line shifted by the inserted rows.
//  2. Any other source is searched in the file at HEAD (`git show`, read-only): HEAD is what the checker reads at the commit, and the working tree holds
//     uncommitted code of this task. The matching lines are copied into rv37-25-head-lines.txt and the row is pointed there, so it holds in both trees.
//  3. A literal that only the uncommitted working tree holds is copied from there into the same snapshot, labelled as working-tree lines.
//  4. A row that none finds is printed as UNRESOLVED and left unchanged.
// Usage: node rv34-07-refresh-locators.mjs <repo root> <kickoff path> <inserted row count> [--write]
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const [root, kickoff, insertedArg, flag] = process.argv.slice(2)
const inserted = Number(insertedArg)
const write = flag === '--write'
const SNAP = 'docs/sessions/evidence/task923/review-37/rv37-25-head-lines.txt'
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const norm = (v) => v.replace(/\s+/g, ' ').trim()
const text = fs.readFileSync(path.join(root, kickoff), 'utf8')
const klines = text.split(/\r?\n/)
const ledgerStart = klines.findIndex((l) => /^## Claim ledger/.test(l))
const ledgerEnd = klines.findIndex((l, i) => i > ledgerStart && /^## /.test(l))
const rowRe = /^\| (C\d+) \| FACT \| .*?source:\s*`?([^\s`;]+):(\d+)(?:-(\d+))?`?;\s*observed:\s*`([^`]+)`/
function find(lines, observed, len, near, skip) {
  const want = norm(observed)
  let best = null
  for (let w = len; w <= Math.max(len + 6, 8); w++) {
    for (let i = 0; i + w <= lines.length; i++) {
      if (skip && skip(i, w)) continue
      if (norm(lines.slice(i, i + w).join('\n')).includes(want)) {
        const d = Math.abs(i + 1 - near)
        if (!best || d < best.d) best = { start: i + 1, d, len: w }
      }
    }
    if (best) return best
  }
  return null
}
const snap = [`# HEAD ${head} lines cited by Task 923 claim rows whose working-tree source changed (Review 37, rv37-25-refresh-locators.mjs)`]
const out = []
let changed = 0
let unresolved = 0
for (let n = ledgerStart + 1; n < ledgerEnd; n++) {
  const m = klines[n].match(rowRe)
  if (!m) continue
  const [, id, src, s, e, observed] = m
  const start = +s
  const end = +(e || s)
  const len = end - start + 1
  const isKickoff = src === kickoff
  const abs = path.join(root, src)
  const lines = isKickoff ? klines : fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8').split(/\r?\n/) : null
  const inLedger = isKickoff && start - 1 >= ledgerStart && start - 1 < ledgerEnd
  if (lines && !inLedger && norm(lines.slice(start - 1, end).join('\n')).includes(norm(observed))) continue
  let target = null
  if (isKickoff) {
    const skip = (i, w) => i < ledgerEnd && i + w > ledgerStart
    const hit = find(klines, observed, len, start > ledgerStart ? start + inserted : start, skip)
    if (hit) target = `${src}:${hit.start}-${hit.start + hit.len - 1}`
  } else {
    let buf = null
    try { buf = execFileSync('git', ['show', 'HEAD:' + src], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 }) } catch { buf = null }
    if (buf) {
      const hl = buf.split(/\r?\n/)
      const hit = find(hl, observed, len, start)
      if (hit) {
        snap.push(`== ${src} at HEAD ${head}, lines ${hit.start}-${hit.start + hit.len - 1}`)
        const first = snap.length + 1
        for (let k = 0; k < hit.len; k++) snap.push(hl[hit.start - 1 + k])
        target = `${SNAP}:${first}-${first + hit.len - 1}`
      }
    }
    // the literal is in uncommitted Task 923 code only (D68): the working-tree lines are copied into the same snapshot, labelled as such
    if (!target && lines) {
      const hit = find(lines, observed, len, start)
      if (hit) {
        snap.push(`== ${src} in the working tree (uncommitted Task 923 code), lines ${hit.start}-${hit.start + hit.len - 1}`)
        const first = snap.length + 1
        for (let k = 0; k < hit.len; k++) snap.push(lines[hit.start - 1 + k])
        target = `${SNAP}:${first}-${first + hit.len - 1}`
      }
    }
  }
  if (!target) { unresolved++; out.push(`UNRESOLVED ${id} ${src}:${start}-${end}`); continue }
  klines[n] = klines[n].replace(/source:\s*`[^`]+`/, `source: \`${target}\``)
  changed++
  out.push(`${id} ${src}:${start}${e ? '-' + end : ''} -> ${target}`)
}
console.log(out.join('\n'))
console.log(`changed ${changed}, unresolved ${unresolved}`)
if (write) {
  fs.writeFileSync(path.join(root, kickoff), klines.join(text.includes('\r\n') ? '\r\n' : '\n'))
  fs.writeFileSync(path.join(root, SNAP), snap.join('\n') + '\n')
}

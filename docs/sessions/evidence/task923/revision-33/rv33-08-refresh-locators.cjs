/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */ // Task 923 Revision 30 design (Opus, 2026-10-22): refresh the LOCATORS of claim rows whose cited line no longer holds the observed literal, because the
// uncommitted Task 923 code (R100 and earlier executions) and the shift of this revision's own inserted rows moved the text. The claim and the observed
// literal of each row are never changed; only `path:start-end` is.
//  1. The literal is searched in the same file of the working tree (for the kickoff itself, outside the Claim ledger), and the window of the original
//     length nearest to the original line is taken.
//  2. When the file no longer exists or no longer holds the literal, the same search runs on the file at HEAD (`git show`, read-only); the matching lines
//     are copied into the snapshot file rv33-08-head-lines.txt and the row is pointed there.
//  3. A row that neither finds is printed as UNRESOLVED and left unchanged.
// Usage: node rv33-08-refresh-locators.cjs <repo root> <kickoff path> [--write]
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process')
const [root, kickoff, flag] = process.argv.slice(2)
const write = flag === '--write'
const SNAP = 'docs/sessions/evidence/task923/revision-33/rv33-08-head-lines.txt'
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const norm = v => v.replace(/\s+/g, ' ').trim()
let text = fs.readFileSync(path.join(root, kickoff), 'utf8')
const klines = text.split(/\r?\n/)
const ledgerStart = klines.findIndex(l => /^## Claim ledger/.test(l))
const ledgerEnd = klines.findIndex((l, i) => i > ledgerStart && /^## /.test(l))
const rowRe = /^\| (C\d+) \| FACT \| .*?source:\s*`?([^\s`;]+):(\d+)(?:-(\d+))?`?;\s*observed:\s*`([^`]+)`/
function find(lines, observed, len, near, skip) {
  const want = norm(observed); let best = null
  for (let i = 0; i + len <= lines.length; i++) {
    if (skip && skip(i, len)) continue
    if (norm(lines.slice(i, i + len).join('\n')).includes(want)) { const d = Math.abs(i + 1 - near); if (!best || d < best.d) best = { start: i + 1, d } }
  }
  if (best) return best
  // a literal may have been reflowed over a different number of lines
  for (let w = 1; w <= Math.max(len + 6, 8); w++) for (let i = 0; i + w <= lines.length; i++) {
    if (skip && skip(i, w)) continue
    if (norm(lines.slice(i, i + w).join('\n')).includes(want)) { const d = Math.abs(i + 1 - near); if (!best || d < best.d || (d === best.d && w < best.len)) best = { start: i + 1, d, len: w } }
    if (best && best.len === w) break
  }
  return best
}
const snap = fs.existsSync(path.join(root, SNAP)) ? fs.readFileSync(path.join(root, SNAP), 'utf8').split('\n').filter((l, i, a) => i < a.length - 1 || l) : [`# HEAD ${head} lines cited by Task 923 claim rows whose working-tree source changed or was removed (Revision 30 locator refresh)`]
const out = []; let changed = 0, unresolved = 0
for (let n = ledgerStart + 1; n < ledgerEnd; n++) {
  const m = klines[n].match(rowRe); if (!m) continue
  const [, id, src, s, e, observed] = m
  const start = +s, end = +(e || s), len = end - start + 1
  const abs = path.join(root, src)
  const isKickoff = src === kickoff
  let lines = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8').split(/\r?\n/) : null
  if (isKickoff) lines = klines
  if (lines && norm(lines.slice(start - 1, end).join('\n')).includes(norm(observed)) && !(isKickoff && start - 1 >= ledgerStart && start - 1 < ledgerEnd)) continue
  let target = null
  if (lines) {
    const skip = isKickoff ? (i, w) => i < ledgerEnd && i + w > ledgerStart : null
    const near = isKickoff ? start + (start > ledgerEnd - 60 ? 51 : 0) : start
    const hit = find(lines, observed, len, near, skip)
    if (hit) target = `${src}:${hit.start}-${hit.start + (hit.len || len) - 1}`
  }
  if (!target && !isKickoff) {
    let buf = null; try { buf = execFileSync('git', ['show', 'HEAD:' + src], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 }) } catch {}
    if (buf) {
      const hl = buf.split(/\r?\n/); const hit = find(hl, observed, len, start)
      if (hit) {
        const w = hit.len || len
        snap.push(`== ${src} at HEAD ${head}, lines ${hit.start}-${hit.start + w - 1}`)
        const first = snap.length + 1
        for (let k = 0; k < w; k++) snap.push(hl[hit.start - 1 + k])
        target = `${SNAP}:${first}-${first + w - 1}`
      }
    }
  }
  if (!target) { unresolved++; out.push(`UNRESOLVED ${id} ${src}:${start}-${end}`); continue }
  const was = `${src}:${start}${e ? '-' + end : ''}`
  klines[n] = klines[n].replace(/source:\s*`[^`]+`/, `source: \`${target}\``)
  changed++; out.push(`${id} ${was} -> ${target}`)
}
console.log(out.join('\n')); console.log(`changed ${changed}, unresolved ${unresolved}`)
if (write) { fs.writeFileSync(path.join(root, kickoff), klines.join(text.includes('\r\n') ? '\r\n' : '\n')); fs.writeFileSync(path.join(root, SNAP), snap.join('\n') + '\n') }

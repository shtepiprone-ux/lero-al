// Task 923 Review 39 (Opus, 2026-10-23): C1072 and C1073 cite two lines of the pre-R117 working-tree CaptchaWidget.tsx. R117 changed both lines and HEAD never held
// them, so rv39-27 left them UNRESOLVED. Their only retained copy is Opus's Review 38 read, found by rv39-28-find-lines.cjs in transcript
// 2fa8cad4-d4b2-4f4e-aec4-747582a94e28.jsonl, entry 1589, 2026-10-23T06:51:38.172Z. This script appends those two lines to rv39-27-head-lines.txt under that
// provenance and points both rows at them. The claims and observed literals do not change. Idempotent.
// Usage: node rv39-29-repoint-c1072-c1073.mjs <repo root> <kickoff path>
import fs from 'node:fs'
import path from 'node:path'

const [root, kickoff] = process.argv.slice(2)
const SNAP = 'docs/sessions/evidence/task923/review-39/rv39-27-head-lines.txt'
const snapFile = path.join(root, SNAP)
const HEADER = '== src/components/auth/CaptchaWidget.tsx before R117 (working tree, read by Opus in Review 38: transcript 2fa8cad4-d4b2-4f4e-aec4-747582a94e28.jsonl entry 1589, 2026-10-23T06:51:38.172Z), lines 86 and 108'
const ROWS = [
  ['C1072', '        if (onDemand) widget.execute()'],
  ['C1073', '            onError={() => { setChallengeShown(false); onError?.() }}'],
]
let snap = fs.readFileSync(snapFile, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '')
if (!snap.includes(HEADER)) snap += '\n' + HEADER + '\n' + ROWS.map(([, l]) => l).join('\n')
fs.writeFileSync(snapFile, snap + '\n')
const snapLines = snap.split('\n')

const kfile = path.join(root, kickoff)
const raw = fs.readFileSync(kfile, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
for (const [id, literal] of ROWS) {
  const n = snapLines.indexOf(literal) + 1
  if (n < 1) throw new Error('snapshot line missing for ' + id)
  const i = lines.findIndex((l) => l.startsWith(`| ${id} | FACT |`))
  if (i < 0) throw new Error(id + ' row not found')
  lines[i] = lines[i].replace(/source: `src\/components\/auth\/CaptchaWidget\.tsx:\d+-\d+`/, `source: \`${SNAP}:${n}-${n}\``)
  console.log(id, '->', `${SNAP}:${n}-${n}`)
}
fs.writeFileSync(kfile, lines.join(eol))

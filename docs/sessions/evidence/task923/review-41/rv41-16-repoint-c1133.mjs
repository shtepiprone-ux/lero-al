// Task 923 Review 41 (Opus, 2026-10-23), after review-40/rv40-24-repoint-c1118-c1119.mjs. C1133 cites the container's refusal mapping as it was before R127, which added
// `rate_limited`, and HEAD holds no version with that line, so rv41-15 left it UNRESOLVED.
// Its retained copy is Opus's own Read output in this session's transcript c1f16c21-dbad-4f8c-94df-690a447a1510.jsonl, entry 149, 2026-10-23T11:16:49.551Z. That copy is
// line 142 of the version before R121; R121 moved the line to 143 and did not change it. rv40-22-find-lines.cjs finds it.
// This script appends the line to rv41-15-head-lines.txt under that provenance and points C1133 at it. The claim and the literal do not change. Idempotent.
// Usage: node rv41-16-repoint-c1133.mjs <repo root> <kickoff path>
import fs from 'node:fs'
import path from 'node:path'

const [root, kickoff] = process.argv.slice(2)
const SNAP = 'docs/sessions/evidence/task923/review-41/rv41-15-head-lines.txt'
const snapFile = path.join(root, SNAP)
const header = '== src/modules/listings/components/ListingContact.tsx before R127 (working tree; Opus Read output, transcript c1f16c21-dbad-4f8c-94df-690a447a1510.jsonl entry 149, 2026-10-23T11:16:49.551Z), line 142 of that version'
const line = "      toast.error(t(result.reason === 'bot_check_failed' ? 'contact_bot_check_failed' : 'contact_load_failed'))"
let snap = fs.readFileSync(snapFile, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '')
if (!snap.includes(header)) snap += '\n' + header + '\n' + line
fs.writeFileSync(snapFile, snap + '\n')
const at = snap.split('\n').indexOf(header) + 2

const kfile = path.join(root, kickoff)
const raw = fs.readFileSync(kfile, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
const i = lines.findIndex((l) => l.startsWith('| C1133 | FACT |'))
if (i < 0) throw new Error('C1133 row not found')
const from = 'source: `src/modules/listings/components/ListingContact.tsx:143-143`'
if (lines[i].includes(from)) {
  lines[i] = lines[i].replace(from, `source: \`${SNAP}:${at}-${at}\``)
  console.log('C1133 ->', `${SNAP}:${at}-${at}`)
} else console.log('C1133 already repointed or unexpected source')
fs.writeFileSync(kfile, lines.join(eol))

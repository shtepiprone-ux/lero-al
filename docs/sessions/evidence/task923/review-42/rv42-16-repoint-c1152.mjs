// Task 923 Review 42 (Opus, 2026-10-23), after review-41/rv41-16-repoint-c1133.mjs. C1152 cites the container's comment as it was before R131 changed it, and HEAD
// holds no version with that line, so rv42-15 left it UNRESOLVED. Its retained copy is Opus's own Read output in this session's transcript
// c1f16c21-dbad-4f8c-94df-690a447a1510.jsonl, entry 3359, 2026-10-23T15:38:47.856Z, line 84 (rv40-22-find-lines.cjs finds it).
// This script appends that line to rv42-15-head-lines.txt under that provenance and points C1152 at it. The claim and the literal do not change. Idempotent.
// Usage: node rv42-16-repoint-c1152.mjs <repo root> <kickoff path>
import fs from 'node:fs'
import path from 'node:path'

const [root, kickoff] = process.argv.slice(2)
const SNAP = 'docs/sessions/evidence/task923/review-42/rv42-15-head-lines.txt'
const snapFile = path.join(root, SNAP)
const header = '== src/modules/listings/components/ListingContact.tsx before R131 (working tree; Opus Read output, transcript c1f16c21-dbad-4f8c-94df-690a447a1510.jsonl entry 3359, 2026-10-23T15:38:47.856Z), line 84'
const line = '  // What the gateway answered (Task 923 R119, owner D75, D78). Both stay for the life of the page: a later press of the link needs no new request.'
let snap = fs.readFileSync(snapFile, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '')
if (!snap.includes(header)) snap += '\n' + header + '\n' + line
fs.writeFileSync(snapFile, snap + '\n')
const at = snap.split('\n').indexOf(header) + 2

const kfile = path.join(root, kickoff)
const raw = fs.readFileSync(kfile, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
const i = lines.findIndex((l) => l.startsWith('| C1152 | FACT |'))
if (i < 0) throw new Error('C1152 row not found')
const from = 'source: `src/modules/listings/components/ListingContact.tsx:84-84`'
if (lines[i].includes(from)) {
  lines[i] = lines[i].replace(from, `source: \`${SNAP}:${at}-${at}\``)
  console.log('C1152 ->', `${SNAP}:${at}-${at}`)
} else console.log('C1152 already repointed or unexpected source')
fs.writeFileSync(kfile, lines.join(eol))

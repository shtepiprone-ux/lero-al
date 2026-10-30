/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 16 (AC62, AC63): the SHA-256 of the four generated files and of the retained copies of the files Opus reviewed before (the reviewed hashes are the ones of kickoff section 25 item 1
// = C469 for deletion v2, and section 26 item 1 for hardening v6, withdrawn in section 27). Prints whether any new hash equals a reviewed one (it must not: the files changed).
const fs = require('fs')
const crypto = require('crypto')
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/'
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(D + f)).digest('hex')
const NEW = ['proposed-hardening.sql', 'proposed-hardening-rollback.sql', 'proposed-account-deletion.sql', 'proposed-account-deletion-rollback.sql']
const OLD = ['proposed-hardening.v6.sql.bak', 'proposed-hardening-rollback.v6.sql.bak', 'proposed-account-deletion.v2.sql.bak', 'proposed-account-deletion-rollback.v2.sql.bak']
const REVIEWED = { 'C469 deletion v2 (review 16, withdrawn by review 17)': 'c5e61f0a006b61bfe60a0571cd6f033b66886a6a4f89a5b53c8a33be15a64bd8', 'section 26 item 1 hardening v6 (approved by review 17, withdrawn by review 18)': '217bd678092faaf33e5c084dacb8de787e669080853d2d69614d8579697b8726' }
console.log('the four files (v7 hardening + rollback, v3 deletion + rollback):')
const now = {}
for (const f of NEW) { now[f] = sha(f); console.log(`  ${now[f]}  ${f}`) }
console.log('the retained copies of the previous versions (the files that were reviewed):')
for (const f of OLD) console.log(`  ${sha(f)}  ${f}`)
let clash = 0
for (const [label, h] of Object.entries(REVIEWED)) {
  const hit = Object.entries({ ...now, ...Object.fromEntries(OLD.map((f) => [f, sha(f)])) }).filter(([, v]) => v === h).map(([k]) => k)
  console.log(`reviewed hash ${h.slice(0, 8)}... (${label}) is the hash of: ${hit.join(', ') || 'no retained file'}`)
  if (hit.some((k) => NEW.includes(k))) clash++
}
console.log(clash ? 'RESULT: a new file still has a reviewed hash' : 'RESULT: no new file has a reviewed hash; the copies of the previous versions have the reviewed ones')
process.exit(clash ? 1 : 0)

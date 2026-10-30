/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code */
// Task 923 Review 49 (Opus, 2026-10-24): writes db-catalog/proposed-account-deletion.dryrun.sql, the owner's dry run of deletion v4. As for the precedents
// proposed-contact-reveals.dryrun.sql and proposed-hardening-v8a.dryrun.sql, it equals the apply file except its LAST line: `commit;` becomes `rollback;`.
// Refuses unless the apply file is the reviewed v4 (sha256), holds exactly one `commit;` line and ends with it. Prints the sha256 and md5 of the three files.
// Usage (repository root): node docs/sessions/evidence/task923/review-49/rv49-02-make-dryrun.cjs
const fs = require('node:fs')
const crypto = require('node:crypto')
const C = 'docs/sessions/evidence/task923/db-catalog/'
const APPLY_SHA = 'cdc690e47ced1e2c346f5ed1c2bdb1e0ac51b6c7aa3526b404b483d1cd4a6f23'
const ROLLBACK_SHA = '9d5110ff1ae9477af1230a5206b1a1d988b8f47dadf043a400d65122309e2bf1'
const hash = (alg, buf) => crypto.createHash(alg).update(buf).digest('hex')

const apply = fs.readFileSync(C + 'proposed-account-deletion.sql')
const rollback = fs.readFileSync(C + 'proposed-account-deletion-rollback.sql')
if (hash('sha256', apply) !== APPLY_SHA) throw new Error('the apply file is not the reviewed v4')
if (hash('sha256', rollback) !== ROLLBACK_SHA) throw new Error('the rollback file is not the reviewed v4')
const text = apply.toString('utf8')
if (text.includes('\r')) throw new Error('the apply file is expected with LF line endings')
const lines = text.split('\n')
if (lines.filter((l) => l === 'commit;').length !== 1) throw new Error('expected exactly one commit; line')
if (!text.endsWith('\ncommit;\n')) throw new Error('the apply file does not end with commit;')
const dry = text.slice(0, -'commit;\n'.length) + 'rollback;\n'
fs.writeFileSync(C + 'proposed-account-deletion.dryrun.sql', dry)

const a = text.split('\n')
const d = dry.split('\n')
const changed = a.map((l, i) => (l === d[i] ? null : i + 1)).filter(Boolean)
console.log(`lines ${a.length} and ${d.length}; changed line numbers: ${changed.join(', ')} (${JSON.stringify(a[changed[0] - 1])} -> ${JSON.stringify(d[changed[0] - 1])})`)
for (const f of ['proposed-account-deletion.dryrun.sql', 'proposed-account-deletion.sql', 'proposed-account-deletion-rollback.sql']) {
  const b = fs.readFileSync(C + f)
  console.log(`${f}: sha256 ${hash('sha256', b).toUpperCase()}; md5 ${hash('md5', b)}; bytes ${b.length}`)
}

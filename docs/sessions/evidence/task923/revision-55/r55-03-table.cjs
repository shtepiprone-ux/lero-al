/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923 Revision 55), not product code */
const fs = require('fs')
const src = fs.readFileSync('docs/sessions/evidence/task923/security/sensitivity.mjs', 'utf8')
// the 21 database cases: FRESH entries with a db key (the 20 SEC-DB-* / SEC-X-INT-REVEAL-TABLE-* ids from the spread list plus SEC-DEL-INT-STAFF)
const list = src.match(/\.\.\.\[('SEC-DB-S59-DENY'[\s\S]*?)\]\s*\.map/)[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1))
const ids = ['SEC-DEL-INT-STAFF', ...list]
const rows = []
let bad = 0
for (const id of ids) {
  const p = `docs/sessions/evidence/task923/security/sensitivity/${id}.json`
  if (!fs.existsSync(p)) { rows.push(`| ${id} | ABSENT |`); bad++; continue }
  const a = JSON.parse(fs.readFileSync(p, 'utf8')); const r = a.results[0]; const d = r.databaseBreak || {}
  const ok = r.baseline === 'passed' && r.mutant === 'failed' && r.failureKind === 'assertion' && r.restored === 'passed' && d.equal === true && d.fingerprintBefore && d.fingerprintBefore === d.fingerprintAfter
  if (!ok) bad++
  rows.push(`| ${id} | ${r.baseline} | ${r.mutant} | ${r.failureKind} | ${r.restored} | ${d.equal} | ${d.fingerprintBefore === d.fingerprintAfter ? 'equal ' + String(d.fingerprintBefore).slice(0, 12) : 'DIFFER'} | ${a.generatedAt} | ${ok ? 'OK' : 'FAIL'} |`)
}
console.log('| case | baseline | mutant | failureKind | restored | databaseBreak.equal | fingerprintBefore vs After | generatedAt | check |')
console.log('|---|---|---|---|---|---|---|---|---|')
console.log(rows.join('\n'))
console.log(`cases: ${ids.length}; failing the five-value check: ${bad}`)
process.exitCode = bad ? 1 : 0

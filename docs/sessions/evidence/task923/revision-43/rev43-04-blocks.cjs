/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code */
// Task 923 Revision 43 (Opus, 2026-10-24): copied from review-48/rv48-26-dry-v4-blocks.cjs for R140 (e); unchanged otherwise.
// Task 923 Review 48 (Opus, 2026-10-24): the feasibility dry run of Revision 43. The preflight of an apply file ("do $pre$" to "end $pre$;") and the end checks of a rollback file
// (its last "do $chk$ ... end $chk$;" block, or, without one, its last "do $$ ... end $$;" block) are cut byte for byte and each runs alone in a READ ONLY transaction that is
// rolled back, with the file's LF and with every LF turned into CRLF. Nothing is written. Connection details are scrubbed by db-catalog/lib.cjs.
// Usage (repository root; pg from NODE_PATH): node docs/sessions/evidence/task923/review-48/rv48-26-dry-v4-blocks.cjs <apply.sql> <rollback.sql>
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const lib = require(path.resolve('docs/sessions/evidence/task923/db-catalog/lib.cjs'))

const [applyFile, rollbackFile] = process.argv.slice(2).map((f) => path.resolve(f))
const cut = (text, open, close, last) => {
  const s = last ? text.lastIndexOf(open) : text.indexOf(open)
  if (s < 0) return null
  return text.slice(s, text.indexOf(close, s) + close.length)
}
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const applyText = fs.readFileSync(applyFile, 'utf8')
const rbText = fs.readFileSync(rollbackFile, 'utf8')
const blocks = [
  ['apply preflight', cut(applyText, 'do $pre$', 'end $pre$;', false)],
  ['rollback end checks', cut(rbText, 'do $chk$', 'end $chk$;', true) ?? cut(rbText, 'do $$', 'end $$;', true)],
]
console.log(`${path.basename(applyFile)} sha256 ${sha(applyFile)}; ${path.basename(rollbackFile)} sha256 ${sha(rollbackFile)}`)
for (const [label, b] of blocks) console.log(`${label}: ${b ? b.length + ' chars, first line ' + JSON.stringify(b.split('\n')[0]) : 'NOT FOUND'}`)

;(async () => {
  let failing = 0
  for (const [label, block] of blocks) {
    if (!block) { failing++; continue }
    for (const [eol, sql] of [['LF', block], ['CRLF', block.replace(/\n/g, '\r\n')]]) {
      const c = await lib.connect()
      try {
        await c.query('begin read only')
        const ro = (await c.query('show transaction_read_only')).rows[0].transaction_read_only
        await c.query('set local search_path = public, pg_temp')
        try { await c.query(sql); console.log(`${label} with ${eol}: ok (read_only=${ro})`) } catch (e) { failing++; console.log(`${label} with ${eol}: ERROR ${lib.scrub(e.message)} (read_only=${ro})`) }
        await c.query('rollback')
      } finally { await c.end() }
    }
  }
  console.log(`failing ${failing}`)
  process.exitCode = failing ? 1 : 0
})().catch((e) => { console.log(`FAILED ${lib.scrub(e.message)}`); process.exitCode = 1 })

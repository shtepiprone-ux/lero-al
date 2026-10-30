/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code */
// Task 923 Revision 43 (Opus, 2026-10-24): copied from review-48/rv48-27-literal-scan.cjs for R140 (e); unchanged otherwise.
// Task 923 Review 48 (Opus, 2026-10-24): counts the single-quoted string literals of SQL files outside `--` comments and dollar-quoted bodies' comments, and lists any that spans
// lines (an editor paste can turn its LF into CRLF and change its value, Review 29). Usage: node docs/sessions/evidence/task923/review-48/rv48-27-literal-scan.cjs <file.sql> ...
const fs = require('node:fs')
let spanning = 0
for (const f of process.argv.slice(2)) {
  const text = fs.readFileSync(f, 'utf8').split('\n').map((l) => l.replace(/--.*$/, '')).join('\n')
  const lits = text.match(/'(?:[^']|'')*'/g) ?? []
  const multi = lits.filter((l) => l.includes('\n'))
  spanning += multi.length
  console.log(`${f}: ${lits.length} literals, ${multi.length} spanning lines${multi.length ? ': ' + multi.map((m) => JSON.stringify(m.slice(0, 60))).join(', ') : ''}`)
}
process.exitCode = spanning ? 1 : 0

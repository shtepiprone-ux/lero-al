/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script, run with node */
// Opus, Task 923 review 21: finds where the literals of the claim rows the re-anchoring could not place were captured in this task's evidence.
const fs = require('fs'), p = require('path')
const lits = {
  C508: "const { data } = await db.from('users').select('id, role').in('id', [actorId, ta",
  C509: "return roleOf(targetId) !== 'admin'",
  C514: "if (!(await getStaffRole())) return NextResponse.json({ error: 'forbidden' }",
  C521: 'Until then the old sessions of the account stay valid after an e-mail change.',
  C543: 'for (const crumb of event.breadcrumbs ?? []) {',
  C605: "const { count } = await db.from('listings').select('*', { count: 'exact', head:",
  C685: "if (viewer.role !== 'admin' && viewer.role !== 'moderator') throw new Error('for",
}
function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const q = p.join(d, f.name)
    if (f.isDirectory()) { if (!/node_modules|cov-|sensitivity/.test(q)) walk(q, out) }
    else if (/\.(txt|md|ts|tsx|json|jsonl|patch|diff|cjs|mjs)$/.test(f.name) && fs.statSync(q).size < 5e6) out.push(q)
  }
  return out
}
const files = walk('docs/sessions/evidence/task923', [])
for (const [id, l] of Object.entries(lits)) {
  const hits = []
  for (const f of files) {
    const t = fs.readFileSync(f, 'utf8'); const i = t.indexOf(l)
    if (i >= 0) { hits.push(f.split(p.sep).join('/') + ':' + t.slice(0, i).split('\n').length); if (hits.length > 2) break }
  }
  console.log(id, hits.join(' | ') || 'NONE')
}

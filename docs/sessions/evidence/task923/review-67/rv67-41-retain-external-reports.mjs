// Task 923 Review 67 (Opus): five kickoff rows (C506, C543, C557, C619, C620) cite docs/chat-gpt-reports/, which .gitignore:91 ignores, so CI's
// check:kickoff-evidence (base..head checkout) would not find them. This keeps tracked copies under rv67-41-retained/ and rebinds the rows to them:
//   - the two probe JSON files (English, under 1 KB) whole, so the cited line numbers stay;
//   - of the Ukrainian deep-audit report only the cited lines, verbatim, with their original line numbers and the original's sha256 (project files stay English;
//     the two literals are already quoted in the kickoff rows).
// Usage: node <this> [--write]; without --write it prints only.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const E = 'docs/sessions/evidence/task923/review-67'
const R = `${E}/rv67-41-retained`
const K = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const AUDIT = 'docs/chat-gpt-reports/2026-10-19-deep-audit.md'
const WHOLE = ['docs/chat-gpt-reports/2026-10-19-full-avatar-rank-probe.json', 'docs/chat-gpt-reports/2026-10-20-full-admin-layout-probe.json']
const ROWS = ['C506', 'C543', 'C557', 'C619', 'C620']
const write = process.argv.includes('--write')
const sha = (b) => createHash('sha256').update(b).digest('hex')
const out = [`platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}; command: node ${E}/rv67-41-retain-external-reports.mjs${write ? ' --write' : ''}`]

const text = readFileSync(K, 'utf8')
const eol = text.includes('\r\n') ? '\r\n' : '\n'
const lines = text.split(/\r?\n/)
const rows = lines.map((l, i) => [i, /^\| (C\d+) \|/.exec(l)?.[1]]).filter(([, id]) => ROWS.includes(id))
const cites = rows.map(([i, id]) => {
  const m = /source: `([^`]+?):(\d+)-(\d+)`; observed: `([^`]+)`/.exec(lines[i])
  return { i, id, whole: m[0], path: m[1], a: Number(m[2]), b: Number(m[3]), lit: m[4] }
})

// the excerpt of the audit report: header, then one line per cited original line, "<n>: <line>"
const audit = readFileSync(AUDIT)
const auditLines = audit.toString('utf8').split(/\r?\n/)
const wanted = [...new Set(cites.filter((c) => c.path === AUDIT).flatMap((c) => Array.from({ length: c.b - c.a + 1 }, (_, k) => c.a + k)))].sort((x, y) => x - y)
const header = [`# Excerpt of ${AUDIT} (ignored by .gitignore:91; not in the repository)`,
  `Original sha256 ${sha(audit)}, ${auditLines.length} lines. Each line below is "<original line number>: <original line, verbatim>".`,
  `Kept by Task 923 Review 67 for the kickoff rows that cite it; the report itself is an external review and is not copied.`, '']
const body = wanted.map((n) => `${n}: ${auditLines[n - 1]}`)
const excerpt = header.concat(body).join('\n') + '\n'
const excerptPath = `${R}/2026-10-19-deep-audit.excerpt.md`
const lineOf = (n) => header.length + wanted.indexOf(n) + 1

let unresolved = 0
for (const c of cites) {
  let next
  if (c.path === AUDIT) {
    const at = lineOf(c.a)
    const at2 = lineOf(c.b)
    if (!excerpt.split('\n').slice(at - 1, at2).join('\n').includes(c.lit)) { unresolved++; out.push(`${c.id}: literal not in the excerpt`); continue }
    next = `source: \`${excerptPath}:${at}-${at2}\`; observed: \`${c.lit}\``
  } else if (WHOLE.includes(c.path)) {
    const copy = `${R}/${c.path.split('/').pop()}`
    if (!readFileSync(c.path, 'utf8').split(/\r?\n/).slice(c.a - 1, c.b).join('\n').includes(c.lit)) { unresolved++; out.push(`${c.id}: literal not in ${c.path}`); continue }
    next = `source: \`${copy}:${c.a}-${c.b}\`; observed: \`${c.lit}\``
  } else { unresolved++; out.push(`${c.id}: unexpected source ${c.path}`); continue }
  out.push(`${c.id}: ${c.path}:${c.a}-${c.b} -> ${next.slice(9, next.indexOf('`;'))}`)
  lines[c.i] = lines[c.i].replace(c.whole, next)
}
for (const p of WHOLE) out.push(`${p}: sha256 ${sha(readFileSync(p))}, copied whole`)
out.push(`${AUDIT}: sha256 ${sha(audit)}; excerpt of lines ${wanted.join(', ')}`)
if (write && unresolved === 0) {
  mkdirSync(R, { recursive: true })
  writeFileSync(excerptPath, excerpt)
  for (const p of WHOLE) writeFileSync(`${R}/${p.split('/').pop()}`, readFileSync(p))
  writeFileSync(K, lines.join(eol))
}
out.push(`rebound ${cites.length - unresolved}, unresolved ${unresolved}; ${write && unresolved === 0 ? 'written' : 'not written'}`, `exit ${unresolved ? 1 : 0}`)
if (write) writeFileSync(`${E}/rv67-41-retain-external-reports.txt`, out.join('\n') + '\n')
console.log(out.join('\n'))
process.exitCode = unresolved ? 1 : 0

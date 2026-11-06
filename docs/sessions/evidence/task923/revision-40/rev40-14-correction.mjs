// Task 923 Review 44 / Revision 40 correction (Opus, 2026-10-23). F8: Revision 40 read only line 55 of isProductPath; line 56 makes every non-policy `scripts/`
// executable a product path, so the census modules need the D8_D9 scope. In the kickoff it rewrites C1209, inserts C1210, corrects §65.3 and R137 (c) in place,
// extends the Cases note and adds section 66. In the D8_D9 contract it sets `draft` and adds the eight Task 923 census paths of rev40-12-script-scope.txt.
// rev40-16-readiness.mjs (copied by rev40-15) sets `ready` after its checks. Keeps line endings. Idempotent. Usage: node rev40-14-correction.mjs <repo root>
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? '.')
const KICKOFF = 'tasks/Archive/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const D8D9 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'
const EV = 'docs/sessions/evidence/task923/revision-40'
const ADD = [
  'scripts/rendered-state-census/discover.mjs',
  'scripts/rendered-state-census/in-page.mjs',
  'scripts/rendered-state-census/registry.mjs',
  'scripts/rendered-state-census/runner.mjs',
  'scripts/rendered-state-census/theme-breakpoints.mjs',
  'scripts/rendered-state-census/verify.mjs',
  'scripts/__tests__/rendered-state-census.test.ts',
  'scripts/__fixtures__/rendered-state-census/census-pending.js',
]

const kfile = path.join(root, KICKOFF)
const raw = fs.readFileSync(kfile, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
let text = raw.replace(/\r\n/g, '\n')
const swap = (from, to, label) => {
  if (text.includes(to)) return
  if (text.split(from).length !== 2) throw new Error(`${label}: not unique or absent`)
  text = text.replace(from, () => to)
}
const lines = text.split('\n')
const i = lines.findIndex((l) => l.startsWith('| C1209 | FACT |'))
if (i < 0) throw new Error('C1209 row not found')
lines[i] = "| C1209 | FACT | Every `scripts/` executable that is not a policy path is a product path of the security contracts, so the census modules need a contract's scope (corrected in Review 44, F8). | source: `scripts/workflow-gates/contract.mjs:56-56`; observed: `!isPolicyPath(file));` |"
if (!lines.some((l) => l.startsWith('| C1210 |'))) {
  lines.splice(i + 1, 0, "| C1210 | FACT | Eleven changed or untracked `scripts/` product paths were in no contract's scope; eight of them are Task 923's census. | source: `docs/sessions/evidence/task923/revision-40/rev40-12-script-scope.txt:12-12`; observed: `outside every contract scope: 11` |")
}
text = lines.join('\n')
swap("  - The census modules and fixtures are neither product nor policy paths (C1209), so the contract does not list them.\n",
  "  - The census modules, their unit test and the fixture script are product paths (C1209), and §66 adds them to the scope (C1210). The `.html` fixtures are not product paths.\n", '§65.3 scope bullet')
swap("  - `scripts/rendered-state-census/` (registry, in-page, runner, verify) and the fixture `day-cells-exempt.html`.",
  "  - `scripts/rendered-state-census/` (registry, in-page, runner, verify), `scripts/__tests__/rendered-state-census.test.ts` and the fixture `day-cells-exempt.html`.", '§65.3 reads')
swap("(c) `r40-02`: a registry state with `exemptText` and no `ownerDecision`, in a scratch copy of the registry, is refused with the error of R136 (a). The registry itself is untouched.",
  "(c) `r40-02`: `scripts/__tests__/rendered-state-census.test.ts` gains the case `accepts exemptText with its dated owner decision and rejects it without one (Task 923 R136, owner D84)`, written as the existing `exemptTargets` and `exemptOverflow` cases and asserting the error of R136 (a). `npx vitest run scripts/__tests__/rendered-state-census.test.ts` passes.", 'R137 (c)')
swap('Revision 40 (§65) adds no case and no path: R136 changes the census, which no contract scopes (C1209), and R83 keeps its cases. |',
  'Revision 40 (§65) adds no case; its correction (§66) adds the eight census paths of C1210 to the scope (328 paths), and R83 keeps its cases. |', 'cases note')
const section = fs.readFileSync(path.join(root, EV, 'rev40-13-section-66.md'), 'utf8').replace(/\r\n/g, '\n').trimEnd()
if (!text.includes('\n## 66. Review 44')) {
  const e = text.indexOf('\n## Security test contract\n')
  if (e < 0) throw new Error('security contract heading not found')
  text = text.slice(0, e + 1) + section + '\n\n' + text.slice(e + 1)
}
fs.writeFileSync(kfile, text.replace(/\n/g, eol))
console.log('kickoff corrected')

const sfile = path.join(root, D8D9)
const sraw = fs.readFileSync(sfile, 'utf8')
const seol = sraw.includes('\r\n') ? '\r\n' : '\n'
const c = JSON.parse(sraw)
c.executionStatus = 'draft'
for (const p of ADD) {
  if (!fs.existsSync(path.join(root, p))) throw new Error(`missing ${p}`)
  if (!c.scope.includes(p)) c.scope.push(p)
}
fs.writeFileSync(sfile, JSON.stringify(c, null, 2).replace(/\n/g, seol) + seol)
console.log(`D8_D9 ${c.executionStatus}; scope ${c.scope.length}; cases ${c.cases.length}`)

// Task 923 Review 40 / Revision 37 (Opus, 2026-10-23): the readiness run rv40-25 failed. (1) cli.mjs plan requires a real-boundary deny and allow case for every critical
// invariant (scripts/workflow-gates/contract.mjs:142-146); the limit invariant had no integration deny case and the reveal-table invariant no integration allow case.
// (2) check:kickoff-evidence requires R129 and R130 to cite their evidence. This script splits the limit part out of SEC-X-INT-REVEAL-RECORD into a new critical
// SEC-X-INT-REVEAL-LIMIT (deny), adds a critical SEC-X-INT-REVEAL-TABLE-SERVER (allow), and updates R129, R130 and the Cases note in the kickoff and in rv40-18-section.md.
// Idempotent. Usage: node rv40-26-real-boundary-cases.mjs <repo root>
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2])
const KICKOFF = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const SECTION = 'docs/sessions/evidence/task923/review-40/rv40-18-section.md'
const D8D9 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'
const TEST = 'src/tests/integration/contactGateway.integration.test.ts'
const LIMIT_INV = "A person or an IP address reveals at most the owner-decided number of new listings' contact numbers per hour and per 24 hours (D77, D79, D80), and a limit that cannot be read never lets a reveal through"
const TABLE_INV = 'Only the server reads or writes the reveal record: a browser session can neither read, forge nor erase it'

const REPLACE = [
  ['| R129 | **Tests.**', '| R129 [C1149–C1151; D77; D79; D80] | **Tests.**'],
  ['| R130 | **Proof and report.**', '| R130 [C1121–C1123] | **Proof and report.**'],
  [
    '<br>- `[SEC-X-INT-REVEAL-RECORD]`: a verified call reveal writes exactly one row with the viewer, the listing, `call` and the test IP (C1150); a second reveal of the same listing writes none. After 20 rows inserted with the service role for the viewer on another synthetic listing, a reveal of a third synthetic listing answers `rate_limited`.',
    '<br>- `[SEC-X-INT-REVEAL-TABLE-SERVER]`: the service-role client selects, inserts and deletes a synthetic row of `listing_contact_reveals`, each without error.<br>- `[SEC-X-INT-REVEAL-RECORD]`: a verified call reveal writes exactly one row with the viewer, the listing, `call` and the test IP (C1150); a second reveal of the same listing writes none.<br>- `[SEC-X-INT-REVEAL-LIMIT]`: after 20 rows inserted with the service role for the viewer on another synthetic listing, a reveal of a third synthetic listing answers `rate_limited`, with no number and no row for that listing.',
  ],
  [
    'Revision 37 (§61) adds the seven reveal-limit cases SEC-X-SRV-REVEAL-LIMIT, -IP, -REPEAT, -FAILCLOSED, SEC-X-INT-REVEAL-TABLE-DENY, SEC-X-INT-REVEAL-RECORD and SEC-X-FE-CONTACT-LIMIT: 220 cases, 68 critical;',
    'Revision 37 (§61) adds the nine reveal-limit cases SEC-X-SRV-REVEAL-LIMIT, -IP, -REPEAT, -FAILCLOSED, SEC-X-INT-REVEAL-TABLE-DENY, -TABLE-SERVER, SEC-X-INT-REVEAL-RECORD, -LIMIT and SEC-X-FE-CONTACT-LIMIT: 222 cases, 70 critical;',
  ],
]
for (const rel of [KICKOFF, SECTION]) {
  const file = path.join(root, rel)
  let text = fs.readFileSync(file, 'utf8')
  for (const [from, to] of REPLACE) {
    if (text.includes(to)) continue
    if (!text.includes(from)) { console.log(`${rel}: not present: ${from.slice(0, 60)}`); continue }
    text = text.replace(from, to)
    console.log(`${rel}: replaced ${from.slice(0, 60)}`)
  }
  fs.writeFileSync(file, text)
}

const file = path.join(root, D8D9)
const raw = fs.readFileSync(file, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const c = JSON.parse(raw)
const record = c.cases.find((k) => k.id === 'SEC-X-INT-REVEAL-RECORD')
Object.assign(record, {
  input: 'a call reveal of a synthetic listing; the same reveal again',
  response: 'the number and exactly one row { viewer, listing, call, the test IP }; the number again and no second row; the clean-up verified',
  forbiddenEffects: ['a row for a repeat reveal', 'a synthetic row left after the run'],
  testName: 'contactGateway [SEC-X-INT-REVEAL-RECORD] the real gateway records a reveal once per listing',
})
const add = [
  {
    id: 'SEC-X-INT-REVEAL-LIMIT', layer: 'server', outcome: 'deny', boundary: 'integration', critical: true, invariant: LIMIT_INV,
    actor: 'a synthetic signed-in active viewer (is_verified false), not the owner',
    resource: "the real revealListingContact on the development project with Cloudflare's published always-pass test secret",
    input: 'after 20 rows inserted with the service role for the viewer on another synthetic listing within the last hour, a call reveal of a third synthetic listing',
    response: 'rate_limited, with no number and no reveal row for the third listing; the clean-up verified',
    forbiddenEffects: ['a number past the limit', 'a reveal row written for a refused reveal', 'a synthetic row left after the run'],
    testFile: TEST, testName: 'contactGateway [SEC-X-INT-REVEAL-LIMIT] the real gateway refuses a reveal past the hour limit',
  },
  {
    id: 'SEC-X-INT-REVEAL-TABLE-SERVER', layer: 'database', outcome: 'allow', boundary: 'integration', critical: true, invariant: TABLE_INV,
    actor: 'the service-role client the server uses (R125 applied)',
    resource: 'public.listing_contact_reveals on the development project',
    input: 'insert a synthetic row for a synthetic viewer and listing, select it, delete it',
    response: 'each statement succeeds; the selected row equals the inserted one; after the delete the row is gone',
    forbiddenEffects: ['the server refused its own record', 'a synthetic row left after the run'],
    testFile: TEST, testName: 'contactGateway [SEC-X-INT-REVEAL-TABLE-SERVER] the server reads and writes the reveal record',
  },
]
for (const k of add) {
  const i = c.cases.findIndex((x) => x.id === k.id)
  if (i >= 0) c.cases[i] = k
  else c.cases.splice(c.cases.findIndex((x) => x.id === (k.id === 'SEC-X-INT-REVEAL-LIMIT' ? 'SEC-X-INT-REVEAL-RECORD' : 'SEC-X-INT-REVEAL-TABLE-DENY')) + 1, 0, k)
}
fs.writeFileSync(file, JSON.stringify(c, null, 2).replace(/\n/g, eol) + eol)
console.log(`D8_D9 executionStatus ${c.executionStatus}; cases ${c.cases.length}; critical ${c.cases.filter((k) => k.critical).length}`)

// Task 923 Revision 42 (Opus, 2026-10-24), after revision-41/rev41-04-revision.mjs. In the kickoff it inserts rows C1228–C1256 (rev42-03-claim-rows.md) after C1227 and
// D85–D86 (rev42-03b-decision-rows.md) after D84, adds R139's surface to the head's Mobile adaptation record, extends the Cases note and adds section 68
// (rev42-07-section.md). In the D8_D9 contract it sets `draft`, adds R139's four paths to the scope and its seven cases (rev42-08-cases.json). rev42-10-readiness.mjs
// sets `ready` after its checks. Keeps line endings. Idempotent. Usage: node rev42-09-revision.mjs <repo root>
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? '.')
const KICKOFF = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const D8D9 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'
const EV = 'docs/sessions/evidence/task923/revision-42'
const ADD = [
  'src/components/admin/AdminPageHeader.tsx',
  'src/stories/patterns/mantine/AdminPageHeader.stories.tsx',
  'src/app/admin/users/__tests__/adminUserGone.security.test.ts',
  'src/app/admin/users/__tests__/adminUsersNotice.security.test.tsx',
]

const kfile = path.join(root, KICKOFF)
const raw = fs.readFileSync(kfile, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
let text = raw.replace(/\r\n/g, '\n')
const read = (name) => fs.readFileSync(path.join(root, EV, name), 'utf8').replace(/\r\n/g, '\n').trimEnd()
const insertAfter = (prefix, marker, file) => {
  if (text.includes(marker)) return
  const lines = text.split('\n')
  const i = lines.findIndex((l) => l.startsWith(prefix))
  if (i < 0) throw new Error(`${prefix} not found`)
  lines.splice(i + 1, 0, ...read(file).split('\n'))
  text = lines.join('\n')
}
insertAfter('| C1227 | FACT |', '\n| C1228 |', 'rev42-03-claim-rows.md')
insertAfter('| D84 | OWNER DECISION |', '\n| D85 |', 'rev42-03b-decision-rows.md')

// the head's Mobile adaptation record: the first block after its heading
const head = text.indexOf('\n## Mobile adaptation record\n')
if (head < 0) throw new Error('mobile record not found')
const appendToField = (field, addition) => {
  const start = text.indexOf(`\n- ${field}: `, head)
  const end = text.indexOf('\n', start + 1)
  if (start < 0 || end < 0) throw new Error(`${field} not found`)
  const line = text.slice(start + 1, end)
  if (line.includes('(R139)') || line.includes('MantineDashboardHeader.tsx') || line.includes('AdminPageHeader.stories.tsx')) return
  text = text.slice(0, end) + addition + text.slice(end)
}
appendToField('Surfaces', '; src/components/admin/AdminPageHeader.tsx — the notice under the admin page header of the Users list, after a deleted user\'s page (R139)')
appendToField('Mantine owner', ', src/design-system/mantine/patterns/MantineDashboardHeader.tsx')
appendToField('Mobile order', ' — Users list header (R139): title; the total and New user; the notice; then the table')
appendToField('Story and verification', '; for R139 src/stories/patterns/mantine/AdminPageHeader.stories.tsx Default, WithAction and WithNotice at 320, 375, 390, 480, 560, 639, 640, 641, 680, 768, 810, 960, 1024, 1200, 1440, 1920 and 2560 in sq, en, uk and it')

const casesFrom = 'Revision 41 (§67) adds no case; the scope gains Task 927\'s Google confirmation test for R138 (c) (329 paths). |'
const casesTo = 'Revision 41 (§67) adds no case; the scope gains Task 927\'s Google confirmation test for R138 (c) (329 paths). Revision 42 (§68) adds the seven cases of R139 (SEC-X-SRV-ADMIN-USER-GONE, -DELETED, -QUERY-ERROR and -PRESENT; SEC-X-FE-ADMIN-USERS-NOTICE-SHOWN, -NOT-REFLECTED and -ABSENT): 230 cases, 70 critical; the scope gains `AdminPageHeader.tsx`, its Story and the two test files (333 paths). |'
if (!text.includes(casesTo)) {
  if (text.split(casesFrom).length !== 2) throw new Error('cases note: not unique or absent')
  text = text.replace(casesFrom, () => casesTo)
}
if (!text.includes('\n## 68. Revision 42')) {
  const e = text.indexOf('\n## Security test contract\n')
  if (e < 0) throw new Error('security contract heading not found')
  text = text.slice(0, e + 1) + read('rev42-07-section.md') + '\n\n' + text.slice(e + 1)
}
fs.writeFileSync(kfile, text.replace(/\n/g, eol))
console.log('kickoff revised')

const sfile = path.join(root, D8D9)
const sraw = fs.readFileSync(sfile, 'utf8')
const seol = sraw.includes('\r\n') ? '\r\n' : '\n'
const c = JSON.parse(sraw)
c.executionStatus = 'draft'
for (const p of ADD) if (!c.scope.includes(p)) c.scope.push(p)
for (const k of JSON.parse(read('rev42-08-cases.json'))) if (!c.cases.some((x) => x.id === k.id)) c.cases.push(k)
fs.writeFileSync(sfile, JSON.stringify(c, null, 2).replace(/\n/g, seol) + seol)
console.log(`D8_D9 ${c.executionStatus}; scope ${c.scope.length}; cases ${c.cases.length}; critical ${c.cases.filter((k) => k.critical).length}`)

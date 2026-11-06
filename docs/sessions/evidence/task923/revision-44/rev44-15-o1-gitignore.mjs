// Task 923 Revision 44 (Opus, 2026-10-24): the fresh-state check before the handoff found that `.gitignore:4` ignores `/supabase`, so the migration copy of §69.3
// step 4 could not be committed. This moves the copy out of §70's order of work into O1 (an owner decision at the final review) and adds row C1344, in the kickoff and in
// the section, session-section and row files of this folder; then the session record and the backlog row. Each replacement must match exactly once. Keeps line
// endings. Idempotent. Run before rev44-14-records.mjs is rerun, then the locator refresh (1 inserted row) and rev44-07-readiness.mjs. Usage (repository root): node rev44-15-o1-gitignore.mjs
import fs from 'node:fs'

const EV = 'docs/sessions/evidence/task923/revision-44'
const K = 'tasks/Archive/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const edit = (f, fn) => {
  const raw = fs.readFileSync(f, 'utf8')
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  fs.writeFileSync(f, fn(raw.replace(/\r\n/g, '\n')).replace(/\n/g, eol))
}
const once = (text, from, to) => {
  if (text.includes(to)) return text
  if (text.split(from).length !== 2) throw new Error('not unique or absent: ' + from.slice(0, 80))
  return text.replace(from, () => to)
}

const row = '| C1344 | FACT | The repository ignores the whole `supabase` folder. | source: `.gitignore:4-4`; observed: `/supabase` |'
const o1From = '- **Open obligation O1 (final review).** The step 4 copy of §69.3 was not made: `supabase/migrations/` does not exist. The owner makes it before this revision is executed (the order of work below). The R37 (d) hardening copy is still missing as well. Opus records it for the final review.'
const o1To = '- **Open obligation O1 (final review, owner decision).** The step 4 copy of §69.3 was not made: `supabase/migrations/` does not exist.\n  - The repository also ignores the whole `/supabase` folder (C1344), so neither that copy nor the R37 (d) hardening copy could be committed.\n  - The applied SQL is tracked in `docs/sessions/evidence/task923/db-catalog/` with its approved SHA-256.\n  - Whether the migration history moves into Git is the owner\'s decision at the final review. R141–R144 do not depend on it.'
const stepFrom = '1. The owner copies deletion v4 byte for byte to `supabase/migrations/20261018010000_task923_account_deletion.sql` and commits Review 49 and this revision.'
const stepTo = '1. The owner commits the apply\'s records and this revision.'
const readsFrom = 'this section and rows C1281–C1343,'
const readsTo = 'this section and rows C1281–C1344,'

const section = (t) => once(once(once(t, o1From, o1To), stepFrom, stepTo), readsFrom, readsTo)
edit(`${EV}/rev44-04-section.md`, section)
edit(`${EV}/rev44-01-claim-rows.md`, (t) => (t.includes('| C1344 |') ? t : t.trimEnd() + '\n' + row + '\n'))
edit(K, (t) => {
  let text = section(t)
  if (!text.includes('\n| C1344 |')) {
    const lines = text.split('\n')
    const i = lines.findIndex((l) => l.startsWith('| C1343 | FACT |'))
    if (i < 0) throw new Error('C1343 not found')
    lines.splice(i + 1, 0, row)
    text = lines.join('\n')
  }
  return text
})

const ssFrom = '- Step 7 (the copy to `supabase/migrations/`) was not made. The folder does not exist (O1). It is now step 1 of §70\'s order of work.'
const ssTo = '- Step 7 (the copy to `supabase/migrations/`) was not made. The folder does not exist, and `.gitignore:4` ignores `/supabase`, so a copy could not be committed. O1 now asks the owner at the final review whether the migration history moves into Git.'
const stepsFrom = '1. Copy deletion v4 to `supabase/migrations/20261018010000_task923_account_deletion.sql` and compare its hash with `CDC690E4…D4A6F23`.\n2. Commit the apply\'s records and Revision 44.\n3. Start Sonnet on R141–R144.'
const stepsTo = '1. Commit the apply\'s records and Revision 44.\n2. Start Sonnet on R141–R144.'
const rowsFrom = '- **Rows.** C1281–C1343 were checked against their files (`rev44-03-row-check.txt`, 63 rows, `failing 0`).'
const rowsTo = '- **Rows.** C1281–C1343 were checked against their files (`rev44-03-row-check.txt`, 63 rows, `failing 0`). C1344 (`.gitignore:4`) was added after the fresh-state check (`rev44-15-o1-gitignore.mjs`).'
const ss = (t) => once(once(once(t, ssFrom, ssTo), stepsFrom, stepsTo), rowsFrom, rowsTo)
edit(`${EV}/rev44-13-session-section.md`, ss)
const SR = 'docs/sessions/2026-10-10-task923-rendered-state-census.md'
edit(SR, ss)

edit('docs/backlog.md', (t) => once(once(t,
  'ready for Sonnet after the owner copies deletion v4 to `supabase/migrations/` and commits (session log',
  'ready for Sonnet after the owner\'s commit (session log'),
  'C1281–C1343, 229 cases, scope 337, D8_D9 ready;',
  'C1281–C1344, 229 cases, scope 337, D8_D9 ready; O1: `/supabase` is git-ignored, so the migration copies wait for the owner\'s decision at the final review;'))
console.log('O1 moved; C1344 added')

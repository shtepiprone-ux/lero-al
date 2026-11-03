// Task 943 approver (review 3, session e50584bc): GR-5 update of docs/backlog.md for the 943 approval and 944 revision 2.
// Each replacement must match exactly once; otherwise nothing is written. Usage (project root): node test-results/943-r3/backlog-edit.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const FILE = resolve(ROOT, 'docs/backlog.md');
let text = readFileSync(FILE, 'utf8');
const once = (find, replace) => {
  const count = text.split(find).length - 1;
  if (count !== 1) throw new Error(`expected one occurrence, found ${count}: ${find.slice(0, 80)}`);
  text = text.replace(find, () => replace);
};
// The 943 entry leaves the "filed and ready" list (from its start to the 937 entry).
const a = text.indexOf('Kickoffs filed and ready: **943** (');
const b = text.indexOf('**937** (Governance Check, product half, Sonnet)');
if (a < 0 || b < a || text.indexOf('Kickoffs filed and ready: **943** (', a + 1) >= 0) throw new Error('943 ready entry not found exactly once');
text = `${text.slice(0, a)}Kickoffs filed and ready: ${text.slice(b)}`;
once('its pre-941 limits (glob, 8.3 and trailing-dot targets; the Bash `>|` redirection) are in 943 R12.',
  'its pre-941 limits (glob, 8.3 and trailing-dot targets; the Bash `>|` redirection) are in 943 R12. **943** (commands that change files are writes) reviewed 2026-11-03 by an independent Opus session (D2, review 3 of revision 4, `docs/sessions/evidence/task943/review/review-943-r3.md`; review 2\'s verdict was withdrawn at D19) with notes, the Task 935, 940 and 941 contracts rebased (941 also its case test, D12) and the Task 923 owner-fixes and 927 contracts `rules`-rebased by the 935 contract, kickoff archived, closure row in `docs/backlog-archive.md`; its notes are in Task 944 R8/AC12 (revision 2 adds the `require(\'fs\').promises` forms) and Task 931 revision 3.');
once('now **revision 4 ready**, see the 943 entry below;', '**reviewed 2026-11-03** at revision 4;');
once('Order: 943 → 931 revision 3 → 937.', 'Order: 931 revision 3 → 937 (943 reviewed 2026-11-03).');
once('by the 943 review 2 session: R8 reports the shell write forms that review found)',
  'by the 943 review 2 session: R8 reports the shell write forms that review found; revision 2 2026-11-03 by the 943 review 3 session: R8 (f) the `require(\'fs\').promises` forms)');
writeFileSync(FILE, text);
console.log('docs/backlog.md updated: 5 replacements');

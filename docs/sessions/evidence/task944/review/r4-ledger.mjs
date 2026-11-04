// Task 944 review 4 (approver): rebinds the review ledger written by r3-ledger.mjs to this review's own evidence and revision.
// Writes only that ledger, which is no scope file. Usage (project root): node docs/sessions/evidence/task944/review/r4-ledger.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const OUT = resolve(ROOT, 'docs/reviews/2026-11-04-task944-sensitivity-breaks-only-in-memory.review-ledger.json');
const R = 'docs/sessions/evidence/task944/review';
const HEAD = '94d20430b33d013d1044fc5b32185b04a0ee99ef';
const ledger = JSON.parse(readFileSync(OUT, 'utf8'));
ledger.review.reviewedRevision = `22c6871a31eaf693b16ad68c2e0f5ec290aeedea (revision 3 implementation) on base d17d9d5a8; review 4 on HEAD ${HEAD}, whose scripts and .claude equal that commit, with the review 3 closure in the working tree`;
const FILES = ['selftests', 'probes', 'report', 'rebase-digests', 'ac11', 'verify-935', 'timing', 'mutants', 'governance-contract-selftest'];
let text = JSON.stringify(ledger);
for (const name of FILES) text = text.replaceAll(`${R}/r3-${name}.txt`, `${R}/r4-${name}.txt`);
text = text.replaceAll('approver native run 2026-11-04 win32 v22.22.3 on commit 22c6871a3', `approver native run 2026-11-04 win32 v22.22.3 on HEAD ${HEAD}, scripts and .claude equal to 22c6871a3`)
  .replaceAll('F8 2005 ms parsed, 7579 ms parser-rejected', 'F8 2071 ms parsed, 7943 ms parser-rejected')
  .replaceAll('with the base bytes of every 944-changed file each contract digest equals its last chain digest', 'with the base bytes of every 944-changed file each contract digest equals the original digest of its first 944 entry')
  .replaceAll('r3-rebase-digests.txt prints EQUALS last: true for all four contracts', 'r4-rebase-digests.txt shows each digest at base equal to the original digest of the first 944 entry, and r4-ac11.txt shows each current digest at the end of its chain');
const out = JSON.parse(text);
for (const row of out.requirements) for (const item of row.evidence) {
  if (item.path === `${R}/r3-ac10-gates.txt`) {
    item.path = `${R}/r4-check-workflow.txt`;
    item.command = 'node scripts/workflow-gates/check-workflow.mjs, with r4-eslint.txt, r4-publication.txt, r4-verify-944.txt and r4-kickoff-evidence.txt beside it';
  }
}
// Self-audit: AC12 is also proven from the kickoff text itself, independently of the task's self-test.
const ac12 = out.requirements.find(row => row.id === 'AC12 / R8');
const direct = `${R}/r4-ac12.txt`;
if (!ac12.evidence.some(item => item.path === direct)) {
  ac12.evidence.push({ ...ac12.evidence[0], path: direct, command: 'node docs/sessions/evidence/task944/review/r4-ac12.mjs', observable: 'AC12 taken from the archived kickoff text: 47 forms each report X, yield GOVERNANCE INDEPENDENCE and refuse the executor; 21 controls report no X; failures 0' });
}
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`${OUT}: ${out.requirements.length} rows`);

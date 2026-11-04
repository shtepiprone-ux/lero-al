// Task 944 review 3 (approver): prints the digests the review block and the rebase entries need. Writes no file.
// Usage (project root): node docs/sessions/evidence/task944/review/r3-sign.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, scopeDigest } from '../../../../../scripts/workflow-gates/contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const PATH = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json';
const contract = JSON.parse(readFileSync(resolve(ROOT, PATH), 'utf8'));
const R = 'docs/sessions/evidence/task944/review';
console.log(`944 scopeSha256 ${scopeDigest(ROOT, contract)}`);
console.log(`944 reportSha256 ${digest(ROOT, [contract.report])}`);
for (const file of ['review-3.md', 'scope-rebase-935.md', 'tests-rebase-935.md', 'scope-rebase-940.md', 'scope-rebase-941.md', 'scope-rebase-943.md']) {
  console.log(`${file} ${digest(ROOT, [`${R}/${file}`])}`);
}
console.log(`sprint plan digest ${digest(ROOT, ['tasks/Sprints/Sprint_92_Governance_Changes_Get_An_Independent_Approval.md'])}`);
const k942 = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.md';
console.log(`942 task digest ${digest(ROOT, [k942])}`);

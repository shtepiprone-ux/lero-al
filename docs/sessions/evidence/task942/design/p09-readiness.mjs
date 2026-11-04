// Task 942 revision 2 readiness (Task 944 review 3 session): the kickoff digest, and validateContract on the saved sidecar with
// executionStatus ready in memory (shared/orchestration-state.md). Writes no file.
// Usage (project root): node docs/sessions/evidence/task942/design/p09-readiness.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, planDigest, validateContract } from '../../../../../scripts/workflow-gates/contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const PATH = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.security.json';
const contract = JSON.parse(readFileSync(resolve(ROOT, PATH), 'utf8'));
const current = digest(ROOT, [contract.task]);
console.log(`executionStatus ${contract.executionStatus}; stage ${contract.stage}`);
console.log(`taskSha256 recorded ${contract.taskSha256}`);
console.log(`taskSha256 current  ${current}`);
const copy = { ...contract, taskSha256: current, executionStatus: 'ready' };
console.log(`validateContract ready copy, plan phase: ${JSON.stringify(validateContract(ROOT, copy, { phase: 'plan' }))}`);
console.log(`planDigest of the ready copy ${planDigest(ROOT, copy)}`);

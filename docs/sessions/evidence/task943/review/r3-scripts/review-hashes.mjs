// Task 943 approver (review 3, session e50584bc), read-only: the review block digests of the archived 943 contract and its
// release validation. Usage (project root): node test-results/943-r3/review-hashes.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const c = await import(new URL('../../scripts/workflow-gates/contract.mjs', import.meta.url));
const C943 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json';
const EVIDENCE = 'docs/sessions/evidence/task943/review/review-943-r3.md';
const contract = JSON.parse(readFileSync(resolve(ROOT, C943), 'utf8'));
console.log(`evidenceSha256 ${c.digest(ROOT, [EVIDENCE])}`);
console.log(`scopeSha256 ${c.scopeDigest(ROOT, contract)}`);
console.log(`reportSha256 ${c.digest(ROOT, [contract.report])}`);
console.log(`taskSha256 current ${c.digest(ROOT, [contract.task])}; sidecar ${contract.taskSha256}`);
console.log(`review block ${JSON.stringify(contract.review || null)}`);
console.log(`validateContract release ${JSON.stringify(c.validateContract(ROOT, contract, { phase: 'release' }))}`);
const report = JSON.parse(readFileSync(resolve(ROOT, contract.report), 'utf8'));
console.log(`validateGovernanceReport ${JSON.stringify(c.validateGovernanceReport(ROOT, contract, report))}`);

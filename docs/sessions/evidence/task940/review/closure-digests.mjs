// Task 940 approver, read-only: canonical digests and release/report validation for the closure. Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeDigest, planDigest, digest, validateContract, validateGovernanceReport } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const root = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C940 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json';
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const files = ['docs/sessions/evidence/task940/review/review-940.md', 'docs/sessions/evidence/task940/review/scope-rebase-935.md',
  'docs/sessions/evidence/task940/impl/governance-report.json',
  'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.md',
  'tasks/Sprints/Sprint_92_Governance_Changes_Get_An_Independent_Approval.md'];
for (const file of files) {
  try { console.log(`digest ${file} ${digest(root, [file])}`); } catch (error) { console.log(`digest ${file} ERROR ${error.message}`); }
}
for (const path of [C940, C935, C923]) {
  try {
    const contract = readJson(root, path);
    console.log(`${path}`);
    console.log(`  stage ${contract.stage}; scopeDigest ${scopeDigest(root, contract)}; planDigest ${planDigest(root, contract)}`);
    console.log(`  review.scopeSha256 ${contract.review?.scopeSha256}`);
    console.log(`  release errors: ${JSON.stringify(validateContract(root, contract, { phase: 'release' }))}`);
    if (contract.kind === 'governance') console.log(`  report errors: ${JSON.stringify(validateGovernanceReport(root, contract, readJson(root, contract.report)))}`);
  } catch (error) { console.log(`${path}: ERROR ${error.message}`); }
}

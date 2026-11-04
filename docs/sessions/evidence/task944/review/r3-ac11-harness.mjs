// Task 944 AC11 (approver, read-only): the scoped harness of Task 940 AC7 for the 935, 940, 941, 943 and 944 contracts, plus
// reviewedFreshnessErrors for the selection, the governance report check of each watched contract and its release validation.
// Derived from docs/sessions/evidence/task943/review/r2-ac7-harness.mjs (944 added). Usage (project root):
// node <this file> [base, default origin/main]
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDiff, changedFiles, reviewedFreshnessErrors, gitBaseReader, readJson } from '../../../../../scripts/workflow-gates/cli.mjs';
import { validateContract, validateGovernanceReport, scopeDigest, rebaseChainErrors } from '../../../../../scripts/workflow-gates/contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const base = execFileSync('git', ['rev-parse', process.argv[2] || 'origin/main'], { cwd: ROOT, encoding: 'utf8' }).trim();
const files = changedFiles(ROOT, { base, working: true });
const { errors, contracts } = validateDiff(ROOT, files, { phase: 'release', base });
const watched = {
  '935': 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json',
  '940': 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json',
  '941': 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json',
  '943': 'tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json',
  '944': 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json',
};
console.log(`base ${base}; ${files.length} changed file(s) in the working tree; ${contracts.length} selected contract(s)`);
for (const [task, path] of Object.entries(watched)) {
  const own = errors.filter(error => error.startsWith(`${path}:`) || error.includes(path));
  const contract = readJson(ROOT, path);
  const release = validateContract(ROOT, contract, { phase: 'release' });
  const report = validateGovernanceReport(ROOT, contract, readJson(ROOT, contract.report));
  const chain = contract.review?.rebases ? rebaseChainErrors(ROOT, contract) : [];
  console.log(`${task}: selected ${contracts.some(c => c.path === path)}; validateDiff ${own.length ? JSON.stringify(own) : 'no error'}; release ${JSON.stringify(release)}; governance report ${JSON.stringify(report)}; chain ${JSON.stringify(chain)}; scope ${scopeDigest(ROOT, contract)}`);
}
const other = errors.filter(error => !Object.values(watched).some(path => error.includes(path)));
console.log(`other validateDiff errors: ${other.length}`);
for (const error of other) console.log(`  ${error}`);
const freshness = reviewedFreshnessErrors(ROOT, contracts.map(c => c.path), { files, readBase: gitBaseReader(ROOT, base) });
console.log(`reviewedFreshnessErrors for the selection: ${JSON.stringify(freshness)}`);

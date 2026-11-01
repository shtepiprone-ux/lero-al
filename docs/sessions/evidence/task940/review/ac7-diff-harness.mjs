// Task 940 AC7 (approver, read-only): the canonical validateDiff and changedFiles at phase release over the working tree.
// Usage: node <this file> <full base sha>. Errors are grouped by contract; the mapped-test run of `cli.mjs diff`
// (CI database secrets) is not part of this harness.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDiff, changedFiles } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const base = process.argv[2];
const files = changedFiles(ROOT, { base, working: true });
const { errors } = validateDiff(ROOT, files, { phase: 'release', base });
const watched = {
  '935': 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json',
  '940': 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json',
  '923': 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
};
console.log(`base ${base}; ${files.length} changed file(s) in the working tree`);
for (const [task, path] of Object.entries(watched)) {
  const own = errors.filter(error => error.startsWith(`${path}:`));
  console.log(`${task}: ${own.length ? `${own.length} error(s)` : 'no error'}`);
  for (const error of own) console.log(`  ${error}`);
}
const other = errors.filter(error => !Object.values(watched).some(path => error.startsWith(`${path}:`)));
console.log(`other: ${other.length} error(s)`);
for (const error of other) console.log(`  ${error}`);

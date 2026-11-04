// Task 944 review 3 (approver, read-only): for each contract the R7 rebases touch, scopeDigest with the base (d17d9d5a8) bytes of
// every file Task 944 changed must equal its last chain digest, so that only Task 944 made it stale. Writes no file.
// Usage (project root): node docs/sessions/evidence/task944/review/r3-rebase-digests.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rebaseChain, scopeDigest } from '../../../../../scripts/workflow-gates/contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const BASE = 'd17d9d5a8', HEAD = '22c6871a3';
const git = args => execFileSync('git', args, { cwd: ROOT, maxBuffer: 1 << 28 });
const changed = git(['diff', '--name-only', BASE, HEAD, '--', 'scripts', '.claude']).toString().trim().split(/\r?\n/);
const atBase = file => { try { return git(['show', `${BASE}:${file}`]); } catch { return null; } };
const WATCHED = {
  935: 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json',
  940: 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json',
  941: 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json',
  943: 'tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json',
};
console.log(`944 changed files (${BASE}..${HEAD}, scripts and .claude): ${changed.length}`);
for (const [task, path] of Object.entries(WATCHED)) {
  const contract = JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
  const chain = rebaseChain(contract).entries;
  const last = chain.at(-1)?.entry?.rebasedScopeSha256 ?? contract.review.scopeSha256;
  const named = new Set([...contract.scope, ...(contract.inputs || []), ...contract.cases.map(row => row.testFile)]);
  const touched = changed.filter(file => named.has(file));
  const tests = new Set(contract.cases.map(row => row.testFile));
  const caseTests = touched.filter(file => tests.has(file));
  const allBase = new Map(changed.map(file => [file, atBase(file)]));
  const testsBase = new Map(caseTests.map(file => [file, atBase(file)]));
  console.log(`${task} ${path}`);
  console.log(`  chain entries ${chain.length}; last ${last}`);
  console.log(`  current ${scopeDigest(ROOT, contract)}`);
  console.log(`  all-944-files-at-base ${scopeDigest(ROOT, contract, allBase)} EQUALS last: ${scopeDigest(ROOT, contract, allBase) === last}`);
  console.log(`  944 changed files in this contract: ${JSON.stringify(touched)}`);
  console.log(`  case test files changed: ${JSON.stringify(caseTests)} digest with them at base: ${scopeDigest(ROOT, contract, testsBase)}`);
}

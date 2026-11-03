// Task 941 approver (review 3), read-only: R5 anchors, reviewed contracts sharing the changed files, canonical digests,
// release/report validation. Usage: node <this file> [anchor base, default 758508105^ = the commit before Task 941 code].
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeDigest, planDigest, digest, validateContract, validateGovernanceReport } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson, gitBaseReader } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const BASE = process.argv[2] || '758508105^';
const C941 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json';
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C940 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json';
const CHANGED = ['scripts/workflow-gates/security-hook.mjs', 'scripts/workflow-gates/publication.json'];
const readBase = gitBaseReader(ROOT, BASE);
const latest = contract => contract.review?.rebases?.length ? contract.review.rebases.at(-1).rebasedScopeSha256 : contract.review?.scopeSha256;

console.log(`anchor base ${BASE}`);
// Every contract under tasks/ that is reviewed and scopes one of the files 941 changed.
const contracts = [];
const walk = dir => { for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
  const rel = `${dir}/${e.name}`;
  if (e.isDirectory()) walk(rel); else if (e.name.endsWith('.security.json')) contracts.push(rel);
} };
walk('tasks');
for (const path of contracts) {
  let c; try { c = readJson(ROOT, path); } catch { continue; }
  const shared = CHANGED.filter(file => (c.scope || []).includes(file));
  if (!shared.length || path === C941) continue;
  console.log(`shares ${JSON.stringify(shared)}: ${path} (stage ${c.stage}, kind ${c.kind})`);
}
for (const path of [C935, C940]) {
  const contract = readJson(ROOT, path);
  const recorded = latest(contract);
  const current = scopeDigest(ROOT, contract);
  const anchored = scopeDigest(ROOT, contract, new Map(CHANGED.map(file => [file, readBase(file)])));
  console.log(`${path}`);
  console.log(`  latest recorded scope digest ${recorded}`);
  console.log(`  current scope digest         ${current} ${current === recorded ? 'CURRENT' : 'STALE'}`);
  console.log(`  with the two files at base   ${anchored} ${anchored === recorded ? 'EQUALS RECORDED (only these files changed)' : 'DIFFERS'}`);
  for (const file of CHANGED) {
    const one = scopeDigest(ROOT, contract, new Map(CHANGED.filter(f => f !== file).map(f => [f, readBase(f)])));
    console.log(`    ${file}: ${one === recorded ? 'unchanged since base' : 'CHANGED since base'}`);
  }
  const tests = (contract.cases || []).map(row => row.testFile);
  console.log(`  changed files that are case test files: ${JSON.stringify(CHANGED.filter(f => tests.includes(f)))}`);
}
for (const file of ['docs/sessions/evidence/task941/review/review-941.md', 'docs/sessions/evidence/task941/review/scope-rebase-935.md',
  'docs/sessions/evidence/task941/review/scope-rebase-940.md', 'docs/sessions/evidence/task941/impl/governance-report.json']) {
  try { console.log(`digest ${file} ${digest(ROOT, [file])}`); } catch (error) { console.log(`digest ${file} ERROR ${error.message}`); }
}
for (const path of [C941, C935, C940]) {
  try {
    const contract = readJson(ROOT, path);
    console.log(`${path}`);
    console.log(`  stage ${contract.stage}; scopeDigest ${scopeDigest(ROOT, contract)}; planDigest ${planDigest(ROOT, contract)}`);
    console.log(`  release errors: ${JSON.stringify(validateContract(ROOT, contract, { phase: 'release' }))}`);
    console.log(`  report errors: ${JSON.stringify(validateGovernanceReport(ROOT, contract, readJson(ROOT, contract.report)))}`);
  } catch (error) { console.log(`${path}: ERROR ${error.message}`); }
}

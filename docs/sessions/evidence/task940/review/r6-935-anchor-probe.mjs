// Task 940 approver, read-only probe: which Task 935 digest inputs changed since its review (base c2f918a59), and
// whether a later write to the Task 923 D8/D9 contract file re-stales the 935 contract. Usage: node <this file> [base]
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeDigest } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson, gitBaseReader } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const BASE = process.argv[2] || 'c2f918a59';
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const LISTED = ['scripts/workflow-gates/contract.mjs', 'scripts/workflow-gates/cli.mjs', 'scripts/workflow-gates/security-hook.mjs',
  'scripts/workflow-gates/publication.json', '.claude/rules/review/03-decision-closure.md'];
const readBase = gitBaseReader(ROOT, BASE);
const contract = readJson(ROOT, C935);
const reviewed = contract.review.scopeSha256;
const current = scopeDigest(ROOT, contract);
const anchored = scopeDigest(ROOT, contract, new Map(LISTED.map(file => [file, readBase(file)])));
console.log(`base ${BASE}`);
console.log(`935 review.scopeSha256        ${reviewed}`);
console.log(`935 current scope digest      ${current} ${current === reviewed ? 'CURRENT' : 'STALE'}`);
console.log(`935 digest, listed at base    ${anchored} ${anchored === reviewed ? 'EQUALS REVIEWED (only the listed files changed)' : 'DIFFERS'}`);
for (const file of LISTED) {
  const one = scopeDigest(ROOT, contract, new Map(LISTED.filter(f => f !== file).map(f => [f, readBase(f)])));
  console.log(`  ${file}: ${one === reviewed ? 'unchanged since base' : 'CHANGED since base'}`);
}
const touched = scopeDigest(ROOT, contract, new Map([...LISTED.map(f => [f, readBase(f)]), [C923, `${readBase(C923)} `]]));
console.log(`935 digest after a later write to ${C923}: ${touched === anchored ? 'unchanged' : 'CHANGED (the 923 contract file is a 935 scope input)'}`);
console.log(`923 contract listed in 935 scope: ${contract.scope.includes(C923)}`);

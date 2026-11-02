// Task 943 revision 1 self-audit (Opus, read-only Git, 2026-11-02): would a `rules` entry by the reviewed Task 935
// contract, listing the six changed shared rule files, carry the stale 923 owner-fixes and 927 reviews? The scope digest
// with the base (origin/main) bytes of those files must equal the recorded review digest, and each file must be a rule
// input of the contract and a scope file of 935. Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { scopeDigest, workflowRuleInputs } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const BASE = execFileSync('git', ['rev-parse', 'origin/main'], { cwd: ROOT, encoding: 'utf8' }).trim();
const RULES = ['security-testing', 'workflow-gates', 'workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication']
  .map(name => `.claude/rules/shared/${name}.md`);
// A file absent at the base is passed as null (the digest's "absent" value), as the CI base reader does.
const show = file => { try { return execFileSync('git', ['show', `${BASE}:${file}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
const gov = readJson(ROOT, 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json');
console.log(`base ${BASE}; 935 stage ${gov.stage}; 935 scopes all six: ${RULES.every(f => gov.scope.includes(f))}`);
for (const path of ['tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json',
  'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json']) {
  const c = readJson(ROOT, path);
  const inputs = workflowRuleInputs(ROOT, c.rules || []);
  const withBase = scopeDigest(ROOT, c, new Map(RULES.map(f => [f, show(f)])));
  console.log(`${path}: all six are rule inputs ${RULES.every(f => inputs.includes(f))}; digest with base rule bytes ${withBase}; review ${c.review.scopeSha256}; MATCH ${withBase === c.review.scopeSha256}; current ${scopeDigest(ROOT, c)}`);
}

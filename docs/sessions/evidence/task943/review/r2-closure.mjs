// Task 943 review 2 (approver), read-only: R6 anchors and the freshness census of every reviewed contract.
// Usage (project root): node docs/sessions/evidence/task943/review/r2-closure.mjs [943 code base, default b85f5a66b]
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeDigest, workflowRuleInputs, rebaseChainErrors, validateContract } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson, gitBaseReader, allContracts, reviewedFreshnessErrors } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const BASE = process.argv[2] || 'b85f5a66b';
const readBase = gitBaseReader(ROOT, BASE);
const latest = c => (c.review?.rebases?.length ? c.review.rebases.at(-1).rebasedScopeSha256 : c.review?.scopeSha256);
const changed = execFileSync('git', ['diff', '--name-only', BASE, '--', 'scripts', '.claude'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
console.log(`943 code base ${BASE}; scripts/.claude files changed since it: ${JSON.stringify(changed)}`);
const C935 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const C940 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json';
const C941 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json';
const anchor = (contract, files) => scopeDigest(ROOT, contract, new Map(files.map(file => [file, readBase(file)])));
for (const [path, listed, tests] of [
  [C935, ['scripts/workflow-gates/security-hook.mjs', 'scripts/workflow-gates/publication.json', 'scripts/workflow-gates/contract.mjs',
    'scripts/workflow-gates/cli.mjs', '.claude/rules/review/03-decision-closure.md', '.claude/rules/create/03-publication.md'], []],
  [C940, ['scripts/workflow-gates/security-hook.mjs', 'scripts/workflow-gates/publication.json', 'scripts/workflow-gates/contract.mjs',
    'scripts/workflow-gates/cli.mjs', '.claude/rules/review/03-decision-closure.md'], []],
  [C941, ['scripts/workflow-gates/security-hook.mjs', 'scripts/workflow-gates/publication.json'], ['scripts/workflow-gates/shell-write.selftest.mjs']],
]) {
  const c = readJson(ROOT, path);
  const all = [...listed, ...tests];
  const recorded = latest(c);
  console.log(path);
  console.log(`  latest recorded ${recorded}; current ${scopeDigest(ROOT, c)}`);
  console.log(`  all listed files at base: ${anchor(c, all)} ${anchor(c, all) === recorded ? 'EQUALS RECORDED (only these files changed)' : 'DIFFERS'}`);
  for (const file of all) console.log(`    ${file}: in scope ${(c.scope || []).includes(file)}; ${anchor(c, all.filter(f => f !== file)) === recorded ? 'unchanged since base' : 'CHANGED since base'}`);
  const caseTests = new Set((c.cases || []).map(row => row.testFile));
  console.log(`  listed scope files that are case tests: ${JSON.stringify(listed.filter(f => caseTests.has(f)))}; tests files that are case tests: ${JSON.stringify(tests.filter(f => caseTests.has(f)))}`);
  if (tests.length) console.log(`  intermediate (scope entry rebasedScopeSha256, case test at base): ${anchor(c, tests)}`);
}
const RULES = ['security-testing', 'workflow-gates', 'workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication'].map(n => `.claude/rules/shared/${n}.md`);
const main = gitBaseReader(ROOT, 'origin/main');
const gov = readJson(ROOT, C935);
console.log(`935 scopes all six rule files: ${RULES.every(f => gov.scope.includes(f))}`);
for (const path of ['tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json',
  'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json']) {
  const c = readJson(ROOT, path);
  const withBase = scopeDigest(ROOT, c, new Map(RULES.map(f => [f, main(f)])));
  console.log(`${path}: kind ${c.kind}; stage ${c.stage}; rebases ${(c.review?.rebases || []).length}; six are rule inputs ${RULES.every(f => workflowRuleInputs(ROOT, c.rules || []).includes(f))}; digest with origin/main rule bytes ${withBase}; review ${c.review?.scopeSha256}; MATCH ${withBase === latest(c)}; current ${scopeDigest(ROOT, c)}; integration cases ${(c.cases || []).filter(r => r.boundary !== 'unit').length}`);
}
// Census: every reviewed contract that is stale now (nothing selected), against origin/main.
const files = execFileSync('git', ['diff', '--name-only', 'origin/main', '--'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const census = reviewedFreshnessErrors(ROOT, [], { files, readBase: main });
console.log(`reviewed contracts: ${allContracts(ROOT).filter(p => { try { return readJson(ROOT, p).stage === 'reviewed'; } catch { return false; } }).length}`);
console.log(`reviewedFreshnessErrors with nothing selected (${census.length}):`);
for (const line of census) console.log(`  ${line}`);
void rebaseChainErrors; void validateContract;

// Task 935: governance contracts, independent governance approval, the governance CI diff and rule-only rebases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateContract, validateGovernanceReport, digest, planDigest, scopeDigest, REQUIRED_PRODUCT_RULES, REQUIRED_GOVERNANCE_RULES } from './contract.mjs';
import { validateDiff, governanceReport, parseTap, gitBaseReader } from './cli.mjs';
import { evaluateHook } from './security-hook.mjs';

const HOOK = fileURLToPath(new URL('./security-hook.mjs', import.meta.url));
const COMPANIONS = ['workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication'].map(n => `.claude/rules/shared/${n}.md`);
const GOV = 'tasks/gov_kickoff.security.json';
const PRODUCT = 'tasks/product_kickoff.security.json';
const CI_RULE = '.claude/rules/shared/workflow-ci.md';
const REBASE_EVIDENCE = 'docs/sessions/evidence/rebase/rules-rebase.md';

function put(root, file, text) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); }
const saveJson = (root, file, value) => put(root, file, `${JSON.stringify(value, null, 2)}\n`);
const readJsonFile = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'));

const PASSING_SOURCE = `import { test } from 'node:test';
for (const id of ['GOV-T-HOOK-ALLOW', 'GOV-T-HOOK-DENY', 'GOV-T-CI-ERROR']) test(\`[\${id}] synthetic gate case\`, () => {});
`;
function governanceContract(root) {
  const row = (id, layer, outcome) => ({ id, layer, outcome, boundary: 'unit', critical: false,
    invariant: 'Synthetic gate refuses an unreviewed policy change', actor: 'Synthetic Opus session',
    resource: 'Synthetic gate function', input: 'Synthetic gate input record', response: 'Synthetic gate decision',
    forbiddenEffects: ['Synthetic unreviewed change accepted'],
    testFile: 'scripts/workflow-gates/example.selftest.mjs', testName: `[${id}] synthetic gate case` });
  return { version: 1, stage: 'planned', executionStatus: 'ready', kind: 'governance', qaProfile: 'Q1',
    task: 'tasks/gov_kickoff.md', taskSha256: digest(root, ['tasks/gov_kickoff.md']),
    scope: ['scripts/workflow-gates/example.mjs', 'scripts/workflow-gates/example.selftest.mjs', '.claude/rules/shared/security-testing.md'],
    rules: [...REQUIRED_GOVERNANCE_RULES],
    cases: [row('GOV-T-HOOK-ALLOW', 'hook', 'allow'), row('GOV-T-HOOK-DENY', 'hook', 'deny'), row('GOV-T-CI-ERROR', 'ci', 'error')],
    report: 'docs/sessions/evidence/gov/report.json', sensitivity: 'docs/sessions/evidence/gov/sensitivity.json' };
}
function fixture(testSource = PASSING_SOURCE) {
  const root = mkdtempSync(join(tmpdir(), 'lero-governance-'));
  for (const file of new Set([...REQUIRED_GOVERNANCE_RULES, ...REQUIRED_PRODUCT_RULES, ...COMPANIONS])) {
    put(root, file, file.endsWith('workflow-gates.md') ? '# Gates\n\n## Required companions\nSynthetic companions.\n' : `Synthetic rule ${file}.\n`);
  }
  put(root, 'tasks/gov_kickoff.md', '## Security test contract\nSynthetic governance change.\n');
  put(root, 'scripts/workflow-gates/example.mjs', 'export const gate = true;\n');
  put(root, 'scripts/workflow-gates/example.selftest.mjs', testSource);
  return { root, contract: governanceContract(root), close: () => rmSync(root, { recursive: true, force: true }) };
}
function withFixture(fn, source) { const f = fixture(source); try { return fn(f); } finally { f.close(); } }
function passingReport(root, contract) {
  return { version: 1, status: 'passed', contractSha256: planDigest(root, contract), scopeSha256: scopeDigest(root, contract),
    cases: contract.cases.map(c => ({ id: c.id, status: 'passed', testFile: c.testFile, testName: c.testName })), errors: [] };
}
// Implemented by Opus, then reviewed: report and review hashes are taken after every scope file is final.
function review(root, contract, path = GOV) {
  contract.stage = 'reviewed'; contract.implementation = { role: 'Opus' };
  put(root, 'docs/sessions/evidence/gov/review.md', 'Synthetic independent governance review.\n');
  saveJson(root, contract.report, passingReport(root, contract));
  contract.review = { role: 'Opus', decision: 'APPROVED', evidence: 'docs/sessions/evidence/gov/review.md',
    evidenceSha256: digest(root, ['docs/sessions/evidence/gov/review.md']), scopeSha256: scopeDigest(root, contract),
    reportSha256: digest(root, [contract.report]) };
  saveJson(root, path, contract);
  return contract;
}

test('[GOV-935-VAL-ALLOW] A governance contract over policy paths with full case coverage validates', () => withFixture(f => {
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
  f.contract.qaProfile = 'Q4'; f.contract.cases[1].critical = true;
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), [], 'critical governance cases do not force Q4 or a real-boundary pair');
  f.contract.qaProfile = 'Q2';
  f.contract.scope.push('CLAUDE.md', 'docs/orchestrator-role.md', 'tasks/other_kickoff.security.json', 'docs/sessions/evidence/gov/note.txt', '.github/workflows/governance-pr.yml');
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
}));

test('[GOV-935-VAL-DENY-PRODUCT-PATH] A governance contract containing a product path is refused', () => withFixture(f => {
  for (const file of ['src/app/page.tsx', 'package.json', 'scripts/product-helper.mjs', 'supabase/migrations/1.sql']) {
    f.contract.scope.push(file);
    assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), new RegExp(`product or unrelated path ${file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`), file);
    f.contract.scope.pop();
  }
  f.contract.scope = ['.claude/rules/shared/security-testing.md'];
  assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), /executable \(non-Markdown\) policy path/);
}));

test('[GOV-935-VAL-DENY-COVERAGE] A governance contract without allow, deny, error, hook and ci coverage is refused', () => withFixture(f => {
  const original = structuredClone(f.contract.cases);
  for (const outcome of ['allow', 'deny', 'error']) {
    f.contract.cases = original.filter(c => c.outcome !== outcome);
    assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), new RegExp(`governance: missing ${outcome} case`), outcome);
  }
  for (const layer of ['hook', 'ci']) {
    f.contract.cases = original.map(c => c.layer === layer ? { ...c, layer: 'validator' } : c);
    assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), new RegExp(`governance: missing ${layer} case`), layer);
  }
  f.contract.cases = original;
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
}));

test('governance contracts refuse Q0, product case shapes, foreign test files and missing governance rules', () => withFixture(f => {
  const plant = (mutate, pattern) => { const c = structuredClone(f.contract); mutate(c); assert.match(validateContract(f.root, c, { phase: 'plan' }).join('\n'), pattern); };
  plant(c => { c.qaProfile = 'Q0'; }, /Q1 through Q4/);
  plant(c => { c.cases[0].id = 'SEC-T-HOOK-ALLOW'; c.cases[0].testName = '[SEC-T-HOOK-ALLOW] synthetic gate case'; }, /GOV-<stable identifier>/);
  plant(c => { c.cases[0].layer = 'frontend'; }, /invalid governance layer/);
  plant(c => { c.cases[0].boundary = 'browser'; }, /unit or process/);
  plant(c => { c.cases[0].testFile = 'src/example.test.ts'; }, /selftest\.mjs file/);
  plant(c => { c.cases[1].testName = c.cases[0].testName; }, /exact testName|duplicate mapped test/);
  plant(c => { c.rules = c.rules.filter(r => !r.endsWith('role-boundaries.md')); }, /Mandatory governance rule missing/);
  plant(c => { c.report = 'test-results/report.json'; }, /report must be a path under docs\/sessions\/evidence/);
  plant(c => { c.kind = 'ops'; }, /kind must be product, docs or governance/);
}));

test('[GOV-935-VAL-RELEASE-DENY] A governance contract is not releasable without an independent reviewed Opus approval and current hashes', () => withFixture(f => {
  const reviewed = review(f.root, f.contract);
  const release = mutate => { const c = structuredClone(reviewed); mutate(c); return validateContract(f.root, c, { phase: 'release' }).join('\n'); };
  assert.match(release(c => { c.stage = 'planned'; }), /independently reviewed stage/);
  assert.match(release(c => { c.stage = 'implemented'; }), /independently reviewed stage/);
  assert.match(release(c => { delete c.review; }), /Independent Opus review decision missing/);
  assert.match(release(c => { c.review.role = 'Sonnet'; }), /Independent Opus review decision missing/);
  assert.match(release(c => { c.review.evidenceSha256 = '0'.repeat(64); }), /review evidence hash is stale/);
  assert.match(release(c => { c.review.scopeSha256 = '0'.repeat(64); }), /review scope is stale/);
  assert.match(release(c => { c.review.reportSha256 = '0'.repeat(64); }), /review report is stale/);
  assert.match(release(c => { c.implementation.role = 'Sonnet'; }), /implementation\.role must be Opus/);
  assert.match(release(c => { delete c.implementation; }), /implementation\.role must be Opus/);
  const planned = structuredClone(reviewed); planned.stage = 'planned';
  assert.match(validateContract(f.root, planned, { phase: 'verify' }).join('\n'), /implemented or reviewed/);
  put(f.root, 'scripts/workflow-gates/example.mjs', 'export const gate = false;\n');
  assert.match(validateContract(f.root, reviewed, { phase: 'release' }).join('\n'), /review scope is stale/, 'a later scope edit stales the review');
}));

test('[GOV-935-VAL-RELEASE-ALLOW] A reviewed governance contract with current hashes is releasable', () => withFixture(f => {
  const reviewed = review(f.root, f.contract);
  assert.deepEqual(validateContract(f.root, reviewed, { phase: 'release' }), []);
  assert.deepEqual(validateContract(f.root, reviewed, { phase: 'verify' }), []);
  assert.deepEqual(validateGovernanceReport(f.root, reviewed, readJsonFile(f.root, reviewed.report)), []);
}));

test('[GOV-935-REPORT-ERROR] The governance report fails on a failing, missing or unproven case', () => withFixture(f => {
  f.contract.stage = 'implemented'; f.contract.implementation = { role: 'Opus' };
  f.contract.cases[1].critical = true;
  const report = governanceReport(f.root, f.contract);
  assert.equal(report.status, 'failed');
  const errors = report.errors.join('\n');
  assert.match(errors, /example\.selftest\.mjs: test process exited with code 1/);
  assert.match(errors, /GOV-T-CI-ERROR: mapped test is failed/);
  assert.match(errors, /GOV-T-HOOK-ALLOW: mapped test is missing/);
  assert.match(errors, /GOV-T-HOOK-DENY: critical case has no single sensitivity record/);
  assert.equal(report.cases.find(c => c.id === 'GOV-T-HOOK-DENY').status, 'passed');
  // A hand-written "passed" record cannot replace the failed run or the missing sensitivity proof.
  const forged = passingReport(f.root, f.contract);
  assert.match(validateGovernanceReport(f.root, f.contract, forged).join('\n'), /GOV-T-HOOK-DENY: sensitivity requires/);
  forged.cases.pop();
  assert.match(validateGovernanceReport(f.root, f.contract, forged).join('\n'), /GOV-T-CI-ERROR: missing result/);
  forged.cases.push({ ...forged.cases[0], id: 'GOV-T-CI-ERROR', status: 'skipped' });
  assert.match(validateGovernanceReport(f.root, f.contract, forged).join('\n'), /GOV-T-CI-ERROR: result is skipped/);
}, `import { test } from 'node:test';
import assert from 'node:assert/strict';
test('[GOV-T-HOOK-DENY] synthetic gate case', () => {});
test('[GOV-T-CI-ERROR] synthetic gate case', () => { assert.equal(1, 2); });
`));

test('the governance report passes only on every mapped case and records current hashes and sensitivity', () => withFixture(f => {
  f.contract.stage = 'implemented'; f.contract.implementation = { role: 'Opus' };
  f.contract.cases[1].critical = true;
  put(f.root, 'docs/sessions/evidence/gov/break.txt', 'Synthetic sensitivity artifact.\n');
  saveJson(f.root, 'docs/sessions/evidence/gov/break.json', { version: 1, case: 'GOV-T-HOOK-DENY', target: 'scripts/workflow-gates/example.mjs', find: 'true', replace: 'false' });
  saveJson(f.root, f.contract.sensitivity, { version: 1, cases: [{ id: 'GOV-T-HOOK-DENY', method: 'in-memory', break: 'docs/sessions/evidence/gov/break.json',
    breakSha256: digest(f.root, ['docs/sessions/evidence/gov/break.json']), testName: f.contract.cases[1].testName, baseline: 'passed', mutant: 'failed',
    failureKind: 'assertion', restored: 'passed', artifact: 'docs/sessions/evidence/gov/break.txt', artifactSha256: digest(f.root, ['docs/sessions/evidence/gov/break.txt']) }] });
  const report = governanceReport(f.root, f.contract);
  assert.deepEqual(report.errors, []); assert.equal(report.status, 'passed');
  assert.deepEqual(validateGovernanceReport(f.root, f.contract, report), []);
  put(f.root, 'docs/sessions/evidence/gov/break.txt', 'Changed artifact.\n');
  assert.match(validateGovernanceReport(f.root, f.contract, report).join('\n'), /sensitivity artifact is stale/);
  assert.deepEqual(parseTap('ok 1 - [A] x \\# y\nnot ok 2 - [B] z\n    ok 3 - [C] s # SKIP off\nok 4 - [D] t # TODO later'),
    [{ name: '[A] x # y', status: 'passed' }, { name: '[B] z', status: 'failed' }, { name: '[C] s', status: 'skipped' }, { name: '[D] t', status: 'todo' }]);
}));

function transcript(root, { writes = [], shell = [] } = {}) {
  const lines = [{ type: 'assistant', message: { content: [{ type: 'text', text: `SECURITY TASK PREFLIGHT COMPLETE - contract: ${GOV}.` }] } }];
  writes.forEach((file, i) => lines.push(
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: `w${i}`, name: 'Write', input: { file_path: join(root, file), content: 'x' } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `w${i}`, content: 'written' }] } }));
  shell.forEach((command, i) => lines.push(
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: `s${i}`, name: 'PowerShell', input: { command } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `s${i}`, content: '' }] } }));
  return lines.map(line => JSON.stringify(line)).join('\n');
}
const approve = { hook_event_name: 'Stop', agent_type: 'orchestrator', last_assistant_message: 'APPROVED' };

test('[GOV-935-HOOK-SELF-APPROVE-DENY] The session that wrote a governance scope file cannot approve it', () => withFixture(f => {
  review(f.root, f.contract);
  const errors = evaluateHook(f.root, approve, transcript(f.root, { writes: ['scripts/workflow-gates/example.mjs'] }));
  assert.match(errors.join('\n'), /GOVERNANCE INDEPENDENCE: this session wrote scripts\/workflow-gates\/example\.mjs; an implementing session cannot approve/);
  assert.match(evaluateHook(f.root, approve, transcript(f.root, { shell: ["Set-Content -Path .claude/rules/shared/security-testing.md -Value 'x'"] })).join('\n'),
    /GOVERNANCE INDEPENDENCE: this session wrote \.claude\/rules\/shared\/security-testing\.md/);
  const path = join(f.root, 'session.jsonl');
  writeFileSync(path, transcript(f.root, { writes: ['scripts/workflow-gates/example.selftest.mjs'] }));
  const child = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ ...approve, transcript_path: path }), encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: f.root }, timeout: 30000 });
  assert.equal(child.status, 2, child.stderr);
  assert.match(child.stderr, /GOVERNANCE INDEPENDENCE: this session wrote scripts\/workflow-gates\/example\.selftest\.mjs/);
}));

test('[GOV-935-HOOK-INDEPENDENT-ALLOW] An independent session with a reviewed contract and passing report may approve', () => withFixture(f => {
  review(f.root, f.contract);
  assert.deepEqual(evaluateHook(f.root, approve, transcript(f.root, { writes: ['docs/sessions/evidence/gov/review.md'] })), []);
  // Completion of the implementation uses the verify phase and the same report validation.
  const implemented = readJsonFile(f.root, GOV); implemented.stage = 'implemented'; saveJson(f.root, GOV, implemented);
  assert.deepEqual(evaluateHook(f.root, { ...approve, last_assistant_message: 'IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW' }, transcript(f.root)), []);
  assert.match(evaluateHook(f.root, approve, transcript(f.root)).join('\n'), /reviewed stage/);
  saveJson(f.root, implemented.report, { ...passingReport(f.root, implemented), status: 'failed' });
  assert.match(evaluateHook(f.root, { ...approve, last_assistant_message: 'IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW' }, transcript(f.root)).join('\n'), /Governance report must be version 1 and passed/);
}));

function rebaseFixture() {
  const f = fixture();
  const { root } = f;
  put(root, 'tasks/product_kickoff.md', '## Security test contract\nSynthetic product change.\n');
  put(root, 'src/profile.ts', 'export const profile = true;\n');
  put(root, 'src/profile.test.ts', 'export const profileTest = true;\n');
  put(root, 'docs/sessions/evidence/p/review.md', 'Synthetic product review.\n');
  put(root, 'docs/sessions/evidence/p/report.json', '{}\n');
  const product = { version: 1, stage: 'reviewed', kind: 'product', qaProfile: 'Q2', task: 'tasks/product_kickoff.md',
    taskSha256: digest(root, ['tasks/product_kickoff.md']), scope: ['src/profile.ts', 'src/profile.test.ts'], rules: [...REQUIRED_PRODUCT_RULES],
    cases: ['frontend', 'server'].flatMap(layer => ['allow', 'deny', 'error'].map(outcome => ({ id: `SEC-${layer.toUpperCase()}-${outcome.toUpperCase()}`, layer, outcome,
      invariant: 'Only the owner may update their display name', actor: 'Synthetic account', resource: 'Synthetic profile', input: 'Synthetic display name',
      response: 'Synthetic profile response', forbiddenEffects: ['No foreign profile update'], testFile: 'src/profile.test.ts',
      testName: `[SEC-${layer.toUpperCase()}-${outcome.toUpperCase()}] profile`, boundary: 'unit', critical: false }))),
    report: 'docs/sessions/evidence/p/report.json' };
  product.review = { role: 'Opus', decision: 'APPROVED', evidence: 'docs/sessions/evidence/p/review.md', evidenceSha256: digest(root, ['docs/sessions/evidence/p/review.md']),
    scopeSha256: scopeDigest(root, product), reportSha256: digest(root, ['docs/sessions/evidence/p/report.json']) };
  saveJson(root, PRODUCT, product);
  const base = new Map([[CI_RULE, readFileSync(join(root, CI_RULE), 'utf8')], [PRODUCT, readFileSync(join(root, PRODUCT), 'utf8')]]);
  // The governance change edits one companion rule; its approver rebases the stale product review.
  put(root, CI_RULE, 'Changed synthetic CI rule.\n');
  put(root, REBASE_EVIDENCE, `# Rebase\n\n## Changed rule files\n- \`${CI_RULE}\`\n`);
  product.review.rulesRebase = { by: GOV, evidence: REBASE_EVIDENCE, evidenceSha256: digest(root, [REBASE_EVIDENCE]),
    originalScopeSha256: product.review.scopeSha256, rebasedScopeSha256: scopeDigest(root, product) };
  saveJson(root, PRODUCT, product);
  f.contract.scope.push(CI_RULE, PRODUCT, REBASE_EVIDENCE);
  review(root, f.contract);
  const files = [CI_RULE, PRODUCT, GOV, REBASE_EVIDENCE, 'scripts/workflow-gates/example.mjs'];
  return { ...f, product, files, readBase: file => base.has(file) ? base.get(file) : null,
    resign(mutate) { mutate(product); saveJson(root, PRODUCT, product); review(root, f.contract); } };
}
function withRebase(fn) { const f = rebaseFixture(); try { fn(f); } finally { f.close(); } }
const diffErrors = (f, files = f.files, readBase = f.readBase) => validateDiff(f.root, files, { phase: 'release', readBase }).errors.join('\n');

test('[GOV-935-VAL-REBASE-ALLOW] A reviewed contract stale only through rule files inside a reviewed governance contract is accepted with a valid rulesRebase', () => withRebase(f => {
  assert.deepEqual(validateContract(f.root, f.product, { phase: 'release' }), []);
  assert.equal(diffErrors(f), '');
  const withoutRebase = structuredClone(f.product); delete withoutRebase.review.rulesRebase;
  assert.match(validateContract(f.root, withoutRebase, { phase: 'release' }).join('\n'), /Independent review scope is stale/, 'the rule change alone stales the review');
}));

test('[GOV-935-VAL-REBASE-DENY] A rulesRebase never hides a non-rule change or an unapproved rule change', () => {
  const variants = [
    ['changed scope file', f => put(f.root, 'src/profile.ts', 'export const profile = false;\n'), /Independent review scope is stale[\s\S]*rebasedScopeSha256 is not the current scope digest/],
    ['changed test file', f => put(f.root, 'src/profile.test.ts', 'changed\n'), /Independent review scope is stale/],
    ['unreviewed by-contract', f => { const g = readJsonFile(f.root, GOV); g.stage = 'implemented'; saveJson(f.root, GOV, g); }, /is not a reviewed governance contract/],
    ['non-governance by-contract', f => { const g = readJsonFile(f.root, GOV); g.kind = 'product'; saveJson(f.root, GOV, g); }, /is not a reviewed governance contract/],
    ['rule file outside the by scope', f => { const g = readJsonFile(f.root, GOV); g.scope = g.scope.filter(p => p !== CI_RULE); saveJson(f.root, GOV, g); }, /workflow-ci\.md is outside the scope of tasks\/gov_kickoff\.security\.json/],
    ['stale evidence hash', f => put(f.root, REBASE_EVIDENCE, `# Rebase\n\n## Changed rule files\n- \`${CI_RULE}\`\nEdited later.\n`), /evidence hash is stale/],
    ['listed file is not a rule input', f => { put(f.root, REBASE_EVIDENCE, '# Rebase\n\n## Changed rule files\n- `src/profile.ts`\n'); f.product.review.rulesRebase.evidenceSha256 = digest(f.root, [REBASE_EVIDENCE]); }, /src\/profile\.ts is not a rule input/],
    ['wrong original digest', f => { f.product.review.rulesRebase.originalScopeSha256 = '0'.repeat(64); }, /originalScopeSha256 is not the reviewed scope digest/],
  ];
  for (const [name, mutate, pattern] of variants) withRebase(f => {
    mutate(f);
    const errors = validateContract(f.root, f.product, { phase: 'release' }).join('\n');
    assert.match(errors, /Independent review scope is stale/, name);
    assert.match(errors, pattern, name);
  });
  // A rebase re-signed over a non-rule change passes the file-level check, but the diff base exposes it.
  for (const file of ['src/profile.ts', 'src/profile.test.ts', 'package.json']) withRebase(f => {
    put(f.root, file, 'changed after review\n');
    f.resign(p => { p.review.rulesRebase.rebasedScopeSha256 = scopeDigest(f.root, p); });
    assert.deepEqual(validateContract(f.root, f.product, { phase: 'release' }), [], file);
    assert.match(diffErrors(f), /files other than the listed rule files changed since the review/, file);
  });
});

test('[GOV-935-CI-REBASE-DENY] A rulesRebase whose by-contract is not in the same diff is refused', () => withRebase(f => {
  assert.match(diffErrors(f, [CI_RULE, PRODUCT]), /approving governance contract tasks\/gov_kickoff\.security\.json is not part of this diff/);
  assert.match(validateDiff(f.root, f.files, { phase: 'release' }).errors.join('\n'), /the diff base is required/);
  const g = readJsonFile(f.root, GOV); g.review.evidenceSha256 = '0'.repeat(64); saveJson(f.root, GOV, g);
  assert.match(diffErrors(f), /approving governance contract tasks\/gov_kickoff\.security\.json does not validate at phase release/);
}));

test('a retained rebase survives later diffs; a later rule change re-signed without a governance contract does not', () => withRebase(f => {
  const current = new Map([[CI_RULE, readFileSync(join(f.root, CI_RULE), 'utf8')], [PRODUCT, readFileSync(join(f.root, PRODUCT), 'utf8')]]);
  // Like the Task 923 contract, a resolved release blocker keeps the rebased contract selected in every diff.
  saveJson(f.root, 'scripts/workflow-gates/release-blockers.json', { version: 1, findings: [{ id: 'S1', status: 'resolved', contract: PRODUCT }] });
  assert.equal(diffErrors(f, ['docs/notes.md'], file => current.get(file) ?? null), '', 'unchanged retained rebase');
  put(f.root, CI_RULE, 'Changed again without a governance contract.\n');
  f.product.review.rulesRebase.rebasedScopeSha256 = scopeDigest(f.root, f.product); saveJson(f.root, PRODUCT, f.product);
  assert.match(diffErrors(f, [CI_RULE, PRODUCT], file => current.get(file) ?? null), /not part of this diff/);
}));

test('[GOV-935-CI-DIFF-DENY] A changed executable policy file outside every governance contract scope fails the diff check', () => withFixture(f => {
  for (const file of ['scripts/workflow-gates/example.mjs', 'scripts/workflow-gates/deleted-gate.mjs', '.claude/settings.json', '.github/workflows/governance-pr.yml', 'scripts/check-example.mjs']) {
    assert.match(validateDiff(f.root, [file], { phase: 'release' }).errors.join('\n'), new RegExp(`${file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}: outside every changed governance contract scope`), file);
  }
  review(f.root, f.contract);
  assert.match(validateDiff(f.root, [GOV, '.claude/settings.json'], { phase: 'release' }).errors.join('\n'), /\.claude\/settings\.json: outside every changed governance contract scope/);
  const planned = readJsonFile(f.root, GOV); planned.stage = 'planned'; saveJson(f.root, GOV, planned);
  assert.match(validateDiff(f.root, [GOV, 'scripts/workflow-gates/example.mjs'], { phase: 'release' }).errors.join('\n'), /independently reviewed stage/);
}));

test('[GOV-935-CI-DIFF-ALLOW] A changed executable policy file inside a reviewed governance contract passes the release diff check', () => withFixture(f => {
  review(f.root, f.contract);
  assert.deepEqual(validateDiff(f.root, [GOV, 'scripts/workflow-gates/example.mjs'], { phase: 'release' }).errors, []);
  assert.deepEqual(validateDiff(f.root, ['.claude/rules/shared/security-testing.md'], { phase: 'release' }).errors, [], 'Markdown policy keeps the existing behaviour');
}));

test('the diff base reader returns base bytes and null for a file absent at the base', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-governance-git-'));
  try {
    const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
      GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' } });
    git(['init', '-q']);
    put(root, CI_RULE, 'Base rule.\n');
    git(['add', '.']); git(['commit', '-q', '--no-gpg-sign', '-m', 'base']);
    const base = git(['rev-parse', 'HEAD']).trim();
    put(root, CI_RULE, 'Head rule.\n');
    const read = gitBaseReader(root, base);
    assert.equal(read(CI_RULE).replace(/\r\n/g, '\n'), 'Base rule.\n');
    assert.equal(read('.claude/rules/shared/absent.md'), null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

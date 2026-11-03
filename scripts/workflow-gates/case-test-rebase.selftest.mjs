#!/usr/bin/env node
// Task 943 revision 1: the audited case-test rebase (R7, owner D12), the tracked exempting contract (R8) and the
// freshness of reviewed contracts outside the diff (R11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { validateContract, digest, planDigest, scopeDigest, testsEntryErrors, rebaseChainErrors, REQUIRED_PRODUCT_RULES,
  REQUIRED_GOVERNANCE_RULES } from './contract.mjs';
import { validateDiff, reviewedFreshnessErrors } from './cli.mjs';
import { governanceIndependenceErrors } from './security-hook.mjs';

const COMPANIONS = ['workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication'].map(n => `.claude/rules/shared/${n}.md`);
const A = 'tasks/product_kickoff.security.json';
const B = 'tasks/later_kickoff.security.json';
const GOV = 'tasks/gov_kickoff.security.json';
const T = 'src/profile.test.ts';
const T2 = 'src/profile.server.test.ts';
const PROFILE = 'src/profile.ts';
const HELPER = 'src/helper.ts';
const EVIDENCE = 'docs/sessions/evidence/rebase/tests-rebase.md';
const CI_RULE = '.claude/rules/shared/workflow-ci.md';
const RULES_EVIDENCE = 'docs/sessions/evidence/rebase/rules-rebase.md';
const ZERO = '0'.repeat(64);
const FRONTEND = ['ALLOW', 'DENY', 'ERROR'].map(outcome => `SEC-P-FRONTEND-${outcome}`);
const SERVER = ['ALLOW', 'DENY', 'ERROR'].map(outcome => `SEC-P-SERVER-${outcome}`);

function put(root, file, text) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); }
const saveJson = (root, file, value) => put(root, file, `${JSON.stringify(value, null, 2)}\n`);
const readJsonFile = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
const caseTest = (ids, note) => `${ids.map(id => `test('[${id}] profile', () => { /* ${note} */ });`).join('\n')}\n`;
const testsEvidence = (files, ids, assertions = true) => `# Case-test rebase\n\n## Changed case test files\n${files.map(file => `- \`${file}\``).join('\n')}\n`
  + (assertions ? `\n## Case assertions\n${ids.map(id => `- ${id}: the profile owner check -> the profile owner check with a bounded wait`).join('\n')}\n` : '');

function baseRoot(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  for (const file of new Set([...REQUIRED_GOVERNANCE_RULES, ...REQUIRED_PRODUCT_RULES, ...COMPANIONS])) {
    put(root, file, file.endsWith('workflow-gates.md') ? '# Gates\n\n## Required companions\nSynthetic companions.\n' : `Synthetic rule ${file}.\n`);
  }
  for (const task of ['product', 'later', 'gov', 'fresh', 'planned']) put(root, `tasks/${task}_kickoff.md`, `## Security test contract\nSynthetic ${task} change.\n`);
  for (const file of [PROFILE, HELPER, 'src/later.ts', 'src/later.test.ts', 'src/fresh.ts', 'src/fresh.test.ts']) put(root, file, `export const original = '${file}';\n`);
  put(root, T, caseTest(FRONTEND, 'original'));
  put(root, T2, caseTest(SERVER, 'original'));
  put(root, 'package.json', '{ "name": "fixture" }\n');
  return root;
}
function productContract(root, task, scope, files, dir) {
  const cases = [['frontend', files[0], FRONTEND], ['server', files[1] ?? files[0], SERVER]].flatMap(([layer, testFile, ids]) => ids.map(id => ({
    id: id.replace('SEC-P-', `SEC-${dir.toUpperCase()}-`), layer, outcome: id.split('-').at(-1).toLowerCase(), boundary: 'unit', critical: false,
    invariant: 'Only the owner may update their display name', actor: 'Synthetic account', resource: 'Synthetic profile',
    input: 'Synthetic display name', response: 'Synthetic profile response', forbiddenEffects: ['No foreign profile update'], testFile,
    testName: `[${id.replace('SEC-P-', `SEC-${dir.toUpperCase()}-`)}] profile` })));
  return { version: 1, stage: 'implemented', kind: 'product', qaProfile: 'Q2', task, taskSha256: digest(root, [task]), scope,
    rules: [...REQUIRED_PRODUCT_RULES], cases, report: `docs/sessions/evidence/${dir}/report.json` };
}
function review(root, path, contract) {
  const dir = dirname(contract.report);
  contract.stage = 'reviewed';
  put(root, `${dir}/review.md`, 'Synthetic independent review.\n');
  saveJson(root, contract.report, { version: 1, status: 'passed', errors: [], vulnerabilities: [], cleanup: { verified: true, remaining: 0, errors: [] },
    contractSha256: planDigest(root, contract), scopeSha256: scopeDigest(root, contract),
    cases: contract.cases.map(row => ({ id: row.id, status: 'passed', assertionCount: 1 })) });
  contract.review = { role: 'Opus', decision: 'APPROVED', evidence: `${dir}/review.md`, evidenceSha256: digest(root, [`${dir}/review.md`]),
    scopeSha256: scopeDigest(root, contract), reportSha256: digest(root, [contract.report]) };
  saveJson(root, path, contract);
  return contract;
}

// History: contract A (cases in T and T2) is reviewed at the base; a later task B scoping T hardens T (every case ID kept)
// and its approver appends a `tests` entry by B to A.
function build() {
  const root = baseRoot('lero-case-test-rebase-');
  const snapshotFiles = [A, B, T, T2, PROFILE, HELPER, EVIDENCE, 'package.json'];
  const a = review(root, A, productContract(root, 'tasks/product_kickoff.md', [PROFILE, HELPER, T, T2, 'package.json'], [T, T2], 'p'));
  const base = new Map(snapshotFiles.map(file => [file, existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : null]));
  put(root, T, caseTest(FRONTEND, 'hardened with a bounded wait'));
  const b = review(root, B, productContract(root, 'tasks/later_kickoff.md', [T, T2, 'src/later.ts', 'src/later.test.ts', 'package.json'], ['src/later.test.ts'], 'l'));
  put(root, EVIDENCE, testsEvidence([T], FRONTEND.map(id => id)));
  a.review.rebases = [{ kind: 'tests', by: B, evidence: EVIDENCE, evidenceSha256: digest(root, [EVIDENCE]),
    originalScopeSha256: a.review.scopeSha256, rebasedScopeSha256: scopeDigest(root, a) }];
  saveJson(root, A, a);
  const f = {
    root, a, b, base,
    entry: () => f.a.review.rebases.at(-1),
    evidence(text) { put(root, EVIDENCE, text); f.entry().evidenceSha256 = digest(root, [EVIDENCE]); f.resign(); },
    resign() { f.entry().rebasedScopeSha256 = scopeDigest(root, f.a); saveJson(root, A, f.a); },
    errors: () => testsEntryErrors(root, f.a, f.entry()).join('\n'),
    release: () => validateContract(root, f.a, { phase: 'release' }).join('\n'),
    diff: (files = [T, A, B, EVIDENCE]) => validateDiff(root, files, { phase: 'release', readBase: file => base.get(file) ?? null }).errors.join('\n'),
    close: () => rmSync(root, { recursive: true, force: true }),
  };
  return f;
}
function withBuild(fn) { const f = build(); try { fn(f); } finally { f.close(); } }

test('[GOV-943-TESTS-REBASE-ALLOW] A later reviewed contract may rebase a changed case test of a reviewed contract when every case of that file keeps its ID and test name and is named in the evidence', () => withBuild(f => {
  assert.equal(f.errors(), '');
  assert.deepEqual(rebaseChainErrors(f.root, f.a), []);
  assert.equal(f.release(), '');
  assert.equal(f.diff(), '');
  // Without the entry the hardened case test stales the review.
  const without = structuredClone(f.a); delete without.review.rebases;
  assert.match(validateContract(f.root, without, { phase: 'release' }).join('\n'), /Independent review scope is stale/);
}));

test('[GOV-943-TESTS-REBASE-DENY] A tests entry is refused when a case ID or test name is gone, a case is not named in the evidence, the file is no case test or a runtime file, the approving contract does not scope it or is not reviewed, and a scope entry still refuses a case test', () => {
  const variants = [
    ['case ID removed from the test file', f => { put(f.root, T, caseTest(FRONTEND.slice(0, 2), 'a case removed')); f.resign(); },
      /SEC-P-FRONTEND-ERROR: src\/profile\.test\.ts no longer contains \[SEC-P-FRONTEND-ERROR\]/],
    ['case missing from Case assertions', f => f.evidence(testsEvidence([T], FRONTEND.slice(1))), /SEC-P-FRONTEND-ALLOW: Case assertions has no line for this case/],
    ['listed file is no case test', f => f.evidence(testsEvidence([T, HELPER], FRONTEND)), /src\/helper\.ts is not the test file of a case of this contract/],
    ['listed runtime file', f => f.evidence(testsEvidence([T, 'package.json'], FRONTEND)), /package\.json is a runtime file; runtime files are never rebased/],
    ['approving contract does not scope the file', f => { const b = readJsonFile(f.root, B); b.scope = b.scope.filter(p => p !== T); saveJson(f.root, B, b); },
      /src\/profile\.test\.ts is outside the scope of tasks\/later_kickoff\.security\.json/],
    ['approving contract planned', f => { const b = readJsonFile(f.root, B); b.stage = 'planned'; saveJson(f.root, B, b); },
      /tasks\/later_kickoff\.security\.json is not a reviewed product or governance contract/],
    ['approving contract is the rebased contract', f => { f.entry().by = A; saveJson(f.root, A, f.a); }, /tasks\/product_kickoff\.security\.json is the rebased contract itself/],
  ];
  for (const [name, mutate, pattern] of variants) withBuild(f => {
    assert.equal(f.release(), '', `${name}: the fixture is valid before the variant`);
    mutate(f);
    assert.match(f.errors(), pattern, name);
    const release = f.release();
    assert.match(release, /Independent review scope is stale/, name);
    assert.match(release, pattern, name);
  });
  // A scope entry keeps refusing a case test (C37).
  withBuild(f => {
    f.entry().kind = 'scope';
    f.evidence(`# Scope rebase\n\n## Changed scope files\n- \`${T}\`\n`);
    assert.match(f.release(), /src\/profile\.test\.ts is a test file of a case of this contract; case tests are never rebased/);
  });
  // A second, unlisted case test re-signed into the entry passes file by file, but the diff base exposes it.
  withBuild(f => {
    put(f.root, T2, caseTest(SERVER, 'changed without being listed'));
    f.resign();
    assert.equal(f.release(), '');
    const errors = f.diff([T, T2, A, B, EVIDENCE]);
    assert.match(errors, /tasks\/product_kickoff\.security\.json: Independent review scope is stale/);
    assert.match(errors, /tasks\/product_kickoff\.security\.json: rebases: files other than the listed files changed since the review/);
  });
});

test('[GOV-943-TESTS-REBASE-ERROR] A tests entry with malformed evidence or chain fields is an error, never an exemption', () => {
  const variants = [
    ['no Changed case test files section', f => f.evidence(`# Case-test rebase\n\n## Case assertions\n- ${FRONTEND[0]}: a -> b\n`), /evidence lists no changed case test files/],
    ['no Case assertions section', f => f.evidence(testsEvidence([T], FRONTEND, false)), /evidence has no Case assertions section/],
    ['stale evidence hash', f => put(f.root, EVIDENCE, `${testsEvidence([T], FRONTEND)}Edited later.\n`), /rebases: entry 1: evidence hash is stale/],
    ['missing field', f => { delete f.entry().evidenceSha256; saveJson(f.root, A, f.a); }, /rebases: entry 1 is missing evidenceSha256/],
    ['unreadable approving contract', f => put(f.root, B, '{ not json'), /approving contract unavailable \(Malformed or unreadable JSON: tasks\/later_kickoff\.security\.json\)/],
    ['missing approving contract', f => { f.entry().by = 'tasks/absent_kickoff.security.json'; saveJson(f.root, A, f.a); }, /approving contract unavailable \(Missing file/],
    ['evidence outside docs/sessions/evidence', f => { f.entry().evidence = 'docs/tests-rebase.md'; put(f.root, 'docs/tests-rebase.md', testsEvidence([T], FRONTEND));
      f.entry().evidenceSha256 = digest(f.root, ['docs/tests-rebase.md']); f.resign(); }, /evidence must be under docs\/sessions\/evidence\//],
  ];
  for (const [name, mutate, pattern] of variants) withBuild(f => {
    mutate(f);
    let errors;
    assert.doesNotThrow(() => { errors = f.release(); }, name);
    assert.match(errors, /Independent review scope is stale/, name);
    assert.match(errors, pattern, name);
  });
  withBuild(f => {
    for (const entry of [null, 42, [], 'tests']) assert.deepEqual(testsEntryErrors(f.root, f.a, entry), ['tests entry must be an object']);
  });
});

test('[GOV-943-EXEMPT-UNTRACKED-DENY] Only a contract tracked in Git at HEAD can exempt an approver\'s rule-rebase write from the independence check', () => {
  const root = baseRoot('lero-exempt-untracked-');
  const git = args => execFileSync('git', ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.test', '-c', 'core.hooksPath=.git/no-hooks', ...args],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const gov = { version: 1, kind: 'governance', stage: 'reviewed', scope: [CI_RULE, A, RULES_EVIDENCE, 'scripts/workflow-gates/example.mjs'] };
    saveJson(root, GOV, gov);
    put(root, CI_RULE, 'Changed synthetic CI rule.\n');
    put(root, RULES_EVIDENCE, `# Rules rebase\n\n## Changed rule files\n- \`${CI_RULE}\`\n`);
    const product = { version: 1, kind: 'product', stage: 'reviewed', rules: [...REQUIRED_PRODUCT_RULES], review: { scopeSha256: ZERO,
      rebases: [{ kind: 'rules', by: GOV, evidence: RULES_EVIDENCE, evidenceSha256: digest(root, [RULES_EVIDENCE]), originalScopeSha256: ZERO, rebasedScopeSha256: ZERO }] } };
    saveJson(root, A, product);
    git(['init', '-q']);
    git(['add', '--', '.claude', 'docs', GOV]);
    git(['commit', '-q', '--no-gpg-sign', '-m', 'base']);
    const transcript = [A, RULES_EVIDENCE].flatMap((file, i) => [
      { type: 'assistant', message: { content: [{ type: 'tool_use', id: `w${i}`, name: 'Write', input: { file_path: join(root, file), content: 'x' } }] } },
      { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `w${i}`, content: 'ok' }] } },
    ]).map(line => JSON.stringify(line)).join('\n');
    const independence = () => governanceIndependenceErrors(root, gov, GOV, transcript).join('\n');
    // Untracked: the planted contract exempts nothing.
    assert.match(independence(), /GOVERNANCE INDEPENDENCE: this session wrote tasks\/product_kickoff\.security\.json/);
    // Committed: the valid rules entry exempts the contract and its evidence.
    git(['add', '--', A]);
    git(['commit', '-q', '--no-gpg-sign', '-m', 'contract']);
    assert.equal(independence(), '');
    // Git unavailable (spawn error ENOENT): the committed contract exempts nothing.
    const saved = { PATH: process.env.PATH, Path: process.env.Path };
    try {
      process.env.PATH = '';
      if (process.platform === 'win32') process.env.Path = '';
      assert.match(independence(), /GOVERNANCE INDEPENDENCE: this session wrote tasks\/product_kickoff\.security\.json/);
    } finally {
      for (const [key, value] of Object.entries(saved)) if (value !== undefined) process.env[key] = value;
    }
    assert.equal(independence(), '', 'restored PATH exempts again');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('[GOV-943-CI-STALE-REVIEW-DENY] A reviewed contract outside the diff with a stale review digest fails the release check', () => withBuild(f => {
  const { root } = f;
  // A fresh reviewed contract and a planned contract with a stale scope add nothing.
  review(root, 'tasks/fresh_kickoff.security.json', productContract(root, 'tasks/fresh_kickoff.md', ['src/fresh.ts', 'src/fresh.test.ts', 'package.json'], ['src/fresh.test.ts'], 'f'));
  const planned = productContract(root, 'tasks/planned_kickoff.md', [HELPER, 'src/fresh.test.ts', 'package.json'], ['src/fresh.test.ts'], 'q');
  planned.stage = 'planned'; saveJson(root, 'tasks/planned_kickoff.security.json', planned);
  assert.deepEqual(reviewedFreshnessErrors(root, []), [], 'A with a valid rebase chain, B and a fresh contract are current');
  put(root, HELPER, 'export const changed = true;\n');
  const errors = reviewedFreshnessErrors(root, []).join('\n');
  assert.match(errors, /tasks\/product_kickoff\.security\.json: Independent review scope is stale/);
  assert.match(errors, /tasks\/product_kickoff\.security\.json: Security report scope hash is stale/);
  assert.doesNotMatch(errors, /planned_kickoff|fresh_kickoff|later_kickoff/);
  // A selected contract is checked by validateDiff instead.
  assert.deepEqual(reviewedFreshnessErrors(root, [A]), []);
  // A contract reviewed at the base and deleted at head; a move to the archive or a reviewed replacement is not a removal.
  const removed = 'tasks/gone_kickoff.security.json';
  const readBase = file => (file === removed ? JSON.stringify({ stage: 'reviewed' }) : null);
  assert.match(reviewedFreshnessErrors(root, [A], { files: [removed], readBase }).join('\n'), /reviewed contract removed: tasks\/gone_kickoff\.security\.json/);
  assert.deepEqual(reviewedFreshnessErrors(root, [A], { files: [removed], readBase: () => JSON.stringify({ stage: 'planned' }) }), []);
  mkdirSync(join(root, 'tasks/Archive'), { recursive: true });
  renameSync(join(root, 'tasks/fresh_kickoff.security.json'), join(root, 'tasks/Archive/fresh_kickoff.security.json'));
  const moved = 'tasks/fresh_kickoff.security.json';
  const movedBase = file => (file === moved ? JSON.stringify({ stage: 'reviewed' }) : null);
  assert.doesNotMatch(reviewedFreshnessErrors(root, [A], { files: [moved], readBase: movedBase }).join('\n'), /reviewed contract removed/);
  // An unreadable contract outside the selection is a named error.
  put(root, 'tasks/broken_kickoff.security.json', '{ not json');
  assert.match(reviewedFreshnessErrors(root, [A]).join('\n'), /tasks\/broken_kickoff\.security\.json: reviewed freshness: contract unavailable/);
}));

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { validateContract, validateReport, requiredResults, selectShard, digest, planDigest, scopeDigest, safePath, isProductPath, REQUIRED_PRODUCT_RULES } from './contract.mjs';
import { validateReceipt } from './cli.mjs';

test('digests sort object keys by UTF-16 code unit, independent of the runtime ICU locale', () => {
  // RFC 8785 key order; localeCompare ordered these keys differently under en-GB and en-US-u-va-posix.
  const expected = createHash('sha256').update(JSON.stringify({ data: { '-y': 4, Za: 1, _x: 3, ab: 2 }, files: [] })).digest('hex');
  assert.equal(digest(tmpdir(), [], { ab: 2, _x: 3, Za: 1, '-y': 4 }), expected);
  assert.deepEqual(selectShard([{ id: 'b' }, { id: '_a' }, { id: '-c' }, { id: 'B' }], '1/1').map(s => s.id), ['-c', 'B', '_a', 'b']);
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'lero-contract-'));
  for (const file of ['tasks/example_kickoff.md', 'src/profile.ts', 'src/profile.test.ts', 'src/profile.integration.test.ts', ...REQUIRED_PRODUCT_RULES]) {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), file.endsWith('.md') ? '## Security test contract\nSynthetic profile isolation.\n' : 'export const fixture = true;\n');
  }
  const contract = {
    version: 1, stage: 'planned', task: 'tasks/example_kickoff.md', taskSha256: digest(root, ['tasks/example_kickoff.md']),
    kind: 'product', qaProfile: 'Q4', scope: ['src/profile.ts', 'src/profile.test.ts'],
    rules: REQUIRED_PRODUCT_RULES,
    cases: ['frontend', 'server'].flatMap(layer => ['allow', 'deny', 'error'].map(outcome => ({
      id: `SEC-${layer.toUpperCase()}-${outcome.toUpperCase()}`, layer, outcome,
      invariant: 'Only the authenticated owner may update their display name.',
      actor: outcome === 'deny' ? 'Synthetic account A' : 'Synthetic account B',
      resource: 'Synthetic account B profile', input: 'PATCH display_name with a validated synthetic name',
      response: outcome === 'allow' ? '200 and display_name only' : '403 or supported validation error without profile fields',
      forbiddenEffects: ['No update of account B by A', 'No email or provider request'],
      testFile: 'src/profile.test.ts', testName: `[SEC-${layer.toUpperCase()}-${outcome.toUpperCase()}] profile boundary`,
      boundary: 'unit', critical: true,
    }))),
  };
  contract.cases.push(...['allow', 'deny', 'error'].map(outcome => ({ ...contract.cases[0], id: `SEC-DATABASE-${outcome.toUpperCase()}`,
    layer: 'database', outcome, boundary: 'integration', testFile: 'src/profile.integration.test.ts', testName: `[SEC-DATABASE-${outcome.toUpperCase()}] profile boundary` })));
  return { root, contract, close: () => rmSync(root, { recursive: true, force: true }) };
}

function withFixture(fn) { const f = fixture(); try { fn(f); } finally { f.close(); } }
test('accepts a concrete plan with both layers, allow/deny/error and exact paths', () => withFixture(f => {
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
}));

test('draft and blocked execution cannot authorize a saved plan; ready and legacy plans retain their checks', () => withFixture(f => {
  for (const status of ['draft', 'blocked', 'unknown', null]) {
    f.contract.executionStatus = status;
    assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), /execution.*ready/i, String(status));
  }
  f.contract.executionStatus = 'ready';
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
  delete f.contract.executionStatus;
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
}));

test('a product plan cannot assign executor-forbidden policy paths, and a corrected scope recovers', () => withFixture(f => {
  for (const file of ['scripts/check-locale-leak.mjs', 'scripts/workflow-gates/contract.mjs',
    '.claude/rules/create/03-publication.md', '.github/workflows/governance-pr.yml', 'docs/rules/example.md']) {
    f.contract.scope.push(file);
    assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), /executor.*policy|policy.*executor/i, file);
    f.contract.scope.pop();
    assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
  }
  f.contract.scope.push('scripts/product-helper.mjs', 'src/future.test.ts');
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
  f.contract.kind = 'docs'; f.contract.qaProfile = 'Q0'; f.contract.cases = [];
  f.contract.scope = ['.claude/rules/shared/security-testing.md'];
  f.contract.notApplicable = 'Rule text only, maintained by the orchestrator rather than product execution.';
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
}));
test('rejects missing server cases and docs-only N/A for runtime work', () => withFixture(f => {
  f.contract.cases = f.contract.cases.filter(c => c.layer !== 'server');
  assert.match(validateContract(f.root, f.contract).join('\n'), /server/);
  f.contract.kind = 'docs'; f.contract.qaProfile = 'Q0'; f.contract.cases = []; f.contract.notApplicable = 'Only documentation';
  assert.match(validateContract(f.root, f.contract).join('\n'), /documentation/);
}));
test('rejects duplicate IDs, placeholders, path escapes and a stale kickoff hash', () => withFixture(f => {
  f.contract.cases[1].id = f.contract.cases[0].id;
  f.contract.cases[0].actor = 'TODO'; f.contract.scope.push('../outside.ts');
  writeFileSync(join(f.root, f.contract.task), 'changed');
  const errors = validateContract(f.root, f.contract).join('\n');
  for (const pattern of [/duplicate/, /actor/, /path/, /stale/]) assert.match(errors, pattern);
}));
test('a planned future test may not be claimed as executed', () => withFixture(f => {
  f.contract.cases[0].testFile = 'src/future.test.ts';
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'plan' }), []);
  assert.match(validateContract(f.root, f.contract, { phase: 'verify' }).join('\n'), /future.test/);
}));
function report(f) {
  return { version: 1, contractSha256: planDigest(f.root, f.contract), scopeSha256: scopeDigest(f.root, f.contract),
    status: 'passed', errors: [], vulnerabilities: [], cleanup: { verified: true, remaining: 0, errors: [] },
    cases: f.contract.cases.map(c => ({ id: c.id, status: 'passed', assertionCount: 3,
      sensitivity: { baseline: 'passed', mutant: 'failed', failureKind: 'assertion', restored: 'passed',
        testName: c.testName, artifact: 'evidence/mutation.json', artifactSha256: digest(f.root, ['evidence/mutation.json']) } })) };
}
test('the reported 9-VULN/exit-zero incident is rejected regardless of exit code', () => withFixture(f => {
  mkdirSync(join(f.root, 'evidence')); writeFileSync(join(f.root, 'evidence/mutation.json'), '{"fixture":"mutation evidence"}');
  const r = report(f); r.vulnerabilities = ['A can set role=admin'];
  assert.match(validateReport(f.root, f.contract, r).join('\n'), /vulnerabilit/);
  r.vulnerabilities = []; r.cleanup.verified = false; r.cleanup.errors = ['count query denied'];
  assert.match(validateReport(f.root, f.contract, r).join('\n'), /cleanup/);
}));
test('rejects skipped, missing, vacuous, stale and non-assertion mutation proof', () => withFixture(f => {
  mkdirSync(join(f.root, 'evidence')); writeFileSync(join(f.root, 'evidence/mutation.json'), '{}');
  const r = report(f); assert.deepEqual(validateReport(f.root, f.contract, r), []);
  r.cases[0].status = 'skipped'; r.cases[1].assertionCount = 0; r.cases[2].sensitivity.failureKind = 'timeout';
  r.cases.pop(); r.scopeSha256 = 'old';
  const errors = validateReport(f.root, f.contract, r).join('\n');
  for (const p of [/skipped/, /assertion/, /sensitivity/, /missing/, /stale/]) assert.match(errors, p);
}));
test('required CI summary rejects failure, cancellation, skipped, missing and unexpected jobs', () => {
  assert.deepEqual(requiredResults({ static: { result: 'success' }, unit: { result: 'success' } }, ['static', 'unit']), []);
  for (const state of ['failure', 'cancelled', 'skipped', undefined]) {
    assert.notEqual(requiredResults({ static: { result: 'success' }, unit: { result: state } }, ['static', 'unit']).length, 0);
  }
  assert.notEqual(requiredResults({ static: { result: 'success' } }, ['static', 'unit']).length, 0);
  assert.notEqual(requiredResults({ static: { result: 'success' }, surprise: { result: 'success' } }, ['static']).length, 0);
});
test('locale shards are disjoint, deterministic, complete and reject invalid/empty shards', () => {
  const stories = Array.from({ length: 43 }, (_, i) => ({ id: `story-${i}` }));
  const shards = Array.from({ length: 6 }, (_, i) => selectShard(stories, `${i + 1}/6`));
  assert.deepEqual(shards.flat().map(s => s.id).sort(), stories.map(s => s.id).sort());
  assert.equal(new Set(shards.flat().map(s => s.id)).size, stories.length);
  assert.deepEqual(selectShard([...stories].reverse(), '1/6'), shards[0]);
  for (const invalid of ['0/6', '7/6', '1/0', 'garbage', '1/99']) assert.throws(() => selectShard(stories, invalid));
});
test('release requires independent review bound to the current source, report and evidence', () => withFixture(f => {
  f.contract.stage = 'implemented';
  assert.match(validateContract(f.root, f.contract, { phase: 'release' }).join('\n'), /independently reviewed|review decision/);
  f.contract.stage = 'reviewed'; f.contract.report = 'evidence/report.json';
  mkdirSync(join(f.root, 'evidence')); writeFileSync(join(f.root, f.contract.report), '{}');
  writeFileSync(join(f.root, 'evidence/review.md'), 'Synthetic independent review; scope inspected.');
  f.contract.review = { role: 'Opus', decision: 'APPROVED', evidence: 'evidence/review.md',
    evidenceSha256: digest(f.root, ['evidence/review.md']), scopeSha256: scopeDigest(f.root, f.contract), reportSha256: digest(f.root, [f.contract.report]) };
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'release' }), []);
  const before = planDigest(f.root, f.contract); f.contract.stage = 'implemented';
  assert.equal(planDigest(f.root, f.contract), before);
  f.contract.stage = 'reviewed'; writeFileSync(join(f.root, f.contract.report), '{"changed":true}');
  assert.match(validateContract(f.root, f.contract, { phase: 'release' }).join('\n'), /report is stale/);
}));
test('archiving preserves reviewed evidence but cannot authorize a new execution', () => withFixture(f => {
  mkdirSync(join(f.root, 'tasks/Archive'));
  const archived = 'tasks/Archive/example_kickoff.md'; copyFileSync(join(f.root, f.contract.task), join(f.root, archived));
  f.contract.task = archived; f.contract.taskSha256 = digest(f.root, [archived]);
  assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), /active task/);
  f.contract.stage = 'reviewed';
  assert.deepEqual(validateContract(f.root, f.contract, { phase: 'verify' }), []);
}));
test('a fresh archived review can emit its closure receipt without authorizing another execution', () => withFixture(f => {
  assert.deepEqual(validateReceipt(f.root, f.contract), []);
  mkdirSync(join(f.root, 'tasks/Archive')); mkdirSync(join(f.root, 'evidence'));
  const archived = 'tasks/Archive/example_kickoff.md'; copyFileSync(join(f.root, f.contract.task), join(f.root, archived));
  f.contract.task = archived; f.contract.taskSha256 = digest(f.root, [archived]);
  f.contract.stage = 'reviewed'; f.contract.executionStatus = 'ready'; f.contract.report = 'evidence/report.json';
  writeFileSync(join(f.root, 'evidence/mutation.json'), 'Synthetic assertion evidence.');
  writeFileSync(join(f.root, 'evidence/review.md'), 'Synthetic independent review of the scoped candidate.');
  const result = JSON.stringify(report(f)); writeFileSync(join(f.root, f.contract.report), result);
  f.contract.review = { role: 'Opus', decision: 'APPROVED', evidence: 'evidence/review.md',
    evidenceSha256: digest(f.root, ['evidence/review.md']), scopeSha256: scopeDigest(f.root, f.contract),
    reportSha256: digest(f.root, [f.contract.report]) };
  assert.deepEqual(validateReceipt(f.root, f.contract), [], 'closure needs a read-only receipt for the moved contract');
  assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), /active task/);
  writeFileSync(join(f.root, f.contract.report), '{}');
  assert.ok(validateReceipt(f.root, f.contract).length, 'stale review/report cannot emit closure evidence');
  writeFileSync(join(f.root, f.contract.report), result);
  assert.deepEqual(validateReceipt(f.root, f.contract), []);
  f.contract.stage = 'implemented'; assert.ok(validateReceipt(f.root, f.contract).length);
}));
test('changing a mapped test outside the write scope invalidates old security evidence', () => withFixture(f => {
  f.contract.scope = ['src/profile.ts'];
  mkdirSync(join(f.root, 'evidence')); writeFileSync(join(f.root, 'evidence/mutation.json'), '{}');
  const evidence = report(f); assert.deepEqual(validateReport(f.root, f.contract, evidence), []);
  writeFileSync(join(f.root, 'src/profile.test.ts'), 'Changed assertion source.');
  assert.match(validateReport(f.root, f.contract, evidence).join('\n'), /stale/);
}));

test('changing the real-boundary project configuration invalidates retained security proof', () => withFixture(f => {
  mkdirSync(join(f.root, 'evidence')); writeFileSync(join(f.root, 'evidence/mutation.json'), '{}');
  writeFileSync(join(f.root, 'vitest.integration.config.ts'), 'export default { test: { retry: 0 } }');
  const evidence = report(f); assert.deepEqual(validateReport(f.root, f.contract, evidence), []);
  writeFileSync(join(f.root, 'vitest.integration.config.ts'), 'export default { test: { retry: 2 } }');
  assert.match(validateReport(f.root, f.contract, evidence).join('\n'), /stale/);
}));

test('Q5 is not an existing QA profile and critical cases cannot downgrade to Q1', () => withFixture(f => {
  f.contract.qaProfile = 'Q5'; assert.match(validateContract(f.root, f.contract).join('\n'), /QA profile/);
  f.contract.qaProfile = 'Q1'; assert.match(validateContract(f.root, f.contract).join('\n'), /Q4/);
}));

test('integration configuration, shipped assets and locale resources belong to product scope', () => {
  for (const file of ['vitest.integration.config.ts', 'messages/uk.json', 'public/profile.svg']) assert.equal(isProductPath(file), true, file);
});

test('root runtime configuration that ships with the application belongs to product scope', () => {
  // The Sentry configs scrub personal data before an event leaves the server (finding S57); Next runs these root files.
  for (const file of ['sentry.server.config.ts', 'sentry.edge.config.ts', 'sentry.client.config.ts', 'instrumentation.ts', 'instrumentation-client.ts', 'middleware.ts', 'proxy.ts', 'vercel.ts']) {
    assert.equal(isProductPath(file), true, file);
  }
  for (const file of ['eslint.config.mjs', 'README.md', 'docs/sentry.server.config.ts']) assert.equal(isProductPath(file), false, file);
});

test('executable script helpers are product work while enforcement scripts remain policy', () => {
  for (const path of ['scripts/owner-fixes-sensitivity.mjs', 'scripts/product-helper.ts', 'scripts/helper.cjs', 'scripts/helper.ps1', 'scripts/helper.py', 'scripts/helper.sh']) {
    assert.equal(isProductPath(path), true, path);
  }
  for (const path of ['scripts/workflow-gates/contract.mjs', 'scripts/check-locale-leak.mjs', 'docs/helper.md']) {
    assert.equal(isProductPath(path), false, path);
  }
});

test('a future file cannot escape through an existing parent junction', () => {
  const base = mkdtempSync(join(tmpdir(), 'lero-path-boundary-'));
  try {
    const root = join(base, 'project'), outside = join(base, 'outside');
    mkdirSync(root); mkdirSync(outside); symlinkSync(outside, join(root, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => safePath(root, 'link/future.ts', false), /escapes repository/);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test('changes to required policy or installed test setup invalidate retained security evidence', () => withFixture(f => {
  mkdirSync(join(f.root, 'evidence')); writeFileSync(join(f.root, 'evidence/mutation.json'), '{}');
  mkdirSync(join(f.root, 'src/tests')); writeFileSync(join(f.root, 'src/tests/setup.ts'), 'export const setup = 1;');
  const evidence = report(f);
  writeFileSync(join(f.root, 'src/tests/setup.ts'), 'export const setup = 2;');
  assert.match(validateReport(f.root, f.contract, evidence).join('\n'), /stale/);
  const refreshed = report(f);
  writeFileSync(join(f.root, REQUIRED_PRODUCT_RULES[0]), 'Changed security policy.');
  assert.match(validateReport(f.root, f.contract, refreshed).join('\n'), /stale/);
}));

// Task 940: the audited rebase chain (rules and scope entries), its diff check and the validated hook exemption.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { validateContract, validateReport, digest, planDigest, scopeDigest, REQUIRED_PRODUCT_RULES, REQUIRED_GOVERNANCE_RULES } from './contract.mjs';
import { validateDiff } from './cli.mjs';
import { governanceIndependenceErrors } from './security-hook.mjs';

const COMPANIONS = ['workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication'].map(n => `.claude/rules/shared/${n}.md`);
const GOV = 'tasks/gov_kickoff.security.json';
const OTHER = 'tasks/other_kickoff.security.json';
const PRODUCT = 'tasks/product_kickoff.security.json';
const LATER = 'tasks/later_kickoff.security.json';
const CI_RULE = '.claude/rules/shared/workflow-ci.md';
const RULES_EVIDENCE = 'docs/sessions/evidence/rebase/rules-rebase.md';
const SCOPE_EVIDENCE = 'docs/sessions/evidence/rebase/scope-rebase.md';
const HELPER = 'src/helper.ts';
const PROFILE = 'src/profile.ts';
const PROFILE_TEST = 'src/profile.test.ts';
const EXAMPLE = 'scripts/workflow-gates/example.mjs';
const SNAPSHOT_FILES = [CI_RULE, HELPER, PROFILE, PROFILE_TEST, 'package.json', PRODUCT, LATER, GOV, RULES_EVIDENCE, SCOPE_EVIDENCE];
const ZERO = '0'.repeat(64);

function put(root, file, text) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); }
const saveJson = (root, file, value) => put(root, file, `${JSON.stringify(value, null, 2)}\n`);
const readJsonFile = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
const escape = text => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const scopeEvidence = files => `# Scope rebase\n\n## Changed scope files\n${files.map(file => `- \`${file}\``).join('\n')}\n`;

function baseRoot(prefix) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  for (const file of new Set([...REQUIRED_GOVERNANCE_RULES, ...REQUIRED_PRODUCT_RULES, ...COMPANIONS])) {
    put(root, file, file.endsWith('workflow-gates.md') ? '# Gates\n\n## Required companions\nSynthetic companions.\n' : `Synthetic rule ${file}.\n`);
  }
  for (const task of ['gov', 'other', 'product', 'later']) put(root, `tasks/${task}_kickoff.md`, `## Security test contract\nSynthetic ${task} change.\n`);
  for (const file of [EXAMPLE, 'scripts/workflow-gates/other.mjs']) put(root, file, 'export const gate = true;\n');
  for (const file of ['scripts/workflow-gates/example.selftest.mjs', 'scripts/workflow-gates/other.selftest.mjs']) put(root, file, "import { test } from 'node:test';\n");
  for (const file of [PROFILE, HELPER, PROFILE_TEST, 'src/later.ts', 'src/later.test.ts']) put(root, file, `export const original = '${file}';\n`);
  put(root, 'package.json', '{ "name": "fixture" }\n');
  return root;
}
function productContract(root, task, scope, testFile, dir) {
  const cases = ['frontend', 'server'].flatMap(layer => ['allow', 'deny', 'error'].map(outcome => {
    const id = `SEC-${dir.toUpperCase()}-${layer.toUpperCase()}-${outcome.toUpperCase()}`;
    return { id, layer, outcome, boundary: 'unit', critical: false, invariant: 'Only the owner may update their display name',
      actor: 'Synthetic account', resource: 'Synthetic profile', input: 'Synthetic display name', response: 'Synthetic profile response',
      forbiddenEffects: ['No foreign profile update'], testFile, testName: `[${id}] profile` };
  }));
  return { version: 1, stage: 'implemented', kind: 'product', qaProfile: 'Q2', task, taskSha256: digest(root, [task]), scope,
    rules: [...REQUIRED_PRODUCT_RULES], cases, report: `docs/sessions/evidence/${dir}/report.json` };
}
// The product report records the reviewed digest; the review is written after every scope file is final.
function reviewProduct(root, path, contract) {
  const dir = dirname(contract.report);
  contract.stage = 'reviewed';
  put(root, `${dir}/review.md`, 'Synthetic independent product review.\n');
  saveJson(root, contract.report, { version: 1, status: 'passed', errors: [], vulnerabilities: [], cleanup: { verified: true, remaining: 0, errors: [] },
    contractSha256: planDigest(root, contract), scopeSha256: scopeDigest(root, contract),
    cases: contract.cases.map(row => ({ id: row.id, status: 'passed', assertionCount: 1 })) });
  contract.review = { role: 'Opus', decision: 'APPROVED', evidence: `${dir}/review.md`, evidenceSha256: digest(root, [`${dir}/review.md`]),
    scopeSha256: scopeDigest(root, contract), reportSha256: digest(root, [contract.report]) };
  saveJson(root, path, contract);
  return contract;
}
function governanceContract(root, { task, scope, testFile, prefix, dir }) {
  const row = (id, layer, outcome) => ({ id, layer, outcome, boundary: 'unit', critical: false,
    invariant: 'Synthetic gate refuses an unreviewed policy change', actor: 'Synthetic Opus session', resource: 'Synthetic gate function',
    input: 'Synthetic gate input record', response: 'Synthetic gate decision', forbiddenEffects: ['Synthetic unreviewed change accepted'],
    testFile, testName: `[${id}] synthetic gate case` });
  return { version: 1, stage: 'implemented', executionStatus: 'ready', kind: 'governance', qaProfile: 'Q1', task, taskSha256: digest(root, [task]),
    scope, rules: [...REQUIRED_GOVERNANCE_RULES], implementation: { role: 'Opus' },
    cases: [row(`GOV-${prefix}-HOOK-ALLOW`, 'hook', 'allow'), row(`GOV-${prefix}-HOOK-DENY`, 'hook', 'deny'), row(`GOV-${prefix}-CI-ERROR`, 'ci', 'error')],
    report: `docs/sessions/evidence/${dir}/report.json`, sensitivity: `docs/sessions/evidence/${dir}/sensitivity.json` };
}
function reviewGovernance(root, path, contract) {
  const dir = dirname(contract.report);
  contract.stage = 'reviewed';
  put(root, `${dir}/review.md`, 'Synthetic independent governance review.\n');
  saveJson(root, contract.report, { version: 1, status: 'passed', contractSha256: planDigest(root, contract), scopeSha256: scopeDigest(root, contract),
    cases: contract.cases.map(c => ({ id: c.id, status: 'passed', testFile: c.testFile, testName: c.testName })), errors: [] });
  contract.review = { role: 'Opus', decision: 'APPROVED', evidence: `${dir}/review.md`, evidenceSha256: digest(root, [`${dir}/review.md`]),
    scopeSha256: scopeDigest(root, contract), reportSha256: digest(root, [contract.report]) };
  saveJson(root, path, contract);
  return contract;
}

// History: the product contract is reviewed (snapshot 0); optionally a governance task changes one of its rule files and
// its approver writes the legacy rulesRebase (snapshot 1); optionally a later product task changes one of its scope files
// and its approver appends a scope entry (snapshot 2). The governance contract scopes the product contract file.
function build({ rules = false, scope = true, scopeFile = HELPER } = {}) {
  const root = baseRoot('lero-scope-rebase-');
  const snap = () => new Map(SNAPSHOT_FILES.map(file => [file, existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : null]));
  const product = reviewProduct(root, PRODUCT, productContract(root, 'tasks/product_kickoff.md', [PROFILE, HELPER, PROFILE_TEST, 'package.json'], PROFILE_TEST, 'p'));
  const gov = governanceContract(root, { task: 'tasks/gov_kickoff.md', scope: [EXAMPLE, 'scripts/workflow-gates/example.selftest.mjs', CI_RULE, PRODUCT, RULES_EVIDENCE],
    testFile: 'scripts/workflow-gates/example.selftest.mjs', prefix: 'T', dir: 'gov' });
  const snapshots = [snap()];
  if (rules) {
    put(root, CI_RULE, 'Changed synthetic CI rule.\n');
    put(root, RULES_EVIDENCE, `# Rules rebase\n\n## Changed rule files\n- \`${CI_RULE}\`\n`);
    product.review.rulesRebase = { by: GOV, evidence: RULES_EVIDENCE, evidenceSha256: digest(root, [RULES_EVIDENCE]),
      originalScopeSha256: product.review.scopeSha256, rebasedScopeSha256: scopeDigest(root, product) };
    saveJson(root, PRODUCT, product);
  }
  reviewGovernance(root, GOV, gov);
  snapshots.push(snap());
  let later;
  if (scope) {
    put(root, scopeFile, `export const changed = '${scopeFile}';\n`);
    later = reviewProduct(root, LATER, productContract(root, 'tasks/later_kickoff.md', [HELPER, 'src/later.ts', 'src/later.test.ts', PROFILE_TEST, 'package.json'], 'src/later.test.ts', 'l'));
    put(root, SCOPE_EVIDENCE, scopeEvidence([scopeFile]));
    product.review.rebases = [{ kind: 'scope', by: LATER, evidence: SCOPE_EVIDENCE, evidenceSha256: digest(root, [SCOPE_EVIDENCE]),
      originalScopeSha256: product.review.rulesRebase?.rebasedScopeSha256 ?? product.review.scopeSha256, rebasedScopeSha256: scopeDigest(root, product) }];
    saveJson(root, PRODUCT, product);
    reviewGovernance(root, GOV, gov);
  }
  snapshots.push(snap());
  const f = {
    root, product, gov, later, snapshots,
    entry: () => f.product.review.rebases.at(-1),
    // The governance contract scopes the product contract file, so its own review is re-signed after every product edit.
    save() { saveJson(root, PRODUCT, f.product); reviewGovernance(root, GOV, f.gov); },
    evidence(text, file = f.entry().evidence) { put(root, file, text); f.entry().evidenceSha256 = digest(root, [file]); },
    resign() { f.entry().rebasedScopeSha256 = scopeDigest(root, f.product); f.save(); },
    release: () => validateContract(root, f.product, { phase: 'release' }).join('\n'),
    files: [...(rules ? [CI_RULE, RULES_EVIDENCE] : []), ...(scope ? [scopeFile, LATER, SCOPE_EVIDENCE] : []), PRODUCT, GOV],
    diff(files = f.files, at = 0, absent = []) {
      const base = snapshots[at];
      return validateDiff(root, files, { phase: 'release', readBase: file => absent.includes(file) ? null : base.get(file) ?? null }).errors.join('\n');
    },
    close: () => rmSync(root, { recursive: true, force: true }),
  };
  return f;
}
function withBuild(options, fn) { const f = build(options); try { fn(f); } finally { f.close(); } }

test('[GOV-940-VAL-SCOPE-ALLOW] A reviewed contract stale only through a non-test scope file owned by a later reviewed contract is accepted with a valid scope entry', () => withBuild({}, f => {
  const reviewed = readJsonFile(f.root, PRODUCT).review.scopeSha256;
  assert.equal(f.release(), '');
  assert.equal(f.product.review.scopeSha256, reviewed, 'the entry never rewrites review.scopeSha256');
  assert.equal(f.product.review.rebases[0].originalScopeSha256, reviewed);
  const withoutEntry = structuredClone(f.product); delete withoutEntry.review.rebases;
  assert.match(validateContract(f.root, withoutEntry, { phase: 'release' }).join('\n'), /Independent review scope is stale/, 'the scope change alone stales the review');
  const emptyChain = structuredClone(f.product); emptyChain.review.rebases = [];
  assert.match(validateContract(f.root, emptyChain, { phase: 'release' }).join('\n'), /Independent review scope is stale/);
}));

test('[GOV-940-VAL-SCOPE-DENY] A scope entry never hides a case test file, an out-of-scope file, an unapproved owner or a broken chain', () => {
  const variants = [
    ['case test file', { scopeFile: PROFILE_TEST }, () => {}, /src\/profile\.test\.ts is a test file of a case of this contract/],
    ['runtime file', { scopeFile: 'package.json' }, () => {}, /package\.json is a runtime file; runtime files are never rebased/],
    ['file outside the rebased scope', {}, f => f.evidence(scopeEvidence([HELPER, 'src/later.ts'])), /src\/later\.ts is not in the scope of this contract/],
    ['by not reviewed', {}, f => { const l = readJsonFile(f.root, LATER); l.stage = 'implemented'; saveJson(f.root, LATER, l); }, /tasks\/later_kickoff\.security\.json is not a reviewed product or governance contract/],
    ['by not scoping the file', {}, f => { const l = readJsonFile(f.root, LATER); l.scope = l.scope.filter(p => p !== HELPER); saveJson(f.root, LATER, l); }, /src\/helper\.ts is outside the scope of tasks\/later_kickoff\.security\.json/],
    ['by is the rebased contract', {}, f => { f.entry().by = PRODUCT; }, /tasks\/product_kickoff\.security\.json is the rebased contract itself/],
    ['by is a docs contract', {}, f => { const l = readJsonFile(f.root, LATER); l.kind = 'docs'; saveJson(f.root, LATER, l); }, /is not a reviewed product or governance contract/],
    ['stale evidence hash', {}, f => put(f.root, SCOPE_EVIDENCE, `${scopeEvidence([HELPER])}Edited later.\n`), /rebases: entry 1: evidence hash is stale/],
    ['evidence outside docs/sessions/evidence', {}, f => { f.entry().evidence = 'docs/scope-rebase.md'; f.evidence(scopeEvidence([HELPER])); }, /evidence must be under docs\/sessions\/evidence\//],
    ['missing heading', {}, f => f.evidence(`# Scope rebase\n\n## Changed rule files\n- \`${HELPER}\`\n`), /evidence lists no changed scope files/],
    ['broken original digest', {}, f => { f.entry().originalScopeSha256 = ZERO; }, /rebases: entry 1: originalScopeSha256 is not the reviewed scope digest/],
    ['broken rebased digest', {}, f => { f.entry().rebasedScopeSha256 = ZERO; }, /rebases: entry 1: rebasedScopeSha256 is not the current scope digest/],
    ['chain gap after a rules entry', { rules: true }, f => { f.entry().originalScopeSha256 = f.product.review.scopeSha256; }, /rebases: entry 1: originalScopeSha256 does not continue the previous rebase entry/],
    ['later unlisted change', {}, f => put(f.root, PROFILE, 'export const profile = false;\n'), /rebasedScopeSha256 is not the current scope digest/],
  ];
  for (const [name, options, mutate, pattern] of variants) withBuild(options, f => {
    if (name !== 'case test file' && name !== 'runtime file') assert.equal(f.release(), '', `${name}: the fixture is valid before the variant`);
    mutate(f);
    const errors = f.release();
    assert.match(errors, /Independent review scope is stale/, name);
    assert.match(errors, pattern, name);
    const report = readJsonFile(f.root, f.product.report);
    assert.match(validateReport(f.root, f.product, report).join('\n'), /Security report scope hash is stale/, `${name}: the report check behaves alike`);
  });
});

test('[GOV-940-VAL-CHAIN-ALLOW] A legacy rules rebase followed by a scope entry forms a valid chain for the review and the report', () => withBuild({ rules: true }, f => {
  const legacy = structuredClone(readJsonFile(f.root, PRODUCT).review.rulesRebase);
  assert.equal(f.release(), '');
  assert.deepEqual(f.product.review.rulesRebase, legacy, 'the legacy rulesRebase is never rewritten');
  assert.equal(f.entry().originalScopeSha256, legacy.rebasedScopeSha256, 'the scope entry continues the legacy entry');
  const report = readJsonFile(f.root, f.product.report);
  assert.equal(report.scopeSha256, f.product.review.scopeSha256);
  assert.deepEqual(validateReport(f.root, f.product, report), []);
  // Only the reviewed digest is accepted, never an intermediate digest of the chain.
  assert.match(validateReport(f.root, f.product, { ...report, scopeSha256: legacy.rebasedScopeSha256 }).join('\n'), /Security report scope hash is stale/);
  // A rules entry in review.rebases is the same as the legacy field.
  const moved = structuredClone(f.product); delete moved.review.rulesRebase;
  moved.review.rebases.unshift({ kind: 'rules', ...legacy });
  assert.deepEqual(validateContract(f.root, moved, { phase: 'release' }), []);
}));

test('[GOV-940-VAL-MALFORMED-ERROR] A malformed rebases value yields a named error and keeps the review stale', () => withBuild({}, f => {
  const valid = structuredClone(f.entry());
  const { evidenceSha256, ...missing } = valid;
  assert.equal(typeof evidenceSha256, 'string');
  const shapes = [
    ['not an array', 'scope', /rebases: must be an array/],
    ['entry not an object', [42], /rebases: entry 1 must be an object/],
    ['null entry', [null], /rebases: entry 1 must be an object/],
    ['array entry', [[valid]], /rebases: entry 1 must be an object/],
    ['unknown kind', [{ ...valid, kind: 'runtime' }], /rebases: entry 1 has unknown kind "runtime"/],
    ['missing kind', [{ ...valid, kind: undefined }], /rebases: entry 1 has unknown kind undefined/],
    ['missing field', [missing], /rebases: entry 1 is missing evidenceSha256/],
    ['empty field', [{ ...valid, by: '' }], /rebases: entry 1 is missing by/],
  ];
  for (const [name, rebases, pattern] of shapes) {
    const contract = structuredClone(f.product); contract.review.rebases = rebases;
    let errors;
    assert.doesNotThrow(() => { errors = validateContract(f.root, contract, { phase: 'release' }).join('\n'); }, name);
    assert.match(errors, /Independent review scope is stale/, name);
    assert.match(errors, pattern, name);
  }
  // A malformed value is named even when the recorded digest is current.
  const current = structuredClone(f.product); current.review.scopeSha256 = scopeDigest(f.root, current); current.review.rebases = { kind: 'scope' };
  assert.deepEqual(validateContract(f.root, current, { phase: 'release' }), ['rebases: must be an array']);
}));

test('[GOV-940-CI-SCOPE-ALLOW] A diff adding a rules entry and a scope entry with both approving contracts in the diff passes', () => withBuild({ rules: true }, f => {
  assert.equal(f.release(), '');
  assert.equal(f.diff(), '', 'both entries are new against the reviewed base contract');
  assert.equal(f.diff(f.files, 1), '', 'only the scope entry is new against the base that already carried the rules entry');
  assert.equal(f.diff([PRODUCT], 2), '', 'a retained chain adds no diff requirement');
  assert.equal(f.diff(f.files, 0, [PRODUCT]), '', 'a contract absent at the base is checked through its approving contracts (R4 e)');
}));

test('[GOV-940-CI-SCOPE-DENY] A re-signed scope entry never hides an unlisted change and needs its approving contract in the diff', () => {
  // An unlisted change re-signed into the entry passes the file-level check, but the diff base exposes it.
  for (const file of [PROFILE_TEST, 'package.json', PROFILE]) withBuild({ rules: true }, f => {
    put(f.root, file, `export const unlisted = '${file}';\n`);
    f.resign();
    assert.equal(f.release(), '', `${file}: the re-signed entry is valid file by file`);
    const errors = f.diff([...f.files, file]);
    assert.match(errors, /tasks\/product_kickoff\.security\.json: Independent review scope is stale/, file);
    assert.match(errors, /tasks\/product_kickoff\.security\.json: rebases: files other than the listed files changed since the review/, file);
  });
  withBuild({ rules: true }, f => {
    const without = f.files.filter(file => file !== LATER);
    assert.match(f.diff(without), /rebases: entry 1: approving contract tasks\/later_kickoff\.security\.json is not part of this diff/);
    assert.match(f.diff(without, 0, [PRODUCT]), /approving contract tasks\/later_kickoff\.security\.json is not part of this diff/, 'absent at the base');
    assert.match(f.diff(f.files.filter(file => file !== GOV)), /rulesRebase: approving governance contract tasks\/gov_kickoff\.security\.json is not part of this diff/);
    const l = readJsonFile(f.root, LATER); l.review.evidenceSha256 = ZERO; saveJson(f.root, LATER, l);
    assert.match(f.diff(), /approving contract tasks\/later_kickoff\.security\.json does not validate at phase release/);
    assert.match(validateDiff(f.root, f.files, { phase: 'release' }).errors.join('\n'), /rulesRebase: the diff base is required/);
  });
  withBuild({ rules: true }, f => {
    // Base 1 already carried the rules entry; editing it in place is refused even though it still validates file by file.
    f.product.review.rulesRebase.note = 'edited after the review'; f.save();
    assert.equal(f.release(), '');
    assert.match(f.diff(f.files, 1), /rulesRebase: the entry recorded at the diff base was edited or replaced/);
  });
  withBuild({ rules: true }, f => {
    // Base 2 carried both entries; removing the scope entry or the legacy entry is refused.
    const scope = f.product.review.rebases;
    f.product.review.rebases = []; f.save();
    assert.match(f.diff(f.files, 2), /rebases: entry 1: the entry recorded at the diff base was removed/);
    const legacy = f.product.review.rulesRebase;
    delete f.product.review.rulesRebase; f.product.review.rebases = scope; f.save();
    assert.match(f.diff(f.files, 2), /rulesRebase: the entry recorded at the diff base was edited or replaced/);
    f.product.review.rulesRebase = legacy; f.save();
    assert.equal(f.diff(f.files, 2), '', 'restored chain');
  });
});

function transcript(root, receipt, writes) {
  const lines = [{ type: 'assistant', message: { content: [{ type: 'text', text: `SECURITY TASK PREFLIGHT COMPLETE - contract: ${receipt}.` }] } }];
  writes.forEach((file, i) => lines.push(
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: `w${i}`, name: 'Write', input: { file_path: join(root, file), content: 'x' } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `w${i}`, content: 'written' }] } }));
  return lines.map(line => JSON.stringify(line)).join('\n');
}
const independence = (f, writes) => governanceIndependenceErrors(f.root, f.gov, GOV, transcript(f.root, GOV, writes)).join('\n');

test('[GOV-940-HOOK-EXEMPT-ALLOW] A valid rules entry by the receipt contract exempts the approver write to the rebased contract', () => withBuild({ rules: true, scope: false }, f => {
  assert.equal(f.release(), '');
  assert.equal(independence(f, [PRODUCT, RULES_EVIDENCE, 'docs/sessions/evidence/gov/review.md']), '');
  // The same entry as a `rules` entry of review.rebases exempts alike.
  const legacy = f.product.review.rulesRebase; delete f.product.review.rulesRebase;
  f.product.review.rebases = [{ kind: 'rules', ...legacy }]; saveJson(f.root, PRODUCT, f.product);
  assert.equal(f.release(), '');
  assert.equal(independence(f, [PRODUCT, RULES_EVIDENCE]), '');
  // The exemption never covers the receipt contract's other scope files.
  assert.match(independence(f, [EXAMPLE]), /GOVERNANCE INDEPENDENCE: this session wrote scripts\/workflow-gates\/example\.mjs/);
}));

test('[GOV-940-HOOK-FORGED-DENY] A forged or invalid rules entry does not exempt a write to a governance scope file', () => {
  withBuild({ rules: true, scope: false }, f => {
    // A planted contract naming a scope file as its "evidence" exempted it before Task 940 (review note N1).
    saveJson(f.root, 'tasks/forged_kickoff.security.json', { review: { rulesRebase: { by: GOV, evidence: EXAMPLE } } });
    assert.match(independence(f, [EXAMPLE]), /GOVERNANCE INDEPENDENCE: this session wrote scripts\/workflow-gates\/example\.mjs; an implementing session cannot approve/);
    saveJson(f.root, 'tasks/forged_kickoff.security.json', { review: { rebases: [{ kind: 'rules', by: GOV, evidence: EXAMPLE, evidenceSha256: ZERO, originalScopeSha256: ZERO, rebasedScopeSha256: ZERO }] } });
    assert.match(independence(f, [EXAMPLE]), /this session wrote scripts\/workflow-gates\/example\.mjs/);
  });
  const failing = [
    ['stale evidence hash', f => put(f.root, RULES_EVIDENCE, `# Rules rebase\n\n## Changed rule files\n- \`${CI_RULE}\`\nEdited.\n`)],
    ['listed file is not a rule input', f => { put(f.root, RULES_EVIDENCE, `# Rules rebase\n\n## Changed rule files\n- \`${EXAMPLE}\`\n`); f.product.review.rulesRebase.evidenceSha256 = digest(f.root, [RULES_EVIDENCE]); saveJson(f.root, PRODUCT, f.product); }],
    ['receipt contract not reviewed', f => { const g = readJsonFile(f.root, GOV); g.stage = 'implemented'; saveJson(f.root, GOV, g); }],
  ];
  for (const [name, mutate] of failing) withBuild({ rules: true, scope: false }, f => {
    mutate(f);
    const errors = independence(f, [PRODUCT, RULES_EVIDENCE]);
    assert.match(errors, /GOVERNANCE INDEPENDENCE: this session wrote tasks\/product_kickoff\.security\.json/, name);
    assert.match(errors, /GOVERNANCE INDEPENDENCE: this session wrote docs\/sessions\/evidence\/rebase\/rules-rebase\.md/, name);
  });
});

test('[GOV-940-HOOK-SCOPE-ENTRY-DENY] A scope entry naming the receipt contract never exempts a write', () => {
  const root = baseRoot('lero-scope-entry-');
  try {
    const evidence = 'docs/sessions/evidence/rebase/scope-other.md';
    const other = reviewGovernance(root, OTHER, governanceContract(root, { task: 'tasks/other_kickoff.md', scope: [EXAMPLE, 'scripts/workflow-gates/other.mjs', 'scripts/workflow-gates/other.selftest.mjs'],
      testFile: 'scripts/workflow-gates/other.selftest.mjs', prefix: 'H', dir: 'other' }));
    put(root, EXAMPLE, 'export const gate = false;\n');
    put(root, evidence, scopeEvidence([EXAMPLE]));
    other.review.rebases = [{ kind: 'scope', by: GOV, evidence, evidenceSha256: digest(root, [evidence]), originalScopeSha256: other.review.scopeSha256, rebasedScopeSha256: scopeDigest(root, other) }];
    saveJson(root, OTHER, other);
    const gov = reviewGovernance(root, GOV, governanceContract(root, { task: 'tasks/gov_kickoff.md', scope: [EXAMPLE, 'scripts/workflow-gates/example.selftest.mjs', OTHER, evidence],
      testFile: 'scripts/workflow-gates/example.selftest.mjs', prefix: 'T', dir: 'gov' }));
    assert.deepEqual(validateContract(root, other, { phase: 'release' }), [], 'the scope entry itself is valid');
    const errors = governanceIndependenceErrors(root, gov, GOV, transcript(root, GOV, [OTHER, evidence])).join('\n');
    assert.match(errors, new RegExp(`GOVERNANCE INDEPENDENCE: this session wrote ${escape(OTHER)}`));
    assert.match(errors, new RegExp(`GOVERNANCE INDEPENDENCE: this session wrote ${escape(evidence)}`));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

#!/usr/bin/env node
// Task 944 R1 and R2 (owner D15, D16, 2026-11-03): `cli.mjs sensitivity` makes a break only in the memory of the test process,
// and a non-legacy governance report refuses a critical sensitivity record that the command did not make.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { digest, planDigest, scopeDigest, validateGovernanceReport, REQUIRED_GOVERNANCE_RULES, SENSITIVITY_LEGACY_TASKS } from './contract.mjs';
import { runSensitivity, governanceReport } from './cli.mjs';

const CONTRACT = 'tasks/gov_kickoff.security.json';
const GATE = 'scripts/workflow-gates/gate.mjs';
const TEST = 'scripts/workflow-gates/gate.selftest.mjs';
const SENS = 'docs/sessions/evidence/gov/sens';
const ARTIFACT = `${SENS}/GOV-T-GATE-DENY.txt`;
const SENSITIVITY = 'docs/sessions/evidence/gov/sensitivity.json';
// One line, so a line comment after the condition swallows the rest of the function, as in the incident (C6).
const GATE_TEXT = "export function gate(input) { if (input === 'bad') return false; return true; }\n";
const TEST_TEXT = `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gate } from './gate.mjs';
test('[GOV-T-GATE-DENY] the gate refuses bad input', () => { assert.equal(gate('bad'), false); });
test('[GOV-T-GATE-ALLOW] the gate accepts good input', () => { assert.equal(gate('good'), true); });
test('[GOV-T-CI-ERROR] synthetic ci case', () => {});
`;
const LEGACY_941 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md';

function put(root, file, text) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); }
const saveJson = (root, file, value) => put(root, file, `${JSON.stringify(value, null, 2)}\n`);
function contractFor(root, { task = 'tasks/gov_kickoff.md', specs = [] } = {}) {
  const row = (id, layer, outcome, critical, name) => ({ id, layer, outcome, boundary: 'unit', critical,
    invariant: 'Synthetic gate refuses bad input', actor: 'Synthetic Opus session', resource: 'Synthetic gate function',
    input: 'Synthetic gate input value', response: 'Synthetic gate decision', forbiddenEffects: ['Synthetic bad input accepted'],
    testFile: TEST, testName: `[${id}] ${name}` });
  return { version: 1, stage: 'implemented', implementation: { role: 'Opus' }, kind: 'governance', qaProfile: 'Q1',
    task, taskSha256: digest(root, [task]), scope: [GATE, TEST, ...specs], rules: [...REQUIRED_GOVERNANCE_RULES],
    cases: [row('GOV-T-GATE-DENY', 'hook', 'deny', true, 'the gate refuses bad input'),
      row('GOV-T-GATE-ALLOW', 'hook', 'allow', false, 'the gate accepts good input'),
      row('GOV-T-CI-ERROR', 'ci', 'error', false, 'synthetic ci case')],
    report: 'docs/sessions/evidence/gov/report.json', sensitivity: SENSITIVITY };
}
// specs: { name: { case, target, find, replace } } saved under the evidence tree and listed in the contract scope.
function withFixture(fn, { testText = TEST_TEXT, specs = {}, task } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'lero-sensitivity-'));
  try {
    for (const file of REQUIRED_GOVERNANCE_RULES) put(root, file, `Synthetic rule ${file}.\n`);
    put(root, 'tasks/gov_kickoff.md', '## Security test contract\nSynthetic governance change.\n');
    if (task) put(root, task, '## Security test contract\nSynthetic copy of a legacy kickoff.\n');
    put(root, GATE, GATE_TEXT);
    put(root, TEST, testText);
    put(root, 'scripts/workflow-gates/other.mjs', 'export const other = 1;\n');
    const paths = {};
    for (const [name, spec] of Object.entries(specs)) {
      paths[name] = spec.path || `${SENS}/${name}.break.json`;
      put(root, paths[name], typeof spec.raw === 'string' ? spec.raw : `${JSON.stringify({ version: 1, ...spec }, null, 2)}\n`);
    }
    const contract = contractFor(root, { task, specs: Object.values(paths) });
    saveJson(root, CONTRACT, contract);
    return fn({ root, contract, paths, live: () => [digest(root, [GATE]), digest(root, [TEST])] });
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const DETECTED = { case: 'GOV-T-GATE-DENY', target: GATE, find: "if (input === 'bad') return false;", replace: "if (input === 'never') return false;" };
const reportFor = (root, contract, sensitivity) => ({ version: 1, status: 'passed', contractSha256: planDigest(root, contract), scopeSha256: scopeDigest(root, contract),
  cases: contract.cases.map(c => ({ id: c.id, status: 'passed', testFile: c.testFile, testName: c.testName, ...(c.critical ? { sensitivity } : {}) })), errors: [] });
const FROM_CLI = /GOV-T-GATE-DENY: sensitivity must come from cli\.mjs sensitivity \(/;

test('[GOV-944-SENS-RUN-ALLOW] A sensitivity break exists only in the memory of the test process and yields a complete record while the live files stay unchanged', () => withFixture(({ root, paths, live }) => {
  const before = live();
  const first = runSensitivity(root, CONTRACT, paths.detected);
  assert.equal(first.error, undefined, first.error);
  assert.deepEqual(live(), before, 'the gate and its test are unchanged');
  assert.equal(first.artifact, ARTIFACT);
  assert.deepEqual(first.record, { id: 'GOV-T-GATE-DENY', testName: '[GOV-T-GATE-DENY] the gate refuses bad input', baseline: 'passed', mutant: 'failed',
    failureKind: 'assertion', restored: 'passed', method: 'in-memory', break: paths.detected, breakSha256: digest(root, [paths.detected]),
    artifact: ARTIFACT, artifactSha256: digest(root, [ARTIFACT]) });
  const artifact = readFileSync(join(root, ARTIFACT), 'utf8');
  assert.equal(artifact.split('--- TAP').length - 1, 3, 'three TAP outputs');
  for (const run of ['## baseline', '## mutant', '## restored']) assert.ok(artifact.includes(run), run);
  assert.match(artifact, /code: 'ERR_ASSERTION'/);
  const sensitivity = JSON.parse(readFileSync(join(root, SENSITIVITY), 'utf8'));
  assert.deepEqual(sensitivity, { version: 1, task: 'tasks/gov_kickoff.md', cases: [first.record] });
  // A second run with a changed spec replaces the record instead of adding one.
  put(root, paths.detected, `${JSON.stringify({ version: 1, ...DETECTED, replace: "if (input === 'other') return false;" }, null, 2)}\n`);
  const second = runSensitivity(root, CONTRACT, paths.detected);
  assert.equal(second.error, undefined, second.error);
  const replaced = JSON.parse(readFileSync(join(root, SENSITIVITY), 'utf8'));
  assert.equal(replaced.cases.length, 1);
  assert.notEqual(replaced.cases[0].breakSha256, first.record.breakSha256);
  assert.deepEqual(replaced.cases[0], second.record);
  assert.deepEqual(live(), before);
}, { specs: { detected: DETECTED } }));

test('[GOV-944-SENS-RUN-DENY] Only a break that fails the named test with an assertion produces a record; every other break or spec is refused and writes nothing', () => {
  const variants = {
    undetected: [{ ...DETECTED, find: 'return true;', replace: 'return 1 === 1;' }, /the break did not fail GOV-T-GATE-DENY with an assertion/],
    // The 2026-11-03 incident: a line comment that swallows the rest of the line is a load failure, never an assertion.
    lineComment: [{ ...DETECTED, find: "if (input === 'bad') ", replace: "if (false && input === 'bad') // planted line comment " }, /the break did not fail GOV-T-GATE-DENY with an assertion/],
    // A failed named test without ERR_ASSERTION (a TypeError) is no assertion failure.
    typeError: [{ ...DETECTED, find: 'export function gate(input) {', replace: 'export const gate = undefined;\nfunction unused(input) {' }, /the break did not fail GOV-T-GATE-DENY with an assertion \(the mutant did not fail the named test with ERR_ASSERTION\)/],
    absent: [{ ...DETECTED, find: 'no such text' }, /find occurs 0 times in scripts\/workflow-gates\/gate\.mjs, not exactly once/],
    twice: [{ ...DETECTED, find: 'input', replace: 'value' }, /find occurs 2 times in scripts\/workflow-gates\/gate\.mjs, not exactly once/],
    same: [{ ...DETECTED, replace: DETECTED.find }, /replace equals find/],
    emptyFind: [{ ...DETECTED, find: '' }, /find is empty/],
    outside: [{ ...DETECTED, target: 'scripts/workflow-gates/other.mjs', find: 'other = 1', replace: 'other = 2' }, /in neither the scope nor the inputs/],
    testFile: [{ ...DETECTED, target: TEST, find: "gate('bad'), false", replace: "gate('bad'), true" }, /is the test file of GOV-T-GATE-DENY/],
    unknown: [{ ...DETECTED, case: 'GOV-T-NO-SUCH' }, /unknown case GOV-T-NO-SUCH/],
    nonCritical: [{ ...DETECTED, case: 'GOV-T-GATE-ALLOW' }, /case GOV-T-GATE-ALLOW is not critical/],
    malformed: [{ raw: '{ "version": 1, "case": "GOV-T-GATE-DENY" }' }, /the break spec is malformed/],
    notEvidence: [{ ...DETECTED, path: 'tasks/outside.break.json' }, /is outside the evidence tree/],
  };
  withFixture(({ root, paths, live }) => {
    const before = live();
    for (const [name, [, message]] of Object.entries(variants)) {
      const result = runSensitivity(root, CONTRACT, paths[name]);
      assert.match(result.error || '', /^SENSITIVITY: /, name);
      assert.match(result.error, message, name);
      assert.equal(result.record, undefined, name);
      assert.equal(existsSync(join(root, ARTIFACT)), false, `${name}: no artifact`);
      assert.equal(existsSync(join(root, SENSITIVITY)), false, `${name}: no record`);
      assert.deepEqual(live(), before, `${name}: live digests unchanged`);
    }
    // A spec that the contract scope does not list, and a product contract.
    put(root, `${SENS}/unlisted.break.json`, `${JSON.stringify({ version: 1, ...DETECTED })}\n`);
    assert.match(runSensitivity(root, CONTRACT, `${SENS}/unlisted.break.json`).error, /^SENSITIVITY: .*is not listed in the contract scope/);
    saveJson(root, 'tasks/product_kickoff.security.json', { ...JSON.parse(readFileSync(join(root, CONTRACT), 'utf8')), kind: 'product' });
    assert.match(runSensitivity(root, 'tasks/product_kickoff.security.json', paths.undetected).error, /^SENSITIVITY: the contract is not a governance contract/);
    assert.equal(existsSync(join(root, ARTIFACT)), false);
    assert.equal(existsSync(join(root, SENSITIVITY)), false);
    assert.deepEqual(live(), before);
  }, { specs: Object.fromEntries(Object.entries(variants).map(([name, [spec]]) => [name, spec])) });
});

test('[GOV-944-SENS-LIVE-ERROR] A live file that changes during a sensitivity run, or a missing test file, ends the run with a named error and no record', () => {
  const rewriting = TEST_TEXT.replace("import { gate } from './gate.mjs';", "import { gate } from './gate.mjs';\nimport { appendFileSync } from 'node:fs';\nappendFileSync(new URL('./gate.mjs', import.meta.url), '// touched\\n');");
  withFixture(({ root, paths }) => {
    let result;
    assert.doesNotThrow(() => { result = runSensitivity(root, CONTRACT, paths.detected); });
    assert.equal(result.error, 'SENSITIVITY: a live file changed during the run');
    assert.equal(existsSync(join(root, ARTIFACT)), false);
    assert.equal(existsSync(join(root, SENSITIVITY)), false);
  }, { testText: rewriting, specs: { detected: DETECTED } });
  withFixture(({ root, paths }) => {
    rmSync(join(root, TEST));
    let result;
    assert.doesNotThrow(() => { result = runSensitivity(root, CONTRACT, paths.detected); });
    assert.match(result.error, /^SENSITIVITY: the test file scripts\/workflow-gates\/gate\.selftest\.mjs of GOV-T-GATE-DENY is missing/);
    assert.equal(existsSync(join(root, SENSITIVITY)), false);
  }, { specs: { detected: DETECTED } });
});

test('[GOV-944-VAL-RECORD-ALLOW] An in-memory record with a current break spec is accepted, and a legacy contract\'s record is validated as before', () => {
  withFixture(({ root, paths }) => {
    const { record, error } = runSensitivity(root, CONTRACT, paths.detected);
    assert.equal(error, undefined, error);
    const contract = JSON.parse(readFileSync(join(root, CONTRACT), 'utf8'));
    assert.deepEqual(validateGovernanceReport(root, contract, reportFor(root, contract, record)), []);
    const report = governanceReport(root, contract);
    assert.deepEqual(report.errors, []);
    assert.equal(report.status, 'passed');
  }, { specs: { detected: DETECTED } });
  // The exact Task 941 kickoff path: a record without method is validated as before the command existed.
  assert.ok(SENSITIVITY_LEGACY_TASKS.includes(LEGACY_941));
  withFixture(({ root, contract }) => {
    put(root, 'docs/sessions/evidence/gov/legacy.txt', 'Synthetic legacy artifact.\n');
    const legacy = { id: 'GOV-T-GATE-DENY', testName: contract.cases[0].testName, baseline: 'passed', mutant: 'failed', failureKind: 'assertion',
      restored: 'passed', artifact: 'docs/sessions/evidence/gov/legacy.txt', artifactSha256: digest(root, ['docs/sessions/evidence/gov/legacy.txt']) };
    assert.deepEqual(validateGovernanceReport(root, contract, reportFor(root, contract, legacy)), []);
  }, { task: LEGACY_941 });
});

test('[GOV-944-VAL-RECORD-DENY] A non-legacy governance report refuses a critical sensitivity record that cli.mjs sensitivity did not make', () => withFixture(({ root, paths }) => {
  const { record, error } = runSensitivity(root, CONTRACT, paths.detected);
  assert.equal(error, undefined, error);
  const contract = JSON.parse(readFileSync(join(root, CONTRACT), 'utf8'));
  put(root, 'tasks/outside.break.json', readFileSync(join(root, paths.detected), 'utf8'));
  const { method, ...withoutMethod } = record;
  assert.equal(method, 'in-memory');
  const variants = [
    ['no method', withoutMethod, /\(method is not in-memory\)/],
    ['break outside the evidence tree', { ...record, break: 'tasks/outside.break.json', breakSha256: digest(root, ['tasks/outside.break.json']) }, /\(break is not a break spec under docs\/sessions\/evidence\/\)/],
    ['stale breakSha256', { ...record, breakSha256: 'f'.repeat(64) }, /\(breakSha256 does not match the current break spec\)/],
    ['spec of another case', { ...record, break: paths.other, breakSha256: digest(root, [paths.other]) }, /\(the break spec is for case GOV-T-CI-ERROR\)/],
  ];
  for (const [name, forged, detail] of variants) {
    const errors = validateGovernanceReport(root, contract, reportFor(root, contract, forged)).join('\n');
    assert.match(errors, FROM_CLI, name);
    assert.match(errors, detail, name);
  }
  // governanceReport copies the hand-written record from the sensitivity file and fails.
  saveJson(root, SENSITIVITY, { version: 1, task: contract.task, cases: [withoutMethod] });
  const report = governanceReport(root, contract);
  assert.equal(report.status, 'failed');
  assert.match(report.errors.join('\n'), FROM_CLI);
}, { specs: { detected: DETECTED, other: { ...DETECTED, case: 'GOV-T-CI-ERROR' } } }));

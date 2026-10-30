import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runMappedTests, unitReportErrors, unitEnvironment } from './cli.mjs';

test('homepage command budget covers the measured 17m55s CI sensitivity run', () => {
  const policy = JSON.parse(readFileSync('scripts/workflow-gates/pipeline.json', 'utf8'));
  assert.ok(policy.commandTimeoutMinutes?.homepage >= 25, 'A universal ten-minute timeout truncates the existing real sensitivity suite');
});

test('actual runner applies the registered group timeout and continues after the timed-out command', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-runner-timeout-'));
  try {
    mkdirSync(join(root, 'scripts/workflow-gates'), { recursive: true });
    copyFileSync('scripts/workflow-gates/run.mjs', join(root, 'scripts/workflow-gates/run.mjs'));
    writeFileSync(join(root, 'scripts/workflow-gates/pipeline.json'), JSON.stringify({
      commandTimeoutMinutes: { fixture: 0.02 }, groups: { fixture: [['node', 'slow.mjs'], ['node', 'after.mjs']] },
    }));
    writeFileSync(join(root, 'slow.mjs'), 'setTimeout(()=>{},3500);');
    writeFileSync(join(root, 'after.mjs'), 'import{writeFileSync}from"node:fs";writeFileSync("after.txt","executed");');
    const result = spawnSync(process.execPath, [join(root, 'scripts/workflow-gates/run.mjs'), 'fixture'], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(readFileSync(join(root, 'after.txt'), 'utf8'), 'executed');
    const evidence = JSON.parse(readFileSync(join(root, 'test-results/workflow-gates/fixture/results.json'), 'utf8'));
    assert.notEqual(evidence.results[0].code, 0); assert.equal(evidence.results[1].code, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('actual gate runner continues independent checks after failure and retains the real nonzero verdict', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-runner-'));
  try {
    mkdirSync(join(root, 'scripts/workflow-gates'), { recursive: true });
    copyFileSync('scripts/workflow-gates/run.mjs', join(root, 'scripts/workflow-gates/run.mjs'));
    writeFileSync(join(root, 'scripts/workflow-gates/pipeline.json'), JSON.stringify({ groups: { fixture: [['node', 'fail.mjs'], ['node', 'after.mjs']] } }));
    writeFileSync(join(root, 'fail.mjs'), 'console.error("Synthetic guard violation");process.exitCode=7;');
    writeFileSync(join(root, 'after.mjs'), 'import{writeFileSync}from"node:fs";writeFileSync("after.txt","executed");');
    const result = spawnSync(process.execPath, [join(root, 'scripts/workflow-gates/run.mjs'), 'fixture'], { encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(readFileSync(join(root, 'after.txt'), 'utf8'), 'executed');
    const evidence = JSON.parse(readFileSync(join(root, 'test-results/workflow-gates/fixture/results.json'), 'utf8'));
    assert.equal(evidence.complete, true); assert.deepEqual(evidence.results.map(r => r.code), [7, 0]);
    assert.match(readFileSync(join(root, 'test-results/workflow-gates/fixture/1.log'), 'utf8'), /Synthetic guard violation/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('mapped test runner checks real collection output and strips credentials from unit children', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-mapped-runner-'));
  const environmentKeys = ['SUPABASE_SERVICE_ROLE_KEY', 'SECURITY_TEST_TARGET', 'SECURITY_TEST_PROJECT_REF', 'NEXT_PUBLIC_SUPABASE_URL'];
  const previous = Object.fromEntries(environmentKeys.map(key => [key, process.env[key]]));
  try {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-credential-must-not-reach-unit';
    mkdirSync(join(root, 'scripts/workflow-gates'), { recursive: true });
    const contract = { task: 'tasks/security_kickoff.md', cases: [{ id: 'SEC-PROFILE-DENY', boundary: 'unit',
      testFile: 'src/profile.test.ts', testName: '[SEC-PROFILE-DENY] B cannot read A profile' }] };
    const resultWriter = (status, external = false) => `import{writeFileSync}from'node:fs';import{join}from'node:path';
if(${external ? '!' : ''}process.env.SUPABASE_SERVICE_ROLE_KEY)process.exit(99);
if(!process.argv.includes('--boundary=${external ? 'external' : 'unit'}'))process.exit(98);
writeFileSync(process.argv[2],JSON.stringify({success:true,numTotalTests:${status === 'empty' ? 0 : 1},numPassedTests:${status === 'empty' ? 0 : 1},numFailedTests:0,numPendingTests:0,testResults:[{name:join(process.cwd(),'src/profile.test.ts'),assertionResults:${status === 'empty' ? '[]' : JSON.stringify([{ fullName: contract.cases[0].testName, status }])}}]}));`;
    const runner = join(root, 'scripts/workflow-gates/vitest-runner.mjs');
    writeFileSync(runner, resultWriter('passed'));
    assert.deepEqual(runMappedTests(root, contract), []);
    writeFileSync(runner, resultWriter('skipped'));
    assert.match(runMappedTests(root, contract).join('\n'), /skipped/);
    writeFileSync(runner, resultWriter('empty'));
    assert.match(runMappedTests(root, contract).join('\n'), /empty/);
    // This is an orchestration I/O double, not evidence of database permissions.
    contract.cases[0].boundary = 'integration';
    delete process.env.SECURITY_TEST_TARGET;
    assert.match(runMappedTests(root, contract).join('\n'), /development project identity/);
    process.env.SECURITY_TEST_TARGET = 'development'; process.env.SECURITY_TEST_PROJECT_REF = 'abcdefghijklmnopqrst';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijklmnopqrst.supabase.co';
    writeFileSync(runner, resultWriter('passed', true));
    assert.deepEqual(runMappedTests(root, contract), []);
  } finally {
    for (const key of environmentKeys) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
    rmSync(root, { recursive: true, force: true });
  }
});

test('installed runner selects the dedicated boundary configuration and rejects missing or unknown projects', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-vitest-project-'));
  try {
    mkdirSync(join(root, 'node_modules/vitest'), { recursive: true });
    copyFileSync('scripts/workflow-gates/vitest-runner.mjs', join(root, 'runner.mjs'));
    writeFileSync(join(root, 'node_modules/vitest/package.json'), JSON.stringify({ type: 'module', exports: { './node': './node.mjs' } }));
    // Inspect orchestration arguments only; this API double proves no application/database behavior.
    writeFileSync(join(root, 'node_modules/vitest/node.mjs'), `import{writeFileSync}from'node:fs';
export async function startVitest(mode,files,options,vite){writeFileSync(options.outputFile,JSON.stringify({mode,files,options,vite}));
return{state:{getFiles:()=>[],getUnhandledErrors:()=>[]},close:async()=>{}}}`);
    writeFileSync(join(root, 'vitest.config.ts'), 'export default {}');
    const output = join(root, 'observed.json');
    const run = boundary => spawnSync(process.execPath, [join(root, 'runner.mjs'), output, `--boundary=${boundary}`, 'src/profile.integration.test.ts'], { cwd: root, encoding: 'utf8', timeout: 15000 });
    assert.equal(run('unit').status, 0);
    let observed = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(observed.options.config, 'vitest.config.ts');
    assert.deepEqual(observed.files, ['src/profile.integration.test.ts']);
    assert.equal(observed.vite.envDir, false);
    assert.notEqual(run('external').status, 0, 'Missing boundary configuration cannot fall back to the unit project');
    writeFileSync(join(root, 'vitest.integration.config.ts'), 'export default {}');
    assert.equal(run('external').status, 0);
    observed = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(observed.options.config, 'vitest.integration.config.ts');
    assert.notEqual(run('unrecognized').status, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('real installed Vitest retains project setup and rejects a collected security test with no assertions', () => {
  const parent = resolve('test-results/workflow-gates'); mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, 'vitest-runtime-'));
  try {
    writeFileSync(join(root, 'vitest.config.ts'), "export default {test:{environment:'node',include:['*.test.mjs'],setupFiles:['./setup.mjs'],maxWorkers:1}}\n");
    writeFileSync(join(root, 'setup.mjs'), "globalThis.securitySetupSentinel='loaded';\n");
    writeFileSync(join(root, 'positive.test.mjs'), "import{test,expect}from'vitest';test('preserved setup',()=>{expect(globalThis.securitySetupSentinel).toBe('loaded')});\n");
    writeFileSync(join(root, 'empty.test.mjs'), "import{test}from'vitest';test('vacuous security claim',()=>{});\n");
    const runner = resolve('scripts/workflow-gates/vitest-runner.mjs');
    const run = name => spawnSync(process.execPath, [runner, join(root, 'result.json'), '--boundary=unit', name], {
      cwd: root, env: { ...process.env, TEMP: root, TMP: root }, encoding: 'utf8', timeout: 45000,
    });
    const positive = run('positive.test.mjs');
    assert.equal(positive.status, 0, positive.stderr || positive.stdout);
    const negative = run('empty.test.mjs');
    assert.notEqual(negative.status, 0, 'A collected test without any assertion must not pass the security runner');
    const evidence = JSON.parse(readFileSync(join(root, 'result.json'), 'utf8'));
    assert.equal(evidence.numFailedTests, 1);
    assert.match(JSON.stringify(evidence.testResults), /assertion/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('an empty or incomplete unit report cannot turn a no-op test command into CI success', () => {
  const report = { success: true, numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, numPendingTests: 0, testResults: [{ assertionResults: [{ status: 'passed' }] }] };
  assert.deepEqual(unitReportErrors(report), []);
  for (const invalid of [null, { success: true }, { ...report, numTotalTests: 0 }, { ...report, numFailedTests: 1 }, { ...report, testResults: [] }]) {
    assert.ok(unitReportErrors(invalid).length);
  }
});

test('unit totals and every collected status must agree; partial or skipped success is not green', () => {
  const report = { success: true, numTotalTests: 1, numPassedTests: 1, numFailedTests: 0, numPendingTests: 0,
    testResults: [{ assertionResults: [{ status: 'passed' }] }] };
  assert.deepEqual(unitReportErrors(report), []);
  for (const invalid of [
    { ...report, numTotalTests: 10 }, { ...report, numPendingTests: 1 },
    { ...report, numTotalTests: 2, numPassedTests: 2, testResults: [{ assertionResults: [{ status: 'passed' }, { status: 'failed' }] }] },
    { ...report, numTotalTests: 2, numPassedTests: 2, testResults: [{ assertionResults: [{ status: 'passed' }, { status: 'pending' }] }] },
  ]) assert.ok(unitReportErrors(invalid).length, JSON.stringify(invalid));
});

test('Windows execution keeps executable-extension discovery without forwarding private credentials', () => {
  const environment = unitEnvironment({ PATH: 'C:/synthetic/node', PATHEXT: '.EXE;.CMD', DATABASE_URL: 'synthetic-private-value' });
  assert.equal(environment.PATHEXT, '.EXE;.CMD'); assert.equal(environment.DATABASE_URL, undefined);
  if (process.platform === 'win32') {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '& node --version'], { env: unitEnvironment(process.env), encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /v\d+\.\d+\.\d+/);
  }
});

// node --test scripts/quality/load-watch.test.mjs
// A timed-out local CI step is diagnosed and handled by its cause (owner, 2026-11-10: "a tool with retries that tracks
// why the timeout happened and acts on the cause"). The locale-leak shards 3 and 4 of 2026-11-10 lost one render each
// to "page.waitForFunction: Timeout 15000ms exceeded", and nothing had recorded the machine at that moment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECK_PROCESS, MAX_RETRIES, cpuBusy, diagnose, isLauncher, killTree, processList, startWatch, strayChecks, sweepStrays, waitForCalm } from './load-watch.mjs';
import { NOT_RUN, PROCESS_KINDS, bashPath, planWorkflow, prepareCheckout, runPlan, summaryLine } from './ci-local.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TIMEOUT = 'Error: page.waitForFunction: Timeout 15000ms exceeded.';
const calmMachine = [{ cpu: 20, memFree: 60, ports: 40 }, { cpu: 30, memFree: 60, ports: 45 }];

test('diagnose: the cause of a timeout comes from what the machine was doing; anything else is no timeout', () => {
  assert.deepEqual(diagnose('AssertionError: expected 3 to be 4', calmMachine).timeout, false, 'a failed assertion is never retried');
  assert.equal(diagnose(TIMEOUT, [{ cpu: 97, memFree: 50, ports: 30 }]).cause, 'load');
  assert.equal(diagnose(TIMEOUT, [{ cpu: 20, memFree: 3, ports: 30 }]).cause, 'load', 'memory at its limit is load too');
  assert.equal(diagnose('net::ERR_NO_BUFFER_SPACE at http://127.0.0.1:6020', calmMachine).cause, 'ports');
  assert.equal(diagnose(TIMEOUT, [{ cpu: 20, memFree: 50, ports: 2500 }]).cause, 'ports');
  assert.equal(diagnose(TIMEOUT, calmMachine).cause, 'stall', 'a calm machine and still a timeout: the step itself stalled');
  assert.equal(diagnose(TIMEOUT, []).cause, 'stall', 'no sample, no load seen');
  assert.match(diagnose(TIMEOUT, calmMachine).evidence, /CPU peak 30%, free memory low 60%, ports peak 45, 2 sample\(s\)/);
  assert.equal(diagnose('job timeout-minutes 25 exceeded', calmMachine).timeout, true, 'a step past its job time is a timeout');
});

test('CPU use comes from the core counters (os.loadavg is always 0 on Windows)', () => {
  assert.equal(cpuBusy({ idle: 100, total: 200 }, { idle: 110, total: 300 }), 90);
  assert.equal(cpuBusy({ idle: 0, total: 0 }, { idle: 0, total: 0 }), 0);
});

test('waitForCalm waits until the machine has been calm long enough, however long the load lasts', () => {
  const readings = [{ cpu: 99, memFree: 50 }, { cpu: 99, memFree: 50 }, { cpu: 99, memFree: 50 }, { cpu: 10, memFree: 50 }, { cpu: 70, memFree: 50 }, { cpu: 10, memFree: 50 }, { cpu: 10, memFree: 50 }];
  let i = 0;
  const read = () => ({ ...(readings[Math.min(i++, readings.length - 1)]), counters: { idle: 0, total: 0 } });
  const r = waitForCalm({ read, sleep: () => {}, step: 5000, quietMs: 10_000, cpuMax: 60 });
  assert.equal(r.waited, 30_000, 'the calm run restarts when the load comes back');
});

function repo() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'load-watch-src-'));
  const git = (...a) => { const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main', ...a], { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); };
  git('init', '-q');
  git('commit', '-q', '--allow-empty', '-m', 'base');
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

test('runPlan: a browser step that timed out under load waits for calm, is retried and passes; the retry is named', { timeout: 60000 }, () => {
  const r = repo();
  const work = mkdtempSync(path.join(os.tmpdir(), 'load-watch-work-'));
  const dir = path.join(work, 'repo');
  const ctx = { ...prepareCheckout(r.root, dir), work, dir, token: null };
  const calls = [];
  // the first attempt times out, the second passes (a file left by the first tells them apart)
  const script = `: check:homepage-grid; if [ -e first-done ]; then echo ok; else touch first-done; echo "${TIMEOUT}"; exit 1; fi`;
  const res = runPlan(planWorkflow({ jobs: { grid: { steps: [{ run: script }] } } }, ctx), ctx, {
    ports: () => ({ ports: 10, waited: 0 }),
    watch: () => ({ stop: () => [{ cpu: 98, memFree: 40, ports: 30 }] }),
    calm: () => { calls.push('calm'); return { waited: 0 }; },
  });
  assert.equal(res[0].status, 'PASS');
  assert.deepEqual(res[0].retried, [{ step: 1, causes: ['load'] }], 'the pass is not silent: the retry and its cause are recorded');
  assert.deepEqual(calls, ['calm'], 'load: it waited for a calm machine before the retry');
  assert.equal(existsSync(path.join(work, 'logs', 'grid--01.attempt-1.log')), true, 'the failed attempt keeps its own log');
  rmSync(work, { recursive: true, force: true });
  r.done();
});

test('runPlan: a timeout on a calm machine that repeats is reproducible and fails; a non-timeout failure is never retried', { timeout: 60000 }, () => {
  const r = repo();
  const work = mkdtempSync(path.join(os.tmpdir(), 'load-watch-work-'));
  const dir = path.join(work, 'repo');
  const ctx = { ...prepareCheckout(r.root, dir), work, dir, token: null };
  const opts = { ports: () => ({ ports: 10, waited: 0 }), watch: () => ({ stop: () => calmMachine }), calm: () => assert.fail('a calm machine needs no wait') };
  const stall = runPlan(planWorkflow({ jobs: { leak: { steps: [{ run: `: check-locale-leak; echo "${TIMEOUT}"; exit 1` }] } } }, ctx), ctx, opts);
  assert.equal(stall[0].status, 'FAIL');
  assert.equal(stall[0].steps[0].attempts.length, MAX_RETRIES + 1, 'every allowed retry was made');
  assert.match(stall[0].reason, /repeated on every attempt.*reproducible/);
  const assertion = runPlan(planWorkflow({ jobs: { leak: { steps: [{ run: ': check-locale-leak; echo "AssertionError: 3 !== 4"; exit 1' }] } } }, ctx), ctx, opts);
  assert.equal(assertion[0].status, 'FAIL');
  assert.equal(assertion[0].steps[0].attempts.length, 1, 'not a timeout: one attempt only');
  assert.equal(assertion[0].retried, undefined);
  const plain = runPlan(planWorkflow({ jobs: { unit: { steps: [{ run: `echo "${TIMEOUT}"; exit 1` }] } } }, ctx), ctx, opts);
  assert.equal(plain[0].steps[0].attempts, undefined, 'a step without a browser is not watched or retried');
  rmSync(work, { recursive: true, force: true });
  r.done();
});

function workspace() {
  const r = repo();
  const work = mkdtempSync(path.join(os.tmpdir(), 'load-watch-work-'));
  const dir = path.join(work, 'repo');
  const ctx = { ...prepareCheckout(r.root, dir), work, dir, token: null };
  return { ctx, done: () => { rmSync(work, { recursive: true, force: true }); r.done(); } };
}

test('runPlan: a step without a browser whose process hangs past its deadline is restarted, and the next step keeps its time', { timeout: 60000 }, () => {
  // CodeQL's analyze stopped at query 104 of 105 after 30 min in the ci-local run of 2026-11-11 and the job failed with
  // no restart (owner: "if the process hangs, it must be restarted automatically")
  const w = workspace();
  const res = runPlan(planWorkflow({ jobs: { sast: { 'timeout-minutes': 1, steps: [
    { run: 'if [ -e first-done ]; then echo analysed; else touch first-done; sleep 4; fi' },
    { run: 'echo next' },
  ] } } }, w.ctx), w.ctx, { minuteMs: 1500, ports: () => ({ ports: 10, waited: 0 }), watch: () => ({ stop: () => calmMachine }), calm: () => assert.fail('a calm machine needs no wait') });
  assert.equal(res[0].status, 'PASS', JSON.stringify(res[0]));
  assert.equal(res[0].steps[0].attempts[0].exit, 124, 'the first attempt was stopped at its deadline');
  assert.deepEqual(res[0].retried, [{ step: 1, causes: ['stall'] }], 'the restart and its cause are recorded');
  assert.equal(res[0].steps[1].exit, 0, 'the step after the restart got its time, not the expired deadline of the first attempt');
  for (const kind of ['run', 'gitleaks', 'codeql-analyze', 'zizmor']) assert.ok(PROCESS_KINDS.has(kind), `${kind} is restarted the same way`);
  w.done();
});

test('runPlan: the first job that fails stops the run; every job after it is NOT RUN and named with the job that stopped it', { timeout: 60000 }, () => {
  // owner, 2026-11-11: "there is no point in continuing the check once something is wrong"
  const w = workspace();
  const jobs = { a: { steps: [{ run: 'true' }] }, b: { steps: [{ run: 'false' }] }, c: { steps: [{ run: 'touch c-ran' }] }, d: { needs: 'b', steps: [{ run: 'true' }] } };
  const res = runPlan(planWorkflow({ jobs }, w.ctx), w.ctx);
  assert.deepEqual(Object.fromEntries(res.map((x) => [x.job, x.status])), { a: 'PASS', b: 'FAIL', c: NOT_RUN, d: NOT_RUN });
  assert.equal(existsSync(path.join(w.ctx.dir, 'c-ran')), false, 'no step of a job after the failure ran');
  assert.match(res[2].reason, /stopped at b/);
  assert.match(summaryLine('x', res), /1 passed, 1 failed, 0 unverified, 2 not run \(stopped at b\)/);
  assert.equal(runPlan(planWorkflow({ jobs }, w.ctx), w.ctx, { failFast: false }).find((x) => x.job === 'c').status, 'PASS', 'failFast: false runs every job');
  w.done();
});

test('runPlan sweeps the checks an earlier run left at the start and before each browser job', { timeout: 60000 }, () => {
  const w = workspace();
  const order = [];
  runPlan(planWorkflow({ jobs: { unit: { steps: [{ run: 'true' }] }, grid: { steps: [{ run: ': check:homepage-grid; true' }] } } }, w.ctx), w.ctx, {
    ports: () => ({ ports: 10, waited: 0 }), watch: () => ({ stop: () => calmMachine }), sweep: () => { order.push('sweep'); return []; },
    log: (m) => { if (/^PASS\t/.test(m)) order.push(m.split('\t')[1]); },
  });
  assert.deepEqual(order, ['sweep', 'unit', 'sweep', 'grid']);
  w.done();
});

// the process table of 2026-11-11 (Get-CimInstance Win32_Process), shortened: a locale-leak shard an agent's ad hoc
// script started on 2026-11-10 hung for 19 hours beside the ci-local run of the pipeline
const NODE = '"C:\\Program Files\\nodejs\\node.exe"';
const BASH = '"C:\\Program Files\\Git\\usr\\bin\\bash.exe"';
const TABLE = [
  { pid: 35104, ppid: 1, cmd: '"C:\\Program Files\\Git\\bin\\bash.exe" -c "source /c/Users/x/snapshot-bash.sh && bash run-all-ci.sh"' },
  { pid: 24156, ppid: 35104, cmd: `${BASH} C:/Temp/scratchpad/run-all-ci.sh /c/repo C:/Temp/ci-full` },
  { pid: 18740, ppid: 24156, cmd: `${BASH} C:/Temp/scratchpad/run-all-ci.sh /c/repo C:/Temp/ci-full` },
  { pid: 17620, ppid: 18740, cmd: `${NODE} scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=1/6` },
  { pid: 1992, ppid: 17620, cmd: 'C:\\Users\\x\\ms-playwright\\chromium\\chrome.exe --headless' },
  { pid: 23200, ppid: 20436, cmd: `${BASH} C:/Temp/scratchpad/final-then-handoff.sh` },
  { pid: 12040, ppid: 23200, cmd: `${NODE} scripts/quality/pipeline.mjs run handoff` },
  { pid: 16852, ppid: 12040, cmd: `${NODE} scripts/quality/ci-local.mjs` },
  { pid: 35016, ppid: 16852, cmd: `${BASH} --noprofile --norc -eo pipefail C:\\cache\\runner-temp\\locale-leak-1-7.sh` },
  { pid: 32868, ppid: 35016, cmd: `${NODE} scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=1/6` },
  { pid: 40001, ppid: 1, cmd: `${NODE} node_modules/eslint/bin/eslint.js scripts/quality/ci-local.mjs` },
];

test('strayChecks: the check an earlier run left is stopped from the script that would start the next one; the run itself and its own checks are not', () => {
  assert.deepEqual(strayChecks(TABLE, 16852).map((p) => p.pid), [24156], 'the hung shard goes with run-all-ci.sh, which would start shard 2 next; never the shell above it');
  assert.deepEqual(strayChecks(TABLE, 32868).map((p) => p.pid), [24156], 'seen from its own check, the run and its launchers are ancestors');
  // another ci-local run is a stray as a whole, with the pipeline and the script that started it
  assert.deepEqual(strayChecks(TABLE, 99999).map((p) => p.pid).sort(), [23200, 24156]);
  assert.equal(CHECK_PROCESS.test(TABLE[10].cmd), false, 'a command that only names the file (a linter) is no check');
  assert.equal(CHECK_PROCESS.test(TABLE[0].cmd), false, 'a shell line that would start a check is no check');
  assert.equal(CHECK_PROCESS.test('node scripts/check-homepage-grid.mjs'), true);
  assert.equal(isLauncher(TABLE[0].cmd), false, 'bash -c is a shell line, not a script launcher, whatever the line names');
  for (const pid of [24156, 23200, 12040]) assert.equal(isLauncher(TABLE.find((p) => p.pid === pid).cmd), true, `${pid} runs a script or the pipeline`);
  assert.equal(isLauncher('"C:\\Program Files\\Git\\usr\\bin\\bash.exe" "/c/Program Files/nodejs/npm" run check:homepage-grid'), true);
  assert.equal(isLauncher(`${NODE} C:\\npm\\node_modules\\npm\\bin\\npm-cli.js run check:homepage-grid`), true);
  assert.equal(isLauncher(`${NODE} scripts/quality/pipeline.mjs ci-status 28`), false, 'only the pipeline run launches checks');
});

test('sweepStrays stops a real stray tree: the hung check and the script that would start the next one', { timeout: 60000 }, () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'load-watch-stray-'));
  mkdirSync(path.join(d, 'scripts'));
  writeFileSync(path.join(d, 'scripts', 'check-locale-leak.mjs'), 'setInterval(() => {}, 1000);\n');
  writeFileSync(path.join(d, 'launch.sh'), 'node scripts/check-locale-leak.mjs\ntouch second-started\nnode scripts/check-locale-leak.mjs\n');
  const child = spawn(bashPath(), ['launch.sh'], { cwd: d, stdio: 'ignore', windowsHide: true });
  child.unref(); // the test never waits for the tree it started
  const ids = new Set([child.pid]);
  const tree = () => { const all = processList(); for (let grew = true; grew;) { grew = false; for (const p of all) if (!ids.has(p.pid) && ids.has(p.ppid)) { ids.add(p.pid); grew = true; } } return all.filter((p) => ids.has(p.pid)); };
  try {
    const until = Date.now() + 20_000;
    while (!tree().some((p) => CHECK_PROCESS.test(p.cmd)) && Date.now() < until) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
    assert.ok(tree().some((p) => CHECK_PROCESS.test(p.cmd)), 'the check started');
    // the list holds this tree only, and `self` is no process of it: nothing else on the machine is touched
    const stopped = sweepStrays({ list: tree, self: -1 });
    assert.equal(stopped.length, 1, stopped.join('\n'));
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
    assert.equal(tree().filter((p) => CHECK_PROCESS.test(p.cmd)).length, 0, 'the check is gone');
    assert.equal(existsSync(path.join(d, 'second-started')), false, 'the launcher went too, so no next check started');
  } finally {
    // whatever the sweep left (a broken sweep leaves the launcher, which starts the next check) is stopped here
    for (const p of tree().reverse()) killTree(p.pid);
    rmSync(d, { recursive: true, force: true });
  }
});

test('a step stopped at its deadline returns at once, though a process it started holds its output, and that process is stopped', { timeout: 60000 }, () => {
  // spawnSync with pipes waits until every holder of the pipe exits: a hung grandchild held a step past its deadline
  const w = workspace();
  const marker = `orphan-${process.pid}-${Date.now()}`;
  const t0 = Date.now();
  const res = runPlan(planWorkflow({ jobs: { hang: { 'timeout-minutes': 1, steps: [{ run: `node -e "setInterval(() => {}, 1000)" ${marker} & wait` }] } } }, w.ctx), w.ctx, { minuteMs: 2000, retries: 0, watch: () => ({ stop: () => calmMachine }) });
  try {
    assert.equal(res[0].steps[0].exit, 124);
    assert.ok(Date.now() - t0 < 20_000, `returned ${Date.now() - t0} ms after the start, not when the grandchild ends`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    assert.deepEqual(processList().filter((p) => p.cmd.includes(marker)).map((p) => p.cmd), [], 'the process the step started is stopped');
  } finally {
    for (const p of processList().filter((x) => x.cmd.includes(marker))) killTree(p.pid);
    w.done();
  }
});

test('the sampler records CPU, memory and ports, and stops when the run that started it is gone', { timeout: 30000 }, () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'load-watch-samples-'));
  const file = path.join(d, 's.jsonl');
  process.env.LOAD_WATCH_MS = '200';
  const w = startWatch(file);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
  const samples = w.stop();
  delete process.env.LOAD_WATCH_MS;
  assert.ok(samples.length >= 2, `samples: ${samples.length}`);
  assert.ok(samples.some((s) => typeof s.cpu === 'number') && samples.every((s) => typeof s.memFree === 'number'));
  // a parent that no longer exists: the sampler exits at once and writes nothing
  const orphan = path.join(d, 'orphan.jsonl');
  const r = spawnSync(process.execPath, [path.join(HERE, 'load-watch.mjs'), orphan, '2147483646'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(r.status, 0);
  assert.equal(existsSync(orphan) ? readFileSync(orphan, 'utf8') : '', '');
  rmSync(d, { recursive: true, force: true });
});

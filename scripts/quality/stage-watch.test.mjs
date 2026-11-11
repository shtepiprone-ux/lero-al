// node --test scripts/quality/stage-watch.test.mjs
// A long local run is watched stage by stage, and silence is reported (owner, 2026-11-11: "monitor every stage and its
// status"): a break run hung for 40 minutes on 2026-11-11 and a watch of error lines only stayed silent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, stallDue } from './stage-watch.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

test('classify: every stage, failure and end the run prints is reported as such; noise is not', () => {
  const cases = [
    ['== breaks', 'stage'],
    ['caught: 67 of 67', 'stage'],
    ['[handoff] ci-local …', 'stage'],
    ['[handoff] ruleset exit 0 (1s)', 'stage'],
    ['2026-11-11T08:44:11.293Z PASS\tStorybook build', 'stage'],
    ['2026-11-11T09:00:00.000Z NOT RUN\tClick-shield', 'stage'],
    ['2026-11-11T08:10:00.000Z   codeql #4 analyze: timed out, cause stall (CPU peak 30%); restart 1 of 2', 'stage'],
    ['2026-11-11T07:40:56.537Z ci-local: checkout in C:\\cache\\repo', 'stage'],
    ['ci-local 13909bb64496: 9 passed, 0 failed, 0 unverified, 0 not run; CI-only: authz', 'stage'],
    ['2026-11-11T08:40:16.277Z FAIL\tCodeQL (SAST)', 'fail'],
    ['not ok 22 - strayChecks', 'fail'],
    ['# fail 2', 'fail'],
    ['B64 the launcher of a stray check is spared: HUNG (fail HUNG: x)', 'fail'],
    ['B9 x: NOT CAUGHT (fail 0: )', 'fail'],
    ['[handoff] ci-local exit 1 (5400s)', 'fail'],
    ['lint exit=1', 'fail'],
    ['ci-local: could not resolve the base, head and merge commits', 'fail'],
    ['handoff exit=0', 'end'],
    ['== a local check failed: no handoff', 'end'],
    ['# fail 0', null],
    ['lint exit=0', null],
    ['  codeql #3 init: exit 0', null],
    ['Starting evaluation of codeql\\javascript-queries\\Security\\CWE-830.ql.', null],
  ];
  for (const [line, kind] of cases) assert.equal(classify(line), kind, line);
});

test('stallDue: silence past the limit is reported once per silence, and again after the run grew and fell silent', () => {
  const min = 60_000;
  assert.equal(stallDue({ now: 9 * min, lastGrowth: 0, stallMs: 10 * min, lastAlert: -1 }), false, 'not yet');
  assert.equal(stallDue({ now: 10 * min, lastGrowth: 0, stallMs: 10 * min, lastAlert: -1 }), true);
  assert.equal(stallDue({ now: 25 * min, lastGrowth: 0, stallMs: 10 * min, lastAlert: 10 * min }), false, 'reported already');
  assert.equal(stallDue({ now: 40 * min, lastGrowth: 28 * min, stallMs: 10 * min, lastAlert: 10 * min }), true, 'a new silence');
});

test('a watch started while a run goes on follows its run.log at once, from the end, and moves to a newer run', { timeout: 30000 }, async () => {
  // a re-armed watch found no run.log written since it started and reported the run silent (2026-11-11)
  const d = mkdtempSync(path.join(os.tmpdir(), 'stage-watch-rearm-'));
  const out = path.join(d, 'out.txt');
  writeFileSync(out, '');
  const runDir = path.join(d, 'lero-al-ci-local', 'aaaaaaaaaaaa');
  mkdirSync(runDir, { recursive: true });
  const runLog = path.join(runDir, 'run.log');
  writeFileSync(runLog, '2026-11-11T15:00:27.510Z PASS\tOld job before the watch\n');
  const child = spawn(process.execPath, [path.join(HERE, 'stage-watch.mjs'), out, '--stall-min', '10', '--every-ms', '200'], { env: { ...process.env, CI_LOCAL_HOME: d }, windowsHide: true });
  let text = '';
  child.stdout.on('data', (b) => { text += b; });
  const until = (re) => new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = setInterval(() => { if (re.test(text)) { clearInterval(poll); resolve(); } else if (Date.now() - t0 > 15_000) { clearInterval(poll); reject(new Error(`no ${re} in:\n${text}`)); } }, 100);
  });
  try {
    await new Promise((r) => setTimeout(r, 600));
    // run.log lines carry the time they were written
    appendFileSync(runLog, `${new Date().toISOString()} PASS\tCodeQL (SAST)\n`);
    await until(/STAGE .*PASS\tCodeQL/);
    assert.doesNotMatch(text, /Old job before the watch/, 'a line from before the watch is not replayed');
    const newer = path.join(d, 'lero-al-ci-local', 'bbbbbbbbbbbb');
    mkdirSync(newer);
    writeFileSync(path.join(newer, 'run.log'), `${new Date().toISOString()} FAIL\tLocale leak (1/6)\n`);
    await until(/FAIL .*Locale leak \(1\/6\)/);
  } finally {
    child.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test('a watch re-armed with --replay-from reports the run.log lines written in the gap between two watches', { timeout: 30000 }, async () => {
  // a CodeQL FAIL written between the expiry of one watch and the start of the next was never reported (2026-11-11)
  const d = mkdtempSync(path.join(os.tmpdir(), 'stage-watch-gap-'));
  const out = path.join(d, 'out.txt');
  writeFileSync(out, '');
  const runDir = path.join(d, 'lero-al-ci-local', 'cccccccccccc');
  mkdirSync(runDir, { recursive: true });
  const gapStart = Date.parse('2026-11-11T16:10:00.000Z');
  writeFileSync(path.join(runDir, 'run.log'), [
    '2026-11-11T16:06:04.887Z PASS\tSBOM (seen by the watch before)',
    '2026-11-11T16:11:05.786Z FAIL\tCodeQL (SAST)',
    '',
  ].join('\n'));
  const child = spawn(process.execPath, [path.join(HERE, 'stage-watch.mjs'), out, '--replay-from', String(gapStart), '--every-ms', '200'], { env: { ...process.env, CI_LOCAL_HOME: d }, windowsHide: true });
  let text = '';
  child.stdout.on('data', (b) => { text += b; });
  try {
    const t0 = Date.now();
    while (!/FAIL .*CodeQL/.test(text) && Date.now() - t0 < 15_000) await new Promise((r) => setTimeout(r, 100));
    assert.match(text, /FAIL .*FAIL\tCodeQL \(SAST\)/, 'the failure in the gap is reported');
    assert.doesNotMatch(text, /SBOM/, 'a line before the gap is not repeated');
  } finally {
    child.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

test('the watch reports a stage, a failure and a silence of the run, and exits at its end', { timeout: 30000 }, async () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'stage-watch-'));
  const out = path.join(d, 'out.txt');
  writeFileSync(out, '== tests\n');
  // no ci-local run here: the cache root points at an empty directory
  const child = spawn(process.execPath, [path.join(HERE, 'stage-watch.mjs'), out, '--stall-min', '0.03', '--every-ms', '200'], { env: { ...process.env, CI_LOCAL_HOME: d }, windowsHide: true });
  let text = '';
  child.stdout.on('data', (b) => { text += b; });
  const until = (re) => new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = setInterval(() => { if (re.test(text)) { clearInterval(poll); resolve(); } else if (Date.now() - t0 > 15_000) { clearInterval(poll); reject(new Error(`no ${re} in:\n${text}`)); } }, 100);
  });
  try {
    await until(/STAGE == tests/);
    await until(/STALL no output for \d+ min; last stage: == tests/);
    appendFileSync(out, 'not ok 3 - something\n');
    await until(/FAIL not ok 3 - something/);
    appendFileSync(out, 'handoff exit=1\n');
    await until(/END handoff exit=1/);
    const code = await new Promise((resolve) => { if (child.exitCode !== null) resolve(child.exitCode); else child.on('exit', resolve); });
    assert.equal(code, 0, 'the watch ends with the run');
  } finally {
    child.kill();
    rmSync(d, { recursive: true, force: true });
  }
});

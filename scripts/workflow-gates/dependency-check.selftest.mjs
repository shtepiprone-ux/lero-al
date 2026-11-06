#!/usr/bin/env node
// Task 945: the dependency check, with the registry and the audit passed in or npm itself replaced on the PATH, so that these tests need no network
// and fail for one reason each. The mutation check found the first form alone left every line that calls npm and reads its answer untested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readRegistry } from './code-check.mjs';
import { planOf, reportLines, runMutation } from './mutation-check.mjs';

// With its main guard reversed the module runs its main on import and exits 0, and `node --test` reads an exit of 0 as a pass with no test run (C125).
// So the import happens with that exit refused, and the rejection fails this file.
const realExit = process.exit;
process.exit = code => { throw new Error(`dependency-check.mjs ran its main on import (exit ${code})`); };
const { advisoriesOf, checkDependencies, PACKAGE_NAME } = await import('./dependency-check.mjs');
const { changedFiles } = await import('./change-review.mjs');
process.exit = realExit;

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const NOW = Date.parse('2026-11-05T00:00:00Z');
const LIMITS = { minPackageAgeDays: 30, minVersionAgeDays: 7 };
const OLD = '2020-01-01T00:00:00Z';
const daysAgo = days => new Date(NOW - days * 86400000).toISOString();
const manifest = dependencies => JSON.stringify({ name: 'fixture', dependencies });
const entry = (name, version, extra = {}) => ({ [`node_modules/${name}`]: { version, resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`, integrity: 'sha512-a', ...extra } });

function repository(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-deps-'));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }));
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  for (const [file, text] of Object.entries(files)) put(file, text);
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('add', '-A');
  git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'base');
  return { root, put };
}
const never = () => { throw new Error('the registry must not be asked'); };
const clean = () => [];
const judge = (root, overrides = {}) => checkDependencies({ root, limits: LIMITS, times: never, audit: clean, now: NOW, ...overrides });

test('an unchanged package list asks the registry nothing, and a repository with no package.json has nothing to check', t => {
  const { root } = repository(t, { 'package.json': manifest({ a: '1.0.0' }) });
  assert.deepEqual(judge(root), { failures: [], notes: [] });
  const empty = repository(t, { 'a.txt': 'a' });
  assert.deepEqual(judge(empty.root), { failures: [], notes: [] });
});

test('a package list that is gone while the base holds one is refused: no list passes no check', t => {
  const { root } = repository(t, { 'package.json': manifest({ a: '1.0.0' }) });
  rmSync(join(root, 'package.json'));
  assert.deepEqual(judge(root), { failures: ['package.json: it is gone and HEAD holds one, so nothing says what this project installs'], notes: [] });
  const noGit = mkdtempSync(join(tmpdir(), 'lero-945-deps-nogit-'));
  t.after(() => rmSync(noGit, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }));
  assert.deepEqual(judge(noGit), { failures: [], notes: [] }, 'a folder that is no repository holds no base');
});

test('a name the registry does not know is refused: a model may have invented it', t => {
  const { root, put } = repository(t, { 'package.json': manifest({}) });
  put('package.json', manifest({ 'made-up-package': '1.0.0' }));
  const { failures } = judge(root, { times: name => { assert.equal(name, 'made-up-package'); return null; } });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /^package\.json: made-up-package does not exist on the registry/);
});

test('a new package must be old enough, to the day, and an old package with a new range is not new', t => {
  const { root, put } = repository(t, { 'package.json': manifest({ kept: '1.0.0' }) });
  put('package.json', manifest({ kept: '1.0.0', fresh: '1.0.0' }));
  assert.match(judge(root, { times: () => ({ created: daysAgo(29) }) }).failures[0], /fresh is 29 days old, under the 30 days/);
  assert.deepEqual(judge(root, { times: () => ({ created: daysAgo(30) }) }).failures, [], 'exactly 30 days is old enough');
  put('package.json', manifest({ kept: '2.0.0' }));
  assert.deepEqual(judge(root, { times: () => ({ created: daysAgo(1) }) }).failures, [], 'the age of the package counts only for a new name');
});

test('the version the lock file installs must exist and have circulated, whatever range package.json names', t => {
  const { root, put } = repository(t, { 'package.json': manifest({ a: '1.0.0' }), 'package-lock.json': JSON.stringify({ packages: entry('a', '1.0.0') }) });
  put('package.json', manifest({ a: '^1.0.0' }));
  put('package-lock.json', JSON.stringify({ packages: entry('a', '1.2.0') }));
  const times = at => () => ({ created: OLD, '1.2.0': at });
  assert.match(judge(root, { times: times(daysAgo(6)) }).failures[0], /a@1\.2\.0 was published 6 days ago, under the 7 days/);
  assert.deepEqual(judge(root, { times: times(daysAgo(7)) }).failures, []);
  assert.match(judge(root, { times: () => ({ created: OLD }) }).failures[0], /package-lock\.json: a@1\.2\.0 is not a version the registry has/);
});

test('a lock file may fetch only from the one registry and only with a hash, and a workspace link is neither', t => {
  const { root, put } = repository(t, { 'package.json': manifest({}) });
  put('package-lock.json', JSON.stringify({ packages: { '': { name: 'fixture' }, ...entry('a', '1.0.0', { resolved: 'https://evil.example/a.tgz' }), ...entry('b', '1.0.0', { integrity: undefined }), ...entry('c', '1.0.0'), 'node_modules/d': { link: true, resolved: 'packages/d' }, 'packages/d': { link: true }, 'node_modules/e': { version: '1.0.0' }, 'node_modules/f': { version: '1.0.0', integrity: 'sha512-a' } } }));
  const { failures } = judge(root);
  assert.equal(failures.length, 3, failures.join('\n'));
  assert.match(failures[0], /node_modules\/a is fetched from https:\/\/evil\.example\/a\.tgz/);
  assert.match(failures[1], /node_modules\/b has no integrity hash/);
  assert.equal(failures[2], 'package-lock.json: node_modules/e has neither a source nor an integrity hash, so nothing says what it installs', 'the root, a link and an entry with a hash are not this');
  const real = repository(t, { 'package.json': manifest({}), 'package-lock.json': readFileSync(join(ROOT, 'package-lock.json'), 'utf8') });
  assert.deepEqual(judge(real.root).failures, [], 'the real lock file passes');
});

test('a new serious advisory refuses, one already in the baseline is only counted, and a broken baseline does not pass', t => {
  const { root } = repository(t, { 'package.json': manifest({}), 'scripts/workflow-gates/audit-baseline.json': JSON.stringify({ advisories: [{ id: '1' }] }) });
  const audit = () => [{ id: '1', name: 'old', severity: 'high', title: 'known' }, { id: '2', name: 'next', severity: 'critical', title: 'new one' }];
  const { failures, notes } = judge(root, { audit });
  assert.deepEqual(failures, ['package-lock.json: new critical advisory 2 in next: new one']);
  assert.deepEqual(notes, ['1 known high or critical advisories remain open in scripts/workflow-gates/audit-baseline.json']);
  assert.deepEqual(judge(root, { audit: () => [] }).notes, [], 'nothing open, nothing said');
  const broken = repository(t, { 'package.json': manifest({}), 'scripts/workflow-gates/audit-baseline.json': '{ not json' });
  assert.throws(() => judge(broken.root), /JSON/);
  const none = repository(t, { 'package.json': manifest({}) });
  assert.equal(judge(none.root, { audit }).failures.length, 2, 'with no baseline every serious advisory is new');
});

test('a registry that cannot answer is no pass: the failure reaches the caller', t => {
  const { root, put } = repository(t, { 'package.json': manifest({}) });
  put('package.json', manifest({ a: '1.0.0' }));
  assert.throws(() => judge(root, { times: () => { throw new Error('npm view a could not finish: ENOTFOUND'); } }), /ENOTFOUND/);
  assert.throws(() => judge(root, { times: () => ({ created: OLD }), audit: () => { throw new Error('npm audit could not finish: ENOTFOUND'); } }), /ENOTFOUND/);
});

test('a package list the base does not hold, or holds broken, counts every package as new', t => {
  const fresh = () => ({ created: daysAgo(1) });
  const absent = repository(t, { 'a.txt': 'a' });
  absent.put('package.json', manifest({ a: '1.0.0' }));
  assert.match(judge(absent.root, { times: fresh }).failures[0], /a is 1 days old/);
  const broken = repository(t, { 'package.json': '{ not json' });
  broken.put('package.json', manifest({ a: '1.0.0' }));
  assert.match(judge(broken.root, { times: fresh }).failures[0], /a is 1 days old/);
});

// npm itself, replaced first on the PATH: the real calling code reads real exit codes and real output.
function withNpm(t, answers) {
  const dir = mkdtempSync(join(tmpdir(), 'lero-945-npm-'));
  t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }));
  writeFileSync(join(dir, 'npm.js'), `
const { appendFileSync } = require('node:fs');
const { join } = require('node:path');
const args = process.argv.slice(2);
appendFileSync(join(__dirname, 'asked.txt'), args.join(' ') + '\\n');
const answer = ${JSON.stringify(answers)}[args[0]] || {};
if (answer.out) process.stdout.write(answer.out);
if (answer.err) process.stderr.write(answer.err);
process.exitCode = answer.status || 0;
`);
  writeFileSync(join(dir, 'npm.cmd'), `@"${process.execPath}" "%~dp0npm.js" %*\r\n`);
  writeFileSync(join(dir, 'npm'), `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/npm.js" "$@"\n`, { mode: 0o755 });
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(path|claude_project_dir)$/i.test(key)));
  env.PATH = `${dir}${delimiter}${process.env.PATH ?? process.env.Path}`;
  return { env, asked: () => (existsSync(join(dir, 'asked.txt')) ? readFileSync(join(dir, 'asked.txt'), 'utf8').trim().split('\n') : []) };
}
const VIEW_OK = { out: JSON.stringify({ created: OLD }) };
const AUDIT_OK = { out: JSON.stringify({ vulnerabilities: {} }) };
function byHand(t, answers, { baseline = null } = {}) {
  const script = join(ROOT, 'scripts/workflow-gates/dependency-check.mjs');
  const { root, put } = repository(t, { 'package.json': manifest({}), 'scripts/workflow-gates/code-check.json': JSON.stringify({ dependencies: LIMITS }), ...(baseline ? { 'scripts/workflow-gates/audit-baseline.json': JSON.stringify({ advisories: baseline }) } : {}) });
  put('package.json', manifest({ a: '1.0.0' }));
  const npm = withNpm(t, answers);
  const child = spawnSync(process.execPath, [script], { cwd: tmpdir(), encoding: 'utf8', timeout: 60000, env: { ...npm.env, CLAUDE_PROJECT_DIR: root } });
  return { ...child, ...npm, root, script };
}

test('the real calls: a clean answer passes in silence, and what is asked is the time of that package and the audit of that tree', t => {
  const run = byHand(t, { view: VIEW_OK, audit: AUDIT_OK });
  assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
  assert.equal(run.stdout, '');
  assert.deepEqual(run.asked().map(line => line.trim()), ['view a time --json', 'audit --json']);
  const here = spawnSync(process.execPath, [run.script], { cwd: run.root, encoding: 'utf8', timeout: 60000, env: run.env });
  assert.equal(here.status, 0, `with no project named it checks the folder it runs in: ${here.stderr}`);
});

test('the real calls: 404 in either stream means no such package, and any other failure is no answer', t => {
  for (const answer of [{ err: 'npm error code E404\n', status: 1 }, { out: '{"error":{"summary":"404 Not Found"}}', status: 1 }]) {
    const run = byHand(t, { view: answer, audit: AUDIT_OK });
    assert.equal(run.status, 1);
    assert.match(run.stdout, /^package\.json: a does not exist on the registry/);
  }
  const lost = byHand(t, { view: { err: 'npm error ENOTFOUND registry\nsecond line\n', status: 1 }, audit: AUDIT_OK });
  assert.equal(lost.status, 1);
  assert.match(lost.stderr, /^package\.json: the dependency check could not finish: npm view a could not finish: npm error ENOTFOUND registry/);
  assert.doesNotMatch(lost.stderr, /second line/);
  assert.match(byHand(t, { view: { status: 3 }, audit: AUDIT_OK }).stderr, /npm view a could not finish: exit 3/);
  const garbled = byHand(t, { view: { out: 'not json' }, audit: AUDIT_OK });
  assert.equal(garbled.status, 1, 'an answer that cannot be read is no answer');
  assert.match(garbled.stderr, /could not finish/);
});

test('the real calls: an audit that exits 1 with a report is a report, and one with no report is no pass', t => {
  const report = { vulnerabilities: { x: { via: [{ source: 77, name: 'x', severity: 'critical', title: 'T' }] } } };
  const found = byHand(t, { view: VIEW_OK, audit: { out: JSON.stringify(report), status: 1 } });
  assert.equal(found.status, 1);
  assert.match(found.stdout, /^package-lock\.json: new critical advisory 77 in x: T/);
  const known = byHand(t, { view: VIEW_OK, audit: { out: JSON.stringify(report), status: 1 } }, { baseline: [{ id: '77' }] });
  assert.equal(known.status, 0, 'one the baseline holds only says so');
  assert.match(known.stdout, /^1 known high or critical advisories remain open/);
  for (const [answer, says] of [
    [{ out: 'not json', err: 'npm error network\nmore\n', status: 1 }, /npm audit could not finish: npm error network\s*$/],
    [{ out: 'not json', status: 9 }, /npm audit could not finish: exit 9/],
    [{ out: '{}' }, /npm audit could not finish: no result/],
    [{ out: JSON.stringify({ error: { summary: 'no endpoint' } }) }, /npm audit could not finish: no endpoint/],
    [{ out: JSON.stringify({ error: { summary: 'partial' }, vulnerabilities: {} }) }, /npm audit could not finish: partial/],
  ]) {
    const run = byHand(t, { view: VIEW_OK, audit: answer });
    assert.equal(run.status, 1, JSON.stringify(answer));
    assert.match(run.stderr, says);
  }
});

test('[GOV-945-HOOK-NAME-INJECTION-DENY] A name from the tree never runs as a command', async t => {
  const script = join(ROOT, 'scripts/workflow-gates/dependency-check.mjs');
  const tool = join(ROOT, 'scripts/workflow-gates/code-check.mjs');
  const review = join(ROOT, 'scripts/workflow-gates/change-review.mjs');
  const registry = { roots: ['package.json'], timeoutMs: { write: 30000, stop: 30000 }, tailLines: 8, dependencies: LIMITS, rows: [{ paths: ['package.json'], write: [], stop: [`"${process.execPath.replaceAll('\\', '/')}" "${script.replaceAll('\\', '/')}"`] }] };
  for (const [hostile, marker] of [['left-pad&echo ran>PWNED-NPM&rem ', 'PWNED-NPM'], ['$(touch PWNED)', 'PWNED'], ['a|echo ran>PWNED-PIPE', 'PWNED-PIPE'], ['%PATH%', null], ['a b', null], ['../x', null]]) {
    const { root, put } = repository(t, { '.gitignore': 'test-results\n', 'package.json': manifest({}), 'scripts/workflow-gates/code-check.json': JSON.stringify(registry) });
    const asked = [];
    put('package.json', manifest({ [hostile]: '1.0.0' }));
    const unit = judge(root, { times: name => { asked.push(name); return { created: OLD }; } });
    assert.deepEqual(asked, [], `no registry call for ${JSON.stringify(hostile)}`);
    assert.equal(unit.failures.length, 1);
    assert.ok(unit.failures[0].includes(JSON.stringify(hostile)) && unit.failures[0].includes('CWE-78'), unit.failures[0]);
    const npm = withNpm(t, { view: VIEW_OK, audit: AUDIT_OK });
    const hook = (name, extra = {}) => spawnSync(process.execPath, [tool], { cwd: root, encoding: 'utf8', timeout: 60000, env: { ...npm.env, CLAUDE_PROJECT_DIR: root }, input: JSON.stringify({ hook_event_name: name, session_id: 'n', cwd: root, ...extra }) });
    put('package.json', manifest({}));
    assert.equal(hook('SessionStart').status, 0);
    put('package.json', manifest({ [hostile]: '1.0.0' }));
    const stopped = hook('Stop');
    assert.equal(stopped.status, 2, stopped.stderr);
    assert.match(stopped.stderr, /CWE-78/, 'through the hook');
    const reviewed = spawnSync(process.execPath, [review, '--base=HEAD'], { cwd: tmpdir(), encoding: 'utf8', timeout: 60000, env: { ...npm.env, CLAUDE_PROJECT_DIR: root, GITHUB_STEP_SUMMARY: '' } });
    assert.equal(reviewed.status, 1, reviewed.stderr);
    assert.match(reviewed.stdout, /CWE-78/, 'through the review');
    assert.deepEqual(npm.asked(), [], 'npm never started');
    if (marker) assert.equal(existsSync(join(root, marker)), false, `${marker} stays absent`);
  }

  const { default: ts } = await import('typescript');
  const mutation = { rows: [{ paths: ['src/**/*.ts'], run: 'node run-test.mjs {file}' }] };
  const named = repository(t, { 'src/lib/plain.ts': 'export const a = 1;\n' });
  const unsafe = 'src/lib/$(touch PWNED).ts';
  named.put(unsafe, 'export const a = (b: number) => b === 1;\n');
  const started = [];
  const results = await runMutation({ root: named.root, config: mutation, files: [unsafe], deadline: Date.now() + 60000, all: true, runCommand: async text => { started.push(text); return { status: 0, output: '' }; } });
  assert.deepEqual(started, [], 'no process starts for that file');
  assert.equal(results.length, 1);
  assert.match(results[0].error, /CWE-78/);
  assert.ok(results[0].error.includes(JSON.stringify(unsafe)), results[0].error);
  assert.match(reportLines(results)[unsafe][0], /could not run: no command ran/, 'and the report says so');
  const byChange = await runMutation({ root: named.root, config: mutation, files: [unsafe], deadline: Date.now() + 60000, runCommand: async text => { started.push(text); return { status: 0, output: '' }; } });
  assert.deepEqual(started, [], 'nor when it is judged by its changed lines, which ask Git nothing about that name');
  assert.match(byChange[0].error, /CWE-78/);

  const stem = repository(t, { 'scripts/workflow-gates/a&echo x.mjs': 'export const a = 1;\n', 'scripts/workflow-gates/a&echo x.selftest.mjs': '', 'scripts/workflow-gates/plain.mjs': 'export const a = 1;\n', 'scripts/workflow-gates/plain.selftest.mjs': '' });
  const rows = { rows: [{ paths: ['scripts/workflow-gates/*.mjs'], needs: 'scripts/workflow-gates/{stem}.selftest.mjs', run: 'node --test scripts/workflow-gates/{stem}.selftest.mjs' }, { paths: ['scripts/workflow-gates/*.mjs'], run: 'node scripts/workflow-gates/selftests.mjs' }] };
  assert.deepEqual(planOf(ts, stem.root, rows, ['scripts/workflow-gates/a&echo x.mjs', 'scripts/workflow-gates/plain.mjs'], true).map(item => item.command), ['node scripts/workflow-gates/selftests.mjs', 'node --test scripts/workflow-gates/plain.selftest.mjs'], 'a stem reaches a command line only when a shell can read it only as a name');

  const real = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8'));
  const realNames = [...['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].flatMap(section => Object.keys(real[section] || {})), ...Object.keys(lock.packages).filter(path => path.includes('node_modules/')).map(path => path.slice(path.lastIndexOf('node_modules/') + 13))];
  assert.ok(realNames.length > 100, 'the real lists were read');
  assert.deepEqual(realNames.filter(name => !PACKAGE_NAME.test(name)), [], 'every real name passes');

  const wide = repository(t, { 'src/a.ts': '1\n' });
  wide.put('src/caf\u00e9.ts', '1\n');
  spawnSync('git', ['add', 'src/a.ts'], { cwd: wide.root });
  assert.deepEqual(changedFiles(wide.root, { roots: ['src'], rowsFor: () => [{}] }, 'HEAD'), ['src/caf\u00e9.ts'], 'untracked, under its own name');
  spawnSync('git', ['add', '-A'], { cwd: wide.root });
  assert.deepEqual(changedFiles(wide.root, { roots: ['src'], rowsFor: () => [{}] }, 'HEAD'), ['src/caf\u00e9.ts'], 'staged, under its own name');
  assert.ok(readRegistry(ROOT).rowsFor('src/caf\u00e9.ts').length > 0, 'and a real row holds it');
});

test('advisoriesOf: high and critical only, each once, in a fixed order, and a package that only points at another is skipped', () => {
  const report = { vulnerabilities: {
    b: { via: [{ source: 20, name: 'b', severity: 'high', title: 'B' }, { source: 3, name: 'b', severity: 'critical', title: 'B2' }, 'a'] },
    a: { via: [{ source: 20, name: 'b', severity: 'high', title: 'B' }, { source: 9, name: 'a', severity: 'moderate', title: 'A' }, { source: 8, name: 'a', severity: 'low', title: 'A' }] },
  } };
  assert.deepEqual(advisoriesOf(report).map(found => [found.id, found.severity, found.name, found.title]), [['20', 'high', 'b', 'B'], ['3', 'critical', 'b', 'B2']]);
});

test('by hand: a refusal exits 1 with the file named so the tool can tell it from a crash, and a registry that cannot be read too', t => {
  const script = join(ROOT, 'scripts/workflow-gates/dependency-check.mjs');
  const { root } = repository(t, { 'package.json': manifest({}), 'package-lock.json': JSON.stringify({ packages: entry('a', '1.0.0', { resolved: 'https://evil.example/a.tgz' }) }), 'scripts/workflow-gates/code-check.json': JSON.stringify({ dependencies: LIMITS }) });
  // npm itself is given an unreachable registry, so that this needs no network and proves what happens without one.
  const env = { ...process.env, CLAUDE_PROJECT_DIR: root, npm_config_registry: 'http://127.0.0.1:9/', npm_config_fetch_retries: '0', npm_config_fetch_timeout: '1000' };
  const child = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', timeout: 90000, env });
  assert.equal(child.status, 1, child.stdout);
  assert.match(`${child.stdout}${child.stderr}`, /package\.json: the dependency check could not finish: npm audit could not finish/);
  const unconfigured = repository(t, { 'package.json': manifest({}) });
  const missing = spawnSync(process.execPath, [script], { cwd: unconfigured.root, encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: unconfigured.root } });
  assert.equal(missing.status, 1, 'with no registry file');
  assert.match(missing.stderr, /could not finish/);
});

test('by hand: started through a link to its folder it still runs, because a guard that misses its own path would exit 0 having checked nothing', t => {
  const folder = mkdtempSync(join(tmpdir(), 'lero-945-deps-link-'));
  const link = join(folder, 'gates');
  symlinkSync(join(ROOT, 'scripts/workflow-gates'), link, 'junction');
  t.after(() => {
    // The link goes first and on its own, so that removing the folder can never reach what it points at.
    if (process.platform === 'win32') spawnSync('cmd', ['/c', 'rmdir', link]); else rmSync(link, { force: true });
    if (!existsSync(link)) rmSync(folder, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  });
  const { root } = repository(t, { 'package.json': manifest({}) });
  const child = spawnSync(process.execPath, [join(link, 'dependency-check.mjs')], { cwd: root, encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(child.status, 1, `with no registry file it says so: ${child.stdout}${child.stderr}`);
  assert.match(child.stderr, /could not finish/);
});

test('the real registry names the limits, the baseline holds only ids it can compare, and a change to it is named', () => {
  const registry = JSON.parse(readFileSync(join(ROOT, 'scripts/workflow-gates/code-check.json'), 'utf8'));
  assert.deepEqual(registry.dependencies, LIMITS);
  const { advisories } = JSON.parse(readFileSync(join(ROOT, 'scripts/workflow-gates/audit-baseline.json'), 'utf8'));
  assert.ok(advisories.length > 0);
  assert.ok(advisories.every(row => typeof row.id === 'string' && row.id && ['high', 'critical'].includes(row.severity)), 'only serious advisories');
  assert.ok(registry.secure.some(rule => rule.changed && rule.paths.includes('scripts/workflow-gates/audit-baseline.json')), 'adding to it cannot be quiet');
  assert.ok(registry.rows.some(row => row.paths.includes('package-lock.json') && row.stop.includes('node scripts/workflow-gates/dependency-check.mjs')));
  assert.ok(registry.roots.includes('package-lock.json'));
});

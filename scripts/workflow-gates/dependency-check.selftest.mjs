#!/usr/bin/env node
// Task 945: the dependency check, with the registry and the audit passed in or npm itself replaced on the PATH, so that these tests need no network
// and fail for one reason each. The mutation check found the first form alone left every line that calls npm and reads its answer untested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { advisoriesOf, checkDependencies } from './dependency-check.mjs';

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
  put('package-lock.json', JSON.stringify({ packages: { ...entry('a', '1.0.0', { resolved: 'https://evil.example/a.tgz' }), ...entry('b', '1.0.0', { integrity: undefined }), ...entry('c', '1.0.0'), 'node_modules/d': { link: true, resolved: 'packages/d' }, 'node_modules/e': { version: '1.0.0' } } }));
  const { failures } = judge(root);
  assert.equal(failures.length, 2, failures.join('\n'));
  assert.match(failures[0], /node_modules\/a is fetched from https:\/\/evil\.example\/a\.tgz/);
  assert.match(failures[1], /node_modules\/b has no integrity hash/);
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
  return { env, asked: () => readFileSync(join(dir, 'asked.txt'), 'utf8').trim().split('\n') };
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

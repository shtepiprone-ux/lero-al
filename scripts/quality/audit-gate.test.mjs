// The dependency audit gate (Task 972 Revision 3, owner decision O972-3). Every advisory at or above the level fails,
// except one that a committed owner decision accepts while its range, the package's latest version and its expiry date
// all still match; a report npm could not produce fails closed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditFindings, exceptionProblems, parseArgs } from './audit-gate.mjs';

const advisory = (id, name, severity, range) => ({
  source: 1, name, dependency: name, title: `${name} advisory`, url: `https://github.com/advisories/${id}`, severity, range,
});
const report = (...advisories) => {
  const vulnerabilities = {};
  for (const a of advisories) vulnerabilities[a.name] = { name: a.name, severity: a.severity, via: [a], effects: [], nodes: [`node_modules/${a.name}`] };
  // a package that is vulnerable only through another one carries the name, not the advisory
  if (advisories[0]) vulnerabilities.consumer = { name: 'consumer', severity: advisories[0].severity, via: [advisories[0].name], effects: [], nodes: ['node_modules/consumer'] };
  return { auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: {} } };
};
const PICO = advisory('GHSA-fc5q-39xc-vjpf', 'picomatch', 'high', '<=4.0.7');
const EXCEPTION = { advisory: 'GHSA-fc5q-39xc-vjpf', package: 'picomatch', range: '<=4.0.7', latest: '4.0.7', decision: 'O972-3', decidedOn: '2026-11-17', expires: '2026-12-17' };
const NOW = Date.parse('2026-11-17T18:00:00Z');
const latest = (versions) => (name) => versions[name] ?? null;
const run = (rep, { level = 'high', exceptions = [EXCEPTION], now = NOW, versions = { picomatch: '4.0.7' } } = {}) =>
  auditFindings(rep, exceptions, { level, now, latestOf: latest(versions) });

test('an advisory an owner decision accepts passes while its range, latest version and date match', () => {
  const r = run(report(PICO));
  assert.deepEqual(r.blocking, []);
  assert.deepEqual(r.accepted.map((a) => a.id), ['GHSA-fc5q-39xc-vjpf']);
});

test('any other advisory at or above the level blocks', () => {
  const other = advisory('GHSA-aaaa-bbbb-cccc', 'left-pad', 'critical', '<1.3.1');
  const r = run(report(PICO, other));
  assert.deepEqual(r.blocking.map((b) => b.id), ['GHSA-aaaa-bbbb-cccc']);
});

test('the level decides which severities count', () => {
  const moderate = advisory('GHSA-mmmm-mmmm-mmmm', 'mod', 'moderate', '<2.0.0');
  assert.deepEqual(run(report(moderate)).blocking, []);
  assert.deepEqual(run(report(moderate), { level: 'moderate' }).blocking.map((b) => b.id), ['GHSA-mmmm-mmmm-mmmm']);
  assert.deepEqual(run(report(advisory('GHSA-llll-llll-llll', 'low', 'low', '<1.0.0')), { level: 'low' }).blocking.length, 1);
});

test('the exception ends on its expiry date', () => {
  const r = run(report(PICO), { now: Date.parse('2026-12-17T00:00:00Z') });
  assert.equal(r.blocking.length, 1);
  assert.match(r.blocking[0].reason, /expired/);
});

test('the exception ends when the advisory range changes', () => {
  const r = run(report(advisory('GHSA-fc5q-39xc-vjpf', 'picomatch', 'high', '<4.0.8')));
  assert.equal(r.blocking.length, 1);
  assert.match(r.blocking[0].reason, /range/);
});

test('the exception ends when the package publishes a new latest version (a fix may exist)', () => {
  const r = run(report(PICO), { versions: { picomatch: '4.0.8' } });
  assert.equal(r.blocking.length, 1);
  assert.match(r.blocking[0].reason, /latest/);
  assert.match(run(report(PICO), { versions: {} }).blocking[0].reason, /latest/);
});

test('the exception names one package: the same advisory id on another package blocks', () => {
  const r = run(report(advisory('GHSA-fc5q-39xc-vjpf', 'micromatch', 'high', '<=4.0.7')));
  assert.equal(r.blocking.length, 1);
});

test('a report npm could not produce fails closed', () => {
  assert.throws(() => run({ error: { code: 'ENOAUDIT', summary: 'network' } }), /npm audit/);
  assert.throws(() => run({}), /npm audit/);
  assert.throws(() => run(null), /npm audit/);
  assert.throws(() => run({ vulnerabilities: { x: { via: [{ url: 'https://github.com/advisories/GHSA-zzzz-zzzz-zzzz', name: 'x', severity: 'severe', range: '*' }] } } }), /severity/);
});

test('an unknown level is refused', () => {
  assert.throws(() => parseArgs(['--level', 'severe']), /level/);
  assert.throws(() => parseArgs([]), /level/);
  assert.deepEqual(parseArgs(['--level', 'high', '--omit-dev']), { level: 'high', omitDev: true });
  assert.deepEqual(parseArgs(['--level', 'moderate']), { level: 'moderate', omitDev: false });
  assert.throws(() => parseArgs(['--level', 'high', '--force']), /argument/);
});

test('an exception entry must be complete, dated and owner-decided', () => {
  assert.deepEqual(exceptionProblems({ exceptions: [EXCEPTION] }), []);
  assert.equal(exceptionProblems({ exceptions: [{ ...EXCEPTION, decision: 'Opus' }] }).length, 1);
  assert.equal(exceptionProblems({ exceptions: [{ ...EXCEPTION, expires: 'soon' }] }).length, 1);
  assert.equal(exceptionProblems({ exceptions: [{ ...EXCEPTION, latest: undefined }] }).length, 1);
  assert.equal(exceptionProblems({ exceptions: [EXCEPTION, EXCEPTION] }).length, 1);
  assert.equal(exceptionProblems({}).length, 1);
});

test('the committed exceptions: valid, each with its owner decision, none open longer than 31 days past its decision', () => {
  const committed = JSON.parse(readFileSync(new URL('./audit-exceptions.json', import.meta.url), 'utf8'));
  assert.deepEqual(exceptionProblems(committed), []);
  assert.deepEqual(committed.exceptions.map((e) => `${e.advisory} ${e.decision} ${e.expires}`), ['GHSA-fc5q-39xc-vjpf O972-3 2026-12-17']);
  for (const e of committed.exceptions) assert.ok(Date.parse(e.expires) - Date.parse(e.decidedOn) <= 31 * 86400000, `${e.advisory} is accepted for more than 31 days`);
});

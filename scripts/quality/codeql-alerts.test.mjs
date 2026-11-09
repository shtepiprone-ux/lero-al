// node --test scripts/quality/codeql-alerts.test.mjs
// Task 951 AC1 (the tool written by Opus, 2026-11-09): the open code-scanning alerts of a ref, read through `gh`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatAlert, isScanRef, openAlerts, parseAlerts } from './codeql-alerts.mjs';

// A recorded response of `gh api --paginate .../code-scanning/alerts?ref=refs/pull/19/merge&state=open&per_page=100`
// (two pages, concatenated as gh prints them), trimmed to the fields the tool reads.
const PAGE_1 = JSON.stringify([
  { number: 339, state: 'open', rule: { id: 'js/identity-replacement' }, most_recent_instance: { ref: 'refs/pull/19/merge', location: { path: 'src/__tests__/eslintConfig.test.ts', start_line: 70 } } },
  { number: 207, state: 'open', rule: { id: 'js/path-injection' }, most_recent_instance: { ref: 'refs/pull/19/merge', location: { path: 'scripts/check-locale-leak.mjs', start_line: 315 } } },
]);
const PAGE_2 = JSON.stringify([
  { number: 12, state: 'dismissed', rule: { id: 'js/redos' }, most_recent_instance: { ref: 'refs/pull/19/merge', location: { path: 'x.ts', start_line: 1 } } },
]);

test('parses gh --paginate output (pages printed back to back) and keeps open alerts only', () => {
  const alerts = parseAlerts(`${PAGE_1}${PAGE_2}`);
  assert.deepEqual(alerts.map((a) => a.number), [207, 339]);
  assert.deepEqual(alerts.map(formatAlert), ['js/path-injection scripts/check-locale-leak.mjs:315', 'js/identity-replacement src/__tests__/eslintConfig.test.ts:70']);
  assert.deepEqual(parseAlerts('[]'), []);
  assert.deepEqual(parseAlerts('[][]'), []);
});

test('refuses output it cannot read instead of reporting no alerts', () => {
  for (const bad of ['', 'not json', '{"message":"Not Found"}', '[{"number":1}]']) {
    assert.throws(() => parseAlerts(bad), /cannot read/, JSON.stringify(bad));
  }
});

test('accepts only a pull-request or branch ref, so nothing else reaches the API path', () => {
  for (const ok of ['refs/pull/19/merge', 'refs/pull/7/head', 'refs/heads/main', 'refs/heads/governance/reset-2026-11-06']) assert.equal(isScanRef(ok), true, ok);
  for (const bad of ['', 'main', 'refs/pull/x/merge', 'refs/heads/../x', 'refs/heads/a b', 'refs/heads/a&state=dismissed', 'refs/pull/19/merge?x=1']) assert.equal(isScanRef(bad), false, bad);
});

test('exit codes: 0 none open, 1 open, 2 cannot read; gh is called with an argument array', () => {
  const calls = [];
  const fake = (out, status = 0) => (cmd, args) => { calls.push([cmd, ...args]); return { status, stdout: out, stderr: status ? 'HTTP 404' : '' }; };
  assert.deepEqual(openAlerts({ ref: 'refs/pull/19/merge', repo: 'o/r', run: fake('[]') }), { code: 0, lines: [] });
  assert.equal(openAlerts({ ref: 'refs/pull/19/merge', repo: 'o/r', run: fake(PAGE_1) }).code, 1);
  assert.equal(openAlerts({ ref: 'refs/pull/19/merge', repo: 'o/r', run: fake('', 1) }).code, 2);
  assert.equal(openAlerts({ ref: 'refs/pull/19/merge', repo: 'o/r', run: fake('oops') }).code, 2);
  assert.equal(openAlerts({ ref: 'main', repo: 'o/r', run: fake('[]') }).code, 2);
  assert.deepEqual(calls[0], ['gh', 'api', '--paginate', 'repos/o/r/code-scanning/alerts?ref=refs%2Fpull%2F19%2Fmerge&state=open&per_page=100']);
});

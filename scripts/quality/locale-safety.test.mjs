// Self-test of locale-safety.mjs: each rule refuses a planted bad value and passes its good twin; the repository passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, loadParser } from './locale-safety.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const parse = loadParser(root);
const ids = (messages, code = [], reviewed = [], reviewedCode = []) => check(messages, code, parse, reviewed, reviewedCode).map((f) => f.id);

test('M1-M4: each bad value is refused and its good twin passes', () => {
  const cases = [
    ['M1', 'Click <b>here</b>', 'Click here'],
    ['M1', 'Read the <link>terms</link>', 'Read the terms'],
    ['M2', 'Open javascript:alert(1)', 'Open the page'],
    ['M2', 'data:text/html,x', 'text'],
    ['M3', 'See http://example.com', 'See https://example.com'],
    ['M4', 'Hamburger (<md)', "Hamburger ('<'md)"],
    ['M4', '{count, plural, one {# item}', '{count, plural, one {# item} other {# items}}'],
  ];
  for (const [id, bad, good] of cases) {
    assert.ok(ids({ sq: { k: bad } }).includes(id), `${id} must refuse ${bad}`);
    assert.deepEqual(ids({ sq: { k: good } }), [], `${good} must pass`);
  }
});

test('M5: a placeholder that exists in one locale only is refused', () => {
  assert.deepEqual(ids({ sq: { k: '{n} njoftime' }, en: { k: '{count} notices' } }), ['M5']);
  assert.deepEqual(ids({ sq: { k: '{n} njoftime' }, en: { k: '{n} notices' } }), []);
  assert.deepEqual(ids({ sq: { k: '{n, plural, one {# x} other {# y}}' }, en: { k: '{n, plural, one {# x} other {# {m}}}' } }), ['M5']);
});

test('M6: a bypassing translation call is refused unless reviewed; a stale review is M0', () => {
  const code = [{ file: 'src/a.tsx', text: "const x = t.rich('k', { b: (c) => c })" }];
  assert.deepEqual(ids({}, code), ['M6']);
  assert.deepEqual(ids({}, code, [], [{ file: 'src/a.tsx', call: 't.rich(', why: 'test' }]), []);
  assert.deepEqual(ids({}, [{ file: 'src/a.tsx', text: '' }], [], [{ file: 'src/a.tsx', call: 't.rich(', why: 'test' }]), ['M0']);
});

test('a reviewed value passes, and a review that matches nothing is M0', () => {
  const reviewed = [{ key: 'k', rule: 'M2', why: 'test' }];
  assert.deepEqual(ids({ sq: { k: 'javascript: is refused' } }, [], reviewed), []);
  assert.deepEqual(ids({ sq: { k: 'fine' } }, [], reviewed), ['M0']);
});

test('the repository passes', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts/quality/locale-safety.mjs')], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

// node --test scripts/quality/changed-lines-coverage.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addedLines, statementLines, evaluate } from './changed-lines-coverage.mjs';

const DIFF = [
  'diff --git a/src/a.ts b/src/a.ts',
  '--- a/src/a.ts',
  '+++ b/src/a.ts',
  '@@ -1,0 +2,3 @@',
  '+x', '+y', '+z',
  '@@ -10 +12 @@',
  '+w',
  'diff --git a/src/gone.ts b/src/gone.ts',
  '+++ /dev/null',
  '@@ -1,2 +0,0 @@',
].join('\n');

const entry = (lines) => ({
  statementMap: Object.fromEntries(lines.map(([line], i) => [String(i), { start: { line }, end: { line } }])),
  s: Object.fromEntries(lines.map(([, n], i) => [String(i), n])),
});

test('added lines come from the new side of each hunk; deleted files are ignored', () => {
  const a = addedLines(DIFF);
  assert.deepEqual([...a.get('src/a.ts')], [2, 3, 4, 12]);
  assert.equal(a.has('src/gone.ts'), false);
});

test('a line is covered when any statement starting on it ran', () => {
  const m = statementLines(entry([[2, 0], [2, 3], [5, 0]]));
  assert.equal(m.get(2), true);
  assert.equal(m.get(5), false);
});

test('covered changes pass; an untested changed file and low coverage fail', () => {
  const added = new Map([['src/a.ts', new Set([2, 3, 4])], ['src/b.ts', new Set([1])], ['src/a.test.ts', new Set([1])], ['docs/x.ts', new Set([1])]]);
  const ok = evaluate(added, { 'src/a.ts': entry([[2, 1], [3, 1], [4, 0]]), 'src/b.ts': entry([[1, 1]]) }, 70);
  assert.deepEqual(ok.failures, []);
  assert.equal(ok.total, 4);
  const low = evaluate(added, { 'src/a.ts': entry([[2, 1], [3, 0], [4, 0]]), 'src/b.ts': entry([[1, 1]]) }, 80);
  assert.match(low.failures.join(), /coverage 50\.0% < 80%/);
  const none = evaluate(added, { 'src/a.ts': entry([[2, 0], [3, 0]]), 'src/b.ts': entry([[1, 1]]) }, 0);
  assert.match(none.failures.join(), /src\/a\.ts: none of 2/);
  const missing = evaluate(added, { 'src/a.ts': entry([[2, 1]]) }, 0);
  assert.match(missing.failures.join(), /src\/b\.ts: not in the coverage report/);
});

test('a line belongs to the innermost statement that contains it', () => {
  const e = {
    statementMap: { 0: { start: { line: 1 }, end: { line: 10 } }, 1: { start: { line: 4 }, end: { line: 5 } } },
    s: { 0: 1, 1: 0 },
  };
  const m = statementLines(e);
  assert.equal(m.get(2), true);
  assert.equal(m.get(4), false);
  assert.equal(m.get(5), false);
  assert.equal(m.get(11), undefined);
});

test('lines without a statement (types, comments, braces) do not count', () => {
  const r = evaluate(new Map([['src/t.ts', new Set([1, 2, 3])]]), { 'src/t.ts': entry([[2, 1]]) }, 100);
  assert.equal(r.total, 1);
  assert.deepEqual(r.failures, []);
});

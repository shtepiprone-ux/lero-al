// node --test scripts/quality/ac-tests.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kickoffAcs, hasVerdict, resolveTest, acTestFindings, isImplemented, sessionFindings } from './ac-tests.mjs';

const kickoff = (acs, review = '') => [
  '# Task 1 — x', '', '## Goal', '', '## Acceptance criteria', '', ...acs, '', '## Route', '', '1. go', '', '## Review', '', review, '',
].join('\n');
const FILES = new Set(['src/a/__tests__/gate.security.test.ts', 'scripts/quality/x.test.mjs', 'src/b/Card.stories.tsx']);

test('the tests an AC names are read from backticked paths, continuation lines included', () => {
  const acs = kickoffAcs(kickoff(['- AC1 the gate refuses — test: `src/a/__tests__/gate.security.test.ts`', '  and `x.test.mjs`.', '- AC2 `npm audit --omit=dev` exits 0']));
  assert.deepEqual(acs.map((a) => [a.id, a.tests]), [['AC1', ['src/a/__tests__/gate.security.test.ts', 'x.test.mjs']], ['AC2', []]]);
  assert.deepEqual(kickoffAcs(null), []);
});

test('a verdict in the Review section marks the task as implemented; text elsewhere does not', () => {
  assert.equal(hasVerdict(kickoff(['- AC1 x'], '**Opus — APPROVED WITH NOTES**')), true);
  assert.equal(hasVerdict(kickoff(['- AC1 x'], 'NEEDS REVISION (1 of 2)')), true);
  assert.equal(hasVerdict(kickoff(['- AC1 APPROVED by nobody yet'], '')), false);
});

test('a bare file name resolves by base name; a path resolves exactly', () => {
  assert.deepEqual(resolveTest('gate.security.test.ts', FILES), ['src/a/__tests__/gate.security.test.ts']);
  assert.deepEqual(resolveTest('src/a/gate.security.test.ts', FILES), []);
  assert.deepEqual(resolveTest('ate.security.test.ts', FILES), []);
});

test('a named test that does not exist is a finding', () => {
  const head = kickoff(['- AC1 test: `scripts/quality/missing.test.mjs`']);
  assert.deepEqual(acTestFindings({ path: 'k.md', base: head, head, files: FILES, changed: new Set() }),
    ['k.md AC1: the named test `scripts/quality/missing.test.mjs` does not exist']);
});

test('a new criterion needs its test added or changed by the same change', () => {
  const head = kickoff(['- AC1 test: `gate.security.test.ts`']);
  assert.deepEqual(acTestFindings({ path: 'k.md', base: null, head, files: FILES, changed: new Set() }),
    ['k.md AC1: the criterion is new or changed, but its test `gate.security.test.ts` is neither added nor changed']);
  assert.deepEqual(acTestFindings({ path: 'k.md', base: null, head, files: FILES, changed: new Set(['src/a/__tests__/gate.security.test.ts']) }), []);
});

test('a revised criterion needs its test changed; an unchanged criterion does not', () => {
  const base = kickoff(['- AC1 refuses anonymous — test: `gate.security.test.ts`', '- AC2 test: `x.test.mjs`']);
  const head = kickoff(['- AC1 refuses anonymous and a wrong owner — test: `gate.security.test.ts`', '- AC2 test: `x.test.mjs`']);
  assert.deepEqual(acTestFindings({ path: 'k.md', base, head, files: FILES, changed: new Set() }),
    ['k.md AC1: the criterion is new or changed, but its test `gate.security.test.ts` is neither added nor changed']);
  assert.deepEqual(acTestFindings({ path: 'k.md', base: head, head, files: FILES, changed: new Set() }), []);
});

test('a Story with a play function counts as a named test', () => {
  const head = kickoff(['- AC1 the Story `Card.stories.tsx` play function checks the label']);
  assert.deepEqual(acTestFindings({ path: 'k.md', base: null, head, files: FILES, changed: new Set(['src/b/Card.stories.tsx']) }), []);
});

test('a task counts as implemented by a verdict, or by adding one of its named tests (not by editing a shared one)', () => {
  const body = kickoff(['- AC1 test: `gate.security.test.ts`', '- AC2 test: `src/c/new.test.ts`']);
  assert.equal(isImplemented(body, FILES, new Set()), false);
  assert.equal(isImplemented(body, FILES, new Set(['src/a/__tests__/gate.security.test.ts'])), true);
  assert.equal(isImplemented(body, FILES, new Set(['src/other.test.ts'])), false);
  assert.equal(isImplemented(kickoff(['- AC1 test: `src/c/new.test.ts`'], 'APPROVED'), FILES, new Set()), true);
});

test('the executor session may not finish a started task while a named test is missing; Opus-owned tests are left to review', () => {
  const body = kickoff(['- AC1 test: `gate.security.test.ts`', '- AC2 test: `src/c/new.test.ts`', '- AC3 test: `scripts/quality/build-lints.test.mjs`']);
  const started = new Set(['src/a/__tests__/gate.security.test.ts']);
  assert.deepEqual(sessionFindings({ kickoffs: [{ path: 'k.md', body }], files: FILES, added: started }),
    ['k.md AC2: the named test `src/c/new.test.ts` does not exist yet (write it first — quality-gates.md §8)']);
  assert.deepEqual(sessionFindings({ kickoffs: [{ path: 'k.md', body }], files: FILES, added: new Set() }), [], 'a task not started is not checked');
  const done = new Set([...FILES, 'src/c/new.test.ts']);
  assert.deepEqual(sessionFindings({ kickoffs: [{ path: 'k.md', body }], files: done, added: started }), []);
});

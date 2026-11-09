// node --test scripts/quality/ac-tests.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kickoffAcs, hasVerdict, resolveTest, acTestFindings, isImplemented, sessionFindings, testsNamedElsewhere } from './ac-tests.mjs';

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

// Task 963 AC16 (found in the Task 939 review 2, 2026-11-09): PR #19's change report failed on 957, 962 and 965, open
// kickoffs with no verdict, because each names a test another task added on the branch (`cloudinary-config.test.mjs`,
// `ImageUpload.test.tsx`, `db-catalog-audit.test.mjs`, `ci-workflow.test.mjs`).
test('a test another kickoff also names is no evidence that an open task was implemented', () => {
  const open = kickoff(['- AC1 test: `gate.security.test.ts`', '- AC2 test: `src/c/new.test.ts`']);
  const owner = kickoff(['- AC1 test: `src/a/__tests__/gate.security.test.ts`'], 'APPROVED');
  const added = new Set(['src/a/__tests__/gate.security.test.ts']);
  const shared = testsNamedElsewhere('open.md', [{ path: 'open.md', body: open }, { path: 'owner.md', body: owner }], FILES);
  assert.deepEqual([...shared], ['src/a/__tests__/gate.security.test.ts']);
  assert.equal(isImplemented(open, FILES, added, shared), false);
  assert.equal(isImplemented(open, FILES, added), true, 'without the shared set the arm still counts an added test');
  assert.deepEqual(sessionFindings({ kickoffs: [{ path: 'open.md', body: open }, { path: 'owner.md', body: owner }], files: FILES, added }), [],
    'the session is not blocked for an open task whose only added test belongs to another task');
  const own = new Set([...FILES, 'src/c/new.test.ts']);
  assert.equal(isImplemented(open, own, new Set(['src/c/new.test.ts']), shared), true, 'a test only this kickoff names still counts');
});

// Task 963 AC16 (2026-11-09, the Task 951 design): Opus placed 951's AC1 test `scripts/quality/codeql-alerts.test.mjs`
// before the executor started, and the Stop hook took 951 for started and demanded every test Sonnet still has to write.
test('a test on a path only Opus may write is no evidence that the executor started a task', () => {
  const body = kickoff(['- AC1 test: `scripts/quality/x.test.mjs`', '- AC2 test: `src/c/new.test.ts`']);
  const added = new Set(['scripts/quality/x.test.mjs']);
  assert.equal(isImplemented(body, FILES, added), false);
  assert.deepEqual(sessionFindings({ kickoffs: [{ path: 'k.md', body }], files: FILES, added }), []);
  assert.equal(isImplemented(body, new Set([...FILES, 'src/c/new.test.ts']), new Set(['src/c/new.test.ts'])), true, 'the executor\'s own test still counts');
});

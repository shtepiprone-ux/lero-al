// node --test scripts/quality/change-report.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, testWeakening, lockfileProblems, dependencyChanges, untestedSourceChange } from './change-report.mjs';

test('product code changed without any test change is refused', () => {
  const src = { code: 'M', path: 'src/modules/companies/actions.ts' };
  assert.deepEqual(untestedSourceChange([src, { code: 'M', path: 'docs/backlog.md' }]), ['src/modules/companies/actions.ts']);
  assert.deepEqual(untestedSourceChange([src, { code: 'A', path: 'src/modules/companies/__tests__/actions.security.test.ts' }]), []);
  assert.deepEqual(untestedSourceChange([src, { code: 'M', path: 'src/stories/patterns/mantine/AuthSheet.stories.tsx' }]), []);
  assert.deepEqual(untestedSourceChange([src, { code: 'D', path: 'src/a.test.ts' }]), ['src/modules/companies/actions.ts']);
  assert.deepEqual(untestedSourceChange([{ code: 'M', path: 'src/a.test.ts' }, { code: 'M', path: 'src/types.d.ts' }]), []);
  assert.deepEqual(untestedSourceChange([{ code: 'D', path: 'src/old.ts' }]), []);
});

test('sensitive paths are grouped; ordinary product files are not', () => {
  const c = classify(['.claude/rules/flow.md', 'CLAUDE.md', '.github/workflows/ci.yml', 'package-lock.json', 'eslint.config.mjs',
    'next.config.ts', 'supabase/migrations/1.sql', 'scripts/quality/check-files.mjs', 'src/app/page.tsx', 'docs/backlog.md']);
  assert.deepEqual(c.get('Agent rules, skills, hooks and settings'), ['.claude/rules/flow.md', 'CLAUDE.md']);
  assert.deepEqual(c.get('CI, repository settings and quality scripts'), ['.github/workflows/ci.yml', 'scripts/quality/check-files.mjs']);
  assert.deepEqual(c.get('Dependencies and package manager'), ['package-lock.json']);
  assert.deepEqual(c.get('Database schema and policies'), ['supabase/migrations/1.sql']);
  assert.deepEqual(classify(['src/proxy.ts', 'src/middleware.ts', 'src/instrumentation.ts']).get('Security-relevant runtime configuration'),
    ['src/proxy.ts', 'src/middleware.ts', 'src/instrumentation.ts']);
  assert.deepEqual(classify(['src/a/x.security.test.ts', 'src/b/y.integration.test.ts', 'src/__tests__/security/proxyFile.test.ts', 'src/c/z.test.ts'])
    .get('Security tests (authorization, authentication, input validation)'),
  ['src/a/x.security.test.ts', 'src/b/y.integration.test.ts', 'src/__tests__/security/proxyFile.test.ts']);
  assert.equal([...c.values()].flat().includes('src/app/page.tsx'), false);
});

test('fewer cases or assertions and new skip/only/todo are flagged', () => {
  const before = "it('a', () => { expect(1).toBe(1); expect(2).toBe(2) })\ntest('b', () => { expect(3).toBe(3) })\n";
  assert.deepEqual(testWeakening(before, before), []);
  assert.deepEqual(testWeakening(before, "it('a', () => { expect(1).toBe(1) })\n"), ['test cases 2 → 1', 'assertions 3 → 1']);
  assert.deepEqual(testWeakening(before, before.replace("it('a'", "it.skip('a'")), ['skip/todo/only 0 → 1']);
  assert.deepEqual(testWeakening(before, before + "it('c', () => { expect(4).toBe(4) })\n"), []);
});

test('lockfile entries must come from the npm registry with an integrity hash', () => {
  const lock = { packages: {
    '': { name: 'app' },
    'node_modules/a': { resolved: 'https://registry.npmjs.org/a/-/a-1.0.0.tgz', integrity: 'sha512-x' },
    'node_modules/b': { resolved: 'https://evil.example/b.tgz', integrity: 'sha512-y' },
    'node_modules/c': { resolved: 'https://registry.npmjs.org/c/-/c-1.0.0.tgz' },
    'node_modules/d': { link: true, resolved: 'packages/d' },
  } };
  assert.deepEqual(lockfileProblems(lock), ['node_modules/b: resolved from https://evil.example/b.tgz', 'node_modules/c: no integrity hash']);
});

test('added and changed dependencies across every dependency field', () => {
  const base = { dependencies: { a: '^1.0.0', b: '^2.0.0' }, devDependencies: { c: '1.0.0' } };
  const head = { dependencies: { a: '^1.0.0', b: '^2.1.0', d: '^1.0.0' }, devDependencies: { c: '1.0.0', e: '3.0.0' } };
  assert.deepEqual(dependencyChanges(base, head), { added: ['d', 'e'], changed: ['b'] });
  assert.deepEqual(dependencyChanges(null, { dependencies: { x: '1' } }), { added: ['x'], changed: [] });
});

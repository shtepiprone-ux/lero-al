// Task 952 AC4. Next 16 no longer runs ESLint in `next build` (and removed the `eslint` option), so the stop on a lint error
// (Task 923 R72 (g)) is the `build` script itself: it must run `npm run lint` before `next build`, joined with `&&`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** Problems with a package.json `scripts` object: the build must lint first and stop when the lint fails. */
export function buildLintProblems(scripts) {
  const build = scripts?.build;
  if (typeof build !== 'string') return ['package.json has no build script'];
  if (/[;|]/.test(build.replace(/&&/g, ''))) return ['build joins its steps with something other than && (a failed lint would not stop it)'];
  const steps = build.split('&&').map((s) => s.trim());
  const lint = steps.indexOf('npm run lint');
  const next = steps.findIndex((s) => /^next build(\s|$)/.test(s));
  const problems = [];
  if (next === -1) problems.push('build does not run `next build`');
  if (lint === -1) problems.push('build does not run `npm run lint`');
  if (lint !== -1 && next !== -1 && lint > next) problems.push('build runs `npm run lint` after `next build`');
  if (!/^eslint(\s|$)/.test(scripts.lint ?? '')) problems.push('the lint script does not run eslint');
  return problems;
}

const pkg = () => JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('the repository: build lints first, then builds', () => {
  assert.deepEqual(buildLintProblems(pkg().scripts), []);
});

test('fails when build does not lint, lints after, or does not stop on a failed lint', () => {
  const lint = 'eslint --max-warnings 0';
  const joined = ['build joins its steps with something other than && (a failed lint would not stop it)'];
  assert.deepEqual(buildLintProblems({ build: 'next build', lint }), ['build does not run `npm run lint`']);
  assert.deepEqual(buildLintProblems({ build: 'next build && npm run lint', lint }), ['build runs `npm run lint` after `next build`']);
  assert.deepEqual(buildLintProblems({ build: 'npm run lint; next build', lint }), joined);
  assert.deepEqual(buildLintProblems({ build: 'npm run lint || next build', lint }), joined);
  assert.deepEqual(buildLintProblems({ build: 'npm run lint | next build', lint }), joined);
  assert.deepEqual(buildLintProblems({ build: 'npm run lint & next build', lint }), ['build does not run `next build`', 'build does not run `npm run lint`']);
  assert.deepEqual(buildLintProblems({ build: 'npm run lint && echo ok', lint }), ['build does not run `next build`']);
  assert.deepEqual(buildLintProblems({ build: 'npm run lint && next build', lint: 'echo skip' }), ['the lint script does not run eslint']);
  assert.deepEqual(buildLintProblems({ build: 'npm run lint && next build', lint }), []);
  assert.deepEqual(buildLintProblems({}), ['package.json has no build script']);
});

/** Task 952 F2: the Vercel build runs the same script. A Build Command typed in the dashboard could otherwise skip the lint; `vercel.json` wins over the dashboard. */
export function vercelBuildProblems(config) {
  return config?.buildCommand === 'npm run build' ? [] : ['vercel.json does not pin buildCommand to `npm run build`'];
}

test('the repository: vercel.json pins the build command that lints', () => {
  assert.deepEqual(vercelBuildProblems(JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'))), []);
});

test('fails when vercel.json names another build command or none', () => {
  const problem = ['vercel.json does not pin buildCommand to `npm run build`'];
  assert.deepEqual(vercelBuildProblems({ buildCommand: 'next build' }), problem);
  assert.deepEqual(vercelBuildProblems({ crons: [] }), problem);
  assert.deepEqual(vercelBuildProblems({ buildCommand: 'npm run build' }), []);
});

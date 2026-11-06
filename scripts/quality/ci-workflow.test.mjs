// The CI workflow gives every gate what it needs to run. The first CI run of the governance reset (PR #19,
// 2026-11-06) failed for three reasons that were not code: the hydration gate's self-test had no browser in the
// quality job, the authorization suite read a Server Action manifest that its job never built, and only changed
// kickoffs were checked. These tests keep each prerequisite in place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const ci = yaml.load(readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8'));

const runs = (job) => (ci.jobs[job].steps ?? []).map((s) => s.run ?? '');
/** Index of the first step whose command matches, or -1. */
const stepIndex = (job, re) => runs(job).findIndex((r) => re.test(r));

/** Commands that start a real browser. */
const BROWSER = /product-gates\.mjs|check:hydration|check-locale-leak|check:homepage-grid|check:click-shield|check:card-track/;

test('every job that starts a browser installs Playwright before it', () => {
  const jobs = Object.keys(ci.jobs).filter((job) => stepIndex(job, BROWSER) >= 0);
  assert.ok(jobs.includes('quality'), 'the quality job runs product-gates.mjs, which includes the hydration self-test');
  for (const job of jobs) {
    const install = stepIndex(job, /playwright install/);
    assert.ok(install >= 0 && install < stepIndex(job, BROWSER), `${job}: no "npx playwright install" before its first browser gate`);
  }
});

test('the authorization suite runs after a production build in the same job', () => {
  const jobs = Object.keys(ci.jobs).filter((job) => stepIndex(job, /test:security-integration/) >= 0);
  assert.deepEqual(jobs, ['authz']);
  const build = stepIndex('authz', /^npm run build$/m);
  assert.ok(build >= 0 && build < stepIndex('authz', /test:security-integration/), 'authz: npm run build must come before npm run test:security-integration');
});

test('CI Required waits for every other job, so a new gate cannot be left out of the merge decision', () => {
  const others = Object.keys(ci.jobs).filter((job) => job !== 'required').sort();
  assert.deepEqual([...ci.jobs.required.needs].sort(), others);
  assert.equal(ci.jobs.required.if, 'always()');
});

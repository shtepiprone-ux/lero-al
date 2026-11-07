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

test('the SBOM fails on an invalid dependency tree (Task 947)', () => {
  const sbom = runs('sbom').find((r) => r.includes('cyclonedx-npm')) ?? '';
  assert.ok(sbom.includes('--validate'));
  assert.ok(!sbom.includes('--ignore-npm-errors'), 'the SBOM step must not ignore npm errors');
});

// Owner request 2026-11-07: the OWASP Cheat Sheet Series stays in sync. The quality job reads upstream and checks the
// mapping before the self-tests and the file checks, which verify quotes against the texts the sync caches.
test('the quality job syncs and checks the OWASP reference before the tests and the file checks', () => {
  const sync = stepIndex('quality', /owasp\.mjs sync --verify/);
  const check = stepIndex('quality', /owasp\.mjs check$/m);
  assert.ok(sync >= 0, 'quality: no "owasp.mjs sync --verify" step');
  assert.ok(check > sync, 'quality: "owasp.mjs check" must follow the sync');
  assert.ok(check < stepIndex('quality', /scripts\/quality\/\*\.test\.mjs/), 'quality: the OWASP steps must precede the self-tests');
  assert.ok(check < stepIndex('quality', /check-files\.mjs --all/), 'quality: the OWASP steps must precede check-files');
  const step = ci.jobs.quality.steps.find((s) => /owasp\.mjs sync/.test(s.run ?? ''));
  assert.ok(!carriesSecret(step.env), 'the sync step needs only the read-only job token, no repository secret');
});

test('the OWASP task gate runs on every pull request and push, against the base, with no secret and no skip', () => {
  const job = ci.jobs['owasp-gate'];
  assert.ok(job, 'no owasp-gate job');
  assert.equal(job.if, undefined, 'a skipped gate would read as a pass of nothing; the step exits 0 itself on a schedule run');
  assert.ok(stepIndex('owasp-gate', /owasp\.mjs cache/) >= 0 && stepIndex('owasp-gate', /owasp\.mjs cache/) < stepIndex('owasp-gate', /owasp\.mjs gate --base "\$base"/));
  const gate = job.steps.find((s) => /owasp\.mjs gate/.test(s.run ?? ''));
  assert.match(String(gate.env.BASE_SHA), /pull_request\.base\.sha/);
  assert.ok(!/\$\{\{/.test(gate.run), 'no expression inside run: the base reaches the shell through env');
  assert.ok(!job.steps.some((s) => carriesSecret(s.env)), 'the gate reads the repository only');
  assert.ok(job.steps.some((s) => /actions\/checkout@/.test(s.uses ?? '') && s.with?.['fetch-depth'] === 0), 'the merge base needs the full history');
});

test('CI Required waits for every other job, so a new gate cannot be left out of the merge decision', () => {
  const others = Object.keys(ci.jobs).filter((job) => job !== 'required').sort();
  assert.deepEqual([...ci.jobs.required.needs].sort(), others);
  assert.equal(ci.jobs.required.if, 'always()');
});

// Audit 2026-11-06, CI-01 (OWASP CI/CD Security: least privilege for pipeline credentials). A secret bound to the
// workflow or the job reaches every step, the third-party actions and `npm ci` included. Every workflow binds a secret
// on the one step that reads it, and never on a `uses:` step, the dependency install or the browser install.
const WORKFLOWS = ['ci.yml', 'repository-settings.yml', 'scorecard.yml'].map((name) => [
  name,
  yaml.load(readFileSync(new URL(`../../.github/workflows/${name}`, import.meta.url), 'utf8')),
]);
const carriesSecret = (env) => Object.values(env ?? {}).some((v) => /\bsecrets\./.test(String(v)));
const NO_SECRET_STEP = /^(npm ci|npx playwright install\b)/;

test('no workflow or job binds a secret; a secret reaches only a step that runs project code', () => {
  for (const [name, wf] of WORKFLOWS) {
    assert.ok(!carriesSecret(wf.env), `${name}: a secret in the workflow env`);
    for (const [job, def] of Object.entries(wf.jobs)) {
      assert.ok(!carriesSecret(def.env), `${name}/${job}: a secret in the job env; bind it on the step that reads it`);
      for (const step of def.steps ?? []) {
        if (!carriesSecret(step.env)) continue;
        assert.ok(!step.uses, `${name}/${job}: a secret in the env of the third-party step ${step.uses}`);
        assert.ok(!NO_SECRET_STEP.test(String(step.run ?? '').trim()), `${name}/${job}: a secret in the env of "${step.run}"`);
      }
    }
  }
});

test('the planted case: a job-level secret is refused', () => {
  const planted = { jobs: { x: { env: { KEY: '${{ secrets.X }}' }, steps: [] } } };
  assert.ok(carriesSecret(planted.jobs.x.env));
});

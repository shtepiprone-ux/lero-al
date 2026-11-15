// node --test scripts/quality/ci-secrets.test.mjs
// The workflow checks that remain after D974-1 deleted the other workflow tests (owner, 2026-11-14), each with a planted
// case. OWASP GitHub Actions Security, CI/CD Security ("least privilege for pipeline credentials"), Secrets Management.
// - Audit finding CI-01: a secret is bound only on the step that reads it. Bound at workflow or job level, or handed to a
//   reusable workflow, every step sees it, the third-party actions, `npm ci` (package install scripts) and the browser
//   install among them.
// - Task 974 R5-2 (owner, 2026-11-14: "add the 3 cases to ci-secrets"): `CI Required` waits for every other job of
//   `ci.yml`; the `secrets` job scans base..head with the pinned, sha256-verified gitleaks, never `gitleaks-action`
//   (Task 970); `.gitleaksignore` holds exactly the fingerprints reviewed in Task 970.
// - Task 963 AC13 (owner, 2026-11-14: "add a case"): every job runs on the pinned `ubuntu-24.04` image.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// The `secrets` context anywhere inside an expression: `secrets.X`, `secrets['X']`, `toJSON(secrets)`, `a || secrets.X`.
// One quantifier over a class that excludes the closing brace, no alternation: linear in the length of the text.
const SECRET = /\$\{\{[^}]*\bsecrets\b/;
const has = (value) => SECRET.test(JSON.stringify(value ?? {}));
const INSTALL = /\bnpm (ci|install|i)\b|playwright install/;
const ci = yaml.load(readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'));

/** Every place a secret reaches more than the step that reads it. */
export function secretScopeProblems(workflow, file = 'workflow') {
  const out = [];
  if (has(workflow.env)) out.push(`${file}: a secret in the workflow-level env`);
  for (const [id, job] of Object.entries(workflow.jobs ?? {})) {
    if (has(job.env)) out.push(`${file} ${id}: a secret in the job-level env`);
    // a reusable workflow gets the secrets of `secrets:` (all of them with `inherit`) for every job and step it runs
    if (job.secrets !== undefined) out.push(`${file} ${id}: secrets handed to the reusable workflow ${job.uses ?? '(no uses)'}`);
    (job.steps ?? []).forEach((step, i) => {
      const name = `${file} ${id} step ${i + 1}`;
      if (step.uses && (has(step.env) || has(step.with)) && !String(step.uses).startsWith('./')) {
        // GITHUB_TOKEN through `github.token` is not a repository secret; only `secrets.*` is refused
        out.push(`${name}: a secret given to the third-party action ${step.uses}`);
      }
      if (step.run && INSTALL.test(step.run) && has(step.env)) out.push(`${name}: a secret on an install step`);
    });
  }
  return out;
}

/** Why `CI Required` would let a merge through without every gate; empty when it holds. The `main` ruleset requires
 *  only this check (scripts/quality/main-ruleset.json), so a job it does not wait for never blocks a merge. */
export function requiredProblems(workflow) {
  const jobs = workflow?.jobs ?? {};
  const required = jobs.required;
  if (!required) return ['no `required` job (CI Required)'];
  const out = [];
  const needs = [required.needs ?? []].flat();
  for (const id of Object.keys(jobs)) if (id !== 'required' && !needs.includes(id)) out.push(`CI Required does not wait for the job ${id}`);
  for (const id of needs) if (!(id in jobs)) out.push(`CI Required needs ${id}, which is no job`);
  if (required.name !== 'CI Required') out.push('the job is named "CI Required", the check the ruleset requires');
  // without always() the job is skipped when a gate fails, and a skipped required check is not a failed one
  if (required.if !== 'always()') out.push('CI Required runs with if: always(), so a failed gate fails it instead of skipping it');
  const check = (required.steps ?? []).find((s) => /needs\.\*\.result/.test(JSON.stringify(s.env ?? {})));
  if (!check || !/!= "success"/.test(String(check.run)) || !/exit 1/.test(String(check.run))) {
    out.push('a step reads needs.*.result and exits 1 on any result but success');
  }
  return out;
}

/** Why the `secrets` job would leave commits unscanned or run an unverified scanner (Task 970); empty when it holds. */
export function secretScanProblems(job) {
  const out = [];
  const steps = job?.steps ?? [];
  if (steps.some((s) => /\bgitleaks-action@/.test(String(s.uses ?? '')))) out.push('gitleaks-action scans one API page (30 commits) of a pull request (Task 970)');
  if (!steps.some((s) => /^actions\/checkout@/.test(String(s.uses ?? '')) && s.with?.['fetch-depth'] === 0)) out.push('the checkout fetches the whole history (fetch-depth: 0)');
  const scan = steps.find((s) => /gitleaks"? git /.test(String(s.run ?? '')));
  if (!scan) return [...out, 'no step runs the pinned gitleaks binary (gitleaks git)'];
  const env = scan.env ?? {};
  const run = String(scan.run);
  const at = (text) => run.indexOf(text);
  const scanAt = run.search(/gitleaks"? git /);
  if (!/^\d+\.\d+\.\d+$/.test(String(env.GITLEAKS_VERSION ?? ''))) out.push('the gitleaks version is pinned (env GITLEAKS_VERSION)');
  if (!/^[0-9a-f]{64}$/.test(String(env.GITLEAKS_SHA256 ?? ''))) out.push('the release sha256 is pinned (env GITLEAKS_SHA256)');
  const sum = run.split('\n').find((line) => line.includes('sha256sum --check'));
  if (!/^set -e/m.test(run) || !sum?.includes('${GITLEAKS_SHA256}') || at('sha256sum --check') > at('tar -x') || at('tar -x') < 0) {
    out.push('under set -e the download is checked against GITLEAKS_SHA256 (sha256sum --check) before tar unpacks it');
  }
  if (at('[ -e .gitleaks.toml ]') < 0 || at('[ -e .gitleaks.toml ]') > scanAt) out.push('a .gitleaks.toml in the tree stops the step before the scan (it would replace the rules)');
  if (!/github\.event\.pull_request\.base\.sha/.test(String(env.BASE_SHA)) || !/github\.event\.before/.test(String(env.BASE_SHA))) {
    out.push('the base is the pull request base, else the push\'s previous head (env BASE_SHA)');
  }
  if (!/github\.event\.pull_request\.head\.sha/.test(String(env.HEAD_SHA))) out.push('the head of a pull request is its own head commit (env HEAD_SHA)');
  if (!run.includes('${BASE_SHA}..${HEAD_SHA}') || !run.includes('--log-opts="${range}"')) out.push('a pull request or a push is scanned base..head (--log-opts "${range}")');
  if (run.includes('${{')) out.push('event values reach the shell only through env');
  return out;
}

// Each fingerprint was read and judged no secret in Task 970 (its kickoff "Goal"; the same six as
// `main:scripts/quality/ci-workflow.test.mjs:145-150`); a new entry changes this list, so it is reviewed before it can
// hide anything.
const REVIEWED_FINGERPRINTS = [
  'b1c7b41479675d9a1737b19d216d8ac55f770cf4:scripts/lib/__tests__/redact-log.test.ts:generic-api-key:17',
  'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2:docs/sessions/evidence/task927/review-11/rv11-07-authorize-probe.txt:generic-api-key:14',
  'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2:docs/sessions/evidence/task927/design/sources/gis-js-reference.html:gcp-api-key:4375',
  'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2:docs/sessions/evidence/task927/review-8/g-branding-guidelines.html:gcp-api-key:4400',
  '0295d7f10d3165b4947de99a3fea14e33b099bf8:docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/assets/iframe-BWqC60Cj.js:generic-api-key:1034',
  '1cb0ba80cce1a2cff555492fad86a872b16751bb:tasks/kickoff_prompt_Task_646_Homepage_Inline_Chrome_Mantine.md:generic-api-key:161',
];

/** The entries of `.gitleaksignore` that are not a reviewed fingerprint, and the reviewed ones it lacks. */
export function gitleaksIgnoreProblems(text) {
  const entries = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  return [
    ...entries.filter((e) => !REVIEWED_FINGERPRINTS.includes(e)).map((e) => `not reviewed in Task 970: ${e}`),
    ...REVIEWED_FINGERPRINTS.filter((f) => !entries.includes(f)).map((f) => `reviewed in Task 970 but missing: ${f}`),
  ];
}

// Task 963 AC13 (owner, 2026-11-08: "pin ubuntu-24.04"; restored here on 2026-11-14 after D974-1 deleted the workflow
// test that pinned it): `ubuntu-latest` moved to ubuntu-26.04, where Playwright could not install Chromium, so every browser job
// failed before its first check (run 42465743137). A job that calls a reusable workflow names no runner of its own.
const RUNNER = 'ubuntu-24.04';

/** Every job of a workflow whose runner is not the pinned image. */
export function runnerProblems(workflow, file = 'workflow') {
  return Object.entries(workflow.jobs ?? {})
    .filter(([, job]) => !(job.uses && job['runs-on'] === undefined))
    .flatMap(([id, job]) => [job['runs-on']].flat().filter((label) => label !== RUNNER)
      .map((label) => `${file} ${id}: runs-on ${label} (the pinned image is ${RUNNER})`));
}

test('every job of every workflow runs on the pinned ubuntu-24.04 image (Task 963 AC13)', () => {
  const dir = path.join(ROOT, '.github', 'workflows');
  const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
  assert.ok(files.length >= 3, 'the workflows directory was read');
  assert.deepEqual(files.flatMap((f) => runnerProblems(yaml.load(readFileSync(path.join(dir, f), 'utf8')), f)), []);
});

test('planted: a job on ubuntu-latest, on a list holding it, or with no runner is refused; a reusable-workflow call passes', () => {
  assert.equal(runnerProblems({ jobs: { a: { 'runs-on': 'ubuntu-latest', steps: [] } } }).length, 1);
  assert.equal(runnerProblems({ jobs: { a: { 'runs-on': ['ubuntu-latest'], steps: [] } } }).length, 1);
  assert.equal(runnerProblems({ jobs: { a: { steps: [] } } }).length, 1);
  assert.deepEqual(runnerProblems({ jobs: { a: { 'runs-on': RUNNER, steps: [] }, b: { uses: './.github/workflows/x.yml' } } }), []);
});

test('every workflow binds its secrets on the steps that read them only', () => {
  const dir = path.join(ROOT, '.github', 'workflows');
  const problems = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))
    .flatMap((f) => secretScopeProblems(yaml.load(readFileSync(path.join(dir, f), 'utf8')), f));
  assert.deepEqual(problems, []);
});

test('a planted workflow-level, job-level, action and install secret is each refused; a step secret passes', () => {
  const s = '${{ secrets.SECURITY_CI_SUPABASE_SERVICE_ROLE_KEY }}';
  const step = { run: 'npm run build', env: { KEY: s } };
  assert.deepEqual(secretScopeProblems({ jobs: { a: { steps: [step] } } }), []);
  assert.equal(secretScopeProblems({ env: { KEY: s }, jobs: {} }).length, 1);
  assert.equal(secretScopeProblems({ jobs: { a: { env: { KEY: s }, steps: [] } } }).length, 1);
  assert.equal(secretScopeProblems({ jobs: { a: { steps: [{ uses: 'actions/x@abc', with: { token: s } }] } } }).length, 1);
  assert.equal(secretScopeProblems({ jobs: { a: { steps: [{ run: 'npm ci', env: { KEY: s } }] } } }).length, 1);
  assert.equal(secretScopeProblems({ jobs: { a: { steps: [{ run: 'npx playwright install chromium', env: { KEY: s } }] } } }).length, 1);
});

test('a secret in any expression form, or handed to a reusable workflow, is refused (R5-3)', () => {
  const forms = ["${{ secrets['SECURITY_CI_KEY'] }}", '${{ secrets["SECURITY_CI_KEY"] }}', '${{ toJSON(secrets) }}',
    '${{ github.token || secrets.SECURITY_CI_KEY }}', '${{secrets.SECURITY_CI_KEY}}'];
  for (const s of forms) {
    assert.equal(secretScopeProblems({ jobs: { a: { env: { KEY: s }, steps: [] } } }).length, 1, `job env: ${s}`);
    assert.equal(secretScopeProblems({ env: { KEY: s }, jobs: {} }).length, 1, `workflow env: ${s}`);
    assert.equal(secretScopeProblems({ jobs: { a: { steps: [{ uses: 'actions/x@abc', with: { token: s } }] } } }).length, 1, `action: ${s}`);
  }
  assert.equal(secretScopeProblems({ jobs: { a: { uses: 'org/repo/.github/workflows/x.yml@abc', secrets: 'inherit' } } }).length, 1, 'secrets: inherit');
  assert.equal(secretScopeProblems({ jobs: { a: { uses: './.github/workflows/x.yml', secrets: { KEY: '${{ secrets.X }}' } } } }).length, 1, 'secrets: map');
  // the token of the job and a word in a script are not a repository secret
  assert.deepEqual(secretScopeProblems({ jobs: { a: { env: { T: '${{ github.token }}' }, steps: [{ run: 'echo "no secrets here"' }] } } }), []);
});

test('CI Required waits for every other job of ci.yml and fails when one did not succeed (R5-2)', () => {
  assert.deepEqual(requiredProblems(ci), []);
});

test('planted: a job left out of CI Required, an unknown need, no always() and no result check are each refused', () => {
  const copy = () => structuredClone(ci);
  let wf = copy();
  wf.jobs.required.needs = wf.jobs.required.needs.filter((j) => j !== 'secrets');
  assert.deepEqual(requiredProblems(wf), ['CI Required does not wait for the job secrets']);
  wf = copy();
  wf.jobs.newgate = { 'runs-on': 'ubuntu-24.04', steps: [{ run: 'true' }] };
  assert.deepEqual(requiredProblems(wf), ['CI Required does not wait for the job newgate']);
  wf = copy();
  wf.jobs.required.needs = [...wf.jobs.required.needs, 'gone'];
  assert.deepEqual(requiredProblems(wf), ['CI Required needs gone, which is no job']);
  wf = copy();
  delete wf.jobs.required.if;
  assert.equal(requiredProblems(wf).length, 1, 'without if: always() a failed gate skips CI Required');
  wf = copy();
  wf.jobs.required.steps = wf.jobs.required.steps.filter((s) => !s.run);
  assert.equal(requiredProblems(wf).length, 1, 'without the result check CI Required passes whatever the gates did');
  wf = copy();
  delete wf.jobs.required;
  assert.equal(requiredProblems(wf).length, 1, 'no CI Required job');
});

test('the secrets job scans base..head with the pinned, sha256-verified gitleaks, no gitleaks-action (R5-2, Task 970)', () => {
  assert.deepEqual(secretScanProblems(ci.jobs.secrets), []);
});

test('planted: gitleaks-action, a binary without its sha256, a scan without the base range are each refused', () => {
  const copy = () => structuredClone(ci.jobs.secrets);
  const scan = (job) => job.steps.find((s) => /gitleaks"? git /.test(s.run ?? ''));
  // PR #19's job: the action took a pull request's range from one page (30 commits) of the commits API
  const action = { permissions: { contents: 'read' }, steps: [
    { uses: 'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09', with: { 'fetch-depth': 0, 'persist-credentials': false } },
    { uses: 'gitleaks/gitleaks-action@e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e', env: { GITHUB_TOKEN: '${{ github.token }}' } },
  ] };
  assert.ok(secretScanProblems(action).some((p) => /gitleaks-action/.test(p)));
  let job = copy();
  job.steps.push({ uses: 'gitleaks/gitleaks-action@e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e' });
  assert.ok(secretScanProblems(job).some((p) => /gitleaks-action/.test(p)), 'the action next to the binary');
  job = copy();
  scan(job).run = scan(job).run.replace(/^.*sha256sum.*$/m, '');
  assert.ok(secretScanProblems(job).some((p) => /sha256/.test(p)), 'the checksum line removed');
  job = copy();
  delete scan(job).env.GITLEAKS_SHA256;
  assert.ok(secretScanProblems(job).some((p) => /sha256/.test(p)), 'the pinned sum removed');
  job = copy();
  scan(job).run = scan(job).run.replace('--log-opts="${range}"', '--log-opts="-1"');
  assert.ok(secretScanProblems(job).some((p) => /base\.\.head/.test(p)), 'only the last commit scanned');
  job = copy();
  scan(job).env.BASE_SHA = '${{ github.event.before }}';
  assert.ok(secretScanProblems(job).some((p) => /base/.test(p)), 'a pull request scanned from the previous push only');
  job = copy();
  job.steps[1].with['fetch-depth'] = 1;
  assert.ok(secretScanProblems(job).some((p) => /history/.test(p)), 'a shallow checkout has no base commit');
  job = copy();
  scan(job).run = scan(job).run.replace(/if \[ -e \.gitleaks\.toml \]/, 'if false');
  assert.ok(secretScanProblems(job).some((p) => /gitleaks\.toml/.test(p)), 'a config in the tree would replace the rules');
});

test('.gitleaksignore holds exactly the six fingerprints reviewed in Task 970 (R5-2)', () => {
  assert.deepEqual(gitleaksIgnoreProblems(readFileSync(path.join(ROOT, '.gitleaksignore'), 'utf8')), []);
});

test('planted: an extra or a missing .gitleaksignore line is refused; comments and blank lines are not entries', () => {
  const text = readFileSync(path.join(ROOT, '.gitleaksignore'), 'utf8');
  const extra = 'abc0000000000000000000000000000000000000:src/lib/key.ts:generic-api-key:3';
  assert.deepEqual(gitleaksIgnoreProblems(`${text}\n${extra}\n`), [`not reviewed in Task 970: ${extra}`]);
  assert.deepEqual(gitleaksIgnoreProblems(text.replace(`${REVIEWED_FINGERPRINTS[0]}\n`, '')), [`reviewed in Task 970 but missing: ${REVIEWED_FINGERPRINTS[0]}`]);
  assert.deepEqual(gitleaksIgnoreProblems(`# a comment\n\n${REVIEWED_FINGERPRINTS.join('\r\n')}\r\n`), []);
});

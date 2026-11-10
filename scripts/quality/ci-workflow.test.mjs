// The CI workflow gives every gate what it needs to run. The first CI run of the governance reset (PR #19,
// 2026-11-06) failed for three reasons that were not code: the hydration gate's self-test had no browser in the
// quality job, the authorization suite read a Server Action manifest that its job never built, and only changed
// kickoffs were checked. These tests keep each prerequisite in place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

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

// Task 963 AC13 (found in the Task 953 review 2, 2026-11-08): `ubuntu-latest` moved from ubuntu-24.04 to ubuntu-26.04,
// where Playwright 1.60 cannot install Chromium, so every browser job failed before its first check (run 42465743137).
// Every job names its image; a moved label can no longer change the machine CI tests on.
const PINNED_RUNNER = 'ubuntu-24.04';
/** The runner labels of one job that are not the pinned image (a job calling a reusable workflow has none). */
const unpinnedRunners = (def) => {
  if (def.uses && def['runs-on'] === undefined) return [];
  const labels = [def['runs-on']].flat();
  return labels.filter((label) => label !== PINNED_RUNNER);
};

test('every job of every workflow runs on the pinned ubuntu-24.04 image, never ubuntu-latest', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../../.github/workflows/', import.meta.url);
  const files = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
  assert.ok(files.length >= 3, 'the workflows directory was read');
  for (const file of files) {
    const wf = yaml.load(readFileSync(new URL(file, dir), 'utf8'));
    for (const [job, def] of Object.entries(wf.jobs ?? {})) {
      assert.deepEqual(unpinnedRunners(def), [], `${file}/${job}: runs-on must be ${PINNED_RUNNER}`);
    }
  }
});

test('the planted case: a job on ubuntu-latest, or on a list holding it, is refused', () => {
  assert.deepEqual(unpinnedRunners({ 'runs-on': 'ubuntu-latest', steps: [] }), ['ubuntu-latest']);
  assert.deepEqual(unpinnedRunners({ 'runs-on': ['ubuntu-latest'], steps: [] }), ['ubuntu-latest']);
  assert.deepEqual(unpinnedRunners({ 'runs-on': undefined, steps: [] }), [undefined]);
  assert.deepEqual(unpinnedRunners({ 'runs-on': PINNED_RUNNER, steps: [] }), []);
});

// Task 970 (2026-11-09): `gitleaks/gitleaks-action` took a pull request's range from one page of the commits API, so
// PR #19 had commits 1-30 of 60 scanned and a key-shaped test value of commit 57 reached main unscanned (run
// 42690395258 against 42695364395). The job now runs a checksum-pinned gitleaks over the event's own range: base..head
// of a pull request or a push, the whole history on the daily run.
const GITLEAKS_VERSION = '8.24.3';
const GITLEAKS_SHA256 = '9991e0b2903da4c8f6122b5c3186448b927a5da4deef1fe45271c3793f4ee29c';
// Each fingerprint was read and judged no secret in Task 970 (kickoff "Goal"); a new entry changes this list, so a
// reviewer reads it before it can hide anything.
const REVIEWED_FINGERPRINTS = [
  'b1c7b41479675d9a1737b19d216d8ac55f770cf4:scripts/lib/__tests__/redact-log.test.ts:generic-api-key:17',
  'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2:docs/sessions/evidence/task927/review-11/rv11-07-authorize-probe.txt:generic-api-key:14',
  'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2:docs/sessions/evidence/task927/design/sources/gis-js-reference.html:gcp-api-key:4375',
  'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2:docs/sessions/evidence/task927/review-8/g-branding-guidelines.html:gcp-api-key:4400',
  '0295d7f10d3165b4947de99a3fea14e33b099bf8:docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/assets/iframe-BWqC60Cj.js:generic-api-key:1034',
  '1cb0ba80cce1a2cff555492fad86a872b16751bb:tasks/kickoff_prompt_Task_646_Homepage_Inline_Chrome_Mantine.md:generic-api-key:161',
];

/** Why a `secrets` job would leave commits unscanned or run an unverified scanner; empty when it holds. */
export function secretScanProblems(job) {
  const problems = [];
  const steps = job?.steps ?? [];
  if (steps.some((s) => /gitleaks\/gitleaks-action/.test(s.uses ?? ''))) problems.push('gitleaks-action scans one API page (30 commits) of a pull request');
  if (!steps.some((s) => /actions\/checkout@/.test(s.uses ?? '') && s.with?.['fetch-depth'] === 0 && s.with?.['persist-credentials'] === false)) {
    problems.push('the checkout must fetch the whole history without persisting credentials');
  }
  const step = steps.find((s) => /\bgitleaks" git\b|\bgitleaks git\b/.test(s.run ?? ''));
  if (!step) return [...problems, 'no step runs `gitleaks git`'];
  const env = step.env ?? {};
  const run = String(step.run);
  if (String(env.GITLEAKS_VERSION) !== GITLEAKS_VERSION) problems.push(`gitleaks must be pinned to ${GITLEAKS_VERSION}`);
  if (env.GITLEAKS_SHA256 !== GITLEAKS_SHA256) problems.push('the release sha256 must be pinned');
  if (!/pull_request\.base\.sha/.test(String(env.BASE_SHA)) || !/github\.event\.before/.test(String(env.BASE_SHA))) {
    problems.push('the base is the pull request base, else the push\'s previous head');
  }
  if (!/pull_request\.head\.sha/.test(String(env.HEAD_SHA))) problems.push('the head of a pull request is its own head commit');
  if (/\$\{\{/.test(run)) problems.push('event values reach the shell only through env');
  // What the script does with those values is run, not read (review 1, F2): secretScanBehaviour below.
  problems.push(...secretScanBehaviour(run));
  if (JSON.stringify(job.permissions) !== JSON.stringify({ contents: 'read' })) problems.push('the job reads the repository only');
  if (steps.some((s) => carriesSecret(s.env))) problems.push('the scan needs no secret');
  return problems;
}

// ── Task 970 review 1 (F2): the step's `run:` block, executed ──────────────────────────────────────────────────────
// The block runs under bash in a scratch checkout with a scratch RUNNER_TEMP. Stubs stand in for the network and the
// binary: `curl` writes a known archive, `tar` records itself and drops the scanner stub, the scanner stub records its
// arguments and exits with STUB_EXIT. sha256sum is the real one, so the checksum check is the step's own.
const FAKE_ARCHIVE = 'fake gitleaks archive\n';
const FAKE_ARCHIVE_SHA256 = createHash('sha256').update(FAKE_ARCHIVE).digest('hex');

/** bash for the step: Git for Windows' own on Windows (never WSL's), bash on the CI runner. */
function bashPath() {
  if (process.platform !== 'win32') return 'bash';
  const core = spawnSync('git', ['--exec-path'], { encoding: 'utf8', windowsHide: true }).stdout.trim(); // …/Git/mingw64/libexec/git-core
  const candidate = path.resolve(core, '..', '..', '..', 'bin', 'bash.exe');
  assert.ok(existsSync(candidate), `Git for Windows bash not found next to ${core}`);
  return candidate;
}

const STUBS = {
  curl: '#!/usr/bin/env bash\nout=""\nwhile [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift 2 ;; *) shift ;; esac; done\nprintf \'fake gitleaks archive\\n\' > "$out"\necho curl >> "$STUB_LOG"\n',
  tar: '#!/usr/bin/env bash\necho tar >> "$STUB_LOG"\ndir=""; prev=""\nfor a in "$@"; do [ "$prev" = "-C" ] && dir="$a"; prev="$a"; done\ncp "$STUB_GITLEAKS" "$dir/gitleaks"\nchmod +x "$dir/gitleaks"\n',
  scanner: '#!/usr/bin/env bash\necho gitleaks >> "$STUB_LOG"\nfor a in "$@"; do printf \'%s\\n\' "$a"; done > "$STUB_ARGS"\nexit "${STUB_EXIT:-0}"\n',
};

/** Runs the step's script for one event; returns its exit status, the stubs it reached and the scanner's arguments. */
export function runSecretScanStep(run, { event, base = '', head, sha256 = FAKE_ARCHIVE_SHA256, scannerExit = 0, gitleaksToml = false }) {
  const root = mkdtempSync(path.join(tmpdir(), 'task970-'));
  const p = (...parts) => path.join(root, ...parts).replace(/\\/g, '/');
  try {
    for (const dir of ['bin', 'runner', 'checkout']) mkdirSync(p(dir));
    writeFileSync(p('bin', 'curl'), STUBS.curl);
    writeFileSync(p('bin', 'tar'), STUBS.tar);
    writeFileSync(p('scanner'), STUBS.scanner);
    for (const f of [p('bin', 'curl'), p('bin', 'tar'), p('scanner')]) chmodSync(f, 0o755);
    if (gitleaksToml) writeFileSync(p('checkout', '.gitleaks.toml'), "[allowlist]\npaths = ['''leak.txt''']\n");
    // Git for Windows' launcher puts its own directories first, so the stub directory is put back in front inside bash
    writeFileSync(p('step.sh'), `export PATH="$(cygpath -u "$STUB_BIN" 2>/dev/null || printf '%s' "$STUB_BIN"):$PATH"\n${run}`);
    const env = { ...process.env };
    Object.assign(env, {
      STUB_BIN: p('bin'), STUB_LOG: p('log'), STUB_ARGS: p('args'), STUB_GITLEAKS: p('scanner'), STUB_EXIT: String(scannerExit),
      RUNNER_TEMP: p('runner'), GITLEAKS_VERSION, GITLEAKS_SHA256: sha256, EVENT: event, BASE_SHA: base, HEAD_SHA: head,
    });
    const r = spawnSync(bashPath(), [p('step.sh')], { cwd: p('checkout'), env, encoding: 'utf8', windowsHide: true, timeout: 30000 });
    const read = (f) => (existsSync(p(f)) ? readFileSync(p(f), 'utf8').split('\n').filter(Boolean) : []);
    return { status: r.status, reached: read('log'), args: read('args'), output: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const scannerArgs = (logOpts) => ['git', '--redact', '--verbose', '--no-banner', '--exit-code=2', `--log-opts=${logOpts}`, '.'];
const ZERO = '0000000000000000000000000000000000000000';
const EVENTS = [
  ['pull_request', { event: 'pull_request', base: 'b0a5e1', head: 'he4d01' }, '--no-merges b0a5e1..he4d01'],
  ['push', { event: 'push', base: 'be4f02', head: 'he4d02' }, '--no-merges be4f02..he4d02'],
  ['push with an all-zero before', { event: 'push', base: ZERO, head: 'he4d03' }, '-1'],
  ['schedule', { event: 'schedule', base: '', head: 'he4d04' }, 'he4d04'],
  ['workflow_dispatch', { event: 'workflow_dispatch', base: '', head: 'he4d05' }, 'he4d05'],
];

/** What the executed step got wrong; empty when every event scans its exact range and every failure stops it. */
export function secretScanBehaviour(run) {
  const problems = [];
  for (const [name, input, logOpts] of EVENTS) {
    const r = runSecretScanStep(run, input);
    if (r.status !== 0) problems.push(`${name}: the step failed (${r.status}): ${r.output.trim().split('\n').slice(-2).join(' | ')}`);
    else if (JSON.stringify(r.args) !== JSON.stringify(scannerArgs(logOpts))) problems.push(`${name}: the scanner got ${JSON.stringify(r.args)}, expected --log-opts=${logOpts}`);
  }
  const mismatch = runSecretScanStep(run, { event: 'push', base: 'be4f06', head: 'he4d06', sha256: GITLEAKS_SHA256 });
  if (mismatch.status === 0 || mismatch.reached.includes('tar') || mismatch.reached.includes('gitleaks')) {
    problems.push(`a checksum mismatch must stop the step before tar and the scanner (status ${mismatch.status}, reached ${mismatch.reached.join(',')})`);
  }
  const leak = runSecretScanStep(run, { event: 'push', base: 'be4f07', head: 'he4d07', scannerExit: 2 });
  if (leak.status === 0 || !leak.reached.includes('gitleaks')) problems.push(`a scanner exit 2 must fail the step (status ${leak.status})`);
  const config = runSecretScanStep(run, { event: 'pull_request', base: 'b0a5e8', head: 'he4d08', gitleaksToml: true });
  if (config.status === 0 || config.reached.includes('gitleaks')) problems.push(`a .gitleaks.toml in the checkout must stop the step before the scanner (status ${config.status})`);
  return problems;
}

test('the secret scan covers every commit of the change with a pinned, checksum-verified gitleaks (Task 970)', () => {
  assert.deepEqual(secretScanProblems(ci.jobs.secrets), []);
});

test('the planted case: the gitleaks-action job of PR #19 is refused', () => {
  const old = {
    permissions: { contents: 'read' },
    steps: [
      { uses: 'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09', with: { 'fetch-depth': 0, 'persist-credentials': false } },
      { uses: 'gitleaks/gitleaks-action@e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e', env: { GITHUB_TOKEN: '${{ github.token }}' } },
    ],
  };
  const problems = secretScanProblems(old);
  assert.ok(problems.some((p) => /one API page/.test(p)));
  assert.ok(problems.some((p) => /gitleaks git/.test(p)));
});

test('.gitleaksignore holds exactly the fingerprints reviewed in Task 970', () => {
  const entries = readFileSync(new URL('../../.gitleaksignore', import.meta.url), 'utf8')
    .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  assert.deepEqual([...entries].sort(), [...REVIEWED_FINGERPRINTS].sort());
});

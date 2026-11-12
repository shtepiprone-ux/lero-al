// node --test scripts/quality/ci-local.test.mjs
// ci-local.mjs runs every CI job locally the way CI runs it (owner, 2026-11-10). PR #28 was red twice on what passed
// locally: a gate read no untracked file (run 42810053035) and a test read the developer's own `main` (run
// 42820908081). These cases keep the checkout CI-shaped and the plan complete.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BROWSER, GITLEAKS_WINDOWS_SHA256, HELD, ZIZMOR, holdJobs, checkoutDir, withCleanTree, connectionHolders, newAlerts, overlayOf, planWorkflow, portsInUse, waitForPorts, windowsTar, workRoot, prepareCheckout, resolveExpressions, runPlan, summaryLine } from './ci-local.mjs';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CTX = { base: 'b'.repeat(40), prHead: 'c'.repeat(40), merge: 'd'.repeat(40), event: 'pull_request' };

test('the plan of the real ci.yml has every job and every matrix shard; only the security-ci jobs are CI-only', () => {
  const doc = yaml.load(readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'));
  const plan = planWorkflow(doc, CTX);
  assert.deepEqual([...new Set(plan.map((j) => j.id))].sort(), Object.keys(doc.jobs).sort());
  assert.deepEqual(plan.filter((j) => j.id === 'locale-leak').map((j) => j.name), [1, 2, 3, 4, 5, 6].map((n) => `Locale leak (${n}/6)`));
  assert.deepEqual(plan.filter((j) => j.status === 'CI-ONLY').map((j) => j.id).sort(), ['authz', 'click-shield']);
  assert.deepEqual(plan.filter((j) => j.status === 'UNVERIFIED').map((j) => `${j.id}: ${j.reason}`), [], 'every step of ci.yml has a local equivalent');
  const order = plan.map((j) => j.id);
  for (const j of plan) for (const n of j.needs) assert.ok(order.indexOf(n) < order.indexOf(j.id), `${j.id} runs after ${n}`);
  const tokenSteps = plan.flatMap((j) => j.steps.filter((s) => s.tokenEnv.length).map((s) => `${j.id}#${s.index}`));
  assert.deepEqual(tokenSteps, ['quality#5'], 'the token reaches only the steps whose CI env names github.token; never the third-party zizmor');
  const gitleaks = plan.find((j) => j.id === 'secrets').steps.find((s) => s.kind === 'gitleaks');
  assert.ok(gitleaks, 'the secret scan is recognised and gets the pinned Windows stand-in');
  assert.match(GITLEAKS_WINDOWS_SHA256[gitleaks.env.GITLEAKS_VERSION] ?? '', /^[0-9a-f]{64}$/, 'the gitleaks version of ci.yml has a pinned Windows SHA-256');
  assert.match(ZIZMOR.version, /^\d+\.\d+\.\d+$/, 'zizmor runs at a pinned version, never latest');
  assert.ok(ZIZMOR.sha256.length > 0 && ZIZMOR.sha256.every((h) => /^[0-9a-f]{64}$/.test(h)), 'zizmor installs only from wheels with pinned digests');
  assert.ok(Date.parse('2026-11-10') - Date.parse(ZIZMOR.released) >= 14 * 86_400_000, 'the pinned zizmor was at least 14 days old when pinned (flow.md §1 step 4)');
});

test('CodeQL: only alerts main does not already have count, as GitHub reports them (ci-local run 2026-11-10)', () => {
  const hit = (rule, p, line) => ({ rule, path: p, line });
  const base = [{ rule: 'js/http-to-file-access', path: 'scripts/quality/owasp.mjs' }, { rule: 'js/http-to-file-access', path: 'scripts/quality/owasp.mjs' }];
  const hits = [hit('js/http-to-file-access', 'scripts/quality/owasp.mjs', 522), hit('js/http-to-file-access', 'scripts/quality/owasp.mjs', 619), hit('js/http-to-file-access', 'scripts/quality/owasp.mjs', 700), hit('js/file-system-race', 'scripts/quality/pipeline.mjs', 59)];
  assert.deepEqual(newAlerts(hits, base).map((h) => `${h.path}:${h.line}`), ['scripts/quality/owasp.mjs:700', 'scripts/quality/pipeline.mjs:59'], 'a third alert of a rule main has twice is new, and so is a rule main lacks');
  assert.deepEqual(newAlerts(hits, []).length, 4, 'without main alerts every hit counts');
});

test('before a browser job the run waits until the ports are free, with no deadline, and never retries (owner 2026-11-10)', () => {
  const logs = [];
  // a long drain: 40 polls over the limit, then free; no deadline cuts it short
  const counts = [...Array(40).fill(5000), 1500];
  const r = waitForPorts({ count: () => counts.shift(), sleep: () => {}, holders: () => [], max: 2000, step: 5000, report: 30_000, stall: 600_000, log: (m) => logs.push(m) });
  assert.deepEqual([r.ports, r.waited], [1500, 200_000], 'it waits as long as the ports take to free');
  assert.ok(logs.some((l) => /ports in use: 5000 \(limit 2000\), waited 30 s/.test(l)), 'progress is reported every 30 s');
  // a count that does not fall: the holders are reported, and the wait goes on
  const stuck = [...Array(130).fill(4000), 100];
  const s = [];
  const w = waitForPorts({ count: () => stuck.shift(), sleep: () => {}, holders: () => ['node.exe (4242): 3900'], max: 2000, step: 5000, report: 30_000, stall: 600_000, log: (m) => s.push(m) });
  assert.equal(w.ports, 100);
  assert.ok(s.some((l) => /has not fallen for 10 min; most connections: node\.exe \(4242\): 3900; still waiting/.test(l)), 'a stall names the processes that hold the connections');
  assert.equal(waitForPorts({ count: () => null, sleep: () => assert.fail('no wait without a count') }).ports, null);
  const doc = yaml.load(readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'));
  const browserJobs = planWorkflow(doc, CTX).filter((j) => j.steps.some((x) => x.kind === 'run' && BROWSER.test(x.script ?? ''))).map((j) => j.id);
  for (const id of ['quality', 'homepage-grid', 'locale-leak']) assert.ok(browserJobs.includes(id), `${id} waits for ports`);
  assert.ok(!browserJobs.includes('unit') && !browserJobs.includes('sbom'), 'jobs without a browser do not wait');
});

test('ports in use count every TCP state but LISTEN; the holders come from netstat PIDs', () => {
  const win = [
    '  Proto  Local Address          Foreign Address        State           PID',
    '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1100',
    '  TCP    127.0.0.1:50001        127.0.0.1:6020         ESTABLISHED     4242',
    '  TCP    127.0.0.1:50002        127.0.0.1:6020         TIME_WAIT       0',
    '  TCP    127.0.0.1:50003        127.0.0.1:6020         ESTABLISHED     4242',
    '  TCP    127.0.0.1:50004        127.0.0.1:6020         CLOSE_WAIT      77',
  ].join('\r\n');
  assert.equal(portsInUse(win), 4);
  assert.deepEqual(connectionHolders(win, '"node.exe","4242","Console","1","90,000 K"\r\n"chrome.exe","77","Console","1","1 K"'), ['node.exe (4242): 2', 'chrome.exe (77): 1']);
});

test('a browser job starts only after the wait; the others run without one', { timeout: 60000 }, () => {
  const r = repo();
  const work = mkdtempSync(path.join(os.tmpdir(), 'ci-local-work-'));
  const dir = path.join(work, 'repo');
  const ctx = { ...prepareCheckout(r.root, dir), work, dir, token: null };
  const order = [];
  const plan = planWorkflow({ jobs: {
    plain: { steps: [{ run: 'true' }] },
    browser: { steps: [{ run: 'echo check:homepage-grid' }] },
  } }, ctx);
  const res = Object.fromEntries(runPlan(plan, ctx, { ports: () => { order.push('wait'); return { ports: 10, waited: 120_000 }; }, log: (m) => { if (/the browser job starts/.test(m)) order.push('start'); } }).map((x) => [x.job, x.status]));
  assert.deepEqual(res, { plain: 'PASS', browser: 'PASS' });
  assert.deepEqual(order, ['wait', 'start'], 'one wait, before the browser job only');
  rmSync(work, { recursive: true, force: true });
  r.done();
});

test('the checkouts live in the user cache: never the shared temp directory, never under .git (Vite refuses it)', () => {
  const w = workRoot();
  assert.ok(!path.resolve(w).toLowerCase().startsWith(path.resolve(os.tmpdir()).toLowerCase()), `not in the shared temp directory: ${w}`);
  assert.ok(!path.resolve(w).split(path.sep).includes('.git'), `no .git segment: ${w}`);
  assert.equal(workRoot({ CI_LOCAL_HOME: path.join('X:', 'cache') }), path.join('X:', 'cache', 'lero-al-ci-local'));
  const run = checkoutDir('0123456789ab');
  assert.equal(path.dirname(run), w, 'a run directory is inside the work root');
  assert.throws(() => checkoutDir('../x'), /refused run id/);
  // the command line takes its directory from checkoutDir and nowhere else
  const src = readFileSync(path.join(ROOT, 'scripts', 'quality', 'ci-local.mjs'), 'utf8');
  const cli = src.slice(src.indexOf('if (isEntryPoint(import.meta.url))'));
  assert.match(cli, /const work = checkoutDir\(id\);/);
  assert.doesNotMatch(cli, /\.git|tmpdir/, 'the command line names no other location');
  // the whole progress, port counts and step times included, is kept in <work>/run.log, redacted
  assert.match(cli, /appendFileSync\(path\.join\(work, 'run\.log'\), `\$\{new Date\(\)\.toISOString\(\)\} \$\{redact\(m, token\)\}\\n`\)/);
  // the real run stops the checks an earlier run left (load-watch.mjs sweepStrays); a test's runPlan never does; it holds
  // only what --hold names, refused unless HOLDABLE (holdJobs)
  assert.match(cli, /runPlan\(plan, ctx, \{ log: say, sweep: sweepStrays, hold \}\)/);
  assert.match(cli, /hold = holdJobs\(take\('--hold'\)\)/);
  // a run that stopped at a failure never exits 0 for the jobs it did not run
  assert.match(cli, /const bad = results\.some\(\(r\) => r\.status === 'FAIL' \|\| r\.status === 'UNVERIFIED' \|\| r\.status === NOT_RUN\)/);
});

test('the Windows stand-in for gitleaks extracts with the tar of Windows, never the GNU tar on PATH', () => {
  assert.equal(windowsTar({ SystemRoot: 'C:\\Windows' }), path.join('C:\\Windows', 'System32', 'tar.exe'));
  assert.match(windowsTar({}), /System32[\\/]tar\.exe$/);
});

test('an unknown action, expression or condition is UNVERIFIED, and a secret makes a job CI-only', () => {
  const plan = planWorkflow({ jobs: {
    a: { steps: [{ uses: 'evil/action@0000000000000000000000000000000000000000' }] },
    b: { steps: [{ run: 'echo ${{ github.event.pull_request.title }}' }] },
    c: { steps: [{ if: "github.actor == 'x'", run: 'echo' }] },
    d: { steps: [{ run: 'echo', env: { K: '${{ secrets.K }}' } }] },
    e: { if: "github.event_name == 'push'", steps: [{ run: 'echo' }] },
    f: { if: '${{ always() }}', steps: [{ run: 'echo' }] },
    g: { if: "${{ github.event_name == 'push' }}", steps: [{ run: 'echo' }] },
  } }, CTX);
  assert.deepEqual(plan.map((j) => [j.id, j.status]), [['a', 'UNVERIFIED'], ['b', 'UNVERIFIED'], ['c', 'UNVERIFIED'], ['d', 'CI-ONLY'], ['e', 'UNVERIFIED'], ['f', 'run'], ['g', 'UNVERIFIED']], 'a job condition in ${{ }} is read like a bare one');
  assert.equal(resolveExpressions('${{ github.event.pull_request.base.sha || github.event.before }}', CTX).value, CTX.base);
  assert.deepEqual(resolveExpressions('${{ matrix.nope }}', CTX, {}).unknown, ['matrix.nope']);
  assert.match(summaryLine('abc', [{ job: 'x', status: 'PASS' }, { job: 'y', status: 'CI-ONLY' }]), /1 passed, 0 failed, 0 unverified, 0 not run; CI-only: y/);
});

function repo() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'ci-local-src-'));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  git('init', '-q');
  writeFileSync(path.join(root, 'a.txt'), 'base\n');
  writeFileSync(path.join(root, 'gone.txt'), 'deleted in the working tree\n');
  git('add', '.');
  git('commit', '-q', '-m', 'base');
  // the clone's origin/main: the source's own main, as the pull-request checkout has refs/remotes/origin/main
  git('switch', '-q', '-c', 'feature');
  writeFileSync(path.join(root, 'b.txt'), 'feature\n');
  git('add', '.');
  git('commit', '-q', '-m', 'feature');
  return { root, git, done: () => rmSync(root, { recursive: true, force: true }) };
}

test('the checkout is CI-shaped: no local main, the push disabled, the working tree overlaid and merged with main', { timeout: 120000 }, () => {
  const r = repo();
  writeFileSync(path.join(r.root, 'untracked.txt'), 'a word only an untracked file holds\n');
  writeFileSync(path.join(r.root, 'a.txt'), 'edited, not committed\n');
  rmSync(path.join(r.root, 'gone.txt'));
  const work = mkdtempSync(path.join(os.tmpdir(), 'ci-local-work-'));
  const dir = path.join(work, 'repo');
  // a fake token built from parts, so the secret scan (gitleaks generic-api-key) sees no literal key
  const FAKE = ['tok', 'fixture', 'only'].join('_');
  const ctx = { ...prepareCheckout(r.root, dir), work, dir, token: FAKE };
  const workflow = { jobs: {
    // PR #28, run 42820908081: a test that reads the developer's own `main` passes in place and fails here
    'reads-local-main': { steps: [{ run: 'git rev-parse --verify -q refs/heads/main' }] },
    // PR #28, run 42810053035: what only an untracked file holds is part of the checked change
    overlay: { steps: [{ run: 'grep -q "only an untracked file" untracked.txt && grep -q "not committed" a.txt && test ! -e gone.txt && git rev-parse --verify -q refs/remotes/origin/main' }] },
    'no-push': { steps: [{ run: 'git push origin HEAD:refs/heads/from-ci-local' }] },
    token: { steps: [
      { run: 'echo "named:$GITHUB_TOKEN"', env: { GITHUB_TOKEN: '${{ github.token }}' } },
      { run: 'echo "unnamed:[$GITHUB_TOKEN]"' },
    ] },
    base: { steps: [{ run: 'test "$BASE_SHA" = "$(git rev-parse refs/remotes/origin/main)"', env: { BASE_SHA: '${{ github.event.pull_request.base.sha || github.event.before }}' } }] },
    slow: { 'timeout-minutes': 1, steps: [{ run: 'sleep 5' }] },
  } };
  const plan = planWorkflow(workflow, ctx);
  const saved = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = FAKE; // a token in the agent's own environment must not leak into the steps
  let results;
  try { results = runPlan(plan, ctx, { minuteMs: 500, failFast: false }); } finally { if (saved === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = saved; }
  const status = Object.fromEntries(results.map((x) => [x.job, x.status]));
  assert.deepEqual(status, { 'reads-local-main': 'FAIL', overlay: 'PASS', 'no-push': 'FAIL', token: 'PASS', base: 'PASS', slow: 'FAIL' });
  const logs = results.find((x) => x.job === 'token').steps.map((s) => readFileSync(s.log, 'utf8'));
  assert.match(logs[0], /named:\*\*\*/, 'the token is redacted in the stored log');
  assert.ok(!logs.join('\n').includes(FAKE), 'the token text is in no stored log');
  assert.match(logs[1], /unnamed:\[\]/, 'a step that does not name github.token does not get it');
  assert.ok(results.find((x) => x.job === 'slow').steps[0].timedOut, 'timeout-minutes is enforced');
  const src = spawnSync('git', ['rev-parse', '--verify', '-q', 'refs/heads/from-ci-local'], { cwd: r.root, encoding: 'utf8' });
  assert.notEqual(src.status, 0, 'the source repository got no ref from the clone');
  assert.ok(existsSync(path.join(r.root, 'gone.txt')) === false && readFileSync(path.join(r.root, 'a.txt'), 'utf8') === 'edited, not committed\n', 'the source working tree is untouched');
  rmSync(work, { recursive: true, force: true });
  r.done();
});

test('no local branch survives even when the source repository is on main (a clone would create a local main)', { timeout: 60000 }, () => {
  const r = repo();
  r.git('switch', '-q', 'main');
  const work = mkdtempSync(path.join(os.tmpdir(), 'ci-local-work-'));
  const dir = path.join(work, 'repo');
  prepareCheckout(r.root, dir);
  const heads = spawnSync('git', ['for-each-ref', '--format=%(refname)', 'refs/heads'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
  assert.equal(heads, '', 'the checkout has no local branch');
  assert.equal(spawnSync('git', ['rev-parse', '--verify', '-q', 'refs/remotes/origin/main'], { cwd: dir }).status, 0, 'origin/main is kept');
  rmSync(work, { recursive: true, force: true });
  r.done();
});

test('the base is main as the upstream has it, not a stale local main', { timeout: 60000 }, () => {
  const up = repo(); // the "GitHub" repository
  // the developer's repository is a clone of it (one history), whose local main then falls behind
  const srcRoot = mkdtempSync(path.join(os.tmpdir(), 'ci-local-dev-'));
  assert.equal(spawnSync('git', ['clone', '-q', up.root, srcRoot], { encoding: 'utf8' }).status, 0);
  spawnSync('git', ['remote', 'set-url', 'origin', `file://${up.root.split(path.sep).join('/')}`], { cwd: srcRoot });
  up.git('switch', '-q', 'main');
  writeFileSync(path.join(up.root, 'later.txt'), 'merged upstream after the local main was last updated\n');
  up.git('add', '.');
  up.git('commit', '-q', '-m', 'upstream main moved');
  const upstreamMain = up.git('rev-parse', 'HEAD');
  const stale = spawnSync('git', ['rev-parse', 'refs/remotes/origin/main'], { cwd: srcRoot, encoding: 'utf8' }).stdout.trim();
  assert.notEqual(stale, upstreamMain, 'the fixture really has a stale main');
  const work = mkdtempSync(path.join(os.tmpdir(), 'ci-local-work-'));
  const ctx = prepareCheckout(srcRoot, path.join(work, 'repo'));
  assert.equal(ctx.base, upstreamMain, 'BASE_SHA is the upstream main');
  rmSync(work, { recursive: true, force: true });
  rmSync(srcRoot, { recursive: true, force: true });
  up.done();
});

const canLink = (() => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'ci-local-link-'));
  try { symlinkSync('target', path.join(d, 'l')); return true; } catch { return false; } finally { rmSync(d, { recursive: true, force: true }); }
})();

test('a symbolic link in the working tree is refused, never copied as the file it points to', { skip: !canLink && 'this account may not create symbolic links (Windows without developer mode); CI runs it' }, () => {
  const r = repo();
  writeFileSync(path.join(r.root, 'secret-outside.txt'), 'outside\n');
  symlinkSync(path.join(r.root, 'secret-outside.txt'), path.join(r.root, 'link.txt'));
  assert.throws(() => overlayOf(r.root), /refused symbolic link link\.txt/);
  r.done();
});

test('CodeQL reads a clean tree of the commit, as CI checks it out: no installed or built file of the shared checkout', { timeout: 60000 }, () => {
  // the shared checkout held 131 375 files against 14 782 tracked; CodeQL walked node_modules for 21.8 min (2026-11-11)
  const r = repo();
  writeFileSync(path.join(r.root, '.gitignore'), '.next/\n');
  r.git('add', '.gitignore');
  r.git('commit', '-q', '-m', 'ignore');
  mkdirSync(path.join(r.root, 'node_modules', 'pkg'), { recursive: true });
  writeFileSync(path.join(r.root, 'node_modules', 'pkg', 'index.js'), 'untracked\n');
  mkdirSync(path.join(r.root, '.next'));
  writeFileSync(path.join(r.root, '.next', 'build.js'), 'ignored\n');
  const dest = path.join(mkdtempSync(path.join(os.tmpdir(), 'ci-local-clean-')), 'codeql-src');
  const seen = withCleanTree(r.root, dest, (src) => ({
    tracked: existsSync(path.join(src, 'a.txt')) && existsSync(path.join(src, 'b.txt')),
    installed: existsSync(path.join(src, 'node_modules')),
    built: existsSync(path.join(src, '.next')),
  }));
  assert.deepEqual(seen, { tracked: true, installed: false, built: false });
  assert.equal(existsSync(dest), false, 'the clean tree is removed after the analysis');
  assert.equal(r.git('worktree', 'list').split('\n').length, 1, 'no worktree is left registered');
  assert.equal(existsSync(path.join(r.root, 'node_modules', 'pkg', 'index.js')), true, 'the checkout itself is untouched');
  r.done();
});

test('the aggregate CI Required job is CI-only when it aggregates a CI-only job, and fails when a needed job failed', { timeout: 60000 }, () => {
  const r = repo();
  const work = mkdtempSync(path.join(os.tmpdir(), 'ci-local-work-'));
  const dir = path.join(work, 'repo');
  mkdirSync(work, { recursive: true });
  const ctx = { ...prepareCheckout(r.root, dir), work, dir, token: null };
  const required = (needs) => ({ needs, if: 'always()', steps: [{ run: 'for r in $RESULTS; do [ "$r" = success ] || exit 1; done', env: { RESULTS: "${{ join(needs.*.result, ' ') }}" } }] });
  const st = (wf) => Object.fromEntries(runPlan(planWorkflow({ jobs: wf }, ctx), ctx, { failFast: false }).map((x) => [x.job, x.status]));
  assert.equal(st({ ok: { steps: [{ run: 'true' }] }, required: required(['ok']) }).required, 'PASS');
  assert.equal(st({ bad: { steps: [{ run: 'false' }] }, required: required(['bad']) }).required, 'FAIL');
  assert.equal(st({ ok: { steps: [{ run: 'true' }] }, sec: { environment: 'security-ci', steps: [{ run: 'true' }] }, required: required(['ok', 'sec']) }).required, 'CI-ONLY');
  rmSync(work, { recursive: true, force: true });
  r.done();
});

test('--hold: only the OWASP task gate can be held; it and the aggregate are HELD, never PASS, are named in the summary, and every other job runs', { timeout: 60000 }, () => {
  // Task 964 Review 1 (owner, 2026-11-11): a review under NEEDS REVISION cannot pass a gate that needs an approved task
  assert.throws(() => holdJobs(['codeql']), /refused --hold codeql/);
  assert.throws(() => holdJobs(['owasp-gate', 'unit']), /refused --hold unit/);
  assert.deepEqual([...holdJobs(['owasp-gate'])], ['owasp-gate']);
  const r = repo();
  const work = mkdtempSync(path.join(os.tmpdir(), 'ci-local-work-'));
  const dir = path.join(work, 'repo');
  mkdirSync(work, { recursive: true });
  const ctx = { ...prepareCheckout(r.root, dir), work, dir, token: null };
  const required = { needs: ['ok', 'owasp-gate'], if: 'always()', steps: [{ run: 'for r in $RESULTS; do [ "$r" = success ] || exit 1; done', env: { RESULTS: "${{ join(needs.*.result, ' ') }}" } }] };
  const wf = { ok: { steps: [{ run: 'true' }] }, 'owasp-gate': { steps: [{ run: 'false' }] }, after: { needs: ['ok'], steps: [{ run: 'true' }] }, required };
  try {
    const held = runPlan(planWorkflow({ jobs: wf }, ctx), ctx, { hold: new Set(['owasp-gate']) });
    assert.deepEqual(Object.fromEntries(held.map((x) => [x.job, x.status])), { ok: 'PASS', 'owasp-gate': HELD, after: 'PASS', required: HELD });
    assert.match(summaryLine('x', held), /0 failed, 0 unverified, 0 not run; CI-only: none; held \(under revision\): owasp-gate, required;/);
    // without --hold the same gate fails and stops the run
    const plain = Object.fromEntries(runPlan(planWorkflow({ jobs: wf }, ctx), ctx).map((x) => [x.job, x.status]));
    assert.equal(plain['owasp-gate'], 'FAIL');
    assert.throws(() => runPlan(planWorkflow({ jobs: wf }, ctx), ctx, { hold: new Set(['ok']) }), /refused --hold ok/);
  } finally {
    rmSync(work, { recursive: true, force: true });
    r.done();
  }
});

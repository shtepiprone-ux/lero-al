#!/usr/bin/env node
// Every job of .github/workflows/ci.yml, run locally the way CI runs it, on exactly the files that will be committed
// (owner, 2026-11-10: "neither the tests nor the protection see it locally"; "checking CI is forbidden to be done
// partially"). PR #28 was red twice on what passed locally: a gate read no untracked file, and a test read the
// developer's own `main`, which the pull-request checkout does not have.
//
// OWASP basis: CI/CD Security (what is merged is what was checked), Verifying Third Party Agent Execution Evidence
// (the agent's "CI is green" is backed by a run on the exact inputs), OS Command Injection Defense (no shell is built
// from input: the commands are the repository's own workflow, started as Bash scripts, every other call is an argv).
//
//   node scripts/quality/ci-local.mjs [--job <id>]... [--hold owasp-gate] [--workflow <path>] [--keep]
//
// --hold owasp-gate (the review phase of pipeline.mjs, only while the kickoff's last verdict is NEEDS REVISION): the OWASP
// task gate needs a task approved by review, which a task under revision cannot have, so the job is HELD, named in the
// summary line, and runs at the approving review, the handoff and in CI. No other job can be held (HOLDABLE).
//
// The checkout: a fresh clone of the repository in the user's cache directory (workRoot); HEAD detached; no local branch (so no
// local `main`); `origin/main` kept; the push URL disabled; the changed and untracked files of the working tree laid
// over it and committed inside the clone (the pull request's head), then merged with `origin/main` (the merge commit a
// pull_request run checks out). Every job, in `needs` order, every matrix instance, every step in order with the CI
// expressions mapped; `timeout-minutes` enforced. `uses:` steps by a closed table; a job that needs the `security-ci`
// environment or a secret is CI-ONLY (never reported as passing); an unknown action, expression or `if:` is
// UNVERIFIED and fails the run. Exit 0 only when no job failed and none is unverified.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, closeSync, copyFileSync, existsSync, fstatSync, ftruncateSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, rmSync, writeFileSync, writeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';
import { MAX_RETRIES, PORTS_MAX, connectionHolders, diagnose, killOrphans, portsInUse, startWatch, sweepStrays, waitForCalm } from './load-watch.mjs';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const WORKFLOW = '.github/workflows/ci.yml';
const SHA_SHAPE = /^[0-9a-f]{40}$/;

// Local stand-ins are pinned (Software Supply Chain Security): zizmor at a version at least 14 days old (flow.md §1
// step 4), installed only from wheels with these SHA-256 digests (PyPI, read 2026-11-10: win_amd64, manylinux x86_64,
// macOS arm64 and x86_64); gitleaks's Windows archive by its SHA-256 (CI pins the Linux archive in ci.yml). A version
// not listed here fails until its hash is pinned.
export const ZIZMOR = {
  version: '1.31.1',
  released: '2026-10-15',
  sha256: [
    '3b35b393e8d437e275c7e399047c9892ccc290f3fc5e6aeb9f65a5d3b2a470e0',
    '58e878eb2dbd2c6183c105e1ac28c14f7dd1eca44a783f1fe2a69647d012c410',
    '4a70ee3c2721122aff04d5bbad5e448d15384f45de2ecb3c9493fe9dac2bc95f',
    '9696d3c10919a3a2eb086c102f1bc10717f53ef3700a0d6c55a709c274995476',
  ],
};
export const GITLEAKS_WINDOWS_SHA256 = { '8.24.3': '3f1a35578631dbfe633cc5b49e6c906e55ff14a4bfd7336a10fb27fe33b6dcd2' };

/** `uses:` actions this runner knows, by repository; anything else is UNVERIFIED. */
export const ACTIONS = {
  'step-security/harden-runner': 'skip',
  'actions/checkout': 'skip',
  'actions/upload-artifact': 'skip',
  'actions/download-artifact': 'skip',
  'actions/setup-node': 'node-version',
  'zizmorcore/zizmor-action': 'zizmor',
  'github/codeql-action/init': 'codeql-init',
  'github/codeql-action/analyze': 'codeql-analyze',
};

const EXPRESSIONS = {
  'github.event.pull_request.base.sha || github.event.before': 'base',
  'github.event.pull_request.base.sha': 'base',
  'github.event.pull_request.head.sha || github.sha': 'prHead',
  'github.event.pull_request.head.sha': 'prHead',
  'github.sha': 'merge',
  'github.event_name': 'event',
  'github.token': 'token',
  "join(needs.*.result, ' ')": 'needsResults',
};
export const NEEDS_RESULTS = '__CI_LOCAL_NEEDS_RESULTS__';

/** Resolves every `${{ … }}` of a string; { value, token, unknown: [expr], ciOnly: [expr] }. */
export function resolveExpressions(text, ctx, matrix = {}) {
  const out = { token: false, unknown: [], ciOnly: [] };
  out.value = String(text ?? '').replace(/\$\{\{\s*([^}]+?)\s*\}\}/g, (all, expr) => {
    if (/^(secrets|vars)\./.test(expr)) { out.ciOnly.push(expr); return ''; }
    const m = /^matrix\.(\w+)$/.exec(expr);
    if (m) {
      if (!(m[1] in matrix)) { out.unknown.push(expr); return ''; }
      return String(matrix[m[1]]);
    }
    const key = EXPRESSIONS[expr];
    if (!key) { out.unknown.push(expr); return ''; }
    if (key === 'token') out.token = true;
    if (key === 'needsResults') { out.needsResults = true; return NEEDS_RESULTS; }
    return String(ctx[key] ?? '');
  });
  return out;
}

function matrixInstances(job) {
  const m = job.strategy?.matrix;
  if (!m) return [{}];
  let combos = [{}];
  for (const [k, values] of Object.entries(m)) {
    if (!Array.isArray(values)) return null;
    combos = combos.flatMap((c) => values.map((v) => ({ ...c, [k]: v })));
  }
  return combos;
}

function jobOrder(jobs) {
  const order = [];
  const seen = new Set();
  const visit = (id, stack = []) => {
    if (seen.has(id)) return;
    if (stack.includes(id)) throw new Error(`needs cycle: ${[...stack, id].join(' → ')}`);
    const needs = [jobs[id]?.needs ?? []].flat();
    for (const n of needs) visit(n, [...stack, id]);
    seen.add(id);
    order.push(id);
  };
  for (const id of Object.keys(jobs)) visit(id);
  return order;
}

/**
 * The plan of a workflow document: every job instance in `needs` order with its steps classified.
 * `required`-style aggregate jobs (needs only, `if: always()`) are kept and run like any other.
 */
export function planWorkflow(doc, ctx = {}) {
  const jobs = doc.jobs ?? {};
  const plan = [];
  for (const id of jobOrder(jobs)) {
    const job = jobs[id];
    const instances = matrixInstances(job);
    if (!instances) { plan.push({ id, name: job.name ?? id, status: 'UNVERIFIED', reason: 'matrix shape not supported', steps: [] }); continue; }
    for (const matrix of instances) {
      const name = resolveExpressions(job.name ?? id, ctx, matrix).value;
      const entry = { id, name, matrix, needs: [job.needs ?? []].flat(), timeoutMinutes: job['timeout-minutes'] ?? 360, status: 'run', reason: '', env: Object.create(null), steps: [] };
      const serial = JSON.stringify(job);
      if (job.if !== undefined && String(job.if).replace(/^\$\{\{\s*|\s*\}\}$/g, '').trim() !== 'always()') { entry.status = 'UNVERIFIED'; entry.reason = `job if: ${job.if}`; }
      if (job.environment || /\$\{\{\s*secrets\./.test(serial)) {
        entry.status = 'CI-ONLY';
        entry.reason = job.environment ? `needs the ${job.environment.name ?? job.environment} environment (its secrets exist only in CI)` : 'reads a repository secret';
      }
      for (const [k, v] of Object.entries(job.env ?? {})) {
        const r = resolveExpressions(v, ctx, matrix);
        if (r.ciOnly.length && entry.status === 'run') { entry.status = 'CI-ONLY'; entry.reason = `job env reads ${r.ciOnly.join(', ')}`; }
        if (r.unknown.length) { entry.status = 'UNVERIFIED'; entry.reason = `unknown expression ${r.unknown.join(', ')}`; }
        entry.env[k] = r.value;
      }
      (job.steps ?? []).forEach((s, i) => {
        const step = { index: i + 1, name: s.name ?? s.run?.split('\n')[0] ?? s.uses, when: 'success', env: Object.create(null), tokenEnv: [] };
        if (s.if !== undefined) {
          const cond = String(s.if).replace(/^\$\{\{\s*|\s*\}\}$/g, '').trim();
          if (cond === 'failure()') step.when = 'failure';
          else if (cond === 'always()') step.when = 'always';
          else { step.kind = 'unverified'; step.reason = `if: ${s.if}`; }
        }
        for (const [k, v] of Object.entries(s.env ?? {})) {
          const r = resolveExpressions(v, ctx, matrix);
          if (r.unknown.length) { step.kind = 'unverified'; step.reason = `unknown expression ${r.unknown.join(', ')}`; }
          if (r.token) step.tokenEnv.push(k);
          if (r.needsResults) step.needsResults = true;
          step.env[k] = r.value;
        }
        if (!step.kind && s.run !== undefined) {
          const r = resolveExpressions(s.run, ctx, matrix);
          if (r.unknown.length || r.ciOnly.length) { step.kind = 'unverified'; step.reason = `expression in run: ${[...r.unknown, ...r.ciOnly].join(', ')}`; }
          else {
            step.kind = 'run';
            step.script = r.value;
            step.shell = s.shell ?? 'bash';
            if (id === 'secrets' && step.env.GITLEAKS_VERSION) step.kind = 'gitleaks';
          }
        } else if (!step.kind && s.uses) {
          const repo = s.uses.split('@')[0];
          step.kind = ACTIONS[repo] ?? 'unverified';
          if (step.kind === 'unverified') step.reason = `action ${repo} has no local equivalent`;
          step.with = Object.fromEntries(Object.entries(s.with ?? {}).map(([k, v]) => [k, resolveExpressions(v, ctx, matrix).value]));
          if (/\$\{\{\s*github\.token/.test(JSON.stringify(s.with ?? {}))) step.tokenEnv.push('GH_TOKEN');
        }
        if (step.kind === 'unverified' && entry.status === 'run') { entry.status = 'UNVERIFIED'; entry.reason = `step ${step.index}: ${step.reason}`; }
        entry.steps.push(step);
      });
      plan.push(entry);
    }
  }
  return plan;
}

function git(args, cwd, { allowFail = false } = {}) {
  const r = spawnSync('git', ['-c', 'core.longpaths=true', ...args], { cwd, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0 && !allowFail) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || r.stdout || '').trim()}`);
  return allowFail ? r : r.stdout;
}

/** Git for Windows' Bash (never WSL's bash.exe from System32); `bash` elsewhere. */
export function bashPath() {
  if (process.env.CI_LOCAL_BASH) return process.env.CI_LOCAL_BASH;
  if (process.platform !== 'win32') return 'bash';
  const exec = git(['--exec-path'], ROOT).trim();
  const candidate = path.resolve(exec, '..', '..', '..', 'bin', 'bash.exe');
  if (!existsSync(candidate)) throw new Error(`Git Bash not found at ${candidate}; set CI_LOCAL_BASH`);
  return candidate;
}

/** The changed and untracked files of a working tree: { modified: [path], deleted: [path] }. */
export function overlayOf(root) {
  const list = (args) => git(args, root).split('\0').filter(Boolean);
  const changed = new Set([...list(['diff', 'HEAD', '--name-only', '-z']), ...list(['ls-files', '-z', '--others', '--exclude-standard'])]);
  const modified = [];
  const deleted = [];
  for (const rel of [...changed].sort()) {
    if (rel.split('/').includes('..') || path.isAbsolute(rel)) throw new Error(`refused path ${rel}`);
    let st = null;
    try { st = lstatSync(path.join(root, rel)); } catch { st = null; }
    // Git keeps a symbolic link as a link; copying it would commit what it points to (none is tracked, 2026-11-10)
    if (st?.isSymbolicLink()) throw new Error(`refused symbolic link ${rel}: ci-local overlays regular files only`);
    (st?.isFile() ? modified : deleted).push(rel);
  }
  return { modified, deleted };
}

/** The CI-shaped checkout. Returns the context the expressions map to. */
export function prepareCheckout(root, dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(path.dirname(dir), { recursive: true });
  const head = git(['rev-parse', 'HEAD'], root).trim();
  git(['clone', '-q', '--no-hardlinks', '--no-checkout', root, dir], path.dirname(dir));
  git(['remote', 'set-url', '--push', 'origin', 'no-push://ci-local-disabled'], dir);
  // The base is main as GitHub has it, the one a pull_request run merges with, not the developer's local main: fetched
  // from the source's own origin URL; without one (a fixture), the source's origin/main, else its main.
  const upstream = git(['remote', 'get-url', 'origin'], root, { allowFail: true });
  const url = upstream.status === 0 ? upstream.stdout.trim() : '';
  if (/^(https:\/\/|git@|ssh:\/\/|file:\/\/)[\w.@:/~-]+$/.test(url)) git(['fetch', '-q', url, '+refs/heads/main:refs/remotes/origin/main'], dir);
  else if (git(['rev-parse', '--verify', '-q', 'refs/remotes/origin/main'], root, { allowFail: true }).status === 0) git(['fetch', '-q', root, '+refs/remotes/origin/main:refs/remotes/origin/main'], dir);
  git(['checkout', '-q', '--detach', head], dir);
  for (const ref of git(['for-each-ref', '--format=%(refname)', 'refs/heads'], dir).split('\n').filter(Boolean)) git(['update-ref', '-d', ref], dir);
  const { modified, deleted } = overlayOf(root);
  for (const rel of modified) { mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); copyFileSync(path.join(root, rel), path.join(dir, rel)); }
  for (const rel of deleted) rmSync(path.join(dir, rel), { force: true });
  const id = ['-c', 'user.name=ci-local', '-c', 'user.email=ci-local@invalid', '-c', 'commit.gpgsign=false'];
  git([...id, 'add', '-A'], dir);
  git([...id, 'commit', '-q', '--allow-empty', '--no-verify', '-m', 'ci-local: the working tree as it will be committed'], dir);
  const prHead = git(['rev-parse', 'HEAD'], dir).trim();
  const hasMain = git(['rev-parse', '--verify', '-q', 'refs/remotes/origin/main'], dir, { allowFail: true }).status === 0;
  const base = hasMain ? git(['rev-parse', 'refs/remotes/origin/main'], dir).trim() : git(['rev-parse', 'HEAD~1'], dir, { allowFail: true }).stdout?.trim() || prHead;
  let merge = prHead;
  if (hasMain && git(['merge-base', '--is-ancestor', base, prHead], dir, { allowFail: true }).status !== 0) {
    const r = git([...id, 'merge', '-q', '--no-ff', '--no-verify', '-m', 'ci-local: merge into origin/main', base], dir, { allowFail: true });
    if (r.status !== 0) throw new Error(`the branch does not merge into origin/main: ${(r.stdout + r.stderr).trim()}`);
    merge = git(['rev-parse', 'HEAD'], dir).trim();
  }
  git(['checkout', '-q', '--detach', merge], dir);
  for (const ref of git(['for-each-ref', '--format=%(refname)', 'refs/heads'], dir).split('\n').filter(Boolean)) git(['update-ref', '-d', ref], dir);
  if (![base, prHead, merge].every((s) => SHA_SHAPE.test(s))) throw new Error('could not resolve the base, head and merge commits');
  return { base, prHead, merge, event: 'pull_request', files: [...modified, ...deleted] };
}

const redact = (text, token) => (token ? String(text).split(token).join('***') : String(text));

let setsid = null;
const hasSetsid = () => (setsid ??= spawnSync('setsid', ['--version'], { stdio: 'ignore' }).status === 0);

/**
 * Runs one command with its output in `log`. The output goes to the file, never through a pipe: a process the command
 * started that keeps a pipe open would hold spawnSync past the deadline, so a hang could never be stopped and restarted.
 * At the deadline spawnSync stops the command; whatever it started is stopped too (killOrphans), so a restart never
 * competes with the attempt before it.
 */
export function spawnLogged(cmd, args, { cwd, env, timeoutMs, token, log, orphans = killOrphans }) {
  // Linux re-parents an orphan to init at once, so there the command runs in a process group of its own (setsid keeps
  // its PID) and the whole group is stopped; Windows keeps the dead parent's PID on the orphans (killOrphans)
  const group = process.platform !== 'win32' && hasSetsid();
  // one descriptor for the command's output, the read and the redacted rewrite: the path is never opened twice
  // (CodeQL js/file-system-race, ci-local run 2026-11-11)
  const fd = openSync(log, 'w+');
  try {
    const r = spawnSync(group ? 'setsid' : cmd, group ? [cmd, ...args] : args, { cwd, env, stdio: ['ignore', fd, fd], windowsHide: true, timeout: Math.max(1, timeoutMs) });
    const timedOut = r.error?.code === 'ETIMEDOUT';
    if (timedOut && r.pid) {
      if (group) { try { process.kill(-r.pid, 'SIGKILL'); } catch { /* the group is gone */ } } else orphans(r.pid);
    }
    const raw = Buffer.alloc(fstatSync(fd).size);
    readSync(fd, raw, 0, raw.length, 0);
    const output = redact(`${raw.toString('utf8')}${r.error ? `\n${r.error.message}` : ''}`, token);
    ftruncateSync(fd, 0);
    writeSync(fd, output, 0);
    return { exit: timedOut ? 124 : (r.status ?? 1), output, timedOut };
  } finally {
    closeSync(fd);
  }
}

const fileSha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

/** The tar that ships with Windows (System32), never one found on PATH. */
export function windowsTar(env = process.env) {
  return path.join(env.SystemRoot || env.windir || 'C:\\Windows', 'System32', 'tar.exe');
}

function gitleaksWindows(step, ctx, run) {
  const v = step.env.GITLEAKS_VERSION;
  if (!/^\d+\.\d+\.\d+$/.test(v)) return { exit: 1, output: `refused gitleaks version ${v}` };
  const tools = path.join(ctx.work, 'tools');
  mkdirSync(tools, { recursive: true });
  const zip = path.join(tools, `gitleaks_${v}_windows_x64.zip`);
  const sums = path.join(tools, `gitleaks_${v}_checksums.txt`);
  const url = `https://github.com/gitleaks/gitleaks/releases/download/v${v}`;
  for (const [file, name] of [[zip, path.basename(zip)], [sums, path.basename(sums)]]) {
    if (!existsSync(file)) { const r = run('curl', ['-fsSL', '--retry', '3', '-o', file, `${url}/${name}`]); if (r.exit) return r; }
  }
  const expected = readFileSync(sums, 'utf8').split('\n').find((l) => l.trim().endsWith(` ${path.basename(zip)}`))?.split(/\s+/)[0];
  const pinned = Object.hasOwn(GITLEAKS_WINDOWS_SHA256, v) ? GITLEAKS_WINDOWS_SHA256[v] : null;
  if (!pinned) return { exit: 1, output: `gitleaks ${v}: pin the SHA-256 of its Windows archive in GITLEAKS_WINDOWS_SHA256 first` };
  const actual = fileSha256(zip);
  if (!expected || expected !== actual || actual !== pinned) return { exit: 1, output: `gitleaks ${v}: the archive does not match the release checksum and the pinned SHA-256` };
  // Windows' own bsdtar reads zip archives; the GNU tar of Git for Windows, first on PATH in Git Bash, reads "C:" as a
  // remote host ("Cannot connect to C: resolve failed", ci-local run 2026-11-10)
  const ex = run(windowsTar(), ['-xf', zip, '-C', tools, 'gitleaks.exe']);
  if (ex.exit) return ex;
  if (existsSync(path.join(ctx.dir, '.gitleaks.toml'))) return { exit: 1, output: 'a .gitleaks.toml would replace the scanner rules (Task 970)' };
  return run(path.join(tools, 'gitleaks.exe'), ['git', '--redact', '--verbose', '--no-banner', '--exit-code=2', `--log-opts=--no-merges ${ctx.base}..${ctx.prHead}`, '.']);
}

/** zizmor from a private virtual environment, installed by uv only from a wheel whose digest is pinned in ZIZMOR. */
function zizmorPinned(ctx, run) {
  const tools = path.join(ctx.work, 'tools');
  mkdirSync(tools, { recursive: true });
  const req = path.join(tools, 'zizmor-requirements.txt');
  writeFileSync(req, `zizmor==${ZIZMOR.version} ${ZIZMOR.sha256.map((h) => `--hash=sha256:${h}`).join(' ')}\n`);
  const venv = path.join(tools, 'zizmor-venv');
  let r = run('uv', ['venv', '-q', venv]);
  if (r.exit) return r;
  r = run('uv', ['pip', 'install', '-q', '--python', venv, '--require-hashes', '--only-binary', ':all:', '-r', req]);
  if (r.exit) return { exit: r.exit, output: `zizmor ${ZIZMOR.version}: no wheel with a pinned digest installed\n${r.output}` };
  return run(path.join(venv, process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'zizmor.exe' : 'zizmor'), ['--offline', '.']);
}

function changedSince(base, dir) {
  return new Set(git(['diff', '--name-only', '-z', `${base}...HEAD`], dir).split('\0').filter(Boolean));
}

/**
 * A clean tree of the checkout's commit at `dest` (a detached worktree: the tracked files only), as CI's codeql job
 * checks it out. The shared checkout here also holds what earlier jobs installed and built: 131 375 files against 14 782
 * tracked (node_modules 114 655, .next 1 796), which CodeQL walked for 21.8 min before extracting the first file, so
 * its 30-minute job ran out of time (ci-local run 2026-11-11). Returns the function's result; the worktree is removed.
 */
export function withCleanTree(dir, dest, fn) {
  const drop = () => { git(['worktree', 'remove', '--force', dest], dir, { allowFail: true }); rmSync(dest, { recursive: true, force: true }); git(['worktree', 'prune'], dir, { allowFail: true }); };
  drop();
  git(['worktree', 'add', '--detach', dest, 'HEAD'], dir);
  try { return fn(dest); } finally { drop(); }
}

function codeqlAnalyze(init, ctx, run) {
  return withCleanTree(ctx.dir, path.join(ctx.work, 'codeql-src'), (src) => codeqlAnalyzeTree(init, { ...ctx, source: src }, run));
}

function codeqlAnalyzeTree(init, ctx, run) {
  const langs = String(init?.with?.languages ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const suite = init?.with?.queries ?? 'security-extended';
  if (!langs.length || !/^[\w-]+$/.test(suite)) return { exit: 1, output: 'codeql: the init step names no language or an unsupported query suite' };
  const changed = changedSince(ctx.base, ctx.dir);
  let output = '';
  const hits = [];
  for (const lang of langs) {
    const pack = lang === 'javascript-typescript' ? 'javascript' : lang;
    if (!/^[a-z]+$/.test(pack)) return { exit: 1, output: `codeql: unsupported language ${lang}` };
    const db = path.join(ctx.work, `codeql-${pack}`);
    rmSync(db, { recursive: true, force: true });
    let r = run('gh', ['codeql', 'database', 'create', db, `--language=${pack}`, '--build-mode=none', '--source-root', ctx.source, '--overwrite']);
    output += r.output;
    if (r.exit) return { exit: r.exit, output };
    const sarif = path.join(ctx.work, `codeql-${pack}.sarif`);
    const extra = pack === 'javascript' && existsSync(path.join(ctx.source, '.github/codeql/extensions'))
      ? ['--additional-packs', path.join(ctx.source, '.github/codeql/extensions'), '--model-packs', 'lero-al/javascript-models'] : [];
    r = run('gh', ['codeql', 'database', 'analyze', db, `codeql/${pack}-queries:codeql-suites/${pack}-${suite}.qls`, '--download', '--format=sarif-latest', `--output=${sarif}`, ...extra]);
    output += r.output;
    if (r.exit) return { exit: r.exit, output };
    for (const runEntry of JSON.parse(readFileSync(sarif, 'utf8')).runs ?? []) {
      for (const res of runEntry.results ?? []) {
        const loc = res.locations?.[0]?.physicalLocation;
        const uri = loc?.artifactLocation?.uri;
        if (uri && changed.has(uri)) hits.push({ rule: res.ruleId, path: uri, line: loc.region?.startLine ?? '?' });
      }
    }
  }
  // GitHub reports what is new against main: an alert main already has (open, dismissed or fixed) for the same rule and
  // file is not new. Without main's alerts (no access) every hit counts, so the check stays strict.
  const base = mainAlerts(ctx.root);
  const fresh = newAlerts(hits, base.alerts);
  output += `\nalerts in the files the change touches: ${hits.length}; on main already (${base.note}): ${hits.length - fresh.length}; new: ${fresh.length}\n${fresh.map((h) => `${h.rule} ${h.path}:${h.line}`).join('\n')}`;
  return { exit: fresh.length ? 1 : 0, output };
}

/** Code scanning alerts of main, every state: { alerts: [{ rule, path }], note }. */
function mainAlerts(root) {
  const r = spawnSync('gh', ['api', '--paginate', 'repos/{owner}/{repo}/code-scanning/alerts?ref=refs/heads/main&per_page=100', '--jq', '.[] | [.rule.id, .most_recent_instance.location.path] | @tsv'], { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) return { alerts: [], note: 'main alerts unreadable, none subtracted' };
  const alerts = r.stdout.split('\n').filter(Boolean).map((l) => { const [rule, p] = l.split('\t'); return { rule, path: p }; });
  return { alerts, note: `${alerts.length} alert(s) of main read` };
}

/** The hits main does not already have: per rule and file, those beyond main's count. */
export function newAlerts(hits, baseline) {
  const left = new Map();
  for (const a of baseline) left.set(`${a.rule}\0${a.path}`, (left.get(`${a.rule}\0${a.path}`) ?? 0) + 1);
  const out = [];
  for (const h of hits) {
    const k = `${h.rule}\0${h.path}`;
    if ((left.get(k) ?? 0) > 0) left.set(k, left.get(k) - 1);
    else out.push(h);
  }
  return out;
}

/**
 * Where the checkouts live: the user's own cache directory. Not the shared system temp directory, where another local
 * user could plant or read files (CodeQL js/insecure-temporary-file), and not under a `.git` directory, whose paths Vite
 * refuses to serve (`server.fs.deny` holds `**\/.git/**`): with the checkout there, 234 of 385 unit test files failed to
 * load (ci-local run 2026-11-10).
 */
export function workRoot(env = process.env, home = homedir()) {
  const base = env.CI_LOCAL_HOME || (process.platform === 'win32' && env.LOCALAPPDATA ? env.LOCALAPPDATA : path.join(home, '.cache'));
  return path.join(base, 'lero-al-ci-local');
}

/** The working directory of one run (the checkout is its `repo`); the command line takes it from here only. */
export function checkoutDir(id, env = process.env, home = homedir()) {
  if (!/^[0-9a-f]{12}$/.test(id)) throw new Error(`refused run id ${id}`);
  return path.join(workRoot(env, home), id);
}

/** Steps that start a real browser (the same list as ci-workflow.test.mjs). */
export const BROWSER = /product-gates\.mjs|check:hydration|check-locale-leak|check:homepage-grid|check:click-shield|check:card-track/;
/** Step kinds that start a process: watched, and restarted when the process runs past its deadline. */
export const PROCESS_KINDS = new Set(['run', 'gitleaks', 'codeql-analyze', 'zizmor']);
// Each CI job gets a fresh runner; here they share one machine. A browser job right after another left thousands of
// sockets in TIME_WAIT, and Windows ran out of ports (homepage-grid: net::ERR_NO_BUFFER_SPACE, 1 of 3 reruns on
// 2026-11-10). Owner decisions 2026-11-10: prevent it, never retry; "wait until the port is free" and then go on, with
// no deadline that would fail the run for want of ports. Before a browser job the run monitors the TCP sockets that hold
// a local port (every state but LISTEN) and starts the job only when fewer than PORTS_MAX are in use. A socket in
// TIME_WAIT belongs to no process and the system frees it (120 s by default on Windows), so the count falls unless
// something keeps opening connections; the monitor logs the count and its trend every PORTS_REPORT_MS and, when the
// count has not fallen for PORTS_STALL_MS, the processes that hold the most connections, and keeps waiting.
// the port count, the holders and the limit live in load-watch.mjs, shared with the timeout diagnosis
export { PORTS_MAX, connectionHolders, portsInUse };
export const PORTS_REPORT_MS = 30_000;
export const PORTS_STALL_MS = 10 * 60_000;

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Waits until fewer than `max` ports are in use, however long that takes; reports progress and stalls on the way. */
export function waitForPorts({ count = portsInUse, holders = connectionHolders, max = PORTS_MAX, sleep = pause, step = 5000, report = PORTS_REPORT_MS, stall = PORTS_STALL_MS, log = () => {} } = {}) {
  let waited = 0;
  let n = count();
  let lowest = n;
  let sinceFall = 0;
  while (n !== null && n >= max) {
    sleep(step);
    waited += step;
    n = count();
    if (n !== null && n < lowest) { lowest = n; sinceFall = 0; } else sinceFall += step;
    if (waited % report === 0) log(`    ports in use: ${n} (limit ${max}), waited ${Math.round(waited / 1000)} s, ${sinceFall ? `no fall for ${Math.round(sinceFall / 1000)} s` : 'falling'}`);
    if (sinceFall && sinceFall % stall === 0) log(`    the count has not fallen for ${Math.round(sinceFall / 60_000)} min; most connections: ${holders().join('; ') || 'unknown'}; still waiting`);
  }
  return { ports: n, waited };
}

/** Runs the plan in the checkout; returns one result per job instance. */
// Owner, 2026-11-11: "track every stage of CI so as not to waste time if CI fails at one of them. There is no point in
// continuing the check once something is wrong; the problem has to be fixed at once." The first job that fails (after
// its restarts) or is unverified stops the run: every job after it is NOT RUN, named with the job that stopped it, and
// the run fails. A run is never a pass with jobs it did not run.
export const NOT_RUN = 'NOT RUN';
export const HELD = 'HELD';
/** The only job a run may hold: it depends on the review's verdict, not on the files (pipeline.mjs, review phase). */
export const HOLDABLE = new Set(['owasp-gate']);
const HELD_REASON = 'held: the task is under revision (its last verdict is NEEDS REVISION); this job runs at the approving review, the handoff and in CI';

/** The --hold job ids, refused unless each is HOLDABLE. */
export function holdJobs(ids) {
  const bad = ids.filter((id) => !HOLDABLE.has(id));
  if (bad.length) throw new Error(`refused --hold ${bad.join(', ')}: only ${[...HOLDABLE].join(', ')} can be held`);
  return new Set(ids);
}

/**
 * Runs the plan in the checkout; returns one result per job instance. `sweep` stops the checks an earlier run left
 * (load-watch.mjs sweepStrays): once at the start and again before each browser job. The command line passes the real
 * one; the default does nothing, so a test never stops a run on the developer's machine.
 */
export function runPlan(plan, ctx, { log = () => {}, minuteMs = 60_000, ports = waitForPorts, watch = startWatch, calm = waitForCalm, retries = MAX_RETRIES, failFast = true, sweep = () => [], hold = new Set() } = {}) {
  holdJobs([...hold]);
  const bash = bashPath();
  const results = [];
  const done = new Map();
  // npm ci leaves one node_modules per checkout: a later install is skipped only when the last one was the same command
  // (a job's `npm ci --ignore-scripts` must not stand in for another job's `npm ci`); a browser install is kept.
  let lastInstall = null;
  let browser = false;
  const baseEnv = { ...process.env };
  for (const k of ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT']) delete baseEnv[k]; // the token reaches only the steps that name it (T2)
  mkdirSync(path.join(ctx.work, 'logs'), { recursive: true });
  mkdirSync(path.join(ctx.work, 'runner-temp'), { recursive: true });
  sweep({ log });
  let stoppedBy = null;
  for (const job of plan) {
    const tag = `${job.id}${Object.keys(job.matrix ?? {}).length ? `-${Object.values(job.matrix).join('-')}` : ''}`;
    if (stoppedBy) { results.push({ job: tag, name: job.name, status: NOT_RUN, reason: `the run stopped at ${stoppedBy}, which did not pass: fix it first`, steps: [] }); log(`${NOT_RUN}\t${job.name}`); continue; }
    if (hold.has(job.id)) { results.push({ job: tag, name: job.name, status: HELD, reason: HELD_REASON, steps: [] }); done.set(job.id, HELD); log(`${HELD}\t${job.name}\t${HELD_REASON}`); continue; }
    if (job.status !== 'run') {
      results.push({ job: tag, name: job.name, status: job.status, reason: job.reason, steps: [] }); done.set(job.id, job.status); log(`${job.status}\t${job.name}\t${job.reason}`);
      if (failFast && job.status === 'UNVERIFIED') stoppedBy = tag;
      continue;
    }
    const blocked = job.needs.filter((n) => done.get(n) === 'FAIL' || done.get(n) === 'UNVERIFIED');
    if (blocked.length) { results.push({ job: tag, name: job.name, status: 'FAIL', reason: `needs ${blocked.join(', ')}, which did not pass`, steps: [] }); done.set(job.id, 'FAIL'); if (failFast) stoppedBy = tag; continue; }
    if (job.steps.some((s) => s.needsResults)) {
      const ciOnly = job.needs.filter((n) => done.get(n) === 'CI-ONLY');
      if (ciOnly.length) { results.push({ job: tag, name: job.name, status: 'CI-ONLY', reason: `aggregates jobs that run only in CI: ${ciOnly.join(', ')}`, steps: [] }); done.set(job.id, 'CI-ONLY'); log(`CI-ONLY	${job.name}`); continue; }
      const held = job.needs.filter((n) => done.get(n) === HELD);
      if (held.length) { results.push({ job: tag, name: job.name, status: HELD, reason: `aggregates the held job(s) ${held.join(', ')}`, steps: [] }); done.set(job.id, HELD); log(`${HELD}\t${job.name}`); continue; }
      const list = job.needs.map((n) => (done.get(n) === 'PASS' ? 'success' : 'failure')).join(' ');
      for (const s of job.steps) for (const k of Object.keys(s.env)) s.env[k] = s.env[k].split(NEEDS_RESULTS).join(list);
    }
    if (job.steps.some((s) => s.kind === 'run' && BROWSER.test(s.script ?? ''))) {
      sweep({ log });
      const p = ports({ log });
      log(`  ${tag}: ${p.ports ?? 'unknown'} port(s) in use${p.waited ? ` after waiting ${Math.round(p.waited / 1000)} s` : ''}; the browser job starts`);
    }
    let deadline = Date.now() + job.timeoutMinutes * minuteMs;
    const steps = [];
    let failed = false;
    let init = null;
    let ciOnlyRest = null;
    for (const step of job.steps) {
      if ((step.when === 'success' && failed) || (step.when === 'failure' && !failed)) continue;
      const env = { ...baseEnv, ...job.env, ...step.env, CI: 'true', GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: ctx.event, GITHUB_SHA: ctx.merge, GITHUB_WORKSPACE: ctx.dir, RUNNER_TEMP: path.join(ctx.work, 'runner-temp'), RUNNER_OS: process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux' };
      for (const k of step.tokenEnv) env[k] = ctx.token ?? '';
      const logFile = path.join(ctx.work, 'logs', `${tag}--${String(step.index).padStart(2, '0')}.log`);
      let stepDeadline = deadline;
      const run = (cmd, args) => spawnLogged(cmd, args, { cwd: ctx.dir, env, timeoutMs: stepDeadline - Date.now(), token: ctx.token, log: logFile });
      const key = step.kind === 'run' || step.kind === 'gitleaks' ? step.script.trim() : '';
      const install = step.kind === 'run' && /^npm ci( --ignore-scripts)?$/.test(key);
      const pw = step.kind === 'run' && /^npx playwright install chromium( --with-deps)?$/.test(key);
      /** One attempt of the step. */
      const once = () => {
        if (step.kind === 'skip') return { exit: 0, output: 'handled by the checkout' };
        if (step.kind === 'node-version') {
          const want = String(step.with?.['node-version'] ?? '');
          return process.version === `v${want}` ? { exit: 0, output: `node ${process.version}` } : { exit: 1, output: `local node ${process.version}, CI uses v${want}` };
        }
        if (step.kind === 'codeql-init') { init = step; return { exit: 0, output: `languages ${step.with?.languages}` }; }
        if (step.kind === 'codeql-analyze') return codeqlAnalyze(init, ctx, run);
        if (step.kind === 'zizmor') {
          // The owner's token is never handed to a third-party tool (Secrets Management, least privilege): the offline audits
          // run here; the online ones run in CI with the job's read-only token, so the job is CI-only once these pass.
          const z = zizmorPinned(ctx, run);
          if (z.exit === 0) ciOnlyRest = `zizmor ${ZIZMOR.version} offline audits passed; the online audits need a GitHub token and run only in CI`;
          return z;
        }
        if (step.kind === 'gitleaks' && process.platform === 'win32') return gitleaksWindows(step, ctx, run);
        if (step.kind === 'run' || step.kind === 'gitleaks') {
          if ((install && lastInstall === key) || (pw && browser)) return { exit: 0, output: `already done in this checkout: ${key}` };
          const script = path.join(ctx.work, 'runner-temp', `${tag}-${step.index}.sh`);
          writeFileSync(script, step.script);
          const flags = step.shell === 'bash' ? ['--noprofile', '--norc', '-eo', 'pipefail'] : ['-e'];
          return run(bash, [...flags, script]);
        }
        return { exit: 1, output: `no local equivalent: ${step.reason ?? step.kind}` };
      };
      const attempts = [];
      const t0 = Date.now();
      let r;
      if (deadline - Date.now() <= 0) r = { exit: 124, output: `job timeout-minutes ${job.timeoutMinutes} exceeded`, timedOut: true };
      else {
        // Every step that starts a process is watched (load-watch.mjs). A process stopped at its deadline hung or was
        // starved, whatever its kind (CodeQL's analyze stopped at query 104 of 105 after 30 min, ci-local run of
        // 2026-11-11; owner: "if the process hangs, it must be restarted automatically"): it is diagnosed and restarted
        // with the job's own time again. A browser step is restarted also on a timeout its own output reports.
        const isBrowser = step.kind === 'run' && BROWSER.test(step.script);
        const spawns = PROCESS_KINDS.has(step.kind);
        for (let a = 0; ; a++) {
          const watcher = spawns ? watch(path.join(ctx.work, 'logs', `${tag}--${String(step.index).padStart(2, '0')}.samples-${a + 1}.jsonl`)) : null;
          r = once();
          const samples = watcher ? watcher.stop() : [];
          if (r.exit === 0 || !(r.timedOut || isBrowser)) { if (attempts.length) attempts.push({ attempt: a + 1, exit: r.exit }); break; }
          const d = diagnose(r.output, samples);
          attempts.push({ attempt: a + 1, exit: r.exit, cause: d.cause, evidence: d.evidence });
          if (!d.timeout || a >= retries) break;
          writeFileSync(logFile.replace(/\.log$/, `.attempt-${a + 1}.log`), redact(r.output, ctx.token));
          log(`  ${tag} #${step.index}: timed out, cause ${d.cause} (${d.evidence}); restart ${a + 1} of ${retries}`);
          if (d.cause === 'load') calm({ log });
          else if (d.cause === 'ports') ports({ log });
          stepDeadline = Date.now() + job.timeoutMinutes * minuteMs; // a restart gets the job's own time again
          deadline = Math.max(deadline, stepDeadline); // and the steps after it keep theirs
        }
        if (install) lastInstall = r.exit === 0 ? key : null;
        if (pw && r.exit === 0) browser = true;
      }
      // the step's whole output: a step of several calls (CodeQL, gitleaks, zizmor) keeps its summary, not only its last call
      writeFileSync(logFile, redact(r.output, ctx.token));
      steps.push({ index: step.index, name: step.name, exit: r.exit, ms: Date.now() - t0, log: logFile, timedOut: !!r.timedOut, ...(attempts.length ? { attempts } : {}) });
      log(`  ${tag} #${step.index} ${step.name}: exit ${r.exit}`);
      if (r.exit !== 0) failed = true;
    }
    const status = failed ? 'FAIL' : ciOnlyRest ? 'CI-ONLY' : 'PASS';
    done.set(job.id, done.get(job.id) === 'FAIL' ? 'FAIL' : status);
    // every diagnosed retry is named in the result: a pass after a retry is never a silent pass
    const retried = steps.filter((s) => s.attempts?.length > 1 || s.attempts?.some((x) => x.cause)).map((s) => ({ step: s.index, causes: s.attempts.filter((x) => x.cause).map((x) => x.cause) }));
    const reproducible = failed && retried.some((x) => x.causes.length > retries) ? `the timeout repeated on every attempt (${retried.flatMap((x) => x.causes).join(', ')}): reproducible, not the machine` : null;
    results.push({ job: tag, name: job.name, status, steps, ...(ciOnlyRest && !failed ? { reason: ciOnlyRest } : {}), ...(reproducible ? { reason: reproducible } : {}), ...(retried.length ? { retried } : {}) });
    log(`${status}\t${job.name}`);
    if (failFast && status === 'FAIL') stoppedBy = tag;
  }
  return results;
}

export function summaryLine(fp, results) {
  const n = (s) => results.filter((r) => r.status === s);
  const ciOnly = n('CI-ONLY').map((r) => r.job);
  const held = n(HELD).map((r) => r.job);
  const retried = results.filter((r) => r.retried?.length).map((r) => `${r.job} (${r.retried.flatMap((x) => x.causes).join(', ')}, ${r.status})`);
  const stop = n(NOT_RUN)[0]?.reason.match(/stopped at (\S+),/)?.[1];
  return `ci-local ${fp}: ${n('PASS').length} passed, ${n('FAIL').length} failed, ${n('UNVERIFIED').length} unverified, ${n(NOT_RUN).length} not run${stop ? ` (stopped at ${stop})` : ''}; CI-only: ${ciOnly.length ? ciOnly.join(', ') : 'none'}; ${held.length ? `held (under revision): ${held.join(', ')}; ` : ''}retried after a diagnosed timeout: ${retried.length ? retried.join('; ') : 'none'}`;
}

if (isEntryPoint(import.meta.url)) {
  const args = process.argv.slice(2);
  const take = (flag) => { const out = []; for (let i = args.indexOf(flag); i >= 0; i = args.indexOf(flag)) out.push(args.splice(i, 2)[1]); return out; };
  const only = new Set(take('--job'));
  let hold;
  try { hold = holdJobs(take('--hold')); } catch (e) { console.error(`ci-local: ${e.message}`); process.exit(2); }
  const workflow = take('--workflow')[0] ?? WORKFLOW;
  const keep = args.includes('--keep');
  const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || ROOT);
  try {
    const tokenRun = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8', windowsHide: true });
    const token = tokenRun.status === 0 ? tokenRun.stdout.trim() : null;
    const id = createHash('sha256').update(`${root}\n${git(['rev-parse', 'HEAD'], root)}\n${JSON.stringify(overlayOf(root))}\n${Date.now()}`).digest('hex').slice(0, 12);
    const work = checkoutDir(id);
    const dir = path.join(work, 'repo');
    // every progress line also goes, time-stamped, to <work>/run.log: the pipeline keeps only a hash and the tail of this
    // output, and a failure has to be read with the port counts and step times that came before it
    mkdirSync(work, { recursive: true });
    const say = (m) => { console.log(m); appendFileSync(path.join(work, 'run.log'), `${new Date().toISOString()} ${redact(m, token)}\n`); };
    say(`ci-local: checkout in ${dir}`);
    const ctx = { ...prepareCheckout(root, dir), token, work, dir, root };
    say(`ci-local: base ${ctx.base.slice(0, 9)}, head ${ctx.prHead.slice(0, 9)}, merge ${ctx.merge.slice(0, 9)}, ${ctx.files.length} overlaid file(s)`);
    const doc = require('js-yaml').load(readFileSync(path.join(dir, workflow), 'utf8'));
    let plan = planWorkflow(doc, ctx);
    if (only.size) plan = plan.filter((j) => only.has(j.id));
    const results = runPlan(plan, ctx, { log: say, sweep: sweepStrays, hold });
    writeFileSync(path.join(work, 'report.json'), JSON.stringify({ ctx: { ...ctx, token: undefined }, results }, null, 2));
    for (const r of results.filter((x) => x.status === 'FAIL')) {
      const s = r.steps.find((x) => x.exit !== 0);
      console.log(`\nFAIL ${r.name}${s ? ` — step #${s.index} ${s.name}, exit ${s.exit}, log ${s.log}` : ` — ${r.reason}`}`);
      if (s) console.log(readFileSync(s.log, 'utf8').split('\n').slice(-30).join('\n'));
    }
    console.log(`\n${summaryLine(id, results)}${only.size ? ` (jobs: ${[...only].join(', ')})` : ''}`);
    // on success the checkout and the CodeQL databases go (gigabytes); the logs and report.json stay
    if (!keep && results.every((r) => r.status !== 'FAIL')) for (const d of ['repo', 'codeql-javascript', 'codeql-actions']) rmSync(path.join(work, d), { recursive: true, force: true });
    const bad = results.some((r) => r.status === 'FAIL' || r.status === 'UNVERIFIED' || r.status === NOT_RUN) || (only.size > 0);
    process.exit(bad ? 1 : 0);
  } catch (e) {
    console.error(`ci-local: ${e.message}`);
    process.exit(2);
  }
}

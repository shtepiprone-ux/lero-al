#!/usr/bin/env node
// Change report for a pull request (governance reset 2026-11-06). OWASP basis: Secure Coding with AI §"reviewing
// AI-generated pull requests" (flag lockfile, CI, configuration, test and out-of-scope changes; flag deleted tests and
// weakened assertions; rules files are security-critical configuration), NPM Security and Vulnerable Dependency
// Management (verify a suggested package exists and is not brand new; the lockfile resolves only from the registry).
//
//   node scripts/quality/change-report.mjs <base> <head>
//
// Prints a Markdown report (also to $GITHUB_STEP_SUMMARY). Exit 1 when a hard rule fails:
//   - product code under src/ is added or changed and no test file is added or changed;
//   - a kickoff with a review verdict names a test that does not exist, or adds or changes an acceptance criterion
//     whose named test the same change neither adds nor changes (ac-tests.mjs);
//   - a dependency added to package.json does not exist on npm, or its first release is younger than 30 days;
//   - a lockfile entry resolves outside https://registry.npmjs.org/ or has no integrity hash;
//   - a version the lockfile did not resolve before, transitive ones included, is younger than 14 days (unless pinned
//     exactly in package.json `overrides`).
// Everything else is a flag for the human reviewer, who answers it in the review (secure-code-review.md).

import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rangeFindings } from './ac-tests.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DAY = 24 * 60 * 60 * 1000;
export const MIN_PACKAGE_AGE_DAYS = 30;
export const MIN_VERSION_AGE_DAYS = 14;

/** Paths whose change needs the owner's explicit attention: policy, agents, CI, supply chain, security config. */
export const SENSITIVE = [
  ['Agent rules, skills, hooks and settings', /^(\.claude\/|CLAUDE\.md$|AGENTS\.md$|docs\/agent-contract\.md$)/],
  ['CI, repository settings and quality scripts', /^(\.github\/|\.githooks\/|scripts\/quality\/)/],
  ['Dependencies and package manager', /^(package\.json|package-lock\.json|\.npmrc|\.nvmrc)$/],
  ['Lint, type and test configuration', /^(eslint\.config\.mjs|tsconfig\.json|vitest(\.[a-z]+)?\.config\.ts|\.gitignore|scripts\/mojibake-allowlist\.json)$/],
  ['Security-relevant runtime configuration', /^(next\.config\.ts|(src\/)?(middleware|proxy|instrumentation)\.ts|sentry\.[a-z]+\.config\.ts|vercel\.json)$/],
  ['Database schema and policies', /^supabase\/(migrations|policies|schema)\//],
  // Secure Coding with AI §8: "Require human review of all AI-generated test modifications" for the security-critical
  // tests (authentication, authorization, input validation); the owner is the human reviewer.
  ['Security tests (authorization, authentication, input validation)', /\.(security|integration)\.test\.(ts|tsx)$|^src\/__tests__\/security\/|^src\/tests\/authz-matrix\.json$/],
];
const TEST_FILE = /(\.test|\.spec)\.(ts|tsx|js|jsx|mjs|cjs)$|(^|\/)__tests__\//;

export function classify(paths) {
  const out = new Map();
  for (const p of paths) {
    const hit = SENSITIVE.find(([, re]) => re.test(p));
    if (hit) out.set(hit[0], [...(out.get(hit[0]) ?? []), p]);
  }
  return out;
}

const count = (text, re) => (text.match(re) ?? []).length;

const SOURCE_CODE = /^src\/.+\.(ts|tsx)$/;
const NOT_SOURCE_CODE = /(\.test|\.spec|\.stories)\.(ts|tsx)$|\.d\.ts$|(^|\/)(__tests__|__mocks__)\//;
const ANY_TEST = /(\.test|\.spec)\.(ts|tsx|mts|mjs|js)$|\.stories\.tsx$|(^|\/)__tests__\//;

/** Product source files changed (added or modified) while no test file was added or modified — owner, 2026-11-06:
 *  "a task done → a test for it; a task changed → its test updated". */
export function untestedSourceChange(changes) {
  const source = changes.filter((c) => c.code !== 'D' && SOURCE_CODE.test(c.path) && !NOT_SOURCE_CODE.test(c.path)).map((c) => c.path);
  const tests = changes.filter((c) => c.code !== 'D' && ANY_TEST.test(c.path));
  return source.length && !tests.length ? source : [];
}

/** Signals that a test file asserts less than before. */
export function testWeakening(before, after) {
  const flags = [];
  const cases = /\b(?:it|test)(?:\.(?:each\([^)]*\)|skip|only|todo|concurrent))?\s*\(/g;
  const expects = /\bexpect(?:\.soft)?\s*\(/g;
  const disabled = /\b(?:it|test|describe)\.(?:skip|todo|only)\b|\bx(?:it|describe)\s*\(/g;
  const [c0, c1] = [count(before, cases), count(after, cases)];
  const [e0, e1] = [count(before, expects), count(after, expects)];
  const [d0, d1] = [count(before, disabled), count(after, disabled)];
  if (c1 < c0) flags.push(`test cases ${c0} → ${c1}`);
  if (e1 < e0) flags.push(`assertions ${e0} → ${e1}`);
  if (d1 > d0) flags.push(`skip/todo/only ${d0} → ${d1}`);
  return flags;
}

/** Lockfile entries that resolve outside the npm registry or carry no integrity hash. */
export function lockfileProblems(lock) {
  const out = [];
  for (const [key, entry] of Object.entries(lock?.packages ?? {})) {
    if (!key || entry.link || !entry.resolved) continue;
    if (!entry.resolved.startsWith('https://registry.npmjs.org/')) out.push(`${key}: resolved from ${entry.resolved}`);
    else if (!entry.integrity) out.push(`${key}: no integrity hash`);
  }
  return out;
}

/** Every `name@version` the head lockfile resolves that the base lockfile resolved nowhere: the versions a change brings
 *  in, transitive ones included (Task 939 review 1: `ws@8.22.2` entered three hours after its release, through a
 *  range of `storybook`, and only the direct dependencies were aged). */
export function newLockfileVersions(baseLock, headLock) {
  const entries = (lock) => Object.entries(lock?.packages ?? {})
    .filter(([key, entry]) => key && !entry.link && entry.version)
    .map(([key, entry]) => ({ name: entry.name ?? key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length), version: entry.version }));
  const before = new Set(entries(baseLock).map((e) => `${e.name}@${e.version}`));
  const seen = new Set();
  return entries(headLock).filter((e) => {
    const id = `${e.name}@${e.version}`;
    if (before.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
}

/** Versions released less than MIN_VERSION_AGE_DAYS before `now` (NPM Security: vet what you install; a version
 *  published hours ago has had no time to be reported). A version pinned exactly in package.json `overrides` is the
 *  owner's visible decision (a security fix) and is reported, not refused. `timesOf(name)` is `npm view <name> time`. */
export function youngLockfileVersions(versions, timesOf, overrides = {}, now = Date.now()) {
  const failures = [];
  for (const { name, version } of versions) {
    const released = timesOf(name)?.[version];
    if (!released) { failures.push(`${name}@${version}: no release time on npm`); continue; }
    const age = Math.floor((now - Date.parse(released)) / DAY);
    if (age < MIN_VERSION_AGE_DAYS && overrides[name] !== version) {
      failures.push(`${name}@${version} was released ${age} day(s) ago (< ${MIN_VERSION_AGE_DAYS}); regenerate the lockfile with npm install --before=<a date ${MIN_VERSION_AGE_DAYS} days back>`);
    }
  }
  return failures;
}

const DEP_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const deps = (pkg) => Object.assign({}, ...DEP_FIELDS.map((f) => pkg?.[f] ?? {}));

/** Names added to package.json, and names whose requested range changed. */
export function dependencyChanges(basePkg, headPkg) {
  const [b, h] = [deps(basePkg), deps(headPkg)];
  return {
    added: Object.keys(h).filter((n) => !(n in b)).sort(),
    changed: Object.keys(h).filter((n) => n in b && b[n] !== h[n]).sort(),
  };
}

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || '').trim()}`);
  return r.stdout;
}
const show = (rev, p) => {
  const r = spawnSync('git', ['show', `${rev}:${p}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  return r.status === 0 ? r.stdout : null;
};
const json = (text) => { try { return text ? JSON.parse(text) : null; } catch { return null; } };

/** An npm package name (scope optional). Names come from a pull request's package.json and lockfile and reach
 *  `npm view` through a shell on Windows, so anything else is never passed on (OS Command Injection Defense). */
export function isNpmName(name) {
  return typeof name === 'string' && name.length <= 214 && /^(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/i.test(name);
}

function npmTimes(name) {
  if (!isNpmName(name)) return null;
  const isWin = process.platform === 'win32';
  const r = spawnSync(isWin ? 'npm.cmd' : 'npm', ['view', name, 'time', '--json'], { encoding: 'utf8', shell: isWin, windowsHide: true });
  return r.status === 0 ? json(r.stdout) : null;
}

export function run(base, head, now = Date.now()) {
  const lines = ['## Change report', '', `Base \`${base}\`, head \`${head}\`.`, ''];
  const failures = [];
  const status = git(['diff', '--name-status', '-z', `${base}...${head}`]).split('\0').filter(Boolean);
  const changes = [];
  for (let i = 0; i < status.length;) {
    const code = status[i++];
    if (code.startsWith('R') || code.startsWith('C')) { const from = status[i++]; changes.push({ code: code[0], path: status[i++], from }); }
    else changes.push({ code, path: status[i++] });
  }
  lines.push(`${changes.length} changed path(s): ${['A', 'M', 'D', 'R'].map((c) => `${c} ${changes.filter((x) => x.code === c).length}`).join(', ')}.`, '');

  const sensitive = classify(changes.map((c) => c.path));
  lines.push('### Sensitive paths (the owner reads every line of these)', '');
  if (!sensitive.size) lines.push('None.');
  for (const [group, list] of sensitive) lines.push(`- **${group}** (${list.length}): ${list.slice(0, 40).map((p) => `\`${p}\``).join(', ')}${list.length > 40 ? ' …' : ''}`);
  lines.push('');

  lines.push('### Tests deleted or weakened', '');
  const testFlags = [];
  for (const c of changes.filter((x) => TEST_FILE.test(x.from ?? x.path))) {
    if (c.code === 'D') { testFlags.push(`- \`${c.path}\` deleted`); continue; }
    if (c.code !== 'M' && c.code !== 'R') continue;
    const flags = testWeakening(show(base, c.from ?? c.path) ?? '', show(head, c.path) ?? '');
    if (flags.length) testFlags.push(`- \`${c.path}\`: ${flags.join('; ')}`);
  }
  lines.push(...(testFlags.length ? testFlags : ['None.']), '');
  const untested = untestedSourceChange(changes);
  if (untested.length) failures.push(`product code changed with no test added or updated: ${untested.slice(0, 20).join(', ')}${untested.length > 20 ? ' …' : ''}`);
  for (const f of rangeFindings(base, head, changes)) failures.push(`acceptance criterion: ${f}`);

  lines.push('### Dependencies', '');
  const { added, changed } = dependencyChanges(json(show(base, 'package.json')), json(show(head, 'package.json')));
  const headLock = json(show(head, 'package-lock.json'));
  if (!added.length && !changed.length) lines.push('No dependency added or changed in package.json.');
  for (const name of added) {
    const times = npmTimes(name);
    if (!times) { failures.push(`${name} does not exist on npm (possible hallucinated or typo-squatted package)`); continue; }
    const age = Math.floor((now - Date.parse(times.created)) / DAY);
    if (age < MIN_PACKAGE_AGE_DAYS) failures.push(`${name} was first published ${age} day(s) ago (< ${MIN_PACKAGE_AGE_DAYS})`);
    else lines.push(`- added \`${name}\`: first published ${age} days ago`);
  }
  for (const name of [...added, ...changed]) {
    const version = headLock?.packages?.[`node_modules/${name}`]?.version;
    const times = version ? npmTimes(name) : null;
    if (!version || !times?.[version]) continue;
    const age = Math.floor((now - Date.parse(times[version])) / DAY);
    lines.push(`- \`${name}@${version}\`: released ${age} days ago${age < MIN_VERSION_AGE_DAYS ? ` — **younger than ${MIN_VERSION_AGE_DAYS} days; accept only for a security fix**` : ''}`);
  }
  const lockChanged = changes.some((c) => c.path === 'package-lock.json');
  const pkgChanged = changes.some((c) => c.path === 'package.json');
  if (lockChanged && !pkgChanged) lines.push('- **package-lock.json changed without package.json** — check every resolved version.');
  if (headLock) for (const p of lockfileProblems(headLock)) failures.push(`lockfile: ${p}`);
  if (lockChanged && headLock) {
    const fresh = newLockfileVersions(json(show(base, 'package-lock.json')), headLock);
    const cache = new Map();
    const timesOf = (name) => { if (!cache.has(name)) cache.set(name, npmTimes(name)); return cache.get(name); };
    lines.push(`- the lockfile brings in ${fresh.length} version(s) it did not resolve before; each is at least ${MIN_VERSION_AGE_DAYS} days old or refused`);
    const overrides = Object.fromEntries(Object.entries(json(show(head, 'package.json'))?.overrides ?? {}).filter(([, v]) => typeof v === 'string'));
    for (const f of youngLockfileVersions(fresh, timesOf, overrides, now)) failures.push(`lockfile: ${f}`);
  }
  lines.push('');

  lines.push('### Hard failures', '', ...(failures.length ? failures.map((f) => `- ${f}`) : ['None.']), '');
  return { text: lines.join('\n'), failures };
}

/** `--lockfile-age <base>`: the working-tree lockfile against `<base>:package-lock.json`, before anything is committed
 *  (an executor may not commit; the same check runs on the pull request through `run`). */
export function lockfileAge(base, now = Date.now()) {
  const head = json(readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
  const fresh = newLockfileVersions(json(show(base, 'package-lock.json')), head);
  const overrides = Object.fromEntries(Object.entries(json(readFileSync(path.join(ROOT, 'package.json'), 'utf8'))?.overrides ?? {}).filter(([, v]) => typeof v === 'string'));
  return { count: fresh.length, failures: youngLockfileVersions(fresh, npmTimes, overrides, now) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv[2] === '--lockfile-age') {
  const base = process.argv[3] ?? 'HEAD';
  const { count, failures } = lockfileAge(base);
  console.log(`lockfile-age: ${count} version(s) the working-tree lockfile brings in against ${base}; ${failures.length} younger than ${MIN_VERSION_AGE_DAYS} days`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(failures.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv[2] !== '--lockfile-age') {
  const [base, head = 'HEAD'] = process.argv.slice(2);
  if (!base) {
    console.error('usage: change-report.mjs <base> [head]');
    process.exit(2);
  }
  let result;
  try {
    result = run(base, head);
  } catch (e) {
    console.error(`change-report could not run: ${e.message}`);
    process.exit(2);
  }
  console.log(result.text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${result.text}\n`);
  process.exit(result.failures.length ? 1 : 0);
}

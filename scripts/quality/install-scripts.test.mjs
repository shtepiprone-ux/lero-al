// Install scripts stay off (Task 947 AC4; OWASP NPM Security: "ignore-scripts=true ... allowlist the packages that need
// them"). Every package in package-lock.json that declares an install script is listed below with the reason it is not
// run. A new one fails this test until it is reviewed; a listed one that leaves the lockfile fails as stale.
// Measured 2026-11-06 in a clean `npm ci` with ignore-scripts=true: esbuild, @swc/core, unrs-resolver and sharp load and
// run from their optional platform packages, so no package is rebuilt and there is no setup step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** Package → why its install script is not needed. */
export const REVIEWED_NOT_RUN = {
  esbuild: 'the binary comes from the optional @esbuild/<platform> package; the script only verifies it',
  '@swc/core': 'the binary comes from the optional @swc/core-<platform> package (nested under next-intl)',
  'unrs-resolver': 'the binary comes from the optional @unrs/resolver-binding-<platform> package',
  '@parcel/watcher': 'prebuilt optional platform packages; build, tests and Storybook pass without the script',
  '@sentry/cli': 'source maps are not uploaded from CI; the binary comes from optional @sentry/cli-<platform> packages',
  fsevents: 'macOS only, optional; nothing in the build depends on it',
  msw: 'the script copies the service worker into a configured folder; the project serves its own copy',
};

const nameOf = (lockKey) => lockKey.slice(lockKey.lastIndexOf('node_modules/') + 'node_modules/'.length);

/** Problems with the install-script policy, given the three files' contents. */
export function installScriptProblems({ npmrc, lock }) {
  const problems = [];
  const settings = new Map(npmrc.split(/\r?\n/).map((l) => l.split('=').map((s) => s.trim())).filter(([k]) => k && !k.startsWith('#')));
  if (settings.get('ignore-scripts') !== 'true') problems.push('.npmrc lacks ignore-scripts=true');
  if (settings.get('legacy-peer-deps') === 'true') problems.push('.npmrc sets legacy-peer-deps=true, which hides an invalid dependency tree');
  const withScripts = new Set(Object.entries(lock.packages ?? {}).filter(([key, value]) => key && value.hasInstallScript).map(([key]) => nameOf(key)));
  for (const name of withScripts) if (!Object.hasOwn(REVIEWED_NOT_RUN, name)) problems.push(`${name} has an install script that nobody has reviewed`);
  for (const name of Object.keys(REVIEWED_NOT_RUN)) if (!withScripts.has(name)) problems.push(`${name} is reviewed but no longer has an install script in package-lock.json (stale entry)`);
  return problems;
}

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const reviewedLock = { packages: { '': {}, ...Object.fromEntries(Object.keys(REVIEWED_NOT_RUN).map((n) => [`node_modules/${n}`, { hasInstallScript: true }])) } };

test('the repository: install scripts off, every package with a script reviewed', () => {
  assert.deepEqual(installScriptProblems({ npmrc: read('.npmrc'), lock: JSON.parse(read('package-lock.json')) }), []);
});

test('fails when .npmrc does not turn install scripts off, or hides the tree with legacy-peer-deps', () => {
  assert.deepEqual(installScriptProblems({ npmrc: 'lockfile-version=2\n', lock: reviewedLock }), ['.npmrc lacks ignore-scripts=true']);
  assert.deepEqual(installScriptProblems({ npmrc: 'ignore-scripts=false\n', lock: reviewedLock }), ['.npmrc lacks ignore-scripts=true']);
  assert.deepEqual(installScriptProblems({ npmrc: 'ignore-scripts=true\r\nlegacy-peer-deps=true\r\n', lock: reviewedLock }), ['.npmrc sets legacy-peer-deps=true, which hides an invalid dependency tree']);
});

test('fails when a package gains an install script nobody reviewed, also when nested', () => {
  const lock = { packages: { ...reviewedLock.packages, 'node_modules/a/node_modules/evil-pkg': { hasInstallScript: true } } };
  assert.deepEqual(installScriptProblems({ npmrc: 'ignore-scripts=true\n', lock }), ['evil-pkg has an install script that nobody has reviewed']);
  const scoped = { packages: { ...reviewedLock.packages, 'node_modules/@x/y': { hasInstallScript: true } } };
  assert.deepEqual(installScriptProblems({ npmrc: 'ignore-scripts=true\n', lock: scoped }), ['@x/y has an install script that nobody has reviewed']);
});

test('fails on a stale reviewed entry', () => {
  const { 'node_modules/msw': _gone, ...rest } = reviewedLock.packages;
  assert.deepEqual(installScriptProblems({ npmrc: 'ignore-scripts=true\n', lock: { packages: rest } }), ['msw is reviewed but no longer has an install script in package-lock.json (stale entry)']);
});

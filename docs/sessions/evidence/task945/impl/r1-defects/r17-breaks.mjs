// The breaks of the review's breaks-c.mjs that survived (C94, C95, C96) and the main guard of dependency-check.mjs (C125), through the tool's own loader, in memory.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const LOADER = pathToFileURL(join(ROOT, T, 'mutation-loader.mjs')).href;
const OUT = join(ROOT, 'test-results/task945-r10/out');
mkdirSync(OUT, { recursive: true });
const key = path => path.replaceAll('\\', '/').toLowerCase();
const GUARD = 'if (process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url))) {';
const breaks = [
  ['C94 a hung check after grace counts as passed', 'code-check', "finish({ status: null, reason: 'timeout' }); }, KILL_GRACE_MS", "finish({ status: 0, reason: 'timeout' }); }, KILL_GRACE_MS"],
  ['C95 differential main always exits 0', 'hook-differential', 'return result.lost || result.thrown ? 1 : 0;', 'return 0;'],
  ['C96 change-review follows renames', 'change-review', "['diff', '--no-renames', '--name-only', '-z', base]", "['diff', '--name-only', '-z', base]"],
  ['C125 guard === becomes !==', 'dependency-check', GUARD, GUARD.replace('===', '!==')],
  ['C125 guard && becomes ||', 'dependency-check', GUARD, GUARD.replace('&&', '||')],
  ['C125 guard negated', 'dependency-check', GUARD, 'if (!(process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url)))) {'],
  ['C125 no real path', 'dependency-check', 'try { real = realpathSync.native(real); } catch { /* the resolved path */ }', ';'],
  ['C125 lower case on the other platform', 'dependency-check', "process.platform === 'win32' ? real.toLowerCase() : real", "process.platform !== 'win32' ? real.toLowerCase() : real"],
];
for (const [name, stem, find, replacement] of breaks) {
  const file = `${T}/${stem}.mjs`;
  const text = readFileSync(join(ROOT, file), 'utf8');
  const start = text.indexOf(find);
  if (start < 0 || text.indexOf(find, start + 1) >= 0) { console.log(`NOT PLACED: ${name}`); continue; }
  const own = existsSync(join(ROOT, T, `${stem}.selftest.mjs`)) ? `${T}/${stem}.selftest.mjs` : `${T}/code-check.selftest.mjs`;
  const report = join(OUT, `${stem}.log`);
  rmSync(report, { force: true });
  const env = { ...process.env, NODE_OPTIONS: `--import=${LOADER}`, CODE_CHECK_MUTANT: JSON.stringify({ key: key(resolve(ROOT, file)), start, end: start + find.length, original: find, replacement, report }) };
  delete env.NODE_TEST_CONTEXT;
  const begun = Date.now();
  const run = spawnSync(process.execPath, ['--test', own], { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 300000, windowsHide: true });
  const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
  const failed = [...`${run.stdout}`.matchAll(/^\s*(?:not ok \d+ - |✖ )(.+)$/gm)].map(match => match[1]).slice(0, 2).join(' | ').slice(0, 170);
  console.log(`${run.status === 0 ? 'SURVIVED' : 'CAUGHT'} exit ${run.status}, applied ${applied}, ${Math.round((Date.now() - begun) / 1000)} s, ${own}: ${name} :: ${failed}`);
}

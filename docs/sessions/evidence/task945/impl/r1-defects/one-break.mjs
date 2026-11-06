// One break in memory through the tool's own loader: node one-break.mjs <stem> <test stem> <pattern> <find> <replacement>
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [stem, tests, pattern, find, replacement] = process.argv.slice(2);
const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const file = `${T}/${stem}.mjs`;
const text = readFileSync(join(ROOT, file), 'utf8');
const start = text.indexOf(find);
if (start < 0 || text.indexOf(find, start + 1) >= 0) { console.log('NOT PLACED'); process.exit(2); }
mkdirSync(join(ROOT, 'test-results/task945-r10/out'), { recursive: true });
const report = join(ROOT, 'test-results/task945-r10/out/one.log');
rmSync(report, { force: true });
const env = { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(join(ROOT, T, 'mutation-loader.mjs')).href}`, CODE_CHECK_MUTANT: JSON.stringify({ key: resolve(ROOT, file).replaceAll('\\', '/').toLowerCase(), start, end: start + find.length, original: find, replacement, report }) };
delete env.NODE_TEST_CONTEXT;
const run = spawnSync(process.execPath, ['--test', `--test-name-pattern=${pattern}`, `${T}/${tests}.selftest.mjs`], { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 400000 });
const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
const failed = [...run.stdout.matchAll(/^\s*error: '(.+)'$/gm)].map(match => match[1]).slice(0, 3).join(' | ');
console.log(`${run.status === 0 ? 'SURVIVED' : 'CAUGHT'} exit ${run.status}, applied ${applied}: ${failed}`);

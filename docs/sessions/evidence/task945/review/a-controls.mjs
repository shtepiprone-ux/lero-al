// Task 945 approval: a control of a-breaks.mjs. Each test group the breaks were caught by runs under the same loader with a defect that changes nothing, and must pass, because a
// broken harness "catches" every defect. Then four breaks caught within a second run again, with the name of the failing test and its first lines. Usage (project root): node <this file>
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const key = path => { const plain = path.replaceAll('\\', '/'); return process.platform === 'win32' ? plain.toLowerCase() : plain; };
const OUT = join(ROOT, 'test-results/task945-approval/out');
mkdirSync(OUT, { recursive: true });
const run = (stem, tests, pattern, find, replacement, label) => {
  const file = `${T}/${stem}.mjs`;
  const text = readFileSync(join(ROOT, file), 'utf8');
  const start = text.indexOf(find);
  if (start < 0) { console.log(`NOT PLACED ${label}`); return; }
  const report = join(OUT, 'control.log');
  rmSync(report, { force: true });
  const env = { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(join(ROOT, T, 'mutation-loader.mjs')).href}`, CODE_CHECK_MUTANT: JSON.stringify({ key: key(resolve(ROOT, file)), start, end: start + find.length, original: find, replacement, report }) };
  delete env.NODE_TEST_CONTEXT;
  const started = Date.now();
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${pattern}`, `${T}/${tests}.selftest.mjs`], { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 300000 });
  const failing = result.stdout.split(/\r?\n/).filter(line => /^\s*not ok/.test(line)).slice(0, 2).join(' | ').slice(0, 150);
  const why = /error: \|-\n\s+(.+)|error: '(.+)'/.exec(result.stdout);
  console.log(`${label}: exit ${result.status}; ${Math.round((Date.now() - started) / 100) / 10} s; ${failing}; ${(why?.[1] || why?.[2] || '').slice(0, 130)}`);
};
const SAME = ['refusedLines(root, null, read)', 'refusedLines(root, null, read)'];
for (const [tests, pattern] of [['change-review', 'reader of the tree'], ['change-review', 'SECRET-ECHO'], ['change-review', 'SECRET-REACH'], ['change-review', 'the review: a secret'], ['change-review', 'by hand and in CI'], ['change-review', 'through the tool: a write tool'], ['dependency-check', 'a lock file may fetch'], ['code-check', 'GATE-CRASH'], ['code-check', 'what still names a deleted file'], ['code-check', 'GOV-945-HOOK-EXECUTOR-DENY'], ['mutation-check', 'GOV-945-MUTATION-DISK-ERROR']]) run('code-check', tests, pattern, ...SAME, `control ${tests} / ${pattern}`);
run('code-check', 'change-review', 'reader of the tree', "if (entry.startsWith('-\\t-\\t')) toRead.add(entry.slice(4));", ';', 'break 0 again');
run('dependency-check', 'dependency-check', 'a lock file may fetch', 'else if (path && !entry.link && !entry.resolved && !entry.integrity)', 'else if (!entry.link && !entry.resolved && !entry.integrity)', 'break 11 again');
run('code-check', 'code-check', 'GATE-CRASH', 'if (!found.length) failures.push(', 'if (false) failures.push(', 'break 17 again');
run('contract', 'code-check', 'GOV-945-HOOK-EXECUTOR-DENY', '\\.npmrc$|', '', 'break 33 again');

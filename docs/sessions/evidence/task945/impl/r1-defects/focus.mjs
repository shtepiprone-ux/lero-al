// The changed lines of revision 1, broken one at a time, against the tests written for them: a name pattern keeps each run short enough to try them all.
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const { mutantsOf, changedLines } = await import(pathToFileURL(join(ROOT, T, 'mutation-check.mjs')).href);
const { default: ts } = await import(pathToFileURL(join(ROOT, 'node_modules/typescript/lib/typescript.js')).href);
const LOADER = pathToFileURL(join(ROOT, T, 'mutation-loader.mjs')).href;
const OUT = join(ROOT, 'test-results/task945-r10/out');
mkdirSync(OUT, { recursive: true });
const RESULT = join(ROOT, 'test-results/task945-r10/focus.txt');
writeFileSync(RESULT, '');
const key = path => path.replaceAll('\\', '/').toLowerCase();
const groups = [
  ['code-check', 'change-review', 'SECRET-|reader|each rule names|through the tool|the review: a secret|fixture command', (text, line) => inRange(text, line, 'function readableText', 'function hashOf')],
  ['code-check', 'code-check', 'still names a deleted|repeated attempt|GATE-CRASH|WRITE-DENY|SHELL-WRITE', (text, line) => !inRange(text, line, 'function readableText', 'function hashOf')],
  ['change-review', 'change-review', 'SECRET-ECHO|the review: a secret|staged rename|report says each|by hand and in CI', () => true],
  ['mutation-check', 'mutation-check', 'DISK-ERROR|reportLines|not tried line|by hand|control tells', () => true],
  ['dependency-check', 'dependency-check', '.', () => true],
  ['hook-differential', 'code-check', 'real main of the differential', () => true],
  ['contract', 'code-check', 'EXECUTOR-DENY', () => true],
];
function inRange(text, line, from, to) {
  const lines = text.split('\n');
  const a = lines.findIndex(entry => entry.includes(from)) + 1, b = lines.findIndex((entry, index) => index > a && entry.includes(to)) + 1;
  return line >= a && line < b;
}
const jobs = [];
for (const [stem, tests, pattern, within] of groups) {
  const file = `${T}/${stem}.mjs`;
  const text = readFileSync(join(ROOT, file), 'utf8');
  const lines = changedLines(ROOT, file, 'HEAD');
  for (const mutant of mutantsOf(ts, file, text, lines)) if (within(text, mutant.line)) jobs.push({ stem, file, tests: `${T}/${tests}.selftest.mjs`, pattern, mutant });
}
appendFileSync(RESULT, `${jobs.length} defects\n`);
let serial = 0, caught = 0, survived = 0, unloaded = 0;
const one = job => new Promise(done => {
  const report = join(OUT, `f${process.pid}-${serial++}.log`);
  const { start, end, original, replacement, line } = job.mutant;
  const env = { ...process.env, NODE_OPTIONS: `--import=${LOADER}`, CODE_CHECK_MUTANT: JSON.stringify({ key: key(resolve(ROOT, job.file)), start, end, original, replacement, report }) };
  delete env.NODE_TEST_CONTEXT;
  const child = spawn(process.execPath, ['--test', `--test-name-pattern=${job.pattern}`, job.tests], { cwd: ROOT, env, stdio: 'ignore', windowsHide: true });
  const timer = setTimeout(() => spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)]), 150000);
  child.on('close', status => {
    clearTimeout(timer);
    const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
    rmSync(report, { force: true });
    if (!applied) { unloaded++; appendFileSync(RESULT, `NOT LOADED ${job.file}:${line}: ${original.slice(0, 80)}\n`); }
    else if (status === 0) { survived++; appendFileSync(RESULT, `SURVIVED ${job.file}:${line}: \`${original.replace(/\s+/g, ' ').slice(0, 90)}\` -> \`${replacement.replace(/\s+/g, ' ').slice(0, 60)}\`\n`); }
    else caught++;
    done();
  });
});
const worker = async () => { for (let job = jobs.shift(); job; job = jobs.shift()) await one(job); };
await Promise.all(Array.from({ length: 4 }, worker));
appendFileSync(RESULT, `DONE caught ${caught}, survived ${survived}, not loaded ${unloaded}\n`);

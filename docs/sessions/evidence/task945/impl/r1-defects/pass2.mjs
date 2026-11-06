// The defects that survived the focused run, again, each against every test file that reaches its source: a narrow name pattern may have left out the test that catches it.
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
const RESULT = join(ROOT, 'test-results/task945-r10/pass2.txt');
writeFileSync(RESULT, '');
const key = path => path.replaceAll('\\', '/').toLowerCase();
const label = (file, m) => `${file}:${m.line}: \`${m.original.replace(/\s+/g, ' ').slice(0, 90)}\` -> \`${m.replacement.replace(/\s+/g, ' ').slice(0, 60)}\``;
const wanted = new Set(readFileSync(join(ROOT, 'test-results/task945-r10/focus.txt'), 'utf8').split('\n').filter(line => line.startsWith('SURVIVED ')).map(line => line.slice(9)));
const testsOf = {
  'code-check': ['code-check', 'change-review'],
  'change-review': ['change-review'],
  'mutation-check': ['mutation-check'],
  'dependency-check': ['dependency-check'],
  'hook-differential': ['code-check'],
  contract: ['code-check'],
};
const jobs = [];
for (const [stem, tests] of Object.entries(testsOf)) {
  const file = `${T}/${stem}.mjs`;
  const text = readFileSync(join(ROOT, file), 'utf8');
  for (const mutant of mutantsOf(ts, file, text, changedLines(ROOT, file, 'HEAD'))) {
    const name = label(file, mutant);
    if (wanted.has(name)) { wanted.delete(name); jobs.push({ file, name, tests: tests.map(entry => `${T}/${entry}.selftest.mjs`), mutant }); }
  }
}
appendFileSync(RESULT, `${jobs.length} defects, ${wanted.size} survivors not matched\n`);
for (const name of wanted) appendFileSync(RESULT, `NOT MATCHED ${name}\n`);
let serial = 0, caught = 0, survived = 0, unloaded = 0;
const one = job => new Promise(done => {
  const report = join(OUT, `p${process.pid}-${serial++}.log`);
  const { start, end, original, replacement } = job.mutant;
  const env = { ...process.env, NODE_OPTIONS: `--import=${LOADER}`, CODE_CHECK_MUTANT: JSON.stringify({ key: key(resolve(ROOT, job.file)), start, end, original, replacement, report }) };
  delete env.NODE_TEST_CONTEXT;
  const child = spawn(process.execPath, ['--test', ...job.tests], { cwd: ROOT, env, stdio: 'ignore', windowsHide: true });
  const timer = setTimeout(() => spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)]), 400000);
  child.on('close', status => {
    clearTimeout(timer);
    const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
    rmSync(report, { force: true });
    if (!applied) { unloaded++; appendFileSync(RESULT, `NOT LOADED ${job.name}\n`); }
    else if (status === 0) { survived++; appendFileSync(RESULT, `SURVIVED ${job.name}\n`); }
    else { caught++; appendFileSync(RESULT, `CAUGHT ${job.name}\n`); }
    done();
  });
});
const worker = async () => { for (let job = jobs.shift(); job; job = jobs.shift()) await one(job); };
await Promise.all(Array.from({ length: 4 }, worker));
appendFileSync(RESULT, `DONE caught ${caught}, survived ${survived}, not loaded ${unloaded}\n`);

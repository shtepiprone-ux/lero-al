// The survivors of the second pass that are not equivalent forms, with every mutant of the same label, against the test files that reach their source.
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
const RESULT = join(ROOT, 'test-results/task945-r10/pass4.txt');
writeFileSync(RESULT, '');
const key = path => path.replaceAll('\\', '/').toLowerCase();
const label = (file, m) => `${file}:${m.line}: \`${m.original.replace(/\s+/g, ' ').slice(0, 90)}\` -> \`${m.replacement.replace(/\s+/g, ' ').slice(0, 60)}\``;
// Equivalent forms, each answered in the completion report: a window flag, a buffer bound, a minute plus one millisecond, and paths no Git output reaches.
const EQUIVALENT = new Set(readFileSync(join(ROOT, 'test-results/task945-r10/equivalent.txt'), 'utf8').split('\n').map(line => line.trim()).filter(Boolean));
const wanted = new Set(readFileSync(join(ROOT, 'test-results/task945-r10/pass3.txt'), 'utf8').split('\n').filter(line => line.startsWith('SURVIVED ')).map(line => line.slice(9)));
const testsOf = file => {
  if (file.endsWith('/code-check.mjs')) return ['code-check', 'change-review'];
  if (file.endsWith('/mutation-check.mjs')) return ['mutation-check', 'dependency-check'];
  if (file.endsWith('/hook-differential.mjs') || file.endsWith('/contract.mjs')) return ['code-check'];
  return [file.split('/').pop().replace('.mjs', '')];
};
const jobs = [];
const stems = new Set([...wanted].map(name => name.split(':')[0]));
for (const file of stems) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  for (const mutant of mutantsOf(ts, file, text, changedLines(ROOT, file, 'HEAD'))) {
    const name = label(file, mutant);
    if (wanted.has(name) && !EQUIVALENT.has(name)) jobs.push({ file, name, tests: testsOf(file).map(entry => `${T}/${entry}.selftest.mjs`), mutant });
  }
}
appendFileSync(RESULT, `${jobs.length} defects\n`);
let serial = 0, caught = 0, survived = 0, unloaded = 0;
const one = job => new Promise(done => {
  const report = join(OUT, `q${process.pid}-${serial++}.log`);
  const { start, end, original, replacement } = job.mutant;
  const env = { ...process.env, NODE_OPTIONS: `--import=${LOADER}`, CODE_CHECK_MUTANT: JSON.stringify({ key: key(resolve(ROOT, job.file)), start, end, original, replacement, report }) };
  delete env.NODE_TEST_CONTEXT;
  const child = spawn(process.execPath, ['--test', '--test-concurrency=1', '--test-name-pattern=a named base is read whole|AGENTS.md is a document', ...job.tests], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  let out = '';
  child.stdout.on('data', chunk => { out += chunk; });
  const timer = setTimeout(() => spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)]), 600000);
  child.on('close', status => {
    clearTimeout(timer);
    const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
    rmSync(report, { force: true });
    if (!applied) { unloaded++; appendFileSync(RESULT, `NOT LOADED ${job.name}\n`); }
    else if (status === 0) { survived++; appendFileSync(RESULT, `SURVIVED ${job.name}\n`); }
    else { caught++; appendFileSync(RESULT, `CAUGHT ${job.name} :: ${[...out.matchAll(/^not ok \d+ - (.+)$/gm)].map(match => match[1]).join(' | ').slice(0, 300)}\n`); }
    done();
  });
});
const worker = async () => { for (let job = jobs.shift(); job; job = jobs.shift()) await one(job); };
await Promise.all(Array.from({ length: 3 }, worker));
appendFileSync(RESULT, `DONE caught ${caught}, survived ${survived}, not loaded ${unloaded}\n`);

// Prototype for the correction of Task 945 review 2, on temporary repositories: does a record of the paths a run's Node processes write tell a mutant's write from another
// writer's, in a plain Node run, a spawned script, a Vitest worker and through node:fs/promises? Design evidence to read, not code to paste. Usage (project root): node <this file>
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const LOADER = pathToFileURL(resolve('test-results/task945-approval/p05-loader.mjs')).href;
const repo = files => {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-p05-'));
  for (const [file, text] of Object.entries(files)) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); }
  return root;
};
const recorded = report => (existsSync(report) ? [...new Set(readFileSync(report, 'utf8').split(/\r?\n/).filter(Boolean))] : []);
const relativeTo = (root, list) => list.filter(path => path.toLowerCase().startsWith(root.toLowerCase())).map(path => path.slice(root.length + 1).replaceAll('\\', '/')).sort();
const envOf = report => ({ ...process.env, NODE_OPTIONS: `--import=${LOADER}`, CODE_CHECK_WRITES: report });

// 1. A plain Node run, every form of writing a scanner uses, by the default import and the named one.
{
  const root = repo({ 'scan.mjs': "import fs, { writeFileSync, rmSync, renameSync } from 'node:fs';\nimport { writeFile } from 'node:fs/promises';\nwriteFileSync('a.json', '1');\nfs.appendFileSync('b.json', '1');\nrenameSync('a.json', 'c.json');\nawait writeFile('d.json', '1');\nrmSync('c.json');\nconst id = fs.openSync('e.json', 'w'); fs.closeSync(id);\nfs.createWriteStream('f.json').end('1');\n" });
  const report = join(root, 'writes.log');
  const run = spawnSync(process.execPath, ['scan.mjs'], { cwd: root, env: envOf(report), encoding: 'utf8' });
  console.log(`plain run, exit ${run.status}: ${relativeTo(root, recorded(report)).filter(file => file !== 'writes.log').join(' ')} ${run.stderr.slice(0, 200)}`);
  rmSync(root, { recursive: true, force: true });
}
// 2. A script another Node process starts.
{
  const root = repo({ 'outer.mjs': "import { spawnSync } from 'node:child_process';\nspawnSync(process.execPath, ['inner.mjs'], { stdio: 'inherit' });\n", 'inner.mjs': "import { writeFileSync } from 'node:fs';\nwriteFileSync('child.json', '1');\n" });
  const report = join(root, 'writes.log');
  spawnSync(process.execPath, ['outer.mjs'], { cwd: root, env: envOf(report) });
  console.log(`spawned script: ${relativeTo(root, recorded(report)).join(' ')}`);
  rmSync(root, { recursive: true, force: true });
}
// 3. A Vitest worker, by the project's own runner.
{
  const root = repo({ 'a.test.mjs': "import { writeFileSync } from 'node:fs';\nimport { it } from 'vitest';\nit('writes', () => { writeFileSync(process.env.P05_TARGET, '1'); });\n", 'vitest.config.mjs': 'export default { test: { include: ["*.test.mjs"] } };\n' });
  const report = join(root, 'writes.log');
  // An absolute target: the runner's working folder is the project, and a relative write would land in it.
  const run = spawnSync(process.execPath, [join(ROOT, 'node_modules/vitest/vitest.mjs'), 'run', '--reporter=dot', '--root', root], { cwd: ROOT, env: { ...envOf(report), P05_TARGET: join(root, 'from-worker.json') }, encoding: 'utf8', timeout: 90000 });
  console.log(`vitest worker, exit ${run.status}: ${relativeTo(root, recorded(report)).join(' ')}`);
  rmSync(root, { recursive: true, force: true });
}
// 4. Two writers at once: only the run's own path is on the record, so a guard that restores only recorded paths leaves the other writer's work.
{
  const root = repo({ 'scan.mjs': "import { writeFileSync } from 'node:fs';\nawait new Promise(done => setTimeout(done, 700));\nwriteFileSync('mutant.json', 'the mutant');\n", 'other.json': 'before' });
  const report = join(root, 'writes.log');
  const child = spawn(process.execPath, ['scan.mjs'], { cwd: root, env: envOf(report), stdio: 'ignore' });
  writeFileSync(join(root, 'other.json'), 'the other writer');
  await new Promise(done => child.on('close', done));
  console.log(`two writers: on the record ${relativeTo(root, recorded(report)).join(' ')}; other.json holds "${readFileSync(join(root, 'other.json'), 'utf8')}"`);
  rmSync(root, { recursive: true, force: true });
}
// 5. What the record does not see: a program that is no Node process. Such a write is named and left, the same as another writer's.
{
  const root = repo({ 'scan.mjs': "import { spawnSync } from 'node:child_process';\nspawnSync('git', ['init', '-q', 'nested']);\nspawnSync('cmd', ['/c', 'echo x> by-cmd.txt']);\n" });
  const report = join(root, 'writes.log');
  spawnSync(process.execPath, ['scan.mjs'], { cwd: root, env: envOf(report) });
  console.log(`a program that is no Node process: on the record [${relativeTo(root, recorded(report)).join(' ')}]; by-cmd.txt exists ${existsSync(join(root, 'by-cmd.txt'))}`);
  rmSync(root, { recursive: true, force: true });
}

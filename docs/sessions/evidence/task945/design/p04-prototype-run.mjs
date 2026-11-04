// Task 945 design: the prototype of p03 as a real hook process on a temporary Git repository, with the real tsc. Nothing in the project changes.
// Run from the project root: node docs/sessions/evidence/task945/design/p04-prototype-run.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const prototype = resolve('docs/sessions/evidence/task945/design/p03-code-check-prototype.mjs');
const tsc = resolve('node_modules/typescript/bin/tsc').replaceAll('\\', '/');
const fx = mkdtempSync(join(tmpdir(), 'lero-945-proto-'));
const put = (file, text) => { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), text); };
const git = (...args) => spawnSync('git', args, { cwd: fx, encoding: 'utf8' });
const node = process.execPath.replaceAll('\\', '/');
put('tsconfig.json', JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: true, target: 'es2022', module: 'esnext', moduleResolution: 'bundler', types: [] }, include: ['src/**/*.ts'] }));
put('src/owner.ts', 'export const price = (value: number): number => value;\n');
put('src/consumer.ts', "import { price } from './owner';\nexport const shown = price(1);\n");
put('tests/check-impact.mjs', "import { readFileSync } from 'node:fs';\nif (/BROKEN/.test(readFileSync('src/owner.ts', 'utf8'))) { console.error('consumer test failed: price is broken'); process.exit(1); }\n");
put('tests/lint.mjs', "import { readFileSync } from 'node:fs';\nfor (const file of process.argv.slice(2)) if (/debugger/.test(readFileSync(file, 'utf8'))) { console.error(`${file}: no debugger`); process.exit(1); }\n");
put('tests/hang.mjs', 'setInterval(() => {}, 1000);\n');
put('docs/note.md', 'a\n');
put('scripts/workflow-gates/code-check.json', JSON.stringify({ roots: ['src', 'scripts', 'hung'], timeoutMs: { write: 60000, stop: 3000 }, tailLines: 6, rows: [
  { paths: ['src/**/*.ts'], write: [`"${node}" tests/lint.mjs {files}`, `"${node}" "${tsc}" --pretty false -p .`], stop: [`"${node}" tests/check-impact.mjs`] },
  { paths: ['hung/**/*.ts'], stop: [`"${node}" tests/hang.mjs`] },
  { paths: ['src/uncovered/**/*.ts'], stop: ['echo No test files found'] },
  { paths: ['src/each/**/*.ts'], write: [`"${node}" tests/lint.mjs {file}`], stop: [{ run: `"${node}" tests/tree-gate.mjs`, namesFile: true }] },
] }));
put('tests/tree-gate.mjs', "console.error('finding in src/each/known-bad.ts'); process.exit(1);\n");
put('src/each/known-bad.ts', 'export const bad = 1;\n');
git('init', '-q'); git('add', '-A'); git('-c', 'user.name=x', '-c', 'user.email=x@example.com', 'commit', '-qm', 'base');

let failures = 0;
const hook = (name, extra = {}) => {
  const t0 = performance.now();
  const run = spawnSync(process.execPath, [prototype], { cwd: fx, encoding: 'utf8', input: JSON.stringify({ hook_event_name: name, session_id: 's1', cwd: fx, ...extra }), env: { ...process.env, CLAUDE_PROJECT_DIR: fx } });
  return { status: run.status, ms: Math.round(performance.now() - t0), text: run.stderr.replaceAll(fx.replaceAll('\\', '/'), '<fx>').replaceAll(fx, '<fx>') };
};
const expect = (id, run, status, pattern) => {
  const ok = run.status === status && (!pattern || pattern.test(run.text));
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: exit ${run.status}; ${run.ms} ms${run.text ? `; ${run.text.split('\n').filter(Boolean).slice(0, 2).join(' / ').slice(0, 170)}` : ''}`);
};
const write = file => ({ tool_name: 'Edit', tool_input: { file_path: join(fx, file) } });
const shell = { tool_name: 'Bash', tool_input: { command: 'some command the hook does not parse' } };

expect('session start records the tree', hook('SessionStart'), 0);
expect('a read-only session does nothing and stops at once', hook('Stop'), 0);
put('docs/note.md', 'b\n');
expect('a document write runs no check', hook('PostToolUse', write('docs/note.md')), 0);
put('src/owner.ts', 'export const price = (value: number): number => value + 1;\n');
expect('a clean code write passes', hook('PostToolUse', write('src/owner.ts')), 0);
put('src/owner.ts', 'debugger;\nexport const price = (value: number): number => value + 1;\n');
expect('QUALITY a lint failure in the written file is shown at once', hook('PostToolUse', write('src/owner.ts')), 2, /CODE CHECK FAILED after a write[\s\S]*no debugger/);
const again = hook('PostToolUse', shell);
expect('the same failed version is not rerun on the next command', again, 0);
expect('Stop still refuses the failed version', hook('Stop'), 2, /no debugger/);
put('src/owner.ts', 'export const price = (value: string): number => Number(value);\n');
expect('IMPACT a changed signature is reported in the consumer the session never touched', hook('PostToolUse', write('src/owner.ts')), 2, /consumer\.ts\(2,28\): error TS2345/);
put('src/owner.ts', 'export const price = (value: number): number => value;\nexport const note = 1;\n');
expect('the fix clears the write stage', hook('PostToolUse', write('src/owner.ts')), 0);
put('src/owner.ts', 'export const price = (value: number): number => value; // BROKEN\n');
expect('a write through a shell form with no parsing is seen by its hash', hook('PostToolUse', shell), 0);
expect('IMPACT Stop refuses while a test of the consumers fails', hook('Stop'), 2, /CODE CHECK FAILED: how[\s\S]*consumer test failed/);
expect('Stop still refuses on the next attempt: nothing was fixed', hook('Stop', { stop_hook_active: true }), 2, /consumer test failed/);
put('src/owner.ts', 'export const price = (value: number): number => value;\n');
expect('the file back at its committed text has nothing left to check', hook('Stop'), 0);
put('src/owner.ts', 'export const price = (value: number): number => value * 2;\n');
expect('a fixed version passes Stop', hook('Stop'), 0);
expect('an unchanged passed file costs no second run', hook('Stop'), 0);
put('src/uncovered/a.ts', 'export const a = 1;\n');
expect('NOTE no test reaches a new file: stopped once', hook('Stop'), 2, /no test reaches src\/uncovered\/a\.ts/);
expect('NOTE the same version does not stop again', hook('Stop', { stop_hook_active: true }), 0);
put('src/each/other.ts', 'export const other = 1;\n');
expect('a whole-tree gate with findings only outside the change does not block', hook('Stop'), 0);
put('src/each/known-bad.ts', 'export const bad = 2;\n');
expect('the same gate blocks once the changed file holds a finding', hook('Stop'), 2, /finding in src\/each\/known-bad\.ts/);
put('src/each/known-bad.ts', 'export const bad = 1;\n');
put('src/each/one.ts', 'debugger;\n');
put('src/each/two.ts', 'export const two = 2;\n');
expect('a {file} command runs per file and names the bad one', hook('PostToolUse', shell), 2, /src\/each\/one\.ts: no debugger/);
rmSync(join(fx, 'src/each/one.ts'));
rmSync(join(fx, 'src/each/two.ts'));
expect('removing them clears the session', hook('Stop'), 0);
git('mv', 'src/owner.ts', 'src/renamed-owner.ts');
expect('IMPACT a rename is reported in the consumer that still imports the old path', hook('PostToolUse', shell), 2, /consumer\.ts\(1,23\): error TS2307/);
git('mv', 'src/renamed-owner.ts', 'src/owner.ts');
expect('the rename undone clears the session', hook('Stop'), 0);
put('hung/a.ts', 'export const a = 1;\n');
expect('ERROR a check that does not finish is a failure', hook('Stop'), 2, /could not finish/);
const left = spawnSync('powershell', ['-NoProfile', '-Command', `@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*tests/hang.mjs*' }).Count`], { encoding: 'utf8' }).stdout.trim();
if (left !== '0') failures++;
console.log(`${left === '0' ? 'PASS' : 'FAIL'} ERROR the hung check left no process behind: ${left} running`);
rmSync(join(fx, 'hung'), { recursive: true, force: true });
expect('a deleted file leaves nothing to check', hook('Stop'), 0);
put('scripts/workflow-gates/code-check.json', '{ not json');
expect('ERROR an unreadable registry refuses with a message', hook('Stop'), 2, /CODE CHECK COULD NOT RUN/);
console.log(`\nFAILURES ${failures}`);
rmSync(fx, { recursive: true, force: true });
process.exitCode = failures ? 1 : 0;

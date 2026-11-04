// Task 942 revision 3 feasibility run (Task 944 review 4 session, under D13, D14 and D20, 2026-11-04). Run from the project root on
// native Windows, after p07-shell-forms-run.mjs, whose prototype it extends: node docs/sessions/evidence/task942/design/p10-more-forms-run.mjs
// The PAIRS below go on test-results/task942-r2/security-hook.mjs (each `find` exactly once), written to the gitignored
// test-results/task942-r3/security-hook.mjs; the live hook is not changed. A design prototype to read, not code to paste.
// A. The R4 (f) forms report X and their executor forms are refused; the controls stay silent. B. Every hook-importing self-test,
// unchanged, against the prototype. C. The frozen corpus, p07 prototype versus this one. D. The 5000-folder-change commands.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const work = join(root, 'test-results/task942-r3');
mkdirSync(join(work, 'tests'), { recursive: true });
const tmp = tmpdir();
const redact = text => text.split(tmp).join('<tmp>').split(tmp.replaceAll('\\', '/')).join('<tmp>')
  .replace(/(?:[A-Za-z]:|\/[a-z])[\\/]+Users[\\/]+[^\\/"'\s]+/gi, '<user-home>');
const out = [];
let failures = 0;
const expect = (id, ok, detail) => { if (!ok) failures++; out.push(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? ` | ${redact(detail)}` : ''}`); };
const real = file => pathToFileURL(join(gates, file)).href;

const PAIRS = [
  // R4 (f) (i): a keyword mode or flags after other keyword arguments of open( or openSync(.
  [String.raw`const API_CREATE =`,
    String.raw`const API_OPEN_KEYWORD = /\bopen(?:Sync)?\s*\(\s*(?:file\s*=\s*)?r?(['"])([^'"]+)\1(?:\s*,\s*\w+\s*=\s*(?:r?['"][^'"]*['"]|[\w.]+))+\s*,\s*(?:mode|flags)\s*=\s*r?['"]([^'"]*)['"]/g;
const API_CREATE =`],
  [String.raw`...[...text.matchAll(API_OPEN)].filter(m => /[wax+]/.test(m[3])).map(m => m[2]),`,
    String.raw`...[...text.matchAll(API_OPEN)].filter(m => /[wax+]/.test(m[3])).map(m => m[2]),
    ...[...text.matchAll(API_OPEN_KEYWORD)].filter(m => /[wax+]/.test(m[3])).map(m => m[2]),`],
  // R4 (f) (ii): Path(...).open with a keyword mode, also after other keyword arguments.
  [String.raw`open\s*\(\s*r?['"][^'"]*[wax+][^'"]*['"]`,
    String.raw`open\s*\(\s*(?:\w+\s*=\s*(?:r?['"][^'"]*['"]|[\w.]+)\s*,\s*)*(?:mode\s*=\s*)?r?['"][^'"]*[wax+][^'"]*['"]`],
  // R4 (f) (iii): the `path=` keyword of a directory delete call.
  [String.raw`(?:rm|rmdir|rmtree|removedirs|Delete))\s*\(\s*r?['"]([^'"]+)['"]` + '`, ',
    String.raw`(?:rm|rmdir|rmtree|removedirs|Delete))\s*\(\s*(?:path\s*=\s*)?r?['"]([^'"]+)['"]` + '`, '],
  // R4 (f) (iv): the raw reading sees `\"` as a quote, so the Task 944 R8 (c) API forms match inside a double-quoted command text.
  [String.raw`  for (const raw of apiArguments(command)) resolveIn(raw, folders, false);
  for (const raw of apiDirectories(command)) underIn(raw, folders);`,
    String.raw`  const unescaped = command.replace(/\\"/g, '"');
  for (const raw of apiArguments(unescaped)) resolveIn(raw, folders, false);
  for (const raw of apiDirectories(unescaped)) underIn(raw, folders);`],
];

const previous = join(root, 'test-results/task942-r2/security-hook.mjs');
const protoPath = join(work, 'security-hook.mjs');
let text = readFileSync(previous, 'utf8');
for (const [find, replace] of PAIRS) {
  const count = text.split(find).length - 1;
  expect(`pair applies once: ${find.slice(0, 60).replace(/\n/g, ' ')}`, count === 1, count === 1 ? '' : `found ${count} times`);
  text = text.replace(find, () => replace);
}
writeFileSync(protoPath, text);
const live = await import(real('security-hook.mjs'));
const before = await import(pathToFileURL(previous).href);
const proto = await import(pathToFileURL(protoPath).href);

const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', Y = `docs/${N}`, P = 'scripts/check-example.mjs';
const forms = (x, d) => [
  `python -c "open('${x}', buffering=1, mode='w')"`, `python -c "open('${x}', encoding='utf8', mode='w')"`, `python -c "open('${x}', newline='', mode='a')"`,
  `python -c "open(file='${x}', encoding='utf8', mode='w')"`, `node -e "fs.open('${x}', { }, flags='w')"`.replace(', { }', ", encoding='utf8'"),
  `python -c "from pathlib import Path; Path('${x}').open(mode='w')"`, `python -c "from pathlib import Path; Path('${x}').open(encoding='utf8', mode='a')"`,
  `python -c "import shutil; shutil.rmtree(path='${d}')"`,
  `python -c "open(\\"${x}\\", 'w')"`, `python -c "open(\\"${x}\\", \\"w\\")"`, `python -c "open(\\"${x}\\", mode=\\"w\\")"`,
  `powershell -Command "[IO.File]::Create(\\"${x}\\")"`, `powershell -Command "[IO.File]::OpenWrite(\\"${x}\\")"`,
  `python -c "from pathlib import Path; Path(\\"${x}\\").unlink()"`, `node -e "require(\\"fs\\").openSync(\\"${x}\\", \\"w\\")"`, `python -c "import shutil; shutil.rmtree(\\"${d}\\")"`,
];
const CONTROLS = [`python -c "open('${X}', encoding='utf8', mode='r')"`, `python -c "open('${X}', encoding='utf8', errors='replace')"`, `python -c "open('${X}', encoding='utf8')"`,
  `python -c "from pathlib import Path; Path('${X}').open(mode='r')"`, `python -c "from pathlib import Path; Path('${X}').open(encoding='utf8')"`, `python -c "from pathlib import Path; Path('${X}').open(encoding='utf8', errors='replace')"`,
  `python -c "open(\\"${X}\\", 'r')"`, `python -c "open(\\"${X}\\")"`, `python -c "print(\\"${X}\\")"`, `node -e "require(\\"fs\\").readFileSync(\\"${X}\\")"`,
  `powershell -Command "[IO.File]::ReadAllText(\\"${X}\\")"`, `git diff -- ${X}`];
// A search text that spells a write call: the prototype must treat the `\"` spelling as the current hook already treats the `'` one.
const searches = [`grep -n "open('${X}', 'w')" docs/a.md`, `grep -n "open(\\"${X}\\", 'w')" docs/a.md`];
const fx = mkdtempSync(join(tmp, 'lero-942-r3-'));
for (const file of [X, P, Y]) { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), 'a\n'); }
const executor = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: fx, tool_input: { command } });
for (const command of forms(X, D)) {
  const now = live.shellWriteTargets(fx, command, fx).includes(X), then = proto.shellWriteTargets(fx, command, fx).includes(X);
  expect(`form reported by the prototype, missed by the current hook: ${command}`, then && !now, `current ${now}; prototype ${then}`);
}
for (const command of forms(P, 'scripts')) {
  const errors = proto.evaluateHook(fx, executor(command), '');
  expect(`executor refused: ${command}`, /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/.test(errors.join('\n')), errors[0]?.slice(0, 70));
}
for (const command of CONTROLS) expect(`control reports no X: ${command}`, !proto.shellWriteTargets(fx, command, fx).includes(X));
const reports = (hook, command) => hook.shellWriteTargets(fx, command, fx).includes(X);
out.push(`search text: current hook, ' spelling ${reports(live, searches[0])}; current hook, \\" spelling ${reports(live, searches[1])}; prototype, \\" spelling ${reports(proto, searches[1])}`);
expect('search text: the \\" spelling reads as the \' spelling of the current hook', reports(proto, searches[1]) === reports(live, searches[0]));
rmSync(fx, { recursive: true, force: true });

const hookTests = readdirSync(gates).filter(n => n.endsWith('.selftest.mjs') && readFileSync(join(gates, n), 'utf8').includes("from './security-hook.mjs'")).sort();
for (const name of hookTests) {
  const copy = readFileSync(join(gates, name), 'utf8')
    .replace("from './security-hook.mjs'", `from '${pathToFileURL(protoPath).href}'`)
    .replace(/^(import [^\n]*from |[\w ,]*\} from )'\.\/([\w.-]+\.mjs)'/gm, (_, head, file) => `${head}'${real(file)}'`)
    .replace(/new URL\('\.\/([\w.-]+\.mjs)', import\.meta\.url\)/g, (_, file) => `new URL('${file === 'security-hook.mjs' ? pathToFileURL(protoPath).href : real(file)}')`)
    .replace(/const HOOK = fileURLToPath\(new URL\('[^']+'\)\);/, `const HOOK = ${JSON.stringify(protoPath)};`);
  const file = join(work, 'tests', `prototype-${name}`);
  writeFileSync(file, copy);
  const run = spawnSync(process.execPath, ['--test', file], { cwd: root, encoding: 'utf8', timeout: 300000 });
  const totals = run.stdout.split('\n').filter(line => /^. (pass|fail|skipped)/.test(line)).join(', ');
  expect(`self-test ${name} unchanged against the prototype (${totals.trim()})`, run.status === 0, run.status === 0 ? '' : run.stdout.split('\n').filter(l => /not ok|error:/.test(l)).slice(0, 4).join(' / '));
}

const corpus = JSON.parse(readFileSync(join(root, 'test-results/task943-prototype/corpus.json'), 'utf8'));
out.push(`corpus ${corpus.length} commands, sha256 ${createHash('sha256').update(JSON.stringify(corpus)).digest('hex')}`);
const { isPolicyPath, isProductPath } = await import(real('contract.mjs'));
const { allContracts, readJson } = await import(real('cli.mjs'));
const guarded = t => !t.startsWith('../') && !/^[A-Za-z]:/.test(t) && (isPolicyPath(t) || isProductPath(t) || /^(?:tasks|docs|\.git)\//i.test(t));
const scopes = new Set();
for (const path of allContracts(root)) { try { const c = readJson(root, path); if (c.kind === 'governance') for (const s of c.scope || []) scopes.add(s.toLowerCase()); } catch { /* unreadable */ } }
let added = 0, guardedAdded = 0, dropped = 0, refused = 0, scopeHits = 0, slowest = 0;
const examples = [];
const short = command => JSON.stringify(command.length > 160 ? `${command.slice(0, 160)}...` : command);
for (const [command, cwd] of corpus) {
  const t0 = performance.now();
  const after = proto.shellWriteTargets(root, command, cwd);
  slowest = Math.max(slowest, performance.now() - t0);
  const old = before.shellWriteTargets(root, command, cwd);
  if (old.some(t => !after.includes(t))) { dropped++; examples.push(`  dropped ${short(old.filter(t => !after.includes(t)).join(' '))} for ${short(command)}`); }
  const extra = after.filter(t => !old.includes(t));
  if (extra.length) added++;
  if (extra.some(guarded)) { guardedAdded++; if (examples.length < 30) examples.push(`  added guarded ${short(extra.filter(guarded).slice(0, 3).join(' '))} for ${short(command)}`); }
  if (extra.some(t => scopes.has(t.toLowerCase()))) { scopeHits++; examples.push(`  scope hit ${short(extra.filter(t => scopes.has(t.toLowerCase())).slice(0, 3).join(' '))} for ${short(command)}`); }
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, cwd, tool_input: { command } };
  if (!before.evaluateHook(root, event, '').length) {
    const after2 = proto.evaluateHook(root, event, '');
    if (after2.length) { refused++; examples.push(`  newly refused (${after2[0].split(':')[0]}) ${short(command)}`); }
  }
}
out.push(`corpus: dropped ${dropped}; with added targets ${added}; with an added guarded target ${guardedAdded}; executor commands newly refused ${refused}; with an added governance scope file ${scopeHits}; slowest prototype call ${Math.round(slowest)} ms`);
out.push(...examples.map(redact));
expect('corpus: no target dropped (superset)', dropped === 0);
expect('corpus: no added governance scope file', scopeHits === 0);

for (const [name, command] of [['parsed', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo y > z`],
  ['parser-rejected', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo $y > z`]]) {
  const t0 = performance.now();
  proto.shellWriteTargets(root, command);
  const ms = Math.round(performance.now() - t0);
  expect(`timing ${name} 5000 folder changes under 15 s on the prototype: ${ms} ms`, ms < 15000);
}
out.push(`FAILURES ${failures}`);
console.log(redact(out.join('\n')));
process.exitCode = failures ? 1 : 0;

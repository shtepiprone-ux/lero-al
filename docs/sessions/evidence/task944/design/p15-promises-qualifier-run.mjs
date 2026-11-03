// Task 944 revision 2 feasibility run (Task 943 review 3 session e50584bc, 2026-11-03). Run from the project root on native
// Windows: node docs/sessions/evidence/task944/design/p15-promises-qualifier-run.mjs
// The prototype is the reviewed Task 943 hook with the revision 1 pairs (p14-shell-forms-pairs.json) and the revision 2 pair
// (p15-promises-qualifier-pairs.json) applied, each `find` exactly once, written to test-results/task944-r2/security-hook.mjs
// (gitignored); the live hook is not changed. A. The `require('fs').promises.<name>` forms report X on the prototype and the
// executor guard refuses them; controls stay silent. B. Every gate self-test that imports security-hook.mjs, unchanged,
// against the prototype. C. The frozen 2318-command corpus, reviewed 943 hook versus prototype. D. The Task 943 AC15 timing
// commands on the prototype. The output is printed and kept in p15-promises-qualifier-run.txt next to this file.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const design = join(root, 'docs/sessions/evidence/task944/design');
const work = join(root, 'test-results/task944-r2');
mkdirSync(join(work, 'tests'), { recursive: true });
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const tmp = tmpdir();
const redact = text => text.split(tmp).join('<tmp>').split(tmp.replaceAll('\\', '/')).join('<tmp>')
  .replace(/(?:[A-Za-z]:|\/[a-z])[\\/]+Users[\\/]+[^\\/"'\s]+/gi, '<user-home>');
const out = [];
let failures = 0;
const expect = (id, ok, detail) => { if (!ok) failures++; out.push(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? ` | ${redact(detail)}` : ''}`); };
const short = command => JSON.stringify(command.length > 140 ? `${command.slice(0, 140)}…` : command);

const real = file => pathToFileURL(join(gates, file)).href;
const live = join(gates, 'security-hook.mjs');
const protoPath = join(work, 'security-hook.mjs');
let text = readFileSync(live, 'utf8').replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`);
const pairs = [...JSON.parse(readFileSync(join(design, 'p14-shell-forms-pairs.json'), 'utf8')),
  ...JSON.parse(readFileSync(join(design, 'p15-promises-qualifier-pairs.json'), 'utf8'))];
for (const { id, find, replace } of pairs) {
  const count = text.split(find).length - 1;
  if (count !== 1) throw new Error(`pair "${id}": find occurs ${count} times`);
  text = text.replace(find, () => replace);
}
writeFileSync(protoPath, text);
out.push(`platform ${process.platform}; node ${process.version}; reviewed 943 hook sha256 ${sha(live)}; p14 pairs sha256 ${sha(join(design, 'p14-shell-forms-pairs.json'))}; p15 pair sha256 ${sha(join(design, 'p15-promises-qualifier-pairs.json'))} (${pairs.length} pairs); prototype sha256 ${sha(protoPath)}`);
const proto = await import(pathToFileURL(protoPath).href);
const now = await import(pathToFileURL(live).href);

// A. Forms on a fixture root.
const fx = mkdtempSync(join(tmpdir(), 'p15-forms-'));
const put = (p, t = 'a\n') => { mkdirSync(join(fx, p, '..'), { recursive: true }); writeFileSync(join(fx, p), t); };
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', Y = 'docs/fixture-scope.mjs', P = 'scripts/check-example.mjs';
for (const f of [X, P, Y, 'package.json']) put(f);
const executor = (command, cwd = fx) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd, tool_input: { command } });
const forms = (x, d) => [
  `node -e "require('fs').promises.rm('${x}')"`, `node -e "require('fs').promises.unlink('${x}')"`,
  `node -e "require('node:fs').promises.truncate('${x}')"`, `node -e "require('fs').promises.rename('${Y}', '${x}')"`,
  `node -e "require('fs').promises.cp('${Y}', '${x}')"`, `node -e "(await import('fs')).promises.rm('${x}')"`,
  `node -e "require('fs').promises.rm('${d}', { recursive: true })"`,
];
for (const command of forms(X, D)) {
  const before = now.shellWriteTargets(fx, command), after = proto.shellWriteTargets(fx, command);
  expect(`deny form reports X (reviewed hook ${before.includes(X) ? 'already reports' : 'misses'}): ${command}`, after.includes(X), JSON.stringify(before));
}
for (const command of forms(P, 'scripts')) {
  const before = now.evaluateHook(fx, executor(command), '');
  const refusal = proto.evaluateHook(fx, executor(command), '');
  expect(`executor refused (reviewed hook ${before.length ? 'refuses' : 'allows'}): ${command}`, refusal.some(line => /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/.test(line)), JSON.stringify(refusal).slice(0, 120));
}
const controls = [
  `node -e "require('fs').promises.readFile('${X}')"`, `node -e "require('fs').promises.stat('${X}')"`,
  `node -e "console.log('${X}'.replace('a', 'b'))"`, `node -e "p.promises.replace('${X}', 'y')"`,
  `node -e "require('fs').promises.readdir('${D}')"`, `grep -n "promises.rm" ${X}`,
];
for (const command of controls) {
  const after = proto.shellWriteTargets(fx, command);
  expect(`control reports no X: ${command}`, !after.includes(X), JSON.stringify(after).slice(0, 160));
}
rmSync(fx, { recursive: true, force: true });

// B. Hook-importing self-tests, unchanged apart from the import of the hook, against the prototype.
const hookTests = readdirSync(gates).filter(n => n.endsWith('.selftest.mjs') && readFileSync(join(gates, n), 'utf8').includes("from './security-hook.mjs'")).sort();
for (const name of hookTests) {
  const copy = readFileSync(join(gates, name), 'utf8')
    .replace("from './security-hook.mjs'", `from '${pathToFileURL(protoPath).href}'`)
    .replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
    .replace(/new URL\('\.\/([\w.-]+\.mjs)', import\.meta\.url\)/g, (_, file) => `new URL('${file === 'security-hook.mjs' ? pathToFileURL(protoPath).href : real(file)}')`)
    .replace(/const HOOK = fileURLToPath\(new URL\('[^']+'\)\);/, `const HOOK = ${JSON.stringify(protoPath)};`);
  const file = join(work, 'tests', `prototype-${name}`);
  writeFileSync(file, copy);
  const run = spawnSync(process.execPath, ['--test', file], { cwd: root, encoding: 'utf8' });
  const totals = run.stdout.split('\n').filter(line => /^# (pass|fail|skipped)/.test(line)).join(', ');
  expect(`self-test ${name} unchanged against the prototype (${totals})`, run.status === 0,
    run.status === 0 ? '' : run.stdout.split('\n').filter(l => /not ok|error:/.test(l)).slice(0, 4).join(' / '));
}

// C. Frozen corpus.
const corpus = JSON.parse(readFileSync(join(root, 'test-results/task943-prototype/corpus.json'), 'utf8'));
out.push(`corpus ${corpus.length} commands, sha256 ${createHash('sha256').update(JSON.stringify(corpus)).digest('hex')}`);
const { isPolicyPath, isProductPath } = await import(real('contract.mjs'));
const { allContracts, readJson } = await import(real('cli.mjs'));
const guarded = t => !t.startsWith('../') && !/^[A-Za-z]:/.test(t) && (isPolicyPath(t) || isProductPath(t) || /^(?:tasks|docs|\.git)\//i.test(t));
const governanceScope = new Set();
for (const path of allContracts(root)) { try { const c = readJson(root, path); if (c.kind === 'governance') for (const s of c.scope || []) governanceScope.add(s.toLowerCase()); } catch { /* unreadable */ } }
let added = 0, guardedAdded = 0, dropped = 0, refused = 0, scopeHits = 0, slowest = 0;
const examples = [];
for (const [command, cwd] of corpus) {
  const t0 = performance.now();
  const after = proto.shellWriteTargets(root, command, cwd);
  slowest = Math.max(slowest, performance.now() - t0);
  const before = now.shellWriteTargets(root, command, cwd);
  if (before.some(t => !after.includes(t))) { dropped++; examples.push(`  dropped ${JSON.stringify(before.filter(t => !after.includes(t)).slice(0, 3))} for ${short(command)}`); }
  const extra = after.filter(t => !before.includes(t));
  if (extra.length) added++;
  if (extra.some(guarded)) { guardedAdded++; if (examples.length < 30) examples.push(`  added guarded ${JSON.stringify(extra.filter(guarded).slice(0, 3))} for ${short(command)}`); }
  if (extra.some(t => governanceScope.has(t.toLowerCase()))) { scopeHits++; examples.push(`  scope hit ${JSON.stringify(extra.filter(t => governanceScope.has(t.toLowerCase())).slice(0, 3))} for ${short(command)}`); }
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { ...executor(command, cwd), tool_name: tool };
  if (!now.evaluateHook(root, event, '').length) {
    const after2 = proto.evaluateHook(root, event, '');
    if (after2.length) { refused++; examples.push(`  newly refused (${after2[0].split(':')[0]}) ${short(command)}`); }
  }
}
out.push(`corpus: commands whose reviewed-hook targets the prototype drops ${dropped}; with added targets ${added}; with an added guarded target ${guardedAdded}; executor commands newly refused ${refused}; with an added governance scope file ${scopeHits}; slowest prototype call ${Math.round(slowest)} ms`);
out.push(...examples.map(redact));
expect('corpus: no reviewed-hook target dropped (superset)', dropped === 0);
expect('corpus: no added governance scope file', scopeHits === 0);

// D. Task 943 AC15 timing commands on the prototype.
for (const [name, command] of [['parsed', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo y > z`],
  ['parser-rejected', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo $y > z`]]) {
  const t0 = performance.now();
  proto.shellWriteTargets(root, command);
  const ms = Math.round(performance.now() - t0);
  expect(`timing ${name} 5000 folder changes under 15 s on the prototype: ${ms} ms`, ms < 15000);
}
out.push(`FAILURES ${failures}`);
const report = redact(out.join('\n'));
writeFileSync(join(design, 'p15-promises-qualifier-run.txt'), `${report}\n`);
console.log(report);
process.exitCode = failures ? 1 : 0;

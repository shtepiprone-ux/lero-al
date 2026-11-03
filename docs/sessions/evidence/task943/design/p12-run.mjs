// Task 943 revision 2 feasibility run of the R12 prototype (p12-r12-prototype.mjs). Run from the project root on native Windows:
//   node docs/sessions/evidence/task943/design/p12-run.mjs <transcript-dir>
// A. AC13, p09 and p11 forms on a fixture root: the prototype must report the real file (hook evaluation only; the real
//    writes of these forms are in p09/p11). B. Every gate self-test that imports security-hook.mjs, run unchanged against
//    the prototype. C. Every Bash/PowerShell command of the given session transcripts, current hook versus prototype: each
//    target the prototype adds is listed, so false positives of R12 can be judged.
import { execFileSync, spawnSync } from 'node:child_process';
import { createReadStream, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const protoPath = execFileSync(process.execPath, [join(root, 'docs/sessions/evidence/task943/design/p12-r12-prototype.mjs')], { encoding: 'utf8' }).trim();
const proto = await import(pathToFileURL(protoPath).href);
const now = await import(pathToFileURL(join(gates, 'security-hook.mjs')).href);
const tmp = tmpdir();
// Every spelling of a user folder (Windows, forward slashes, MSYS /c/, UNC C$) is written as <user-home>.
const redact = text => text.split(tmp).join('<tmp>').split(tmp.replaceAll('\\', '/')).join('<tmp>')
  .replace(/(?:[A-Za-z]:|\/[a-z]|\\\\localhost\\[A-Za-z]\$)[\\/]+Users[\\/]+[^\\/"'\s]+/gi, '<user-home>');
const out = [];
let failures = 0;
const expect = (id, ok, detail) => { if (!ok) failures++; out.push(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? ` | ${redact(detail)}` : ''}`); };

// A. Fixture root with a long name, D/hook.mjs and D/LongScopeFileName.mjs, a junction to D and Y.
const base = mkdtempSync(join(tmp, 'p12-'));
const fixture = join(base, 'LongFixtureRootName');
mkdirSync(join(fixture, 'D'), { recursive: true });
for (const f of ['D/hook.mjs', 'D/LongScopeFileName.mjs', 'Y']) writeFileSync(join(fixture, f), 'x');
mkdirSync(join(fixture, 'scripts'));
execFileSync('cmd.exe', ['/d', '/c', 'mklink', '/J', join(base, 'j'), join(fixture, 'D')], { stdio: 'ignore' });
const alias = (dir, long) => (execFileSync('cmd.exe', ['/d', '/c', 'dir', '/x', '/a', dir], { encoding: 'utf8' })
  .match(new RegExp(`\\s(\\S+~\\d\\S*)\\s+${long.replace(/\./g, '\\.')}\\r?$`, 'im')) || [])[1];
const rootAlias = alias(base, 'LongFixtureRootName');
const fileAlias = alias(join(fixture, 'D'), 'LongScopeFileName.mjs');
const X = 'D/hook.mjs', L = 'D/LongScopeFileName.mjs';
const contract = scope => ({ version: 1, stage: 'reviewed', kind: 'governance', scope });
const entry = (tool, input, cwd) => [
  { type: 'assistant', ...(cwd ? { cwd } : {}), message: { content: [{ type: 'tool_use', id: 's0', name: tool, input }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'ok' }] } },
].map(line => JSON.stringify(line)).join('\n');
const independent = (scope, tool, input, cwd) => proto.governanceIndependenceErrors(fixture, contract([scope]), 'tasks/g.security.json', entry(tool, input, cwd)).length > 0;
const reports = (command, file, cwd) => proto.shellWriteTargets(fixture, command, cwd).includes(file);
const posix = p => p.replace(/^([A-Za-z]):\\/, (_, d) => `/${d.toLowerCase()}/`).replaceAll('\\', '/');
const product = ['pack', 'age.json'].join('');
for (const command of ['cat Y > D/hoo?.mjs', 'Get-Content Y > D/hoo?.mjs', 'cd D; cat Y > hook.mjs', 'cd D && echo x > hook.mjs',
  'Set-Location D; Get-Content Y > hook.mjs', 'Push-Location D; Set-Content hook.mjs x',
  `cd D; node -e "require('fs').writeFileSync('hook.mjs','x')"`, 'Get-Content Y > D/hook.mjs.', 'Get-Content Y > "D/hook.mjs. ."',
  'Get-Content Y > D./hook.mjs', "bash -c 'cd D; cat ../Y > hook.mjs'", 'cmd /d /c "cd D && type ..\\Y > hook.mjs"',
  `node -e "process.chdir('D'); require('fs').writeFileSync('hook.mjs','x')"`, `cat Y > ${posix(fixture)}/D/hook.mjs`,
  `Get-Content Y > '${join(base, 'j', 'hook.mjs')}'`, `Get-Content Y > '\\\\.\\${join(fixture, 'D', 'hook.mjs')}'`,
  `Get-Content Y > '\\\\?\\${join(fixture, 'D', 'hook.mjs')}'`, `Get-Content Y > '\\\\localhost\\${fixture[0]}$${fixture.slice(2)}\\D\\hook.mjs'`]) {
  expect(`AC13 reports X: ${command}`, reports(command, X), JSON.stringify(proto.shellWriteTargets(fixture, command)));
}
expect('AC13 transcript cwd <root>/D: echo x > hook.mjs', independent(X, 'Bash', { command: 'echo x > hook.mjs' }, join(fixture, 'D')));
const outside = join(base, 'Sibling'); mkdirSync(outside);
expect('AC13 transcript cwd outside the root: echo x > ../LongFixtureRootName/D/hook.mjs', independent(X, 'Bash', { command: 'echo x > ../LongFixtureRootName/D/hook.mjs' }, outside));
expect(`AC13 short alias of the file (${fileAlias})`, Boolean(fileAlias) && reports(`cat Y > D/${fileAlias}`, L), fileAlias);
expect(`AC13 short alias of the root folder (${rootAlias}), redirection`, Boolean(rootAlias) && reports(`Get-Content Y > '${join(base, rootAlias, 'D', 'hook.mjs')}'`, X));
expect('AC13 short alias of the root folder, Write tool call', Boolean(rootAlias) && independent(X, 'Write', { file_path: join(base, rootAlias, 'D', 'hook.mjs'), content: 'x' }));
const executor = (command, cwd) => proto.evaluateHook(fixture, { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: /^(Set|Add|'x')/.test(command) ? 'PowerShell' : 'Bash', tool_input: { command }, ...(cwd ? { cwd } : {}) }, '').join('\n');
expect('AC13 executor cwd <root>/scripts: echo x > check-example.mjs', /POLICY-EDIT AUTHORITY REQUIRED/.test(executor('echo x > check-example.mjs', join(fixture, 'scripts'))));
for (const command of [`Set-Content ${product} x`, 'Set-Content -Path next.config.ts -Value x', 'Add-Content tsconfig.json x',
  `'x' | Out-File -FilePath ${product}`, `node -e "require('fs').writeFileSync('${product}','x')"`, `echo x > ${posix(fixture)}/${product}`]) {
  expect(`AC13 executor refused: ${command}`, /SECURITY TEST CONTRACT MISSING/.test(executor(command)), executor(command).split(':')[0]);
}
expect('AC13 control: cd D; grep -n a hook.mjs reports []', JSON.stringify(proto.shellWriteTargets(fixture, 'cd D; grep -n a hook.mjs')) === '[]');
expect('AC13 control: unmatched glob keeps only its literal', JSON.stringify(proto.shellWriteTargets(fixture, 'cat Y > D/nomatch?.mjs')) === '["D/nomatch?.mjs"]');
expect('missing drive stays outside', proto.evaluateHook(fixture, { hook_event_name: 'PreToolUse', model: 'opus', tool_name: 'Write', tool_input: { file_path: 'Z:\\outside-audit\\profile.ts' } }, '').join('\n').includes('outside the project'));

// B. Existing self-tests against the prototype, unchanged except for the hook import.
const testsDir = join(root, 'test-results/task943-prototype/tests');
mkdirSync(testsDir, { recursive: true });
for (const name of readdirSync(gates).filter(n => n.endsWith('.selftest.mjs') && readFileSync(join(gates, n), 'utf8').includes("from './security-hook.mjs'")).sort()) {
  const real = file => pathToFileURL(join(gates, file)).href;
  const copy = readFileSync(join(gates, name), 'utf8')
    .replace("from './security-hook.mjs'", `from '${pathToFileURL(protoPath).href}'`)
    .replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
    .replace(/new URL\('\.\/([\w.-]+\.mjs)', import\.meta\.url\)/g, (_, file) => `new URL('${file === 'security-hook.mjs' ? pathToFileURL(protoPath).href : real(file)}')`)
    .replace(/const HOOK = fileURLToPath\(new URL\('[^']+'\)\);/, `const HOOK = ${JSON.stringify(protoPath)};`);
  writeFileSync(join(testsDir, name), copy);
  const run = spawnSync(process.execPath, ['--test', join(testsDir, name)], { cwd: root, encoding: 'utf8' });
  const totals = run.stdout.split('\n').filter(line => /^# (pass|fail|skipped)/.test(line)).join(', ');
  expect(`self-test ${name} unchanged against the prototype (${totals})`, run.status === 0,
    run.status === 0 ? '' : run.stdout.split('\n').filter(l => /not ok|error:|expected|actual/.test(l)).slice(0, 6).join(' / '));
}

// C. Session transcript commands: targets the prototype adds over the current hook. The argument is a transcript folder (the
// commands are frozen to test-results/task943-prototype/corpus.json, gitignored, because command text may hold private data)
// or such a frozen corpus file, so a rerun measures the same input; its sha256 is printed.
const input = process.argv[2];
const commands = new Map();
if (input && input.endsWith('.json')) for (const [command, cwd] of JSON.parse(readFileSync(input, 'utf8'))) commands.set(command, cwd);
else if (input) {
  for (const file of readdirSync(input, { recursive: true }).filter(name => String(name).endsWith('.jsonl'))) {
    for await (const line of createInterface({ input: createReadStream(join(input, String(file))) })) {
      if (!line.includes('"tool_use"')) continue;
      let ev; try { ev = JSON.parse(line); } catch { continue; }
      for (const part of ev?.message?.content || []) {
        if (part?.type === 'tool_use' && ['Bash', 'PowerShell'].includes(part.name) && typeof part.input?.command === 'string') commands.set(part.input.command, ev.cwd);
      }
    }
  }
  writeFileSync(join(root, 'test-results/task943-prototype/corpus.json'), JSON.stringify([...commands].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
}
const { createHash } = await import('node:crypto');
out.push(`corpus sha256 ${createHash('sha256').update(JSON.stringify([...commands].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))).digest('hex')}`);
const added = [], lost = [];
const { isPolicyPath, isProductPath } = await import(pathToFileURL(join(gates, 'contract.mjs')).href);
const guarded = t => !t.startsWith('../') && !/^[A-Za-z]:/.test(t) && (isPolicyPath(t) || isProductPath(t) || /^(?:tasks|docs)\//.test(t));
const counts = { inside: 0, outsideOrBogus: 0, guarded: 0 };
for (const [command, cwd] of commands) {
  const before = now.shellWriteTargets(root, command), after = proto.shellWriteTargets(root, command, cwd);
  const missing = before.filter(t => !after.includes(t));
  if (missing.length) lost.push([command, missing, after]);
  const extra = after.filter(t => !before.includes(t));
  if (extra.length) added.push([command, extra]);
  for (const t of extra) { if (t.startsWith('../') || /^[A-Za-z]:/.test(t)) counts.outsideOrBogus++; else counts.inside++; if (guarded(t)) counts.guarded++; }
}
out.push(`transcript commands ${commands.size}; commands whose current targets the prototype drops ${lost.length}; commands with added targets ${added.length}`);
out.push(`added targets: outside the project ${counts.outsideOrBogus}; inside ${counts.inside}; of these a policy, product, tasks/ or docs/ path ${counts.guarded}`);
for (const [command, missing, after] of lost) out.push(`  dropped ${JSON.stringify(missing)} now ${JSON.stringify(after)} for ${JSON.stringify(command.length > 160 ? `${command.slice(0, 160)}…` : command)}`);
for (const [command, extra] of added.filter(([, extra]) => extra.some(guarded))) out.push(`  added guarded ${JSON.stringify(extra.filter(guarded))} for ${JSON.stringify(command.length > 160 ? `${command.slice(0, 160)}…` : command)}`);
// Harm measures. (1) Executor pre-write guard: a command allowed today and refused by the prototype (no receipt, a
// transcript with no task receipt, as for a Sonnet executor without a contract). (2) Governance independence: added targets
// that are scope files of a governance contract in this repository.
const { allContracts, readJson } = await import(pathToFileURL(join(gates, 'cli.mjs')).href);
const governanceScope = new Set();
for (const path of allContracts(root)) { try { const c = readJson(root, path); if (c.kind === 'governance') for (const s of c.scope || []) governanceScope.add(s.toLowerCase()); } catch { /* unreadable */ } }
let newlyRefused = 0, scopeHits = 0;
const refusedExamples = [], scopeExamples = [];
for (const [command, cwd] of commands) {
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, tool_input: { command }, ...(cwd ? { cwd } : {}) };
  const before = now.evaluateHook(root, event, ''), after = proto.evaluateHook(root, event, '');
  if (!before.length && after.length) {
    newlyRefused++;
    const extra = proto.shellWriteTargets(root, command, cwd).filter(t => !now.shellWriteTargets(root, command).includes(t));
    if (refusedExamples.length < 15) refusedExamples.push([command, `${after[0].split(':')[0]}; ${extra.slice(0, 4).map(t => `${t} <- ${proto.R12_WHY.get(t)}`).join(', ')}`]);
  }
  const extra = proto.shellWriteTargets(root, command, cwd).filter(t => !now.shellWriteTargets(root, command).includes(t));
  const hits = extra.filter(t => governanceScope.has(t.toLowerCase())).map(t => `${t} <- ${proto.R12_WHY.get(t)}`);
  if (hits.length) { scopeHits++; if (scopeExamples.length < 15) scopeExamples.push([command, hits]); }
}
out.push(`executor guard: commands allowed today and refused by the prototype ${newlyRefused}`);
for (const [command, error] of refusedExamples) out.push(`  newly refused (${error}) ${JSON.stringify(command.length > 160 ? `${command.slice(0, 160)}…` : command)}`);
out.push(`governance independence: commands whose added targets are governance scope files ${scopeHits} (governance scope files in the repository ${governanceScope.size})`);
for (const [command, hits] of scopeExamples) out.push(`  scope hit ${JSON.stringify(hits)} for ${JSON.stringify(command.length > 160 ? `${command.slice(0, 160)}…` : command)}`);
out.push(`FAILURES ${failures}`);
console.log(redact(out.join('\n')));
process.exitCode = failures ? 1 : 0;

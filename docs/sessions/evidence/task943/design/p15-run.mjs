// Task 943 revision 4 feasibility run (review 1 of the Task 943 candidate, 2026-11-03). Run from the project root on native
// Windows: node docs/sessions/evidence/task943/design/p15-run.mjs
// The prototype is the candidate hook (working tree) with the replacement pairs of p15-r13-pairs.txt applied (R13 (a)-(d)
// and R12 (d) for Write/Edit of the pre-write guard), written to test-results/task943-r4/security-hook.mjs (gitignored).
// A. Revision 4 forms on a fixture root: deny forms report X and the executor guard refuses them; controls stay silent.
// B. Every gate self-test that imports security-hook.mjs, against the prototype; shell-write.selftest.mjs with the K1
//    change only (two assertions), also against the candidate hook. C. The frozen 2318-command corpus, candidate hook
//    versus prototype.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const design = join(root, 'docs/sessions/evidence/task943/design');
const work = join(root, 'test-results/task943-r4');
mkdirSync(join(work, 'tests'), { recursive: true });
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const tmp = tmpdir();
const redact = text => text.split(tmp).join('<tmp>').split(tmp.replaceAll('\\', '/')).join('<tmp>')
  .replace(/(?:[A-Za-z]:|\/[a-z]|\\\\localhost\\[A-Za-z]\$)[\\/]+Users[\\/]+[^\\/"'\s]+/gi, '<user-home>');
const out = [];
let failures = 0;
const expect = (id, ok, detail) => { if (!ok) failures++; out.push(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? ` | ${redact(detail)}` : ''}`); };
const short = command => JSON.stringify(command.length > 140 ? `${command.slice(0, 140)}…` : command);

// Build the prototype.
const real = file => pathToFileURL(join(gates, file)).href;
const candidate = join(gates, 'security-hook.mjs');
const protoPath = join(work, 'security-hook.mjs');
writeFileSync(protoPath, readFileSync(candidate, 'utf8').replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`));
execFileSync(process.execPath, [join(design, 'p15-apply-pairs.mjs'), protoPath, join(design, 'p15-r13-pairs.txt')]);
out.push(`candidate hook sha256 ${sha(candidate)}; pairs sha256 ${sha(join(design, 'p15-r13-pairs.txt'))}; prototype sha256 ${sha(protoPath)}`);
const proto = await import(pathToFileURL(protoPath).href);
const now = await import(pathToFileURL(candidate).href);

// A. Forms.
const fixture = mkdtempSync(join(tmp, 'p15-'));
const X = 'scripts/workflow-gates/fixture-scope.mjs', Y = 'docs/y.mjs', Z = 'docs/elsewhere/z.mjs', P = 'scripts/check-example.mjs';
for (const file of [X, Y, P, 'docs/ydir/f.mjs']) { mkdirSync(dirname(join(fixture, file)), { recursive: true }); writeFileSync(join(fixture, file), 'a\n'); }
const executor = (command, tool = 'Bash', cwd) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, ...(cwd ? { cwd } : {}), tool_input: typeof command === 'string' ? { command } : command });
const deny = [
  // R13 (b): nested shells and evaluators.
  `bash -c 'cp ${Y} ${X}'`, `bash -c "rm -f ${X}"`, `sh -c 'sed -i s/a/b/ ${X}'`, `bash -c 'cd scripts/workflow-gates; rm fixture-scope.mjs'`,
  `powershell -Command "Copy-Item ${Y} ${X}"`, `powershell -NoProfile -Command "Remove-Item ${X}"`, `pwsh -c "Remove-Item ${X}"`,
  `cmd /c "copy ${Y} ${X}"`, `cmd /d /c "del ${X}"`, `eval "cp ${Y} ${X}"`, `iex "Remove-Item ${X}"`, `Invoke-Expression "Remove-Item ${X}"`,
  `Start-Process cp -ArgumentList ${Y},${X}`, `Start-Process -FilePath cp -ArgumentList "${Y} ${X}"`,
  // R13 (a): runners.
  `exec cp ${Y} ${X}`, `timeout 5 rm ${X}`, `timeout -s KILL 5 rm ${X}`, `nice rm ${X}`, `nice -n 5 rm ${X}`, `stdbuf -o0 rm ${X}`,
  `builtin cd scripts; rm workflow-gates/fixture-scope.mjs`,
  // R13 (c): a parser-rejected command with a quoted option or a named directory.
  `sed "-i" 's/a/b/' ${X} '`, `sed '-i' 's/a/b/' ${X} "`, `find ${X} "-delete" '`,
  // R13 (d): pipeline input.
  `Get-ChildItem scripts/workflow-gates | Remove-Item`, `Get-Item ${X} | Remove-Item`, `Get-Item ${X} | Move-Item -Destination docs`,
  `Get-Item ${X} | Clear-Content`, `Get-Item ${X} | Rename-Item -NewName other.mjs`, `ls scripts/workflow-gates | rm`,
];
// Forms the candidate already reports (write word or R1 fallback): regression only.
const covered = [`node -e "require('child_process').execSync('rm ${X}')"`, `Get-Item ${X} | Set-Content -Value x`, `pwsh -c "Set-Content ${X} x"`, `Invoke-Command -ScriptBlock { Remove-Item ${X} }`];
for (const command of [...deny, ...covered]) {
  const targets = proto.shellWriteTargets(fixture, command);
  const refusal = proto.evaluateHook(fixture, executor(command.replaceAll(X, P)), '');
  expect(`R13 deny reports X and the executor guard refuses: ${command}`, targets.includes(X) && refusal.length > 0,
    `${JSON.stringify(targets)} | ${JSON.stringify(refusal.map(e => e.split(':')[0]))}`);
  if (deny.includes(command)) expect(`R13 deny form missed by the candidate: ${command}`, !now.shellWriteTargets(fixture, command).includes(X));
}
// Out of scope (section 4): a path held in a variable, here a pipeline variable inside a script block.
out.push(`out of scope, prototype targets for ForEach-Object with $_: ${JSON.stringify(proto.shellWriteTargets(fixture, 'Get-ChildItem scripts/workflow-gates | ForEach-Object { Remove-Item $_.FullName }'))}`);
// Controls: reading or copying out a scope file through the same programs reports no X.
for (const command of [`bash -c 'cp ${X} ${Z}'`, `bash -c 'grep -n a ${X}'`, `eval "cat ${X}"`, `powershell -Command "Get-Content ${X}"`,
  `cmd /c "type ${X}"`, `timeout 5 cat ${X}`, `nice grep a ${X}`, `Get-Item ${X} | Copy-Item -Destination docs/`, `Get-Content ${X} | Select-String a`,
  `Start-Process cat -ArgumentList ${X}`, `Get-ChildItem scripts/workflow-gates | Select-Object Name`]) {
  const targets = proto.shellWriteTargets(fixture, command);
  expect(`R13 control reports no X: ${command}`, !targets.includes(X), JSON.stringify(targets));
}
// R12 (d) for the pre-write guard's Write/Edit paths.
const scripts = join(fixture, 'scripts');
expect('F2 executor Write of a relative path in cwd <root>/scripts is refused', proto.evaluateHook(fixture, executor({ file_path: 'check-example.mjs', content: 'x' }, 'Write', scripts), '').join('\n').includes('POLICY-EDIT AUTHORITY REQUIRED'));
expect('F2 executor Edit of a relative path in cwd <root>/scripts is refused', proto.evaluateHook(fixture, executor({ file_path: 'check-example.mjs', old_string: 'a', new_string: 'b' }, 'Edit', scripts), '').join('\n').includes('POLICY-EDIT AUTHORITY REQUIRED'));
expect('F2 candidate allows that Write', now.evaluateHook(fixture, executor({ file_path: 'check-example.mjs', content: 'x' }, 'Write', scripts), '').length === 0);
expect('F2 control: absolute Write into docs/ with cwd <root>/scripts stays allowed', proto.evaluateHook(fixture, executor({ file_path: join(fixture, 'docs/note.md'), content: 'x' }, 'Write', scripts), '').length === 0);
expect('F2 control: relative Write from a cwd outside the root is refused as outside', proto.evaluateHook(fixture, executor({ file_path: 'note.md', content: 'x' }, 'Write', tmp), '').join('\n').includes('outside the project'));
// Sub-review findings of the revision 3 candidate (completion report, F1-F8): each must be closed by the prototype.
const refusedWith = (event, pattern) => proto.evaluateHook(fixture, event, '').join('\n').match(pattern) !== null;
for (const [tool, command] of [['PowerShell', 'Set-Content package.json $x'], ['PowerShell', '"$x" | Out-File -FilePath package.json']]) {
  expect(`F1 executor ${command} is refused`, refusedWith(executor(command, tool), /SECURITY TEST CONTRACT MISSING/));
  expect(`F1 candidate allows ${command}`, now.evaluateHook(fixture, executor(command, tool), '').length === 0);
}
for (const command of [`find scripts/workflow-gates -name '*.mjs' -exec sed -i 's/a/b/' {} +`, 'find scripts/workflow-gates -name x -exec rm {} \\;']) {
  expect(`F2 reports X: ${command}`, proto.shellWriteTargets(fixture, command).includes(X), JSON.stringify(proto.shellWriteTargets(fixture, command).slice(0, 4)));
  expect(`F2 candidate misses X: ${command}`, !now.shellWriteTargets(fixture, command).includes(X));
}
const f3 = `cmd /d /c "cd /d ${join(fixture, 'scripts').replaceAll('\\', '/')} && echo x > check-example.mjs"`;
expect('F3 executor cmd /d /c "cd /d <abs>/scripts && echo x > check-example.mjs" is refused', refusedWith(executor(f3), /POLICY-EDIT AUTHORITY REQUIRED/));
expect('F3 candidate allows it', now.evaluateHook(fixture, executor(f3), '').length === 0);
const f4 = 'sed -i "s/a/$x/" scripts/workflow-gates/*.mjs';
expect(`F4 reports X: ${f4}`, proto.shellWriteTargets(fixture, f4).includes(X), JSON.stringify(proto.shellWriteTargets(fixture, f4)));
expect(`F4 candidate misses X: ${f4}`, !now.shellWriteTargets(fixture, f4).includes(X));
expect("F7 control: executor node -e with the string method replace is allowed", proto.evaluateHook(fixture, executor(`node -e "'a'.replace('src/app/page.tsx','y')"`), '').length === 0);
expect("F7 candidate refuses it", now.evaluateHook(fixture, executor(`node -e "'a'.replace('src/app/page.tsx','y')"`), '').length > 0);
expect('F7 regression: shutil.copy and fs.rm with literal paths still report X', proto.shellWriteTargets(fixture, `python -c "import shutil; shutil.copy('${Y}', '${X}')"`).includes(X)
  && proto.shellWriteTargets(fixture, `node -e "require('fs').rm('${X}', () => 0)"`).includes(X));
const timed = (fn) => { const t = performance.now(); fn(); return Math.round(performance.now() - t); };
const noRole = command => ({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } });
for (const command of ['rm -rf docs', 'cp -r docs backup/']) {
  const ms = timed(() => proto.evaluateHook(root, noRole(command), ''));
  expect(`F5 evaluateHook without a role on the real root: ${command} in ${ms} ms (limit 5000)`, ms < 5000);
}
for (const [name, command] of [['parsed', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo y > z`],
  ['parser-rejected', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo $y > z`]]) {
  const ms = timed(() => proto.shellWriteTargets(fixture, command));
  // The limit is the 15 s timeout of the security hook, whose failure blocks the call (.claude/settings.json).
  expect(`F8 ${name} command of ${command.length} characters with 5000 folder changes in ${ms} ms (limit 15000)`, ms < 15000);
}
rmSync(fixture, { recursive: true, force: true });

// B. Self-tests against the prototype, unchanged except for the hook import; shell-write.selftest.mjs with the K1 change.
const K1_FROM = 'assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), command);';
const K1_TO = "assert.deepEqual(shellWriteTargets(root, command), [...previousTargets(root, command), ...(K1.has(command) ? ['writeFileSync'] : [])], command);";
const K1_SET = "const K1 = new Set([`sed -i 's/a/b/' ${X} writeFileSync`, `sed -n 1p -i>o.txt ${X} writeFileSync`]);";
const k1 = text => {
  const count = text.split(K1_FROM).length - 1;
  return text.split(K1_FROM).join(K1_TO).replace("const Y = 'scripts/workflow-gates/reader.mjs';", m => `${m}\n${K1_SET}`) + `\n// K1 replacements: ${count}\n`;
};
const runCopy = (name, hookPath, transform = text => text, label = 'prototype') => {
  const copy = transform(readFileSync(join(gates, name), 'utf8')
    .replace("from './security-hook.mjs'", `from '${pathToFileURL(hookPath).href}'`)
    .replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
    .replace(/new URL\('\.\/([\w.-]+\.mjs)', import\.meta\.url\)/g, (_, file) => `new URL('${file === 'security-hook.mjs' ? pathToFileURL(hookPath).href : real(file)}')`)
    .replace(/const HOOK = fileURLToPath\(new URL\('[^']+'\)\);/, `const HOOK = ${JSON.stringify(hookPath)};`));
  const file = join(work, 'tests', `${label}-${name}`);
  writeFileSync(file, copy);
  const run = spawnSync(process.execPath, ['--test', file], { cwd: root, encoding: 'utf8' });
  const totals = run.stdout.split('\n').filter(line => /^# (pass|fail|skipped)/.test(line)).join(', ');
  expect(`self-test ${name} against the ${label}${transform === k1 ? ' with the K1 change' : ''} (${totals})`, run.status === 0,
    run.status === 0 ? '' : run.stdout.split('\n').filter(l => /not ok|error:/.test(l)).slice(0, 4).join(' / '));
};
const hookTests = readdirSync(gates).filter(n => n.endsWith('.selftest.mjs') && readFileSync(join(gates, n), 'utf8').includes("from './security-hook.mjs'")).sort();
for (const name of hookTests) runCopy(name, protoPath, name === 'shell-write.selftest.mjs' ? k1 : undefined);
runCopy('shell-write.selftest.mjs', candidate, k1, 'candidate');
out.push(`K1 replacements in shell-write.selftest.mjs: ${readFileSync(join(work, 'tests', 'candidate-shell-write.selftest.mjs'), 'utf8').match(/K1 replacements: (\d+)/)[1]}`);

// C. Frozen corpus, candidate versus prototype.
const corpusFile = join(root, 'test-results/task943-prototype/corpus.json');
const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
out.push(`corpus ${corpus.length} commands, sha256 ${createHash('sha256').update(JSON.stringify(corpus)).digest('hex')}`);
const { isPolicyPath, isProductPath } = await import(real('contract.mjs'));
const { allContracts, readJson } = await import(real('cli.mjs'));
const guarded = t => !t.startsWith('../') && !/^[A-Za-z]:/.test(t) && (isPolicyPath(t) || isProductPath(t) || /^(?:tasks|docs|\.git)\//i.test(t));
const governanceScope = new Set();
for (const path of allContracts(root)) { try { const c = readJson(root, path); if (c.kind === 'governance') for (const s of c.scope || []) governanceScope.add(s.toLowerCase()); } catch { /* unreadable */ } }
let addedCommands = 0, guardedCommands = 0, dropped = 0, refused = 0, scopeHits = 0;
const refusedExamples = [], guardedExamples = [], droppedExamples = [], scopeExamples = [];
for (const [command, cwd] of corpus) {
  const before = now.shellWriteTargets(root, command, cwd), after = proto.shellWriteTargets(root, command, cwd);
  if (before.some(t => !after.includes(t))) { dropped++; if (droppedExamples.length < 15) droppedExamples.push(`  dropped ${JSON.stringify(before.filter(t => !after.includes(t)).slice(0, 3))} for ${short(command)}`); }
  const extra = after.filter(t => !before.includes(t));
  if (extra.length) addedCommands++;
  if (extra.some(guarded)) { guardedCommands++; if (guardedExamples.length < 12) guardedExamples.push(`  added guarded ${JSON.stringify(extra.filter(guarded).slice(0, 3))} for ${short(command)}`); }
  if (extra.some(t => governanceScope.has(t.toLowerCase()))) { scopeHits++; if (scopeExamples.length < 10) scopeExamples.push(`  scope hit ${JSON.stringify(extra.filter(t => governanceScope.has(t.toLowerCase())).slice(0, 3))} for ${short(command)}`); }
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = executor(command, tool, cwd);
  if (!now.evaluateHook(root, event, '').length) {
    const after2 = proto.evaluateHook(root, event, '');
    if (after2.length) { refused++; if (refusedExamples.length < 12) refusedExamples.push(`  newly refused (${after2[0].split(':')[0]}) ${short(command)}`); }
  }
}
out.push(`commands whose candidate targets the prototype drops ${dropped}; commands with added targets ${addedCommands}; with an added guarded target ${guardedCommands}`);
out.push(...droppedExamples, ...guardedExamples);
out.push(`executor guard: commands the candidate allows and the prototype refuses ${refused}`);
out.push(...refusedExamples);
out.push(`governance independence: commands whose added targets are governance scope files ${scopeHits}`, ...scopeExamples);
// R1: the result is a superset of the Task 941 result (the hook at b85f5a66b), both sides normalised by R12 (a).
const hook941Path = join(work, 'hook-941.mjs');
writeFileSync(hook941Path, execFileSync('git', ['show', 'b85f5a66b:scripts/workflow-gates/security-hook.mjs'], { encoding: 'utf8' })
  .replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`));
const hook941 = await import(pathToFileURL(hook941Path).href);
const norm = t => proto.shellWriteTargets(root, `echo x > "${t.replaceAll('"', '')}"`)[0] ?? t;
let lost941 = 0;
const lost941Examples = [];
for (const [command] of corpus) {
  const after = new Set(proto.shellWriteTargets(root, command).map(t => t.toLowerCase()));
  const missing = hook941.shellWriteTargets(root, command).filter(t => !after.has(t.toLowerCase()) && !after.has(norm(t).toLowerCase()));
  if (missing.length) { lost941++; if (lost941Examples.length < 8) lost941Examples.push(`  941 target not kept ${JSON.stringify(missing.slice(0, 3))} for ${short(command)}`); }
}
out.push(`R1 superset: commands whose Task 941 targets the prototype does not keep (after R12 (a) normalisation) ${lost941}`, ...lost941Examples);
expect('R1 superset over the frozen corpus', lost941 === 0);
out.push(`FAILURES ${failures}`);
console.log(redact(out.join('\n')));
process.exitCode = failures ? 1 : 0;

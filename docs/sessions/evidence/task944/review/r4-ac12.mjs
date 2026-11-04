// Task 944 review 4 self-audit (read-only for the project): AC12 taken mechanically from the archived kickoff text, not from the task's
// self-test, and run directly on the final hook on a temporary fixture root; then forms this review chose that the R8 text reads on.
// The base hook is the copy r3-adversarial.mjs saved in test-results/944-r3/. Usage (project root): node docs/sessions/evidence/task944/review/r4-ac12.mjs
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateHook, governanceIndependenceErrors, shellWriteTargets } from '../../../../../scripts/workflow-gates/security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const base = await import(pathToFileURL(resolve(ROOT, 'test-results/944-r3/base-hook.mjs')).href);
const text = readFileSync(resolve(ROOT, 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.md'), 'utf8').replace(/\r\n/g, '\n');
const ac12 = text.slice(text.indexOf('- **AC12 [R8; R9].**'), text.indexOf('- **AC13 [R10].**'));
const between = (from, to) => { const start = ac12.indexOf(from) + from.length; return ac12.slice(start, ac12.indexOf(to, start)); };
const quoted = part => [...part.matchAll(/`([^`]+)`/g)].map(match => match[1].replace(/\n\s*/g, ' '));
const forms = quoted(between('N its file name:', '(Y a fixture file named N'));
const controls = quoted(between('Controls report no X:', 'Sensitivity (through'));
const fill = (form, x, d, n, y) => form.replace('<folder of Y>', 'docs').replace('<folder holding N>', 'docs/src')
  .replace(/(?<![/\w])Y(?![\w])/g, y).replace(/(?<![\w/.\]$])X(?![\w])/g, x).replace(/(?<![\w.\]])D(?![\w])/g, d).replace(/(?<![\w.])N(?![\w])/g, n);
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', Y = `docs/${N}`, P = 'scripts/check-example.mjs';
const root = mkdtempSync(join(tmpdir(), 'lero-r4-ac12-'));
for (const file of [X, Y, P, `docs/src/${N}`]) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), 'a\n'); }
const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: [X] };
const transcript = command => [{ type: 'assistant', message: { content: [{ type: 'tool_use', id: 's0', name: 'Bash', input: { command } }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'output' }] } }].map(line => JSON.stringify(line)).join('\n');
const executor = (command, tool = 'Bash') => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, cwd: root, tool_input: { command } });
let failures = 0;
const fail = message => { failures++; console.log(`FAIL ${message}`); };
console.log(`AC12 text: ${forms.length} forms, ${controls.length} controls`);
for (const form of forms) {
  const command = fill(form, X, D, N, Y);
  if (!shellWriteTargets(root, command, root).includes(X)) fail(`X not reported: ${command}`);
  if (!governanceIndependenceErrors(root, contract, 'tasks/gov_kickoff.security.json', transcript(command)).join('\n').includes('GOVERNANCE INDEPENDENCE')) fail(`no independence error: ${command}`);
  const hostile = fill(form, P, 'scripts', 'check-example.mjs', Y);
  if (!/POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/.test(evaluateHook(root, executor(hostile), '').join('\n'))) fail(`executor allowed: ${hostile}`);
}
for (const form of controls) {
  const command = fill(form, X, D, N, Y);
  if (shellWriteTargets(root, command, root).includes(X)) fail(`control reports X: ${command}`);
}
console.log(`AC12 result: failures ${failures}`);
const form = (name, command) => [name, command];
const extra = [
  form('R8 (c) mode= after another keyword', `python -c "open('${X}', buffering=1, mode='w')"`),
  form('R8 (c) Path.open with mode=', `python -c "from pathlib import Path; Path('${X}').open(mode='w')"`),
  form('R8 (c) open with double quotes and flags=', `node -e "fs.open(\\"${X}\\", flags='w')"`),
  form('R8 (c) .NET Create with double quotes', `powershell -Command "[IO.File]::Create(\\"${X}\\")"`),
  form('R8 (c) shutil.rmtree keyword path', `python -c "import shutil; shutil.rmtree(path='${D}')"`),
  form('R8 (a) keyword on its own line', `if true\nthen\n  rm ${X}\nfi`),
  form('R8 (a) do on its own line', `for f in a\ndo\n  rm ${X}\ndone`),
  form('R8 (a) ! before the program', `! rm ${X}`),
  form('R8 (a) case-sensitive keyword is no keyword (control-like)', `IF true; then rm ${X}; fi`),
  form('PowerShell if block', `if ($true) { Remove-Item ${X} }`),
  form('PowerShell foreach block', `foreach ($f in 1) { Remove-Item ${X} }`),
  form('PowerShell try block', `try { Remove-Item ${X} } catch { }`),
  form('PowerShell ForEach-Object block', `1 | ForEach-Object { Remove-Item ${X} }`),
  form('PowerShell rm alias in a block', `if ($true) { rm ${X} }`),
  form('PowerShell Set-Content in a block', `if ($true) { Set-Content ${X} 'a' }`),
];
console.log('\n## forms chosen by this self-audit (final hook, base hook)');
for (const [name, command] of extra) {
  const has = hook => hook.shellWriteTargets(root, command, root).includes(X);
  const refused = evaluateHook(root, executor(command.replaceAll(X, P), command.startsWith('if (') || command.includes('Remove-Item') ? 'PowerShell' : 'Bash'), '').length > 0;
  console.log(`${has({ shellWriteTargets }) ? 'REPORTED' : 'MISSED  '} (base ${has(base) ? 'reported' : 'missed'}; executor ${refused ? 'refused' : 'ALLOWED'}) ${name}: ${command.replace(/\n/g, ' \\n ')}`);
}
rmSync(root, { recursive: true, force: true });
process.exitCode = failures ? 1 : 0;

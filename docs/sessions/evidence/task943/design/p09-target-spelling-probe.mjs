// Task 943 revision 2 design probe (2026-11-02): spellings of a write target that reach a file the hook does not report.
// Real writes run only inside temporary folders (Git Bash and Windows PowerShell 5.1); the hook functions are the
// working-tree security-hook.mjs and are only called, never changed. Run from the project root on native Windows:
//   node docs/sessions/evidence/task943/design/p09-target-spelling-probe.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, globSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, writeFileSync as save } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd().replaceAll('\\', '/');
const hookFile = 'scripts/workflow-gates/security-hook.mjs';
const hook = await import(pathToFileURL(join(root, hookFile)).href);
const bash = existsSync('C:/Program Files/Git/bin/bash.exe') ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const lines = [`node ${process.version}; ${execFileSync(bash, ['--version'], { encoding: 'utf8' }).split('\n')[0]}; hook sha256 ${sha(hookFile)}`];

// A fixture: D/hook.mjs and D/LongFileName.mjs hold "old", Y holds "new".
function run(shell, command) {
  const dir = mkdtempSync(join(tmpdir(), 'p09-'));
  mkdirSync(join(dir, 'D'));
  save(join(dir, 'D', 'hook.mjs'), 'old');
  save(join(dir, 'D', 'LongFileName.mjs'), 'old');
  save(join(dir, 'Y'), 'new');
  if (shell === 'bash') spawnSync(bash, ['-c', command], { cwd: dir, encoding: 'utf8' });
  else {
    save(join(dir, 'probe.ps1'), command);
    spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(dir, 'probe.ps1')], { cwd: dir, encoding: 'utf8' });
  }
  // PowerShell 5.1 `>` writes UTF-16, so the state is reported as old/changed rather than as text.
  const read = file => existsSync(join(dir, file)) ? (readFileSync(join(dir, file), 'utf8') === 'old' ? 'old' : 'changed') : 'absent';
  return `D/hook.mjs=${read('D/hook.mjs')}; D/LongFileName.mjs=${read('D/LongFileName.mjs')}; D=${JSON.stringify(readdirSync(join(dir, 'D')))}`;
}
const shortName = (dir, long) => {
  // `dir /x <parent>` lists each entry of the parent folder as `<short> <long>`.
  const listing = execFileSync('cmd.exe', ['/d', '/c', 'dir', '/x', '/a', dir], { encoding: 'utf8' });
  const match = listing.match(new RegExp(`\\s(\\S+~\\d\\S*)\\s+${long.replace('.', '\\.')}\\r?$`, 'im'));
  return match ? match[1] : null;
};
const targets = command => JSON.stringify(hook.shellWriteTargets(root, command));

// T1. A glob in a redirection target writes the one file it matches.
lines.push(`T1-glob bash 'cat Y > D/hoo?.mjs' | real: ${run('bash', 'cat Y > D/hoo?.mjs')}`);
lines.push(`T1-glob powershell 'Get-Content Y > D/hoo?.mjs' | real: ${run('powershell', 'Get-Content Y > D/hoo?.mjs')}`);
lines.push(`T1-glob hook 'cat Y > scripts/workflow-gates/security-hoo?.mjs' | targets=${targets('cat Y > scripts/workflow-gates/security-hoo?.mjs')}`);
lines.push(`T1-glob node fs.globSync('scripts/workflow-gates/security-hoo?.mjs') = ${JSON.stringify(globSync('scripts/workflow-gates/security-hoo?.mjs').map(p => p.replaceAll('\\', '/')))}`);

// T2. A folder change inside the command moves a relative target (read-only and other commands).
lines.push(`T2-cd bash 'cd D; cat Y > hook.mjs' | real: ${run('bash', 'cd D; cat Y > hook.mjs')}`);
lines.push(`T2-cd bash 'cd D && echo x > hook.mjs' | real: ${run('bash', 'cd D && echo x > hook.mjs')}`);
lines.push(`T2-cd powershell 'Set-Location D; Get-Content Y > hook.mjs' | real: ${run('powershell', 'Set-Location D; Get-Content Y > hook.mjs')}`);
lines.push(`T2-cd powershell 'Push-Location D; Set-Content hook.mjs x' | real: ${run('powershell', 'Push-Location D; Set-Content hook.mjs x')}`);
lines.push(`T2-cd hook 'cd scripts/workflow-gates; cat Y > security-hook.mjs' | targets=${targets('cd scripts/workflow-gates; cat Y > security-hook.mjs')}`);
lines.push(`T2-cd hook 'cd scripts/workflow-gates && echo x > security-hook.mjs' | targets=${targets('cd scripts/workflow-gates && echo x > security-hook.mjs')}`);
lines.push(`T2-cd hook 'Push-Location scripts/workflow-gates; Set-Content security-hook.mjs x' | targets=${targets('Push-Location scripts/workflow-gates; Set-Content security-hook.mjs x')}`);

// T3. The shell folder of an earlier tool call: the transcript entry of a tool call carries it as `cwd`, the hook ignores it.
const fixture = mkdtempSync(join(tmpdir(), 'p09-root-'));
const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: [hookFile] };
const entry = (cwd, command) => [
  { type: 'assistant', cwd, message: { content: [{ type: 'tool_use', id: 's0', name: 'Bash', input: { command } }] } },
  { type: 'user', cwd, message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'output' }] } },
].map(line => JSON.stringify(line)).join('\n');
const sub = join(fixture, 'scripts', 'workflow-gates');
lines.push(`T3-cwd hook independence, entry cwd ${JSON.stringify('<root>/scripts/workflow-gates')}, 'echo x > security-hook.mjs' | errors=${hook.governanceIndependenceErrors(fixture, contract, 'tasks/g.security.json', entry(sub, 'echo x > security-hook.mjs')).length}`);
lines.push(`T3-cwd hook independence control, entry cwd <root>, 'echo x > ${hookFile}' | errors=${hook.governanceIndependenceErrors(fixture, contract, 'tasks/g.security.json', entry(fixture, `echo x > ${hookFile}`)).length}`);

// T4. A Windows 8.3 short name reaches the long file; the hook and the Write/Edit branch keep the literal spelling.
{
  // A fresh folder with the same single long name gets the same short name as each run() fixture.
  const probeDir = mkdtempSync(join(tmpdir(), 'p09-'));
  mkdirSync(join(probeDir, 'D'));
  save(join(probeDir, 'D', 'LongFileName.mjs'), 'old');
  const short = shortName(join(probeDir, 'D'), 'LongFileName.mjs');
  lines.push(`T4-short fixture short name of LongFileName.mjs: ${short}`);
  lines.push(`T4-short bash 'cat Y > D/${short}' | real: ${run('bash', `cat Y > D/${short}`)}`);
  lines.push(`T4-short powershell 'Get-Content Y > D/${short}' | real: ${run('powershell', `Get-Content Y > D/${short}`)}`);
}
const hookShort = shortName(join(root, 'scripts/workflow-gates'), 'security-hook.mjs');
const dirShort = shortName(join(root, 'scripts'), 'workflow-gates');
lines.push(`T4-short project short names: security-hook.mjs=${hookShort}; workflow-gates=${dirShort}`);
for (const spelling of [`scripts/workflow-gates/${hookShort}`, `scripts/${dirShort}/security-hook.mjs`]) {
  lines.push(`T4-short hook ${JSON.stringify(spelling)} | shell targets=${targets(`cat Y > ${spelling}`)} | realpathSync=${JSON.stringify(realpathSync(spelling).replaceAll('\\', '/').slice(root.length + 1))} | realpathSync.native=${JSON.stringify(realpathSync.native(spelling).replaceAll('\\', '/').slice(root.length + 1))}`);
  const write = [
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'w0', name: 'Write', input: { file_path: join(root, spelling), content: 'x' } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'w0', content: 'ok' }] } },
  ].map(line => JSON.stringify(line)).join('\n');
  lines.push(`T4-short hook independence for a Write tool call to ${JSON.stringify(spelling)} on the project root | errors=${hook.governanceIndependenceErrors(root, contract, 'tasks/g.security.json', write).length}`);
  lines.push(`T4-short hook independence control for a Shell redirection to ${JSON.stringify(hookFile)} on the project root | errors=${hook.governanceIndependenceErrors(root, contract, 'tasks/g.security.json', entry(root, `echo x > ${hookFile}`)).length}`);
}

// T5. Trailing dots and spaces: PowerShell (Win32 normalization) writes the file without them, Git Bash does not.
lines.push(`T5-dot powershell 'Get-Content Y > D/hook.mjs.' | real: ${run('powershell', 'Get-Content Y > D/hook.mjs.')}`);
lines.push(`T5-dot powershell 'Get-Content Y > "D/hook.mjs. ."' | real: ${run('powershell', 'Get-Content Y > "D/hook.mjs. ."')}`);
lines.push(`T5-dot powershell 'Get-Content Y > D./hook.mjs' | real: ${run('powershell', 'Get-Content Y > D./hook.mjs')}`);
lines.push(`T5-dot bash 'cat Y > D/hook.mjs.' | real: ${run('bash', 'cat Y > D/hook.mjs.')}`);
lines.push(`T5-dot hook 'Get-Content Y > ${hookFile}.' | targets=${targets(`Get-Content Y > ${hookFile}.`)}`);
lines.push(`T5-dot hook 'Get-Content Y > scripts/workflow-gates./security-hook.mjs' | targets=${targets('Get-Content Y > scripts/workflow-gates./security-hook.mjs')}`);
lines.push(`T5-dot node existsSync(${JSON.stringify(`${hookFile}.`)})=${existsSync(`${hookFile}.`)}`);

// T6. A write word naming a file without a listed folder prefix (a project-root product file, or a bare name after a folder
// change) reports nothing, for the shell targets and for the executor pre-write guard; a redirection is the control.
for (const [tool, command] of [
  ['PowerShell', 'Set-Content package.json x'], ['PowerShell', 'Set-Content -Path next.config.ts -Value x'],
  ['PowerShell', 'Add-Content tsconfig.json x'], ['PowerShell', "'x' | Out-File -FilePath package.json"],
  ['Bash', "node -e \"require('fs').writeFileSync('package.json','x')\""], ['PowerShell', 'Set-Content src/example.ts x'],
  ['Bash', 'echo x > package.json'],
]) {
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, tool_input: { command } };
  const refusal = hook.evaluateHook(root, event, '').map(error => error.split(':')[0]);
  lines.push(`T6-root hook ${JSON.stringify(command)} | targets=${targets(command)} | executor PreToolUse=${JSON.stringify(refusal)}`);
}

console.log(lines.join('\n'));

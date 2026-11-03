// Task 943 revision 2 design probe, independent audit follow-up (2026-11-02): absolute spellings, links and nested folder
// changes that reach a scope file. Real writes run only inside one temporary folder; the hook is only called, never changed.
// Run from the project root on native Windows:
//   node docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync as save } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const hook = await import(pathToFileURL(join(root, 'scripts/workflow-gates/security-hook.mjs')).href);
const bash = 'C:/Program Files/Git/bin/bash.exe';
const lines = [`node ${process.version}`];
const shortName = (dir, long) => {
  const listing = execFileSync('cmd.exe', ['/d', '/c', 'dir', '/x', '/a', dir], { encoding: 'utf8' });
  const match = listing.match(new RegExp(`\\s(\\S+~\\d\\S*)\\s+${long.replace(/\./g, '\\.')}\\r?$`, 'im'));
  return match ? match[1] : null;
};
const entry = (tool, command, input) => [
  { type: 'assistant', message: { content: [{ type: 'tool_use', id: 's0', name: tool, input: input ?? { command } }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'ok' }] } },
].map(line => JSON.stringify(line)).join('\n');

// A fixture project root with a long folder name (so it has an 8.3 alias), D/hook.mjs as the scope file and Y as input.
const base = mkdtempSync(join(tmpdir(), 'p11-'));
const fixture = join(base, 'LongFixtureRootName');
mkdirSync(join(fixture, 'D'), { recursive: true });
save(join(fixture, 'Y'), 'new');
save(join(fixture, 'D', 'LongScopeFileName.mjs'), 'old');
const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: ['D/hook.mjs'] };
const reset = () => save(join(fixture, 'D', 'hook.mjs'), 'old');
const state = () => (readFileSync(join(fixture, 'D', 'hook.mjs'), 'utf8') === 'old' ? 'old' : 'changed');
function check(id, shell, command) {
  reset();
  if (shell === 'bash') spawnSync(bash, ['-c', command], { cwd: fixture });
  else { save(join(base, 'p.ps1'), command); spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(base, 'p.ps1')], { cwd: fixture }); }
  const tool = shell === 'bash' ? 'Bash' : 'PowerShell';
  const errors = hook.governanceIndependenceErrors(fixture, contract, 'tasks/g.security.json', entry(tool, command)).length;
  lines.push(`${id} | real: D/hook.mjs=${state()} | targets=${JSON.stringify(hook.shellWriteTargets(fixture, command))} | independence errors=${errors}`);
}
reset();
const rootShort = shortName(base, 'LongFixtureRootName');
const posix = fixture.replace(/^([A-Za-z]):\\/, (_, d) => `/${d.toLowerCase()}/`).replaceAll('\\', '/');
lines.push(`fixture short names: root=${rootShort}; hook.mjs=${shortName(join(fixture, 'D'), 'hook.mjs')}; LongScopeFileName.mjs=${shortName(join(fixture, 'D'), 'LongScopeFileName.mjs')}`);

// F1: absolute spellings that leave the root lexically.
check('F1-msys-absolute', 'bash', `cat Y > ${posix}/D/hook.mjs`);
check('F1-short-root-absolute', 'powershell', `Get-Content Y > '${join(base, rootShort, 'D', 'hook.mjs')}'`);
const writeShort = hook.governanceIndependenceErrors(fixture, contract, 'tasks/g.security.json',
  entry('Write', '', { file_path: join(base, rootShort, 'D', 'hook.mjs'), content: 'x' })).length;
lines.push(`F1-write-tool-short-root | independence errors=${writeShort}`);
// F2: a junction to D and Win32 device or UNC prefixes.
execFileSync('cmd.exe', ['/d', '/c', 'mklink', '/J', join(base, 'j'), join(fixture, 'D')], { stdio: 'ignore' });
check('F2-junction', 'powershell', `Get-Content Y > '${join(base, 'j', 'hook.mjs')}'`);
check('F2-device-dot', 'powershell', `Get-Content Y > '\\\\.\\${join(fixture, 'D', 'hook.mjs')}'`);
check('F2-device-question', 'powershell', `Get-Content Y > '\\\\?\\${join(fixture, 'D', 'hook.mjs')}'`);
check('F2-unc-admin-share', 'powershell', `Get-Content Y > '\\\\localhost\\${fixture[0]}$${fixture.slice(2)}\\D\\hook.mjs'`);
// F4: a folder change inside a nested shell or an interpreter.
check('F4-nested-bash', 'bash', `bash -c 'cd D; cat ../Y > hook.mjs'`);
check('F4-nested-cmd', 'powershell', `cmd /d /c "cd D && type ..\\Y > hook.mjs"`);
check('F4-node-chdir', 'bash', `node -e "process.chdir('D'); require('fs').writeFileSync('hook.mjs','changed')"`);
// Real-root forms (evaluation only): executor writes through an MSYS absolute path and a short-named root folder.
const projectShort = shortName(join(root, '..'), root.split(/[\\/]/).pop()) ?? 'none';
const rootParentShort = shortName(root.slice(0, 3), root.split(/[\\/]/)[1]);
for (const command of [`echo x > ${root.replace(/^([A-Za-z]):\\/, (_, d) => `/${d.toLowerCase()}/`).replaceAll('\\', '/')}/package.json`,
  `echo x > '${root.slice(0, 3)}${rootParentShort}/${root.split(/[\\/]/).slice(2).join('/')}/scripts/workflow-gates/security-hook.mjs'`]) {
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', tool_input: { command } };
  lines.push(`real-root executor ${JSON.stringify(command.replace(root.replaceAll('\\', '/').slice(2), '<root>').replace(root.slice(2).replaceAll('\\', '/'), '<root>'))} | targets=${JSON.stringify(hook.shellWriteTargets(root, command))} | PreToolUse=${JSON.stringify(hook.evaluateHook(root, event, '').map(e => e.split(':')[0]))}`);
}
lines.push(`real-root short names: project folder=${projectShort}; parent folder=${rootParentShort}`);
// The temporary folder is written as <tmp> so that no user folder name is retained in the evidence.
const tmp = base.replace(/^([A-Za-z]):\\/, '$1:/').replaceAll('\\', '/');
const tmpPosix = tmp.replace(/^([A-Za-z]):\//, (_, d) => `/${d.toLowerCase()}/`);
const tmpNoDrive = tmp.slice(2);
console.log(lines.join('\n').split(tmp).join('<tmp>').split(tmpPosix).join('<tmp>').split(tmpNoDrive).join('<tmp-without-drive>')
  .replace(/(\.\.\/)+c\/Users\/[^/]+\/AppData\/Local\/Temp\/p11-[^/]+/g, '<relative to <tmp>>'));

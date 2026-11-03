// Task 941 approver (review 3, third self-audit), read-only: does a NEL (U+0085) or LINE SEPARATOR (U+2028) inside a
// single-quoted argument end the quote or the command in Git Bash or Windows PowerShell 5.1? Each command hides a write of
// file T behind the character, inside the quotes the 941 classifier accepts as read-only. Writes only temporary folders.
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const hook = await import(pathToFileURL(join(repo, 'scripts/workflow-gates/security-hook.mjs')).href);
const lines = [`node ${process.version}`];
for (const [name, ch] of [['NEL', '\u0085'], ['LS', '\u2028']]) {
  const forms = [
    ['bash', `grep -c 'a${ch}' Y; true '${ch}; echo x > T; ${ch}'`],
    ['bash', `grep -c 'a${ch}; echo x > T; #' Y`],
    ['powershell', `Select-String -Pattern 'a${ch}; Set-Content T x; ${ch}' -Path Y`],
    ['powershell', `Get-Content Y | Select-String -Pattern 'a${ch}'; Get-Content Y | Select-String -Pattern '${ch}; Set-Content T x; ${ch}'`],
  ];
  for (const [shell, command] of forms) {
    const dir = mkdtempSync(join(tmpdir(), 'r3-uq-'));
    writeFileSync(join(dir, 'Y'), 'a\n');
    const args = shell === 'bash' ? ['-c', command] : ['-NoProfile', '-NonInteractive', '-Command', command];
    spawnSync(shell === 'bash' ? 'C:/Program Files/Git/bin/bash.exe' : 'powershell.exe', args, { cwd: dir, encoding: 'utf8' });
    lines.push(`${name} | ${shell} | ${JSON.stringify(command)} | classifier readOnly=${hook.isReadOnlyShellCommand(command)} | real: T written=${existsSync(join(dir, 'T'))}`);
  }
}
// Positive controls: the same write outside the quotes must happen in each shell, so "written=false" above is not vacuous.
for (const [shell, command] of [['bash', "grep -c 'a' Y; echo x > T"], ['powershell', "Select-String -Pattern 'a' -Path Y; Set-Content T x"]]) {
  const dir = mkdtempSync(join(tmpdir(), 'r3-uq-'));
  writeFileSync(join(dir, 'Y'), 'a\n');
  const args = shell === 'bash' ? ['-c', command] : ['-NoProfile', '-NonInteractive', '-Command', command];
  spawnSync(shell === 'bash' ? 'C:/Program Files/Git/bin/bash.exe' : 'powershell.exe', args, { cwd: dir, encoding: 'utf8' });
  lines.push(`CONTROL | ${shell} | ${JSON.stringify(command)} | classifier readOnly=${hook.isReadOnlyShellCommand(command)} | real: T written=${existsSync(join(dir, 'T'))}`);
}
console.log(lines.join('\n'));

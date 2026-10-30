// Task 923 Revision 42 (R139) evidence helper. Usage (repository root): node docs/sessions/evidence/task923/r42-run.mjs <out-file> <command...>
//   Runs <command> through the shell, unpiped, and writes <out-file> with platform, Node, cwd, command, date, the full output and the real exit code.
//   `sha <path>...` as the command prints "<sha256>  <path>" (plain file bytes) or "ABSENT  <path>" instead of spawning a shell.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const [out, ...cmd] = process.argv.slice(2);
const command = cmd.join(' ');
let output = '';
let code = 0;
if (cmd[0] === 'sha') {
  output = cmd.slice(1).map((p) => (existsSync(p) ? `${createHash('sha256').update(readFileSync(p)).digest('hex')}  ${p}` : `ABSENT  ${p}`)).join('\n') + '\n';
} else {
  const r = spawnSync(command, { shell: true, encoding: 'utf8', maxBuffer: 1 << 30 });
  output = (r.stdout ?? '') + (r.stderr ?? '');
  code = r.status ?? 1;
}
const header = [
  `platform: ${process.platform} ${os.release()} (${process.arch})`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: ${cmd[0] === 'sha' ? `node docs/sessions/evidence/task923/r42-run.mjs ${out} ${command}` : command}`,
  `date: ${new Date().toISOString()}`,
  '--- output ---',
].join('\n');
writeFileSync(out, `${header}\n${output}\nEXIT_CODE=${code}\n`);
process.stdout.write(output);
process.exitCode = code;

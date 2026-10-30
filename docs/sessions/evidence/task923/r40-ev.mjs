// Task 923 Revision 40 evidence runner (executor helper): node r40-ev.mjs <outfile> <command...>
// Runs the command in the project root through PowerShell and writes platform, Node, cwd, command, output and exit code.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import os from 'node:os';

const [out, ...rest] = process.argv.slice(2);
const command = rest.join(' ');
const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `$ErrorActionPreference='Continue'; ${command}; exit $LASTEXITCODE`], {
  cwd: process.cwd(), encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
});
const body = [
  `platform: ${os.platform()} ${os.release()} (${os.arch()})`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: ${command}`,
  `date: ${new Date().toISOString()}`,
  '--- output ---',
  r.stdout ?? '',
  r.stderr ? `--- stderr ---\n${r.stderr}` : '',
  `EXIT_CODE=${r.status}`,
  '',
].join('\n');
writeFileSync(out, body, 'utf8');
console.log(`wrote ${out}; exit ${r.status}`);
process.exit(r.status ?? 1);

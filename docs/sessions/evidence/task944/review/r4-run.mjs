// Task 944 review 4 (approver): runs one given read-only command and saves platform, Node version, cwd, exact command, output and
// exit code as r4-<name>.txt in this folder (.claude/rules/review/01-preflight.md step 5). It writes nothing else; a transcript
// reader sees the exact command in the argument list. Usage (project root): node docs/sessions/evidence/task944/review/r4-run.mjs <name> <program> [args...]
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const [name, program, ...args] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(name || '') || !program) { console.error('usage: r4-run.mjs <name> <program> [args...]'); process.exit(2); }
const started = new Date().toISOString();
const child = spawnSync(program, args, { cwd: ROOT, encoding: 'utf8', timeout: 570000, maxBuffer: 256 * 1024 * 1024, shell: program === 'npm', env: process.env });
const header = [`# Task 944 review 4: ${name}`, `platform ${process.platform}; node ${process.version}; cwd ${ROOT}; started ${started}; ended ${new Date().toISOString()}`,
  `command: ${[program, ...args].join(' ')}`, `exit code: ${child.status}${child.error ? `; error ${child.error.message}` : ''}`, '--- stdout', ''].join('\n');
const output = `${header}${String(child.stdout ?? '').replace(/\r\n/g, '\n')}\n--- stderr\n${String(child.stderr ?? '').replace(/\r\n/g, '\n')}\n`;
const file = resolve(ROOT, `docs/sessions/evidence/task944/review/r4-${name}.txt`);
writeFileSync(file, output);
console.log(`${name}: exit ${child.status}; ${output.split('\n').length} lines in ${file}`);
process.exitCode = child.status === null ? 1 : child.status;

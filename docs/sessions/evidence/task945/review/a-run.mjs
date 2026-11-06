// Task 945 approval of revision 1 (approver): runs one given command and saves platform, Node version, cwd, exact command, output and exit code as
// a-<name>.txt in this folder (.claude/rules/review/01-preflight.md step 5). It writes nothing else itself; a transcript reader sees the exact command
// in the argument list. Taken from docs/sessions/evidence/task944/review/r4-run.mjs.
// Usage (project root): node docs/sessions/evidence/task945/review/a-run.mjs <name> <program> [args...]
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const [name, program, ...args] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(name || '') || !program) { console.error('usage: a-run.mjs <name> <program> [args...]'); process.exit(2); }
const started = new Date();
const child = spawnSync(program, args, { cwd: ROOT, encoding: 'utf8', timeout: 590000, maxBuffer: 256 * 1024 * 1024, shell: program === 'npm', env: process.env });
const ended = new Date();
const header = [`# Task 945 approval: ${name}`, `platform ${process.platform}; node ${process.version}; cwd ${ROOT}; started ${started.toISOString()}; ended ${ended.toISOString()}; ${ended - started} ms`,
  `command: ${[program, ...args].join(' ')}`, `exit code: ${child.status}${child.error ? `; error ${child.error.message}` : ''}`, '--- stdout', ''].join('\n');
const output = `${header}${String(child.stdout ?? '').replace(/\r\n/g, '\n')}\n--- stderr\n${String(child.stderr ?? '').replace(/\r\n/g, '\n')}\n`;
const file = resolve(ROOT, `docs/sessions/evidence/task945/review/a-${name}.txt`);
writeFileSync(file, output);
console.log(`${name}: exit ${child.status}; ${ended - started} ms; ${output.split('\n').length} lines in ${file}`);
process.exitCode = child.status === null ? 1 : child.status;

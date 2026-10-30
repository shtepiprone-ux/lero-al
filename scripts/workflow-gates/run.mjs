#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, createWriteStream, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const policy = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/pipeline.json'), 'utf8'));
const group = process.argv[2];
const commands = policy.groups[group];
if (!commands?.length) throw new Error('Select a nonempty registered gate group');
const timeoutMinutes = policy.commandTimeoutMinutes?.[group] ?? 10;
if (!Number.isFinite(timeoutMinutes) || timeoutMinutes <= 0 || timeoutMinutes > 45) throw new Error('Invalid registered command timeout');
const timeoutMs = Math.ceil(timeoutMinutes * 60 * 1000);
const output = join(root, 'test-results/workflow-gates', group); mkdirSync(output, { recursive: true });
const results = [];
for (const [index, command] of commands.entries()) {
  const args = [...command];
  let executable = args.shift();
  if (executable === 'node') executable = process.execPath;
  else if (executable === 'npm') {
    const candidates = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
      join(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].filter(Boolean);
    const cli = candidates.find(p => existsSync(p));
    if (!cli) throw new Error('npm CLI could not be located; no checks were waived');
    executable = process.execPath; args.unshift(cli);
  } else throw new Error('Only registered Node/npm commands are supported');
  const log = createWriteStream(join(output, `${index + 1}.log`));
  console.log(`\n[${group} ${index + 1}/${commands.length}] ${command.join(' ')}`);
  const started = Date.now();
  const result = await new Promise(done => {
    const child = spawn(executable, args, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], timeout: timeoutMs });
    child.stdout.on('data', data => { process.stdout.write(data); log.write(data); });
    child.stderr.on('data', data => { process.stderr.write(data); log.write(data); });
    let error;
    child.on('error', e => { error = e.message; });
    child.on('close', (code, signal) => { log.end(); done({ command, code, signal, timeoutMs, ...(error ? { error } : {}), elapsedMs: Date.now() - started }); });
  });
  results.push(result);
  writeFileSync(join(output, 'results.json'), JSON.stringify({ group, complete: results.length === commands.length, results }, null, 2));
}
const failed = results.filter(r => r.code !== 0 || r.signal || r.error);
console.log(`\n${group}: ${results.length - failed.length}/${results.length} gates passed; ${failed.length} failed.`);
process.exitCode = failed.length ? 1 : 0;

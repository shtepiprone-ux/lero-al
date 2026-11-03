#!/usr/bin/env node
// Task 941 review 2 (Opus reviewer, 2026-11-02): carriage return and cd/Set-Location against real shells.
// Usage (repo root, Git Bash on PATH or at C:/Program Files/Git/bin/bash.exe): node docs/sessions/evidence/task941/review-2/r2-probe.mjs
// Each form runs for real in Git Bash or Windows PowerShell 5.1 inside a fresh temporary folder, writing only files of that
// folder, then the same form with the temporary file replaced by a governance scope path goes through the working-tree
// isReadOnlyShellCommand, shellWriteTargets, the pre-941 shellWriteTargets (from 758508105^), governanceIndependenceErrors
// and an executor PreToolUse event. Nothing in the repository is written.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync as save } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd().replaceAll('\\', '/');
const hook = await import(pathToFileURL(join(root, 'scripts/workflow-gates/security-hook.mjs')).href);
const oldSource = execFileSync('git', ['show', '758508105^:scripts/workflow-gates/security-hook.mjs'], { encoding: 'utf8' });
const start = oldSource.indexOf('export function shellWriteTargets');
const oldBody = oldSource.slice(start, oldSource.indexOf('\n}\n', start) + 2).replace('export function', 'function');
const fixturePath = (r, f) => relative(r, resolve(r, f)).replaceAll('\\', '/');
const before = new Function('projectPath', `${oldBody}; return shellWriteTargets;`)(fixturePath);
const X = 'scripts/workflow-gates/security-hook.mjs';
const POLICY = 'scripts/check-example.mjs';
const bash = existsSync('C:/Program Files/Git/bin/bash.exe') ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const fixtureRoot = mkdtempSync(join(tmpdir(), 'r2-root-'));
const transcript = (tool, command) => [
  { type: 'assistant', message: { content: [{ type: 'tool_use', id: 's0', name: tool, input: { command } }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'output' }] } },
].map(line => JSON.stringify(line)).join('\n');
const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: [X] };
const lines = [`node ${process.version}; bash ${execFileSync(bash, ['--version'], { encoding: 'utf8' }).split('\n')[0]}`];

function run(shell, command, setup) {
  const dir = mkdtempSync(join(tmpdir(), 'r2-'));
  save(join(dir, 'T'), 'one\ntwo\n');
  setup?.(dir);
  if (shell === 'bash') spawnSync(bash, ['-c', command], { cwd: dir, encoding: 'utf8' });
  else {
    save(join(dir, 'probe.ps1'), command);
    spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(dir, 'probe.ps1')], { cwd: dir, encoding: 'utf8' });
  }
  return dir;
}
const gitRepo = dir => { execFileSync('git', ['init', '-q'], { cwd: dir }); execFileSync('git', ['-c', 'user.email=p@x', '-c', 'user.name=p', 'commit', '-q', '--allow-empty', '-m', 'c'], { cwd: dir }); };
function classify(id, tool, command) {
  const policyCommand = command.replaceAll(X, POLICY);
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, tool_input: { command: policyCommand } };
  lines.push(`${id} | readOnly=${hook.isReadOnlyShellCommand(command)} | after=${JSON.stringify(hook.shellWriteTargets(root, command))} | before941=${JSON.stringify(before(root, command))} | independence=${JSON.stringify(hook.governanceIndependenceErrors(fixtureRoot, contract, 'tasks/gov_kickoff.security.json', transcript(tool, command)).length)} error(s) | executor PreToolUse(${POLICY})=${JSON.stringify(hook.evaluateHook(fixtureRoot, event, ''))}`);
}
const content = (dir, file) => JSON.stringify(readFileSync(join(dir, file), 'utf8'));

// G1. A lone carriage return: Bash keeps it inside a word, the classifier splits on it.
let dir = run('bash', 'sed -n 1p T\rcat -i T writeFileSync');
lines.push(`G1-cr-sed-in-place | real bash: T after ${content(dir, 'T')} (before "one\\ntwo\\n")`);
classify('G1-cr-sed-in-place', 'Bash', `sed -n 1p ${X}\rcat -i ${X} writeFileSync`);
dir = run('bash', 'git log -1 --format=%H\rcat --output=T -S writeFileSync', gitRepo);
lines.push(`G1-cr-git-output | real bash: T after ${content(dir, 'T')} (before "one\\ntwo\\n")`);
classify('G1-cr-git-output', 'Bash', `git log -1 --format=%H\rcat --output=${X} -S writeFileSync`);
// Controls: a carriage return directly before a line feed joins nothing; a CRLF-terminated redirection target is another file.
dir = run('bash', 'sed -n 1p T\r\ncat -i T writeFileSync 2>/dev/null; true');
lines.push(`G1-crlf-control | real bash: T after ${content(dir, 'T')} (before "one\\ntwo\\n")`);
classify('G1-crlf-control', 'Bash', `sed -n 1p ${X}\r\ncat -i ${X} writeFileSync`);
dir = run('bash', 'cat T > U\r\n');
lines.push(`G1-crlf-target-control | real bash: U exists=${existsSync(join(dir, 'U'))}; files=${JSON.stringify(readdirSync(dir).filter(f => f !== 'T'))}`);
// PowerShell 5.1 reads a lone carriage return as a line break (informative for the shell difference).
dir = run('powershell', "Get-Content T -TotalCount 1 > V\rSet-Content 'W' 'x'");
lines.push(`G1-ps-lone-cr | real powershell: W exists=${existsSync(join(dir, 'W'))}`);

// G2. cd / Set-Location changes the folder a relative redirection target resolves against.
const sub = d => { mkdirSync(join(d, 's')); save(join(d, 's', 'T'), 'one\ntwo\n'); };
dir = run('bash', 'cd s; grep -c writeFileSync s/T > T', sub);
lines.push(`G2-cd-redirect | real bash: s/T after ${content(dir, 's/T')} (before "one\\ntwo\\n")`);
classify('G2-cd-redirect', 'Bash', `cd scripts/workflow-gates; grep -c writeFileSync ${X} > security-hook.mjs`);
dir = run('powershell', "Set-Location s; Select-String -Pattern 'writeFileSync' -Path s/T > T", sub);
lines.push(`G2-set-location-redirect | real powershell: s/T after ${content(dir, 's/T')} (before "one\\ntwo\\n")`);
classify('G2-set-location-redirect', 'PowerShell', `Set-Location scripts/workflow-gates; Select-String -Pattern 'writeFileSync' -Path ${X} > security-hook.mjs`);
// Control: cd without a redirection writes nothing and stays read-only.
classify('G2-cd-read-control', 'Bash', `cd scripts/workflow-gates; grep -n 'writeFileSync' ${X}`);

console.log(lines.join('\n'));

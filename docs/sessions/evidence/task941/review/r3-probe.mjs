// Review 3 adversarial probe of Task 941 revision 2 (candidate b7c3fc9f6). Reads the working-tree hook and the
// pre-941 hook (parent of 758508105) and, for selected forms, runs real Git Bash / Windows PowerShell 5.1 in temp folders.
// Writes only temporary folders; prints its result to stdout.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const hook = await import(pathToFileURL(join(repo, 'scripts/workflow-gates/security-hook.mjs')).href);
const oldDir = mkdtempSync(join(tmpdir(), 'r3-old-'));
for (const name of execFileSync('git', ['-C', repo, 'ls-tree', '--name-only', '758508105^', 'scripts/workflow-gates/'], { encoding: 'utf8' }).trim().split('\n')) {
  const base = name.split('/').pop();
  if (!/\.(mjs|json)$/.test(base)) continue;
  writeFileSync(join(oldDir, base), execFileSync('git', ['-C', repo, 'show', `758508105^:${name}`], { encoding: 'utf8' }));
}
const old = await import(pathToFileURL(join(oldDir, 'security-hook.mjs')).href);

const root = mkdtempSync(join(tmpdir(), 'r3-root-'));
const X = 'scripts/workflow-gates/security-hook.mjs';
const lines = [`candidate HEAD ${execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}; node ${process.version}`];
const classify = (id, command) => {
  const ro = hook.isReadOnlyShellCommand(command);
  lines.push(`${id} | readOnly=${ro} | after=${JSON.stringify(hook.shellWriteTargets(root, command))} | before941=${JSON.stringify(old.shellWriteTargets(root, command))}`);
};
const bash = 'C:/Program Files/Git/bin/bash.exe';
const real = (id, shell, command, setup, check) => {
  const dir = mkdtempSync(join(tmpdir(), 'r3-run-'));
  setup?.(dir);
  if (shell === 'bash') spawnSync(bash, ['-c', command], { cwd: dir, encoding: 'utf8' });
  else { writeFileSync(join(dir, 'p.ps1'), command); spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(dir, 'p.ps1')], { cwd: dir, encoding: 'utf8' }); }
  lines.push(`${id} | real ${shell}: files=${check(dir)}`);
};
const sub = d => { mkdirSync(join(d, 's')); writeFileSync(join(d, 's', 'Y'), 'a\n'); writeFileSync(join(d, 'Y'), 'a\n'); };
const files = d => JSON.stringify([...readdirSync(d), ...readdirSync(join(d, 's')).map(f => `s/${f}`)]);

// H1: Bash noclobber-override redirection `>|` splits at `|` for the classifier.
real('H1-noclobber', 'bash', 'grep -c a Y >|cat', sub, files);
classify('H1-noclobber', `grep -c writeFileSync ${X} >|cat`);
real('H1-noclobber-cd', 'bash', 'cd s; grep -c a Y >|cat', sub, files);
classify('H1-noclobber-cd', `cd scripts/workflow-gates; grep -c writeFileSync ${X} >|cat`);
// H1b: on a case-insensitive file system `>|head` inside `.git` overwrites `.git/HEAD`; the pre-write guard of both versions.
real('H1b-noclobber-git-head', 'bash', 'git init -q . && cd .git && grep -c a ../Y >|head', sub, d => JSON.stringify(readFileSync(join(d, '.git', 'HEAD'), 'utf8')));
const exec = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', tool_input: { command } });
for (const command of ['cd .git; grep -c a README.md >|head', 'grep -c a README.md >| src/profile.ts', 'echo x >| src/profile.ts']) {
  lines.push(`H1b-pretool ${JSON.stringify(command)} | readOnly=${hook.isReadOnlyShellCommand(command)} | after=${JSON.stringify(hook.evaluateHook(root, exec(command), ''))} | before941=${JSON.stringify(old.evaluateHook(root, exec(command), ''))}`);
}
// H2: `>&file`, `<>file` and `*>` after cd.
classify('H2-dup-file-cd', `cd scripts/workflow-gates; grep -c writeFileSync ${X} >&security-hook.mjs`);
classify('H2-readwrite-cd', `cd scripts/workflow-gates; grep -c writeFileSync ${X} <>security-hook.mjs`);
classify('H2-star-cd', `Set-Location scripts/workflow-gates; Select-String -Pattern x -Path ${X} *>security-hook.mjs`);
// H3: other spellings and positions of the folder change.
classify('H3-leading-redirect-cd', `>T cd scripts/workflow-gates; grep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-quoted-cd', `'cd' scripts/workflow-gates; grep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-concat-cd', `c'd' scripts/workflow-gates; grep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-dq-set-location', `"Set-Location" scripts/workflow-gates; Select-String -Pattern x -Path ${X} > security-hook.mjs`);
classify('H3-pipe-set-location', `Get-Item scripts | Set-Location; Select-String -Pattern x -Path ${X} > security-hook.mjs`);
classify('H3-amp-cd', `cd scripts/workflow-gates&grep -c writeFileSync ${X}>security-hook.mjs`);
classify('H3-newline-cd', `cd scripts/workflow-gates\ngrep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-crlf-cd', `cd scripts/workflow-gates\r\ngrep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-backslash-cd', `c\\d scripts/workflow-gates; grep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-ps-cd-dotdot', `cd..; grep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-chdir', `chdir scripts; grep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-sl', `sl scripts; grep -c writeFileSync ${X} > security-hook.mjs`);
classify('H3-pushd', `pushd scripts; grep -c writeFileSync ${X} > security-hook.mjs`);
// H4: carriage return and other line-break characters.
classify('H4-cr-cr-lf', `sed -n 1p ${X}\r\r\ncat -i ${X} writeFileSync`);
classify('H4-cr-end', `grep -n a ${X} writeFileSync\r`);
classify('H4-cr-in-single', `grep -n 'a\rb' ${X} writeFileSync`);
classify('H4-vt', `grep -n a ${X}\vcat -i ${X} writeFileSync`);
classify('H4-ff', `grep -n a ${X}\fcat -i ${X} writeFileSync`);
classify('H4-nel', `grep -n a ${X}\u0085cat -i ${X} writeFileSync`);
classify('H4-ls', `grep -n a ${X}\u2028cat -i ${X} writeFileSync`);
classify('H4-nel-in-single', `grep -n 'a\u0085b' ${X} writeFileSync`);
// H5: controls that must stay read-only.
classify('H5-cd-2to1', `cd scripts/workflow-gates; grep -c writeFileSync ${X} 2>&1`);
classify('H5-cd-input', `cd scripts/workflow-gates; grep -c writeFileSync < ${X}`);
classify('H5-redirect-no-cd', `grep -c writeFileSync ${X} > out.txt`);
console.log(lines.join('\n'));

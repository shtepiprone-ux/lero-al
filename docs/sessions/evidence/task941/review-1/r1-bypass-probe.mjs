#!/usr/bin/env node
// Task 941 review 1 (Opus reviewer, 2026-11-02): classifier against real shell semantics.
// Usage (repo root): node docs/sessions/evidence/task941/review-1/r1-bypass-probe.mjs <reviewed-commit>
// For each form it (1) runs the form for real in Git Bash or Windows PowerShell inside a fresh temporary folder,
// writing only a file of that folder, and reports whether the hidden write happened; (2) evaluates the same form,
// with the temporary file replaced by a governance scope path, through the current isReadOnlyShellCommand and
// shellWriteTargets, through the pre-941 shellWriteTargets taken from <reviewed-commit>^, and through evaluateHook
// as an executor PreToolUse event. Nothing in the repository is written.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync as save } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd().replaceAll('\\', '/');
const commit = process.argv[2];
if (!/^[0-9a-f]{7,40}$/.test(commit || '')) throw new Error('usage: r1-bypass-probe.mjs <reviewed-commit>');
const hook = await import(pathToFileURL(join(root, 'scripts/workflow-gates/security-hook.mjs')).href);
const oldSource = execFileSync('git', ['show', `${commit}^:scripts/workflow-gates/security-hook.mjs`], { encoding: 'utf8' });
const start = oldSource.indexOf('export function shellWriteTargets');
const oldBody = oldSource.slice(start, oldSource.indexOf('\n}\n', start) + 2).replace('export function', 'function');
const fixturePath = (r, f) => relative(r, resolve(r, f)).replaceAll('\\', '/');
const previousTargets = new Function('projectPath', `${oldBody}; return shellWriteTargets;`)(fixturePath);

const X = 'scripts/workflow-gates/security-hook.mjs';
// %T% is replaced by the temporary file for the real run and by X (or the named path) for the classifier.
const forms = [
  ['F1-bash-line-comment-redirect', 'bash', "cat README.md # '\necho hidden > %T% # '"],
  ['F1-bash-line-comment-set-content', 'bash', "cat README.md # '\nSet-Content '%T%' 'x' # '", 'classifier-only'],
  ['F1-ps-line-comment-set-content', 'powershell', "Get-Content README.md -TotalCount 1 # '\nSet-Content '%T%' 'x' # '"],
  ['F1-ps-block-comment-set-content', 'powershell', "Get-Content README.md -TotalCount 1 <# ' #> ; Set-Content '%T%' 'x' <# ' #>"],
  ['F1-bash-line-comment-product', 'bash', "cat README.md # '\necho hidden > %T% # '", 'src/profile.ts'],
  ['F1-bash-line-comment-git-metadata', 'bash', "cat README.md # '\necho hidden > %T% # '", '.git/hooks/pre-commit'],
  ['F2-bash-backslash-option', 'bash', "printf '[%s]' --pr\\e --out\\put=%T%", 'classifier-only'],
  ['F2-bash-ansi-c-option', 'bash', "printf '[%s]' $'--pre' $'--output=%T%'", 'classifier-only'],
  ['F2-rg-backslash-pre', 'bash', "rg --pr\\e 'x' 'writeFileSync' %T%", 'classifier-only'],
  ['F2-rg-ansi-c-pre', 'bash', "rg $'--pre' 'x' 'writeFileSync' %T%", 'classifier-only'],
  ['F2-git-backslash-output', 'bash', 'git log --out\\put=%T% -S writeFileSync', 'classifier-only'],
  ['F2-git-ansi-c-output', 'bash', "git log $'--output=%T%'", 'classifier-only'],
  ['F2-sed-glob-in-place', 'bash', 'sed -n 1p *', 'glob'],
  // Self-check of review 1 (same day): Bash `$_` is the last argument of the previous command, also inside double quotes.
  ['F3-bash-last-arg-git-output', 'bash', 'cat --output=%T% 2>/dev/null; git log -1 "$_"', 'gitrepo'],
  ['F3-bash-last-arg-sed-in-place', 'bash', 'head -i 2>/dev/null; sed -n 1p "$_" %T%', 'inplace'],
  ['F3-bash-last-arg-rg-pre', 'bash', "cat --pre=bash 2>/dev/null; rg \"$_\" 'writeFileSync' %T%", 'classifier-only'],
];
const lines = [`commit ${commit}; node ${process.version}; platform ${process.platform}`,
  `bash ${execFileSync('bash', ['--version'], { encoding: 'utf8' }).split('\n')[0]}`];
for (const [id, shell, form, mode] of forms) {
  let ran = 'not run';
  if (mode !== 'classifier-only') {
    const dir = mkdtempSync(join(tmpdir(), 'r941-'));
    try {
      const target = join(dir, 'target.txt');
      save(join(dir, 'README.md'), '# probe\n');
      let command = form.replaceAll('%T%', shell === 'bash' ? target.replaceAll('\\', '/') : target);
      if (mode === 'glob') { save(join(dir, '-i'), ''); save(target, 'one\ntwo\n'); command = form; }
      if (mode === 'inplace') save(target, 'one\ntwo\n');
      if (mode === 'gitrepo') {
        execFileSync('git', ['init', '-q'], { cwd: dir });
        execFileSync('git', ['-c', 'user.name=probe', '-c', 'user.email=probe@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'probe'], { cwd: dir });
      }
      const args = shell === 'bash' ? ['-c', command] : ['-NoProfile', '-NonInteractive', '-Command', command];
      try { execFileSync(shell === 'bash' ? 'bash' : 'powershell.exe', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }); } catch { /* the outcome is the file */ }
      ran = mode === 'glob' || mode === 'inplace' ? `target content after run ${JSON.stringify(readFileSync(target, 'utf8'))} (before "one\\ntwo\\n")`
        : `hidden write happened: ${existsSync(target)}`;
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  if (id.startsWith('F2-bash-')) ran = `bash prints ${execFileSync('bash', ['-c', form], { encoding: 'utf8' })}`;
  const path = typeof mode === 'string' && mode.includes('/') ? mode : X;
  const classified = form.replaceAll('%T%', path).replace('README.md -TotalCount 1', 'README.md');
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: shell === 'bash' ? 'Bash' : 'PowerShell', tool_input: { command: classified } };
  lines.push(`${id} | real ${shell}: ${ran} | readOnly=${hook.isReadOnlyShellCommand(classified)} | after=${JSON.stringify(hook.shellWriteTargets(root, classified))} | before941=${JSON.stringify(previousTargets(root, classified))} | executor PreToolUse=${JSON.stringify(hook.evaluateHook(root, event, ''))}`);
}
console.log(lines.join('\n'));

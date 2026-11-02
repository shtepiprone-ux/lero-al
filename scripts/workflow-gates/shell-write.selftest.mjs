#!/usr/bin/env node
// Task 941 (owner D10, 2026-11-01): a read-only shell command is not counted as a write by the security hook.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { isReadOnlyShellCommand, shellWriteTargets, governanceIndependenceErrors, evaluateHook } from './security-hook.mjs';
import { validateDiff } from './cli.mjs';

const RECEIPT = 'tasks/gov_kickoff.security.json';
const X = 'scripts/workflow-gates/example.mjs';
const Y = 'scripts/workflow-gates/reader.mjs';

function withRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), 'lero-shell-write-'));
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
// A synthetic governance contract: governanceIndependenceErrors reads only its scope.
const contractFor = scope => ({ version: 1, stage: 'reviewed', kind: 'governance', scope });
function transcript(commands) {
  return commands.flatMap(([tool, command], i) => [
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: `s${i}`, name: tool, input: { command } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `s${i}`, content: 'output' }] } },
  ]).map(line => JSON.stringify(line)).join('\n');
}
// Copy of the pre-change detection (C2-C4) for comparison; the fixture paths do not exist, so the project path of a
// file is its normalized path relative to the fixture root.
function previousTargets(root, command) {
  const project = file => relative(root, resolve(root, file)).replaceAll('\\', '/');
  const files = [];
  if (/\b(?:Set-Content|Add-Content|Out-File|apply_patch|writeFileSync|write_text|writeFile)\b/i.test(command)) {
    files.push(...[...command.matchAll(/(?:src|public|messages|tasks|database|migrations|supabase|\.claude|\.github|scripts|docs)[/\\][^\s'";|<>]+\.(?:[cm]?[jt]sx?|sql|css|json|md|ps1|py|sh|ya?ml|svg)/g)].map(m => project(m[0].replaceAll('\\', '/'))));
  }
  for (const match of command.matchAll(/(?<![=<>])>{1,2}(?![=>])\s*(?:"([^"]+)"|'([^']+)'|([^\s;|]+))/g)) {
    files.push(project(match[1] || match[2] || match[3]));
  }
  return files;
}

test('[GOV-941-HOOK-READONLY-ALLOW] A command made only of read-only programs is not a write of the files it reads, even when it names a write word', () => withRoot(root => {
  const commands = [
    ['Bash', "grep -n -i -E 'writeFileSync|Set-Content|Out-File' scripts/workflow-gates/security-hook.mjs | head -30"],
    ['Bash', "grep -n 'writeFileSync' scripts/workflow-gates/cli.mjs; sed -n '60,70p' .claude/rules/review/03-decision-closure.md"],
    ['PowerShell', "Select-String -Pattern 'Set-Content' -Path scripts/workflow-gates/security-hook.mjs"],
    ['Bash', "grep -n -E 'Set-Content|echo injected > src/profile.ts' scripts/workflow-gates/diff-hook.selftest.mjs"],
    ['Bash', 'git diff -- scripts/workflow-gates/cli.mjs'],
    ['Bash', "sed -n '1,5p' scripts/workflow-gates/cli.mjs"],
    ['PowerShell', "Get-Content scripts/workflow-gates/cli.mjs | Select-String -Pattern 'Set-Content'"],
    // Revision 1: a Windows path and a `#` inside a single-quoted pattern stay read-only.
    ['PowerShell', "Get-Content scripts\\workflow-gates\\cli.mjs | Select-String -Pattern 'Set-Content'"],
    ['Bash', "grep -n '#.*writeFileSync' scripts/workflow-gates/cli.mjs"],
  ];
  for (const [, command] of commands) {
    assert.equal(isReadOnlyShellCommand(command), true, command);
    assert.deepEqual(shellWriteTargets(root, command), [], command);
  }
  const scope = ['scripts/workflow-gates/security-hook.mjs', 'scripts/workflow-gates/cli.mjs', '.claude/rules/review/03-decision-closure.md',
    'scripts/workflow-gates/diff-hook.selftest.mjs', 'src/profile.ts'];
  assert.deepEqual(governanceIndependenceErrors(root, contractFor(scope), RECEIPT, transcript(commands)), []);
  // A read-only command still writes its unquoted redirection target, and only that target.
  assert.deepEqual(shellWriteTargets(root, `grep -n 'Set-Content' ${Y} 2>&1 > docs/out.txt`), ['docs/out.txt']);
}));

test('[GOV-941-HOOK-WRITE-DENY] Every real shell write of a governance scope file is still counted, including one chained after a read-only command', () => withRoot(root => {
  const variants = [
    ['PowerShell', `Set-Content '${X}' 'x'`],
    ['Bash', `node -e "require('fs').writeFileSync('${X}', 'x')"`],
    ['Bash', `echo x > ${X}`],
    ['Bash', `grep -n 'a' ${Y} > ${X}`],
    ['Bash', `grep -n 'writeFileSync' ${Y}; node -e "require('fs').writeFileSync('${X}', 'x')"`],
    ['PowerShell', `grep -n 'a' ${Y} && Set-Content '${X}' 'x'`],
    ['PowerShell', `Get-Content ${Y} | Set-Content '${X}'`],
    ['Bash', `rg --pre 'x' 'writeFileSync' ${X}`],
    // Read-only commands writing X through every redirection form, including targets the hook cannot resolve.
    ['Bash', `grep -n 'a' ${Y} >> ${X}`],
    ['Bash', `grep -n 'a' ${Y} 2> "${X}"`],
    ['Bash', `grep -n 'a' ${Y} >&${X}`],
    ['Bash', `cat ${Y} <>${X}`],
    ['PowerShell', `Get-Content ${Y} *> '${X}'`],
    ['Bash', `grep -n 'a' ${Y} > /c/Claude_Code_Projects/lero-al/${X}`],
    // Revision 1 (C35-C41, C58, C59): a quote inside a comment or after `--%` hides the next command from a quote-aware split.
    ['Bash', `cat ${Y} # '\necho x > ${X} # '`],
    ['PowerShell', `Get-Content ${Y} # '\nSet-Content '${X}' 'x' # '`],
    ['PowerShell', `Get-Content ${Y} <# ' #> ; Set-Content '${X}' 'x' <# ' #>`],
    ['PowerShell', `git log --% -1 '\nSet-Content '${X}' 'x'; git log --% -1 '`],
  ];
  for (const variant of variants) {
    const [, command] = variant;
    assert.ok(shellWriteTargets(root, command).includes(X), `${command}: ${JSON.stringify(shellWriteTargets(root, command))}`);
    assert.match(governanceIndependenceErrors(root, contractFor([X]), RECEIPT, transcript([variant])).join('\n'),
      /GOVERNANCE INDEPENDENCE: this session wrote scripts\/workflow-gates\/example\.mjs; an implementing session cannot approve/, command);
  }
}));

test('[GOV-941-HOOK-MALFORMED-ERROR] A command that cannot be classified safely keeps the previous fail-closed detection', () => withRoot(root => {
  const malformed = [
    `grep -n 'writeFileSync ${X}`,
    `grep -n "Set-Content ${X}`,
    `grep -n writeFileSync \`cat ${X}\``,
    `grep -n "$(Set-Content ${X} x)" ${Y}`,
    `grep -n writeFileSync <(cat ${X})`,
    `grep -n Set-Content ${X} <<EOF\nx\nEOF`,
    // Read differently by Bash and PowerShell, or running a command inside an argument (PowerShell).
    `grep -n a\\' ${Y}; Set-Content ${X} x; grep b\\' ${Y}`,
    `grep -n 'a’; Set-Content ${X} x; grep -n ’b' ${Y}`,
    `Select-String -Pattern @'\nSet-Content ${X}\n'@ -Path ${Y}`,
    `Select-String -Pattern x -Path (Set-Content ${X} x)`,
    `Select-Object -Property {Set-Content ${X} x}`,
    `rg a --pre=x ${X} # writeFileSync`,
    `grep -n a ${Y} Set-Content ${X} x`,
  ];
  for (const command of malformed) {
    assert.equal(isReadOnlyShellCommand(command), false, command);
    assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), command);
    assert.ok(shellWriteTargets(root, command).includes(X), command);
  }
  for (const command of [undefined, null, 42, {}, ['grep']]) assert.equal(isReadOnlyShellCommand(command), false, String(command));
  // Programs or options outside the read-only list keep the previous detection too (R1 (c); no `#`, which R1 (a) rejects).
  for (const command of [`sed -i 's/a/b/' ${X} writeFileSync`, `git log --output=${X} writeFileSync`, `git grep -O x ${X} Set-Content`,
    `rg --pre-glob x a ${X} writeFileSync`, `rg --hostname-bin ${X} a writeFileSync`, `sed -n 1w ${X} ${Y} writeFileSync`,
    `git grep --open=x a ${X} writeFileSync`, `git grep -lOx a ${X} writeFileSync`]) {
    assert.equal(isReadOnlyShellCommand(command), false, command);
    assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), command);
    assert.ok(shellWriteTargets(root, command).includes(X), command);
  }
  // Revision 1 (C35-C46, C55-C72): every R1 (a) form and every R1 (c)-(d) form the review measured, each with X and a write word.
  const revision1 = [
    `grep -n a ${Y} # writeFileSync ${X}`,
    `rg $'--pre' 'writeFileSync' ${X}`,
    `rg $"--pre" 'writeFileSync' ${X}`,
    `grep -n a ${Y} @args writeFileSync ${X}`,
    `git log --% -1 %OPT% -- ${X} writeFileSync`,
    `Get-Content ${Y} -OutVariable v; rg @v 'writeFileSync' ${X}`,
    `cat --pre=x; rg "$_" 'writeFileSync' ${X}`,
    `cat --output=${X}; git log -1 "$_" -S writeFileSync`,
    `head -i; sed -n 1p "$_" 'writeFileSync' ${X}`,
    `cat '\\044\\050touch ${X}\\051'; grep -c 'writeFileSync' "\${_@P}"`,
    `rg --pr\\e 'x' 'writeFileSync' ${X}`,
    `git log --out\\put=${X} -S writeFileSync`,
    `sed -n 1p * 'writeFileSync' ${X}`,
    `rg a *pre=x 'writeFileSync' ${X}`,
    `sed -n 1p '*' 'writeFileSync' ${X}`,
    `sed -n 1p '{-i,${X}}' 'writeFileSync'`,
    `sed -n 1p '"-i"' 'writeFileSync' ${X}`,
    `sed -n 1p "'-i'" 'writeFileSync' ${X}`,
    `git log -1 '--out"put"=${X}' -S writeFileSync`,
    `sed -n 1p '@opts.txt' 'writeFileSync' ${X}`,
    // Implementer findings of revision 1 (completion report I1-I3, B1 and two interpretations), fail-closed beyond the literal R1:
    // a word that begins with a quoted span and continues (PowerShell passes `'x'-i` as `x` and `-i`),
    `sed -n 1p 'x'-i ${X} writeFileSync`,
    `sed -n 1p 'x'"-i" ${X} writeFileSync`,
    `git log -1 'x'--output=${X} writeFileSync`,
    // the text before a redirection operator, which is an argument of the program,
    `sed -n 1p -i>o.txt ${X} writeFileSync`,
    `rg --pre=x>o.txt 'writeFileSync' ${X}`,
    `git log -1 --output=${X}>o.txt -S writeFileSync`,
    // a doubled quote (one literal quote for PowerShell),
    `sed -n 1p "a ""-i"" b" ${X} writeFileSync`,
    `sed -n 1p 'a ''-i'' b' ${X} writeFileSync`,
    // a backslash before a separator, a backslash or the end (a Bash escape or line continuation),
    `grep -n a\\ ${Y} writeFileSync ${X}`,
    `grep -n a\\\\b ${Y} writeFileSync ${X}`,
    `grep -n a ${Y} writeFileSync ${X} \\`,
    `rg --pr\\\ne=x 'writeFileSync' ${X}`,
    // a single quote or a backslash inside a double-quoted span, and `--%` inside a word.
    `grep -n "a'b" ${Y} writeFileSync ${X}`,
    `grep -n "a\\b" ${Y} writeFileSync ${X}`,
    `grep -n a--%b ${Y} writeFileSync ${X}`,
  ];
  for (const command of revision1) {
    assert.equal(isReadOnlyShellCommand(command), false, command);
    assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), command);
    assert.ok(shellWriteTargets(root, command).includes(X), command);
  }
  // R1 (a) is an exact allowlist: every other ASCII character outside quotes, and also `$`, `\` and `'` inside double quotes, is refused.
  const allowed = /[A-Za-z0-9 \t\r\n\-_./:=,+%~;|&<>*?[\]\\"'`]/;
  for (let code = 0; code < 128; code++) {
    const ch = String.fromCharCode(code);
    if (allowed.test(ch)) continue;
    for (const command of [`grep -n a${ch}b ${Y} writeFileSync ${X}`, `grep -n "a${ch}b" ${Y} writeFileSync ${X}`]) {
      assert.equal(isReadOnlyShellCommand(command), false, JSON.stringify(command));
      assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), JSON.stringify(command));
    }
  }
  for (const ch of [' ', ' ', 'é', '–']) {
    const command = `grep -n a${ch}b ${Y} writeFileSync ${X}`;
    assert.equal(isReadOnlyShellCommand(command), false, JSON.stringify(command));
    assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), JSON.stringify(command));
  }
  // Allowed characters outside and inside quotes keep a plain grep read-only (the allowlist is not wider than needed).
  for (const ch of 'Az09-_./:=,+%~*?[]') {
    for (const command of [`grep -n a${ch}b ${Y} writeFileSync ${X}`, `grep -n "a${ch}b" ${Y} writeFileSync ${X}`]) {
      assert.equal(isReadOnlyShellCommand(command), true, command);
      assert.deepEqual(shellWriteTargets(root, command), [], command);
    }
  }
  // A `$` inside single quotes is not an expansion, and `$` is an allowed sed or git argument character (R1 (d)).
  assert.equal(isReadOnlyShellCommand(`sed -n '1,$p' ${Y}`), true);
  assert.deepEqual(shellWriteTargets(root, `sed -n '1,$p' ${Y}`), []);
  // The first candidate's `$PWD`/`$pwd` targets are no longer read-only: equality only, because the pre-change detection does
  // not report X for `> $pwd\X` without a write word (an unchanged pre-941 limit).
  for (const command of [`grep -n 'writeFileSync' ${Y} > $PWD/${X}`, `Select-String -Pattern 'a' -Path ${Y} > $pwd\\${X.replaceAll('/', '\\')}`]) {
    assert.equal(isReadOnlyShellCommand(command), false, command);
    assert.deepEqual(shellWriteTargets(root, command), previousTargets(root, command), command);
  }
}));

test('[GOV-941-HOOK-PRETOOL-DENY] The pre-write guard allows a read-only search of a policy file and still refuses a chained policy write', () => withRoot(root => {
  const event = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'PowerShell', tool_input: { command } });
  assert.deepEqual(evaluateHook(root, event("Select-String -Pattern 'Set-Content' -Path scripts/check-example.mjs"), ''), []);
  assert.match(evaluateHook(root, event("Select-String -Pattern 'x' -Path scripts/check-example.mjs; Set-Content 'scripts/check-example.mjs' 'x'"), '').join('\n'),
    /POLICY-EDIT AUTHORITY REQUIRED/);
  assert.match(evaluateHook(root, event("Select-String -Pattern 'x' -Path scripts/check-example.mjs > scripts/check-example.mjs"), '').join('\n'),
    /POLICY-EDIT AUTHORITY REQUIRED/);
  // Revision 1 (C40, C41): a redirection hidden after a Bash comment that contains a quote is still refused.
  const bash = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', tool_input: { command } });
  assert.match(evaluateHook(root, bash("cat README.md # '\necho x > scripts/check-example.mjs # '"), '').join('\n'), /POLICY-EDIT AUTHORITY REQUIRED/);
  assert.match(evaluateHook(root, bash("cat README.md # '\necho x > .git/hooks/pre-commit # '"), '').join('\n'), /OWNER GIT REQUIRED/);
}));

test('[GOV-941-CI-POLICY-DENY] CI refuses a change to the hook file outside every changed governance contract scope', () => withRoot(root => {
  mkdirSync(join(root, 'scripts/workflow-gates'), { recursive: true });
  mkdirSync(join(root, 'tasks'), { recursive: true });
  writeFileSync(join(root, 'scripts/workflow-gates/security-hook.mjs'), 'export const changed = true;\n');
  for (const phase of ['verify', 'release']) {
    assert.match(validateDiff(root, ['scripts/workflow-gates/security-hook.mjs'], { phase }).errors.join('\n'),
      /scripts\/workflow-gates\/security-hook\.mjs: outside every changed governance contract scope/, phase);
  }
}));

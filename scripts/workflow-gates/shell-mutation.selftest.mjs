#!/usr/bin/env node
// Task 943 (owner D11, 2026-11-01; revision 2 D13/D14): commands that copy, move, delete or edit files in place, the file
// APIs that do the same, and every spelling, folder change and shell folder that reaches a file are counted as writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { shellWriteTargets, governanceIndependenceErrors, evaluateHook, isReadOnlyShellCommand } from './security-hook.mjs';
import { validateDiff } from './cli.mjs';

const RECEIPT = 'tasks/gov_kickoff.security.json';
// X is a governance scope file, Y a readable file with X's name in another folder, D the folder holding X, Z a path
// outside every scope.
const X = 'scripts/workflow-gates/fixture-scope.mjs';
const Y = 'docs/fixture-scope.mjs';
const D = 'scripts/workflow-gates';
const Z = 'docs/elsewhere/z.mjs';

function put(root, file, text = 'a\n') { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); }
function withRoot(fn, prefix = 'lero-shell-mutation-') {
  const root = mkdtempSync(join(tmpdir(), prefix));
  try {
    for (const file of [X, Y, 'docs/backlog.md', 'docs/ydir/f.mjs', 'README.md']) put(root, file);
    return fn(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
// A synthetic governance contract: governanceIndependenceErrors reads only its scope.
const contractFor = scope => ({ version: 1, stage: 'reviewed', kind: 'governance', scope });
// Transcript entries record the shell folder of each call (`cwd`), as Claude Code does.
function transcript(calls) {
  return calls.flatMap(([tool, input, cwd], i) => [
    { type: 'assistant', ...(cwd ? { cwd } : {}), message: { content: [{ type: 'tool_use', id: `m${i}`, name: tool, input: typeof input === 'string' ? { command: input } : input }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `m${i}`, content: 'output' }] } },
  ]).map(line => JSON.stringify(line)).join('\n');
}
const independence = (root, scope, calls) => governanceIndependenceErrors(root, contractFor(scope), RECEIPT, transcript(calls)).join('\n');
const wrote = file => new RegExp(`GOVERNANCE INDEPENDENCE: this session wrote ${file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')};`);
const executor = (command, tool = 'Bash', cwd) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool,
  ...(cwd ? { cwd } : {}), tool_input: { command } });
const refusal = (root, event) => evaluateHook(root, event, '').join('\n');

test('[GOV-943-HOOK-SOURCE-ALLOW] Reading a scope file as the source of a copy, link or redirection input is not a write of it', () => withRoot(root => {
  const sources = [['Bash', `cp ${X} ${Z}`], ['Bash', `cp ${X} C:/outside/x.mjs`], ['PowerShell', `Copy-Item -Path ${X} -Destination ${Z}`],
    ['Bash', `install ${X} ${Z}`], ['Bash', `ln -s ${X} ${Z}`], ['Bash', `dd if=${X} of=${Z}`], ['Bash', `tee ${Z} < ${X}`]];
  for (const [, command] of sources) {
    const targets = shellWriteTargets(root, command);
    assert.ok(!targets.includes(X), `${command}: ${JSON.stringify(targets)}`);
  }
  assert.ok(shellWriteTargets(root, `cp ${X} ${Z}`).includes(Z));
  // The read-only commands of GOV-941-HOOK-READONLY-ALLOW still report nothing.
  const readOnly = [
    ['Bash', "grep -n -i -E 'writeFileSync|Set-Content|Out-File' scripts/workflow-gates/security-hook.mjs | head -30"],
    ['Bash', "grep -n 'writeFileSync' scripts/workflow-gates/cli.mjs; sed -n '60,70p' .claude/rules/review/03-decision-closure.md"],
    ['PowerShell', "Select-String -Pattern 'Set-Content' -Path scripts/workflow-gates/security-hook.mjs"],
    ['Bash', "grep -n -E 'Set-Content|echo injected > src/profile.ts' scripts/workflow-gates/diff-hook.selftest.mjs"],
    ['Bash', 'git diff -- scripts/workflow-gates/cli.mjs'],
    ['Bash', "sed -n '1,5p' scripts/workflow-gates/cli.mjs"],
    ['PowerShell', "Get-Content scripts/workflow-gates/cli.mjs | Select-String -Pattern 'Set-Content'"],
    ['PowerShell', "Get-Content scripts\\workflow-gates\\cli.mjs | Select-String -Pattern 'Set-Content'"],
    ['Bash', "grep -n '#.*writeFileSync' scripts/workflow-gates/cli.mjs"],
    ['Bash', "cd scripts/workflow-gates; grep -n 'writeFileSync' cli.mjs"],
    ['Bash', "grep -n 'writeFileSync' scripts/workflow-gates/cli.mjs\r\nsed -n '1,5p' scripts/workflow-gates/cli.mjs"],
  ];
  for (const [, command] of readOnly) {
    assert.equal(isReadOnlyShellCommand(command), true, command);
    assert.deepEqual(shellWriteTargets(root, command), [], command);
  }
  const scope = [X, 'scripts/workflow-gates/security-hook.mjs', 'scripts/workflow-gates/cli.mjs', '.claude/rules/review/03-decision-closure.md',
    'scripts/workflow-gates/diff-hook.selftest.mjs', 'src/profile.ts'];
  assert.equal(independence(root, scope, [...sources, ...readOnly]), '');
}));

test('[GOV-943-HOOK-PROGRAM-DENY] A scope file changed by a copy, move, delete, tee, in-place edit, touch, truncate, link, dd or PowerShell item command is counted as written', () => withRoot(root => {
  const forms = [
    ['Bash', `cp ${Y} ${X}`], ['Bash', `cp ${Y} ${D}/`], ['Bash', `cp ${Y} ${D}`], ['Bash', `cp -t ${D} ${Y}`],
    ['Bash', `cp --target-directory=${D} ${Y}`], ['Bash', `mv ${Y} ${X}`], ['Bash', `mv ${X} ${Z}`], ['Bash', `echo x | tee -a ${X}`],
    ['Bash', `sed -i 's/a/b/' ${X}`], ['Bash', `sed -i.bak -e 's/a/b/' ${X}`], ['Bash', `sed --in-place -n 's/a/b/' ${X}`],
    ['Bash', `rm -f ${X}`], ['Bash', `unlink ${X}`], ['Bash', `touch ${X}`], ['Bash', `truncate -s 0 ${X}`], ['Bash', `ln -sf ${Y} ${X}`],
    ['Bash', `install ${Y} ${X}`], ['Bash', `install -m 644 ${Y} ${X}`], ['Bash', `dd if=${Y} of=${X}`], ['Bash', `sudo rm ${X}`],
    ['Bash', `env A=1 rm ${X}`], ['Bash', `sudo -u admin rm ${X}`], ['Bash', `env -i A=1 rm ${X}`], ['Bash', `grep -n a ${Y}; cp ${Y} ${X}`],
    ['PowerShell', `Copy-Item ${Y} ${X}`], ['PowerShell', `Copy-Item -Path ${Y} -Destination ${X}`], ['PowerShell', `copy ${Y} ${X}`],
    ['PowerShell', `cpi -Path ${Y} -Dest ${X}`], ['PowerShell', `Move-Item -Path ${X} -Destination ${Z}`], ['PowerShell', `move ${X} ${Z}`],
    ['PowerShell', `mi ${Y} ${X}`], ['PowerShell', `Remove-Item -Path ${X} -Force`], ['PowerShell', `del ${X}`], ['PowerShell', `erase ${X}`],
    ['PowerShell', `ri -LiteralPath ${X}`], ['PowerShell', `Get-Content ${Y} | Tee-Object -FilePath ${X}`],
    ['PowerShell', `Rename-Item -Path ${X} -NewName other.mjs`], ['PowerShell', `ren ${X} other.mjs`], ['PowerShell', `rni ${X} other.mjs`],
    ['PowerShell', `New-Item -ItemType File -Path ${X} -Force`], ['PowerShell', `ni ${X}`], ['PowerShell', `New-Item -Path ${D} -Name ${basename(X)}`],
    ['PowerShell', `Clear-Content ${X}`], ['PowerShell', `clc ${X}`], ['PowerShell', `sc ${X} 'x'`], ['PowerShell', `ac ${X} 'x'`],
    ['PowerShell', `Set-Content -Path:${X} -Value x`],
  ];
  for (const form of forms) {
    const [, command] = form;
    const targets = shellWriteTargets(root, command);
    assert.ok(targets.includes(X), `${command}: ${JSON.stringify(targets)}`);
    assert.match(independence(root, [X], [form]), wrote(X), command);
  }
  // A rename also reports the new name beside the source.
  assert.ok(shellWriteTargets(root, `Rename-Item -Path ${X} -NewName other.mjs`).includes(`${D}/other.mjs`));
  assert.match(independence(root, [X], forms), wrote(X));
}));

test('[GOV-943-HOOK-DIRECTORY-DENY] Deleting, moving or copying into a directory counts every affected file under it', () => withRoot(root => {
  put(root, `${D}/node_modules/pkg/index.js`);
  const copied = `${D}/ydir/f.mjs`;
  for (const [tool, command, file] of [['Bash', `rm -rf ${D}`, X], ['PowerShell', `Remove-Item -Recurse -Force ${D}`, X], ['Bash', `mv ${D} ${Z}`, X],
    ['Bash', `cp -r docs/ydir ${D}/`, copied], ['PowerShell', `Copy-Item -Recurse -Path docs/ydir -Destination ${D}`, copied],
    // The project root itself (project path '') is walked too.
    ['Bash', 'rm -rf .', X], ['Bash', 'find . -name x -delete', X], ['PowerShell', 'Remove-Item -Recurse -Force .', X], ['Bash', 'mv . ../elsewhere', X]]) {
    const targets = shellWriteTargets(root, command);
    assert.ok(targets.includes(file), `${command}: ${JSON.stringify(targets)}`);
    assert.match(independence(root, [X, copied], [[tool, command]]), wrote(file), command);
  }
  // Generated trees are reported as the directory itself and never entered.
  const removed = shellWriteTargets(root, `rm -rf ${D}`);
  assert.ok(removed.includes(`${D}/node_modules`), JSON.stringify(removed));
  assert.ok(!removed.some(file => file.startsWith(`${D}/node_modules/`)), JSON.stringify(removed));
}));

test('[GOV-943-HOOK-API-DENY] File-changing Node, .NET and Python APIs in a command are recognised as write words', () => withRoot(root => {
  // The path is held in a variable, so only the write word of R3 can report it.
  const node = ['appendFile', 'appendFileSync', 'copyFile', 'copyFileSync', 'cpSync', 'renameSync', 'rmSync', 'unlinkSync', 'truncateSync',
    'createWriteStream', 'rename', 'rm', 'unlink', 'truncate', 'cp'].map(api => `node -e "const fs = require('fs'); const p = '${X}'; fs.${api}(p, () => 0)"`);
  node.push(`node -e "const fs = require('fs'); const p = '${X}'; fs.promises.writeFile(p, 'x')"`);
  const dotnet = ['WriteAllText', 'WriteAllLines', 'WriteAllBytes', 'AppendAllText', 'AppendAllLines', 'Copy', 'Move', 'Delete', 'Replace']
    .map(api => `$p = '${X}'; [IO.File]::${api}($p)`);
  dotnet.push(`$p = '${X}'; [System.IO.File]::Delete($p)`, `[IO.File]::WriteAllText('${X}', 'x')`);
  const python = ['shutil.copy', 'shutil.copyfile', 'shutil.move', 'os.remove', 'os.unlink', 'os.replace', 'os.rename']
    .map(api => `python -c "import os, shutil; p = '${X}'; ${api}(p)"`);
  python.push(`python -c "import pathlib; p = '${X}'; pathlib.Path(p).write_bytes(b'x')"`, `python -c "import shutil; shutil.copy('${Y}', '${X}')"`);
  for (const command of [...node, ...dotnet, ...python]) {
    const targets = shellWriteTargets(root, command);
    assert.ok(targets.includes(X), `${command}: ${JSON.stringify(targets)}`);
  }
  assert.match(independence(root, [X], [...node, ...dotnet, ...python].map(command => ['Bash', command])), wrote(X));
}));

test('[GOV-943-HOOK-PRETOOL-DENY] The pre-write guard refuses executor policy and unreceipted product writes made through cp, sed -i or Copy-Item', () => withRoot(root => {
  assert.match(refusal(root, executor('cp docs/backlog.md scripts/check-example.mjs')), /POLICY-EDIT AUTHORITY REQUIRED/);
  assert.match(refusal(root, executor("sed -i 's/a/b/' scripts/check-example.mjs")), /POLICY-EDIT AUTHORITY REQUIRED/);
  assert.match(refusal(root, executor('Copy-Item -Path docs/backlog.md -Destination scripts/check-example.mjs', 'PowerShell')), /POLICY-EDIT AUTHORITY REQUIRED/);
  assert.match(refusal(root, executor('cp docs/backlog.md src/lib/example.ts')), /SECURITY TEST CONTRACT MISSING/);
  // Controls: copying a policy file elsewhere and reading it stay allowed.
  assert.equal(refusal(root, executor('cp scripts/check-example.mjs docs/copy.md')), '');
  assert.equal(refusal(root, executor("sed -n '1,5p' scripts/check-example.mjs")), '');
}));

test('[GOV-943-HOOK-MALFORMED-ERROR] Incomplete or unparseable mutating commands never throw and fail closed', () => withRoot(root => {
  for (const command of ['cp', 'cp -r', 'cp -t', `cp ${X}`, 'Copy-Item -Destination', 'Copy-Item -Path', 'dd of=', 'dd', 'mv', 'rm', 'rm -rf',
    "sed -i", "sed -i -e", 'tee', 'touch', 'truncate -s', 'install -m', 'New-Item', 'New-Item -Name', 'Rename-Item -NewName', 'ln -s',
    'xargs', 'find', 'sudo', 'env A=1', 'Remove-Item -Path', 'cd', 'Set-Location -Path']) {
    assert.doesNotThrow(() => shellWriteTargets(root, command), command);
    assert.ok(!shellWriteTargets(root, command).includes(X), `${command}: ${JSON.stringify(shellWriteTargets(root, command))}`);
  }
  for (const command of ['cp', 'Copy-Item -Destination', 'dd of=']) assert.deepEqual(shellWriteTargets(root, command), [], command);
  for (const command of [undefined, null, 42, {}, ['rm']]) assert.deepEqual(shellWriteTargets(root, command), [], String(command));
  // An unparseable command (unterminated quote) that names a section 5 program reports every project path it names.
  assert.ok(shellWriteTargets(root, `rm "${X}`).includes(X));
  assert.ok(shellWriteTargets(root, `Copy-Item '${Y}' ${X}"`).includes(X));
  // Without such a program the unparseable command keeps the Task 941 result. `sed`, `find` and `xargs` count only with
  // the condition of their section 5 row (a double-quoted backslash makes these commands unparseable).
  assert.ok(!shellWriteTargets(root, `grep -n "a ${X}`).includes(X));
  assert.ok(!shellWriteTargets(root, `grep -n "a\\|b" ${Y}; sed -n 1p ${X}`).includes(X));
  assert.ok(!shellWriteTargets(root, `grep -n "a\\|b" ${Y}; find ${X} -name x`).includes(X));
  assert.ok(!shellWriteTargets(root, `grep -n "a\\|b" ${Y} | xargs grep a ${X}`).includes(X));
  for (const command of [`grep -n "a\\|b" ${Y}; sed -i 's/a/b/' ${X}`, `grep -n "a\\|b" ${Y}; sed -ni.bak 1p ${X}`,
    `grep -n "a\\|b" ${Y}; find ${X} -delete`, `grep -n "a\\|b" ${Y} | xargs rm ${X}`]) {
    assert.ok(shellWriteTargets(root, command).includes(X), command);
  }
  for (const command of [`find ${D} -name x -delete`, `ls ${D} | xargs rm`, `find ${D} -name '*.mjs' -exec rm`]) {
    const targets = shellWriteTargets(root, command);
    assert.ok(targets.includes(X), `${command}: ${JSON.stringify(targets)}`);
  }
  // `xargs` before a reading program and `find` without an action write nothing.
  assert.ok(!shellWriteTargets(root, `ls ${D} | xargs grep a`).includes(X));
  assert.ok(!shellWriteTargets(root, `find ${D} -name x`).includes(X));
}));

test('[GOV-943-CI-DELETE-DENY] CI refuses a deleted hook file outside every changed governance contract scope', () => withRoot(root => {
  assert.equal(existsSync(join(root, 'scripts/workflow-gates/security-hook.mjs')), false);
  for (const phase of ['verify', 'release']) {
    assert.match(validateDiff(root, ['scripts/workflow-gates/security-hook.mjs'], { phase }).errors.join('\n'),
      /scripts\/workflow-gates\/security-hook\.mjs: outside every changed governance contract scope/, phase);
  }
}));

// The folder holding the fixture root and its 8.3 alias, when the volume creates aliases (`dir /x`).
function shortAlias(folder, name) {
  const listing = spawnSync('cmd', ['/d', '/c', 'dir', '/x', folder], { encoding: 'utf8' });
  if (listing.status !== 0) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return listing.stdout.split(/\r?\n/).map(line => line.match(new RegExp(`\\s(\\S*~\\S*)\\s+${escaped}\\s*$`))?.[1]).find(Boolean) || null;
}

test('[GOV-943-HOOK-TARGET-SPELLING-DENY] A write is counted for the file it reaches, whatever spelling, folder change or shell folder names it', () => {
  const parent = mkdtempSync(join(tmpdir(), 'LongFixtureParentFolder-'));
  const root = join(parent, 'LongFixtureRootName');
  const H = 'D/hook.mjs', L = 'D/LongScopeFileName.mjs';
  const scope = [H, L];
  const parts = [];
  try {
    for (const file of [H, L, 'Y', 'README.md', 'scripts/check-example.mjs']) put(root, file);
    mkdirSync(join(root, 'sibling'), { recursive: true });
    const reports = (command, file = H, start) => {
      const targets = shellWriteTargets(root, command, start);
      assert.ok(targets.includes(file), `${command}: ${JSON.stringify(targets)}`);
    };
    // R12 (b): a redirection glob.
    reports('cat Y > D/hoo?.mjs');
    reports('Get-Content Y > D/hoo?.mjs');
    assert.deepEqual(shellWriteTargets(root, 'cat Y > D/nomatch?.mjs'), ['D/nomatch?.mjs']);
    // R12 (c): a folder change inside the command.
    for (const command of ['cd D; cat Y > hook.mjs', 'cd D && echo x > hook.mjs', 'Set-Location D; Get-Content Y > hook.mjs',
      'Push-Location D; Set-Content hook.mjs x', `cd D; node -e "require('fs').writeFileSync('hook.mjs','x')"`,
      // nested shells and interpreters
      "bash -c 'cd D; cat ../Y > hook.mjs'", 'cmd /d /c "cd D && type ..\\Y > hook.mjs"',
      `node -e "process.chdir('D'); require('fs').writeFileSync('hook.mjs','x')"`]) reports(command);
    // R12 (d): the shell folder of a transcript entry, below the root and outside it.
    assert.match(independence(root, scope, [['Bash', 'echo x > hook.mjs', join(root, 'D')]]), wrote(H));
    assert.match(independence(root, scope, [['Bash', `echo x > ../${basename(root)}/D/hook.mjs`, join(parent, 'elsewhere')]]), wrote(H));
    assert.match(independence(root, scope, [['Write', { file_path: 'hook.mjs', content: 'x' }, join(root, 'D')]]), wrote(H));
    assert.match(refusal(root, executor('echo x > check-example.mjs', 'Bash', join(root, 'scripts'))), /POLICY-EDIT AUTHORITY REQUIRED/);
    // R12 (e): write words naming a project-root product file.
    for (const [tool, command] of [['PowerShell', 'Set-Content package.json x'], ['PowerShell', 'Set-Content -Path next.config.ts -Value x'],
      ['PowerShell', 'Add-Content tsconfig.json x'], ['PowerShell', "'x' | Out-File -FilePath package.json"],
      ['Bash', `node -e "require('fs').writeFileSync('package.json','x')"`]]) {
      assert.match(refusal(root, executor(command, tool)), /SECURITY TEST CONTRACT MISSING/, command);
    }
    // R12 (g): the Bash `>|` redirection.
    for (const command of ['cat Y >| D/hook.mjs', 'cat Y >|D/hook.mjs', 'cat Y 2>| D/hook.mjs', "cat Y >| 'D/hook.mjs'", 'echo x >| D/hook.mjs',
      'cd D; cat ../Y >| hook.mjs']) reports(command);
    reports('cd D; grep -c a ../Y >|cat', 'D/cat');
    assert.match(refusal(root, executor('echo x >| scripts/check-example.mjs')), /POLICY-EDIT AUTHORITY REQUIRED/);
    assert.match(refusal(root, executor('cd .git; grep -c a ../README.md >|head')), /OWNER GIT REQUIRED/);
    // Controls.
    assert.deepEqual(shellWriteTargets(root, 'cd D; grep -n a hook.mjs'), []);
    assert.deepEqual(shellWriteTargets(root, "grep -n '>|D/hook.mjs' Y"), []);
    if (process.platform === 'win32') {
      // R12 (a): trailing dots and spaces, and a folder with one trailing dot.
      for (const command of ['Get-Content Y > D/hook.mjs.', 'Get-Content Y > "D/hook.mjs. ."', 'Get-Content Y > D./hook.mjs']) reports(command);
      parts.push('trailing-dots');
      const drive = root.slice(0, 1).toLowerCase();
      const forward = root.replaceAll('\\', '/');
      const msys = `/${drive}${forward.slice(2)}`;
      // Absolute spellings: MSYS, the `\\?\` and `\\.\` prefixes, a junction to D and, when reachable, the administrative share.
      assert.match(independence(root, scope, [['Bash', `echo x > ${msys}/${H}`]]), wrote(H));
      assert.match(independence(root, scope, [['Bash', `echo x > \\\\?\\${root}\\D\\hook.mjs`]]), wrote(H));
      assert.match(independence(root, scope, [['Bash', `echo x > \\\\.\\${root}\\D\\hook.mjs`]]), wrote(H));
      symlinkSync(join(root, 'D'), join(parent, 'junction'), 'junction'); // the junction `mklink /J` creates
      assert.match(independence(root, scope, [['Bash', `echo x > ${join(parent, 'junction').replaceAll('\\', '/')}/hook.mjs`]]), wrote(H));
      assert.match(refusal(root, executor(`echo x > ${msys}/package.json`)), /SECURITY TEST CONTRACT MISSING/);
      parts.push('msys', 'device-prefixes', 'junction');
      const share = `\\\\localhost\\${root.slice(0, 1)}$${root.slice(2)}`;
      if (existsSync(share)) {
        assert.match(independence(root, scope, [['Bash', `echo x > ${share}\\D\\hook.mjs`]]), wrote(H));
        parts.push('admin-share');
      }
      // 8.3 aliases of the file, the root folder and its parent.
      const fileAlias = shortAlias(join(root, 'D'), 'LongScopeFileName.mjs');
      const rootAlias = shortAlias(parent, 'LongFixtureRootName');
      const parentAlias = shortAlias(dirname(parent), basename(parent));
      if (fileAlias && rootAlias && parentAlias) {
        assert.match(independence(root, scope, [['Bash', `echo x > D/${fileAlias}`]]), wrote(L));
        const viaRoot = `${parent.replaceAll('\\', '/')}/${rootAlias}/${L}`;
        assert.match(independence(root, scope, [['Bash', `echo x > ${viaRoot}`]]), wrote(L));
        assert.match(independence(root, scope, [['Write', { file_path: viaRoot, content: 'x' }]]), wrote(L));
        const viaParent = `${dirname(parent).replaceAll('\\', '/')}/${parentAlias}/${basename(root)}/scripts/check-example.mjs`;
        assert.match(refusal(root, executor(`echo x > ${viaParent}`)), /POLICY-EDIT AUTHORITY REQUIRED/);
        parts.push('short-names');
      }
    }
    console.log(`GOV-943-HOOK-TARGET-SPELLING-DENY platform parts run on ${process.platform}: ${parts.join(', ') || 'none'}`);
  } finally { rmSync(parent, { recursive: true, force: true }); }
});

#!/usr/bin/env node
// Task 944 revisions 1 and 2, R8 and R9 (owner D18, 2026-11-03): the shell write forms that the reviewed Task 943 hook reported
// nothing for (C58-C68, C71) are counted as writes, so the independence check counts them and the pre-write guard decides on them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { shellWriteTargets, governanceIndependenceErrors, evaluateHook } from './security-hook.mjs';

const RECEIPT = 'tasks/gov_kickoff.security.json';
// X a governance scope file, D its folder, N its file name, Y a fixture file named N outside D; P the executor's policy file.
const X = 'scripts/workflow-gates/fixture-scope.mjs';
const D = 'scripts/workflow-gates';
const N = 'fixture-scope.mjs';
const Y = `docs/${N}`;
const P = 'scripts/check-example.mjs';
const windows = process.platform === 'win32';

function withRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), 'lero-shell-forms-'));
  const put = file => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), 'a\n'); };
  for (const file of [X, P, Y, `docs/src/${N}`]) put(file);
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function transcript(command) {
  return [{ type: 'assistant', message: { content: [{ type: 'tool_use', id: 's0', name: 'Bash', input: { command } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'output' }] } }].map(line => JSON.stringify(line)).join('\n');
}
const executor = (root, command) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: root, tool_input: { command } });
// The R8 forms of AC12 for a target x in folder d with file name n; the source y is a file named n outside d.
function forms(x, d, n) {
  return [
    `if true; then rm ${x}; fi`, `if true; then echo; else rm ${x}; fi`, `if false; then :; elif true; then cp ${Y} ${x}; fi`,
    `for f in a; do rm ${x}; done`, `while false; do rm ${x}; done`, `until true; do cp ${Y} ${x}; done`, `if true; then cd ${d}; rm ${n}; fi`,
    `bash -lc 'rm ${x}'`, `bash -ec 'cp ${Y} ${x}'`, `sh -xc "rm ${x}"`, `bash -c -- 'rm ${x}'`,
    `python -c "open('${x}','w').write('x')"`, `python3 -c "f = open('${x}', 'a')"`, `python -c "with open('${x}', mode='wb') as f: pass"`,
    `node -e "require('fs').openSync('${x}','w')"`, `node -e "require('fs').open('${x}', 'r+', () => 0)"`,
    `powershell -Command "[IO.File]::Create('${x}')"`, `powershell -Command "[System.IO.File]::OpenWrite('${x}')"`,
    `python -c "from pathlib import Path; Path('${x}').unlink()"`, `python -c "import pathlib; pathlib.Path('${Y}').rename('${x}')"`,
    `python -c "from pathlib import Path; Path('${x}').touch()"`,
    `python -c "import shutil; shutil.rmtree('${d}')"`, `node -e "require('fs').rmSync('${d}', { recursive: true })"`,
    `node -e "require('fs').rmdirSync('${d}', { recursive: true })"`, `powershell -Command "[IO.Directory]::Delete('${d}', $true)"`,
    `xcopy ${Y} ${x}`,
    // The backslash spelling is a Windows path only; elsewhere a backslash is a file-name character and xcopy does not exist.
    ...(windows ? [`xcopy ${Y.replaceAll('/', '\\')} ${d.replaceAll('/', '\\')}\\ /Y`] : []),
    `robocopy docs ${d} ${n}`, `robocopy docs/src ${d} /MIR`, `npx rimraf ${x}`, `rimraf ${d}`, `npx shx rm ${x}`, `npx shx cp ${Y} ${x}`,
    `perl -pi -e 's/a/b/' ${x}`, `perl -i.bak -pe 's/a/b/' ${x}`, `perl -pi -e 's/a/b/' ${x} '`,
    `env -C ${d} rm ${n}`, `env --chdir=${d} rm ${n}`, `env --chdir ${d} rm ${n}`, `echo '${d}/*.mjs'; rm ${d}/*.mjs; echo '`,
    // Revision 2, R8 (f): a generic file API name after `require('fs').promises.` and its variants.
    `node -e "require('fs').promises.rm('${x}')"`, `node -e "require('fs').promises.unlink('${x}')"`,
    `node -e "require('node:fs').promises.truncate('${x}')"`, `node -e "require('fs').promises.rename('${Y}', '${x}')"`,
    `node -e "require('fs').promises.cp('${Y}', '${x}')"`, `node -e "(await import('fs')).promises.rm('${x}')"`,
    `node -e "require('fs').promises.rm('${d}', { recursive: true })"`,
  ];
}
const CONTROLS = [
  `if [ -f ${X} ]; then cat ${X}; fi`, `for f in ${X}; do grep -n a ${X}; done`, `bash -lc 'cat ${X}'`, `bash -ec 'cp ${X} docs/z.mjs'`,
  `python -c "print(open('${X}').read())"`, `python -c "open('${X}', 'r')"`, `python -c "open('${X}', encoding='utf8')"`,
  `node -e "require('fs').openSync('${X}','r')"`, `powershell -Command "[IO.File]::ReadAllText('${X}')"`,
  `powershell -Command "[IO.Directory]::CreateDirectory('${D}/new')"`, `xcopy ${X} docs/z.mjs`, `robocopy ${D} docs/out ${N}`,
  `perl -ne 'print' ${X}`, `perl -Ilib -e 'print 1' ${X}`, `env -C docs cat ${N}`,
  // Self-audit: the parser-rejected spellings of the perl read controls (the R1 fallback reads `-Ilib` and `-Mstrict`).
  `perl -Ilib -e 'print 1' ${X} '`, `perl -Mstrict -e 'print 1' ${X} '`, `echo '${D}/*.mjs'; echo '`, `grep -rn "then rm ${X}" docs`,
  `node -e "require('fs').promises.readFile('${X}')"`, `node -e "require('fs').promises.stat('${X}')"`,
  `node -e "console.log('${X}'.replace('a', 'b'))"`, `node -e "require('fs').promises.readdir('${D}')"`,
];

test('[GOV-944-HOOK-SHELL-FORMS-DENY] A file changed by a shell compound command, a clustered nested-shell flag, an open or create call with a write mode, a pathlib or directory-delete call, a Windows or npm copy or delete tool, perl -i or env -C is counted as written', () => withRoot(root => {
  const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: [X] };
  const independence = new RegExp(`GOVERNANCE INDEPENDENCE: this session wrote ${X.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')};`);
  for (const command of forms(X, D, N)) {
    assert.ok(shellWriteTargets(root, command, root).includes(X), `X reported for: ${command}`);
    assert.match(governanceIndependenceErrors(root, contract, RECEIPT, transcript(command)).join('\n'), independence, `independence for: ${command}`);
  }
  for (const command of forms(P, 'scripts', 'check-example.mjs')) {
    assert.match(evaluateHook(root, executor(root, command), '').join('\n'), /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/,
      `executor refused: ${command}`);
  }
  for (const command of CONTROLS) {
    assert.ok(!shellWriteTargets(root, command, root).includes(X), `control reports no X: ${command}`);
    assert.deepEqual(governanceIndependenceErrors(root, contract, RECEIPT, transcript(command)), [], `control independence: ${command}`);
  }
}));

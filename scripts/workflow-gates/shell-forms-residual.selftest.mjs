#!/usr/bin/env node
// Task 942 R4 and R5 (owner D13, D20): the shell write forms that the reviewed Task 944 hook reported nothing for are counted as
// writes, so the independence check counts them and the pre-write guard decides on them. The lists hold the forms of AC6.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { shellWriteTargets, governanceIndependenceErrors, evaluateHook } from './security-hook.mjs';

const RECEIPT = 'tasks/gov_kickoff.security.json';
// X a governance scope file, D its folder, N its file name, Y a fixture file named N outside D; P the executor's policy file.
const X = 'scripts/workflow-gates/fixture-scope.mjs';
const D = 'scripts/workflow-gates';
const N = 'fixture-scope.mjs';
const Y = `docs/${N}`;
const P = 'scripts/check-example.mjs';

function withRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), 'lero-942-shell-forms-'));
  const put = file => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), 'a\n'); };
  for (const file of [X, P, Y]) put(file);
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function transcript(command) {
  return [{ type: 'assistant', message: { content: [{ type: 'tool_use', id: 's0', name: 'Bash', input: { command } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'output' }] } }].map(line => JSON.stringify(line)).join('\n');
}
const executor = (root, command) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: root, tool_input: { command } });
// The forms(x, d, n) list of p07-shell-forms-run.mjs: R4 (a) to (e).
function formsP07(x, d, n) {
  return [
    `echo \`rm ${x}\``, `echo \`cp ${Y} ${x}\``,
    `perl -0pi -e 's/a/b/' ${x}`, `perl -0777pi -e 's/a/b/' ${x}`, `perl -0x1Fpi -e 's/a/b/' ${x}`, `perl -0pi -e 's/a/b/' ${x} '`,
    `env -C ${d} bash -c 'rm ${n}'`, `env --chdir=${d} bash -lc 'rm ${n}'`, `env --chdir ${d} sh -c 'rm ${n}'`, `env -C ${d} python -c "open('${n}','w')"`,
    `env -C ${d} node -e "require('fs').rmSync('${n}')"`, `env -C ${d} bash -c 'rm ${n}'; echo '`,
    `npm exec rimraf ${x}`, `npm exec --yes -- rimraf ${x}`, `npm x rimraf ${x}`, `pnpm exec rimraf ${x}`, `pnpm dlx rimraf ${x}`, `yarn rimraf ${x}`, `yarn exec rimraf ${x}`, `yarn dlx rimraf ${x}`, `bun x rimraf ${x}`, `yarn shx rm ${x}`,
    `python -c "open(file='${x}', mode='w')"`, `python -c "open(file='${x}', 'a')"`, `python -c "import os; os.removedirs('${d}')"`,
    `powershell -Command "[IO.File]::Open('${x}','Create')"`, `powershell -Command "[IO.File]::Open('${x}','Append')"`, `powershell -Command "[IO.File]::Open('${x}',[IO.FileMode]::Truncate)"`, `powershell -Command "[System.IO.File]::Open('${x}','OpenOrCreate')"`,
  ];
}
// The forms(x, d) list of p10-more-forms-run.mjs: R4 (f).
function formsP10(x, d) {
  return [
    `python -c "open('${x}', buffering=1, mode='w')"`, `python -c "open('${x}', encoding='utf8', mode='w')"`, `python -c "open('${x}', newline='', mode='a')"`,
    `python -c "open(file='${x}', encoding='utf8', mode='w')"`, `node -e "fs.open('${x}', encoding='utf8', flags='w')"`,
    `python -c "from pathlib import Path; Path('${x}').open(mode='w')"`, `python -c "from pathlib import Path; Path('${x}').open(encoding='utf8', mode='a')"`,
    `python -c "import shutil; shutil.rmtree(path='${d}')"`,
    `python -c "open(\\"${x}\\", 'w')"`, `python -c "open(\\"${x}\\", \\"w\\")"`, `python -c "open(\\"${x}\\", mode=\\"w\\")"`,
    `powershell -Command "[IO.File]::Create(\\"${x}\\")"`, `powershell -Command "[IO.File]::OpenWrite(\\"${x}\\")"`,
    `python -c "from pathlib import Path; Path(\\"${x}\\").unlink()"`, `node -e "require(\\"fs\\").openSync(\\"${x}\\", \\"w\\")"`, `python -c "import shutil; shutil.rmtree(\\"${d}\\")"`,
  ];
}
// Spellings of the same R4 rows beyond the two design lists: a program directly before a backtick, `perl` where only the R1
// fallback reads it (inside backticks), `-0` later in a cluster, another `env` option before `-C`, each of two `env` folders in one
// command, a nested `env`, an interpreter outside NESTED_SHELL (only the parsed reading holds its API paths), a negative keyword
// value and the other two `FileMode` writers. The last form pins the attached-script branch of Task 944 R8 (d) (AC6).
function formsExtra(x, d, n) {
  const [outer, inner] = d.includes('/') ? d.split('/') : ['.', d];
  return [
    `echo \`rm\` ${x}`, `echo \`perl -0pi -e 's/a/b/' ${x}\``, `echo \`perl -0777pi -e 's/a/b/' ${x}\``, `echo \`perl -0x1Fpi -e 's/a/b/' ${x}\``, `echo \`perl -n0pi -e 's/a/b/' ${x}\``,
    `perl -n0pi -e 's/a/b/' ${x}`, `perl -n0pi -e 's/a/b/' ${x} '`, `perl -l0777pi -e 's/a/b/' ${x}`,
    `env -C ${d} bun -e 'require("fs").rmSync("${n}")'`, `env -C ${outer} bun -e 'require("fs").rmSync("${inner}", { recursive: true })'`,
    `env -i -C ${d} python -c "open('${n}','w')"`, `env -u HOME -C ${d} python -c "open('${n}','w')"`,
    `env -C docs python -c "print(1)"; env -C ${d} python -c "open('${n}','w')"`,
    `env -C ${outer} bash -c 'env -C ${inner} rm ${n}'`, `env -C ${outer} bash -c 'env -C ${inner} eval rm ${n}'; echo '`,
    `env -C ${d} python -c 'open("${n}","w")'`,
    `python -c "open('${x}', buffering=-1, mode='w')"`, `python -c "from pathlib import Path; Path('${x}').open(buffering=-1, mode='w')"`,
    `powershell -Command "[IO.File]::Open('${x}',[FileMode]::CreateNew)"`, `powershell -Command "[IO.File]::Open('${x}',[System.IO.FileMode]::OpenOrCreate)"`,
    `perl -pi -e's/a/b/' ${x}`,
  ];
}
// The CONTROLS lists of both design files.
const CONTROLS = [
  `echo \`cat ${X}\``, `echo \`git log -1 -- ${X}\``, `perl -0ne 'print' ${X}`, `perl -0777 -ne 'print' ${X}`, `perl -0777ne 'print' ${X}`, `perl -0e 'print 1' ${X}`, `perl -0ne 'print' ${X} '`,
  `env -C ${D} bash -c 'cat ${N}'`, `env -C ${D} python -c "print(open('${N}').read())"`, `env -C docs bash -c 'rm ${N}'`,
  `npm exec tsc`, `npm run build ${X}`, `pnpm exec eslint ${X}`, `yarn test ${X}`, `yarn install`,
  `python -c "open(file='${X}')"`, `python -c "open(file='${X}', mode='r')"`, `python -c "import os; os.listdir('${D}')"`,
  `powershell -Command "[IO.File]::Open('${X}','Open')"`, `powershell -Command "[IO.File]::OpenRead('${X}')"`,
  `python -c "open('${X}', encoding='utf8', mode='r')"`, `python -c "open('${X}', encoding='utf8', errors='replace')"`, `python -c "open('${X}', encoding='utf8')"`,
  `python -c "from pathlib import Path; Path('${X}').open(mode='r')"`, `python -c "from pathlib import Path; Path('${X}').open(encoding='utf8')"`, `python -c "from pathlib import Path; Path('${X}').open(encoding='utf8', errors='replace')"`,
  `python -c "open(\\"${X}\\", 'r')"`, `python -c "open(\\"${X}\\")"`, `python -c "print(\\"${X}\\")"`, `node -e "require(\\"fs\\").readFileSync(\\"${X}\\")"`,
  `powershell -Command "[IO.File]::ReadAllText(\\"${X}\\")"`, `git diff -- ${X}`,
  // Controls of the same rows beyond the two design lists.
  `perl -n0e 'print' ${X}`, `perl -0xFFne 'print' ${X} '`, `perl -00000000 -ne 'print' ${X}`,
  `echo \`perl -0ne 'print' ${X}\``, `echo \`perl -0xFFne 'print' ${X}\``, `echo \`perl -n0e 'print' ${X}\``, `env -i -C docs python -c "print(open('${N}').read())"`,
  `npm x tsc ${X}`, `npm dlx rimraf ${X}`, `bun exec rimraf ${X}`, `yarn x rimraf ${X}`, `python -c "open('${X}', buffering=-1, mode='r')"`,
  `powershell -Command "[IO.File]::Open('${X}',[IO.FileMode]::Open)"`,
];

test('[GOV-942-HOOK-SHELL-FORMS-DENY] A file changed by a command in backticks, perl -0 with -i in a cluster, a program run under env -C, a package-manager runner, open with file=, os.removedirs or a creating IO.File Open is counted as written', () => withRoot(root => {
  const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: [X] };
  const independence = new RegExp(`GOVERNANCE INDEPENDENCE: this session wrote ${X.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')};`);
  for (const command of [...formsP07(X, D, N), ...formsP10(X, D), ...formsExtra(X, D, N)]) {
    assert.ok(shellWriteTargets(root, command, root).includes(X), `X reported for: ${command}`);
    assert.match(governanceIndependenceErrors(root, contract, RECEIPT, transcript(command)).join('\n'), independence, `independence for: ${command}`);
  }
  for (const command of [...formsP07(P, 'scripts', 'check-example.mjs'), ...formsP10(P, 'scripts'), ...formsExtra(P, 'scripts', 'check-example.mjs')]) {
    assert.match(evaluateHook(root, executor(root, command), '').join('\n'), /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/,
      `executor refused: ${command}`);
  }
  for (const command of CONTROLS) {
    assert.ok(!shellWriteTargets(root, command, root).includes(X), `control reports no X: ${command}`);
    assert.deepEqual(governanceIndependenceErrors(root, contract, RECEIPT, transcript(command)), [], `control independence: ${command}`);
  }
  // R4 (f) (iv): a search text keeps the reading of the single-quoted spelling.
  const search = text => shellWriteTargets(root, `grep -n "${text}" docs/a.md`, root).includes(X);
  assert.equal(search(`open(\\"${X}\\", 'w')`), search(`open('${X}', 'w')`), 'the \\" spelling of a search text reads as the single-quoted one');
  // R4 (c): `env -C` moves only the program it runs, so a later `cd` still leads from the shell's own folder.
  const later = `env -C docs python -c "print(1)"; cd ${D}; python -c "open('${N}','w')"`;
  assert.ok(shellWriteTargets(root, later, root).includes(X), `the shell's folder stays for: ${later}`);
  // R4 (d): `yarn` stays the program before any other word, so `yarn install` keeps its package-file targets.
  assert.ok(shellWriteTargets(root, 'yarn install', root).includes('package.json'), 'yarn install keeps package.json');
  // A shell word that names an Object member is an ordinary word, and a long `-0` run has one reading.
  assert.deepEqual(shellWriteTargets(root, 'constructor exec x', root), []);
  const started = performance.now();
  assert.deepEqual(shellWriteTargets(root, `perl -${'0'.repeat(50000)}ne 'print' ${X} '`, root).filter(path => path === X), []);
  assert.ok(performance.now() - started < 5000, 'a long -0 run stays linear');
}));

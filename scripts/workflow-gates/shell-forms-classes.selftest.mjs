#!/usr/bin/env node
// Task 942 R6 to R10 (owner D13, D24): the write forms of the Task 942 completion report are closed by class, through one reader per
// kind of input: a call's arguments, the `env` options, a package manager's command line and the raw text. The lists hold AC8.
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
  const root = mkdtempSync(join(tmpdir(), 'lero-942-shell-classes-'));
  const put = file => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), 'a\n'); };
  for (const file of [X, P, Y]) put(file);
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
function transcript(command) {
  return [{ type: 'assistant', message: { content: [{ type: 'tool_use', id: 's0', name: 'Bash', input: { command } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'output' }] } }].map(line => JSON.stringify(line)).join('\n');
}
const executor = (root, command) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: root, tool_input: { command } });
// The forms(x, d, n) list of p11-class-forms-run.mjs: the 23 forms of the completion report, then the other spellings of their classes.
function formsP11(x, d, n) {
  return [
    `python -c "open(mode='w', file='${x}')"`, `python -c "import os; os.removedirs(name='${d}')"`,
    `powershell -Command "[IO.File]::Open('${x}', 2)"`, `powershell -Command "[IO.File]::Open('${x}', [IO.FileMode]'Create')"`, `powershell -Command "[IO.File]::Create(\`"${x}\`")"`,
    `/usr/bin/env -C ${d} bash -c 'rm ${n}'`, `env --unset HOME -C ${d} python -c "open('${n}','w')"`, `env -C ${d} bash -c "bash -c 'rm ${n}'"`,
    `npm exec --package foo -- touch ${x}`, `npm --prefix . exec rimraf ${x}`, `pnpm -C . exec rimraf ${x}`,
    `npm exec -c 'rimraf ${x}'`, `npm exec --call 'rm ${x}'`, `npx -c 'rm ${x}'`, `pnpm rimraf ${x}`, `bun rimraf ${x}`, `yarn run rimraf ${x}`, `npm run rimraf ${x}`,
    `env -iC ${d} bash -c 'rm ${n}'`, `python -c "import os; os.open('${x}', os.O_WRONLY)"`, `node -e "require('fs').openSync('${x}', require('fs').constants.O_WRONLY)"`,
    `python -c "open('${x}', **{'mode': 'w'})"`, `python -c "import os; os.chdir('${d}'); os.system(\\"rm ${n}\\")"`,
    `python -c "open(mode='a', encoding='utf8', file='${x}')"`, `python -c "from pathlib import Path; Path('${x}').open(**{'mode': 'a'})"`,
    `powershell -Command "[IO.File]::Open('${x}', 6)"`, `powershell -Command "[IO.File]::Open('${x}', 'Open', 'Write')"`, `powershell -Command "[IO.File]::Open('${x}', [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite)"`,
    `/usr/bin/env -C ${d} python -c "open('${n}','w')"`, `/usr/bin/sudo rm ${x}`, `env --unset=HOME -C ${d} bash -c 'rm ${n}'`, `env -iC${d} bash -c 'rm ${n}'`, `env -iC ${d} python -c "open('${n}','w')"`, `env -vi -C ${d} bash -c 'rm ${n}'`,
    `npm exec --package=foo -- touch ${x}`, `npx --package foo -- touch ${x}`, `pnpm --dir . dlx rimraf ${x}`, `yarn --cwd . exec rimraf ${x}`, `npm -w app exec rimraf ${x}`,
    `npm exec --call='rm ${x}'`, `pnpm exec -c 'rm ${x}'`, `pnpm run shx rm ${x}`, `bun run rimraf ${x}`, `yarn --cwd . rimraf ${x}`,
    `python -c "import os; os.open('${x}', os.O_CREAT | os.O_TRUNC)"`, `node -e "require('fs').openSync('${x}', 1)"`, `python -c "import os; os.chdir(\\"${d}\\"); os.system('rm ${n}')"`,
  ];
}
// Spellings of the same R6 to R9 rows beyond the design list. The first group holds what the replaced expressions reported: every
// target of the R4 hook stays reported, so a call the bound of R6 cuts, a repeated keyword and a mode that only starts with a quoted
// text still write.
function formsExtra(x, d, n) {
  const padding = ' '.repeat(5000);
  return [
    `python -c "open('${x}',${padding}'w')"`, `python -c "open('${x}',${padding}mode='w')"`, `python -c "from pathlib import Path; Path('${x}').open(${padding}'w')"`, `powershell -Command "[IO.File]::Open('${x}',${padding}'Create')"`,
    `python -c "open('${x}',${padding}'r')"`, `powershell -Command "[IO.File]::Open('${x}',${padding}'Open')"`,
    `python -c "open('${x}', mode='r', mode='w')"`, `python -c "open('${x}', mode='w', mode='r')"`, `python -c "open('${x}', 'w' if a else 'r')"`,
    // R6 (a): the arguments are split at top-level commas only, with quotes and brackets respected.
    `python -c "open('${x}', encoding='a,b', mode='w')"`, `python -c "open('${x}', encoding=')', mode='w')"`, `python -c "open('${x}', opener=f(1, 2), mode='w')"`, `python -c "open('${x}', opener=f[1, 2], mode='w')"`, `python -c "open('${x}', opener={1, 2}, mode='w')"`,
    // R6 (a): every position of the mode and every kind of value.
    `python -c "open(file='${x}', 'a')"`, `python -c "open('${x}', 'x')"`, `python -c "open('${x}', r'w')"`, `python -c "open(r'${x}', 'w')"`, `python -c "open(file='${x}', **{'mode': 'w'})"`, `python -c "open(**{'file': '${x}', 'mode': 'w'})"`,
    `python -c "import os; os.open('${x}', flags=os.O_RDWR)"`, `python -c "import os; os.open('${x}', **{'flags': os.O_APPEND})"`, `python -c "import os; os.open('${x}', **{'flags': 1})"`, `python -c "import os; os.open('${x}', flags=1)"`,
    `python -c "import os; os.open('${x}', os.O_RDONLY | os.O_CREAT)"`, `python -c "import os; os.open('${x}', os.O_TRUNC)"`, `python -c "import os; os.open('${x}', 0o1)"`, `python -c "import os; os.open('${x}', 0x41)"`, `node -e "fs.openSync('${x}', 'a+')"`,
    // R6: the spellings a case-insensitive prefix, a blank before a comma and a double quote take.
    `python -c "open(R'${x}', 'w')"`, `python -c "open('${x}', R'w')"`, `python -c "open(**{'file': '${x}' , 'mode': 'w'})"`, `python -c 'open("${x}", encoding=")", mode="w")'`,
    // R6 (b) and (c).
    `python -c "from pathlib import Path; Path('${x}').open('w')"`, `python -c "from pathlib import Path; Path('${x}').open('r+')"`,
    `powershell -Command "[IO.File]::Open('${x}', 'CreateNew')"`, `powershell -Command "[IO.File]::Open('${x}', 'Create')"`, `powershell -Command "[IO.File]::Open('${x}', 'Append')"`, `powershell -Command "[IO.File]::Open('${x}', 'Truncate')"`, `powershell -Command "[IO.File]::Open('${x}', 'OpenOrCreate')"`,
    `powershell -Command "[IO.File]::Open('${x}', 1)"`, `powershell -Command "[IO.File]::Open('${x}', 4)"`, `powershell -Command "[IO.File]::Open('${x}', 5)"`,
    `powershell -Command "[IO.File]::Open('${x}', [IO.FileMode]2)"`, `powershell -Command "[IO.File]::Open('${x}', '2')"`,
    `powershell -Command "[IO.File]::open('${x}', [IO.FileMode]::Create)"`, `powershell -Command "[IO.File]::Open('${x}', 3, 2)"`, `powershell -Command "[IO.File]::Open('${x}', 3, 3)"`, `powershell -Command "[IO.File]::Open('${x}', 'Open', [IO.FileAccess]2)"`,
    `powershell -Command "[IO.File]::Open('${x}', 'create')"`, `powershell -Command "[IO.File]::Open('${x}', 'Open', 'write')"`, `powershell -Command "[IO.File]::Open('${x}', 'Open', 'readwrite')"`,
    // R7, with each letter of a cluster, each value option at its end and the case of a name.
    `env -vC ${d} bash -c 'rm ${n}'`, `env -0vC${d} bash -c 'rm ${n}'`, `env -vC ${d} python -c "open('${n}','w')"`, `env -iS x -C ${d} bash -c 'rm ${n}'`, `env -vu HOME -C ${d} bash -c 'rm ${n}'`,
    `ENV -C ${d} bash -c 'rm ${n}'`, `SUDO rm ${x}`, `NPM exec rimraf ${x}`,
    `env.exe -C ${d} bash -c 'rm ${n}'`, `/usr/bin/env.exe -C ${d} python -c "open('${n}','w')"`, `env -0C ${d} bash -c 'rm ${n}'`, `env -0iC ${d} python -c "open('${n}','w')"`,
    `env --unset HOME -C ${d} bash -c 'rm ${n}'`, `env --split-string x -C ${d} bash -c 'rm ${n}'`, `env -iu HOME -C ${d} bash -c 'rm ${n}'`, `env -iu HOME -C ${d} python -c "open('${n}','w')"`, `env --split-string x -C ${d} python -c "open('${n}','w')"`, `env --chdir=${d} python -c "open('${n}','w')"`,
    `env -0u HOME -C ${d} python -c "open('${n}','w')"`, `env -vu HOME -C ${d} python -c "open('${n}','w')"`, `env -iS x -C ${d} python -c "open('${n}','w')"`, `/usr/bin/sudo -u admin rm ${x}`, `/usr/bin/timeout 5 rm ${x}`,
    `ionice -c 2 rm ${x}`, `ionice -n 1 rm ${x}`, `ionice -p 1 rm ${x}`, `timeout -k 5 5 rm ${x}`, `stdbuf -i L rm ${x}`, `stdbuf -o L rm ${x}`, `stdbuf -e L rm ${x}`, `doas -u a rm ${x}`, `doas -C a rm ${x}`,
    `npx -p foo rm ${x}`, `pnpx -p foo rm ${x}`, `bunx -p foo rm ${x}`, `xargs -0 rm ${x}`,
    // R8.
    `pnpm RIMRAF ${x}`, `npm RUN rimraf ${x}`, `npx --call='cat a' --call='rm ${x}'`, `npx --call=cat mv ${x} ${Y} '`, `npx --call= eval rm ${x}`,
    `npx --package foo rm ${x}`, `pnpx --package foo rm ${x}`, `bunx --package foo rm ${x}`, `bunx --package=foo rm ${x}`, `/usr/bin/npm exec rimraf ${x}`, `npm.exe exec rimraf ${x}`,
    `npm --workspace app x rimraf ${x}`, `pnpm --filter app exec rimraf ${x}`, `pnpm -F app dlx rimraf ${x}`, `yarn --dir . dlx rimraf ${x}`, `bun --cwd . x rimraf ${x}`, `npm --silent exec rimraf ${x}`,
    `yarn run shx rm ${x}`, `npm run shx rm ${x}`, `bun shx rm ${x}`, `pnpm --dir . rimraf ${x}`, `npx --call='rm ${x}'`, `npm x -c 'rm ${x}'`, `npm exec -c "bash -c 'rm ${x}'"`, `npm exec -c 'cd ${d}; rm ${n}'`,
    // R9: each folder word of the raw reading.
    `chdir ${d}; python -c "open('${n}','w')"`, `pushd ${d}; python -c "open('${n}','w')"`, `sl ${d}; python -c "open('${n}','w')"`, `push-location ${d}; python -c "open('${n}','w')"`,
    `Set-Location -Path ${d}; python -c "open('${n}','w')"`, `Set-Location -LiteralPath ${d}; python -c "open('${n}','w')"`, `cd /d ${d} & python -c "open('${n}','w')"`, `cd /D ${d} & python -c "open('${n}','w')"`,
    `node -e "process.chdir('${d}'); require('fs').rmSync('${n}')"`, `python -c "import os; os.rmdir('${d}')"`,
    `powershell -Command "[IO.File]::Delete(\`"${x}\`")"`, `powershell -Command "[IO.File]::Open(\`"${x}\`", 2)"`, `powershell -Command "Set-Location \`"${d}\`"; [IO.File]::Create('${n}')"`,
    `python -c "import subprocess; subprocess.run([\\"rm\\", \\"${x}\\"])"`, `env -C ${d} bash -c "bash -c 'bash -c \\"rm ${n}\\"'"`, `bash -c "rm '${x}'"`, `bash -c "rm '' '${x}'"`, `bash -c "bash -c \\"rm '${x}'\\""`,
  ];
}
// The CONTROLS list of p11-class-forms-run.mjs.
const CONTROLS = [
  `python -c "open(mode='r', file='${X}')"`, `python -c "open(file='${X}', encoding='utf8')"`, `python -c "import os; os.open('${X}', os.O_RDONLY)"`,
  `node -e "require('fs').openSync('${X}', 0)"`, `node -e "require('fs').openSync('${X}', require('fs').constants.O_RDONLY)"`, `python -c "open('${X}', **{'mode': 'r'})"`, `python -c "open('${X}', **{'encoding': 'w'})"`,
  `python -c "open('${X}', 'r', -1, 'w')"`, `python -c "from pathlib import Path; Path('${X}').open(**{'mode': 'r'})"`,
  `powershell -Command "[IO.File]::Open('${X}', 3)"`, `powershell -Command "[IO.File]::Open('${X}', [IO.FileMode]'Open')"`, `powershell -Command "[IO.File]::Open('${X}', 'Open', 'Read')"`, `powershell -Command "[IO.File]::ReadAllText(\`"${X}\`")"`,
  `/usr/bin/env -C docs bash -c 'rm ${N}'`, `/usr/bin/env cat ${X}`, `env -iC docs bash -c 'rm ${N}'`, `env --unset HOME -C docs python -c "open('${N}','w')"`, `env -C ${D} bash -c "bash -c 'cat ${N}'"`,
  `npm --prefix . run build ${X}`, `npm --prefix . exec tsc ${X}`, `npm exec --package foo -- tsc ${X}`, `npm exec -c 'cat ${X}'`, `npx -c 'cat ${X}'`, `npm run test ${X}`, `yarn run test ${X}`, `pnpm test ${X}`, `bun test ${X}`,
  `pnpm -C . install`, `python -c "import os; os.chdir(\\"${D}\\"); os.system(\\"cat ${N}\\")"`, `node -e "window.open('${X}')"`,
  // Controls of the same rows beyond the design list: the permission of `os.open` and of a Node open is no mode, the module of a
  // constant is no quoted mode, the sharing argument of `]::Open(` is no access, and `npm` never runs a tool directly.
  `python -c "import os; os.open('${X}', os.O_RDONLY, mode=511)"`, `python -c "import os; os.open('${X}', os.O_RDONLY, 438)"`, `node -e "require('fs').openSync('${X}', 0, 0o666)"`, `node -e "require('fs').openSync('${X}', 'r', 438)"`,
  `node -e "require('graceful-fs').openSync('${X}', require('graceful-fs').constants.O_RDONLY)"`, `python -c "open('${X}', 'r' if a else 'r')"`, `python -c "open('${X}', m)"`, `python -c "print(open('${X}').read())"`,
  `python -c "open('${X}', opener=dict(a=1, mode='w'))"`, `python -c "open('${X}', encoding='r,w')"`, `python -c "open('${X}', 'r', encoding='w')"`, `python -c "open('${X}', -1)"`,
  `nohup -c 'rm ${X}'`, `npx 'rm ${X}'`, `python -c "open('${X}' + y, 'w')"`, `python -c "open('${X}', 'r', os.O_CREAT)"`, `grep -n "open('${X}'," docs/a.md`, `npm run rm ${X}`, `yarn run cp ${Y} ${X}`,
  `powershell -Command "[IO.File]::Open('${X}', [IO.FileMode]3)"`, `powershell -Command "[IO.File]::Open('${X}', '3')"`, `powershell -Command "[IO.File]::Open('${X}', 3, 1)"`, `powershell -Command "[IO.File]::Open('${X}', 'Open', 'Read', 'ReadWrite')"`,
  `/usr/bin/env -iC docs python -c "open('${N}','w')"`, `/usr/bin/sudo cat ${X}`, `env.exe cat ${X}`,
  `npm rimraf ${X}`, `npm --prefix . rimraf ${X}`, `npm run lint rimraf ${X}`, `pnpm lint rimraf ${X}`, `yarn --cwd . test ${X}`, `bun --cwd . test ${X}`, `npm exec -- cat ${X}`, `npm x -c 'cat ${X}'`, `npm exec --call='cat ${X}'`,
  `powershell -Command "Set-Location \`"docs\`"; [IO.File]::Create('${N}')"`,
];
// The `hostile` commands of the p11 file, then a run of words that read as an `env` word and as an option of it.
const HOSTILE = {
  'open calls': 'open('.repeat(10000), 'open commas': `open('x'${','.repeat(50000)}`, 'open brackets': `open(${'('.repeat(50000)}`, 'unclosed quote': `open('${'x'.repeat(50000)}`,
  'path open': 'Path(\'x\').open('.repeat(3400), 'net open': ']::Open('.repeat(7000), 'manager options': `npm ${'-a '.repeat(16000)}x`, 'env cluster': `env -${'i'.repeat(50000)} x '`,
  'env options': `/bin/env ${'-a '.repeat(16000)}x '`, 'env path': `${'/a'.repeat(25000)}/env -C d '`, 'nested': `bash -c "${"'a' ".repeat(12000)}" '`, 'escaped': `python -c "${'\\"'.repeat(25000)}"`,
  'backtick quotes': `x "${'`"'.repeat(25000)}"`, 'env words': `${'-/env '.repeat(16000)}'`,
};

test('[GOV-942-HOOK-SHELL-CLASSES-DENY] A file changed through a call read by its arguments, an env option cluster, a package manager\'s own options, a runner\'s command text or an escaped quote is counted as written', () => withRoot(root => {
  const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: [X] };
  const independence = new RegExp(`GOVERNANCE INDEPENDENCE: this session wrote ${X.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')};`);
  for (const command of [...formsP11(X, D, N), ...formsExtra(X, D, N)]) {
    assert.ok(shellWriteTargets(root, command, root).includes(X), `X reported for: ${command}`);
    assert.match(governanceIndependenceErrors(root, contract, RECEIPT, transcript(command)).join('\n'), independence, `independence for: ${command}`);
  }
  for (const command of [...formsP11(P, 'scripts', 'check-example.mjs'), ...formsExtra(P, 'scripts', 'check-example.mjs')]) {
    assert.match(evaluateHook(root, executor(root, command), '').join('\n'), /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/, `executor refused: ${command}`);
  }
  for (const command of CONTROLS) {
    assert.ok(!shellWriteTargets(root, command, root).includes(X), `control reports no X: ${command}`);
    assert.deepEqual(governanceIndependenceErrors(root, contract, RECEIPT, transcript(command)), [], `control independence: ${command}`);
  }
  // AC8: a shell word that names an Object member is an ordinary word for the reader of a package manager.
  assert.deepEqual(shellWriteTargets(root, 'constructor exec x', root), []);
  // Section 5: the value of `--package` is no program.
  const packaged = shellWriteTargets(root, 'npx --package rm x y', root);
  assert.ok(!packaged.includes('x') && !packaged.includes('y'), `the value of --package is no program: ${packaged}`);
  // R9: a nested command text keeps a quoted word whole and literal, keeps its brackets and keeps a quote that never closes, as the
  // reading it replaces did.
  assert.ok(shellWriteTargets(root, `bash -c "rm 'docs/a b.mjs'"`, root).includes('docs/a b.mjs'), 'a quoted word stays whole');
  assert.ok(!shellWriteTargets(root, `bash -c "rm 'docs/*.mjs'"`, root).includes(Y), 'a quoted glob of a nested text expands to nothing');
  assert.ok(shellWriteTargets(root, `bash -c "rm docs/*.mjs"; echo $x`, root).includes(Y), 'an unquoted glob of a nested text still expands');
  assert.ok(!shellWriteTargets(root, `bash -c "rm 'docs/*.mjs'"; echo 'docs/*.mjs'`, root).includes(Y), 'a word quoted at each occurrence stays literal');
  assert.ok(shellWriteTargets(root, `bash -c "echo 'docs/*.mjs'"; rm docs/*.mjs; echo $x`, root).includes(Y), 'an unquoted occurrence keeps the expansion');
  assert.ok(shellWriteTargets(root, `echo 'docs/*.mjs'; rm docs/*.mjs; echo $x`, root).includes(Y), 'an unquoted occurrence after a quoted one keeps the expansion');
  assert.ok(shellWriteTargets(root, `bash -c "rm docs/(a)/x.txt"; echo $x`, root).includes('docs/(a)/x.txt'), 'a bracket stays in a nested word');
  assert.ok(shellWriteTargets(root, `bash -c "rm docs/it's.mjs"; echo $x`, root).includes(`docs/it's.mjs`), 'a quote that never closes stays in its word');
  // R9: the second reading adds to the first; a folder word in plain quotes still moves the folder of the raw reading.
  assert.ok(shellWriteTargets(root, `python -c "import os; os.chdir('${D}'); open('${N}','w')"`, root).includes(X), 'the plain reading stays');
  assert.ok(shellWriteTargets(root, `python -c "system('rm ${X}\\", \\"x')"`, root).some(path => path.startsWith(`${X}/`) || path.startsWith(`${X}\\`)), 'the command text as written stays a reading');
  assert.ok(shellWriteTargets(root, `bash -c "rm '' 'docs/q.txt'"`, root).includes('docs/q.txt'), 'an empty quote is a closed quote');
  assert.ok(shellWriteTargets(root, `npx --call=cat mv docs/p.txt docs/q.txt '`, root).includes('docs/q.txt'), 'a program after --call= stays a reading');
  assert.ok(!shellWriteTargets(root, `sudo -C docs bash -c 'rm ${N}'`, root).includes(Y), 'the -C of another wrapper moves no folder');
  // R7: the value of an `env` option is taken whole, so `-C` after `-u` is a name, not a folder change.
  for (const option of ['-u', '-S', '-iu', '-0u', '-vu', '-iS', '--unset', '--split-string']) {
    assert.ok(!shellWriteTargets(root, `env ${option} -C docs python -c "open('${N}','w')"`, root).includes(Y), `the value of ${option} moves no folder`);
  }
  // R7: an option word is no `env` word, so its `-C` moves no folder.
  assert.ok(!shellWriteTargets(root, `-/env -C docs python -c "open('${N}','w')"`, root).includes(Y), 'an option word is no env word');
  // R7 and R8: a command line that ends where an option wants a word is read, never an exception that blocks the hook.
  for (const words of ['npm', 'npm --prefix', 'yarn -x', 'pnpm -C', 'npx -c', 'npx --call', 'npm exec -c', 'env -C', 'env -iC', '/usr/bin/env']) {
    assert.doesNotThrow(() => shellWriteTargets(root, words, root), `read without an exception: ${words}`);
    assert.doesNotThrow(() => shellWriteTargets(root, `${words} '`, root), `read without an exception: ${words} '`);
  }
  // R10, AC9: each hostile command stays far inside the hook timeout; none may hang the hook.
  for (const [name, command] of Object.entries(HOSTILE)) {
    const started = performance.now();
    shellWriteTargets(root, command, root);
    const elapsed = Math.round(performance.now() - started);
    assert.ok(elapsed < 5000, `hostile ${name} took ${elapsed} ms`);
  }
}));

// Task 942 approver probes (read-only): the final hook against the hook of C60 (a copy in gitignored test-results with absolute imports).
// Usage from the project root: node docs/sessions/evidence/task942/review/r1-probes.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = process.cwd();
const real = file => pathToFileURL(join(root, 'scripts/workflow-gates', file)).href;
const c60Text = execFileSync('git', ['show', 'c00337ef5:scripts/workflow-gates/security-hook.mjs'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
const work = join(root, 'test-results/task942-approver');
mkdirSync(work, { recursive: true });
const c60Path = join(work, 'hook-c60.mjs');
writeFileSync(c60Path, c60Text.replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
  .replace("new URL('./hook-load-check.mjs', import.meta.url)", `new URL('${real('hook-load-check.mjs')}')`));
const c60 = await import(pathToFileURL(c60Path).href);
const final = await import(real('security-hook.mjs'));

const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', Y = `docs/${N}`;
const fx = mkdtempSync(join(tmpdir(), 'lero-942-approver-'));
for (const file of [X, Y, 'scripts/check-example.mjs']) { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), 'a\n'); }
const has = (hook, command) => { try { return hook.shellWriteTargets(fx, command, fx).includes(X); } catch (e) { return `THROW ${e.message.slice(0, 60)}`; } };
const blanks = ' '.repeat(5000);

const groups = {
  'A. section 5 superset: bound of the reader, before the path or the mode': [
    `python -c "open(${blanks}'${X}', 'w')"`,
    `python -c "open(${blanks}file='${X}', mode='w')"`,
    `node -e "fs.openSync(${blanks}'${X}', 'w')"`,
    `powershell -Command "[IO.File]::Open(${blanks}'${X}', 'Create')"`,
    `python -c "open('${X}'${blanks}, 'w')"`,
    `python -c "from pathlib import Path; Path('${X}').open(${blanks}mode='w')"`,
    `python -c "open(file='${X}', ${'a'.repeat(5000)}='1', mode='w')"`,
    `python -c "open('${X}', encoding='${'a'.repeat(5000)}', mode='w')"`,
    `python -c "open('${X}', 'w', encoding='${'a'.repeat(5000)}')"`,
  ],
  'B. section 5 superset: quote and bracket reading of the reader': [
    `python -c "open('${X}', 'w', encoding=don't)"`,
    `python -c "open('${X}', encoding=a), mode='w')"`,
    `python -c "open('${X}'), open('${X}', 'w')"`,
    `python -c 'open("${X}", "w", encoding="it'"'"'s")'`,
    `python -c "print(')'); open('${X}', 'w')"`,
    `python -c "x = open; open  ('${X}'  ,  'w'  )"`,
    `python -c "open('${X}', '''w''')"`,
    `python -c "open('${X}', \\"w\\")"`,
    `python -c "open(\\"${X}\\", 'w')"`,
    `python -c "open(\\"${X}\\", mode=\\"w\\")"`,
    `node -e "fs.openSync(\\"${X}\\", \\"w\\")"`,
    `python -c "open('${X}', mode='w',)"`,
    `python -c "open('${X}','w')" > docs/out.txt`,
    `python -c "open(f'${X}', 'w')"`,
    `python -c "open(rb'${X}', 'w')"`,
    `python -c "open('${X}', 'w' )"`,
    `python -c "open(file = '${X}' , mode = 'w')"`,
    `python -c "open('${X}', buffering=1, mode='w')"`,
    `python -c "open('${X}', opener=lambda p, f: 1, mode='w')"`,
    `python -c "open('${X}', opener=lambda p, f: os.open(p, f), mode='w')"`,
  ],
  'C. managers: options with a value not in the list, and after the subcommand': [
    `npm --loglevel silent exec rimraf ${X}`, `npm --cache /tmp exec rimraf ${X}`, `pnpm --reporter silent exec rimraf ${X}`, `yarn --modules-folder x exec rimraf ${X}`,
    `npm exec --yes -- rimraf ${X}`, `npm exec -y rimraf ${X}`, `npx -y rimraf ${X}`, `npx --yes rimraf ${X}`, `npx --no-install rimraf ${X}`, `npx -- rimraf ${X}`,
    `npx -y --package foo -- rm ${X}`, `npx -p foo -p bar rm ${X}`, `npx --package=foo --package=bar rm ${X}`, `pnpm dlx --package foo rimraf ${X}`, `pnpm --package=foo dlx rimraf ${X}`,
    `bun x --bun rimraf ${X}`, `bunx --bun rimraf ${X}`, `yarn dlx -p foo rimraf ${X}`, `yarn dlx --package foo rimraf ${X}`,
    `npm exec -w app -- rimraf ${X}`, `npm.cmd exec rimraf ${X}`, `npx.cmd rimraf ${X}`, `pnpm.cmd rimraf ${X}`, `rimraf.cmd ${X}`, `node_modules/.bin/rimraf ${X}`, `rm.exe ${X}`, `RM.EXE ${X}`,
    `npm run --silent rimraf ${X}`, `pnpm run --silent rimraf ${X}`, `npm --silent run rimraf ${X}`, `pnpm exec -- rimraf ${X}`, `pnpm -r exec rimraf ${X}`, `pnpm --recursive exec rimraf ${X}`,
    `corepack pnpm exec rimraf ${X}`, `corepack npx rimraf ${X}`, `corepack yarn rimraf ${X}`, `npm exec --no -- rimraf ${X}`,
  ],
  'D. interpreters given by path, by version or with an option before the text': [
    `/usr/bin/python3 -c "open('${X}','w')"`, `python.exe -c "open('${X}','w')"`, `python3.12 -c "open('${X}','w')"`, `py -3 -c "open('${X}','w')"`,
    `/usr/bin/python3 -c "import os; os.chdir('${D}'); os.remove('${N}')"`, `python.exe -c "import os; os.chdir('${D}'); os.remove('${N}')"`, `python3.12 -c "import os; os.chdir('${D}'); os.remove('${N}')"`,
    `python -u -c "import os; os.chdir('${D}'); os.remove('${N}')"`, `python -I -c "import os; os.chdir('${D}'); os.remove('${N}')"`, `node.exe -e "process.chdir('${D}'); require('fs').rmSync('${N}')"`, `node --no-warnings -e "process.chdir('${D}'); require('fs').rmSync('${N}')"`, `node -p "process.chdir('${D}'); require('fs').rmSync('${N}')"`,
    `/usr/bin/python3 -c "import os; os.system('rm ${X}')"`, `python.exe -c "import os; os.system('rm ${X}')"`, `python -u -c "import os; os.system('rm ${X}')"`, `node.exe -e "require('child_process').execSync('rm ${X}')"`, `node --no-warnings -e "require('child_process').execSync('rm ${X}')"`,
    `/bin/bash -c "cd ${D}; rm ${N}"`, `bash.exe -c "cd ${D}; rm ${N}"`, `bash -x -c "cd ${D}; rm ${N}"`, `/bin/bash -c "python -c \\"open('${X}','w')\\""`,
    `pwsh.exe -NoProfile -Command "Remove-Item ${X}"`, `powershell -NoProfile -Command "[IO.File]::Delete('${X}')"`, `powershell -NoProfile -Command "Set-Location ${D}; [IO.File]::Delete('${N}')"`,
  ],
  'E. env, sudo and other wrappers': [
    `env -u -C ${D} rm ${N}`, `env -i rm ${X}`, `env -i FOO=1 rm ${X}`, `env FOO=1 -C ${D} rm ${N}`, `env --ignore-environment rm ${X}`, `env --null -C ${D} rm ${N}`, `env --debug -C ${D} bash -c 'rm ${N}'`,
    `env -C ${D} -- rm ${N}`, `env -C ${D} FOO=1 rm ${N}`, `env -C ${D} env -C . rm ${N}`, `env -C scripts env -C workflow-gates rm ${N}`, `env -C scripts env -C workflow-gates bash -c 'rm ${N}'`, `env -S 'rm ${X}'`,
    `/usr/bin/env.exe -iC ${D} rm ${N}`, `C:\\Git\\usr\\bin\\env.exe -C ${D} bash -c 'rm ${N}'`, `sudo env -C ${D} rm ${N}`, `sudo -u a env -C ${D} python -c "open('${N}','w')"`, `nohup env -C ${D} rm ${N}`, `timeout 5 env -C ${D} rm ${N}`,
    `env -C ${D} npx rimraf ${N}`, `env -C ${D} npm exec rimraf ${N}`, `env -C ${D} npx -c 'rm ${N}'`, `env -C ${D} npm exec --call='rm ${N}'`, `npx -c 'env -C ${D} rm ${N}'`, `npx -c 'cd ${D} && rm ${N}'`, `npm exec -c 'bash -c "cd ${D}; rm ${N}"'`,
    `"env" -C ${D} rm ${N}`, `'env' -C ${D} bash -c 'rm ${N}'`, `e"n"v -C ${D} rm ${N}`, `\\env -C ${D} rm ${N}`, `command env -C ${D} rm ${N}`, `exec env -C ${D} rm ${N}`,
  ],
  'F. shells and text after the flag': [
    `bash -c "rm '${X}'" ; true`, `bash -c 'rm "${X}"'`, `bash -c "rm \\"${X}\\""`, `sh -c "rm \\"${X}\\"" x y`, `bash -lc "rm ${X}"`, `cmd /c "del ${X.replaceAll('/', '\\\\')}"`, `cmd.exe /d /c "del ${X.replaceAll('/', '\\\\')}"`,
    `eval "rm ${X}"`, `eval 'rm ${X}'`, `iex "rm ${X}"`, `powershell -Command "Remove-Item '${X}'"`, `powershell -Command "Remove-Item \`"${X}\`""`, `powershell -c "rm '${X}'"`,
    `npx -c "rm \\"${X}\\""`, `npx -c 'rm "${X}"'`, `npx --call="rm ${X}"`, `npx --call "rm ${X}"`, `npx --call 'rm "${X}"'`, `npm exec --call="bash -c 'rm ${X}'"`, `pnpm dlx -c 'rm ${X}'`, `yarn dlx -c 'rm ${X}'`, `bunx -c 'rm ${X}'`, `bun x -c 'rm ${X}'`, `pnpx -c 'rm ${X}'`,
    `npx -c 'rm ${X}'; echo $y`, `echo $y; npx -c 'rm ${X}'`, `npx --call='rm ${X}'; echo $y`, `npm exec -c 'cd ${D}; rm ${N}'; echo $y`, `env -C ${D} npx -c 'rm ${N}'; echo $y`,
    `npx -c 'python -c "open(\\"${X}\\",\\"w\\")"'`, `npx -c "python -c 'open(\\"${X}\\", \\"w\\")'"`,
  ],
};

for (const [name, list] of Object.entries(groups)) {
  console.log(`\n## ${name}`);
  for (const command of list) {
    const a = has(c60, command), b = has(final, command);
    const shown = command.replace(/ {100,}/g, '<blanks>').replace(/a{100,}/g, '<aaaa>');
    const tag = a === true && b !== true ? 'REGRESSION' : b === true ? (a === true ? 'both' : 'new  ') : (String(b).startsWith('THROW') ? 'THROW' : 'miss ');
    console.log(`${tag} | c60 ${a} | final ${b} | ${shown}`);
  }
}

// Controls the reader must keep silent: false reports stop an honest approver or executor.
console.log('\n## G. silent controls (expect no X; "FALSE+" means a read now counts as a write)');
for (const command of [
  `python -c "print(open('${X}').read())"`, `python -c "open('${X}', 'rb')"`, `python -c "open('${X}', encoding='utf8', errors='replace')"`, `python -c "open('${X}', newline='')"`, `python -c "open('${X}', 'r', buffering=1)"`,
  `node -e "fs.openSync('${X}', 'r')"`, `node -e "fs.openSync('${X}', 'r+')"`, `python -c "open('${X}', closefd=True)"`, `python -c "open('${X}', 1)"`, `python -c "open('${X}', buffering=1)"`,
  `npm run build -- ${X}`, `npm test -- ${X}`, `npx tsc ${X}`, `npx vitest run ${X}`, `npx eslint ${X}`, `npx prettier --check ${X}`, `pnpm exec tsc ${X}`,
  `env FOO=1 cat ${X}`, `/usr/bin/env node ${X}`, `sudo cat ${X}`, `./time ${X}`, `./env ${X}`, `tools/npm ${X}`, `node scripts/env.mjs ${X}`, `scripts/exec ${X}`,
  `node -e "const x = open('${X}', 'r')"`, `node -e "console.log('open(\\"${X}\\", \\"w\\")')"`, `echo "open('${X}', 'w')"`, `grep "open('${X}', 'w')" docs/a.md`,
  `git log --grep "rm ${X}"`, `git commit -m "open('${X}', 'w') is reported"`, `node scripts/workflow-gates/cli.mjs verify --contract ${X}`, `node ${X} --call='rm x'`,
  `powershell -Command "[IO.File]::OpenRead('${X}')"`, `powershell -Command "[IO.File]::Open('${X}', 'Open', 'Read', 'Write')"`, `powershell -Command "[IO.File]::Open('${X}', 'Open', 'Read', 'ReadWrite')"`, `powershell -Command "[IO.File]::Open('${X}', [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Write)"`,
]) {
  const a = has(c60, command), b = has(final, command);
  console.log(`${b === true ? (a === true ? 'old+ ' : 'FALSE+') : 'ok   '} | c60 ${a} | final ${b} | ${command}`);
}

// Timing: the reader runs once per folder of a nested text, so its cost multiplies by the folders.
console.log('\n## H. hostile timing (hook budget 15 s; AC9 names 3 s for the p11 commands)');
const budget = (name, command) => {
  for (const [label, hook] of [['c60', c60], ['final', final]]) {
    const t0 = performance.now();
    let note = '';
    try { hook.shellWriteTargets(fx, command, fx); } catch (e) { note = ` THROW ${e.message.slice(0, 50)}`; }
    console.log(`${name} | ${label} | ${command.length} chars | ${Math.round(performance.now() - t0)} ms${note}`);
  }
};
const folders = n => Array.from({ length: n }, (_, i) => `cd d${i}`).join('; ');
budget('20 folders + system(open calls)', `${folders(20)}; python -c "system('${'open('.repeat(1000)}')"`);
budget('50 folders + system(open calls)', `${folders(50)}; python -c "system('${'open('.repeat(1000)}')"`);
budget('100 folders + system(open calls)', `${folders(100)}; python -c "system('${'open('.repeat(1000)}')"`);
budget('open calls + quote', `python -c "${'open('.repeat(10000)}"`);
budget('escaped open calls', `python -c "${'open(\\"'.repeat(7000)}"`);
budget('both readings of Path open', `python -c "${"Path('x').open(".repeat(3000)}\\""`);
budget('net open with escaped quote', `powershell -Command "${"]::Open(".repeat(7000)}\\""`);
budget('env -C nested x3', `env -C a bash -c "env -C b bash -c 'env -C c bash -c ${'open('.repeat(5000)}'"`);
rmSync(fx, { recursive: true, force: true });

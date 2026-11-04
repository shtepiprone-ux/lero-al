// Task 944 review 3 (approver, read-only for the project): write forms chosen by this review, outside the AC12 list, on a temporary
// fixture root, against the final hook and the base hook d17d9d5a8 (saved to the gitignored test-results/944-r3/ with absolute
// imports). Usage (project root): node docs/sessions/evidence/task944/review/r3-adversarial.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const OUT = resolve(ROOT, 'test-results/944-r3');
mkdirSync(OUT, { recursive: true });
const gates = pathToFileURL(resolve(ROOT, 'scripts/workflow-gates')).href;
const baseText = execFileSync('git', ['show', 'd17d9d5a8:scripts/workflow-gates/security-hook.mjs'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 })
  .replace(/from '\.\/([^']+)'/g, (all, name) => `from '${gates}/${name}'`);
const basePath = resolve(OUT, 'base-hook.mjs');
writeFileSync(basePath, baseText);
const final = await import(pathToFileURL(resolve(ROOT, 'scripts/workflow-gates/security-hook.mjs')).href);
const base = await import(pathToFileURL(basePath).href);

const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', Y = `docs/${N}`;
const root = mkdtempSync(join(tmpdir(), 'lero-r3-adv-'));
for (const file of [X, Y, `docs/src/${N}`]) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), 'a\n'); }

const groups = {
  'perl in place': [`perl -0pi -e 's/a/b/' ${X}`, `perl -0777 -pi -e 's/a/b/' ${X}`, `perl -0777pi -e 's/a/b/' ${X}`, `perl -pi.bak -e 's/a/b/' ${X}`, `perl -lpi -e 's/a/b/' ${X}`, `perl -w -pi -e 's/a/b/' ${X}`, `perl -pe 's/a/b/' -i ${X}`, `perl -i -pe 's/a/b/' ${X}`, `perl -0pi -e 's/a/b/' ${X} '`],
  'compound commands': [`{ rm ${X}; }`, `( rm ${X} )`, `case a in a) rm ${X};; esac`, `f() { rm ${X}; }; f`, `function f { rm ${X}; }; f`, `if ! rm ${X}; then :; fi`, `while rm ${X}; do :; done`, `true && rm ${X}`, `false || rm ${X}`, `rm ${X} &`, `echo $(rm ${X})`, `echo \`rm ${X}\``, `for f in a; do if true; then rm ${X}; fi; done`, `if true; then bash -lc 'rm ${X}'; fi`, `if true; then { rm ${X}; }; fi`, `if true; then rm ${X}; fi; echo '`, `if true; then cd ${D}; rm ${N}; fi; echo '`, `for f in a; do (rm ${X}); done`],
  'nested shells': [`bash -lec 'rm ${X}'`, `bash --login -c 'rm ${X}'`, `bash -l -c 'rm ${X}'`, `sh -c "cd ${D}; rm ${N}"`, `bash -lc 'cd ${D}; rm ${N}'`, `zsh -c 'rm ${X}'`, `dash -c 'rm ${X}'`, `bash -lc "python -c \\"open('${X}','w')\\""`, `bash -lc 'echo a > ${X}'`, `bash -lc 'cd ${D} && echo a > ${N}'`],
  'env and wrappers': [`env FOO=1 rm ${X}`, `env -i rm ${X}`, `env -C ${D} -- rm ${N}`, `env -C ${D} bash -c 'rm ${N}'`, `env --chdir=${D} bash -lc 'rm ${N}'`, `env -C ${D} python -c "open('${N}','w')"`, `env -C ${D} node -e "require('fs').rmSync('${N}')"`, `env -C${D} rm ${N}`, `npx --yes rimraf ${X}`, `npx shx mv ${Y} ${X}`, `npx shx sed -i s/a/b/ ${X}`, `shx rm ${X}`, `node_modules/.bin/rimraf ${X}`, `env -C ${D} tee ${N}`, `env -C ${D} cat a > ${N}`],
  'python and node APIs': [`python -c "open('${X}','wb')"`, `python -c "open('${X}', 'w+')"`, `python -c "open(file='${X}', mode='w')"`, `python -c 'open("${X}","w")'`, `node -e "fs.openSync('${X}','a')"`, `node -e "fs.open('${X}','w',()=>0)"`, `python -c "from pathlib import Path; Path('${X}').write_text('a')"`, `python -c "from pathlib import Path; Path('${X}').open('w')"`, `python -c "from pathlib import Path; Path('${X}').unlink(missing_ok=True)"`, `python -c "from pathlib import Path; Path('${X}').replace('${Y}')"`, `python -c "import os; os.truncate('${X}', 0)"`, `python -c "import os; os.rmdir('${D}')"`, `python -c "import os; os.removedirs('${D}')"`],
  'promises': [`node -e "require('fs').promises.writeFile('${X}','a')"`, `node -e "require('fs').promises.appendFile('${X}','a')"`, `node -e "require('fs').promises.copyFile('${Y}','${X}')"`, `node -e "require('fs').promises.open('${X}','w')"`, `node -e "require('fs').promises.rmdir('${D}')"`, `node -e "(await import('node:fs/promises')).rm('${X}')"`, `node -e "require('fs/promises').rm('${X}')"`, `node -e "require('fs/promises').unlink('${X}')"`, `node -e "require('node:fs/promises').rename('${Y}','${X}')"`, `node -e "const fsp=require('fs/promises'); fsp.rm('${X}')"`],
  '.NET': [`powershell -Command "[IO.File]::Open('${X}','Create')"`, `powershell -Command "[IO.File]::CreateText('${X}')"`, `powershell -Command "[IO.File]::AppendText('${X}')"`, `powershell -Command "[IO.File]::WriteAllText('${X}','a')"`, `powershell -Command "[IO.File]::Delete('${X}')"`, `powershell -Command "[System.IO.Directory]::Delete('${D}', $true)"`],
  'Windows and npm tools': [`xcopy /Y ${Y} ${X}`, `xcopy docs\\src ${D} /E`, `xcopy docs/src ${D}/ /S /Y`, `robocopy docs/src ${D} ${N} /MOV`, `robocopy ${D} docs/out /MOVE`, `robocopy ${D} docs/out /MOV`, `robocopy docs/src ${D} *.mjs`, `robocopy docs/src ${D} /PURGE`, `npm exec rimraf ${X}`, `pnpm exec rimraf ${X}`, `yarn rimraf ${X}`, `pnpm dlx rimraf ${X}`, `bunx rimraf ${X}`],
};
const controls = [`if [ -f ${X} ]; then cat ${X}; fi`, `perl -0ne 'print' ${X}`, `perl -0777 -ne 'print' ${X}`, `perl -lne 'print' ${X}`, `bash -lc 'grep -n a ${X}'`, `env -C ${D} cat ${N}`, `env -C ${D} bash -c 'cat ${N}'`, `node -e "require('fs').promises.access('${X}')"`, `python -c "open('${X}', 'rb')"`, `git diff --stat -- ${X}`, `node --test ${D}/x.selftest.mjs`, `robocopy ${D} docs/out ${N} /L`];
const has = (hook, command) => { try { return hook.shellWriteTargets(root, command, root).includes(X); } catch (error) { return `THROW ${error.message}`; } };
let total = 0, added = 0, misses = 0;
for (const [group, forms] of Object.entries(groups)) {
  console.log(`## ${group}`);
  for (const command of forms) {
    const now = has(final, command), then = has(base, command);
    total++; if (now === true && then !== true) added++; if (now !== true) misses++;
    console.log(`${now === true ? 'REPORTED' : 'MISSED  '} (base ${then === true ? 'reported' : 'missed'}) ${command}`);
  }
}
console.log('## read controls (X must not be reported)');
for (const command of controls) console.log(`${has(final, command) === true ? 'FALSE-POSITIVE' : 'quiet'} (base ${has(base, command) === true ? 'reported' : 'quiet'}) ${command}`);
console.log(`${total} forms; ${added} added by 944; ${misses} missed by the final hook`);
rmSync(root, { recursive: true, force: true });

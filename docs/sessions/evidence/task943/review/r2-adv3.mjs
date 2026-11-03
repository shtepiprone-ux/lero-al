// Review 2 adversarial probe, part 3: API directory deletes, Windows and npm copy/delete tools, perl -i, .NET create.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const hook = await import(pathToFileURL(process.argv[2]).href);
const root = mkdtempSync(join(tmpdir(), 'r2-adv3-'));
const put = (p, t = 'a\n') => { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), t); };
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs';
put(X); put(`docs/${N}`); put('docs/src/fixture-scope.mjs');
const writes = [
  `python -c "import shutil; shutil.rmtree('${D}')"`, `node -e "require('fs').rmSync('${D}', { recursive: true })"`,
  `node -e "require('fs').rmdirSync('${D}', { recursive: true })"`, `powershell -Command "[IO.Directory]::Delete('${D}', $true)"`,
  `xcopy docs\\${N} ${D.replaceAll('/', '\\')}\\ /Y`, `xcopy docs/${N} ${X}`, `robocopy docs ${D} ${N}`, `robocopy docs/src ${D} /MIR`,
  `npx rimraf ${X}`, `rimraf ${D}`, `npx shx rm ${X}`, `npx shx cp docs/${N} ${X}`, `perl -pi -e 's/a/b/' ${X}`, `perl -i.bak -pe 's/a/b/' ${X}`,
  `powershell -Command "[IO.File]::Create('${X}')"`, `powershell -Command "[System.IO.File]::OpenWrite('${X}')"`,
  `node -p "require('fs').writeFileSync('${X}','x')"`, `python -c "import os; os.rename('docs/${N}', '${X}')"`,
  `python -c "from pathlib import Path; Path('${X}').unlink()"`, `python -c "import pathlib; pathlib.Path('docs/${N}').rename('${X}')"`,
];
for (const c of writes) console.log(`${hook.shellWriteTargets(root, c).includes(X) ? 'REPORTED' : 'MISSED  '} :: ${c}`);
for (const c of [`if true; then rm ${X}; fi`, `python -c "open('${X}','w')"`, `bash -lc 'rm ${X}'`]) console.log(`readOnly ${hook.isReadOnlyShellCommand(c)} :: ${c}`);
rmSync(root, { recursive: true, force: true });

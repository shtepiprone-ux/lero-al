// Review 2 adversarial probe of the final hook: forms outside the self-tests. Prints REPORTED/MISSED per write form and
// SILENT/NOISY per read control. Fixture root from mkdtempSync; X = D/hook.mjs, Y = docs/y.mjs.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const hook = await import(pathToFileURL(process.argv[2]).href);
const root = mkdtempSync(join(tmpdir(), 'r2-adv-'));
const put = (p, t = 'a\n') => { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), t); };
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', Y = 'docs/y.mjs';
put(X); put(Y); put('package.json', '{}');
const writes = [
  `bash -lc 'rm ${X}'`, `bash -ec 'rm ${X}'`, `sh -xc "rm ${X}"`, `bash --login -c 'rm ${X}'`, `bash -c -- 'rm ${X}'`,
  `pwsh -c "Remove-Item ${X}"`, `powershell -command "Remove-Item ${X}"`, `cmd.exe /C "del ${X}"`, `cmd /c "echo x>${X}"`,
  `python -c "open('${X}','w').write('x')"`, `python3 -c "open('${X}', 'a')"`, `node -e "require('fs').openSync('${X}','w')"`,
  `node -e "require('fs').promises.writeFile('${X}','x')"`, `echo x *> ${X}`, `echo x &> ${X}`, `echo x 1> ${X}`, `echo x >> ${X}`,
  `cp -t ${D} ${Y}`, `cp --target-directory=${D} docs/${N}`, `install -D ${Y} ${X}`, `sed -i -- 's/a/b/' ${X}`, `rm -r -- ${D}`,
  `New-Item ${X} -Value x -Force`, `ni -Path ${D} -Name ${N}`, `Move-Item ${Y} ${X}`, `Set-Content -LiteralPath ${X} -Value x`,
  `(cd ${D} && rm ${N})`, `{ rm ${X}; }`, `if [ -f ${X} ]; then rm ${X}; fi`, `while false; do rm ${X}; done`, `true && rm ${X}`,
  `! rm ${X}`, `nohup rm ${X} &`, `1..3 | % { Remove-Item ${X} }`, `env -C ${D} rm ${N}`, `xargs -a list rm ${X}`,
  `echo 'docs/*.mjs'; rm ${D}/*.mjs; echo '`, `rm ${D}/fixture-scop?.mjs "$y"`, `cat ${Y} | tee ${X} > /dev/null`,
  `Out-File ${X}`, `Add-Content -Path ${X} -Value x`, `Copy-Item -LiteralPath ${Y} -Destination ${X} -Force`,
  `git show HEAD:${Y} > ${X}`, `rsync -a ${Y} ${X}`, `ln ${Y} ${X}`, `truncate --size=0 ${X}`, `touch -d 2020-01-01 ${X}`,
  `find ${D} -type f -delete`, `find ${D} -exec rm {} +`, `ls ${D} | xargs -n1 rm`, `Get-ChildItem -Path ${D} -Recurse | Remove-Item -Force`,
  `node -e "require('fs').writeFileSync('${X}', 'x')"`, `node --eval "require('fs').writeFileSync('${X}','x')"`,
  `python -c "import os; os.remove('${X}')"`, `python -c "import pathlib; pathlib.Path('${X}').write_text('x')"`,
  `bash -c "bash -c 'rm ${X}'"`, `powershell -Command "& { Remove-Item ${X} }"`, `Start-Process -FilePath rm -ArgumentList '${X}'`,
  `cmd /c "cd ${D.replaceAll('/', '\\')} && del ${N}"`, `pushd ${D}; rm ${N}; popd`, `Set-Location ${D}; Remove-Item ${N}`,
];
const reads = [
  `cat ${X}`, `grep -n a ${X}`, `cp ${X} /tmp/z.mjs`, `bash -lc 'cat ${X}'`, `python -c "print(open('${X}').read())"`,
  `node -e "console.log(require('fs').readFileSync('${X}','utf8'))"`, `Get-Content ${X} | Out-Host`, `diff ${X} ${Y}`,
  `git diff -- ${X}`, `rg -n "rm ${X}" docs`, `echo "cp ${Y} ${X}"`,
];
for (const c of writes) console.log(`${hook.shellWriteTargets(root, c).includes(X) ? 'REPORTED' : 'MISSED  '} :: ${c}`);
for (const c of reads) { const t = hook.shellWriteTargets(root, c); console.log(`${t.includes(X) ? 'NOISY   ' : 'SILENT  '} :: ${c} :: ${JSON.stringify(t)}`); }
rmSync(root, { recursive: true, force: true });

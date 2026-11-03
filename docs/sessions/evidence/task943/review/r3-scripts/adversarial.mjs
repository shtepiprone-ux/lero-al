// Task 943 approver (review 3, session e50584bc), read-only on the live hook: write forms and read controls chosen by this
// review, outside the self-test inputs, on a temporary fixture root (X a scope-like file, Y readable, D the folder of X).
// Each deny row should print REPORTED and a refusal for the executor form (X -> scripts/check-example.mjs); each control
// row should print SILENT and no refusal.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hook = await import(new URL('../../scripts/workflow-gates/security-hook.mjs', import.meta.url));
void fileURLToPath;
const root = mkdtempSync(join(tmpdir(), 'r3-adv-'));
const X = 'scripts/workflow-gates/fixture-scope.mjs', Y = 'docs/y.mjs', D = 'scripts/workflow-gates';
const abs = join(root, X).replaceAll('\\', '/');
try {
  for (const f of [X, Y, 'scripts/check-example.mjs', 'package.json']) { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), 'a\n'); }
  const deny = [
    `Copy-Item ${Y} -Destination ${X}`, `cp -t ${D} ${Y.replace('y.mjs', 'fixture-scope.mjs')}`, `rm -- ${X}`, `sudo -u root rm ${X}`,
    `env A=1 B=2 rm ${X}`, `Remove-Item -LiteralPath ${X}`, `ri ${X}`, `New-Item -Path ${D} -Name fixture-scope.mjs -ItemType File`,
    `Set-Content -LiteralPath ${X} -Value x`, `tee -a ${X} < ${Y}`, `dd of=${X} if=${Y}`, `ln ${Y} ${X}`, `truncate --size=0 ${X}`,
    `sed -E -i 's/a/b/' ${X}`, `sed --in-place=.bak 's/a/b/' ${X}`, `find ${D} -type f -exec rm {} +`, `Copy-Item ${Y} ${X} -Force`,
    `bash -c "cd ${D} && rm fixture-scope.mjs"`, `pwsh -NoProfile -c "Remove-Item ${X}"`, `cmd /c del ${X.replaceAll('/', '\\')}`,
    `Start-Process -FilePath rm -ArgumentList ${X}`, `iex 'Remove-Item ${X}'`, `node -e "require('fs').promises.rm('${X}')"`,
    `node -e "fs.cpSync('${Y}','${X}')"`, `python -c "import os; os.remove('${X}')"`, `python -c "import shutil; shutil.move('${Y}','${X}')"`,
    `powershell -c "[IO.File]::Delete('${X}')"`, `Rename-Item ${X} other.mjs`, `mi ${X} other.mjs`, `CP ${Y} ${X}`,
    `cp ${Y} ${X.replaceAll('/', '\\')}`, `cp ${Y} ${abs}`, `cp ${Y} ./${X}`, `cd scripts && cd workflow-gates && rm fixture-scope.mjs`,
    `Push-Location scripts; Remove-Item workflow-gates/fixture-scope.mjs`, `git show HEAD:${Y} > ${X}`, `install -D ${Y} ${X}`,
    `curl -o ${X} https://example.test/x`, `wget -O ${X} https://example.test/x`, `tar -cf ${X} docs`, `timeout --signal=KILL 5 rm ${X}`,
    `nohup rm ${X} &`, `Get-ChildItem ${D} -Filter *.mjs | Remove-Item -Force`, `ls ${D}/*.mjs | xargs -n1 rm -f`,
    `bash -c 'bash -c "rm ${X}"'`, `Remove-Item ${D} -Recurse -Force`, `mv ${D} /tmp/elsewhere`, `rsync -a ${Y} ${X}`,
  ];
  const controls = [
    `cat ${X}`, `cp ${X} ${tmpdir().replaceAll('\\', '/')}/x.mjs`, `grep -n rm ${X}`, `echo "rm ${X}"`, `git diff -- ${X}`, `ls ${D}`,
    `Get-Content ${X}`, `npx prettier --check ${X}`, `node --check ${X}`, `git log --oneline -3 -- ${X}`, `wc -l ${X}`,
    `Select-String -Path ${X} -Pattern rm`, `sed -n 1,5p ${X}`, `find ${D} -name '*.mjs'`, `diff ${X} ${Y}`, `sha256sum ${X}`,
    `Get-FileHash ${X}`, `node test-results/943-r3/run.mjs selftests`, `git diff 8899d9c42 04545b0ea -- ${X}`,
  ];
  const ev = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', tool_input: { command: command.replaceAll(X, 'scripts/check-example.mjs').replaceAll(abs, join(root, 'scripts/check-example.mjs').replaceAll('\\', '/')) } });
  let missed = 0, noisy = 0;
  for (const command of deny) {
    const t = hook.shellWriteTargets(root, command);
    const ok = t.some(path => path.toLowerCase() === X.toLowerCase());
    if (!ok) missed++;
    const guard = hook.evaluateHook(root, ev(command), '').map(e => e.split(':')[0]);
    console.log(`${ok ? 'REPORTED' : 'MISSED  '} | ${command} | targets ${JSON.stringify(t).slice(0, 160)} | executor ${JSON.stringify(guard)}`);
  }
  for (const command of controls) {
    const t = hook.shellWriteTargets(root, command);
    const bad = t.some(path => path.toLowerCase() === X.toLowerCase());
    if (bad) noisy++;
    const guard = hook.evaluateHook(root, ev(command), '').map(e => e.split(':')[0]);
    console.log(`${bad ? 'NOISY   ' : 'SILENT  '} | ${command} | targets ${JSON.stringify(t).slice(0, 160)} | executor ${JSON.stringify(guard)}`);
  }
  console.log(`deny rows ${deny.length}, missed ${missed}; control rows ${controls.length}, noisy ${noisy}`);
} finally { rmSync(root, { recursive: true, force: true }); }

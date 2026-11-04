// Task 944 review 4 self-audit (read-only for the project): classifies the forms r4-ac12.mjs found missed, against the final hook and
// the base hook. Prints X reported or not for each spelling. Usage (project root): node docs/sessions/evidence/task944/review/r4-forms-diagnosis.mjs
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { shellWriteTargets } from '../../../../../scripts/workflow-gates/security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const base = await import(pathToFileURL(resolve(ROOT, 'test-results/944-r3/base-hook.mjs')).href);
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates';
const root = mkdtempSync(join(tmpdir(), 'lero-r4-diag-'));
mkdirSync(dirname(join(root, X)), { recursive: true }); writeFileSync(join(root, X), 'a\n');
const groups = {
  'keyword mode after another keyword': [`python -c "open('${X}', buffering=1, mode='w')"`, `python -c "open('${X}', encoding='utf8', mode='w')"`, `python -c "open('${X}', newline='', mode='a')"`],
  'second-position mode (controls that must stay reported)': [`python -c "open('${X}', 'w', encoding='utf8')"`, `python -c "open('${X}', mode='w', encoding='utf8')"`],
  'read keyword forms (must stay quiet)': [`python -c "open('${X}', encoding='utf8', mode='r')"`, `python -c "open('${X}', encoding='utf8', errors='replace')"`],
  'Path.open with a keyword mode': [`python -c "from pathlib import Path; Path('${X}').open(mode='w')"`, `python -c "from pathlib import Path; Path('${X}').open(encoding='utf8', mode='a')"`],
  'keyword path of a delete call': [`python -c "import shutil; shutil.rmtree(path='${D}')"`, `python -c "import os; os.remove(path='${X}')"`],
  'escaped double quotes': [`python -c "open(\\"${X}\\", 'w')"`, `python -c "open(\\"${X}\\", \\"w\\")"`, `powershell -Command "[IO.File]::Create(\\"${X}\\")"`,
    `powershell -Command "[IO.File]::WriteAllText(\\"${X}\\", 'a')"`, `node -e "require(\\"fs\\").writeFileSync(\\"${X}\\", 'a')"`, `node -e "require(\\"fs\\").rmSync(\\"${X}\\")"`, `python -c "import os; os.remove(\\"${X}\\")"`],
  'unescaped outer single quotes (controls)': [`python -c 'open("${X}", "w")'`, `node -e 'require("fs").writeFileSync("${X}", "a")'`, `powershell -Command '[IO.File]::Create("${X}")'`],
  'double-quoted fs.open flags (not valid JavaScript with flags=)': [`node -e "fs.open('${X}', 'w', () => 0)"`, `node -e 'fs.open("${X}", "w", () => 0)'`],
};
for (const [group, forms] of Object.entries(groups)) {
  console.log(`## ${group}`);
  for (const command of forms) {
    const has = hook => { try { return hook(root, command, root).includes(X); } catch (error) { return `THROW ${error.message}`; } };
    console.log(`${has(shellWriteTargets) === true ? 'REPORTED' : 'MISSED  '} (base ${has(base.shellWriteTargets) === true ? 'reported' : 'missed'}) ${command}`);
  }
}
rmSync(root, { recursive: true, force: true });

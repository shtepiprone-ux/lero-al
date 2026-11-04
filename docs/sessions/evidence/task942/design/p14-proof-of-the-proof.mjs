// Task 942 revision 5: the proof of the proof, after p13-reader-forms-run.mjs (it needs test-results/task942-r11/whole-hook.break.json).
// Usage from the project root: node docs/sessions/evidence/task942/design/p14-proof-of-the-proof.mjs
// A. A sentinel: the load hook really gives the suite the prototype. B. Each break the revision names, on the prototype text, against the
// existing case it must fail. The breaks stay in gitignored test-results; the live hook is not changed.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const work = join(root, 'test-results/task942-r11');
const register = pathToFileURL(resolve('scripts/workflow-gates/sensitivity-register.mjs')).href;
const whole = JSON.parse(readFileSync(join(work, 'whole-hook.break.json'), 'utf8'));
const hook = pathToFileURL(resolve('scripts/workflow-gates/security-hook.mjs')).href;
const fx = mkdtempSync(join(tmpdir(), 'lero-942-r11-proof-'));
mkdirSync(join(fx, 'docs'), { recursive: true });
writeFileSync(join(fx, 'docs/a.txt'), 'a\n');

const child = (code, env = process.env) => spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', env, timeout: 120000 });
const envWith = spec => ({ ...process.env, NODE_OPTIONS: `--import=${register}`, SENSITIVITY_BREAK: spec });
const sentinel = `const { shellWriteTargets } = await import(${JSON.stringify(hook)}); console.log(JSON.stringify(shellWriteTargets(${JSON.stringify(fx)}, 'npx.cmd rimraf docs/a.txt', ${JSON.stringify(fx)})));`;
console.log(`A. sentinel without the swap: ${child(sentinel).stdout.trim()}`);
console.log(`A. sentinel with the swap:    ${child(sentinel, envWith(join(work, 'whole-hook.break.json'))).stdout.trim()}`);

const lf = text => text.replace(/\r\n/g, '\n');
const breaks = [
  ['CLASSES case, the option walk of R8 stopped (the new text of AC8)', 'scripts/workflow-gates/shell-forms-classes.selftest.mjs', 'GOV-942-HOOK-SHELL-CLASSES-DENY', "    if (texts[at].startsWith('-')) {\n      mayBeValue", "    if (false) {\n      mayBeValue"],
  ['FORMS case, the unchanged R4 (c) spec', 'scripts/workflow-gates/shell-forms-residual.selftest.mjs', 'GOV-942-HOOK-SHELL-FORMS-DENY', '  return folder;\n}\n// Targets of one simple command of section 5', '  return start;\n}\n// Targets of one simple command of section 5'],
];
for (const [name, file, id, find, replace] of breaks) {
  const text = lf(whole.replace);
  const count = text.split(find).length - 1;
  const spec = join(work, `p14-${id}.break.json`);
  writeFileSync(spec, JSON.stringify({ version: 1, case: id, target: whole.target, find: whole.find, replace: text.replace(find, () => replace) }));
  const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=^\\[${id}\\]`, file], { encoding: 'utf8', env: envWith(spec), timeout: 280000 });
  console.log(`B. ${name}: find applies ${count} time(s); exit ${run.status}; ${/# fail \d+/.exec(run.stdout)?.[0]}; ${/code: '?(\w+)/.exec(run.stdout)?.[1]}; ${/error: '?([^\n]{0,120})/.exec(run.stdout)?.[1]}`);
}

// C. The breaks of the new case, on the prototype text, read directly on the forms and the timing the new case will hold.
const probe = `const { shellWriteTargets: t } = await import(${JSON.stringify(hook)});
const x = 'docs/a.txt', blanks = ' '.repeat(5000), fx = ${JSON.stringify(fx)};
const folders = Array.from({ length: 200 }, (_, i) => 'cd d' + i).join('; ');
const hostile = folders + '; python -c "system(\\'' + 'open('.repeat(2000) + '\\')"';
const t0 = performance.now(); t(fx, hostile, fx); const ms = Math.round(performance.now() - t0);
console.log(JSON.stringify({ blanksBeforePath: t(fx, 'python -c "open(' + blanks + "'" + x + "', 'w')" + '"', fx).includes(x), launcher: t(fx, 'npx.cmd rimraf ' + x, fx).includes(x), noValue: t(fx, 'npx --filter rm ' + x, fx).includes(x), value: t(fx, 'npx --loglevel silent rm ' + x, fx).includes(x), firstText: t(fx, "npx -c 'rm " + x + "' -c 'cat a'", fx).includes(x), triple: t(fx, 'python -c "open(' + "'" + x + "', '''w''')" + '"', fx).includes(x), ms }));`;
for (const [name, find, replace] of [
  ['none', null, null],
  ['R11 bound from the start of the call', '(FIRST_TEXT.test(text) ? FIRST_TEXT.lastIndex : start) + CALL_SCAN', 'start + CALL_SCAN'],
  ['R12 no memo', 'const openTargets = text => memo(`open\\0${text}`, () => readOpenTargets(text));', 'const openTargets = text => readOpenTargets(text);'],
  ['R13 (a) .exe only', '.replace(/\\.(?:exe|cmd|bat|ps1|com)$/, \'\')', ".replace(/\\.exe$/, '')"],
  ['R13 (b) one reading of the word after an option', '  while (RUNNER_WRAPPERS.has(wrapper) && index < texts.length', '  while (false && index < texts.length'],
  ['R13 (d) the last text only', "  return found.filter(Boolean).join('; ') || null;", "  return found.filter(Boolean).at(-1) || null;"],
  ['R13 (h) no triple quotes', "const unTriple = argument => (argument || '').replace(/^([a-z]*)('''|\"\"\")(.*)\\2$/is, \"$1'$3'\");", "const unTriple = argument => argument || '';"],
]) {
  const text = lf(whole.replace);
  const count = find ? text.split(find).length - 1 : 1;
  const spec = join(work, 'p14-probe.break.json');
  writeFileSync(spec, JSON.stringify({ version: 1, case: 'p14', target: whole.target, find: whole.find, replace: find ? text.replace(find, () => replace) : text }));
  const run = child(probe, envWith(spec));
  console.log(`C. ${name}: find applies ${count} time(s); ${run.stdout.trim()} ${run.stderr.slice(0, 120)}`);
}
rmSync(fx, { recursive: true, force: true });

// Task 942 revision 5 feasibility run (owner D13, D14, D24; review of commit 5cd44cb97, 2026-11-04). Run from the project root on native
// Windows, on the committed R6-R9 hook: node docs/sessions/evidence/task942/design/p13-reader-forms-run.mjs
// The PAIRS go on scripts/workflow-gates/security-hook.mjs (each `find` exactly once). The prototype is written to the gitignored
// test-results/task942-r11/; the live hook is not changed. A design prototype to read, not code to paste.
// A. The forms report X and their executor forms are refused; each form was missed by the current hook; the controls stay silent.
// B. The whole self-test suite, unchanged, with the prototype loaded in place of the hook through the Task 944 in-memory load hook.
// C. The frozen corpus, current hook versus prototype. D. The 5000-folder-change commands and hostile lengths on the prototype.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const work = join(root, 'test-results/task942-r11');
mkdirSync(work, { recursive: true });
const tmp = tmpdir();
const redact = text => text.split(tmp).join('<tmp>').split(tmp.replaceAll('\\', '/')).join('<tmp>')
  .replace(/(?:[A-Za-z]:|\/[a-z])[\\/]+Users[\\/]+[^\\/"'\s]+/gi, '<user-home>');
const out = [];
let failures = 0;
const expect = (id, ok, detail) => { if (!ok) failures++; out.push(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? ` | ${redact(detail)}` : ''}`); };
const real = file => pathToFileURL(join(gates, file)).href;
const r = String.raw;

const PAIRS = [
  // R13 (a): the launchers of native Windows name a program like its `.exe`.
  [r`const commandName = word => basename(word.replaceAll('\\', '/')).toLowerCase().replace(/\.exe$/, '');`,
    r`const commandName = word => basename(word.replaceAll('\\', '/')).toLowerCase().replace(/\.(?:exe|cmd|bat|ps1|com)$/, '');`],
  // R13 (e): `corepack` runs a package manager.
  [`'npx', 'pnpx', 'bunx', 'shx']);\n// Task 942 R7:`, `'npx', 'pnpx', 'bunx', 'shx', 'corepack']);\n// Task 942 R7:`],
  // R13 (b): the word after a runner's option may be its value or the program. npm 11 reads --filter with no value and --prefix with one
  // (review/r5-real-behaviour.txt); pnpm, yarn and bun could not be run here. So both are read: the walk goes on after each such word.
  [r`function programIndex(texts) {
  let index = 0, wrapper = null;`, r`function programWalk(texts, start = 0, after = null) {
  let index = start, wrapper = after;`],
  [r`  return index;
}
// R8 (a):`, r`  return { index, wrapper };
}
const programIndex = texts => programWalk(texts).index;
const RUNNER_WRAPPERS = new Set(['npx', 'pnpx', 'bunx']);
function programIndexes(texts) {
  let { index, wrapper } = programWalk(texts);
  const found = [index];
  while (RUNNER_WRAPPERS.has(wrapper) && index < texts.length && /^-(?!-$)[^=]*$/.test(texts[index - 1] || '')) {
    ({ index, wrapper } = programWalk(texts, index + 1, wrapper));
    found.push(index);
  }
  return found;
}
// R8 (a):`],
  [r`function envFolder(texts, start) {
  const index = programIndex(texts);`, r`function envFolder(texts, start, index = programIndexes(texts).at(-1)) {`],
  // The word a value option takes is no option of its own: `env --chdir -iC x` moves to `-iC`, which R7 read as a second folder change (r6-superset.txt).
  [r`    if (movedFolder(value)) folder = resolve(folder, spelling(value));
  }
  return folder;`, r`    if (movedFolder(value)) folder = resolve(folder, spelling(value));
    if (value === texts[i + 1]) i++;
  }
  return folder;`],
  [r`function programTargets(root, folder, texts, all) {
  const index = programIndex(texts);
  if (index >= texts.length) return [];
  folder = envFolder(texts, folder);
  const program = commandName(texts[index]);
  const args = texts.slice(index + 1);
  if (!WRITE_PROGRAMS.has(program) && !OTHER_WRITERS.has(program)) return [];`, r`function programTargets(root, folder, texts, all) {
  const seen = new Set();
  return programIndexes(texts).flatMap(index => {
    const program = commandName(texts[index] || '');
    if (seen.has(program) || (!WRITE_PROGRAMS.has(program) && !OTHER_WRITERS.has(program))) return [];
    seen.add(program);
    return targetsAt(root, envFolder(texts, folder, index), texts, all, index, program);
  });
}
function targetsAt(root, folder, texts, all, index, program) {
  const args = texts.slice(index + 1);`],
  [r`function evaluatedText(words) {
  const at = programIndex(words);
  const runner`, r`function evaluatedText(words) {
  const indexes = programIndexes(words), seen = new Set();
  for (const [i, at] of indexes.entries()) {
    const program = basename((words[at] || '').replaceAll('\\', '/'));
    const reads = i === 0 || i === indexes.length - 1 || /^(?:-c|--call)$/.test(words[at - 1] || '') || [EVALUATOR, SHELL_PROGRAM, START_PROCESS].some(pattern => pattern.test(program));
    if (!reads || seen.has(program)) continue;
    seen.add(program);
    const text = evaluatedAt(words, at);
    if (text !== null) return text;
  }
  return null;
}
function evaluatedAt(words, at) {
  const runner`],
  // R13 (c): any option without = may take one value, so the word after it is read as a subcommand first and as a value otherwise. The list
  // goes: `npm -w` takes a value, while pnpm documents `-w` as a flag (not run here). `yarn workspace <name>`, and options after `run`.
  [r`const MANAGER_VALUE = /^(?:--prefix|-C|--dir|--cwd|-w|--workspace|--filter|-F)$/;
`, ''],
  [r`  let at = index + 1;
  while (texts[at]?.startsWith('-')) at += MANAGER_VALUE.test(texts[at]) ? 2 : 1;
  const subcommand = texts[at] || '';
  if (runners.test(subcommand)) return { next: at + 1, runner: true };
  if (/^run$/i.test(subcommand) && DIRECT_TOOL.test(texts[at + 1] || '')) return { next: at + 1 };
  return manager !== 'npm' && DIRECT_TOOL.test(subcommand) ? { next: at } : null;
}`, r`  const subcommandAt = position => {
    const at = manager === 'yarn' && /^workspace$/i.test(texts[position] || '') ? position + 2 : position;
    const subcommand = texts[at] || '';
    if (runners.test(subcommand)) return { next: at + 1, runner: true };
    if (/^run$/i.test(subcommand)) {
      let tool = at + 1;
      while (texts[tool]?.startsWith('-')) tool++;
      return DIRECT_TOOL.test(texts[tool] || '') ? { next: tool } : null;
    }
    return manager !== 'npm' && DIRECT_TOOL.test(subcommand) ? { next: at } : null;
  };
  let at = index + 1, mayBeValue = -1;
  while (at < texts.length) {
    if (texts[at].startsWith('-')) {
      mayBeValue = texts[at].includes('=') ? -1 : at + 1;
      at++;
      continue;
    }
    const step = subcommandAt(at);
    if (step) return step;
    if (mayBeValue !== at) return null;
    at++;
  }
  return null;
}`],
  // R13 (d): every text of a repeated `-c`, `--call` or `--call=` is read: npm runs the last, the other runners could not be run here. The text of `env -S` is a command text.
  [r`  const attached = before.findLast(word => word.startsWith('--call='))?.slice(7);
  if (attached) return attached;
  return /^(?:-c|--call)$/.test(before.at(-1) || '') && words[at] ? words[at] : null;
}`, r`  const found = before.filter(word => word.startsWith('--call=')).map(word => word.slice(7));
  if (/^(?:-c|--call)$/.test(before.at(-1) || '') && words[at]) {
    found.push(words[at]);
    for (let i = at + 1; i < words.length;) {
      if (words[i].startsWith('--call=')) { found.push(words[i].slice(7)); i++; continue; }
      if (!/^(?:-c|--call)$/.test(words[i]) || !words[i + 1]) break;
      found.push(words[i + 1]);
      i += 2;
    }
  }
  return found.filter(Boolean).join('; ') || null;
}
function envSplitText(words) {
  const at = programIndexes(words).at(-1);
  const envAt = words.slice(0, at).findIndex(word => commandName(word) === 'env');
  if (envAt === -1) return null;
  const found = [];
  for (let i = envAt + 1; i < Math.min(at, words.length); i++) {
    const word = words[i];
    const cluster = /^-[i0v]*S(.*)$/s.exec(word);
    const value = cluster ? cluster[1] || words[i + 1] : word === '--split-string' ? words[i + 1] : word.startsWith('--split-string=') ? word.slice(15) : undefined;
    if (value) found.push(value);
  }
  return found.join('; ') || null;
}`],
  [r`      const inner = evaluatedText(texts);
      if (inner && depth < 3) {
        for (const folder of new Set([resolve(root), ...here])) for (const path of uncachedShellWriteTargets(root, inner, folder, depth + 1)) add(path);
      }`, r`      for (const inner of [evaluatedText(texts), envSplitText(texts)]) if (inner && depth < 3) {
        for (const folder of new Set([resolve(root), ...here])) for (const path of uncachedShellWriteTargets(root, inner, folder, depth + 1)) add(path);
      }`],
  [r`      let here = current;
      const collect = list => {
        for (const folder of new Set([resolve(root), ...current, ...here])) {
          for (const path of programTargets(root, folder, list, [list])) if (fileLike(path)) found.push(path);
        }
      };`, r`      let here = current;
      const collect = (list, folders = here) => {
        for (const folder of new Set([resolve(root), ...current, ...folders])) {
          for (const path of programTargets(root, folder, list, [list])) if (fileLike(path)) found.push(path);
        }
      };
      const split = envSplitText(words);
      if (split !== null) collect(nestedWords(split), here.map(folder => envFolder(words, folder)));`],
  // R13 (f): a quoted `env` word in the raw reading.
  [r`env(?:\.exe)?(?:\s+(?:-[i0v]*[uS]|--unset|--split-string)\s+\S+`, r`env(?:\.exe)?['"]?(?:\s+(?:-[i0v]*[uS]|--unset|--split-string)\s+\S+`],
  // R13 (g): every level of escaped quotes reads as a quote in the second raw reading.
  [r`const readings = [...new Set([command, command.replace(/\\"|` + '`' + r`"/g, '"')])];`, r`const readings = [...new Set([command, command.replace(/\\+"|` + '`' + r`"/g, '"')])];`],
  // R11: the bound counts from the end of the first quoted text of a call, so blanks or a long path before it lose nothing.
  [r`const CALL_SCAN = 4096;`, r`const CALL_SCAN = 4096;
const FIRST_TEXT = /\s*(?:\w+\s*=\s*)?[a-z]*(?:'[^']*'|"[^"]*"|` + '`[^`]*`' + r`)/iy;`],
  [r`  const end = Math.min(text.length, start + CALL_SCAN);`, r`  FIRST_TEXT.lastIndex = start;
  const end = Math.min(text.length, (FIRST_TEXT.test(text) ? FIRST_TEXT.lastIndex : start) + CALL_SCAN);`],
  // R13 (h): `**dict(…)`, a literal `*[…]` or `*(…)`, and a template literal.
  [r`      for (const item of argument.matchAll(/['"](\w+)['"]\s*:\s*([^,}]+)/g)) keywords.push([item[1], item[2].trim()]);
      return;
    }`, r`      for (const item of argument.matchAll(/['"](\w+)['"]\s*:\s*([^,}]+)/g)) keywords.push([item[1], item[2].trim()]);
      if (/^\*\*dict\s*\(/.test(argument)) for (const item of argument.matchAll(/\b(\w+)\s*=\s*([^,)]+)/g)) keywords.push([item[1], item[2].trim()]);
      return;
    }
    if (/^\*\s*[[(]/.test(argument)) {
      for (const item of argument.matchAll(/[a-z]*(['"` + '`' + r`])[^'"` + '`' + r`]*\1/gi)) positional.push(item[0]);
      return;
    }`],
  [r`    if (ch === '"' || ch === "'") quote = ch;`, r`    if (ch === '"' || ch === "'" || ch === '` + '`' + r`') quote = ch;`],
  [r`const stringValue = argument => /^[a-z]*(['"])([^'"]+)\1$/i.exec(argument || '')?.[2];`, r`const unTriple = argument => (argument || '').replace(/^([a-z]*)('''|""")(.*)\2$/is, "$1'$3'");
const stringValue = argument => /^[a-z]*(['"` + '`' + r`])([^'"` + '`' + r`]+)\1$/i.exec(unTriple(argument))?.[2];`],
  [r`/[wax+]/.test(/^[a-z]*['"]([^'"]*)['"]/i.exec(argument)?.[1] ?? '');`, r`/[wax+]/.test(/^[a-z]*['"` + '`' + r`]([^'"` + '`' + r`]*)['"` + '`' + r`]/i.exec(unTriple(argument))?.[1] ?? '');`],
  // R13 (h): a flag expression of numbers, and the `path=` keyword when no positional string names the file.
  [r`const writesFlags = argument => writesMode(argument) || Number(argument) > 0;`, r`const writesFlags = argument => writesMode(argument) || argument.split(/[|+]/).some(part => Number(part) > 0);`],
  [r`    const [file] = keywordValues(call, 'file');`, r`    const file = keywordValues(call, 'file')[0] ?? (stringValue(call.positional[0]) ? undefined : keywordValues(call, 'path')[0]);`],
  // R12: the result of one text is read once per top-level call, so a nested text in many folders costs one reading.
  [r`function openTargets(text) {
  const calls =`, r`const openTargets = text => memo(` + '`open\\0${text}`' + r`, () => readOpenTargets(text));
function readOpenTargets(text) {
  const calls =`],
];

const hookPath = join(gates, 'security-hook.mjs');
const live = readFileSync(hookPath, 'utf8');
let text = live.replace(/\r\n/g, '\n');
for (const [find, replace] of PAIRS) {
  const count = text.split(find).length - 1;
  expect(`pair applies once: ${find.slice(0, 60).replace(/\n/g, ' ')}`, count === 1, count === 1 ? '' : `found ${count} times`);
  text = text.replace(find, () => replace);
}
const protoPath = join(work, 'security-hook.mjs');
writeFileSync(protoPath, text.replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
  .replace("new URL('./hook-load-check.mjs', import.meta.url)", `new URL('${real('hook-load-check.mjs')}')`));
const current = await import(real('security-hook.mjs'));
const proto = await import(pathToFileURL(protoPath).href);

// A. R11: what the hook of C60 reported and the reader lost. R13: the forms the completion report and this review found.
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', P = 'scripts/check-example.mjs', Y = `docs/${N}`;
const blanks = ' '.repeat(5000);
const forms = (x, d, n) => [
  // R11: the bound of the reader, before the path.
  `python -c "open(${blanks}'${x}', 'w')"`, `python -c "open(${blanks}file='${x}', mode='w')"`, `python -c "open(file=${blanks}'${x}', mode='w')"`, `node -e "fs.openSync(${blanks}'${x}', 'w')"`,
  `powershell -Command "[IO.File]::Open(${blanks}'${x}', 'Create')"`, `python -c "open('${'./'.repeat(2500)}${x}', 'w')"`, `powershell -Command "[IO.File]::Open('${'./'.repeat(2500)}${x}', 'Create')"`,
  // R13 (a): the launchers.
  `npm.cmd exec rimraf ${x}`, `npx.cmd rimraf ${x}`, `pnpm.cmd exec rimraf ${x}`, `npm.ps1 exec rimraf ${x}`, `yarn.cmd rimraf ${x}`, `rimraf.cmd ${x}`, `pnpm.CMD rimraf ${x}`,
  // R13 (b): a value option after the subcommand.
  `npm exec -w app -- rimraf ${x}`, `npm exec --workspace app rimraf ${x}`, `pnpm exec --filter app rimraf ${x}`, `pnpm dlx -F app rimraf ${x}`, `yarn exec --cwd . rimraf ${x}`, `npx --prefix . rm ${x}`,
  // R13 (b): the word after a runner's option, read both ways. Run on npm 11: --filter, -F, --dir and an unknown option take no value; --loglevel and --prefix take one.
  `npx --filter rm ${x}`, `npx -F rm ${x}`, `npx --dir rm ${x}`, `npx --foo rimraf ${x}`, `npx -w rm ${x}`, `npx --prefix rm ${x}`, `npx --loglevel silent rm ${x}`, `npx --cache /tmp rimraf ${x}`, `npm exec --loglevel silent rimraf ${x}`, `npm exec --filter rimraf ${x}`, `pnpm dlx --reporter silent rimraf ${x}`, `npx --silent --loglevel warn rm ${x}`, `npx --loglevel silent --filter rm ${x}`, `npx --loglevel silent env -C ${d} rm ${n}`, `npx --loglevel silent bash -c 'rm ${x}'`, `npx --loglevel silent -c 'rm ${x}'`,
  // R13 (c): the manager's own options.
  `pnpm --package foo dlx rimraf ${x}`, `npm --loglevel silent exec rimraf ${x}`, `npm --cache /tmp exec rimraf ${x}`, `pnpm --reporter silent exec rimraf ${x}`, `yarn --modules-folder x exec rimraf ${x}`, `npm --loglevel silent --prefix . exec rimraf ${x}`,
  `yarn workspace app rimraf ${x}`, `yarn workspace app exec rimraf ${x}`, `pnpm run --silent rimraf ${x}`, `npm run -- rimraf ${x}`, `npm run --silent -- shx rm ${x}`,
  `pnpm -w exec rm ${x}`, `pnpm -w exec rimraf ${x}`, `npm --workspace exec rimraf ${x}`, `yarn --silent test rimraf ${x}`,
  // R13 (d): a repeated text flag, and the text of `env -S`.
  `npx -c 'cat a' -c 'rm ${x}'`, `npx -c 'cat a' --call 'rm ${x}'`, `npx -c 'cat a' --call='rm ${x}'`, `npm exec --call 'cat a' -c 'rm ${x}'`, `npx -c 'rm ${x}' -c 'cat a'`, `npx --call='rm ${x}' -c 'cat a'`, `npx -c 'rm ${x}' --call='cat a'`, `env -S 'rm ${x}' -S 'cat a'`, `env -S 'rm ${x}'`, `env --split-string='rm ${x}'`, `env --split-string 'rm ${x}'`, `env -iS 'rm ${x}'`, `env -S 'rm ${x}'; echo $y`, `env -C ${d} -S 'rm ${n}'`, `env -C ${d} -S 'rm ${n}'; echo $y`,
  // R13 (e): corepack.
  `corepack pnpm exec rimraf ${x}`, `corepack npx rimraf ${x}`, `corepack yarn rimraf ${x}`,
  // R13 (f): a quoted env word in the raw reading.
  `"env" -C ${d} python -c "open('${n}','w')"`, `'env' -C ${d} python -c "open('${n}','w')"`,
  // R13 (g): a second and a third level of escaped quotes.
  `bash -c "python -c \\"open(\\\\\\"${x}\\\\\\", 'w')\\""`, `bash -c "bash -c \\"python -c \\\\\\"open(\\\\\\\\\\\\\\"${x}\\\\\\\\\\\\\\", 'w')\\\\\\"\\""`,
  // R13 (h): the literal values of a call.
  `python -c "open('${x}', **dict(mode='w'))"`, `python -c "open('${x}', *['w'])"`, `python -c "open('${x}', *('w',))"`, `python -c "open(*['${x}', 'w'])"`, `python -c "import os; os.open(path='${x}', flags=os.O_WRONLY)"`, `python -c "import os; os.open('${x}', 1 | 64)"`, `python -c "import os; os.open('${x}', 0 | 1)"`, `python -c "import os; os.open('${x}', flags=1 | 64)"`, `python -c "open('${x}', '''w''')"`, `python -c 'open("${x}", """w""")'`, `python -c "open('''${x}''', 'w')"`,
  `node -e 'fs.openSync(\`${x}\`, "w")'`, `node -e 'fs.openSync("${x}", \`w\`)'`, `node -e 'require("fs").openSync(\`${x}\`, 1)'`,
];
const CONTROLS = [
  // Section 4: a value held in a variable stays outside; these were pinned as controls of the R6 case.
  `python -c "open('${X}', m)"`, `python -c "open('${X}', mode=m)"`, `node -e "fs.openSync('${X}', w)"`, `python -c "open('${X}', **opts)"`,
  // R13 (h).
  `python -c "import os; os.open('${X}', 0 | 0)"`, `python -c "open('${X}', **dict(mode='r'))"`, `python -c "open('${X}', *['r'])"`, `python -c "open(*['${X}'])"`, `node -e 'fs.openSync(\`${X}\`)'`, `node -e 'fs.openSync(\`${X}\`, "r")'`, `python -c "open('docs/a.txt', 'r', path='${X}')"`,
  // R13 (a) to (c): the same programs that read.
  `npm.cmd run build ${X}`, `npx.cmd tsc ${X}`, `npm.ps1 test ${X}`, `pnpm.cmd test ${X}`, `node.cmd ${X}`, `npm --silent test ${X}`, `npm --loglevel silent run build ${X}`, `npm --prefix=. run rm ${X}`, `yarn workspace app test ${X}`, `yarn workspace app build`, `pnpm run --silent lint ${X}`, `npm run -- lint ${X}`, `npm exec --workspace app tsc ${X}`, `pnpm exec --filter app tsc ${X}`, `corepack pnpm test ${X}`, `corepack npx tsc ${X}`, `corepack enable`, `npx --filter tsc ${X}`, `npx --loglevel silent tsc ${X}`, `npx --prefix . eslint ${X}`, `npm exec --filter tsc ${X}`, `npx -c 'cat ${X}' -c 'rm docs/a.txt'`, `python -c "open('${X}', '''r''')"`, `python -c "open('''${X}''')"`,
  // R13 (d) and (f).
  `env -S 'cat ${X}'`, `env --split-string='cat ${X}'`, `env -S 'cat ${X}'; echo $y`, `npx -c 'rm docs/a.txt' -c 'cat ${X}'`, `"env" -C docs python -c "open('${N}','w')"`, `bash -c "python -c \\"open(\\\\\\"${X}\\\\\\")\\""`,
];
const fx = mkdtempSync(join(tmp, 'lero-942-r11-'));
for (const file of [X, P, Y]) { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), 'a\n'); }
const executor = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: fx, tool_input: { command } });
const shown = command => command.replace(/ {100,}/g, '<5000 blanks>').replace(/(?:\.\/){100,}/g, '<2500 ./>');
let alreadySeen = 0;
for (const command of forms(X, D, N)) {
  const now = current.shellWriteTargets(fx, command, fx).includes(X), then = proto.shellWriteTargets(fx, command, fx).includes(X);
  if (now) alreadySeen++;
  expect(`form reported by the prototype: ${shown(command)}`, then, `current ${now}; prototype ${then}`);
}
out.push(`forms ${forms(X, D, N).length}; already reported by the current hook ${alreadySeen}`);
for (const command of forms(P, 'scripts', 'check-example.mjs')) {
  const errors = proto.evaluateHook(fx, executor(command), '');
  expect(`executor refused: ${shown(command)}`, /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/.test(errors.join('\n')), errors[0]?.slice(0, 70));
}
for (const command of CONTROLS) expect(`control reports no X: ${command}`, !proto.shellWriteTargets(fx, command, fx).includes(X));

// D (part). Hostile lengths, against the hook timeout of 15 s. R12: the folders of a raw reading multiply no reader.
const folders = n => Array.from({ length: n }, (_, i) => `cd d${i}`).join('; ');
const hostile = {
  'open calls': 'open('.repeat(10000), 'open commas': `open('x'${','.repeat(50000)}`, 'open brackets': `open(${'('.repeat(50000)}`, 'unclosed quote': `open('${'x'.repeat(50000)}`, 'path open': 'Path(\'x\').open('.repeat(3400), 'net open': ']::Open('.repeat(7000),
  'manager options': `npm ${'-a '.repeat(16000)}x`, 'env cluster': `env -${'i'.repeat(50000)} x '`, 'env options': `/bin/env ${'-a '.repeat(16000)}x '`, 'env path': `${'/a'.repeat(25000)}/env -C d '`, 'nested': `bash -c "${"'a' ".repeat(12000)}" '`, 'escaped': `python -c "${'\\"'.repeat(25000)}"`,
  'backtick quotes': `x "${'`"'.repeat(25000)}"`, 'env words': `${'-/env '.repeat(16000)}'`,
  '200 folders, 2000 open calls': `${folders(200)}; python -c "system('${'open('.repeat(2000)}')"`, '1000 folders, 2000 open calls': `${folders(1000)}; python -c "system('${'open('.repeat(2000)}')"`, '400 folders, 8000 open calls': `${folders(400)}; python -c "system('${'open('.repeat(8000)}')"`,
  'manager option values': `npm ${'-a x '.repeat(10000)}`, 'manager run options': `npm ${'-z run -a '.repeat(5000)}`, 'blanks before a path': `open(${' '.repeat(50000)}`, 'blanks, open calls': `${`open(${' '.repeat(50)}`.repeat(900)}`, 'long first text': `open('${'x'.repeat(5000)}', `.repeat(10), 'first text keywords': `open(${'a'.repeat(50000)}`, 'repeated call flags': `npx ${"-c 'a' ".repeat(7000)}'`, 'env split': `env ${'-S x '.repeat(10000)}'`, 'backticks': `open(${'`'.repeat(50000)}`,
  'many backslashes': `python -c "${'\\'.repeat(50000)}"`, 'dict spread': `open('x', **dict(${'a=1,'.repeat(12000)}))`, 'star spread': `open('x', *[${"'a',".repeat(12000)}])`,
  'runner options': `npx ${'-a '.repeat(16000)}x`, 'runner option values': `npx ${'-a x '.repeat(10000)}`, 'runner option values, rejected': `npx ${'-a x '.repeat(10000)}'`, 'runner write programs': `npx ${'-a rm '.repeat(10000)}`, 'runner shells': `npx ${'-a bash '.repeat(7000)}`, 'runner distinct words': `npx ${Array.from({ length: 8000 }, (_, i) => `-a x${i}`).join(' ')}`, 'triple quotes': `open('x', ${"'''".repeat(16000)})`,
};
for (const [name, command] of Object.entries(hostile)) {
  const t0 = performance.now();
  proto.shellWriteTargets(fx, command, fx);
  const ms = Math.round(performance.now() - t0);
  expect(`hostile ${name}, ${command.length} characters: ${ms} ms`, ms < 3000);
}
rmSync(fx, { recursive: true, force: true });

// B. The unchanged suite against the prototype: the Task 944 load hook replaces the whole text of the hook, in memory, in every test process.
const spec = join(work, 'whole-hook.break.json');
writeFileSync(spec, JSON.stringify({ version: 1, case: 'p13', target: 'scripts/workflow-gates/security-hook.mjs', find: live, replace: text }));
const suite = spawnSync(process.execPath, ['scripts/workflow-gates/selftests.mjs'], { encoding: 'utf8', timeout: 400000, maxBuffer: 1 << 28,
  env: { ...process.env, NODE_OPTIONS: `--import=${real('sensitivity-register.mjs')}`, SENSITIVITY_BREAK: spec } });
const totals = (suite.stdout || '').split('\n').filter(line => /^# (?:tests|pass|fail|skipped) /.test(line)).join(', ');
expect(`whole self-test suite unchanged against the prototype (${totals})`, suite.status === 0, (suite.stdout || '').split('\n').filter(line => /^not ok/.test(line)).slice(0, 6).join(' / '));

// C. The frozen corpus.
const corpus = JSON.parse(readFileSync(join(root, 'test-results/task943-prototype/corpus.json'), 'utf8'));
out.push(`corpus ${corpus.length} commands, sha256 ${createHash('sha256').update(JSON.stringify(corpus)).digest('hex')}`);
const { allContracts, readJson } = await import(real('cli.mjs'));
const scopes = new Set();
for (const path of allContracts(root)) { try { const c = readJson(root, path); if (c.kind === 'governance') for (const s of c.scope || []) scopes.add(s.toLowerCase()); } catch { /* unreadable */ } }
let added = 0, dropped = 0, refused = 0, scopeHits = 0, slowest = 0;
const examples = [];
const short = command => JSON.stringify(command.length > 160 ? `${command.slice(0, 160)}...` : command);
for (const [command, cwd] of corpus) {
  const t0 = performance.now();
  const after = proto.shellWriteTargets(root, command, cwd);
  slowest = Math.max(slowest, performance.now() - t0);
  const before = current.shellWriteTargets(root, command, cwd);
  if (before.some(t => !after.includes(t))) { dropped++; examples.push(`  dropped ${short(before.filter(t => !after.includes(t)).join(' '))} for ${short(command)}`); }
  const extra = after.filter(t => !before.includes(t));
  if (extra.length) { added++; if (examples.length < 30) examples.push(`  added ${short(extra.slice(0, 3).join(' '))} for ${short(command)}`); }
  if (extra.some(t => scopes.has(t.toLowerCase()))) { scopeHits++; examples.push(`  scope hit for ${short(command)}`); }
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, cwd, tool_input: { command } };
  if (!current.evaluateHook(root, event, '').length) {
    const after2 = proto.evaluateHook(root, event, '');
    if (after2.length) { refused++; examples.push(`  newly refused (${after2[0].split(':')[0]}) ${short(command)}`); }
  }
}
out.push(`corpus: dropped ${dropped}; with added targets ${added}; executor commands newly refused ${refused}; with an added governance scope file ${scopeHits}; slowest prototype call ${Math.round(slowest)} ms`);
out.push(...examples.map(redact));
expect('corpus: no target dropped (superset)', dropped === 0);
expect('corpus: no added governance scope file', scopeHits === 0);

// D. The 5000-folder-change commands on the prototype.
for (const [name, command] of [['parsed', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo y > z`],
  ['parser-rejected', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo $y > z`]]) {
  const t0 = performance.now();
  proto.shellWriteTargets(root, command);
  const ms = Math.round(performance.now() - t0);
  expect(`timing ${name} 5000 folder changes under 15 s on the prototype: ${ms} ms`, ms < 15000);
}
out.push(`FAILURES ${failures}`);
console.log(redact(out.join('\n')));
process.exitCode = failures ? 1 : 0;

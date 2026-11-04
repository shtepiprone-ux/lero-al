// Task 942 revision 4 feasibility run (owner D24, 2026-11-04). Run from the project root on native Windows, on the committed Task 942
// R4 hook: node docs/sessions/evidence/task942/design/p11-class-forms-run.mjs
// The PAIRS go on scripts/workflow-gates/security-hook.mjs (each `find` exactly once). The prototype is written to the gitignored
// test-results/task942-r4/; the live hook is not changed. A design prototype to read, not code to paste.
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
const work = join(root, 'test-results/task942-r4');
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
  // R6 (d): one reading of a package manager, with its own options before the subcommand; the name of a wrapper given by path.
  [r`function programIndex(texts) {
  let index = 0, wrapper = null;
  while (index < texts.length) {
    const word = texts[index];
    if (SHELL_KEYWORD.test(word)) { index++; continue; }
    const next = texts[index + 1] || '';
    if (PACKAGE_RUNNERS.get(word.toLowerCase())?.test(next)) { wrapper = 'npx'; index += 2; continue; }
    // ` + '`yarn rimraf` and `yarn shx`' + r` run the program of that name; every other word after ` + '`yarn`' + r` is its own subcommand.
    if (/^yarn$/i.test(word) && /^(?:rimraf|shx)$/i.test(next)) { index++; continue; }
    if (/^(?:sudo|env|command|nohup|time|exec|nice|ionice|timeout|stdbuf|builtin|doas|npx|pnpx|bunx|shx)$/i.test(word)) {
      wrapper = word.toLowerCase(); index++;`,
  r`const MANAGER_VALUE = /^(?:--prefix|-C|--dir|--cwd|-w|--workspace|--filter|-F)$/;
const DIRECT_TOOL = /^(?:rimraf|shx)$/i;
const commandName = word => basename(word.replaceAll('\\', '/')).toLowerCase().replace(/\.exe$/, '');
function managerStep(texts, index) {
  const manager = commandName(texts[index]);
  if (!PACKAGE_RUNNERS.has(manager)) return null;
  let at = index + 1;
  while (texts[at]?.startsWith('-')) at += MANAGER_VALUE.test(texts[at]) ? 2 : 1;
  const sub = texts[at] || '';
  if (PACKAGE_RUNNERS.get(manager).test(sub)) return { next: at + 1, runner: true };
  if (/^run$/i.test(sub) && DIRECT_TOOL.test(texts[at + 1] || '')) return { next: at + 1 };
  return manager !== 'npm' && DIRECT_TOOL.test(sub) ? { next: at } : null;
}
function programIndex(texts) {
  let index = 0, wrapper = null;
  while (index < texts.length) {
    const word = texts[index];
    if (SHELL_KEYWORD.test(word)) { index++; continue; }
    const step = managerStep(texts, index);
    if (step) { if (step.runner) wrapper = 'npx'; index = step.next; continue; }
    const name = commandName(word);
    if (/^(?:sudo|env|command|nohup|time|exec|nice|ionice|timeout|stdbuf|builtin|doas|npx|pnpx|bunx|shx)$/.test(name)) {
      wrapper = name; index++;`],
  [r`stdbuf: /^-[ioe]$/, doas: /^-[uC]$/, npx: /^-p$/, pnpx: /^-p$/, bunx: /^-p$/ };`,
    r`stdbuf: /^-[ioe]$/, doas: /^-[uC]$/, npx: /^(?:-p|--package)$/, pnpx: /^(?:-p|--package)$/, bunx: /^(?:-p|--package)$/ };`],
  // R6 (c): one reading of the `env` options: a value option also ends a cluster.
  [r`env: /^(?:-[uCS]|--chdir|--unset|--split-string)$/`, r`env: /^(?:-[i0v]*[uCS]|--chdir|--unset|--split-string)$/`],
  [r`  const envAt = texts.slice(0, index).findIndex(word => /^env$/i.test(word));
  if (envAt !== -1) for (let i = envAt + 1; i < index; i++) {
    const word = texts[i];
    const value = word === '-C' || word === '--chdir' ? texts[i + 1] : word.startsWith('--chdir=') ? word.slice(8) : /^-C./.test(word) ? word.slice(2) : undefined;`,
  r`  const envAt = texts.slice(0, index).findIndex(word => commandName(word) === 'env');
  if (envAt !== -1) for (let i = envAt + 1; i < index; i++) {
    const word = texts[i];
    const cluster = /^-[i0v]*C(.*)$/s.exec(word);
    const value = cluster ? cluster[1] || texts[i + 1] : word === '--chdir' ? texts[i + 1] : word.startsWith('--chdir=') ? word.slice(8) : undefined;`],
  [r`|(?:^|[\s;&|('"])env(?:\s+-[uS]\s+\S+|\s+(?!-C|--chdir|-[uS]\s)-\S+)*\s+(?:-C\s*|--chdir[=\s]\s*)['"]?([A-Za-z0-9_.~/\\:-]+)/gi;`,
    r`|(?:^|[\s;&|('"])(?:[^\s;&|('"]*[\\/])?env(?:\.exe)?(?:\s+(?:-[i0v]*[uS]|--unset|--split-string)\s+\S+|\s+(?!-[i0v]*C|--chdir|-[i0v]*[uS]\s|--unset\s|--split-string\s)-\S+)*\s+(?:-[i0v]*C\s*|--chdir[=\s]\s*)['"]?([A-Za-z0-9_.~/\\:-]+)/gi;`],
  // R6 (d): the command text of a runner.
  [r`function evaluatedText(words) {
  const texts = words.slice(programIndex(words));`,
    r`function evaluatedText(words) {
  const at = programIndex(words);
  const before = words.slice(0, at);
  if (before.some(word => /^(?:npx|pnpx|bunx|npm|pnpm|yarn|bun)$/.test(commandName(word)))) {
    const attached = before.find(word => word.startsWith('--call='));
    if (attached) return attached.slice(7);
    if (/^(?:-c|--call)$/.test(before.at(-1) || '') && words[at]) return words[at];
  }
  const texts = words.slice(at);`],
  // R6 (a): one reader of a call's arguments replaces the expressions per spelling of an open call.
  [r`const API_OPEN = /\bopen(?:Sync)?\s*\(\s*(?:file\s*=\s*)?r?(['"])([^'"]+)\1\s*,\s*(?:(?:mode|flags)\s*=\s*)?r?['"]([^'"]*)['"]/g;
const API_OPEN_KEYWORD = /\bopen(?:Sync)?\s*\(\s*(?:file\s*=\s*)?r?(['"])([^'"]+)\1(?:\s*,\s*\w+\s*=\s*(?:r?['"][^'"]*['"]|[-\w.]+))+\s*,\s*(?:mode|flags)\s*=\s*r?['"]([^'"]*)['"]/g;
`, r`const CALL_SCAN = 4096;
function callShape(text, start) {
  const positional = [], named = new Map(), spread = [];
  const put = raw => {
    const argument = raw.trim();
    if (!argument) return;
    const keyword = /^(\w+)\s*=(?!=)\s*(.*)$/s.exec(argument);
    if (argument.startsWith('**')) spread.push(argument); else if (keyword) named.set(keyword[1], keyword[2]); else positional.push(argument);
  };
  let depth = 0, quote = '', from = start, i = start;
  for (const end = Math.min(text.length, start + CALL_SCAN); i < end; i++) {
    const ch = text[i];
    if (quote) { if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) { if (depth === 0) break; depth--; }
    else if (ch === ',' && depth === 0) { put(text.slice(from, i)); from = i + 1; }
  }
  put(text.slice(from, i));
  return { positional, named, spread };
}
const stringValue = argument => /^[a-z]*(['"])([^'"]+)\1$/i.exec(argument || '')?.[2];
const writesOpen = argument => typeof argument === 'string' && (/\bO_(?:WRONLY|RDWR|CREAT|TRUNC|APPEND)\b/.test(argument) || /^[1-9]\d*$/.test(argument)
  || /[wax+]/.test(/['"]([^'"]*)['"]/.exec(argument)?.[1] ?? ''));
const spreadModes = spread => spread.flatMap(item => [.../['"](?:mode|flags)['"]\s*:\s*([^,}]+)/g[Symbol.matchAll](item)].map(m => m[1]));
function openTargets(text) {
  const found = [];
  for (const match of text.matchAll(/\bopen(?:Sync)?\s*\(/g)) {
    const { positional, named, spread } = callShape(text, match.index + match[0].length);
    const file = stringValue(named.get('file') ?? positional.shift());
    if (file && [named.get('mode'), named.get('flags'), positional[0], ...spreadModes(spread)].some(writesOpen)) found.push(file);
  }
  for (const match of text.matchAll(/Path\(\s*r?['"]([^'"]+)['"]\s*\)\s*\.\s*open\s*\(/g)) {
    const { positional, named, spread } = callShape(text, match.index + match[0].length);
    if ([named.get('mode'), positional[0], ...spreadModes(spread)].some(writesOpen)) found.push(match[1]);
  }
  for (const match of text.matchAll(/\]::Open\s*\(/gi)) {
    const { positional } = callShape(text, match.index + match[0].length);
    const file = stringValue(positional[0]);
    if (file && (/\b(?:CreateNew|Create|Append|Truncate|OpenOrCreate)\b|^[12456]$/i.test(positional[1] || '') || /\b(?:ReadWrite|Write)\b|^[23]$/i.test(positional[2] || ''))) found.push(file);
  }
  return found;
}
`],
  [r`const API_NET_OPEN = /\]::Open\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"]|\[[\w.]*FileMode\]::)(?:CreateNew|Create|Append|Truncate|OpenOrCreate)\b/gi;
`, ''],
  [r`(?:unlink\s*\(|touch\s*\(|open\s*\(\s*(?:\w+\s*=\s*(?:r?['"][^'"]*['"]|[-\w.]+)\s*,\s*)*(?:mode\s*=\s*)?r?['"][^'"]*[wax+][^'"]*['"]|(rename|replace)`,
    r`(?:unlink\s*\(|touch\s*\(|(rename|replace)`],
  [r`    ...[...text.matchAll(API_OPEN)].filter(m => /[wax+]/.test(m[3])).map(m => m[2]),
    ...[...text.matchAll(API_OPEN_KEYWORD)].filter(m => /[wax+]/.test(m[3])).map(m => m[2]),
    ...[...text.matchAll(API_CREATE)].map(m => m[1]), ...[...text.matchAll(API_NET_OPEN)].map(m => m[1]),`,
  r`    ...openTargets(text), ...[...text.matchAll(API_CREATE)].map(m => m[1]),`],
  // R6 (b): the keyword name of os.removedirs.
  [r`\s*\(\s*(?:path\s*=\s*)?r?['"]([^'"]+)['"]`, r`\s*\(\s*(?:(?:path|name)\s*=\s*)?r?['"]([^'"]+)['"]`],
  // R6 (e): one list of raw readings for the folder words, the API forms and the child-process calls.
  [r`  for (const first of starts) {
    let current = first;
    for (const match of command.matchAll(RAW_FOLDER_WORD)) {`,
    r`  const readings = [...new Set([command, command.replace(/\\"|` + '`' + r`"/g, '"')])];
  for (const first of starts) for (const text of readings) {
    let current = first;
    for (const match of text.matchAll(RAW_FOLDER_WORD)) {`],
  [r`  for (const text of new Set([command, command.replace(/\\"/g, '"')])) {
    for (const raw of apiArguments(text))`, r`  for (const text of readings) {
    for (const raw of apiArguments(text))`],
  [r`  if (depth < 3) for (const match of command.matchAll(CHILD_CALL)) {`, r`  if (depth < 3) for (const text of readings) for (const match of text.matchAll(CHILD_CALL)) {`],
  // R6 (c): a nested command text keeps its quoted words.
  [r`        words = inner.split(/\s+/).filter(Boolean);`,
    r`        words = [...inner.matchAll(/'([^']*)'|"([^"]*)"|\S+/g)].map(m => m[1] ?? m[2] ?? m[0]).filter(Boolean);`],
];

const live = readFileSync(join(gates, 'security-hook.mjs'), 'utf8').replace(/\r\n/g, '\n');
let text = live;
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

// A. The 23 forms of the Task 942 completion report, then the other spellings of their classes.
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', P = 'scripts/check-example.mjs', Y = `docs/${N}`;
const forms = (x, d, n) => [
  `python -c "open(mode='w', file='${x}')"`, `python -c "import os; os.removedirs(name='${d}')"`,
  `powershell -Command "[IO.File]::Open('${x}', 2)"`, `powershell -Command "[IO.File]::Open('${x}', [IO.FileMode]'Create')"`, `powershell -Command "[IO.File]::Create(\`"${x}\`")"`,
  `/usr/bin/env -C ${d} bash -c 'rm ${n}'`, `env --unset HOME -C ${d} python -c "open('${n}','w')"`, `env -C ${d} bash -c "bash -c 'rm ${n}'"`,
  `npm exec --package foo -- touch ${x}`, `npm --prefix . exec rimraf ${x}`, `pnpm -C . exec rimraf ${x}`,
  `npm exec -c 'rimraf ${x}'`, `npm exec --call 'rm ${x}'`, `npx -c 'rm ${x}'`, `pnpm rimraf ${x}`, `bun rimraf ${x}`, `yarn run rimraf ${x}`, `npm run rimraf ${x}`,
  `env -iC ${d} bash -c 'rm ${n}'`, `python -c "import os; os.open('${x}', os.O_WRONLY)"`, `node -e "require('fs').openSync('${x}', require('fs').constants.O_WRONLY)"`,
  `python -c "open('${x}', **{'mode': 'w'})"`, `python -c "import os; os.chdir('${d}'); os.system(\\"rm ${n}\\")"`,
  // The other spellings of the same classes.
  `python -c "open(mode='a', encoding='utf8', file='${x}')"`, `python -c "from pathlib import Path; Path('${x}').open(**{'mode': 'a'})"`,
  `powershell -Command "[IO.File]::Open('${x}', 6)"`, `powershell -Command "[IO.File]::Open('${x}', 'Open', 'Write')"`, `powershell -Command "[IO.File]::Open('${x}', [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite)"`,
  `/usr/bin/env -C ${d} python -c "open('${n}','w')"`, `/usr/bin/sudo rm ${x}`, `env --unset=HOME -C ${d} bash -c 'rm ${n}'`, `env -iC${d} bash -c 'rm ${n}'`, `env -iC ${d} python -c "open('${n}','w')"`, `env -vi -C ${d} bash -c 'rm ${n}'`,
  `npm exec --package=foo -- touch ${x}`, `npx --package foo -- touch ${x}`, `pnpm --dir . dlx rimraf ${x}`, `yarn --cwd . exec rimraf ${x}`, `npm -w app exec rimraf ${x}`,
  `npm exec --call='rm ${x}'`, `pnpm exec -c 'rm ${x}'`, `pnpm run shx rm ${x}`, `bun run rimraf ${x}`, `yarn --cwd . rimraf ${x}`,
  `python -c "import os; os.open('${x}', os.O_CREAT | os.O_TRUNC)"`, `node -e "require('fs').openSync('${x}', 1)"`, `python -c "import os; os.chdir(\\"${d}\\"); os.system('rm ${n}')"`,
];
const CONTROLS = [`python -c "open(mode='r', file='${X}')"`, `python -c "open(file='${X}', encoding='utf8')"`, `python -c "import os; os.open('${X}', os.O_RDONLY)"`,
  `node -e "require('fs').openSync('${X}', 0)"`, `node -e "require('fs').openSync('${X}', require('fs').constants.O_RDONLY)"`, `python -c "open('${X}', **{'mode': 'r'})"`, `python -c "open('${X}', **{'encoding': 'w'})"`,
  `python -c "open('${X}', 'r', -1, 'w')"`, `python -c "from pathlib import Path; Path('${X}').open(**{'mode': 'r'})"`,
  `powershell -Command "[IO.File]::Open('${X}', 3)"`, `powershell -Command "[IO.File]::Open('${X}', [IO.FileMode]'Open')"`, `powershell -Command "[IO.File]::Open('${X}', 'Open', 'Read')"`, `powershell -Command "[IO.File]::ReadAllText(\`"${X}\`")"`,
  `/usr/bin/env -C docs bash -c 'rm ${N}'`, `/usr/bin/env cat ${X}`, `env -iC docs bash -c 'rm ${N}'`, `env --unset HOME -C docs python -c "open('${N}','w')"`, `env -C ${D} bash -c "bash -c 'cat ${N}'"`,
  `npm --prefix . run build ${X}`, `npm --prefix . exec tsc ${X}`, `npm exec --package foo -- tsc ${X}`, `npm exec -c 'cat ${X}'`, `npx -c 'cat ${X}'`, `npm run test ${X}`, `yarn run test ${X}`, `pnpm test ${X}`, `bun test ${X}`,
  `pnpm -C . install`, `python -c "import os; os.chdir(\\"${D}\\"); os.system(\\"cat ${N}\\")"`, `node -e "window.open('${X}')"`];
const fx = mkdtempSync(join(tmp, 'lero-942-r4-'));
for (const file of [X, P, Y]) { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), 'a\n'); }
const executor = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: fx, tool_input: { command } });
let alreadySeen = 0;
for (const command of forms(X, D, N)) {
  const now = current.shellWriteTargets(fx, command, fx).includes(X), then = proto.shellWriteTargets(fx, command, fx).includes(X);
  if (now) alreadySeen++;
  expect(`form reported by the prototype: ${command}`, then, `current ${now}; prototype ${then}`);
}
out.push(`forms ${forms(X, D, N).length}; already reported by the current hook ${alreadySeen}`);
for (const command of forms(P, 'scripts', 'check-example.mjs')) {
  const errors = proto.evaluateHook(fx, executor(command), '');
  expect(`executor refused: ${command}`, /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/.test(errors.join('\n')), errors[0]?.slice(0, 70));
}
for (const command of CONTROLS) expect(`control reports no X: ${command}`, !proto.shellWriteTargets(fx, command, fx).includes(X));

// D (part). Hostile lengths, against the hook timeout of 15 s.
const hostile = { 'open calls': 'open('.repeat(10000), 'open commas': `open('x'${",".repeat(50000)}`, 'open brackets': `open(${'('.repeat(50000)}`, 'unclosed quote': `open('${'x'.repeat(50000)}`, 'path open': `Path('x').open(`.repeat(3400), 'net open': ']::Open('.repeat(7000),
  'manager options': `npm ${'-a '.repeat(16000)}x`, 'env cluster': `env -${'i'.repeat(50000)} x '`, 'env options': `/bin/env ${'-a '.repeat(16000)}x '`, 'env path': `${'/a'.repeat(25000)}/env -C d '`, 'nested': `bash -c "${"'a' ".repeat(12000)}" '`, 'escaped': `python -c "${'\\"'.repeat(25000)}"`, 'backtick quotes': `x "${'`"'.repeat(25000)}"`};
for (const [name, command] of Object.entries(hostile)) {
  const t0 = performance.now();
  proto.shellWriteTargets(fx, command, fx);
  const ms = Math.round(performance.now() - t0);
  expect(`hostile ${name}, ${command.length} characters: ${ms} ms`, ms < 3000);
}
rmSync(fx, { recursive: true, force: true });

// B. The unchanged suite against the prototype: the Task 944 load hook replaces the whole text of the hook, in memory, in every test process.
const spec = join(work, 'whole-hook.break.json');
writeFileSync(spec, JSON.stringify({ version: 1, case: 'p11', target: 'scripts/workflow-gates/security-hook.mjs', find: live, replace: text }));
const suite = spawnSync(process.execPath, ['scripts/workflow-gates/selftests.mjs'], { encoding: 'utf8', timeout: 290000, maxBuffer: 1 << 28,
  env: { ...process.env, NODE_OPTIONS: `--import=${real('sensitivity-register.mjs')}`, SENSITIVITY_BREAK: spec } });
const totals = (suite.stdout || '').split('\n').filter(line => /^# (?:tests|pass|fail|skipped) /.test(line)).join(', ');
expect(`whole self-test suite unchanged against the prototype (${totals})`, suite.status === 0, (suite.stdout || '').split('\n').filter(line => /^not ok/.test(line)).slice(0, 6).join(' / '));

// C. The frozen corpus.
const corpus = JSON.parse(readFileSync(join(root, 'test-results/task943-prototype/corpus.json'), 'utf8'));
out.push(`corpus ${corpus.length} commands, sha256 ${createHash('sha256').update(JSON.stringify(corpus)).digest('hex')}`);
const { isPolicyPath, isProductPath } = await import(real('contract.mjs'));
const { allContracts, readJson } = await import(real('cli.mjs'));
const guarded = t => !t.startsWith('../') && !/^[A-Za-z]:/.test(t) && (isPolicyPath(t) || isProductPath(t) || /^(?:tasks|docs|\.git)\//i.test(t));
const scopes = new Set();
for (const path of allContracts(root)) { try { const c = readJson(root, path); if (c.kind === 'governance') for (const s of c.scope || []) scopes.add(s.toLowerCase()); } catch { /* unreadable */ } }
let added = 0, guardedAdded = 0, dropped = 0, refused = 0, scopeHits = 0, slowest = 0;
const examples = [];
const short = command => JSON.stringify(command.length > 160 ? `${command.slice(0, 160)}...` : command);
for (const [command, cwd] of corpus) {
  const t0 = performance.now();
  const after = proto.shellWriteTargets(root, command, cwd);
  slowest = Math.max(slowest, performance.now() - t0);
  const before = current.shellWriteTargets(root, command, cwd);
  if (before.some(t => !after.includes(t))) { dropped++; examples.push(`  dropped ${short(before.filter(t => !after.includes(t)).join(' '))} for ${short(command)}`); }
  const extra = after.filter(t => !before.includes(t));
  if (extra.length) added++;
  if (extra.some(guarded)) { guardedAdded++; if (examples.length < 30) examples.push(`  added guarded ${short(extra.filter(guarded).slice(0, 3).join(' '))} for ${short(command)}`); }
  if (extra.some(t => scopes.has(t.toLowerCase()))) { scopeHits++; examples.push(`  scope hit ${short(extra.filter(t => scopes.has(t.toLowerCase())).slice(0, 3).join(' '))} for ${short(command)}`); }
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, cwd, tool_input: { command } };
  if (!current.evaluateHook(root, event, '').length) {
    const after2 = proto.evaluateHook(root, event, '');
    if (after2.length) { refused++; examples.push(`  newly refused (${after2[0].split(':')[0]}) ${short(command)}`); }
  }
}
out.push(`corpus: dropped ${dropped}; with added targets ${added}; with an added guarded target ${guardedAdded}; executor commands newly refused ${refused}; with an added governance scope file ${scopeHits}; slowest prototype call ${Math.round(slowest)} ms`);
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

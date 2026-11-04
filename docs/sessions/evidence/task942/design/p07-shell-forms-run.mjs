// Task 942 revision 2 feasibility run (Task 944 review 3 session, owner D20, 2026-11-04). Run from the project root on native
// Windows: node docs/sessions/evidence/task942/design/p07-shell-forms-run.mjs
// The prototype is the current hook with the PAIRS below applied (each `find` exactly once), written to the gitignored
// test-results/task942-r2/security-hook.mjs; the live hook is not changed. A design prototype to read, not code to paste.
// A. The R4 forms report X and their executor forms are refused; the controls stay silent; each form was missed by the current hook.
// B. Every gate self-test that imports security-hook.mjs, unchanged, against the prototype.
// C. The frozen 2318-command corpus, current hook versus prototype. D. The 5000-folder-change commands on the prototype.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const work = join(root, 'test-results/task942-r2');
mkdirSync(join(work, 'tests'), { recursive: true });
const tmp = tmpdir();
const redact = text => text.split(tmp).join('<tmp>').split(tmp.replaceAll('\\', '/')).join('<tmp>')
  .replace(/(?:[A-Za-z]:|\/[a-z])[\\/]+Users[\\/]+[^\\/"'\s]+/gi, '<user-home>');
const out = [];
let failures = 0;
const expect = (id, ok, detail) => { if (!ok) failures++; out.push(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? ` | ${redact(detail)}` : ''}`); };
const real = file => pathToFileURL(join(gates, file)).href;

const PAIRS = [
  // R4 (a): a backtick may stand directly before or after a program word.
  ["const WORD = name => `(?<![^\\\\s;|&(){}'\"])(?:${name})(?![^\\\\s;|&(){}'\"])`;",
    "const WORD = name => `(?<![^\\\\s;|&(){}'\"\\`])(?:${name})(?![^\\\\s;|&(){}'\"\\`])`;"],
  // R4 (b): `-0` takes octal digits or x and hex digits, and the cluster goes on.
  [String.raw`\\s['"]?-[A-CF-HJ-LN-Za-cf-hj-ln-wyz]*i` + '`),',
    String.raw`\\s['"]?-(?:0(?:x[0-9A-Fa-f]*|[0-7]*))?[A-CF-HJ-LN-Za-cf-hj-ln-wyz]*i` + '`),'],
  [String.raw`if (perl && 'IMmdDx0'.includes(arg[j])) break; // the rest of the word is the option's value`,
    String.raw`if (perl && arg[j] === '0') { j += /^(?:x[0-9A-Fa-f]*|[0-7]*)/.exec(arg.slice(j + 1))[0].length; continue; }
          if (perl && 'IMmdDx'.includes(arg[j])) break; // the rest of the word is the option's value`],
  // R4 (c): the folder of `env -C` also applies to the command text and the API paths of the program it runs.
  [String.raw`  const envAt = texts.slice(0, index).findIndex(word => /^env$/i.test(word));
  if (envAt !== -1) for (let i = envAt + 1; i < index; i++) {
    const word = texts[i];
    const value = word === '-C' || word === '--chdir' ? texts[i + 1] : word.startsWith('--chdir=') ? word.slice(8) : /^-C./.test(word) ? word.slice(2) : undefined;
    if (movedFolder(value)) folder = resolve(folder, spelling(value));
  }
`, `  folder = envFolder(texts, folder);\n`],
  [String.raw`// Targets of one simple command of section 5 and R15, resolved in ` + '`folder`',
    String.raw`function envFolder(texts, start) {
  const index = programIndex(texts);
  let folder = start;
  const envAt = texts.slice(0, index).findIndex(word => /^env$/i.test(word));
  if (envAt !== -1) for (let i = envAt + 1; i < index; i++) {
    const word = texts[i];
    const value = word === '-C' || word === '--chdir' ? texts[i + 1] : word.startsWith('--chdir=') ? word.slice(8) : /^-C./.test(word) ? word.slice(2) : undefined;
    if (movedFolder(value)) folder = resolve(folder, spelling(value));
  }
  return folder;
}
// Targets of one simple command of section 5 and R15, resolved in ` + '`folder`'],
  [String.raw`      for (const raw of apiArguments(texts.join(' '))) resolveIn(raw, folders, false);
      for (const raw of apiDirectories(texts.join(' '))) underIn(raw, folders);`,
    String.raw`      const moved = [...new Set([resolve(root), ...folders].map(folder => envFolder(texts, folder)))];
      for (const raw of apiArguments(texts.join(' '))) resolveIn(raw, [...folders, ...moved], false);
      for (const raw of apiDirectories(texts.join(' '))) underIn(raw, [...folders, ...moved]);`],
  [String.raw`        for (const folder of new Set([resolve(root), ...folders])) for (const path of uncachedShellWriteTargets(root, inner, folder, depth + 1)) add(path);
      }
    }
  }
  if (readOnly`,
    String.raw`        for (const folder of new Set([resolve(root), ...folders, ...moved])) for (const path of uncachedShellWriteTargets(root, inner, folder, depth + 1)) add(path);
      }
    }
  }
  if (readOnly`],
  [String.raw`    for (let words of parts) {
      for (let inner = evaluatedText(words);`,
    String.raw`    for (let words of parts) {
      const here = current.map(folder => envFolder(words, folder));
      for (let inner = evaluatedText(words);`],
  [String.raw`      for (const folder of new Set([resolve(root), ...current])) {
        for (const path of programTargets(root, folder, words, [words])) if (fileLike(path)) found.push(path);`,
    String.raw`      for (const folder of new Set([resolve(root), ...current, ...here])) {
        for (const path of programTargets(root, folder, words, [words])) if (fileLike(path)) found.push(path);`],
  // The same folder in the raw-text reading: `env -C` is a folder word for a command the parser rejects (a quoted `open(…)`).
  [String.raw`|\b(?:process|os)\.chdir\(\s*['"]([^'"]+)['"]/gi;`,
    String.raw`|\b(?:process|os)\.chdir\(\s*['"]([^'"]+)['"]|(?:^|[\s;&|('"])env\s+(?:-C\s*|--chdir[=\s]\s*)['"]?([A-Za-z0-9_.~/\\:-]+)/gi;`],
  [String.raw`      const value = match[1] || match[2];
      if (!movedFolder(value)) continue;
      current = resolve(current, spelling(value));`,
    String.raw`      const value = match[1] || match[2] || match[3];
      if (!movedFolder(value)) continue;
      current = resolve(current, spelling(value));`],
  // R4 (d): the package-manager runners.
  [String.raw`    const word = texts[index];
    if (SHELL_KEYWORD.test(word)) { index++; continue; }`,
    String.raw`    const word = texts[index];
    if (SHELL_KEYWORD.test(word)) { index++; continue; }
    const next = texts[index + 1] || '';
    if (/^(?:npm|pnpm|bun|yarn)$/i.test(word) && /^(?:exec|x|dlx)$/i.test(next) && !(/^bun$/i.test(word) && !/^x$/i.test(next))) { wrapper = 'npx'; index += 2; continue; }
    if (/^yarn$/i.test(word) && /^(?:rimraf|shx)$/i.test(next)) { index++; continue; }`],
  // R4 (e): open(file=...), os.removedirs and [IO.File]::Open with a mode that creates, appends or truncates.
  [String.raw`const API_OPEN = /\bopen(?:Sync)?\s*\(\s*r?(['"])`, String.raw`const API_OPEN = /\bopen(?:Sync)?\s*\(\s*(?:file\s*=\s*)?r?(['"])`],
  [String.raw`${'$'}{API_QUALIFIER}(?:rm|rmdir|rmtree|Delete))`, String.raw`${'$'}{API_QUALIFIER}(?:rm|rmdir|rmtree|removedirs|Delete))`],
  [String.raw`const API_PATHLIB_CHANGE =`,
    String.raw`const API_NET_OPEN = /\]::Open\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"]|\[[\w.]*FileMode\]::)(?:CreateNew|Create|Append|Truncate|OpenOrCreate)\b/gi;
const API_PATHLIB_CHANGE =`],
  [String.raw`...[...text.matchAll(API_CREATE)].map(m => m[1]),`, String.raw`...[...text.matchAll(API_CREATE)].map(m => m[1]), ...[...text.matchAll(API_NET_OPEN)].map(m => m[1]),`],
];

const protoPath = join(work, 'security-hook.mjs');
let text = readFileSync(join(gates, 'security-hook.mjs'), 'utf8').replace(/\r\n/g, '\n')
  .replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
  .replace("new URL('./hook-load-check.mjs', import.meta.url)", `new URL('${real('hook-load-check.mjs')}')`);
for (const [find, replace] of PAIRS) {
  const count = text.split(find).length - 1;
  expect(`pair applies once: ${find.slice(0, 60).replace(/\n/g, ' ')}`, count === 1, count === 1 ? '' : `found ${count} times`);
  text = text.replace(find, () => replace);
}
writeFileSync(protoPath, text);
const live = await import(real('security-hook.mjs'));
const proto = await import(pathToFileURL(protoPath).href);

// A. R4 forms.
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', Y = `docs/${N}`, P = 'scripts/check-example.mjs';
const forms = (x, d, n) => [
  `echo \`rm ${x}\``, `echo \`cp ${Y} ${x}\``,
  `perl -0pi -e 's/a/b/' ${x}`, `perl -0777pi -e 's/a/b/' ${x}`, `perl -0x1Fpi -e 's/a/b/' ${x}`, `perl -0pi -e 's/a/b/' ${x} '`,
  `env -C ${d} bash -c 'rm ${n}'`, `env --chdir=${d} bash -lc 'rm ${n}'`, `env --chdir ${d} sh -c 'rm ${n}'`, `env -C ${d} python -c "open('${n}','w')"`,
  `env -C ${d} node -e "require('fs').rmSync('${n}')"`, `env -C ${d} bash -c 'rm ${n}'; echo '`,
  `npm exec rimraf ${x}`, `npm exec --yes -- rimraf ${x}`, `npm x rimraf ${x}`, `pnpm exec rimraf ${x}`, `pnpm dlx rimraf ${x}`, `yarn rimraf ${x}`, `yarn exec rimraf ${x}`, `yarn dlx rimraf ${x}`, `bun x rimraf ${x}`, `yarn shx rm ${x}`,
  `python -c "open(file='${x}', mode='w')"`, `python -c "open(file='${x}', 'a')"`, `python -c "import os; os.removedirs('${d}')"`,
  `powershell -Command "[IO.File]::Open('${x}','Create')"`, `powershell -Command "[IO.File]::Open('${x}','Append')"`, `powershell -Command "[IO.File]::Open('${x}',[IO.FileMode]::Truncate)"`, `powershell -Command "[System.IO.File]::Open('${x}','OpenOrCreate')"`,
];
const CONTROLS = [`echo \`cat ${X}\``, `echo \`git log -1 -- ${X}\``, `perl -0ne 'print' ${X}`, `perl -0777 -ne 'print' ${X}`, `perl -0777ne 'print' ${X}`, `perl -0e 'print 1' ${X}`, `perl -0ne 'print' ${X} '`,
  `env -C ${D} bash -c 'cat ${N}'`, `env -C ${D} python -c "print(open('${N}').read())"`, `env -C docs bash -c 'rm ${N}'`,
  `npm exec tsc`, `npm run build ${X}`, `pnpm exec eslint ${X}`, `yarn test ${X}`, `yarn install`,
  `python -c "open(file='${X}')"`, `python -c "open(file='${X}', mode='r')"`, `python -c "import os; os.listdir('${D}')"`,
  `powershell -Command "[IO.File]::Open('${X}','Open')"`, `powershell -Command "[IO.File]::OpenRead('${X}')"`];
const fx = mkdtempSync(join(tmp, 'lero-942-r2-'));
for (const file of [X, P, Y, `docs/${N}`]) { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), 'a\n'); }
const executor = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: fx, tool_input: { command } });
for (const command of forms(X, D, N)) {
  const now = live.shellWriteTargets(fx, command, fx).includes(X), then = proto.shellWriteTargets(fx, command, fx).includes(X);
  expect(`form reported by the prototype, missed by the current hook: ${command}`, then && !now, `current ${now}; prototype ${then}`);
}
for (const command of forms(P, 'scripts', 'check-example.mjs')) {
  const errors = proto.evaluateHook(fx, executor(command), '');
  expect(`executor refused: ${command}`, /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/.test(errors.join('\n')), errors[0]?.slice(0, 70));
}
for (const command of CONTROLS) expect(`control reports no X: ${command}`, !proto.shellWriteTargets(fx, command, fx).includes(X));
rmSync(fx, { recursive: true, force: true });

// B. Hook-importing self-tests, unchanged apart from the import of the hook.
const hookTests = readdirSync(gates).filter(n => n.endsWith('.selftest.mjs') && readFileSync(join(gates, n), 'utf8').includes("from './security-hook.mjs'")).sort();
for (const name of hookTests) {
  const copy = readFileSync(join(gates, name), 'utf8')
    .replace("from './security-hook.mjs'", `from '${pathToFileURL(protoPath).href}'`)
    .replace(/^(import [^\n]*from |[\w ,]*\} from )'\.\/([\w.-]+\.mjs)'/gm, (_, head, file) => `${head}'${real(file)}'`) // real imports only, never fixture text
    .replace(/new URL\('\.\/([\w.-]+\.mjs)', import\.meta\.url\)/g, (_, file) => `new URL('${file === 'security-hook.mjs' ? pathToFileURL(protoPath).href : real(file)}')`)
    .replace(/const HOOK = fileURLToPath\(new URL\('[^']+'\)\);/, `const HOOK = ${JSON.stringify(protoPath)};`);
  const file = join(work, 'tests', `prototype-${name}`);
  writeFileSync(file, copy);
  const run = spawnSync(process.execPath, ['--test', file], { cwd: root, encoding: 'utf8', timeout: 300000 });
  const totals = run.stdout.split('\n').filter(line => /^. (pass|fail|skipped)/.test(line)).join(', ');
  expect(`self-test ${name} unchanged against the prototype (${totals.trim()})`, run.status === 0, run.status === 0 ? '' : run.stdout.split('\n').filter(l => /not ok|error:/.test(l)).slice(0, 4).join(' / '));
}

// C. Frozen corpus.
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
  const before = live.shellWriteTargets(root, command, cwd);
  if (before.some(t => !after.includes(t))) { dropped++; examples.push(`  dropped ${short(before.filter(t => !after.includes(t)).join(' '))} for ${short(command)}`); }
  const extra = after.filter(t => !before.includes(t));
  if (extra.length) added++;
  if (extra.some(guarded)) { guardedAdded++; if (examples.length < 30) examples.push(`  added guarded ${short(extra.filter(guarded).slice(0, 3).join(' '))} for ${short(command)}`); }
  if (extra.some(t => scopes.has(t.toLowerCase()))) { scopeHits++; examples.push(`  scope hit ${short(extra.filter(t => scopes.has(t.toLowerCase())).slice(0, 3).join(' '))} for ${short(command)}`); }
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, cwd, tool_input: { command } };
  if (!live.evaluateHook(root, event, '').length) {
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

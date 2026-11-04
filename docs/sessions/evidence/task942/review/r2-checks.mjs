// Task 942 approver checks (read-only). Usage from the project root: node docs/sessions/evidence/task942/review/r2-checks.mjs
// Needs test-results/task942-approver/hook-c60.mjs from r1-probes.mjs.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = process.cwd();
const real = file => pathToFileURL(join(root, 'scripts/workflow-gates', file)).href;
const c60 = await import(pathToFileURL(join(root, 'test-results/task942-approver/hook-c60.mjs')).href);
const final = await import(real('security-hook.mjs'));
const { isPolicyPath, isProductPath } = await import(real('contract.mjs'));
const { allContracts, readJson } = await import(real('cli.mjs'));
const section = title => console.log(`\n## ${title}`);

// 1. The AC8 and AC6 lists of the self-tests against the design lists, as text.
section('1. self-test lists against the design lists');
const strip = text => text.split('\n').filter(line => !/^\s*\/\//.test(line)).join('').replace(/\s+/g, '');
const between = (text, start, end) => { const a = text.indexOf(start); if (a < 0) throw new Error(`no ${start}`); const b = text.indexOf(end, a + start.length); return text.slice(a + start.length, b); };
const p11 = readFileSync('docs/sessions/evidence/task942/design/p11-class-forms-run.mjs', 'utf8');
const p07 = readFileSync('docs/sessions/evidence/task942/design/p07-shell-forms-run.mjs', 'utf8');
const p10 = readFileSync('docs/sessions/evidence/task942/design/p10-more-forms-run.mjs', 'utf8');
const classes = readFileSync('scripts/workflow-gates/shell-forms-classes.selftest.mjs', 'utf8');
const residual = readFileSync('scripts/workflow-gates/shell-forms-residual.selftest.mjs', 'utf8');
const lastForms = text => text.slice(text.lastIndexOf('const forms = ('));
const designForms = between(lastForms(p11), '=> [', '\n];');
const testForms = between(classes, 'function formsP11(x, d, n) {\n  return [', '\n  ];');
console.log('p11 forms equal the self-test as text:', strip(designForms).replace(/,$/, '') === strip(testForms).replace(/,$/, ''));
const designControls = between(p11.slice(p11.lastIndexOf('const CONTROLS = [')), 'const CONTROLS = [', '];');
console.log('p11 CONTROLS are the head of the self-test list:', strip(between(classes, 'const CONTROLS = [', '\n];')).startsWith(strip(designControls)));
for (const [name, text] of [['p07', p07], ['p10', p10]]) {
  const form = between(lastForms(text), '=> [', '\n];');
  const entries = [...form.matchAll(/`[^`]*(?:\\`[^`]*)*`/g)].map(m => m[0]);
  const missing = entries.filter(entry => !residual.includes(entry));
  console.log(`${name} forms: ${entries.length}; absent from the residual self-test as text: ${missing.length}`, missing.slice(0, 5));
}

// 2. The frozen corpus, the hook of C60 against the final hook (AC9).
section('2. corpus, C60 against final');
const corpus = JSON.parse(readFileSync('test-results/task943-prototype/corpus.json', 'utf8'));
console.log(`corpus ${corpus.length} commands, file sha256 ${createHash('sha256').update(readFileSync('test-results/task943-prototype/corpus.json')).digest('hex')}`);
const scopes = new Set();
for (const path of allContracts(root)) { try { const c = readJson(root, path); if (c.kind === 'governance') for (const s of c.scope || []) scopes.add(s.toLowerCase()); } catch { /* unreadable */ } }
let dropped = 0, added = 0, scopeHits = 0, refused = 0, slowest = 0;
for (const [command, cwd] of corpus) {
  const t0 = performance.now();
  const after = final.shellWriteTargets(root, command, cwd);
  slowest = Math.max(slowest, performance.now() - t0);
  const before = c60.shellWriteTargets(root, command, cwd);
  if (before.some(t => !after.includes(t))) { dropped++; console.log('  dropped', JSON.stringify(command.slice(0, 160))); }
  const extra = after.filter(t => !before.includes(t));
  if (extra.length) added++;
  if (extra.some(t => scopes.has(t.toLowerCase()))) scopeHits++;
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, cwd, tool_input: { command } };
  if (!c60.evaluateHook(root, event, '').length && final.evaluateHook(root, event, '').length) refused++;
}
console.log(`dropped ${dropped}; with added targets ${added}; added scope file ${scopeHits}; executor newly refused ${refused}; slowest final call ${Math.round(slowest)} ms`);

// 3. F8 and the hostile commands of the p11 file and the self-test, on the final hook (AC9).
section('3. AC9 timing, final hook');
const fx = mkdtempSync(join(tmpdir(), 'lero-942-approver2-'));
const time = (hook, command) => { const t0 = performance.now(); try { hook.shellWriteTargets(fx, command, fx); } catch (e) { return `THROW ${e.message.slice(0, 40)}`; } return Math.round(performance.now() - t0); };
const folders = n => Array.from({ length: n }, (_, i) => `cd d${i}`).join('; ');
console.log('F8 parsed 5000 folders:', time(final, `${folders(5000)}; echo y > z`), 'ms; c60', time(c60, `${folders(5000)}; echo y > z`), 'ms');
console.log('F8 parser-rejected 5000 folders:', time(final, `${folders(5000)}; echo $y > z`), 'ms; c60', time(c60, `${folders(5000)}; echo $y > z`), 'ms');
const hostile = { 'open calls': 'open('.repeat(10000), 'open commas': `open('x'${','.repeat(50000)}`, 'open brackets': `open(${'('.repeat(50000)}`, 'unclosed quote': `open('${'x'.repeat(50000)}`,
  'path open': 'Path(\'x\').open('.repeat(3400), 'net open': ']::Open('.repeat(7000), 'manager options': `npm ${'-a '.repeat(16000)}x`, 'env cluster': `env -${'i'.repeat(50000)} x '`,
  'env options': `/bin/env ${'-a '.repeat(16000)}x '`, 'env path': `${'/a'.repeat(25000)}/env -C d '`, 'nested': `bash -c "${"'a' ".repeat(12000)}" '`, 'escaped': `python -c "${'\\"'.repeat(25000)}"`,
  'backtick quotes': `x "${'`"'.repeat(25000)}"`, 'env words': `${'-/env '.repeat(16000)}'` };
for (const [name, command] of Object.entries(hostile)) console.log(`hostile ${name}: ${time(final, command)} ms`);

// 4. The reader multiplies by the folders of a nested text: the same length budget as F8 and the hostile list.
section('4. reader cost with folders, about 11 000 characters');
for (const [n, calls] of [[100, 2000], [200, 2000]]) {
  const command = `${folders(n)}; python -c "system('${'open('.repeat(calls)}')"`;
  const a = time(c60, command);
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { pathToFileURL } from 'node:url';
    const final = await import(${JSON.stringify(real('security-hook.mjs'))});
    const folders = n => Array.from({ length: n }, (_, i) => 'cd d' + i).join('; ');
    const command = folders(${n}) + '; python -c "system(\\'' + 'open('.repeat(${calls}) + '\\')"';
    const t0 = performance.now(); final.shellWriteTargets(${JSON.stringify(fx)}, command, ${JSON.stringify(fx)}); console.log(Math.round(performance.now() - t0));`],
  { encoding: 'utf8', timeout: 60000, cwd: root });
  console.log(`${n} folders, ${calls} open calls, ${command.length} characters: c60 ${a} ms; final ${child.error ? 'over 60000 ms (killed)' : `${child.stdout.trim()} ms`} ${child.stderr.slice(0, 120)}`);
}

// 5. A fuzz of the final hook with its own alphabet: an exception is a refusal at PreToolUse and breaks the independence check at Stop.
section('5. fuzz: exceptions and lost targets');
let seed = 942942;
const rnd = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
const alphabet = ['npm', 'npx', 'pnpm', 'yarn', 'bun', 'env', '/usr/bin/env', 'sudo', 'exec', 'x', 'dlx', 'run', 'rimraf', 'shx', 'rm', 'cat', 'bash', 'sh', 'python', 'node', 'eval', '-c', '-e', '--call', '--call=', "--call='rm a.b'", '--package', '-p', '-C', '-iC', '-iCd', '-u', '-S', '--unset', '--split-string', '--chdir', '--chdir=d', '--', '-', '--prefix', '-w', '-F', "'", '"', '\\"', '`"', '`', ';', '&&', '|', '(', ')', '{', '}', '$x', "open('a.b','w')", "open('a.b',", 'open(', "Path('a.b').open(", ']::Open(', "'a.b'", 'a.b', 'docs', '**{', "'mode':", "'w'", ',', '=', 'constructor', '__proto__', 'toString', 'hasOwnProperty'];
let thrown = 0, lost = 0; const examples = [];
for (let i = 0; i < 40000; i++) {
  const command = Array.from({ length: 1 + rnd(8) }, () => alphabet[rnd(alphabet.length)]).join(rnd(5) ? ' ' : '');
  let after; try { after = final.shellWriteTargets(fx, command, fx); } catch (e) { thrown++; if (examples.length < 8) examples.push(`THROW ${JSON.stringify(command)} ${e.message.slice(0, 60)}`); continue; }
  let before; try { before = c60.shellWriteTargets(fx, command, fx); } catch { continue; }
  const gone = before.filter(t => !after.includes(t) && !/['"]/.test(t));
  if (gone.length) { lost++; if (examples.length < 16) examples.push(`LOST ${JSON.stringify(gone.slice(0, 3))} for ${JSON.stringify(command)}`); }
}
console.log(`40000 commands: exceptions ${thrown}; commands with a lost target (no quote character in it) ${lost}`);
for (const line of examples) console.log(' ', line);
rmSync(fx, { recursive: true, force: true });

// 6. The gate's entry guard with a drive letter in another case in the working folder (Windows): a guard that reads false exits 0 with no scan.
section('6. the gate entry guard and the case of the drive letter');
if (process.platform === 'win32') {
  const lower = root.replace(/^[A-Z]:/, drive => drive.toLowerCase());
  const run = spawnSync(process.execPath, ['scripts/check-listing-visibility.mjs'], { cwd: lower, encoding: 'utf8' });
  console.log(`cwd ${lower.slice(0, 3)}...: exit ${run.status}; output lines ${(run.stdout || '').split('\n').filter(Boolean).length}; passed line ${/PASSED/.test(run.stdout)}`);
  const upper = spawnSync(process.execPath, ['scripts/check-listing-visibility.mjs'], { cwd: root.replace(/\\/g, '/').replace('Claude_Code_Projects', 'CLAUDE_CODE_PROJECTS'), encoding: 'utf8' });
  console.log(`folder in another case: exit ${upper.status}; output lines ${(upper.stdout || '').split('\n').filter(Boolean).length}; passed line ${/PASSED/.test(upper.stdout)}`);
}

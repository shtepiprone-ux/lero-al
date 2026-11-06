#!/usr/bin/env node
// Task 945 (owner, 2026-11-05): the mutation check. The defects are made by the real TypeScript parser and judged by the real Vitest and the real
// Node test runner of this project, on a temporary repository whose node_modules is a link to this project's. A fixture command would prove
// that the tool reads an exit code; these prove that a superficial test is told apart from a real one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { setImmediate, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { runCodeCheck, runCommand } from './code-check.mjs';
import { changedLines, matcher, mutantsOf, planOf, reportLines, runMutation, targetsOfTest } from './mutation-check.mjs';
import { applyMutant } from './mutation-loader.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const TOOL = join(ROOT, 'scripts/workflow-gates/code-check.mjs');
const REGISTRY = JSON.parse(readFileSync(join(ROOT, 'scripts/workflow-gates/code-check.json'), 'utf8'));
const NODE = `"${process.execPath.replaceAll('\\', '/')}"`;
const forms = (text, lines = null, file = 'a.ts') => mutantsOf(ts, file, text, lines).map(mutant => `${mutant.original} -> ${mutant.replacement}`);

function repository(t, files, { link = false, registry = null } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-mutation-'));
  const modules = join(root, 'node_modules');
  t.after(() => {
    // The link goes first and on its own, so that removing the folder can never reach what it points at.
    if (link) { if (process.platform === 'win32') spawnSync('cmd', ['/c', 'rmdir', modules]); else rmSync(modules, { force: true }); }
    if (!link || !existsSync(modules)) rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  });
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  for (const [file, text] of Object.entries({ '.gitignore': 'node_modules\ntest-results\n*.tsbuildinfo\n', ...files })) put(file, text);
  if (registry) put('scripts/workflow-gates/code-check.json', JSON.stringify(registry));
  if (link) {
    symlinkSync(join(ROOT, 'node_modules'), modules, 'junction');
    for (const file of ['vitest.config.ts', 'src/tests/setup.ts', 'src/tests/server-only-stub.ts', 'src/tests/next-cache-stub.ts', 'scripts/workflow-gates/mutation-vitest.config.mjs', 'scripts/workflow-gates/mutation-loader.mjs']) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      copyFileSync(join(ROOT, file), join(root, file));
    }
    put('package.json', '{ "name": "fixture", "private": true, "type": "module" }\n');
    put('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'esnext', moduleResolution: 'bundler', jsx: 'preserve', strict: true, noEmit: true, skipLibCheck: true, allowJs: true, types: ['vitest/globals'], paths: { '@/*': ['./src/*'] } }, include: ['src/**/*'] }));
  }
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('add', '-A');
  git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'base');
  return { root, put, git };
}
const REAL_CONFIG = { ...REGISTRY.mutation, perMutantMs: 30000 };
const judge = (root, files, config = REAL_CONFIG, ms = 150000) => runMutation({ root, config, files, deadline: Date.now() + ms, runCommand });

test('each kind of defect is made, and each one still parses', () => {
  const cases = [
    ['const a = b === c;', 'b === c', '==='], ['const a = b !== c;', 'b !== c', '!=='], ['const a = b < c;', 'b < c', '<'], ['const a = b >= c;', 'b >= c', '>='],
    ['const a = b && c;', 'b && c', '&&'], ['const a = b || c;', 'b || c', '||'],
  ];
  const flipped = { '===': '!==', '!==': '===', '<': '>=', '>=': '<', '&&': '||', '||': '&&' };
  for (const [text, , operator] of cases) assert.deepEqual(forms(text), [`${operator} -> ${flipped[operator]}`], text);
  assert.deepEqual(forms('const a = b ?? c;'), ['b ?? c -> ((b) && (c))']);
  assert.deepEqual(forms('const a = b ?? c ?? d;').length, 2, 'a chain of ?? stays valid text');
  assert.deepEqual(forms('const a = !b;'), ['!b -> b']);
  assert.deepEqual(forms('const a = true;'), ['true -> false']);
  assert.deepEqual(forms('const a = false;'), ['false -> true']);
  assert.deepEqual(forms('const a = b * c;'), ['* -> /']);
  assert.deepEqual(forms('const a = 41;'), ['41 -> 42']);
  assert.deepEqual(forms('if (b) c;'), ['b -> !(b)']);
  assert.deepEqual(forms('const a = b ? c : d;'), ['b -> !(b)']);
  assert.deepEqual(forms('if (!b) c;'), ['!b -> b'], 'a negated condition is not negated twice');
  assert.deepEqual(forms('throw e;'), ['throw e; -> ;']);
  assert.deepEqual(forms('await requireAdmin();'), ['await requireAdmin(); -> ;'], 'a guard call removed');
  assert.deepEqual(forms('count += 1;').filter(form => form.startsWith('count')), ['count += 1; -> ;']);
  assert.deepEqual(forms('function f() { return g(); }'), ['g() -> undefined']);
  assert.deepEqual(forms('count++;'), ['count++; -> ;']);
  assert.deepEqual(forms('++count;'), ['++count; -> ;']);
  assert.deepEqual(forms('-count;'), [], 'a sign alone writes nothing');
  assert.deepEqual(forms('if (-b) c;'), ['-b -> !(-b)'], 'only ! counts as already negated');
  assert.deepEqual(forms('const a = -b;'), [], 'and only ! can be dropped');
  assert.deepEqual(forms('const a = <T>b === c;'), ['=== -> !=='], 'a .ts file is read as TypeScript, where this is a cast');
  assert.deepEqual(forms('const a = <T>b === c;', null, 'a.tsx'), [], 'and a .tsx file as JSX, where it does not parse');
  // A replacement longer than the limit could not travel in the environment of a run.
  const named = length => `const a = ${'b'.repeat(length)} ?? c;`;
  assert.equal(forms(named(3989)).length, 1, 'exactly at the limit of 4000');
  assert.equal(forms(named(3990)).length, 0, 'one past it');
  assert.deepEqual(forms('const a = b.some(c);'), ['some -> every']);
  assert.deepEqual(forms('const a = Math.min(b, c);'), ['min -> max']);
});

test('what cannot change behaviour, or only says it in words, is not touched', () => {
  for (const text of [
    "'use server';", "import { a } from './b';", "export { a } from './b';", 'type A = { b: 1 };', 'interface A { b: true }', 'enum A { B = 1 }', 'declare const a: true;',
    "const a = 'b' + c;", 'const a = `b` + c;', "console.log('a');", "logger.warn('a');", 'function f() { return null; }', 'function f() { return undefined; }', 'function f() { return true; }'.replace('true', 'undefined'), 'const a: 1 = b as 1;', 'g;',
  ]) assert.deepEqual(forms(text), [], text);
});

test('only the given lines are broken, and one defect of each line comes before a second of any line', () => {
  const text = 'const a = b === c && d;\nconst e = f === g;\nconst h = i === j;\n';
  assert.deepEqual(forms(text, new Set([2])), ['=== -> !==']);
  const order = mutantsOf(ts, 'a.ts', text).map(mutant => mutant.line);
  assert.deepEqual(order, [1, 2, 3, 1], 'each line once, then the second defect of line 1');
  assert.deepEqual(forms('const a = b + 1 === c && d;'), ['=== -> !==', '&& -> ||', '+ -> -', '1 -> 2'], 'on one line by rank, then by position');
});

test('a defect in JSX is made in valid JSX, and a stray character is not', () => {
  const made = forms('export const A = ({ b }: { b: boolean }) => <div>{b ? 1 : 2}</div>;', null, 'a.tsx');
  assert.ok(made.includes('b -> !(b)'), made.join());
  assert.equal(forms('<div>', null, 'a.tsx').length, 0);
});

test('the changed lines are the ones this change wrote, and a new file is all new', t => {
  const { root, put } = repository(t, { 'src/a.ts': 'const a = 1;\nconst b = 2;\nconst c = 3;\n' });
  assert.deepEqual([...changedLines(root, 'src/a.ts')], [], 'no change');
  put('src/a.ts', 'const a = 1;\nconst b = 20;\nconst c = 3;\nconst d = 4;\n');
  assert.deepEqual([...changedLines(root, 'src/a.ts')], [2, 4]);
  put('src/a.ts', 'const a = 1;\nconst   b = 2;\nconst c = 3;\n');
  assert.deepEqual([...changedLines(root, 'src/a.ts')], [], 'white space writes no logic');
  put('src/new.ts', 'const a = 1;\n');
  assert.equal(changedLines(root, 'src/new.ts'), null);
});

test('the loader applies a mutant only at its own offsets of its own file, and reports what it did', t => {
  const folder = mkdtempSync(join(tmpdir(), 'lero-945-loader-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const script = join(folder, 'probe.mjs');
  const report = join(folder, 'report.log');
  const loader = join(ROOT, 'scripts/workflow-gates/mutation-loader.mjs').replaceAll('\\', '/');
  writeFileSync(script, `import { applyMutant } from 'file:///${loader.replace(/^\//, '')}';\nconsole.log(JSON.stringify([applyMutant(process.argv[2], process.argv[3])]));\n`);
  const probe = (text, path, mutant) => {
    rmSync(report, { force: true });
    const child = spawnSync(process.execPath, [script, text, path], { encoding: 'utf8', env: { ...process.env, CODE_CHECK_MUTANT: JSON.stringify({ report, ...mutant }) } });
    assert.equal(child.status, 0, child.stderr);
    return { out: JSON.parse(child.stdout)[0], said: existsSync(report) ? readFileSync(report, 'utf8').trim() : '' };
  };
  const key = process.platform === 'win32' ? 'c:/a/b.ts' : 'C:/a/b.ts';
  const mutant = { key, start: 2, end: 5, original: '===', replacement: '!==' };
  assert.deepEqual(probe('a === b', 'C:\\a\\b.ts', mutant), { out: 'a !== b', said: 'applied' });
  assert.deepEqual(probe('a === b', 'C:/a/b.ts?v=1', mutant), { out: 'a !== b', said: 'applied' }, 'a query is no other file');
  assert.deepEqual(probe('a === b', 'C:/a/other.ts', mutant), { out: 'a === b', said: '' }, 'another file is left alone');
  assert.deepEqual(probe('ab === b', 'C:/a/b.ts', mutant), { out: 'ab === b', said: 'mismatch' }, 'other text is reported, not broken at random');
  assert.equal(applyMutant('a === b', 'C:/a/b.ts'), 'a === b', 'no mutant, no change');
});

test('the plan: a source file by its changed lines, a selftest for a gate script, a changed test by what it tests, no test file itself', t => {
  const { root, put } = repository(t, {
    'src/lib/price.ts': 'export const price = 1;\n', 'src/lib/price.test.ts': "import { price } from './price';\nimport { other } from './other';\nit('p', () => expect(price + other).toBe(2));\n",
    'src/lib/other.ts': 'export const other = 1;\n', 'src/lib/mixed.test.ts': "import { price } from '@/lib/price';\nimport { other } from './other';\nimport { x } from 'vitest';\nit('m', () => expect(price + other + x).toBe(2));\n",
    'src/components/A.stories.tsx': 'export default {};\n', 'scripts/workflow-gates/gate.mjs': 'export const a = 1;\n', 'scripts/workflow-gates/gate.selftest.mjs': '', 'scripts/workflow-gates/lonely.mjs': 'export const a = 1;\n',
  });
  put('src/lib/price.ts', 'export const price = 2;\n');
  const plan = files => planOf(ts, root, REGISTRY.mutation, files);
  const [source] = plan(['src/lib/price.ts']);
  assert.deepEqual([...source.lines], [1]);
  assert.match(source.command, /vitest\.mjs related "src\/lib\/price\.ts" --run --bail=1 .*--config scripts\/workflow-gates\/mutation-vitest\.config\.mjs/);
  assert.equal(plan(['src/lib/price.ts'], true)[0].byTest, undefined);
  assert.deepEqual(plan(['src/components/A.stories.tsx']), [], 'a Story is no logic');
  assert.deepEqual(plan(['scripts/workflow-gates/gate.selftest.mjs']), [], 'a selftest breaks nothing of itself');
  assert.match(plan(['scripts/workflow-gates/gate.mjs'])[0].command, /^node --test scripts\/workflow-gates\/gate\.selftest\.mjs$/, 'the own selftest');
  assert.match(plan(['scripts/workflow-gates/lonely.mjs'])[0].command, /selftests\.mjs$/, 'the whole suite when it has none');
  assert.equal(plan(['scripts/workflow-gates/gate.mjs'])[0].concurrency, 1, 'a suite of fixtures runs alone');
  const byTest = plan(['src/lib/price.test.ts']);
  assert.deepEqual(byTest.map(item => [item.file, item.lines, item.byTest]), [['src/lib/price.ts', null, 'src/lib/price.test.ts']], 'a test of the same name as its module judges that module, all of it');
  assert.match(byTest[0].command, /vitest\.mjs run "src\/lib\/price\.test\.ts"/, 'and this test alone');
  assert.deepEqual(targetsOfTest(ts, root, 'src/lib/mixed.test.ts').sort(), ['src/lib/other.ts', 'src/lib/price.ts'], 'else every project module it imports, not a package');
  put('src/lib/folder/index.ts', 'export const inside = 1;\n');
  put('src/lib/data.json', '{}\n');
  put('src/lib/dynamic.test.ts', "import './folder';\nimport data from './data.json';\nit('d', async () => { const late = await import('./other'); expect(late.other + data).toBeTruthy(); });\n");
  assert.deepEqual(targetsOfTest(ts, root, 'src/lib/dynamic.test.ts').sort(), ['src/lib/folder/index.ts', 'src/lib/other.ts'], 'a folder by its index and a dynamic import count; data does not');
  assert.deepEqual(plan(['src/lib/price.ts', 'src/lib/price.test.ts']).map(item => [item.file, item.byTest]), [['src/lib/price.ts', undefined]], 'a module changed with its test is judged by its changed lines');
  assert.deepEqual(plan(['src/lib/gone.ts']), [], 'a deleted file breaks nothing');
  assert.deepEqual(plan(['notes.md']), [], 'no row, no plan');
  assert.deepEqual(plan(['scripts/workflow-gates/lonely.mjs', 'scripts/workflow-gates/gate.mjs', 'src/lib/price.ts']).map(item => item.file), ['src/lib/price.ts', 'scripts/workflow-gates/gate.mjs', 'scripts/workflow-gates/lonely.mjs'], 'product code, then an own selftest, then the whole suite');
  put('scripts/check-x.mjs', 'export const a = 1;\n');
  const [scanner] = plan(['scripts/check-x.mjs']);
  assert.match(scanner.command, /vitest\.mjs related/);
  assert.deepEqual(scanner.others.map(other => other.command), ['node scripts/workflow-gates/selftests.mjs'], 'a scanner has the gate suite to fall back on');
  assert.equal(scanner.others[0].concurrency, 1, 'with that row\'s own limit');
  assert.deepEqual(plan(['scripts/workflow-gates/lonely.mjs'])[0].others, [], 'two rows of one command: no command is its own fallback');
});

const GOOD = {
  'src/lib/price.ts': 'export const price = (value: number): number => {\n  if (value < 0) throw new Error("negative");\n  return value * 2;\n};\n',
  'src/lib/price.test.ts': "import { it, expect } from 'vitest';\nimport { price } from './price';\nit('doubles', () => expect(price(2)).toBe(4));\nit('refuses', () => expect(() => price(-1)).toThrow('negative'));\nit('zero', () => expect(price(0)).toBe(0));\n",
};

test('a real test catches the defects, a superficial one is named line by line, and the file under test keeps its text', async t => {
  const { root, put } = repository(t, GOOD, { link: true });
  const fresh = 'export const price = (value: number): number => {\n  if (value <= 0) throw new Error("negative");\n  return value * 3;\n};\n';
  put('src/lib/price.ts', fresh);
  // The check found this test's first form weak: with no case at 1, `value <= 0` could become `value <= 1` unseen.
  put('src/lib/price.test.ts', GOOD['src/lib/price.test.ts'].replace("expect(price(2)).toBe(4)", "expect(price(2)).toBe(6)").replace("it('zero', () => expect(price(0)).toBe(0));", "it('zero', () => expect(() => price(0)).toThrow('negative'));\nit('one', () => expect(price(1)).toBe(3));"));
  const [strong] = await judge(root, ['src/lib/price.ts']);
  assert.equal(strong.error, null, strong.error);
  assert.deepEqual(strong.survivors, [], JSON.stringify(strong));
  assert.ok(strong.caught >= 4, `caught ${strong.caught} of ${strong.total}`);
  assert.equal(readFileSync(join(root, 'src/lib/price.ts'), 'utf8'), fresh, 'the file on disk holds no defect');
  assert.equal(spawnSync('git', ['diff', '--stat', '--', 'src/lib/price.test.ts'], { cwd: root, encoding: 'utf8' }).status, 0);

  // The same code, under the kind of test the owner rejected: it calls the function and asserts nothing about what it does.
  put('src/lib/price.test.ts', "import { it, expect } from 'vitest';\nimport { price } from './price';\nit('works', () => { expect(price).toBeDefined(); expect(typeof price(2)).toBe('number'); });\n");
  const [weak] = await judge(root, ['src/lib/price.ts']);
  assert.equal(weak.error, null, weak.error);
  const lines = reportLines([weak]);
  assert.ok(weak.survivors.some(survivor => survivor.line === 3 && survivor.from === '*'), JSON.stringify(weak.survivors));
  assert.ok(weak.survivors.some(survivor => survivor.line === 2), JSON.stringify(weak.survivors));
  assert.match(lines['src/lib/price.ts'].join('\n'), /src\/lib\/price\.ts:3: `\*` became `\/`, and every test still passed/);
});

test('the control tells a broken harness from a caught defect, and a run that never loaded the file from a survivor', async t => {
  const { root, put } = repository(t, { ...GOOD, 'src/lib/unused.ts': 'export const unused = (a: boolean) => (a ? 1 : 2);\n', 'src/lib/fails.ts': 'export const fails = (a: number) => a === 1;\n', 'src/lib/fails.test.ts': "import { it, expect } from 'vitest';\nimport { fails } from './fails';\nit('fails', () => expect(fails(1)).toBe(false));\n" }, { link: true });
  put('src/lib/fails.ts', 'export const fails = (a: number) => a === 2;\n');
  const [broken] = await judge(root, ['src/lib/fails.ts'], { ...REAL_CONFIG, rows: REAL_CONFIG.rows.map(row => ({ ...row, run: row.run.replace('--config scripts/workflow-gates/mutation-vitest.config.mjs', '--config scripts/workflow-gates/no-such-config.mjs') })) });
  assert.match(broken.error, /its tests fail with no defect in it/, 'a harness that cannot run catches nothing');
  assert.equal(broken.caught, 0, 'and no defect counts as caught');

  put('src/lib/unused.ts', 'export const unused = (a: boolean) => (a ? 3 : 2);\n');
  const never = { ...REAL_CONFIG, rows: [{ paths: ['src/**/*.ts'], run: 'node node_modules/vitest/vitest.mjs run src/lib/price.test.ts --bail=1 --reporter=dot --config scripts/workflow-gates/mutation-vitest.config.mjs' }] };
  const [unloaded] = await judge(root, ['src/lib/unused.ts'], never);
  assert.equal(unloaded.notLoaded, true);
  assert.deepEqual(unloaded.survivors, [], 'a run that never loaded it is no survivor');
  assert.match(reportLines([unloaded])['src/lib/unused.ts'][0], /no run showed it loaded, so these tests may check nothing in it; a test that starts it through another program or replaces NODE_OPTIONS is not seen/);
});

test('a defect reaches a script a test starts as a process, and a Node test runner suite', async t => {
  const script = 'export const limit = value => value > 3;\nif (process.argv[2]) { console.log(limit(Number(process.argv[2]))); }\n';
  const { root, put } = repository(t, {
    'scripts/tool.mjs': script,
    'scripts/__tests__/tool.test.ts': "import { spawnSync } from 'node:child_process';\nimport { it, expect } from 'vitest';\nit('spawns', () => { expect(spawnSync(process.execPath, ['scripts/tool.mjs', '4'], { encoding: 'utf8' }).stdout.trim()).toBe('true'); expect(spawnSync(process.execPath, ['scripts/tool.mjs', '3'], { encoding: 'utf8' }).stdout.trim()).toBe('false'); });\n",
    'scripts/workflow-gates/gate.mjs': 'export const gate = value => value === 1;\nexport const other = value => value === 2;\nexport const unchanged = value => value === 5;\n',
    'scripts/workflow-gates/gate.selftest.mjs': "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { gate } from './gate.mjs';\ntest('gate', () => { assert.equal(gate(1), true); assert.equal(gate(2), false); });\n",
  }, { link: true });
  put('scripts/tool.mjs', script.replace('> 3', '>= 4'));
  const [viaProcess] = await judge(root, ['scripts/tool.mjs'], { ...REAL_CONFIG, rows: [{ paths: ['scripts/*.mjs'], run: 'node node_modules/vitest/vitest.mjs run scripts/__tests__/tool.test.ts --bail=1 --reporter=dot --config scripts/workflow-gates/mutation-vitest.config.mjs' }] });
  assert.equal(viaProcess.error, null, viaProcess.error);
  assert.equal(viaProcess.notLoaded, false, 'the loader reaches the spawned process');
  assert.ok(viaProcess.caught >= 1, JSON.stringify(viaProcess));

  put('scripts/workflow-gates/gate.mjs', 'export const gate = value => value === 1;\nexport const other = value => value === 3;\nexport const unchanged = value => value === 5;\n');
  const [viaSuite] = await judge(root, ['scripts/workflow-gates/gate.mjs']);
  assert.equal(viaSuite.error, null, viaSuite.error);
  assert.deepEqual(viaSuite.survivors.map(survivor => survivor.line), [2, 2], 'the untested export on the changed line is named, and the equally untested one on a line this change did not write is not');
  assert.deepEqual(readdirSync(join(root, 'test-results/code-check/mutants')), [], 'no report of a run stays behind');
});

test('time that runs out is counted as not tried, never as caught or passed', async t => {
  const { root, put } = repository(t, GOOD, { link: true });
  put('src/lib/price.ts', GOOD['src/lib/price.ts'].replace('* 2', '* 2 + 0'));
  const [none] = await judge(root, ['src/lib/price.ts'], REAL_CONFIG, 0);
  assert.equal(none.notTried, none.total, 'no time at all');
  assert.equal(none.caught, 0);
  assert.match(reportLines([none])['src/lib/price.ts'][0], /not tried because time ran out: node scripts\/workflow-gates\/mutation-check\.mjs --base=[0-9a-f]{40} src\/lib\/price\.ts tries them$/, 'and the agent is told how to try them, by the commit they differ from');
  const fake = async () => { throw new Error('no run may start'); };
  const [unstarted] = await runMutation({ root, config: REAL_CONFIG, files: ['src/lib/price.ts'], deadline: Date.now() - 1, runCommand: fake });
  assert.equal(unstarted.notTried, unstarted.total, 'a deadline in the past starts nothing');

  // Scripted runs: a hang of a mutant within its own limit is caught; a run cut off by the stage is not tried; a run that loaded nothing is undecided.
  let clock = 1000;
  const script = [
    { status: 0, ms: 10, applied: true }, { status: null, reason: 'timeout', ms: 10, applied: true }, { status: 1, ms: 10, applied: false }, { status: null, reason: 'spawn', ms: 10, applied: true },
  ];
  const scripted = async (text, _root, limit, env) => {
    const step = script.shift() ?? { status: 1, ms: 10, applied: true };
    const { report } = JSON.parse(env.CODE_CHECK_MUTANT);
    if (step.applied) { mkdirSync(dirname(report), { recursive: true }); writeFileSync(report, 'applied\n'); }
    clock += step.ms;
    return { status: step.status, reason: step.reason, output: '', limit };
  };
  const [counted] = await runMutation({ root, config: { ...REAL_CONFIG, concurrency: 1, perMutantMs: 1000 }, files: ['src/lib/price.ts'], deadline: 100000, runCommand: scripted, now: () => clock });
  assert.equal(counted.undecided, 2, 'exit 1 with nothing loaded, and a run that could not start');
  assert.equal(counted.caught, counted.total - 2, 'the hang and the rest');
  assert.deepEqual(counted.survivors, []);
  const cut = [{ status: 0, ms: 900, applied: true }, { status: null, reason: 'timeout', ms: 900, applied: true }];
  clock = 1000;
  const [stage] = await runMutation({ root, config: { ...REAL_CONFIG, concurrency: 1, perMutantMs: 5000 }, files: ['src/lib/price.ts'], deadline: 4000, runCommand: async (text, _root, limit, env) => {
    const step = cut.shift() ?? { status: 1, ms: 5000, applied: true };
    const { report } = JSON.parse(env.CODE_CHECK_MUTANT);
    writeFileSync(report, 'applied\n');
    clock += step.ms;
    return { status: step.status, reason: step.reason, output: '' };
  }, now: () => clock });
  assert.ok(stage.notTried >= 1, JSON.stringify(stage));
  assert.equal(stage.caught + stage.notTried, stage.total, JSON.stringify(stage));
});

test('the real registry: the check ends before the hook does, and every code row that runs tests has a way to break its files', () => {
  const settings = JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8'));
  for (const event of ['Stop', 'SubagentStop']) {
    const seconds = settings.hooks[event].flatMap(group => group.hooks).find(hook => hook.args?.some(arg => arg.endsWith('code-check.mjs'))).timeout;
    assert.ok(REGISTRY.mutation.hookMs < seconds * 1000, `${event}: a hook that reaches its own timeout renders no decision`);
  }
  assert.ok(REGISTRY.mutation.timeoutMs <= REGISTRY.mutation.hookMs);
  // On the real tree: a tracked file whose stop stage runs tests has a command that breaks it, or is named as no logic. A file of no row would pass in silence.
  const tracked = spawnSync('git', ['ls-files', '--', 'src', 'scripts'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }).stdout.split(/\r?\n/).filter(Boolean);
  const tested = REGISTRY.rows.filter(row => row.stop.some(command => /vitest\.mjs related|selftests\.mjs/.test(typeof command === 'string' ? command : command.run))).map(row => matcher(row.paths));
  const breakable = matcher(REGISTRY.mutation.rows.flatMap(row => row.paths));
  const skipped = matcher(REGISTRY.mutation.skip);
  const candidates = tracked.filter(file => /\.[cm]?[jt]sx?$/.test(file) && tested.some(matches => matches(file)));
  assert.ok(candidates.length > 1000, `the tree was read: ${candidates.length}`);
  assert.deepEqual(candidates.filter(file => !breakable(file) && !skipped(file)), [], 'no code file with tests is left out');
  assert.ok(existsSync(join(ROOT, 'scripts/workflow-gates/mutation-vitest.config.mjs')));
  for (const row of REGISTRY.mutation.rows.filter(entry => /vitest/.test(entry.run))) assert.match(row.run, /--allowOnly=false/, 'a mutant run cannot be narrowed by it.only');
});

// A run that records what it was given and answers from a script, so that limits and order can be read exactly.
function scriptedRuns(steps, clock) {
  const seen = [];
  const run = async (text, _root, limit, env) => {
    const step = steps.shift() ?? { status: 1, ms: 10 };
    seen.push({ limit, env, command: text });
    if (step.wait) await new Promise(done => setImmediate(done));
    if (!step.neverLoaded) writeFileSync(JSON.parse(env.CODE_CHECK_MUTANT).report, 'applied\n');
    clock.now += step.ms;
    return { status: step.status, reason: step.reason, output: '' };
  };
  return { run, seen };
}

const COSTLY = { 'src/a.ts': 'export const a = (b: number) => b === 1;\n', 'src/b.ts': 'export const b = (c: number) => c === 1;\n', 'src/c.ts': 'export const c = (d: number) => d === 1;\n', 'src/d.ts': 'export const d = (e: number) => e === 1;\n' };

test('a command measured as dearer than a file\'s share is not run again, and the time goes to the files a cheap command answers', async t => {
  const { root } = repository(t, COSTLY);
  const config = { concurrency: 1, perMutantMs: 1, rows: [{ paths: ['src/d.ts'], priority: 1, run: 'cheap' }, { paths: ['src/*.ts'], run: 'suite' }] };
  const clock = { now: 1000 };
  const { run, seen } = scriptedRuns([{ status: 0, ms: 100000 }, { status: 0, ms: 10 }], clock);
  const results = await runMutation({ root, config, files: Object.keys(COSTLY), all: true, deadline: 151000, runCommand: run, now: () => clock.now });
  const byFile = Object.fromEntries(results.map(result => [result.file, result]));
  assert.deepEqual(seen.filter(entry => entry.command === 'suite').length, 1, 'the dear control once, not once a file');
  for (const file of ['src/a.ts', 'src/b.ts', 'src/c.ts']) assert.equal(byFile[file].notTried, byFile[file].total, file);
  assert.ok(byFile['src/d.ts'].caught > 0, 'and the cheap one was tried');
  assert.equal(byFile['src/d.ts'].notTried, 0);
});

test('a file the first command never loads goes to the next, under that command, and only when no row loads it is it called unreached', async t => {
  const { root } = repository(t, { 'src/a.ts': COSTLY['src/a.ts'] });
  const config = { concurrency: 3, perMutantMs: 1, rows: [{ paths: ['src/*.ts'], run: 'first' }, { paths: ['src/*.ts'], run: 'second', concurrency: 1 }] };
  const clock = { now: 1000 };
  const moved = scriptedRuns([{ status: 0, ms: 10, neverLoaded: true }, { status: 0, ms: 10 }, { status: 1, ms: 10 }, { status: 1, ms: 10 }], clock);
  const [found] = await runMutation({ root, config, files: ['src/a.ts'], all: true, deadline: 100000, runCommand: moved.run, now: () => clock.now });
  assert.deepEqual(moved.seen.map(entry => entry.command).slice(0, 3), ['first', 'second', 'second'], 'the defects run under the command that loads it');
  assert.equal(found.notLoaded, false);
  assert.equal(found.caught, found.total);
  const never = scriptedRuns([{ status: 0, ms: 10, neverLoaded: true }, { status: 0, ms: 10, neverLoaded: true }], clock);
  const [unreached] = await runMutation({ root, config, files: ['src/a.ts'], all: true, deadline: clock.now + 100000, runCommand: never.run, now: () => clock.now });
  assert.deepEqual(never.seen.map(entry => entry.command), ['first', 'second']);
  assert.equal(unreached.notLoaded, true);
  const failing = scriptedRuns([{ status: 1, ms: 10, neverLoaded: true }], clock);
  const [broken] = await runMutation({ root, config, files: ['src/a.ts'], all: true, deadline: clock.now + 100000, runCommand: failing.run, now: () => clock.now });
  assert.equal(failing.seen.length, 1, 'a command whose tests fail is reported, not passed over');
  assert.match(broken.error, /its tests fail with no defect in it/);
  // The defects run at the limit of the command that loads the file, not of the one that did not.
  let running = 0, most = 0, runs = 0;
  const counted = async (text, _root, _limit, env) => {
    if (text === 'first') return { status: 0, output: '' };
    runs++;
    running++; most = Math.max(most, running);
    await new Promise(done => setImmediate(done));
    running--;
    writeFileSync(JSON.parse(env.CODE_CHECK_MUTANT).report, 'applied\n');
    return { status: runs === 1 ? 0 : 1, output: '' };
  };
  const [limited] = await runMutation({ root, config, files: ['src/a.ts'], all: true, deadline: Date.now() + 100000, runCommand: counted });
  assert.ok(limited.total > 1 && runs === limited.total + 1, 'the control and each defect ran under the second command');
  assert.equal(most, 1, 'the second row says one at a time');
});

test('the limits of a run: three times the control or the floor, whichever is more, and never past the stage', async t => {
  const { root, put } = repository(t, GOOD);
  put('src/lib/price.ts', GOOD['src/lib/price.ts'].replace('* 2', '* 3'));
  const config = { ...REAL_CONFIG, concurrency: 1 };
  const limits = async (controlMs, perMutantMs, deadline) => {
    const clock = { now: 1000 };
    const { run, seen } = scriptedRuns([{ status: 0, ms: controlMs }], clock);
    await runMutation({ root, config: { ...config, perMutantMs }, files: ['src/lib/price.ts'], deadline, runCommand: run, now: () => clock.now });
    return seen.map(entry => entry.limit);
  };
  assert.deepEqual((await limits(100, 5000, 100000)).slice(0, 2), [99000, 5000], 'the control may use the stage; a mutant gets the floor');
  assert.deepEqual((await limits(4000, 5000, 100000)).slice(0, 2), [99000, 12000], 'a slow control raises the limit');
  assert.deepEqual((await limits(100, 5000, 3000)).slice(0, 2), [2000, 1900], 'and the time of the stage caps it');

  const clock = { now: 1000 };
  const timedOut = scriptedRuns([{ status: null, reason: 'timeout', ms: 100 }], clock);
  const [control] = await runMutation({ root, config, files: ['src/lib/price.ts'], deadline: 100000, runCommand: timedOut.run, now: () => clock.now });
  assert.equal(control.error, null, 'a control the stage cut off is no failure of the tests');
  assert.equal(control.notTried, control.total);
  const failed = scriptedRuns([{ status: null, reason: 'ENOENT', ms: 100 }], clock);
  const [cannot] = await runMutation({ root, config, files: ['src/lib/price.ts'], deadline: 100000, runCommand: failed.run, now: () => clock.now });
  assert.match(cannot.error, /fail with no defect/, 'a control that could not start is one');
});

test('what a run is given: the mutant, the loader next to any option already set, and no inherited test context', async t => {
  const { root, put } = repository(t, GOOD);
  put('src/lib/price.ts', GOOD['src/lib/price.ts'].replace('* 2', '* 3'));
  const given = async options => {
    const before = process.env.NODE_OPTIONS;
    if (options === null) delete process.env.NODE_OPTIONS; else process.env.NODE_OPTIONS = options;
    try {
      const clock = { now: 1000 };
      const { run, seen } = scriptedRuns([{ status: 1, ms: 10 }], clock);
      await runMutation({ root, config: { ...REAL_CONFIG, concurrency: 1 }, files: ['src/lib/price.ts'], deadline: 100000, runCommand: run, now: () => clock.now });
      return seen[0].env;
    } finally {
      if (before === undefined) delete process.env.NODE_OPTIONS; else process.env.NODE_OPTIONS = before;
    }
  };
  assert.match((await given(null)).NODE_OPTIONS, /^--import=file:.*mutation-loader\.mjs$/, 'alone');
  const env = await given('--no-warnings');
  assert.match(env.NODE_OPTIONS, /^--no-warnings --import=file:.*mutation-loader\.mjs$/, 'after what was set');
  assert.ok('NODE_TEST_CONTEXT' in env && env.NODE_TEST_CONTEXT === undefined, 'a nested test runner would run nothing');
  const mutant = JSON.parse(env.CODE_CHECK_MUTANT);
  assert.equal(GOOD['src/lib/price.ts'].replace('* 2', '* 3').slice(mutant.start, mutant.end), mutant.original, 'its offsets hold in the file');
  assert.equal(mutant.original, mutant.replacement, 'the first run is the control: the unchanged text');
  assert.equal(mutant.key.toLowerCase(), resolve(root, 'src/lib/price.ts').replaceAll('\\', '/').toLowerCase());
});

test('survivors are listed by line whatever order the runs end in, and a long form is cut to one length', async t => {
  const long = `${'b'.repeat(100)} === c`;
  const { root, put } = repository(t, { 'src/lib/many.ts': 'export const a = 1;\n' });
  put('src/lib/many.ts', `export const one = (b: number, c: number) => b === c;\nexport const two = (b: number, c: number) => b === c;\nexport const three = (${'b'.repeat(100)}: number, c: number) => !(${long});\n`);
  // Each run ends sooner than the one before it, so the last line's defect comes back first.
  let started = 0;
  const reversed = async (text, _root, limit, env) => {
    const turn = started++;
    await new Promise(done => setTimeout(done, turn === 0 ? 0 : Math.max(0, 200 - turn * 40)));
    writeFileSync(JSON.parse(env.CODE_CHECK_MUTANT).report, 'applied\n');
    return { status: 0, output: '' };
  };
  const [result] = await runMutation({ root, config: { ...REAL_CONFIG, concurrency: 3 }, files: ['src/lib/many.ts'], deadline: Date.now() + 100000, runCommand: reversed });
  const lines = result.survivors.map(survivor => survivor.line);
  assert.deepEqual(lines, [...lines].sort((a, b) => a - b), 'in line order');
  assert.ok(result.survivors.every(survivor => survivor.from.length <= 70 && survivor.to.length <= 70), JSON.stringify(result.survivors));
  assert.ok(result.survivors.some(survivor => survivor.from.length === 70), 'cut at exactly 70');
});

// A scanner whose flag a defect flips: the same shape as the baseline writer the review found. It logs each run in an ignored file, so a run that happened can be counted.
const SCANNER = `import { appendFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
export const update = false;
mkdirSync('test-results', { recursive: true });
appendFileSync('test-results/runs.log', 'run\\n');
if (update) {
  writeFileSync('data/base.json', 'overwritten\\n');
  writeFileSync('data/dirty.json', 'overwritten\\n');
  writeFileSync('data/stray.json', 'stray\\n');
  writeFileSync('data/removed.json', 'back\\n');
  rmSync('data/untracked.json', { force: true });
  mkdirSync('outside', { recursive: true });
  writeFileSync('outside/left.json', 'left\\n');
}
`;
test('[GOV-945-MUTATION-DISK-ERROR] A mutant that writes is caught at it and what it changed comes back', async t => {
  const config = { rows: [{ paths: ['scripts/*.mjs'], run: `${NODE} run-scan.mjs` }], perMutantMs: 20000, concurrency: 1 };
  const judged = async (root, scanner = 'scripts/scan.mjs') => (await runMutation({ root, config, roots: ['scripts', 'data'], files: [scanner], all: true, deadline: Date.now() + 120000, runCommand }))[0];
  const { root, put, git } = repository(t, { 'scripts/scan.mjs': SCANNER, 'run-scan.mjs': "import './scripts/scan.mjs';\n", 'data/base.json': 'at head\n', 'data/dirty.json': 'at head\n', 'data/removed.json': 'at head\n', 'data/clean.json': 'at head\n' });
  const read = file => readFileSync(join(root, file), 'utf8');
  const runs = () => read('test-results/runs.log').trim().split(/\r?\n/).length;
  put('data/dirty.json', 'dirty before the run\n');
  put('data/untracked.json', 'untracked before the run\n');
  rmSync(join(root, 'data/removed.json'));
  const result = await judged(root);
  assert.equal(read('data/base.json'), 'at head\n', 'a tracked file holds its blob');
  assert.equal(read('data/dirty.json'), 'dirty before the run\n', 'a file dirty before the run keeps its text');
  assert.equal(read('data/untracked.json'), 'untracked before the run\n', 'an untracked file the run deleted is back');
  assert.equal(existsSync(join(root, 'data/stray.json')), false, 'a file the run created goes');
  assert.equal(existsSync(join(root, 'data/removed.json')), false, 'a file deleted before the run stays deleted');
  assert.equal(read('data/clean.json'), 'at head\n', 'and one no run touched is as it was');
  assert.equal(read('outside/left.json'), 'left\n', 'a file outside the roots is left');
  assert.match(result.error, /^a run changed the tree, so no more defects of this file ran\./);
  for (const file of ['data/base.json', 'data/dirty.json', 'data/stray.json', 'data/untracked.json', 'data/removed.json']) assert.ok(result.error.split('Changed outside')[0].includes(file), `${file} is named as restored: ${result.error}`);
  assert.ok(!result.error.split('Changed outside')[0].includes('data/clean.json'), 'and no other');
  assert.match(result.error, /Changed outside the roots and not restored: outside\/left\.json\./);
  assert.equal(runs(), 2, 'the control and the one defect: no later defect of that file ran');
  assert.equal(result.notTried, 0, 'and they are not called untried for lack of time, which did not run out');
  assert.equal(result.caught + result.survivors.length + result.undecided, 0, 'and that attempt is not counted');
  assert.match(reportLines([result])['scripts/scan.mjs'][0], /the mutation check could not run: a run changed the tree/);
  const kept = result.error.match(/kept under (.+?)\./)[1];
  assert.equal(readFileSync(join(kept, 'data/stray.json'), 'utf8'), 'stray\n', 'what the run left is kept, since another session writing looks the same');
  assert.equal(readFileSync(join(kept, 'data/base.json'), 'utf8'), 'overwritten\n');
  assert.equal(git('status', '--porcelain', '--', 'data/base.json', 'data/clean.json').stdout, '', 'Git sees those two as they were');

  const always = repository(t, { 'scripts/writes.mjs': "import { writeFileSync } from 'node:fs';\nexport const a = 1 === 1;\nwriteFileSync('data/base.json', 'overwritten\\n');\n", 'run-scan.mjs': "import './scripts/writes.mjs';\n", 'data/base.json': 'at head\n' });
  const control = await judged(always.root, 'scripts/writes.mjs');
  assert.match(control.error, /a run changed the tree/, 'a run with no defect that writes is caught at the control');
  assert.equal(readFileSync(join(always.root, 'data/base.json'), 'utf8'), 'at head\n');

  const quiet = repository(t, { 'scripts/quiet.mjs': 'export const a = 1 === 1;\n', 'run-scan.mjs': "import './scripts/quiet.mjs';\n" });
  const clean = await judged(quiet.root, 'scripts/quiet.mjs');
  assert.equal(clean.error, null, 'a run that writes nothing has nothing to say');
  assert.ok(clean.total > 0 && clean.caught + clean.survivors.length === clean.total, 'and every defect is judged');
  assert.equal(existsSync(join(quiet.root, 'test-results/code-check/mutants/restored')), false, 'nothing is kept');

  const blocked = repository(t, { 'scripts/quiet.mjs': 'export const a = 1 === 1;\n' });
  rmSync(join(blocked.root, '.git'), { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  await assert.rejects(() => judged(blocked.root, 'scripts/quiet.mjs'), /git status failed/, 'a tree that cannot be read is no pass');
});

test('the command of a not tried line tries those defects when run as written, and a run by hand that judged nothing says why', async t => {
  const { root, put, git } = repository(t, { ...GOOD }, { link: true, registry: { mutation: REAL_CONFIG } });
  for (const file of ['mutation-check.mjs', 'code-check.mjs', 'mutation-loader.mjs']) copyFileSync(join(ROOT, 'scripts/workflow-gates', file), join(root, 'scripts/workflow-gates', file));
  const commit = message => { git('add', '-A'); git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', message); };
  commit('tools');
  const base = git('rev-parse', 'HEAD').stdout.trim();
  git('checkout', '-qb', 'feature');
  put('src/lib/price.ts', GOOD['src/lib/price.ts'].replace('* 2', '* 2 + 0'));
  commit('a change, committed, as a review meets it');
  const [cut] = await runMutation({ root, config: REAL_CONFIG, files: ['src/lib/price.ts'], base, deadline: Date.now() - 1, runCommand });
  assert.ok(cut.notTried > 0, 'the time ran out');
  const line = reportLines([cut])['src/lib/price.ts'].find(text => text.includes('not tried'));
  const command = line.match(/: (node scripts\S+ .+) tries them$/)[1];
  assert.ok(command.includes(`--base=${base}`), command);
  const run = text => spawnSync(text, { cwd: root, shell: true, encoding: 'utf8', timeout: 150000, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  const asWritten = run(command);
  assert.match(asWritten.stdout, /src\/lib\/price\.ts: [1-9]\d* defects, [1-9]\d* caught/, `as written: ${asWritten.stdout}${asWritten.stderr}`);
  const noBase = run('node scripts/workflow-gates/mutation-check.mjs src/lib/price.ts');
  assert.equal(noBase.status, 1, 'with the lines committed and no base named, nothing differs');
  assert.match(noBase.stdout, /nothing was judged, because no line that differs from HEAD/);
  const [named] = await runMutation({ root, config: REAL_CONFIG, files: ['src/lib/price.ts'], base: 'no-such-ref', all: true, deadline: Date.now() - 1, runCommand });
  assert.equal(named.base, 'no-such-ref', 'a base Git cannot name is passed on as it was given');
});

test('reportLines: a file whose every defect was caught says nothing, and the list is bounded', () => {
  const base = { file: 'a.ts', total: 3, caught: 3, survivors: [], undecided: 0, notTried: 0, notLoaded: false, error: null };
  assert.deepEqual(reportLines([base]), {});
  const many = reportLines([{ ...base, survivors: Array.from({ length: 11 }, (_, i) => ({ line: i, from: 'a', to: 'b' })) }], 8)['a.ts'];
  assert.equal(many.length, 9);
  assert.match(many[8], /and 3 more of the same/);
  assert.deepEqual(reportLines([{ ...base, undecided: 2 }])['a.ts'], ['a.ts: of 3 defects, 2 undecided, because a run ended with no verdict: node scripts/workflow-gates/mutation-check.mjs --base=HEAD a.ts tries them'], 'no word of time when no time ran out');
  assert.deepEqual(reportLines([{ ...base, notTried: 1, undecided: 2 }])['a.ts'].map(line => line.split(',')[1].trim().split(' ').slice(0, 2).join(' ')), ['1 not', '2 undecided'], 'each said for itself');
  assert.match(reportLines([{ ...base, undecided: 1, all: true }])['a.ts'][0], /mutation-check\.mjs --all a\.ts tries them$/, 'a run of every line is tried again the same way');
  assert.match(reportLines([{ ...base, notTried: 1, base: 'abc', file: 'a b.ts' }])['a b.ts'][0], /--base=abc "a b\.ts" tries them$/, 'a name with a space stays one word');
  assert.match(reportLines([{ ...base, byTest: 'a.test.ts', survivors: [{ line: 1, from: 'x', to: 'y' }] }])['a.ts'][0], /every test of a\.test\.ts still passed/);
  assert.match(reportLines([{ ...base, notTried: 1 }])['a.ts'][0], /mutation-check\.mjs --base=HEAD a\.ts tries them/);
  assert.equal(reportLines([{ ...base, survivors: Array.from({ length: 11 }, (_, i) => ({ line: i, from: 'a', to: 'b' })) }])['a.ts'].length, 9, 'by default too');
  // A file judged through a changed test has no changed line of its own, so only --all can try the rest of it.
  assert.match(reportLines([{ ...base, byTest: 'a.test.ts', notTried: 1 }])['a.ts'][0], /mutation-check\.mjs --all a\.ts tries them/);
});

test('by hand: --all judges an existing test over lines no change wrote, and the exit code says whether anything was left', async t => {
  const weak = "import { it, expect } from 'vitest';\nimport { price } from './price';\nit('works', () => expect(typeof price(2)).toBe('number'));\n";
  const { root } = repository(t, { ...GOOD, 'src/lib/price.test.ts': weak }, { link: true, registry: { mutation: REGISTRY.mutation } });
  const script = join(ROOT, 'scripts/workflow-gates/mutation-check.mjs');
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: tmpdir(), encoding: 'utf8', timeout: 150000, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(run().status, 2, 'no file named');
  const unchanged = run('src/lib/price.ts');
  assert.equal(unchanged.status, 1, 'nothing judged is no pass');
  assert.match(unchanged.stdout, /src\/lib\/price\.ts: 0 defects/, 'a clean file has no changed line');
  assert.match(unchanged.stdout, /src\/lib\/price\.ts: nothing was judged, because no line that differs from HEAD holds anything a defect can be made from; --all judges every line, and --base=<commit> names another base/, 'and it says so and why');
  const notARow = run('docs/nothing.md');
  assert.equal(notARow.status, 1);
  assert.match(notARow.stdout, /docs\/nothing\.md: nothing was judged, because no row of the registry breaks it, the registry skips it, or it is gone/);
  const all = run('--all', 'src/lib/price.ts');
  assert.equal(all.status, 1, all.stdout);
  assert.match(all.stdout, /src\/lib\/price\.ts:3: `\*` became `\/`, and every test still passed/);
  const cut = run('--all', '--minutes=0', 'src/lib/price.ts');
  assert.equal(cut.status, 1, 'no time to try anything is no pass');
  assert.match(cut.stdout, /0 caught, 0 not caught, \d+ not tried/);
  assert.equal(spawnSync(process.execPath, [script, '--all', 'src/lib/price.ts'], { cwd: root, encoding: 'utf8', timeout: 150000, env: { ...process.env, CLAUDE_PROJECT_DIR: '' } }).status, 1, 'and with no project named, the folder it runs in');
  const strong = repository(t, GOOD, { link: true, registry: { mutation: REGISTRY.mutation } });
  const judged = spawnSync(process.execPath, [script, '--all', 'src/lib/price.ts'], { cwd: strong.root, encoding: 'utf8', timeout: 150000, env: { ...process.env, CLAUDE_PROJECT_DIR: strong.root } });
  assert.match(judged.stdout, /src\/lib\/price\.ts: \d+ defects, \d+ caught, \d+ not caught, 0 not tried, 0 undecided/);
});

// The defect the real chain could not see before this check: wrong logic under a test that asserts nothing real.
test('through the real main: a superficial test stops the agent once, a real one does not, and a subagent does not swallow the note', async t => {
  const rows = [{ paths: ['src/**/*.ts'], write: [], stop: [] }];
  const registry = { roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 20, rows, mutation: REAL_CONFIG };
  const superficial = "import { it, expect } from 'vitest';\nimport { price } from './price';\nit('works', () => expect(typeof price(2)).toBe('number'));\n";
  const { root, put, git } = repository(t, { ...GOOD, 'src/lib/price.test.ts': superficial }, { link: true, registry });
  git('add', '-A'); git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'registry');
  let session = 0;
  const hook = (name, file) => {
    const child = spawnSync(process.execPath, [TOOL], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 150000, env: { ...process.env, CLAUDE_PROJECT_DIR: root },
      input: JSON.stringify({ hook_event_name: name, session_id: `s${session}`, cwd: root, ...(file ? { tool_name: 'Edit', tool_input: { file_path: join(root, file) } } : {}) }) });
    assert.notEqual(child.status, null, `${name} ended`);
    return child;
  };
  // The logic is wrong and the test stays green: nothing else in the tool can see this.
  session = 1;
  assert.equal(hook('SessionStart').status, 0);
  put('src/lib/price.ts', GOOD['src/lib/price.ts'].replace('value * 2', 'value * 3'));
  assert.equal(hook('PostToolUse', 'src/lib/price.ts').status, 0, 'the write stage has no reason to refuse');
  const stopped = hook('Stop');
  assert.equal(stopped.status, 2, stopped.stderr);
  assert.match(stopped.stderr, /CODE CHECK NOTE: this code was broken on purpose, with the defect stored in memory only/);
  assert.match(stopped.stderr, /src\/lib\/price\.ts:3: `\*` became `\/`, and every test still passed/);
  assert.match(stopped.stderr, /This stops you once per version of the file\./);
  assert.equal(hook('Stop').status, 0, 'once per version');
  assert.equal(readFileSync(join(root, 'src/lib/price.ts'), 'utf8'), GOOD['src/lib/price.ts'].replace('value * 2', 'value * 3'), 'the file holds what was written');

  // A subagent stops first: the main agent still gets the note, once.
  session = 2;
  git('checkout', '-q', '--', '.');
  assert.equal(hook('SessionStart').status, 0);
  put('src/lib/price.ts', GOOD['src/lib/price.ts'].replace('value * 2', 'value * 4'));
  assert.equal(hook('SubagentStop').status, 2);
  const held = hook('Stop');
  assert.equal(held.status, 2, 'the held note reaches the main agent');
  assert.match(held.stderr, /price\.ts:3: `\*` became `\/`/);
  assert.equal(hook('Stop').status, 0);

  // The same change under a real test passes in silence.
  session = 3;
  git('checkout', '-q', '--', '.');
  put('src/lib/price.test.ts', GOOD['src/lib/price.test.ts'].replace('toBe(4)', 'toBe(6)'));
  git('add', '-A'); git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'a real test');
  assert.equal(hook('SessionStart').status, 0);
  put('src/lib/price.ts', GOOD['src/lib/price.ts'].replace('value * 2', 'value * 3'));
  const clean = hook('Stop');
  assert.equal(clean.status, 0, clean.stderr);
});

// Found by the audit: the stage inside the tool. A command that exits 0 and loads nothing gives one fixed line, so these need no Vitest.
const LOADS_NOTHING = `${NODE} -e "process.exit(0)"`;
const stageRegistry = (mutation, stop = []) => ({ roots: ['src'], timeoutMs: { write: 5000, stop: 20000 }, tailLines: 6, rows: [{ paths: ['src/**/*.ts'], write: [], stop }], mutation: { perMutantMs: 1000, shown: 8, ...mutation } });
const LOGIC = 'export const a = (b: number) => b === 1;\n';

test('the stage: a file no test reaches is not broken, and with nothing to break nothing is prepared', async t => {
  const says = `${NODE} -e "console.log('No test files found, exiting with code 0')"`;
  const registry = stageRegistry({ timeoutMs: 5000, hookMs: 20000, rows: [{ paths: ['src/**/*.ts'], run: `${NODE} -e "require('fs').writeFileSync('ran','')"` }] }, [says]);
  const { root, put } = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, { registry });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, root);
  put('src/a.ts', LOGIC);
  const told = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, root);
  assert.match(told.message, /no test reaches src\/a\.ts/);
  assert.doesNotMatch(told.message, /no run showed/, 'it is said once, by the check that knows');
  assert.ok(!existsSync(join(root, 'ran')), 'no run started');
  assert.ok(!existsSync(join(root, 'test-results/code-check/mutants')), 'and none was prepared');
});

test('the stage: the note of a version that is gone is dropped, also after a subagent', async t => {
  const registry = stageRegistry({ timeoutMs: 5000, hookMs: 20000, rows: [{ paths: ['src/**/*.ts'], run: LOADS_NOTHING }] });
  const { root, put } = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, { registry });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, root);
  put('src/a.ts', LOGIC);
  const first = await runCodeCheck({ hook_event_name: 'SubagentStop', session_id: 's' }, root);
  assert.equal(first.status, 2);
  assert.match(first.message, /src\/a\.ts: no run showed it loaded/);
  put('src/a.ts', 'export type A = 1;\n');
  assert.deepEqual(await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, root), { status: 0, message: '' });
});

test('the stage: it ends at the time of the stage and at the time the hook has left, whichever is sooner, and says what was not tried', async t => {
  const hang = `${NODE} -e "setTimeout(() => {}, 60000)"`;
  for (const [label, limits] of [['the stage', { timeoutMs: 1500, hookMs: 60000 }], ['the hook', { timeoutMs: 60000, hookMs: 1500 }]]) {
    const { root, put } = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, { registry: stageRegistry({ ...limits, rows: [{ paths: ['src/**/*.ts'], run: hang }] }) });
    await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, root);
    put('src/a.ts', LOGIC);
    const started = Date.now();
    const told = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, root);
    assert.ok(Date.now() - started < 30000, `${label}: ended at its limit, not at the hang, after ${Date.now() - started} ms`);
    assert.equal(told.status, 2, label);
    assert.match(told.message, /of 2 defects, 2 not tried because time ran out/, label);
  }
});

test('the stage: a check that threw is told to the agent once, and does not undo the checks that passed', async t => {
  const { root, put } = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, { registry: stageRegistry({ timeoutMs: 5000, hookMs: 20000, rows: 'not a list' }) });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, root);
  put('src/a.ts', LOGIC);
  const told = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, root);
  assert.equal(told.status, 2);
  assert.match(told.message, /the mutation check could not run for src\/a\.ts: /);
  assert.deepEqual(await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, root), { status: 0, message: '' });
});

test('a registry with no mutation key never loads the check, and a harness that cannot run reaches the agent', async t => {
  const rows = [{ paths: ['src/**/*.ts'], write: [], stop: [] }];
  const plain = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, { registry: { roots: ['src'], timeoutMs: { write: 5000, stop: 5000 }, tailLines: 6, rows } });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, plain.root);
  plain.put('src/a.ts', 'export const a = 2;\n');
  assert.deepEqual(await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, plain.root), { status: 0, message: '' });
  assert.ok(!existsSync(join(plain.root, 'test-results/code-check/mutants')), 'no run was prepared');

  const failing = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, { registry: { roots: ['src'], timeoutMs: { write: 5000, stop: 5000 }, tailLines: 6, rows, mutation: { timeoutMs: 5000, hookMs: 20000, perMutantMs: 1000, rows: [{ paths: ['src/**/*.ts'], run: `${NODE} -e "process.exit(3)"` }] } } });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, failing.root);
  failing.put('src/a.ts', 'export const a = 2;\n');
  const told = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, failing.root);
  assert.equal(told.status, 2);
  assert.match(told.message, /src\/a\.ts: the mutation check could not run: its tests fail with no defect in it/);
  assert.deepEqual(await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, failing.root), { status: 0, message: '' }, 'once per version: the checks themselves passed');
});

// The defect runs over the lines of revision 1 found these unread by any test; each assertion below fails under one of them.
const MOVES = actions => `import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
export const update = false;
if (update) {
${actions}}
`;
test('the guard restores a deleted folder and a staged rename, names a file gone outside the roots, and leaves a nested repository alone', async t => {
  const config = { rows: [{ paths: ['scripts/*.mjs'], run: `${NODE} run-scan.mjs` }], perMutantMs: 20000, concurrency: 1 };
  const judged = async (root, roots) => (await runMutation({ root, config, roots, files: ['scripts/scan.mjs'], all: true, deadline: Date.now() + 120000, runCommand }))[0];
  const tracked = { 'run-scan.mjs': "import './scripts/scan.mjs';\n", 'data/sub/t.json': 'at head\n', 'data/moved.json': 'moved\n' };

  const one = repository(t, { ...tracked, 'scripts/scan.mjs': MOVES("  rmSync('data/sub', { recursive: true, force: true });\n  rmSync('outside/before.json', { force: true });\n  spawnSync('git', ['init', '-q', 'data/nested']);\n") });
  one.put('outside/before.json', 'untracked before the run\n');
  const each = await judged(one.root, ['data']);
  assert.equal(readFileSync(join(one.root, 'data/sub/t.json'), 'utf8'), 'at head\n', 'a file of a deleted folder is back');
  assert.match(each.error, /Restored: data\/sub\/t\.json;/, 'one restored');
  assert.match(each.error, /Changed outside the roots and not restored: outside\/before\.json\./, 'and one gone outside the roots: one of each is still a change');
  assert.ok(existsSync(join(one.root, 'data/nested/.git')), 'a nested repository is no file of this tree');

  const whole = repository(t, { ...tracked, 'scripts/scan.mjs': MOVES("  rmSync('outside/before.json', { force: true });\n  spawnSync('git', ['mv', 'data/moved.json', 'data/renamed.json']);\n") });
  whole.put('outside/before.json', 'untracked before the run\n');
  const all = await judged(whole.root, ['.']);
  assert.equal(readFileSync(join(whole.root, 'outside/before.json'), 'utf8'), 'untracked before the run\n', 'with the root ".", every folder is under it');
  assert.equal(readFileSync(join(whole.root, 'data/moved.json'), 'utf8'), 'moved\n', 'the old path of a rename is back');
  assert.equal(existsSync(join(whole.root, 'data/renamed.json')), false, 'and the new one is gone');
  assert.doesNotMatch(all.error, /Changed outside/);
});

test('by hand: a named base is read whole, a run whose every defect was caught exits 0, and no name is called unjudged', async t => {
  const config = { rows: [{ paths: ['*.test.mjs'], test: true, run: `${NODE} {file}` }, { paths: ['scripts/*.mjs'], run: `${NODE} check-sum.test.mjs` }], perMutantMs: 20000, concurrency: 1 };
  const strict = "import assert from 'node:assert/strict';\nimport { sum } from './scripts/sum.mjs';\nassert.equal(sum, 3);\n";
  // A line no test reads stays as it was, so a run that judged more than the change would say so.
  const { root, put, git } = repository(t, { 'scripts/sum.mjs': 'export const sum = 3;\nexport const unread = 5;\n', 'check-sum.test.mjs': strict }, { registry: { mutation: config, roots: ['scripts'] } });
  const base = git('rev-parse', 'HEAD').stdout.trim();
  put('scripts/sum.mjs', 'export const sum = 1 + 2;\nexport const unread = 5;\n');
  git('add', '-A');
  git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'committed, as a review meets it');
  const script = join(ROOT, 'scripts/workflow-gates/mutation-check.mjs');
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: tmpdir(), encoding: 'utf8', timeout: 150000, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  const caught = run(`--base=${base}`, 'scripts/sum.mjs');
  assert.equal(caught.status, 0, `${caught.stdout}${caught.stderr}`);
  assert.match(caught.stdout, /^scripts\/sum\.mjs: ([1-9]\d*) defects, \1 caught, 0 not caught, 0 not tried, 0 undecided\n$/, 'and it says nothing more');
  const byTest = run('check-sum.test.mjs');
  assert.match(byTest.stdout, /^scripts\/sum\.mjs: [1-9]\d* defects, /m, `a changed test judges what it tests: ${byTest.stdout}${byTest.stderr}`);
  assert.doesNotMatch(byTest.stdout, /nothing was judged/, 'and the test it was given is not called unjudged');
  const usage = run();
  assert.equal(usage.status, 2);
  assert.equal(usage.stderr, 'usage: mutation-check.mjs [--all] [--base=<commit>] [--minutes=N] <files>\n');
});

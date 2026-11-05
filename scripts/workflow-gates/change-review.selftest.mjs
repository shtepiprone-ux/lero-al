#!/usr/bin/env node
// Task 945: what must never enter the tree, what the reviewer must answer, and the review of a whole change whichever tool wrote it. Every rule of
// the real registry is run on a real Git repository against a line it must name and a line it must leave alone. A secret in this file would be
// refused by the tool it tests, so each is assembled when the test runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { added, readRegistry, runCodeCheck } from './code-check.mjs';
import { baseOf, changedFiles, renderReport, reviewChange } from './change-review.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const REAL = readRegistry(ROOT);
const NODE = `"${process.execPath.replaceAll('\\', '/')}"`;
const glue = (...parts) => parts.join('');
const LONG = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0';

function repository(t, files, registry = null) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-review-'));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }));
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  const commit = message => { git('add', '-A'); git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', message); };
  for (const [file, text] of Object.entries({ '.gitignore': 'test-results\n', ...files })) put(file, text);
  if (registry) put('scripts/workflow-gates/code-check.json', JSON.stringify(registry));
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('checkout', '-qb', 'main');
  commit('base');
  return { root, put, git, commit, read: file => readFileSync(join(root, file), 'utf8') };
}
const REGISTRY = { roots: ['src'], timeoutMs: { write: 20000, stop: 20000 }, tailLines: 8, rows: [{ paths: ['src/**/*'], write: [], stop: [] }], quieting: REAL.quieting.map(({ paths, pattern, what, fewer, flags }) => ({ paths, pattern, what, fewer, flags })), secure: REAL.secure.map(({ paths, pattern, what, refuse, changed, flags }) => ({ paths, pattern, what, refuse, changed, flags })) };

// [rule, file, a line it must name, a line it must leave alone]
const CASES = [
  ['a private key', 'src/a.ts', glue('-----BEGIN ', 'RSA PRIVATE KEY-----'), "const label = 'private key';"],
  ['a live credential', 'src/a.ts', glue('const k = "sk_', 'live_', LONG, '";'), 'const k = process.env.STRIPE_SECRET_KEY;'],
  ['a live credential', 'src/a.ts', glue('const k = "gh', 'p_', LONG, '";'), 'const k = "ghp_short";'],
  ['a live credential', 'src/a.ts', glue('const k = "AK', 'IA', 'ABCDEFGHIJKLMNOP', '";'), 'const k = "AKIA-example";'],
  ['a signed token', 'src/a.ts', glue('const k = "ey', 'JhbGciOiJIUzI1NiIsInR5cCI6.', 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6.', 'abcdefghijklmnopqrstuvwxyz";'), 'const k = "eyJ.short.token";'],
  ['an invisible text-direction', 'src/a.ts', `const a = "${String.fromCodePoint(0x202e)}";`, `const a = "${String.fromCodePoint(0xe9)}";`],
  ['a secret under NEXT_PUBLIC_', 'src/a.ts', glue('const a = process.env.NEXT_', 'PUBLIC_SUPABASE_', 'SERVICE_ROLE_KEY;'), 'const a = process.env.NEXT_PUBLIC_SUPABASE_URL;'],
  ['HTML written without encoding', 'src/a.tsx', '<div dangerouslySetInnerHTML={{ __html: a }} />', '<div>{a}</div>'],
  ['HTML written without encoding', 'src/a.ts', 'node.innerHTML = a;', 'node.textContent = a;'],
  ['text run as code', 'src/a.ts', 'const a = eval(b);', 'const a = retrieval(b);'],
  ['a command built as text', 'src/a.ts', 'exec(`rm ${a}`);', "execFile('rm', [a]);"],
  ['a query built from text', 'src/a.ts', 'db.from(`${a}_table`);', "db.from('table').eq('id', a);"],
  ['a query built from text', 'src/a.ts', 'db.or(`id.eq.${a}`);', "db.or('id.eq.1');"],
  ['a redirect to a place the request names', 'src/a.ts', 'redirect(searchParams.next);', "redirect('/home');"],
  ['a request to a place the caller names', 'src/a.ts', 'await fetch(url);', "await fetch('/api/a');"],
  ['Math.random', 'src/a.ts', 'const token = Math.random();', 'const token = randomUUID();'],
  ['a broken hash', 'src/a.ts', "createHash('md5');", "createHash('sha256');"],
  ['certificate checks switched off', 'src/a.ts', 'const o = { rejectUnauthorized: false };', 'const o = { rejectUnauthorized: true };'],
  ['something secret written to a log', 'src/a.ts', 'console.log(token);', "console.log('done');"],
  ['a new Server Action', 'src/a.ts', "'use server'", "const a = 'use server';"],
  ['a new HTTP entry point', 'src/app/api/a/route.ts', 'export async function POST(request) {}', 'function POST() {}'],
  ['row rules are bypassed', 'src/a.ts', 'const db = createAdminClient();', 'const db = createClient();'],
  ['runs with its owner', 'supabase/migrations/1.sql', 'create function f() returns int language sql SECURITY DEFINER as $$ select 1 $$;', 'create function f() returns int language sql as $$ select 1 $$;'],
  ['access widened', 'supabase/migrations/1.sql', 'GRANT select ON t TO anon;', 'grant select on t to service_role;'],
  ['access widened', 'supabase/migrations/1.sql', 'create policy p on t using (true);', 'create policy p on t using (auth.uid() = owner);'],
  ['access widened', 'supabase/migrations/1.sql', 'alter table t disable row level security;', 'alter table t enable row level security;'],
  ['runs by itself', 'package.json', '{ "scripts": { "postinstall": "a" } }', '{ "scripts": { "test": "a" } }'],
];

test('each rule names the line it exists for, and leaves the safe form of that line alone', t => {
  const { root, put } = repository(t, { 'src/a.ts': '', 'src/a.tsx': '', 'src/app/api/a/route.ts': '', 'supabase/migrations/1.sql': '', 'package.json': '{}' });
  for (const [what, file, bad, good] of CASES) {
    put(file, `${good}\n`);
    assert.deepEqual(added(root, REAL.secure, [file]), [], `the safe line stays quiet: ${good}`);
    put(file, `${bad}\n`);
    const lines = added(root, REAL.secure, [file]);
    assert.ok(lines.some(line => line.includes(what) || line.toLowerCase().includes(what.toLowerCase())), `${what}: ${bad}\n${lines.join('\n')}`);
    assert.match(lines[0], new RegExp(`^${file.replaceAll('.', '\\.')}:1: `), 'with its line');
    put(file, '');
  }
  const measured = new Set(CASES.map(([what]) => what));
  assert.equal(REAL.secure.filter(rule => rule.pattern).length, new Set(REAL.secure.filter(rule => rule.pattern).map(rule => rule.what)).size, 'no rule is a copy of another');
  assert.ok(measured.size >= REAL.secure.filter(rule => rule.pattern).length - 1, 'and each has a case');
});

test('what was already at the base is not charged to this change, whatever base is named', t => {
  const { root, put, commit } = repository(t, { 'src/a.ts': 'const a = eval(b);\n' });
  put('src/a.ts', 'const a = eval(b);\nconst c = 1;\n');
  assert.deepEqual(added(root, REAL.secure, ['src/a.ts']), []);
  put('src/a.ts', 'const a = eval(b);\nconst c = eval(d);\n');
  assert.deepEqual(added(root, REAL.secure, ['src/a.ts']).map(line => line.split(' ')[0]), ['src/a.ts:2:'], 'the one this change wrote');
  commit('second');
  assert.deepEqual(added(root, REAL.secure, ['src/a.ts']), [], 'once committed, HEAD holds it');
  assert.equal(added(root, REAL.secure, ['src/a.ts'], 'HEAD~1').length, 1, 'against the base of the whole change it still counts');
});

test('a deleted test is the strongest weakening, and a new mock and a removed assertion are named', t => {
  const body = "it('a', () => { expect(a()).toBe(1); expect(b()).toBe(2); });\n";
  const { root, put } = repository(t, { 'src/a.test.ts': body, 'src/b.test.ts': body, 'src/c.test.ts': body, 'src/d.selftest.mjs': 'assert.equal(a, 1);\n' });
  rmSync(join(root, 'src/a.test.ts'));
  assert.match(added(root, REAL.quieting, ['src/a.test.ts']).join('\n'), /src\/a\.test\.ts: assertions removed, 2 at HEAD and 0 now/);
  put('src/b.test.ts', `vi.mock('./real');\n${body}`);
  assert.match(added(root, REAL.quieting, ['src/b.test.ts']).join('\n'), /src\/b\.test\.ts:1: a new mock/);
  put('src/c.test.ts', "it('a', () => { expect(a()).toBe(1); });\n");
  assert.match(added(root, REAL.quieting, ['src/c.test.ts']).join('\n'), /assertions removed, 2 at HEAD and 1 now/);
  rmSync(join(root, 'src/d.selftest.mjs'));
  assert.match(added(root, REAL.quieting, ['src/d.selftest.mjs']).join('\n'), /assertions removed, 1 at HEAD and 0 now/);
  assert.deepEqual(added(root, REAL.quieting, ['src/gone-and-never-there.test.ts']), [], 'a file that never held a test lost nothing');
});

test('a file that steers later agents counts by changing at all, and a change of line endings is no change', t => {
  const { root, put } = repository(t, { 'CLAUDE.md': 'a\nb\n', '.claude/rules/x.md': 'a\n', '.github/workflows/ci.yml': 'a\n', 'docs/note.md': 'a\n' });
  assert.deepEqual(added(root, REAL.secure, ['CLAUDE.md']), []);
  put('CLAUDE.md', 'a\r\nb\r\n');
  assert.deepEqual(added(root, REAL.secure, ['CLAUDE.md']), [], 'line endings only');
  for (const file of ['CLAUDE.md', '.claude/rules/x.md', '.github/workflows/ci.yml']) {
    put(file, 'changed\n');
    assert.match(added(root, REAL.secure, [file]).join('\n'), new RegExp(`^${file.replaceAll('.', '\\.')}: this file steers every later agent`), file);
  }
  put('docs/note.md', 'changed\n');
  assert.deepEqual(added(root, REAL.secure, ['docs/note.md']), [], 'a document does not');
  rmSync(join(root, 'AGENTS.md'), { force: true });
  assert.deepEqual(added(root, REAL.secure, ['AGENTS.md']), [], 'absent then and now');
});

test('through the tool: a secret is refused at the write and on every Stop until it is gone, and no note ever replaces that', async t => {
  const { root, put } = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, REGISTRY);
  const event = (name, extra = {}) => ({ hook_event_name: name, session_id: 's', cwd: root, ...extra });
  await runCodeCheck(event('SessionStart'), root);
  const secret = glue('export const a = "sk_', 'live_', LONG, '";\n');
  put('src/a.ts', secret);
  const first = await runCodeCheck(event('PostToolUse', { tool_name: 'Edit', tool_input: { file_path: join(root, 'src/a.ts') } }), root);
  assert.equal(first.status, 2);
  assert.match(first.message, /^CODE CHECK FAILED after a write to src\/a\.ts/);
  assert.match(first.message, /src\/a\.ts:1: a live credential/);
  for (let attempt = 0; attempt < 3; attempt++) {
    const stop = await runCodeCheck(event('Stop'), root);
    assert.equal(stop.status, 2, `attempt ${attempt} refused`);
    assert.match(stop.message, /a live credential/);
  }
  put('src/a.ts', 'export const a = process.env.KEY;\n');
  assert.deepEqual(await runCodeCheck(event('Stop'), root), { status: 0, message: '' }, 'and it passes once gone');
});

test('through the tool: what an attacker reaches stops the agent once per version with its line, also through a subagent', async t => {
  const { root, put } = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, REGISTRY);
  const event = name => ({ hook_event_name: name, session_id: 's', cwd: root });
  await runCodeCheck(event('SessionStart'), root);
  put('src/a.ts', 'export const a = eval(b);\n');
  const noted = await runCodeCheck(event('Stop'), root);
  assert.equal(noted.status, 2);
  assert.match(noted.message, /this change touches what an attacker reaches\. Review each line against \.claude\/rules\/shared\/secure-code-review\.md/);
  assert.match(noted.message, /src\/a\.ts:1: text run as code \(CWE-95\): export const a = eval\(b\);/);
  assert.doesNotMatch(noted.message, /makes a check quieter/, 'it is not told under another heading');
  assert.deepEqual(await runCodeCheck(event('Stop'), root), { status: 0, message: '' }, 'once');
  put('src/a.ts', 'export const a = eval(c);\n');
  assert.equal((await runCodeCheck(event('SubagentStop'), root)).status, 2, 'a new version, a subagent first');
  const held = await runCodeCheck(event('Stop'), root);
  assert.equal(held.status, 2);
  assert.match(held.message, /text run as code/, 'the main agent still gets it');
  assert.deepEqual(await runCodeCheck(event('Stop'), root), { status: 0, message: '' });
  put('src/a.ts', 'export const a = eval(d);\n');
  assert.equal((await runCodeCheck(event('SubagentStop'), root)).status, 2);
  put('src/a.ts', 'export const a = 2;\n');
  assert.deepEqual(await runCodeCheck(event('Stop'), root), { status: 0, message: '' }, 'the note of a version that is gone is dropped');
});

test('through the tool: what makes a check quieter reaches the main agent after a subagent, once', async t => {
  const { root, put } = repository(t, { 'src/a.test.ts': "it('a', () => {});\n" }, REGISTRY);
  const event = name => ({ hook_event_name: name, session_id: 's', cwd: root });
  await runCodeCheck(event('SessionStart'), root);
  put('src/a.test.ts', "it.skip('a', () => {});\n");
  assert.equal((await runCodeCheck(event('SubagentStop'), root)).status, 2);
  const held = await runCodeCheck(event('Stop'), root);
  assert.equal(held.status, 2);
  assert.match(held.message, /this change makes a check quieter[^]*a test switched off/);
  assert.deepEqual(await runCodeCheck(event('Stop'), root), { status: 0, message: '' });
});

test('the base: a pull request by its target, a push to main by the commit before it, a branch by where it left main', t => {
  const { root, put, commit, git } = repository(t, { 'src/a.ts': '1\n' });
  const rev = what => git('rev-parse', what).stdout.trim();
  const first = rev('HEAD');
  git('update-ref', 'refs/remotes/origin/main', first);
  assert.throws(() => baseOf(root, { GITHUB_BASE_REF: 'no-such' }), /no base: git merge-base origin\/no-such HEAD failed/, 'no base is no pass');
  assert.equal(baseOf(root, {}), first, 'the first commit has no parent, so it is its own base');
  put('src/a.ts', '2\n'); commit('second');
  const second = rev('HEAD');
  git('update-ref', 'refs/remotes/origin/main', second);
  assert.equal(baseOf(root, {}), first, 'on main itself, the commit before');
  git('checkout', '-qb', 'feature');
  put('src/a.ts', '3\n'); commit('third');
  put('src/a.ts', '4\n'); commit('fourth');
  assert.equal(baseOf(root, {}), second, 'a branch, however long');
  git('update-ref', 'refs/remotes/origin/release', first);
  assert.equal(baseOf(root, { GITHUB_BASE_REF: 'release' }), first, 'a pull request against another target');
});

test('the files of a change: changed, deleted and new, staged or not, only those a row holds', t => {
  const registry = { roots: ['src', 'docs'], rowsFor: file => (file.endsWith('.ts') ? [{}] : []) };
  const { root, put, git, read } = repository(t, { 'src/kept.ts': '1\n', 'src/changed.ts': '1\n', 'src/gone.ts': '1\n', 'src/staged.ts': '1\n', 'src/note.md': '1\n', 'other/x.ts': '1\n' });
  const base = git('rev-parse', 'HEAD').stdout.trim();
  put('src/changed.ts', '2\n');
  rmSync(join(root, 'src/gone.ts'));
  put('src/staged.ts', '2\n'); git('add', 'src/staged.ts');
  put('src/new.ts', '1\n');
  put('src/note.md', '2\n');
  put('other/x.ts', '2\n');
  assert.equal(read('src/kept.ts'), '1\n');
  assert.deepEqual(changedFiles(root, registry, base), ['src/changed.ts', 'src/gone.ts', 'src/new.ts', 'src/staged.ts']);
  assert.throws(() => changedFiles(root, registry, 'no-such-ref'), /git diff failed/);
});

test('the review: a secret fails it, the rest is the reviewer list, and nothing runs that the change does not need', async t => {
  const registry = { ...REGISTRY, dependencies: { minPackageAgeDays: 30, minVersionAgeDays: 7 }, roots: ['src', 'package.json'], rows: [{ paths: ['src/**/*', 'package.json'], write: [], stop: [] }] };
  const { root, put, git } = repository(t, { 'src/a.ts': '1\n', 'src/a.test.ts': "expect(a).toBe(1);\n", 'package.json': '{}\n' }, registry);
  const base = git('rev-parse', 'HEAD').stdout.trim();
  const asked = { check: 0 };
  const check = ({ limits }) => { asked.check++; assert.deepEqual(limits, registry.dependencies); return { failures: ['package.json: refused'], notes: ['a note'] }; };
  const mutate = async () => { throw new Error('no mutation key, no mutation'); };
  const empty = await reviewChange({ root, base, check, mutate });
  assert.deepEqual(empty, { base, files: [], failures: [], quiet: [], surface: [], notes: [], mutants: [], changedTest: [], notTried: [] }, 'a change of nothing');
  assert.equal(asked.check, 0, 'and the registry is not asked');
  put('src/a.ts', glue('const a = "sk_', 'live_', LONG, '"; const b = eval(c);\n'));
  rmSync(join(root, 'src/a.test.ts'));
  put('package.json', '{ "name": "x" }\n');
  const result = await reviewChange({ root, base, check, mutate });
  assert.equal(asked.check, 1, 'a changed package list asks');
  assert.deepEqual(result.files, ['package.json', 'src/a.test.ts', 'src/a.ts']);
  assert.match(result.failures.join('\n'), /src\/a\.ts:1: a live credential/);
  assert.ok(result.failures.includes('package.json: refused'));
  assert.match(result.quiet.join('\n'), /src\/a\.test\.ts: assertions removed, 1 at HEAD|src\/a\.test\.ts: assertions removed/);
  assert.match(result.surface.join('\n'), /text run as code/);
  assert.ok(!result.surface.join('\n').includes('a live credential'), 'a refused line is not also on the list');
  assert.deepEqual(result.notes, ['a note']);
  const thrown = await reviewChange({ root, base, check: () => { throw new Error('ENOTFOUND'); }, mutate });
  assert.match(thrown.failures.join('\n'), /the dependency check could not finish: ENOTFOUND/, 'a check that could not finish fails the review');
  const withMutation = { ...registry, mutation: { shown: 8 } };
  put('scripts/workflow-gates/code-check.json', JSON.stringify(withMutation));
  const named = await reviewChange({ root, base, check: () => ({ failures: [], notes: [] }), minutes: 1, mutate: async ({ base: given, files, deadline }) => {
    assert.equal(given, base, 'the lines of the whole change, not of the last commit');
    assert.ok(files.includes('src/a.ts'));
    assert.ok(deadline - Date.now() <= 60000 && deadline - Date.now() > 50000, 'by the minutes asked');
    return [{ file: 'src/a.ts', total: 1, caught: 0, survivors: [{ line: 1, from: 'a', to: 'b' }], undecided: 0, notTried: 0, notLoaded: false, error: null }];
  } });
  assert.match(named.mutants.join('\n'), /src\/a\.ts:1: `a` became `b`/);
  const partly = await reviewChange({ root, base, check: () => ({ failures: [], notes: [] }), mutate: async () => [{ file: 'src/a.ts', total: 3, caught: 1, survivors: [{ line: 1, from: 'a', to: 'b' }], undecided: 0, notTried: 1, notLoaded: false, error: null }] });
  assert.equal(partly.mutants.length, 1, 'what no test noticed');
  assert.match(partly.notTried.join('\n'), /of 3 defects, 1 not tried because time ran out/, 'and what time did not reach is told apart from it');
  assert.ok(!partly.mutants.join('\n').includes('not tried'));
  const alone = await reviewChange({ root, base, check: () => ({ failures: [], notes: [] }), mutate: async () => [
    { file: 'src/a.ts', byTest: 'src/a.test.ts', total: 1, caught: 0, survivors: [{ line: 1, from: 'a', to: 'b' }], undecided: 0, notTried: 0, notLoaded: false, error: null },
    { file: 'src/b.ts', byTest: 'src/b.test.ts', total: 1, caught: 0, survivors: [], undecided: 0, notTried: 0, notLoaded: true, error: null },
    { file: 'src/c.ts', total: 1, caught: 0, survivors: [], undecided: 0, notTried: 0, notLoaded: true, error: null },
    { file: 'src/d.ts', total: 1, caught: 0, survivors: [], undecided: 0, notTried: 0, notLoaded: false, error: 'boom' },
  ] });
  assert.deepEqual(alone.changedTest.map(line => line.split(':')[0]), ['src/a.ts', 'src/b.ts'], 'a changed test judged alone says nothing of the other tests');
  assert.deepEqual(alone.mutants.map(line => line.split(':')[0]), ['src/c.ts', 'src/d.ts'], 'and what the whole suite left stays where it was');
});

test('the package check runs for the package list and for the lock file, each alone, and for nothing else', async t => {
  const registry = { ...REGISTRY, dependencies: {}, roots: ['src', 'package.json', 'package-lock.json'], rows: [{ paths: ['src/**/*', 'package.json', 'package-lock.json'], write: [], stop: [] }] };
  for (const [file, asks] of [['src/a.ts', 0], ['package.json', 1], ['package-lock.json', 1]]) {
    const { root, put, git } = repository(t, { 'src/a.ts': '1\n', 'package.json': '{}\n', 'package-lock.json': '{}\n' }, registry);
    const base = git('rev-parse', 'HEAD').stdout.trim();
    put(file, '{ "a": 1 }\n');
    let asked = 0;
    await reviewChange({ root, base, check: () => { asked++; return { failures: [], notes: [] }; }, mutate: async () => [] });
    assert.equal(asked, asks, file);
  }
});

test('with no minutes named the review keeps to the 8 the limit of the static group was checked against', async t => {
  const { root, put, git } = repository(t, { 'src/a.ts': '1\n' }, { ...REGISTRY, mutation: { shown: 8 } });
  const base = git('rev-parse', 'HEAD').stdout.trim();
  put('src/a.ts', '2\n');
  let left = 0;
  await reviewChange({ root, base, mutate: async ({ deadline }) => { left = deadline - Date.now(); return []; } });
  assert.ok(left <= 480000 && left > 470000, `${left} ms`);
});

test('the report says each class under its own heading and what a clean one proves', () => {
  const base = { base: 'abc', files: ['a'], failures: [], quiet: [], surface: [], notes: [], mutants: [] };
  const clean = renderReport(base);
  assert.match(clean, /Base `abc`, 1 code files\. A clean list here proves only that these checks found nothing; the reviewer still reads the whole diff\./);
  assert.match(clean, /Nothing to report\./);
  assert.doesNotMatch(clean, /## /);
  const full = renderReport({ ...base, failures: ['f1'], quiet: ['q1'], surface: ['s1'], notes: ['n1'], mutants: ['m1'], changedTest: ['c1'], notTried: ['t1'] });
  for (const [title, line] of [['Refused', 'f1'], ['A check said less', 'q1'], ['What an attacker reaches', 's1'], ['Lines no test checks', 'm1'], ['What a changed test misses', 'c1'], ['Not tried', 't1'], ['Notes', 'n1']]) assert.match(full, new RegExp(`## ${title}[^]*?- ${line}`), title);
  assert.doesNotMatch(full, /Nothing to report/);
  for (const key of ['failures', 'quiet', 'surface', 'notes', 'mutants', 'changedTest', 'notTried']) assert.doesNotMatch(renderReport({ ...base, [key]: ['x'] }), /Nothing to report/, key);
  assert.doesNotMatch(renderReport({ ...base, notTried: ['t1'], changedTest: ['c1'] }), /## Lines no test checks/, 'neither time that ran out nor one test judged alone reads as a gap in all the tests');
});

test('by hand and in CI: the exit code, the report file, the run summary, and no pass when it could not run', t => {
  const script = join(ROOT, 'scripts/workflow-gates/change-review.mjs');
  const { root, put, git } = repository(t, { 'src/a.ts': '1\n' }, REGISTRY);
  const base = git('rev-parse', 'HEAD').stdout.trim();
  const summary = join(root, 'test-results/summary.md');
  mkdirSync(dirname(summary), { recursive: true });
  const run = (args, env = {}) => spawnSync(process.execPath, [script, ...args], { cwd: tmpdir(), encoding: 'utf8', timeout: 60000, env: { ...process.env, CLAUDE_PROJECT_DIR: root, GITHUB_STEP_SUMMARY: '', ...env } });
  const clean = run([`--base=${base}`], { GITHUB_STEP_SUMMARY: summary });
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(readFileSync(join(root, 'test-results/workflow-gates/change-review.md'), 'utf8'), /Nothing to report/);
  assert.match(readFileSync(summary, 'utf8'), /# Change review/, 'CI shows it on the run');
  put('src/a.ts', 'const a = eval(b);\n');
  const listed = run([`--base=${base}`]);
  assert.equal(listed.status, 0, 'the reviewer list does not fail by itself');
  assert.match(listed.stdout, /text run as code/);
  put('src/a.ts', glue('const a = "sk_', 'live_', LONG, '";\n'));
  const refused = run([`--base=${base}`]);
  assert.equal(refused.status, 1, 'a secret fails it');
  assert.match(readFileSync(join(root, 'test-results/workflow-gates/change-review.md'), 'utf8'), /## Refused/);
  const broken = run(['--base=no-such-ref']);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /^CHANGE REVIEW COULD NOT RUN: /);
  put('src/a.ts', '1\n');
  git('update-ref', 'refs/remotes/origin/main', base);
  const bare = run([]);
  assert.equal(bare.status, 0, 'with no argument, as CI calls it');
  assert.match(bare.stdout, new RegExp(`Base \`${base}\``), 'it finds the base by itself');
  const mutating = repository(t, { 'src/a.ts': 'export const a = 1;\n' }, { ...REGISTRY, mutation: { timeoutMs: 20000, hookMs: 20000, perMutantMs: 1000, shown: 8, rows: [{ paths: ['src/**/*.ts'], run: `${NODE} -e "process.exit(0)"` }] } });
  const mutatingBase = mutating.git('rev-parse', 'HEAD').stdout.trim();
  mutating.put('src/a.ts', 'export const a = (b: number) => b === 1;\n');
  const inRoot = { CLAUDE_PROJECT_DIR: mutating.root };
  assert.match(run([`--base=${mutatingBase}`, '--minutes=0'], inRoot).stdout, /of 2 defects, 2 not tried because time ran out/, 'the minutes asked are the minutes used');
  assert.match(run([`--base=${mutatingBase}`], inRoot).stdout, /the tests that should reach it never loaded it/, 'and with none named the review has time');
  const elsewhere = run([`--base=${base}`], { CLAUDE_PROJECT_DIR: tmpdir() });
  assert.equal(elsewhere.status, 1, 'a folder that is no repository');
  assert.match(elsewhere.stderr, /no Git repository/);
});

test('every role and every tool is sent to the flow, CI runs it, and the flow names only what exists', () => {
  const read = file => readFileSync(join(ROOT, file), 'utf8');
  const RULE = 'shared/secure-code-review.md';
  for (const file of ['.claude/rules/README.md', '.claude/rules/create/01-preflight.md', '.claude/rules/execute/02-implement.md', '.claude/rules/review/02-adversarial-ui.md', 'AGENTS.md', 'CLAUDE.md']) {
    assert.ok(read(file).includes(RULE), `${file} names the flow`);
    // A rule in an ignored file reaches no other clone, and reading it here fails only on CI: .codex/ is ignored, so AGENTS.md carries this.
    assert.equal(spawnSync('git', ['check-ignore', '-q', file], { cwd: ROOT }).status, 1, `${file} is committed, so it reaches every clone`);
  }
  assert.match(read('AGENTS.md'), /node scripts\/workflow-gates\/change-review\.mjs --base=HEAD/, 'a tool without the hooks is told what to run by hand');
  assert.match(read('.claude/rules/execute/03-validate-handoff.md'), /node scripts\/workflow-gates\/change-review\.mjs/, 'the implementer runs it');
  const pipeline = JSON.parse(read('scripts/workflow-gates/pipeline.json'));
  assert.ok(pipeline.groups.static.some(command => command.join(' ') === 'node scripts/workflow-gates/change-review.mjs'), 'CI runs it whichever tool wrote the change');
  assert.ok(pipeline.commandTimeoutMinutes.static > 8, 'and its time fits the limit of the group');
  const flow = read(`.claude/rules/${RULE}`);
  assert.ok(flow.length < 8192, 'a phase file stays under 8 KB');
  for (const named of flow.matchAll(/`((?:node )?scripts\/workflow-gates\/[\w.-]+\.mjs|[\w-]+\.mjs)/g)) {
    const file = named[1].replace(/^node /, '');
    assert.ok(existsSync(join(ROOT, file.includes('/') ? file : `scripts/workflow-gates/${file}`)), `${file} exists`);
  }
  const publication = read('scripts/workflow-gates/publication.json');
  for (const file of ['code-check', 'mutation-check', 'dependency-check', 'change-review']) assert.ok(publication.includes(`scripts/workflow-gates/${file}.mjs`), `${file} is published`);
});

test('the fixture command of a registry cannot see this review, so a clean tool run proves its rules ran: a control', async t => {
  const { root, put } = repository(t, { 'src/a.ts': '1\n' }, { ...REGISTRY, rows: [{ paths: ['src/**/*'], write: [`${NODE} -e "process.exit(0)"`], stop: [] }] });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 'c' }, root);
  put('src/a.ts', glue('const a = "sk_', 'live_', LONG, '";\n'));
  assert.equal((await runCodeCheck({ hook_event_name: 'PostToolUse', session_id: 'c', tool_name: 'Bash' }, root)).status, 2, 'every command passed, and it is still refused');
});

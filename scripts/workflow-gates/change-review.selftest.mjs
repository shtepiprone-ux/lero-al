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
import { added, addedLinesOf, readRegistry, refusedLines, refusedText, runCodeCheck } from './code-check.mjs';
import { baseOf, changedFiles, renderReport, reviewChange } from './change-review.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const REAL = readRegistry(ROOT);
const REGISTRY_FILE = 'scripts/workflow-gates/code-check.json';
const REAL_TEXT = readFileSync(join(ROOT, REGISTRY_FILE), 'utf8');
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
  const { root, put } = repository(t, { 'src/a.ts': '', 'src/a.tsx': '', 'src/app/api/a/route.ts': '', 'supabase/migrations/1.sql': '', 'package.json': '{}', [REGISTRY_FILE]: REAL_TEXT });
  const named = file => [...added(root, REAL.secure, [file]), ...refusedLines(root, 'HEAD').map(refusedText)].filter(line => !line.includes('this file steers every later agent'));
  for (const [what, file, bad, good] of CASES) {
    put(file, `${good}\n`);
    assert.deepEqual(named(file), [], `the safe line stays quiet: ${good}`);
    put(file, `${bad}\n`);
    const lines = named(file);
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
  for (const file of ['scripts/workflow-gates/any.mjs', 'scripts/workflow-gates/deep/er.json', 'package.json', '.github/actions/x/action.yml', '.github/CODEOWNERS']) {
    put(file, 'a tool, a list of packages, or a file of the pipeline\n');
    assert.match(added(root, REAL.secure, [file]).join('\n'), /this file steers every later agent/, file);
  }
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

const KEY = glue('sk_', 'live_', LONG);
const OTHER_KEY = glue('sk_', 'live_', 'Z9y8X7w6V5u4T3s2R1q0P9o8N7m6L5k4');
const PLACES = ['docs/note.md', 'supabase/seed.sql', 'scripts/setup.sh', '.env.example', 'src/lib/data.json', 'public/config.txt', '.github/actions/x/action.yml', 'src/lib/notes.md', 'supabase/functions/x/index.ts', 'tests/a.ts', 'src/lib/caf\u00e9.ts'];
const REVIEW_SCRIPT = join(ROOT, 'scripts/workflow-gates/change-review.mjs');
const TOOL_SCRIPT = join(ROOT, 'scripts/workflow-gates/code-check.mjs');
function realFixture(t, files = {}) {
  const fixture = repository(t, { 'README.md': 'x\n', [REGISTRY_FILE]: REAL_TEXT, ...files });
  return { ...fixture, base: fixture.git('rev-parse', 'HEAD').stdout.trim() };
}
// The real main, by the run summary CI gives it, with every output it writes.
function reviewProcess({ root, base }) {
  const summary = join(root, 'test-results/summary.md');
  mkdirSync(dirname(summary), { recursive: true });
  rmSync(summary, { force: true });
  const child = spawnSync(process.execPath, [REVIEW_SCRIPT, `--base=${base}`], { cwd: tmpdir(), encoding: 'utf8', timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: root, GITHUB_STEP_SUMMARY: summary } });
  return { status: child.status, outputs: { stdout: child.stdout, stderr: child.stderr, summary: readFileSync(summary, 'utf8'), report: readFileSync(join(root, 'test-results/workflow-gates/change-review.md'), 'utf8') } };
}
const hookProcess = (root, session, name, file = null) => spawnSync(process.execPath, [TOOL_SCRIPT], { cwd: root, encoding: 'utf8', timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  input: JSON.stringify({ hook_event_name: name, session_id: session, cwd: root, ...(file ? { tool_name: 'Write', tool_input: { file_path: join(root, file) } } : {}) }) });
const keyAbsent = (outputs, label) => { for (const [where, text] of Object.entries(outputs)) assert.ok(!text.includes(KEY) && !text.includes(OTHER_KEY) && !text.includes(LONG), `${label}: ${where} repeats the key`); };
// Each place holds the key untracked, then staged, then committed, as the review of a whole change meets it. Every run comes back for the echo case to read.
function reviewsOfEachState(t) {
  const fixture = realFixture(t);
  const runs = [];
  const judged = state => { runs.push({ state, ...reviewProcess(fixture) }); };
  for (const place of PLACES) fixture.put(place, `const a = "${KEY}";\n`);
  judged('untracked');
  fixture.git('add', '-A');
  judged('staged');
  fixture.commit('holds the keys');
  judged('committed');
  return runs;
}
function hooksOfEachPlace(t) {
  const fixture = realFixture(t);
  return PLACES.map((place, index) => {
    const session = `place-${index}`;
    assert.equal(hookProcess(fixture.root, session, 'SessionStart').status, 0, place);
    fixture.put(place, `const a = "${KEY}";\n`);
    const written = hookProcess(fixture.root, session, 'PostToolUse', place);
    const stopped = hookProcess(fixture.root, session, 'Stop');
    rmSync(join(fixture.root, place));
    return { place, written, stopped };
  });
}

test('[GOV-945-HOOK-SECRET-REACH-DENY] What must never enter the tree is refused in whatever file holds it', t => {
  for (const { state, status, outputs } of reviewsOfEachState(t)) {
    assert.equal(status, 1, `${state}: the review fails\n${outputs.stdout}${outputs.stderr}`);
    for (const place of PLACES) assert.ok(outputs.stdout.includes(`${place}:1: a live credential`), `${state}: ${place} is named as itself\n${outputs.stdout}`);
  }
  for (const { place, written, stopped } of hooksOfEachPlace(t)) {
    assert.equal(written.status, 2, `${place}: refused after the write\n${written.stderr}`);
    assert.ok(written.stderr.startsWith(`CODE CHECK FAILED after a write to ${place}.`), written.stderr);
    assert.equal(stopped.status, 2, `${place}: refused at Stop\n${stopped.stderr}`);
    assert.ok(stopped.stderr.includes(`${place}:1: a live credential`), stopped.stderr);
  }
  const fixture = realFixture(t, { 'docs/note.md': `const a = "${KEY}";\n` });
  fixture.put('docs/note.md', `const a = "${OTHER_KEY}";\n`);
  assert.deepEqual(refusedLines(fixture.root, fixture.base).map(refusedText), ['docs/note.md:1: a live credential (CWE-798). Remove it and rotate it'], 'a key replaced by another is named, though the count is the same');
  assert.equal(reviewProcess(fixture).status, 1);
  fixture.put('docs/note.md', `const a = "${KEY}";\nconst b = 1;\n`);
  assert.deepEqual(refusedLines(fixture.root, fixture.base), [], 'an old key left in place while a line is added is not this change');
  assert.equal(reviewProcess(fixture).status, 0, 'and the review passes it');
});

test('[GOV-945-HOOK-SECRET-ECHO-DENY] What is refused is never repeated', t => {
  for (const { state, outputs } of reviewsOfEachState(t)) {
    keyAbsent(outputs, state);
    for (const where of ['stdout', 'summary', 'report']) assert.ok(outputs[where].includes('docs/note.md:1:'), `${state}: ${where} holds the file and the line`);
  }
  for (const { place, written, stopped } of hooksOfEachPlace(t)) {
    keyAbsent({ stdout: written.stdout, message: written.stderr }, `${place} after the write`);
    keyAbsent({ stdout: stopped.stdout, message: stopped.stderr }, `${place} at Stop`);
    assert.ok(written.stderr.includes(`${place}:1:`), written.stderr);
  }
  const fixture = realFixture(t, { 'src/a.ts': 'export const a = 1;\n', 'src/a.test.ts': "it('a', () => {});\n" });
  fixture.put('src/a.ts', `export const a = eval("${KEY}");\n`);
  fixture.put('src/a.test.ts', `it.skip('${KEY}', () => {});\n`);
  const review = reviewProcess(fixture);
  keyAbsent(review.outputs, 'a line another rule also finds');
  assert.match(review.outputs.report, /src\/a\.ts:1: text run as code \(CWE-95\): its text is withheld/, 'the reviewer still gets the place');
  assert.match(review.outputs.report, /src\/a\.test\.ts:1: a test switched off: its text is withheld/);
  fixture.put('src/a.ts', 'export const a = eval(b);\n');
  fixture.put('src/a.test.ts', "it('a', () => {});\n");
  assert.match(reviewProcess(fixture).outputs.report, /text run as code \(CWE-95\): export const a = eval\(b\);/, 'a line with nothing refused is shown as it is');
});

test('the reader of a diff: an added line that looks like a header, a removed one, a line count, and a quoted path', () => {
  const diff = [
    'diff --git a/a.md b/a.md', '--- a/a.md', '+++ b/a.md', '@@ -1,2 +1,3 @@ context', '-old one', '--- old two', '+new', '+++ b/fake.md', '+third', '\\ No newline at end of file',
    '@@ -9 +10 @@', '-x', '+y',
    '+++ "b/q\\"uo\\303\\251\\tte.md"\t', '@@ -0,0 +7 @@', '+z',
    '--- a/gone.md', '+++ /dev/null', '@@ -1 +0,0 @@', '-removed',
  ].join('\n');
  assert.deepEqual(addedLinesOf(diff), [
    { file: 'a.md', line: 1, text: 'new' }, { file: 'a.md', line: 2, text: '++ b/fake.md' }, { file: 'a.md', line: 3, text: 'third' }, { file: 'a.md', line: 10, text: 'y' },
    { file: 'q"uo\u00e9\tte.md', line: 7, text: 'z' },
  ]);
});

test('the reader of the tree: an added line that begins like a header, a diff attribute, Git settings, what is skipped, and a base that cannot be read', t => {
  const fixture = realFixture(t, { 'docs/a.md': 'one\ntwo\n', '.gitattributes': 'docs/hidden.md -diff\n', 'docs/hidden.md': 'x\n', 'docs/kept.md': 'x\n' });
  fixture.put('docs/a.md', `one\n++ ${KEY}\ntwo\nthree ${KEY}\n`);
  assert.deepEqual(refusedLines(fixture.root, fixture.base).map(({ file, line }) => `${file}:${line}`), ['docs/a.md:2', 'docs/a.md:4'], 'each at the line it is on');
  fixture.put('docs/a.md', 'one\ntwo\n');
  fixture.put('docs/hidden.md', `${KEY}\n`);
  assert.deepEqual(refusedLines(fixture.root, fixture.base).map(({ file }) => file), ['docs/hidden.md'], 'a file Git calls binary and prints no line of is read');
  fixture.put('docs/hidden.md', 'x\n');
  for (const [setting, value] of [['diff.noprefix', 'true'], ['diff.mnemonicPrefix', 'true'], ['color.ui', 'always']]) {
    fixture.git('config', setting, value);
    fixture.put('docs/kept.md', `${KEY}\n`);
    assert.deepEqual(refusedLines(fixture.root, fixture.base).map(({ file }) => file), ['docs/kept.md'], `${setting} changes no name`);
    fixture.git('config', '--unset', setting);
  }
  fixture.put('docs/kept.md', 'x\n');
  fixture.put('docs/large.md', `${KEY}\n${'a'.repeat(8 << 20)}`);
  fixture.put('docs/nul.md', `\0${KEY}\n`);
  fixture.put('docs/exact.md', `${KEY}\n${'a'.repeat((8 << 20) - KEY.length - 1)}`);
  fixture.git('add', 'docs/large.md');
  assert.deepEqual(refusedLines(fixture.root, fixture.base, ['docs/gone.md', 'docs'], { untracked: true }).map(({ file }) => file), ['docs/exact.md'], 'above 8 MiB, with a NUL, gone, or a folder: skipped; exactly 8 MiB is read');
  assert.deepEqual(refusedLines(fixture.root, null, ['docs/exact.md']).length, 1, 'with no base only what is named is read');
  assert.deepEqual(refusedLines(fixture.root, null), [], 'and without a name, nothing');
  assert.throws(() => refusedLines(fixture.root, 'no-such-ref'), /git diff failed/, 'a base that cannot be read is no pass');
  const quiet = repository(t, { 'docs/a.md': 'a\n' }, { ...REGISTRY, secure: [] });
  quiet.put('docs/a.md', `${KEY}\n`);
  assert.deepEqual(refusedLines(quiet.root, 'HEAD'), [], 'a registry with no refuse rule reads nothing');
  const narrow = repository(t, { 'docs/a.md': 'a\n', 'src/a.ts': 'a\n' }, { ...REGISTRY, secure: [{ paths: ['src/**/*'], refuse: true, pattern: 'sk_', what: 'x' }] });
  narrow.put('docs/a.md', `${KEY}\n`);
  narrow.put('src/a.ts', `${KEY}\n`);
  assert.deepEqual(refusedLines(narrow.root, 'HEAD').map(({ file }) => file), ['src/a.ts'], 'a rule holds only the paths it names');
});

test('through the tool: a write tool names a file no row holds, and it is refused at the write, at Stop and until it is clean', async t => {
  const { root, put } = repository(t, { 'docs/a.md': 'a\n' }, REGISTRY);
  const event = (name, extra = {}) => ({ hook_event_name: name, session_id: 's', cwd: root, ...extra });
  const write = { tool_name: 'Write', tool_input: { file_path: join(root, 'docs/a.md') } };
  await runCodeCheck(event('SessionStart'), root);
  put('docs/a.md', `${KEY}\n`);
  const first = await runCodeCheck(event('PostToolUse', write), root);
  assert.equal(first.status, 2);
  assert.equal(first.message, 'CODE CHECK FAILED after a write to docs/a.md. Fix this now, before anything else:\ndocs/a.md:1: a live credential (CWE-798). Remove it and rotate it');
  assert.deepEqual(await runCodeCheck(event('PostToolUse', { tool_name: 'Read', tool_input: { file_path: join(root, 'docs/a.md') } }), root), { status: 0, message: '' }, 'a read of it is no write');
  const stopped = await runCodeCheck(event('Stop'), root);
  assert.equal(stopped.status, 2);
  assert.ok(stopped.message.startsWith('CODE CHECK FAILED: docs/a.md holds what must never enter the tree. Fix this before finishing:\ndocs/a.md:1: '), stopped.message);
  assert.ok(stopped.message.endsWith('A session that wrote none of these files reports that instead of changing them.'), stopped.message);
  assert.equal((await runCodeCheck(event('SubagentStop'), root)).status, 2, 'a subagent cannot finish over it either');
  put('docs/a.md', 'clean\n');
  assert.deepEqual(await runCodeCheck(event('PostToolUse', write), root), { status: 0, message: '' });
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
  assert.deepEqual(empty, { base, files: [], failures: [], left: [], quiet: [], surface: [], notes: [], couldNotRun: [], mutants: [], changedTest: [], notTried: [], undecided: [] }, 'a change of nothing');
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
  const tests = { ran: 0 };
  await reviewChange({ root, base, check: () => ({ failures: [], notes: [] }), mutate: async () => { tests.ran++; return []; } });
  assert.equal(tests.ran, 0, 'no test runs over a refused line, because its output could repeat it');
  put('package.json', glue('{ "dependencies": { "sk_', 'live_', LONG, '": "1.0.0" } }\n'));
  const before = asked.check;
  await reviewChange({ root, base, check, mutate });
  assert.equal(asked.check, before, 'and no package check over a refused package list, whose message names what it read');
  put('package.json', '{ "name": "x" }\n');
  put('src/a.ts', 'const b = eval(c);\n');
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
  assert.deepEqual(alone.mutants.map(line => line.split(':')[0]), ['src/c.ts'], 'and what the whole suite left stays where it was');
  assert.deepEqual(alone.couldNotRun.map(line => line.split(':')[0]), ['src/d.ts'], 'and a check that could not run is told apart from a gap');
  const verdictless = await reviewChange({ root, base, check: () => ({ failures: [], notes: [] }), mutate: async () => [
    { file: 'src/a.ts', total: 2, caught: 0, survivors: [], undecided: 2, notTried: 0, notLoaded: false, error: null },
    { file: 'src/b.ts', total: 1, caught: 0, survivors: [], undecided: 0, notTried: 0, notLoaded: false, error: 'a run changed the tree, so no more defects of this file ran.' },
  ] });
  const rendered = renderReport(verdictless);
  assert.match(rendered, /## Could not run\n\n.+\n\n- src\/b\.ts: the mutation check could not run: a run changed the tree/);
  assert.match(rendered, /## Undecided\n\n.+\n\n- src\/a\.ts: of 2 defects, 2 undecided, because a run ended with no verdict: /);
  assert.doesNotMatch(rendered, /## Lines no test checks/, 'neither reads as a line no test checks');
  assert.doesNotMatch(rendered, /## Not tried|time ran out/, 'and no word of time, when none ran out');
});

test('a staged rename reaches the review under both names, and a file gone from the tree is searched for', async t => {
  const registry = { roots: ['src'], rowsFor: () => [{}] };
  const { root, git } = repository(t, { 'src/old.ts': '1\n', 'src/user.ts': "import { a } from './old';\n", 'src/named.json': '{}\n', 'src/reader.ts': "import data from './named.json';\n", 'src/quiet.json': '{}\n' }, REGISTRY);
  const base = git('rev-parse', 'HEAD').stdout.trim();
  git('mv', 'src/old.ts', 'src/new.ts');
  assert.deepEqual(changedFiles(root, registry, base), ['src/new.ts', 'src/old.ts']);
  rmSync(join(root, 'src/named.json'));
  rmSync(join(root, 'src/quiet.json'));
  const { left } = await reviewChange({ root, base, mutate: async () => [] });
  assert.deepEqual(left, ['src/named.json is gone and these still name it: src/reader.ts', 'src/old.ts is gone and these still name it: src/user.ts'], 'each with what still names it, and a file nothing names is no line');
  const report = renderReport({ base, files: [], failures: [], left, quiet: [], surface: [], notes: [], mutants: [] });
  assert.match(report, /## What a deletion left behind\n\n.+\n\n- src\/named\.json is gone and these still name it: src\/reader\.ts\n- src\/old\.ts/);
  assert.doesNotMatch(report, /Nothing to report/);
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
  const full = renderReport({ ...base, failures: ['f1'], left: ['l1'], quiet: ['q1'], surface: ['s1'], notes: ['n1'], couldNotRun: ['r1'], mutants: ['m1'], changedTest: ['c1'], notTried: ['t1'], undecided: ['u1'] });
  for (const [title, line] of [['Refused', 'f1'], ['What a deletion left behind', 'l1'], ['Could not run', 'r1'], ['Undecided', 'u1'], ['A check said less', 'q1'], ['What an attacker reaches', 's1'], ['Lines no test checks', 'm1'], ['What a changed test misses', 'c1'], ['Not tried', 't1'], ['Notes', 'n1']]) assert.match(full, new RegExp(`## ${title}[^]*?- ${line}`), title);
  assert.doesNotMatch(full, /Nothing to report/);
  for (const key of ['failures', 'left', 'quiet', 'surface', 'notes', 'couldNotRun', 'mutants', 'changedTest', 'notTried', 'undecided']) assert.doesNotMatch(renderReport({ ...base, [key]: ['x'] }), /Nothing to report/, key);
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
  assert.match(run([`--base=${mutatingBase}`], inRoot).stdout, /no run showed it loaded/, 'and with none named the review has time');
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
  assert.ok(Buffer.byteLength(flow) <= 8192, 'a phase file stays under 8 KB');
  const sectionOf = (from, to) => flow.slice(flow.indexOf(from), flow.indexOf(to));
  const after = sectionOf('## 3.', '## 4.').replace(/\s+/g, ' ');
  for (const limit of ['a change of the lock file alone never asks the registry', 'a line moved inside one file is not named', 'a commit made during a session hides a version that failed before it']) assert.ok(after.includes(limit), `section 3 says: ${limit}`);
  const review = sectionOf('## 4.', '## 5.');
  for (const [heading, items] of Object.entries({
    '**Input:**': ['parameterized queries', 'path traversal', 'deserialization or XXE'],
    '**Authentication:**': ['password hashing', 'lockout', 'MFA', 'secure reset', 'concurrent sessions'],
    '**Cryptography and secrets:**': ['certificate and hostname validation', 'TLS'],
    '**Configuration and dependencies:**': ['environment separation'],
    '**Monitoring:**': ['alerts'],
  })) {
    const item = review.slice(review.indexOf(heading)).split('\n- ')[0].replace(/\s+/g, ' ');
    for (const word of items) assert.ok(item.includes(word), `${heading} holds ${word}`);
  }
  const preparation = review.slice(0, review.indexOf('Steps for a change:')).replace(/\s+/g, ' ');
  for (const word of ['threat model', 'previous security findings']) assert.ok(preparation.includes(word), `its preparation holds ${word}`);
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

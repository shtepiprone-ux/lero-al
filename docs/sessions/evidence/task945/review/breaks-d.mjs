// Task 945 independent review, third set: cases the author's report does not name. Fixtures only, plus read-only measures of the real tree.
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = 'C:/Claude_Code_Projects/lero-al';
const T = 'scripts/workflow-gates';
const TOOL = `${T}/code-check.mjs`;
const made = [];
const say = (...a) => console.log(...a);
function chain(extra) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-review-d-'));
  made.push(root);
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  for (const file of ['eslint.config.mjs', 'tsconfig.json', 'vitest.config.ts', 'src/tests/setup.ts', 'src/tests/server-only-stub.ts', 'src/tests/next-cache-stub.ts', 'scripts/check-file-integrity.mjs', 'scripts/check-mojibake.mjs', 'scripts/mojibake-allowlist.json', TOOL, `${T}/selftests.mjs`, `${T}/contract.mjs`, `${T}/mutation-check.mjs`, `${T}/mutation-loader.mjs`, `${T}/mutation-vitest.config.mjs`, `${T}/dependency-check.mjs`, `${T}/change-review.mjs`]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(join(ROOT, file), join(root, file));
  }
  const registry = JSON.parse(readFileSync(join(ROOT, `${T}/code-check.json`), 'utf8'));
  put(`${T}/code-check.json`, JSON.stringify(extra.keepMutation ? registry : { ...registry, mutation: undefined }));
  symlinkSync(join(ROOT, 'node_modules'), join(root, 'node_modules'), 'junction');
  for (const [file, text] of Object.entries({ '.gitignore': 'node_modules\ntest-results\n*.tsbuildinfo\n', 'next-env.d.ts': '/// <reference types="next" />\n', 'package.json': '{ "name": "fixture", "private": true, "type": "module" }\n', [`${T}/fixture.selftest.mjs`]: "import { test } from 'node:test';\ntest('fixture', () => {});\n", ...extra.files })) put(file, text);
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('add', '-A');
  git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'base');
  const input = (name, file, session = 's') => JSON.stringify({ hook_event_name: name, session_id: session, cwd: root, ...(file ? { tool_name: 'Edit', tool_input: { file_path: join(root, file) } } : {}) });
  const hook = (name, file, session) => spawnSync(process.execPath, [join(root, TOOL)], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 280000, env: { ...process.env, CLAUDE_PROJECT_DIR: root }, input: input(name, file, session) });
  const hookAsync = (name, file, session) => new Promise(done => {
    const child = spawn(process.execPath, [join(root, TOOL)], { cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root }, stdio: ['pipe', 'pipe', 'pipe'] });
    let err = '';
    child.stderr.setEncoding('utf8').on('data', c => { err += c; });
    child.on('close', status => done({ status, err }));
    child.stdin.end(input(name, file, session));
  });
  return { root, put, git, hook, hookAsync };
}
const section = process.argv[2];
const want = name => !section || section === name;

if (want('mutant')) {
  say('=== M1 "No file on disk changes": a scanner with an update flag, loaded by its test, through the real mutation check');
  const scanner = "import { writeFileSync } from 'node:fs';\nexport function run(argv) {\n  const update = argv.includes('--update');\n  if (update) writeFileSync('scripts/baseline.json', JSON.stringify({ wiped: true }));\n  return update ? 'updated' : 'checked';\n}\n";
  const test = "import { it, expect } from 'vitest';\nimport { run } from '../check-update.mjs';\nit('runs', () => { expect(typeof run([])).toBe('string'); });\n";
  const c = chain({ keepMutation: true, files: { 'scripts/check-update.mjs': scanner, 'scripts/baseline.json': '{"entries":[1,2,3]}\n', 'scripts/__tests__/check-update.test.ts': test } });
  const before = readFileSync(join(c.root, 'scripts/baseline.json'), 'utf8');
  const run = spawnSync(process.execPath, [join(c.root, T, 'mutation-check.mjs'), '--all', '--minutes=2', 'scripts/check-update.mjs'], { cwd: c.root, encoding: 'utf8', timeout: 200000, env: { ...process.env, CLAUDE_PROJECT_DIR: c.root } });
  say(run.stdout.split('\n').slice(0, 8).join('\n').slice(0, 600));
  const now = readFileSync(join(c.root, 'scripts/baseline.json'), 'utf8');
  say('the tracked baseline changed on disk:', now !== before, JSON.stringify(now));
  say('git status:', JSON.stringify(c.git('status', '--short', '--', 'scripts').stdout.trim()));
}

if (want('deleted')) {
  say('\n=== D3 a deleted test, an emptied test, a renamed test: what the tool and the review say');
  const c = chain({ files: { 'src/lib/a.ts': 'export const a = 1;\n', 'src/lib/a.test.ts': "import { it, expect } from 'vitest';\nimport { a } from './a';\nit('a', () => { expect(a).toBe(1); });\n", 'src/lib/b.ts': 'export const b = 1;\n', 'src/lib/b.test.ts': "import { it, expect } from 'vitest';\nimport { b } from './b';\nit('b', () => { expect(b).toBe(1); });\n" } });
  c.hook('SessionStart');
  rmSync(join(c.root, 'src/lib/a.test.ts'));
  const stop1 = c.hook('Stop');
  say('test file deleted: Stop', stop1.status, JSON.stringify(stop1.stderr.slice(0, 220)));
  const review = spawnSync(process.execPath, [join(c.root, T, 'change-review.mjs'), '--base=HEAD', '--minutes=0'], { cwd: c.root, encoding: 'utf8', timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: c.root, GITHUB_STEP_SUMMARY: '' } });
  say('change-review exit', review.status, /deleted|a\.test\.ts/.test(review.stdout) ? 'names it' : 'DOES NOT NAME IT');
  say(review.stdout.split('\n').filter(l => /a\.test\.ts/.test(l)).join('\n').slice(0, 300));
}

if (want('parallel')) {
  say('\n=== P1 three PostToolUse at once on one written file: a false failure from one tsbuildinfo or the state?');
  const c = chain({ files: { 'src/lib/p.ts': 'export const p = 1;\n', 'src/lib/q.ts': 'export const q = 1;\n', 'src/lib/r.ts': 'export const r = 1;\n' } });
  c.hook('SessionStart');
  c.put('src/lib/p.ts', 'export const p = 2;\n'); c.put('src/lib/q.ts', 'export const q = 2;\n'); c.put('src/lib/r.ts', 'export const r = 2;\n');
  const started = Date.now();
  const all = await Promise.all(['p', 'q', 'r'].map(n => c.hookAsync('PostToolUse', `src/lib/${n}.ts`)));
  say('statuses', all.map(r => r.status).join(','), `${Math.round((Date.now() - started) / 1000)} s`, JSON.stringify(all.map(r => r.err.slice(0, 160)).filter(Boolean)));
  const again = c.hook('Stop');
  say('Stop', again.status, JSON.stringify(again.stderr.slice(0, 200)));
}

if (want('names')) {
  say('\n=== N1 a file name reaching the mutation command through a POSIX shell, as on the Linux CI runner');
  const { planOf } = await import(pathToFileURL(join(ROOT, T, 'mutation-check.mjs')).href);
  const { default: ts } = await import(pathToFileURL(join(ROOT, 'node_modules/typescript/lib/typescript.js')).href);
  const hostile = 'src/lib/$(touch PWNED).ts';
  const c = chain({ keepMutation: true, files: { 'src/lib/plain.ts': 'export const p = 1;\n' } });
  c.put(hostile, 'export const x = 1;\n');
  const registry = JSON.parse(readFileSync(join(c.root, `${T}/code-check.json`), 'utf8'));
  const plan = planOf(ts, c.root, registry.mutation, [hostile], true);
  say('planned command:', plan[0]?.command?.slice(0, 150));
  const sh = 'C:/Program Files/Git/bin/sh.exe';
  if (plan[0] && existsSync(sh)) {
    spawnSync(sh, ['-c', plan[0].command.replace(/^node .*? related /, 'true related ')], { cwd: c.root, encoding: 'utf8', timeout: 60000 });
    say('POSIX shell ran the name as a command, PWNED exists:', existsSync(join(c.root, 'PWNED')));
  }
  const hookStop = c.hook('Stop', hostile);
  say('the hook, for the same name, Stop', hookStop.status, JSON.stringify(hookStop.stderr.slice(0, 140)));
}

if (want('npm')) {
  say('\n=== N2 a package name in package.json reaching cmd.exe through dependency-check, by the hook; the payload only writes a marker in the fixture');
  const c = chain({ keepMutation: false, files: {} });
  c.hook('SessionStart');
  const hostile = 'left-pad&echo ran>PWNED-NPM&rem ';
  c.put('package.json', `${JSON.stringify({ name: 'fixture', private: true, type: 'module', dependencies: { [hostile]: '1.0.0' } }, null, 2)}\n`);
  const post = c.hook('PostToolUse', 'package.json');
  say('PostToolUse', post.status, JSON.stringify(post.stderr.slice(0, 260)));
  const stop = c.hook('Stop');
  say('Stop', stop.status, JSON.stringify(stop.stderr.slice(0, 200)));
  say('the name ran as a command, PWNED-NPM exists:', existsSync(join(c.root, 'PWNED-NPM')));
  const d = chain({ files: {} });
  d.put('package.json', `${JSON.stringify({ name: 'fixture', private: true, type: 'module', dependencies: { [hostile]: '1.0.0' } }, null, 2)}\n`);
  d.git('add', '-A');
  d.git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'hostile');
  const review = spawnSync(process.execPath, [join(d.root, T, 'change-review.mjs'), '--base=HEAD~1', '--minutes=0'], { cwd: d.root, encoding: 'utf8', timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: d.root, GITHUB_STEP_SUMMARY: '' } });
  say('change-review of a committed package.json: exit', review.status, 'PWNED-NPM exists:', existsSync(join(d.root, 'PWNED-NPM')));
}

if (want('real')) {
  say('\n=== T1 real tree: time of the events with no code change, probe session');
  const session = 'task945-review-probe';
  const state = join(ROOT, 'test-results/code-check', `${session}.json`);
  rmSync(state, { force: true });
  const event = name => JSON.stringify({ hook_event_name: name, session_id: session, cwd: ROOT, ...(name === 'PostToolUse' ? { tool_name: 'Bash', tool_input: { command: 'true' } } : {}) });
  for (const name of ['SessionStart', 'PostToolUse', 'PostToolUse', 'Stop', 'Stop']) {
    const begun = Date.now();
    const r = spawnSync(process.execPath, [join(ROOT, TOOL)], { cwd: ROOT, input: event(name), encoding: 'utf8', timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
    say(name, 'exit', r.status, `${Date.now() - begun} ms`);
  }
  const held = JSON.parse(readFileSync(state, 'utf8'));
  say('baseline files in the probe state:', Object.keys(held.baseline).length);
  rmSync(state, { force: true });

  say('\n=== C1 tracked files with no row: nothing checks them, secret rules included');
  const { readRegistry } = await import(pathToFileURL(join(ROOT, TOOL)).href);
  const registry = readRegistry(ROOT);
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean);
  const outside = files.filter(file => !registry.rowsFor(file).length);
  const groups = {};
  for (const file of outside) {
    const dir = file.split('/').slice(0, file.startsWith('src/') || file.startsWith('.claude/') || file.startsWith('.github/') ? 2 : 1).join('/');
    const ext = (/\.[^./]+$/.exec(file)?.[0] || '(none)').toLowerCase();
    const k = `${dir} ${ext}`;
    groups[k] = (groups[k] || 0) + 1;
  }
  say(`${files.length} tracked, ${outside.length} with no row`);
  say(Object.entries(groups).sort((a, b) => b[1] - a[1]).filter(([k]) => !/^(docs|tasks)\b/.test(k)).slice(0, 40).map(([k, v]) => `${v} ${k}`).join('\n'));
  say('docs+tasks:', Object.entries(groups).filter(([k]) => /^(docs|tasks)\b/.test(k)).reduce((n, [, v]) => n + v, 0));
}

for (const root of made) {
  const link = join(root, 'node_modules');
  spawnSync('cmd', ['/c', 'rmdir', link]);
  if (!existsSync(link)) rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  else say('LEFT', root);
}

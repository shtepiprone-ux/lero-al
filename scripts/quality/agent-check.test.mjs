// Tests of the agent loop hook (Task 945). Run: node --test scripts/quality/agent-check.test.mjs
// Each case writes real files, feeds the hook the payload Claude Code sends, and checks the decision.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = path.join(ROOT, 'src', '__agent_check_test__');
const REL = 'src/__agent_check_test__';
const HOOK = path.join(ROOT, 'scripts', 'quality', 'agent-check.mjs');
const STATE = path.join(spawnSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim(), 'lero-al-agent-check');

rmSync(DIR, { recursive: true, force: true });
after(() => rmSync(DIR, { recursive: true, force: true }));

function hook(mode, payload) {
  const r = spawnSync(process.execPath, [HOOK, mode], {
    cwd: ROOT,
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** A new session whose baseline is the tree as it is now. */
function session(name) {
  const id = `test-${name}-${process.pid}`;
  rmSync(path.join(STATE, `${id}.json`), { force: true });
  assert.equal(hook('start', { session_id: id }).status, 0);
  return id;
}

function write(name, text) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(path.join(DIR, name), text);
  return `${REL}/${name}`;
}

const clear = () => rmSync(DIR, { recursive: true, force: true });

test('start: the session context carries the OWASP reference state and the plan and review commands', () => {
  const id = `test-owasp-${process.pid}`;
  const r = hook('start', { session_id: id });
  rmSync(path.join(STATE, `${id}.json`), { force: true });
  assert.equal(r.status, 0);
  const context = JSON.parse(r.stdout).hookSpecificOutput;
  assert.equal(context.hookEventName, 'SessionStart');
  assert.match(context.additionalContext, /^OWASP reference: /);
  assert.match(context.additionalContext, /owasp\.mjs plan <kickoff>[\s\S]*owasp\.mjs review <kickoff>/);
});

test('post: a lint error goes back to the agent with exit 2', () => {
  const id = session('lint');
  const rel = write('evil.ts', 'export function run(code: string) {\n  return eval(code);\n}\n');
  const r = hook('post', { session_id: id, tool_input: { file_path: rel } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no-eval/);
  clear();
});

test('post: any file type gets the file checks (invisible character in Markdown)', () => {
  const id = session('md');
  const rel = write('notes.md', `# Notes\n\nhidden${String.fromCodePoint(0x202e)}text\n`);
  const r = hook('post', { session_id: id, tool_input: { file_path: rel } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /invisible-character/);
  clear();
});

test('post: a secret in a JSON file is refused', () => {
  const id = session('secret');
  const rel = write('cfg.json', JSON.stringify({ key: `sb_secret_${'a'.repeat(30)}` }));
  const r = hook('post', { session_id: id, tool_input: { file_path: rel } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Supabase secret key/);
  clear();
});

test('post: a clean file passes; files outside the project are ignored', () => {
  const id = session('clean');
  const rel = write('clean.ts', 'export const value = 1;\n');
  assert.equal(hook('post', { session_id: id, tool_input: { file_path: rel } }).status, 0);
  assert.equal(hook('post', { session_id: id, tool_input: { file_path: path.join(os.tmpdir(), 'x.ts') } }).status, 0);
  clear();
});

test('stop: a session that changed nothing is not checked', () => {
  const id = session('none');
  const r = hook('stop', { session_id: id });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('stop: a file written outside Edit/Write (for example by a shell command) is still checked', () => {
  const id = session('bash');
  write('shell.md', `# Shell\n\n${String.fromCodePoint(0x200b)}\n`);
  const out = JSON.parse(hook('stop', { session_id: id }).stdout);
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /invisible-character/);
  clear();
  rmSync(path.join(STATE, `${id}.json`), { force: true });
});

test('stop: a type error anywhere in the project blocks the finish', () => {
  const id = session('types');
  write('typed.ts', 'export const n: number = "text";\n');
  const out = JSON.parse(hook('stop', { session_id: id }).stdout);
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /TS2322/);
  clear();
  rmSync(path.join(STATE, `${id}.json`), { force: true });
});

test('stop: product code changed without a test change blocks the finish', () => {
  const id = session('untested');
  write('logic.ts', 'export const twice = (n: number): number => n * 2;\n');
  const out = JSON.parse(hook('stop', { session_id: id }).stdout);
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /no test added or updated/);
  clear();
  rmSync(path.join(STATE, `${id}.json`), { force: true });
});

test('stop: clean changes with their test let the agent finish, and the next stop checks nothing new', () => {
  const id = session('ok');
  write('fine.ts', 'export const fine = 2;\n');
  write('fine.test.ts', "import { it, expect } from 'vitest';\nimport { fine } from './fine';\n\nit('is two', () => {\n  expect(fine).toBe(2);\n});\n");
  const first = hook('stop', { session_id: id });
  assert.equal(first.status, 0);
  assert.equal(first.stdout, '', first.stdout);
  const second = hook('stop', { session_id: id });
  assert.equal(second.stdout, '');
  clear();
});

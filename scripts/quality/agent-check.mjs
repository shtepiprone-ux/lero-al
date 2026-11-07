#!/usr/bin/env node
// Agent quality loop for Claude Code (Task 945, governance reset 2026-11-06).
//
// OWASP basis: Secure Code Review ("run automated tools before manual review"; lightweight checks before commit),
// Secure Coding with AI (agent output is checked by tools, then by a human; invisible characters and secrets are
// refused), AI Agent Security (the check does not trust the agent's own report).
//
//   node scripts/quality/agent-check.mjs start  SessionStart: records which files are already changed, so the
//                                               session is answerable for what it changes, not for older work;
//                                               re-reads the OWASP Cheat Sheet Series when the last read is a day
//                                               old and puts the reference's state and commands into the session.
//   node scripts/quality/agent-check.mjs post   PostToolUse on Edit|Write|MultiEdit|NotebookEdit: every written
//                                               file gets scripts/quality/check-files.mjs; code also gets ESLint.
//                                               Findings go back to the agent at once (exit 2).
//   node scripts/quality/agent-check.mjs stop   Stop / SubagentStop: every file changed since the session start or
//                                               the last clean stop — by any tool, Bash included — gets the file
//                                               checks, ESLint for code, the whole-project typecheck when
//                                               TypeScript changed and the tests related to changed src/ files.
//                                               A failure blocks the stop, at most MAX_STOP_BLOCKS times.
//
// The script reads the hook payload, Git's list of changed files and the files themselves. It parses no shell
// command and runs no command taken from a file or the payload.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { untestedSourceChange } from './change-report.mjs';
import { sessionCheck } from './ac-tests.mjs';
import { sessionContext } from './owasp.mjs';

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CODE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/i;
const TYPED = /\.(ts|tsx|mts|cts)$/i;
const MAX_STOP_BLOCKS = 3;
const MAX_OUTPUT = 6000;
// The project's own tools, started by Node with an argv array: no shell and no `npx` shim, so no file name or
// environment value is ever parsed as a command line (CodeQL js/indirect-command-line-injection).
const TOOLS = {
  eslint: ['node_modules', 'eslint', 'bin', 'eslint.js'],
  tsc: ['node_modules', 'typescript', 'bin', 'tsc'],
  vitest: ['node_modules', 'vitest', 'vitest.mjs'],
  'check-files': ['scripts', 'quality', 'check-files.mjs'],
};

const mode = process.argv[2];
const payload = readPayload();
const sessionId = String(payload.session_id || 'no-session').replace(/[^A-Za-z0-9_-]/g, '');
// The session state lives in the repository's own Git directory, not in the shared system temp directory, where
// another local user could plant or read it (CodeQL js/insecure-temporary-file).
const stateDir = path.join(gitDirectory(), 'lero-al-agent-check');
const stateFile = path.join(stateDir, `${sessionId}.json`);

function gitDirectory() {
  const r = spawnSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  if (r.status !== 0 || !r.stdout.trim()) throw new Error(`agent-check: ${ROOT} is not a Git working tree`);
  return r.stdout.trim();
}

// Fail closed: a crash of the check itself is reported to the agent as a blocking finding, never as a pass
// (Claude Code treats exit 1 of a PostToolUse hook as non-blocking).
try {
  if (mode === 'start') start();
  else if (mode === 'post') post();
  else if (mode === 'stop') stop();
  else {
    console.error(`agent-check: unknown mode "${mode}" (expected start, post or stop)`);
    process.exit(2);
  }
} catch (e) {
  const reason = `agent-check failed to run (${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}). The work is not checked; fix the check or tell the owner.`;
  if (mode === 'stop') {
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  }
  if (mode === 'post') {
    console.error(reason);
    process.exit(2);
  }
  console.error(reason);
  process.exit(0);
}

function readPayload() {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadState() {
  try {
    const s = JSON.parse(readFileSync(stateFile, 'utf8'));
    return {
      baseline: s.baseline && typeof s.baseline === 'object' ? s.baseline : {},
      blocks: Number(s.blocks) || 0,
    };
  } catch {
    return { baseline: {}, blocks: 0 };
  }
}

function saveState(state) {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state));
}

function projectRelative(file) {
  if (!file) return null;
  const rel = path.relative(ROOT, path.resolve(ROOT, file));
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}

function run(tool, args, input) {
  const bin = path.join(ROOT, ...TOOLS[tool]);
  if (!existsSync(bin)) return { ok: false, status: null, output: `${tool} is not installed (${bin}); run npm ci` };
  const result = spawnSync(process.execPath, [bin, ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, input, windowsHide: true });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  return { ok: result.status === 0, status: result.status, output: output || String(result.error || '') };
}

function clip(text) {
  return text.length > MAX_OUTPUT ? `${text.slice(0, MAX_OUTPUT)}\n... (output cut at ${MAX_OUTPUT} characters)` : text;
}

/** Changed files (against HEAD, plus untracked and not ignored) with a size/mtime stamp. */
function snapshot() {
  const list = (args) => {
    const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
    if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || '').trim()}`);
    return r.stdout.split('\0').filter(Boolean);
  };
  const files = new Set([
    ...list(['diff', 'HEAD', '--name-only', '--diff-filter=ACMR', '-z']),
    ...list(['ls-files', '-z', '--others', '--exclude-standard']),
  ]);
  const out = {};
  for (const rel of files) {
    try {
      const st = statSync(path.join(ROOT, rel));
      if (st.isFile()) out[rel] = `${st.size}:${Math.trunc(st.mtimeMs)}`;
    } catch {
      /* deleted between the listing and the stat */
    }
  }
  return out;
}

/** Runs check-files and ESLint on the given files; returns the failure texts. */
function checkWritten(files) {
  const failures = [];
  if (!files.length) return failures;
  const cf = run('check-files', ['--stdin-list'], files.join('\n'));
  if (cf.status === 1) failures.push(`File checks (scripts/quality/check-files.mjs):\n${clip(cf.output)}`);
  else if (cf.status !== 0) failures.push(`File checks could not run (exit ${cf.status}):\n${clip(cf.output)}`);
  const code = files.filter((f) => CODE.test(f));
  if (code.length) {
    const lint = run('eslint', ['--no-warn-ignored', '--max-warnings', '0', ...code]);
    if (!lint.ok) failures.push(`ESLint:\n${clip(lint.output)}`);
  }
  return failures;
}

function start() {
  saveState({ baseline: snapshot(), blocks: 0 });
  // Owner request 2026-11-07: every session starts held against the current OWASP Cheat Sheet Series (owasp.mjs).
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: sessionContext({ root: ROOT }) } }));
  process.exit(0);
}

function post() {
  const rel = projectRelative((payload.tool_input || {}).file_path || (payload.tool_input || {}).notebook_path);
  if (!rel || !existsSync(path.join(ROOT, rel))) process.exit(0);
  const failures = checkWritten([rel]);
  if (!failures.length) process.exit(0);
  console.error(`${rel} fails its checks. Fix it now, before any other step:\n\n${failures.join('\n\n')}`);
  process.exit(2);
}

function stop() {
  const state = loadState();
  let current;
  try {
    current = snapshot();
  } catch (e) {
    // Fail closed: without the list of changed files nothing can be said about the work.
    process.stdout.write(JSON.stringify({ decision: 'block', reason: `agent-check could not list the changed files: ${e.message}` }));
    process.exit(0);
  }
  const changed = Object.keys(current).filter((rel) => state.baseline[rel] !== current[rel]);
  if (!changed.length) {
    saveState({ baseline: current, blocks: 0 });
    process.exit(0);
  }

  const failures = checkWritten(changed);
  const untested = untestedSourceChange(changed.map((p) => ({ code: 'M', path: p })));
  if (untested.length) {
    failures.push(`Product code changed in this session with no test added or updated (every change is covered by a test — quality-gates.md §8):\n${untested.join('\n')}`);
  }
  try {
    const missing = sessionCheck(changed);
    if (missing.length) failures.push(`An acceptance criterion's test is missing (quality-gates.md §8; ac-tests.mjs):\n${missing.join('\n')}`);
  } catch (e) {
    failures.push(`ac-tests could not run (a crash is a finding, never a pass): ${e.message}`);
  }
  if (changed.some((f) => TYPED.test(f))) {
    const types = run('tsc', ['--noEmit', '-p', 'tsconfig.json']);
    if (!types.ok) failures.push(`Typecheck of the whole project (effect on other code):\n${clip(types.output)}`);
  }
  const testable = changed.filter((f) => f.startsWith('src/') && CODE.test(f));
  if (testable.length) {
    const tests = run('vitest', ['related', '--run','--passWithNoTests', ...testable]);
    if (!tests.ok) failures.push(`Tests related to the changed files:\n${clip(tests.output)}`);
  }

  if (!failures.length) {
    saveState({ baseline: current, blocks: 0 });
    process.exit(0);
  }
  const blocks = state.blocks + 1;
  if (blocks > MAX_STOP_BLOCKS) {
    // Never trap the agent in a loop: let it stop, and make it say the work is not done.
    rmSync(stateFile, { force: true });
    process.stdout.write(JSON.stringify({
      systemMessage: `agent-check: the changed files still fail after ${MAX_STOP_BLOCKS} attempts. The work is NOT done; the owner must be told.\n\n${failures.join('\n\n')}`,
    }));
    process.exit(0);
  }
  saveState({ baseline: state.baseline, blocks });
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `Files changed in this session fail their checks (attempt ${blocks} of ${MAX_STOP_BLOCKS}). Fix the cause now; never report this work as done while a check fails.\n\n${failures.join('\n\n')}`,
  }));
  process.exit(0);
}

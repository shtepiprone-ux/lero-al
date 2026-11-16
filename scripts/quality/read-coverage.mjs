#!/usr/bin/env node
// Read coverage: how many lines each changed file has, how many of them the model read with the Read tool, and how many
// complete passes it made over the file as it is now (owner, 2026-11-16, translated: "a tool that shows how many lines a
// file has and how many were read; it forbids the model to skip lines or not finish reading a file"; "generated files
// are handled by a tool, not by an exception"). It enforces the self-review rule of .claude/rules/flow.md §2 steps 3-4
// and their order (failing runs of new tests → changes → three passes → green runs).
// OWASP basis: Secure Code Review (every changed line is read before tests), Secure Coding with AI (the agent's claim
// "I read it" is checked against the session record, not taken from its report).
//
//   node scripts/quality/read-coverage.mjs [--files-since <ISO time>] [--transcript <session.jsonl>]
//
// The session record is the Claude Code transcript (`<config>/projects/<project>/<session id>.jsonl`; the running
// session's id is CLAUDE_CODE_SESSION_ID). Nothing can lower what it asks: the passes (3), the limit (3 000 lines) and
// the base (HEAD: the work not yet committed) are fixed, and no option removes a file from the read set. What it counts:
//   - the read set: every file that differs from HEAD (tracked, or untracked and not ignored) and was written in this
//     session (an Edit/Write/NotebookEdit call on it, or a modification time after the session started: a shell edit
//     counts too). --files-since is the reviewer's: it adds every changed file modified since that moment (the start of
//     the revision under review, written by the implementer). --transcript reads another session (the reviewer rerunning
//     the implementer's); the output says so;
//   - per file, the lines that must be read: every line of a source file; in messages/<locale>.json the object that holds
//     each key changed against HEAD (the whole object, in every changed locale file); package-lock.json is not read
//     by a person: the tools listed in the output check it, and the run fails when they are not run in the session;
//   - a line counts as read when a Read result of this session showed it with the text the file has NOW, after the last
//     change of any file of the read set (a change starts every pass again). A pass is complete when every required line
//     was read since the previous pass ended;
//   - the order: no test or gate command may run after the last change of a read-set file and before the last file's
//     third pass (a failing run of a new test happens before the change and is allowed).
// Exit 0 = every file has the passes and the order holds; 1 = a file lacks a pass, a line was never read, the order
// was broken, or the read set is over 3 000 lines (flow.md §1: the task should have been split); 2 = cannot run.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REQUIRED_PASSES = 3;
export const MAX_READ_LINES = 3000;
export const LOCALE_FILE = /^messages\/[a-z]{2}\.json$/;
/** Generated files no person reads; each names the commands that check it instead. */
export const GENERATED = new Map([
  ['package-lock.json', ['change-report.mjs --lockfile-age', 'install-scripts.test.mjs', 'npm audit']],
]);
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip|gz)$/i;
/** A test or gate run: what must not happen between the last change and the third pass. */
export const GREEN_RUN = /\b(?:npm (?:run (?:-s |--silent )?)?test\b|npx vitest\b|vitest run\b|node --test\b|npm run (?:-s |--silent )?(?:lint|typecheck|build-storybook|test[\w:-]*)\b|playwright test\b|changed-lines-coverage\.mjs|product-gates\.mjs|check-listing-visibility\.mjs)/;

/** A path from a tool call as a repository-relative path with forward slashes, or null when it is outside the root. */
export function repoPath(p, root = ROOT) {
  if (typeof p !== 'string' || !p) return null;
  const rel = path.relative(root, path.resolve(root, p)).split(path.sep).join('/');
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : null;
}

/** The numbered lines of a Read result (`<n>\t<text>`); text after the file (a reminder) has no number and is ignored. */
export function numberedLines(content) {
  const text = Array.isArray(content) ? content.map((c) => (typeof c === 'string' ? c : c?.text ?? '')).join('\n') : String(content ?? '');
  const out = new Map();
  for (const line of text.split('\n')) {
    const m = /^\s*(\d+)\t(.*)$/.exec(line);
    if (m && !out.has(Number(m[1]))) out.set(Number(m[1]), m[2]);
  }
  return out;
}

/**
 * The events of one session in order: reads (with the lines they showed), writes, test or gate runs. Entries of a
 * subagent (`isSidechain`) are not the author's own reading and are skipped.
 */
export function parseTranscript(text, root = ROOT) {
  const uses = new Map();
  const events = [];
  let start = null;
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue;
    let entry;
    try { entry = JSON.parse(raw); } catch { continue; }
    if (entry.isSidechain) continue;
    const ts = Date.parse(entry.timestamp ?? '');
    if (Number.isFinite(ts) && (start === null || ts < start)) start = ts;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type === 'tool_use') {
        uses.set(part.id, part);
        const file = repoPath(part.input?.file_path ?? part.input?.notebook_path, root);
        if (['Edit', 'Write', 'NotebookEdit', 'MultiEdit'].includes(part.name) && file) events.push({ kind: 'write', file, ts });
        if (['Bash', 'PowerShell'].includes(part.name)) {
          const command = String(part.input?.command ?? '');
          events.push({ kind: GREEN_RUN.test(command) ? 'run' : 'shell', command, ts });
        }
      } else if (part?.type === 'tool_result') {
        const use = uses.get(part.tool_use_id);
        if (use?.name !== 'Read' || part.is_error) continue;
        const file = repoPath(use.input?.file_path, root);
        if (file) events.push({ kind: 'read', file, lines: numberedLines(part.content), ts });
      }
    }
  }
  return { start, events };
}

/** True when the line a Read showed is the line the file has now (CR ignored; a line the tool cut keeps its start). */
export function sameLine(shown, current) {
  const a = shown.replace(/\r$/, '');
  const b = current.replace(/\r$/, '');
  return a === b || (b.length > 2000 && a.length >= 1000 && b.startsWith(a.replace(/\s*\.{3}\s*\[?truncated\]?\s*$/i, '')));
}

/**
 * The line ranges ([from, to], 1-based, inclusive) of every JSON object in `text`, by key path ("a.b.c"); the root is "".
 * A small scanner: strings with escapes, objects and arrays; enough for the locale files.
 */
export function objectRanges(text) {
  const ranges = new Map();
  const stack = [];
  let line = 1;
  let pendingKey = null;
  let lastString = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\n') { line++; continue; }
    if (c === '"') {
      let j = i + 1;
      let s = '';
      while (j < text.length && text[j] !== '"') { if (text[j] === '\\') { s += text[j + 1]; j += 2; } else { if (text[j] === '\n') line++; s += text[j++]; } }
      lastString = s;
      i = j;
      continue;
    }
    if (c === ':') { pendingKey = lastString; continue; }
    if (c === '{' || c === '[') {
      const parent = stack[stack.length - 1];
      const key = parent ? (parent.kind === '[' ? String(parent.index) : pendingKey) : null;
      const p = parent ? (parent.path === '' ? key : `${parent.path}.${key}`) : '';
      stack.push({ kind: c, path: p, from: line, index: 0 });
      pendingKey = null;
      continue;
    }
    if (c === '}' || c === ']') {
      const top = stack.pop();
      if (top && top.kind === '{') ranges.set(top.path, [top.from, line]);
      continue;
    }
    if (c === ',') { const top = stack[stack.length - 1]; if (top?.kind === '[') top.index++; pendingKey = null; }
  }
  return ranges;
}

/** Every leaf key path whose value differs between two parsed JSON values (added, changed or removed). */
export function changedLeaves(before, after, prefix = '') {
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(before) || !isObj(after)) return JSON.stringify(before) === JSON.stringify(after) ? [] : [prefix];
  const out = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (!(k in before) || !(k in after)) out.push(p);
    else out.push(...changedLeaves(before[k], after[k], p));
  }
  return out;
}

/** The lines of a locale file that must be read: the object holding each changed key (the nearest one that still exists). */
export function localeRequiredLines(currentText, leaves) {
  const ranges = objectRanges(currentText);
  const lines = new Set();
  for (const leaf of leaves) {
    let p = leaf.split('.').slice(0, -1).join('.');
    while (!ranges.has(p) && p !== '') p = p.split('.').slice(0, -1).join('.');
    const [from, to] = ranges.get(p) ?? [1, currentText.split('\n').length];
    for (let l = from; l <= to; l++) lines.add(l);
  }
  return lines;
}

/**
 * Passes over one file: walking its reads in order, a line counts when it is required and shown as it is now; when
 * every required line has counted since the last pass ended, a pass is complete. Returns the passes with their end time
 * and how many required lines the pass in progress has.
 */
export function passesOf(reads, currentLines, required) {
  const passes = [];
  let seen = new Set();
  for (const r of reads) {
    for (const [n, shown] of r.lines) {
      if (required.has(n) && n <= currentLines.length && sameLine(shown, currentLines[n - 1])) seen.add(n);
    }
    if (required.size > 0 && seen.size === required.size) { passes.push(r.ts); seen = new Set(); }
  }
  return { passes, partial: seen.size };
}

/** The order rule: the runs after the last change and before the moment every file had its passes. */
export function runsBeforePasses(runs, lastChange, passesDoneAt) {
  return runs.filter((r) => r.ts > lastChange && (passesDoneAt === null || r.ts < passesDoneAt));
}

const git = (args) => {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr.trim()}`);
  return r.stdout;
};

/** The transcript of the running session (CLAUDE_CODE_SESSION_ID) under the Claude Code configuration folder. */
export function findTranscript(env = process.env) {
  const id = env.CLAUDE_CODE_SESSION_ID;
  if (!id) return null;
  const projects = path.join(env.CLAUDE_CONFIG_DIR || path.join(homedir(), '.claude'), 'projects');
  if (!existsSync(projects)) return null;
  for (const dir of readdirSync(projects)) {
    const f = path.join(projects, dir, `${id}.jsonl`);
    if (existsSync(f)) return f;
  }
  return null;
}

function main(argv) {
  const arg = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; };
  const known = new Set(['--files-since', '--transcript']);
  for (let i = 0; i < argv.length; i += 2) if (!known.has(argv[i])) { console.error(`read-coverage: unknown option ${argv[i]} (only --files-since and --transcript)`); return 2; }
  const own = findTranscript();
  const transcript = arg('--transcript') ?? own;
  const base = 'HEAD';
  const filesSince = arg('--files-since') ? Date.parse(arg('--files-since')) : null;
  if (filesSince !== null && !Number.isFinite(filesSince)) { console.error('read-coverage: --files-since is not a date'); return 2; }
  if (!transcript || !existsSync(transcript)) {
    console.error('read-coverage: no session transcript (pass --transcript <file.jsonl>, or run inside Claude Code where CLAUDE_CODE_SESSION_ID names it)');
    return 2;
  }
  const { start, events } = parseTranscript(readFileSync(transcript, 'utf8'));
  const changed = [...new Set([
    ...git(['diff', '--name-only', base]).split('\n'),
    ...git(['ls-files', '--others', '--exclude-standard']).split('\n'),
  ].map((s) => s.trim()).filter(Boolean))].sort();
  const { rows, problems, requiredTotal } = evaluate({
    events, start, changed, filesSince,
    stat: (file) => { const abs = path.join(ROOT, file); return existsSync(abs) && statSync(abs).isFile() ? { mtime: statSync(abs).mtimeMs } : null; },
    read: (file) => readFileSync(path.join(ROOT, file), 'utf8'),
    headText: (file) => { try { return git(['show', `${base}:${file}`]); } catch { return null; } },
  });
  console.log(`read-coverage: ${transcript}${own && path.resolve(transcript) === path.resolve(own) ? '' : ' (not this session: the reviewer reading the implementer\'s record)'}`);
  console.log(`read set: ${rows.length} file(s) changed against ${base} and written in this session${filesSince === null ? '' : ` or since ${arg('--files-since')}`}; ${requiredTotal} line(s) to read, ${REQUIRED_PASSES} pass(es) each`);
  for (const r of rows) {
    if (r.generated) { console.log(`  ${r.file}: generated, not read; checked by: ${r.generated.join(' · ')}`); continue; }
    if (r.binary) { console.log(`  ${r.file}: binary, not read`); continue; }
    const scope = r.required === r.total ? `${r.total} lines` : `${r.required} of ${r.total} lines (the objects of the changed keys)`;
    console.log(`  ${r.file}: ${scope}; complete passes ${r.passes.length}; read in the pass in progress ${r.partial}/${r.required}`);
  }
  if (problems.length) {
    console.log(`read-coverage: ${problems.length} problem(s)`);
    for (const p of problems) console.log(`  - ${p}`);
    return 1;
  }
  console.log('read-coverage: every line of the read set was read in every pass; no test ran before the passes');
  return 0;
}

/**
 * The decision, from data: `events` and `start` of the transcript, the `changed` files (against HEAD), and the file
 * access as functions (`stat(file)` → { mtime } or null, `read(file)` → text, `headText(file)` → the HEAD text or
 * null). Returns the rows of the read set, the problems and the number of lines to read.
 */
export function evaluate({ events, start, changed, filesSince = null, stat, read, headText }) {
  const written = new Set(events.filter((e) => e.kind === 'write').map((e) => e.file));
  const rows = [];
  let lastChange = -Infinity;
  for (const file of changed) {
    const s = stat(file);
    if (!s) continue;
    const inSession = written.has(file) || (start !== null && s.mtime >= start);
    if (!inSession && !(filesSince !== null && s.mtime >= filesSince)) continue; // not the work under check
    lastChange = Math.max(lastChange, s.mtime);
    if (GENERATED.has(file)) { rows.push({ file, generated: GENERATED.get(file) }); continue; }
    if (BINARY.test(file)) { rows.push({ file, binary: true }); continue; }
    const text = read(file);
    const lines = text.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    let required;
    if (LOCALE_FILE.test(file)) {
      let before = {};
      try { before = JSON.parse(headText(file) ?? '{}'); } catch { before = {}; }
      required = localeRequiredLines(text, changedLeaves(before, JSON.parse(text)));
    } else {
      required = new Set(lines.map((_, i) => i + 1));
    }
    rows.push({ file, lines, requiredLines: required, total: lines.length, required: required.size });
  }
  // a change of any file of the read set starts every pass again: only the reads after the last change count
  for (const r of rows.filter((x) => x.requiredLines)) {
    const reads = events.filter((e) => e.kind === 'read' && e.file === r.file && e.ts >= lastChange);
    Object.assign(r, passesOf(reads, r.lines, r.requiredLines));
  }
  const problems = [];
  const counted = rows.filter((r) => r.requiredLines);
  const requiredTotal = counted.reduce((sum, r) => sum + r.required, 0);
  for (const r of counted) {
    if (r.passes.length < REQUIRED_PASSES) problems.push(`${r.file}: ${r.passes.length} complete pass(es) of ${REQUIRED_PASSES} over the file as it is now (${r.required - r.partial} line(s) not read in the pass in progress)`);
  }
  for (const r of rows.filter((x) => x.generated)) {
    for (const cmd of r.generated) {
      if (!events.some((e) => (e.kind === 'run' || e.kind === 'shell') && e.command.includes(cmd))) problems.push(`${r.file}: no command with \`${cmd}\` ran in this session`);
    }
  }
  if (requiredTotal > MAX_READ_LINES) problems.push(`the read set is ${requiredTotal} lines, over ${MAX_READ_LINES}: the task should have been split at design (flow.md §1)`);
  // the moment the last file had its passes: no file to read sets no order; a file without them leaves it open (null)
  const done = counted.length === 0 ? -Infinity : counted.every((r) => r.passes.length >= REQUIRED_PASSES) ? Math.max(...counted.map((r) => r.passes[REQUIRED_PASSES - 1])) : null;
  const runs = events.filter((e) => e.kind === 'run');
  for (const r of runsBeforePasses(runs, lastChange, done)) problems.push(`a test or gate ran after the last change and before the ${REQUIRED_PASSES}rd pass: ${r.command.slice(0, 120)}`);
  return { rows, problems, requiredTotal };
}

if (isEntryPoint(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(`read-coverage: ${e.message}`); process.exitCode = 2; }
}

#!/usr/bin/env node
// Read coverage: how many lines each changed file has, how many of them the model read with the Read tool, and how many
// complete passes it made over the file as it is now (owner, 2026-11-16, translated: "a tool that shows how many lines a
// file has and how many were read; it forbids the model to skip lines or not finish reading a file"; "generated files
// are handled by a tool, not by an exception"). It enforces the self-review rule of .claude/rules/flow.md §2 steps 3-4
// and their order (failing runs of new tests → changes → three passes → green runs).
// OWASP basis: Secure Code Review (every changed line is read before tests), Secure Coding with AI and AI Agent Security
// (the agent's claim "I read it" is checked against the session record, and the tool fails closed).
//
//   node scripts/quality/read-coverage.mjs [--review <commit>] [--transcript <session.jsonl>]
//
// Nothing the session sets decides the verdict (Task 956 Review 6, F14-F18):
//   - the read set is the content that differs from a committed base: every tracked file whose text differs from the base
//     and every untracked file that is not ignored. The base is HEAD: the owner commits the tree before a revision starts,
//     so whatever differs from HEAD is the revision's work; a file left uncommitted at the start is in the read set too and
//     is read like the rest. --review <commit> is the reviewer's: the commit the revision started from, an ancestor of
//     HEAD (`git merge-base --is-ancestor`); the read set is then everything that differs from it. Neither the record nor a
//     modification time adds or removes a file;
//   - the record is the running session's transcript (`<config>/projects/<project>/<CLAUDE_CODE_SESSION_ID>.jsonl`) or the
//     one the reviewer names with --transcript, with its subagents' records (`<session id>/subagents/agent-*.jsonl`). Only
//     user and assistant entries with a timestamp and the record's own session id count; a record without one exits 2. An
//     Edit or Write of the record, or a shell command that names it, is a problem;
//   - per file, the lines that must be read: every line of a source file; in a JSON data file (messages/<locale>.json,
//     docs/security/owasp/controls.json, docs/security/owasp/reviews/*.json) the object that holds each key changed against
//     the base; a generated file (package-lock.json, docs/security/owasp/sheets.json) is not read: the tools it names must
//     have run in the session, each as the whole command (after `cd`), with a result that is not an error;
//   - a line counts as read when a Read result of the session (not of a subagent) showed it whole, with the text the file
//     has NOW, after the last Edit/Write of a file of the read set (a change starts every pass again). A Read result after
//     that change that shows a line cut is a problem naming the file and the line. A pass is complete when every required
//     line was read since the previous pass ended;
//   - the order: every shell command, the subagents' included, that is not read-only by the allow-list below is a run (a
//     test, a gate or a change); none may happen after the last change (in a session that changes nothing, from its
//     first command) and before the last file's third pass.
// Exit 0 = every file has the passes, the order holds and the record is untouched; 1 = a problem is listed; 2 = cannot
// run (unknown option, a --review that is not an ancestor commit, no record or an empty one, nothing differs from the base).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REQUIRED_PASSES = 3;
export const MAX_READ_LINES = 3000;
/** JSON data: read by the objects of the keys that changed against the base. */
export const JSON_DATA = /^(?:messages\/[a-z]{2}\.json|docs\/security\/owasp\/controls\.json|docs\/security\/owasp\/reviews\/[^/]+\.json)$/;
/** Generated files no person reads; each names the runs that check it instead (a label and the command it must be). */
export const GENERATED = new Map([
  ['package-lock.json', [
    ['change-report.mjs --lockfile-age', /^node\s+(?:\.\/)?scripts\/quality\/change-report\.mjs\s+--lockfile-age(?:\s|$)/],
    ['install-scripts.test.mjs', /^node\s+--test\s+(?:\.\/)?scripts\/quality\/install-scripts\.test\.mjs(?:\s|$)/],
    ['npm audit', /^npm\s+audit(?:\s|$)/],
  ]],
  ['docs/security/owasp/sheets.json', [
    ['owasp.mjs check', /^node\s+(?:\.\/)?scripts\/quality\/owasp\.mjs\s+check(?:\s|$)/],
  ]],
]);
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip|gz)$/i;
const WRITE_TOOLS = ['Edit', 'Write', 'NotebookEdit', 'MultiEdit'];
const SHELL_TOOLS = ['Bash', 'PowerShell'];

/**
 * The read-only allow-list: a shell command is read-only when every segment starts with one of these and nothing in it
 * can write (a redirection, a command substitution, an output option). Everything else is a run or a change.
 */
const READ_ONLY_SEGMENT = [
  /^cd(?:\s|$)/,
  /^git\s+(?:status|diff|log|show|ls-files|ls-remote|rev-parse|merge-base|cat-file|blame|grep)(?:\s|$)/,
  /^(?:cat|head|tail|wc|ls|pwd|grep|rg|stat|file|sha256sum|md5sum|cut|diff|cmp|echo|basename|dirname|realpath|which)(?:\s|$)/,
  /^find\s(?!.*\s-(?:exec|execdir|ok|okdir|delete|fprint\w*|fls)(?:\s|$))/,
  /^(?:Get-Content|Get-ChildItem|Get-Item|Get-FileHash|Select-String|Test-Path|Measure-Object|Select-Object|Where-Object|Sort-Object|Format-List|Format-Table|Resolve-Path|Get-Location|Write-Output)(?:\s|$)/i,
  /^gh\s+(?:pr\s+(?:checks|view|list|diff)|run\s+(?:list|view))(?:\s|$)/,
  /^node\s+(?:\.\/)?scripts\/quality\/read-coverage\.mjs(?:\s|$)/,
  /^"[^"$`]*(?:\$[A-Za-z_]\w*[^"$`]*)*"$/, // a PowerShell string that only expands variables, e.g. "EXIT=$LASTEXITCODE"
];
/** What can write or run a program inside an allowed command: a substitution, an output file, a preprocessor or pager. */
const WRITES = /\$\(|`|<\(|>\(|--output\b|--pre\b|(?:^|\s)-(?:o|O\S*)(?:\s|$)/;
/** The redirections that only discard or merge output: not writes, and the exit status stays the command's. */
const NOOP_REDIRECT = /\d?>\s*(?:&\d|\/dev\/null|\$null)(?=\s|$|[;|&)])/g;

/** A command split on the separators ; | & and newlines that are outside quotes. */
export function splitSegments(command) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const c of String(command)) {
    if (quote) { cur += c; if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === ';' || c === '|' || c === '&' || c === '\n') { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** True when every segment of the command is on the read-only allow-list (F15). */
export function isReadOnly(command) {
  const scrubbed = String(command ?? '').replace(NOOP_REDIRECT, ' ');
  // any other ">" outside quotes is a redirection into a file
  if (WRITES.test(scrubbed) || />/.test(scrubbed.replace(/"[^"]*"|'[^']*'/g, ''))) return false;
  const segments = splitSegments(scrubbed);
  return segments.length > 0 && segments.every((s) => READ_ONLY_SEGMENT.some((re) => re.test(s)));
}

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
 * The events of one record in order. Only user and assistant entries with a timestamp and the session id `id` count
 * (`entries` is their number). Reads count only from the session itself: a subagent's record (`subagent`) or a sidechain
 * entry gives its writes and shell commands, never its reads.
 */
export function parseRecord(text, { id, root = ROOT, subagent = false } = {}) {
  const uses = new Map();
  const events = [];
  let entries = 0;
  for (const raw of String(text).split('\n')) {
    if (!raw.trim()) continue;
    let entry;
    try { entry = JSON.parse(raw); } catch { continue; }
    const ts = Date.parse(entry?.timestamp ?? '');
    if (entry?.sessionId !== id || !['user', 'assistant'].includes(entry.type) || !Number.isFinite(ts)) continue;
    entries++;
    const side = subagent || entry.isSidechain === true;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type === 'tool_use') {
        uses.set(part.id, part);
        const abs = part.input?.file_path ?? part.input?.notebook_path;
        if (WRITE_TOOLS.includes(part.name) && typeof abs === 'string') events.push({ kind: 'write', file: repoPath(abs, root), abs: path.resolve(root, abs), subagent: side, ts });
      } else if (part?.type === 'tool_result') {
        const use = uses.get(part.tool_use_id);
        if (SHELL_TOOLS.includes(use?.name)) {
          const command = String(use.input?.command ?? '');
          const error = part.is_error === true || /^Exit code [1-9]/.test(typeof part.content === 'string' ? part.content : '');
          events.push({ kind: 'shell', command, readOnly: isReadOnly(command), error, subagent: side, ts });
        }
        if (use?.name !== 'Read' || part.is_error || side) continue;
        const file = repoPath(use.input?.file_path, root);
        if (file) events.push({ kind: 'read', file, lines: numberedLines(part.content), ts });
      }
    }
  }
  return { entries, events };
}

/**
 * The line ranges ([from, to], 1-based, inclusive) of every JSON object in `text`, by key path ("a.b.c"); the root is "".
 * A small scanner: strings with escapes, objects and arrays; enough for the JSON data files.
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

/** The lines of a JSON data file that must be read: the object holding each changed key (the nearest one that still exists). */
export function objectRequiredLines(currentText, leaves) {
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

const strip = (s) => s.replace(/\r$/, '');

/**
 * Passes over one file: walking its reads in order, a line counts when it is required and shown whole as it is now; when
 * every required line has counted since the last pass ended, a pass is complete. Returns the passes with their end time
 * and how many required lines the pass in progress has.
 */
export function passesOf(reads, currentLines, required) {
  const passes = [];
  let seen = new Set();
  for (const r of reads) {
    for (const [n, shown] of r.lines) {
      if (required.has(n) && n <= currentLines.length && strip(shown) === strip(currentLines[n - 1])) seen.add(n);
    }
    if (required.size > 0 && seen.size === required.size) { passes.push(r.ts); seen = new Set(); }
  }
  return { passes, partial: seen.size };
}

/**
 * The lines a Read showed cut: a shorter, non-empty text the current line starts with, a cut marker ("... [truncated]")
 * set aside (F14: a prefix is not a read of the line).
 */
export function cutLines(reads, currentLines) {
  const out = new Map();
  for (const r of reads) {
    for (const [n, shown] of r.lines) {
      if (n > currentLines.length || out.has(n)) continue;
      const now = strip(currentLines[n - 1]);
      const start = strip(shown).replace(/\s*\.{3}\s*\[?truncated\]?\s*$/i, '');
      if (start && start.length < now.length && now.startsWith(start)) out.set(n, { shown: start.length, length: now.length });
    }
  }
  return out;
}

/** The order rule: the runs after the last change and before the moment every file had its passes. */
export function runsBeforePasses(runs, lastChange, passesDoneAt) {
  return runs.filter((r) => r.ts > lastChange && (passesDoneAt === null || r.ts < passesDoneAt));
}

/** True when a tool call touches the session's record: a write to the record or its folder, or a shell command naming it. */
export function touchesRecord(event, record) {
  if (event.kind === 'write') {
    const norm = (p) => path.resolve(p).toLowerCase();
    const folder = norm(path.join(path.dirname(record.path), record.id));
    const abs = norm(event.abs);
    return abs === norm(record.path) || abs.startsWith(folder + path.sep);
  }
  if (event.kind !== 'shell') return false;
  const c = event.command;
  return c.includes(record.id) || /CLAUDE_CODE_SESSION_ID|CLAUDE_CONFIG_DIR/.test(c) || (/\.claude[\\/]+projects/i.test(c) && !event.readOnly);
}

/** The labels of the runs a generated file needs that the session itself did not make, as the whole command, without error. */
export function missingProofs(events, checks) {
  const own = events.filter((e) => e.kind === 'shell' && !e.subagent && !e.error);
  return checks.filter(([, re]) => !own.some((e) => {
    const segments = splitSegments(e.command.replace(NOOP_REDIRECT, ' '));
    while (segments.length > 1 && /^cd(?:\s|$)/.test(segments[0])) segments.shift();
    return segments.length === 1 && re.test(segments[0]);
  })).map(([label]) => label);
}

/**
 * The decision, from data: the `events` of the record (with its subagents'), the `changed` files (by content against the
 * base), `read(file)` → text now, `baseText(file)` → the base's text or null, and the `record` ({ id, path }). Returns the
 * rows of the read set, the problems and the number of lines to read.
 */
export function evaluate({ events, changed, read, baseText, record }) {
  const inSet = new Set(changed);
  const lastChange = Math.max(-Infinity, ...events.filter((e) => e.kind === 'write' && inSet.has(e.file)).map((e) => e.ts));
  const rows = [];
  for (const file of changed) {
    if (GENERATED.has(file)) { rows.push({ file, generated: GENERATED.get(file) }); continue; }
    if (BINARY.test(file)) { rows.push({ file, binary: true }); continue; }
    const text = read(file);
    const lines = text.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    let required;
    if (JSON_DATA.test(file)) {
      let before = {};
      try { before = JSON.parse(baseText(file) ?? '{}'); } catch { before = {}; }
      required = objectRequiredLines(text, changedLeaves(before, JSON.parse(text)));
    } else {
      required = new Set(lines.map((_, i) => i + 1));
    }
    rows.push({ file, lines, requiredLines: required, total: lines.length, required: required.size });
  }
  const problems = [];
  // a change of any file of the read set starts every pass again: only the reads after the last change count
  for (const r of rows.filter((x) => x.requiredLines)) {
    const reads = events.filter((e) => e.kind === 'read' && e.file === r.file && e.ts >= lastChange);
    Object.assign(r, passesOf(reads, r.lines, r.requiredLines));
    for (const [n, c] of cutLines(reads, r.lines)) problems.push(`${r.file}:${n}: a Read showed ${c.shown} of ${c.length} characters of this line (only a whole line is read)`);
  }
  const counted = rows.filter((r) => r.requiredLines);
  const requiredTotal = counted.reduce((sum, r) => sum + r.required, 0);
  for (const r of counted) {
    if (r.passes.length < REQUIRED_PASSES) problems.push(`${r.file}: ${r.passes.length} complete pass(es) of ${REQUIRED_PASSES} over the file as it is now (${r.required - r.partial} line(s) not read in the pass in progress)`);
  }
  for (const r of rows.filter((x) => x.generated)) {
    for (const label of missingProofs(events, r.generated)) problems.push(`${r.file}: no run of \`${label}\` in this session (the whole command, after \`cd\`, with a result that is not an error)`);
  }
  if (requiredTotal > MAX_READ_LINES) problems.push(`the read set is ${requiredTotal} lines, over ${MAX_READ_LINES}: the task should have been split at design (flow.md §1)`);
  for (const e of events.filter((x) => touchesRecord(x, record))) {
    problems.push(`the session record was touched by ${e.kind === 'write' ? `a write of ${e.abs}` : `\`${e.command.slice(0, 120)}\``}${e.subagent ? ' (subagent)' : ''}: a record the session can write proves nothing`);
  }
  // the moment the last file had its passes: no file to read sets no order; a file without them leaves it open (null)
  const done = counted.length === 0 ? -Infinity : counted.every((r) => r.passes.length >= REQUIRED_PASSES) ? Math.max(...counted.map((r) => r.passes[REQUIRED_PASSES - 1])) : null;
  const runs = events.filter((e) => e.kind === 'shell' && !e.readOnly);
  // no write in the session: the runs count from its first command
  const since = Number.isFinite(lastChange) ? '' : ' (no change in this session: from its first command)';
  for (const r of runsBeforePasses(runs, lastChange, done)) problems.push(`a test, gate or change ran after the last change${since} and before the ${REQUIRED_PASSES}rd pass${r.subagent ? ' (subagent)' : ''}: ${r.command.slice(0, 120)}`);
  return { rows, problems, requiredTotal };
}

const gitRun = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const git = (args) => {
  const r = gitRun(args);
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${(r.stderr ?? '').trim()}`);
  return r.stdout;
};

/** null when `commit` is a commit and an ancestor of HEAD; otherwise why it cannot be the review's base. */
export function checkBase(commit, run = gitRun) {
  if (!/^[0-9a-f]{7,40}$/i.test(commit) || run(['cat-file', '-e', `${commit}^{commit}`]).status !== 0) return `--review ${commit} is not a commit of this repository (a hexadecimal commit name)`;
  if (run(['merge-base', '--is-ancestor', commit, 'HEAD']).status !== 0) return `--review ${commit} is not an ancestor of HEAD: name the commit the revision started from`;
  return null;
}

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

/** The subagent records of a session: `<folder>/<session id>/subagents/agent-*.jsonl`. */
export function subagentRecords(recordPath) {
  const dir = path.join(path.dirname(recordPath), path.basename(recordPath, '.jsonl'), 'subagents');
  return existsSync(dir) ? readdirSync(dir).filter((f) => /^agent-.*\.jsonl$/.test(f)).map((f) => path.join(dir, f)) : [];
}

function main(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--review', '--transcript'].includes(argv[i])) { console.error(`read-coverage: unknown option ${argv[i]} (only --review <commit> and --transcript <session.jsonl>)`); return 2; }
    if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) { console.error(`read-coverage: ${argv[i]} needs a value`); return 2; }
    opts[argv[i]] = argv[i + 1];
  }
  const base = opts['--review'] ?? 'HEAD';
  if (opts['--review']) { const why = checkBase(base); if (why) { console.error(`read-coverage: ${why}`); return 2; } }
  const own = findTranscript();
  const transcript = opts['--transcript'] ?? own;
  if (!transcript || !existsSync(transcript)) {
    console.error('read-coverage: no session record (run inside Claude Code, where CLAUDE_CODE_SESSION_ID names it, or name one with --transcript)');
    return 2;
  }
  const record = { id: path.basename(transcript, '.jsonl'), path: path.resolve(transcript) };
  const session = parseRecord(readFileSync(transcript, 'utf8'), { id: record.id });
  if (session.entries === 0) { console.error(`read-coverage: the record ${transcript} has no entry of session ${record.id}: an empty or forged record proves nothing`); return 2; }
  const subs = subagentRecords(transcript);
  const events = [...session.events, ...subs.flatMap((f) => parseRecord(readFileSync(f, 'utf8'), { id: record.id, subagent: true }).events)].sort((a, b) => a.ts - b.ts);
  // -z: Git quotes a path with other than ASCII characters otherwise, and a quoted path would name no file
  const changed = [...new Set([
    ...git(['diff', '--name-only', '-z', '--diff-filter=ACMRT', base]).split('\0'),
    ...git(['ls-files', '-z', '--others', '--exclude-standard']).split('\0'),
  ].filter(Boolean))].filter((f) => existsSync(path.join(ROOT, f))).sort();
  if (!changed.length) { console.error(`read-coverage: nothing differs from ${base}: name the commit the revision started from with --review <commit>`); return 2; }
  const { rows, problems, requiredTotal } = evaluate({
    events, changed, record,
    read: (file) => readFileSync(path.join(ROOT, file), 'utf8'),
    baseText: (file) => { const r = gitRun(['show', `${base}:${file}`]); return r.status === 0 ? r.stdout : null; },
  });
  const ownRecord = own && path.resolve(own) === record.path;
  console.log(`read-coverage: ${transcript}${ownRecord ? '' : ' (not this session: the record the reviewer named)'}; ${subs.length} subagent record(s)`);
  console.log(`read set: ${rows.length} file(s) that differ from ${base}; ${requiredTotal} line(s) to read, ${REQUIRED_PASSES} pass(es) each`);
  for (const r of rows) {
    if (r.generated) { console.log(`  ${r.file}: generated, not read; checked by: ${r.generated.map(([label]) => label).join(' · ')}`); continue; }
    if (r.binary) { console.log(`  ${r.file}: binary, not read`); continue; }
    const scope = r.required === r.total ? `${r.total} lines` : `${r.required} of ${r.total} lines (the objects of the changed keys)`;
    console.log(`  ${r.file}: ${scope}; complete passes ${r.passes.length}; read in the pass in progress ${r.partial}/${r.required}`);
  }
  if (problems.length) {
    console.log(`read-coverage: ${problems.length} problem(s)`);
    for (const p of problems) console.log(`  - ${p}`);
    return 1;
  }
  console.log('read-coverage: every line of the read set was read in every pass; no run before the passes; the record is untouched');
  return 0;
}

if (isEntryPoint(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(`read-coverage: ${e.message}`); process.exitCode = 2; }
}

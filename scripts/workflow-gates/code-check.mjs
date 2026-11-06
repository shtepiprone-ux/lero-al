#!/usr/bin/env node
// Task 945 (owner D25, 2026-11-04): written code is always checked, for its quality and for its effect on other code, and a problem is
// solved at once. Claude Code runs this after every tool call and before an agent or subagent finishes. It compares file contents and parses
// no command, so a write through any tool or shell form counts, and a session that changed no code runs nothing.
// It runs checks; it cannot judge logic no check catches. It is a workflow control, not a security barrier: its state is an ignored file.
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';

const REGISTRY = 'scripts/workflow-gates/code-check.json';
const STATE_FOLDER = 'test-results/code-check';
// cmd.exe refuses a command line above 8191 characters, so a {files} command over many files runs in batches.
const COMMAND_LENGTH = 7000;
// A tool whose `tool_input.file_path` is a write. A read names a file too, and must run nothing; any other writer is found by its content.
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit']);
// A name with one of these characters cannot be quoted the same way in cmd.exe and in a POSIX shell.
export const UNQUOTABLE = /["'`$%\r\n]/;
const KILL_GRACE_MS = 2000;
const MAX_READ_BYTES = 8 << 20;
const BINARY_PROBE_BYTES = 8000;

const lastLines = (text, count) => text.replace(/\u001b\[[0-9;]*m/g, '').trim().split(/\r?\n/).slice(-count).join('\n');
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A test runner prints what failed long before its last line: each failed test with the lines after it, when the tail does not already hold it.
function failingLines(output, tail, limit) {
  const lines = output.replace(/\u001b\[[0-9;]*m/g, '').split(/\r?\n/);
  const failed = lines.flatMap((line, index) => (/^\s*(?:not ok\b|FAIL\b)/.test(line) && !tail.includes(line.trim()) ? lines.slice(index, index + 12) : []));
  return failed.length ? `${failed.slice(0, limit).join('\n')}\n` : '';
}
const pause = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// One pass: a later replacement must not rewrite the `*` an earlier one wrote, or `**/` would match a single folder level.
const globToRegExp = pattern => new RegExp(`^${pattern.replace(/\*\*\/|\*|[.+?^${}()|[\]\\]/g, token => {
  if (token === '**/') return '(?:.*/)?';
  if (token === '*') return '[^/]*';
  return `\\${token}`;
})}$`);

export function readRegistry(root) {
  const registry = JSON.parse(readFileSync(join(root, REGISTRY), 'utf8'));
  const list = value => Array.isArray(value) && value.length > 0;
  const entries = value => Array.isArray(value) && value.every(entry => typeof entry === 'string' || typeof entry?.run === 'string');
  if (!list(registry?.roots) || !list(registry.rows) || !(registry.timeoutMs?.write > 0) || !(registry.timeoutMs?.stop > 0) || !(registry.tailLines > 0)
    || !registry.rows.every(row => list(row?.paths) && entries(row.write) && entries(row.stop))) throw new Error(`${REGISTRY} does not have the shape of a registry`);
  // Without the form of a finding, a crash of a whole-tree gate could not be told from a finding elsewhere.
  for (const entry of registry.rows.flatMap(row => [...row.write, ...row.stop])) if (entry.namesFile && !(typeof entry.finding === 'string' && entry.finding)) throw new Error(`${REGISTRY}: the whole-tree gate ${entry.run} holds no finding`);
  const rows = registry.rows.map(row => ({ ...row, patterns: row.paths.map(globToRegExp) }));
  // A line that also holds what is refused is never printed by another rule that finds it.
  const hidden = (registry.secure || []).filter(rule => rule.refuse).map(rule => new RegExp(rule.pattern, rule.flags || ''));
  const compiled = rules => (rules || []).map(rule => ({ ...rule, hidden, patterns: rule.paths.map(globToRegExp), find: rule.pattern ? new RegExp(rule.pattern, `g${rule.flags || ''}`) : null, line: rule.pattern ? new RegExp(rule.pattern, rule.flags || '') : null }));
  return { ...registry, quieting: compiled(registry.quieting), secure: compiled(registry.secure), rowsFor: file => rows.filter(row => row.patterns.some(pattern => pattern.test(file))) };
}

// A check passes when a test is switched off or an assertion weakened as readily as when the code is right. No command can see that, so what this
// change adds is counted against the file at HEAD. A legitimate case exists, so it stops the agent once per version and is never a lasting refusal.
export function added(root, ruleList, files, base = 'HEAD') {
  const lines = [];
  for (const file of files) {
    // What must never enter the tree is read by refusedLines, wherever it is and by line: a count cannot see a key replaced by another.
    const rules = ruleList.filter(rule => !rule.refuse && rule.patterns.some(pattern => pattern.test(file)));
    if (!rules.length) continue;
    // A deleted test is the strongest removal of assertions there is, so a deleted file reads as empty and is not skipped.
    const now = existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : '';
    const head = spawnSync('git', ['show', `${base}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, windowsHide: true });
    const before = head.status === 0 ? head.stdout : '';
    for (const rule of rules) {
      // A file that steers every later agent or runs by itself counts by being changed at all.
      if (rule.changed) { if (now.replace(/\r\n/g, '\n') !== before.replace(/\r\n/g, '\n')) lines.push(`${file}: ${rule.what}`); continue; }
      const count = text => [...text.matchAll(rule.find)].length;
      if (rule.fewer ? count(now) >= count(before) : count(now) <= count(before)) continue;
      if (rule.fewer) { lines.push(`${file}: ${rule.what}, ${count(before)} at HEAD and ${count(now)} now`); continue; }
      const added = now.split(/\r?\n/).map((text, index) => ({ text, index })).filter(({ text }) => rule.line.test(text) && !before.includes(text));
      for (const { text, index } of (added.length ? added : [{ text: `${count(now) - count(before)} more than at HEAD`, index: -1 }]).slice(0, 5)) lines.push(`${file}${index < 0 ? '' : `:${index + 1}`}: ${rule.what}: ${rule.hidden?.some(find => find.test(text)) ? 'its text is withheld, because it also holds what must never enter the tree' : text.trim().slice(0, 120)}`);
    }
  }
  return lines;
}

// The text of a regular file this may read, or null: a file above the limit, a binary file, and one that is gone are not read.
function readableText(root, file) {
  let found;
  try { found = lstatSync(join(root, file)); }
  catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null; throw error; }
  if (!found.isFile() || found.size > MAX_READ_BYTES) return null;
  const bytes = readFileSync(join(root, file));
  return bytes.subarray(0, BINARY_PROBE_BYTES).includes(0) ? null : bytes.toString('utf8');
}
const QUOTED_PATH_ESCAPES = { a: 7, b: 8, f: 12, n: 10, r: 13, t: 9, v: 11 };
// Git writes a path holding a quote, a backslash or a control character in C quotes, with its bytes in octal.
const unquotedPath = text => Buffer.from(Buffer.from(text.slice(1, -1), 'utf8').toString('latin1')
  .replace(/\\([0-7]{3}|.)/g, (_, code) => (code.length === 3 ? String.fromCharCode(Number.parseInt(code, 8)) : String.fromCharCode(QUOTED_PATH_ESCAPES[code] ?? code.charCodeAt(0)))), 'latin1').toString('utf8');
function headerPath(text) {
  const path = text.endsWith('\t') ? text.slice(0, -1) : text;
  if (path === '/dev/null') return null;
  return (path.startsWith('"') ? unquotedPath(path) : path).replace(/^b\//, '');
}
// The lines a diff adds. The counts of each hunk tell its lines from a header, because an added line may itself begin with "++ ".
export function addedLinesOf(diff) {
  const found = [];
  let file = null, removed = 0, left = 0, line = 0;
  for (const text of diff.split('\n')) {
    if (removed > 0 && text.startsWith('-')) { removed--; continue; }
    if (left > 0 && text.startsWith('+')) { found.push({ file, line: line++, text: text.slice(1) }); left--; continue; }
    if (removed > 0 || left > 0) continue;
    if (text.startsWith('+++ ')) { file = headerPath(text.slice(4)); continue; }
    const hunk = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(text);
    if (hunk) { removed = Number(hunk[1] ?? 1); line = Number(hunk[2]); left = Number(hunk[3] ?? 1); }
  }
  return found;
}
export const refusedText = ({ file, line, rule }) => `${file}:${line}: ${rule}`;
// What must never enter the tree, wherever it is: every line added since `base` (null reads no diff), the text of untracked files when asked, and the
// whole of each named file. No text of a line leaves this function, because what it finds must not reach a log. A Git failure throws: no read is no pass.
export function refusedLines(root, base, named = [], { untracked = false } = {}) {
  const rules = readRegistry(root).secure.filter(rule => rule.refuse);
  if (!rules.length) return [];
  const found = new Map();
  const judge = (file, line, text) => {
    for (const rule of rules) {
      if (!rule.patterns.some(pattern => pattern.test(file)) || !rule.line.test(text)) continue;
      found.set(`${file}\0${line}\0${rule.what}`, { file, line, rule: rule.what });
    }
  };
  const whole = file => {
    const text = readableText(root, file);
    if (text !== null) text.split('\n').forEach((value, index) => judge(file, index + 1, value));
  };
  const git = args => {
    const run = spawnSync('git', ['--no-optional-locks', '-c', 'core.quotePath=false', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 30, windowsHide: true });
    if (run.error || run.status !== 0) throw new Error(`git ${args[0]} failed: ${run.error?.message || String(run.stderr).trim()}`);
    return run.stdout;
  };
  const toRead = new Set(named);
  if (base) {
    const form = ['--no-color', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/'];
    const tooLarge = new Map();
    for (const { file, line, text } of addedLinesOf(git(['diff', '--unified=0', ...form, base]))) {
      if (!tooLarge.has(file)) tooLarge.set(file, (lstatSync(join(root, file), { throwIfNoEntry: false })?.size ?? 0) > MAX_READ_BYTES);
      if (!tooLarge.get(file)) judge(file, line, text);
    }
    // A diff attribute can make Git call a text file binary and print no line of it, so what it calls binary is read and judged by the rule above.
    for (const entry of git(['diff', '--numstat', '-z', ...form, base]).split('\0').filter(Boolean)) if (entry.startsWith('-\t-\t')) toRead.add(entry.slice(4));
  }
  if (untracked) for (const file of git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)) toRead.add(file);
  for (const file of toRead) whole(file);
  return [...found.values()];
}

// A deleted file's consumers: a script library, a JSON file or a CSS module has no type check to name them. Many such names are on purpose (a path a check
// forbids, a test of the deletion), so this tells the agent and refuses nothing. Each search is one Git process, and their number is that of the deleted files.
export function leftBehind(root, registry, files) {
  const lines = [];
  for (const file of files) {
    const base = file.split('/').pop();
    const forms = [base, ...(/\.[cm]?[jt]sx?$/.test(base) && !base.startsWith('index.') ? [base.replace(/\.[^.]+$/, '')] : [])];
    const search = forms.flatMap(form => ['-e', `[/'"\`]${escapeRegExp(form)}['"\`]`]);
    const run = spawnSync('git', ['--no-optional-locks', '-c', 'core.quotePath=false', 'grep', '-l', '-z', '-I', '-E', '--untracked', ...search, '--', ...registry.roots], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
    // Git grep exits 1 for no match; anything above that is a search that did not run.
    if (run.error || run.status > 1) throw new Error(`git grep failed: ${run.error?.message || String(run.stderr).trim()}`);
    const names = run.stdout.split('\0').filter(name => name && name !== file);
    if (names.length) lines.push(`${file} is gone and these still name it: ${names.slice(0, 8).join(', ')}`);
  }
  return lines;
}

function hashOf(root, file) {
  try { return createHash('sha256').update(readFileSync(join(root, file))).digest('hex'); }
  catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return 'deleted';
    // A nested repository is listed as a folder.
    if (error.code === 'EISDIR') return 'folder';
    throw error;
  }
}

// What the tree holds: every dirty code file of the roots with the hash of its content, what has gone from it, and what no row holds. With -z a rename
// or copy writes its old path as an entry of its own, with no status columns: the old path of a rename is a file that went away, the source of a copy did not change.
function snapshot(root, registry) {
  const git = spawnSync('git', ['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=all', '--', ...registry.roots],
    { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, windowsHide: true });
  if (git.error || git.status !== 0) throw new Error(`git status failed: ${git.error?.message || String(git.stderr).trim()}`);
  const files = {}, gone = new Set(), others = new Set();
  const add = file => { if (registry.rowsFor(file).length) files[file] = hashOf(root, file); else others.add(file); };
  const entries = git.stdout.split('\0').filter(Boolean);
  for (let i = 0; i < entries.length; i++) {
    const status = entries[i].slice(0, 2);
    add(entries[i].slice(3));
    if (status.includes('D')) gone.add(entries[i].slice(3));
    if (/[RC]/.test(status)) {
      i++;
      if (status.includes('R') && entries[i]) { add(entries[i]); gone.add(entries[i]); }
    }
  }
  return { files, gone, others };
}

// A transient lock of a concurrent hook on Windows is retried; anything else is reported, never taken for a missing state.
function withRetry(action) {
  for (let attempt = 0; ; attempt++) {
    try { return action(); }
    catch (error) {
      if (attempt >= 8 || !['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) throw error;
      pause(25);
    }
  }
}
const statePath = (root, event) => join(root, STATE_FOLDER, `${String(event.session_id || 'no-session').replace(/[^\w-]/g, '_')}.json`);
function readState(path) {
  let text;
  try { text = withRetry(() => readFileSync(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  let state;
  try { state = JSON.parse(text); } catch { state = null; }
  if (!state || typeof state.baseline !== 'object' || typeof state.passed !== 'object') throw new Error(`the state file ${path} is damaged; delete it to start a new baseline`);
  return state;
}
function saveState(path, state) {
  mkdirSync(join(path, '..'), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}`;
  writeFileSync(temporary, JSON.stringify(state));
  withRetry(() => renameSync(temporary, path));
}
const NOTE_KINDS = ['quiet', 'secure', 'mutants'];
// A file no row holds leaves no trace in the status once an untracked one goes, so the ones of the start are kept by name.
const newState = (baseline, gone, others) => ({ baseline, goneBefore: [...gone], othersBefore: [...others].filter(file => !gone.has(file)), passed: { write: {}, stop: {} }, failed: {}, named: {}, notes: {}, quiet: {}, secure: {}, mutants: {}, told: {}, deletions: {}, seen: {} });

// A check that hangs is ended with its whole process tree: killing the shell alone leaves the program running.
function killTree(pid) {
  if (process.platform === 'win32') spawnSync('taskkill', ['/T', '/F', '/PID', String(pid)], { windowsHide: true, timeout: 10000 });
  else { try { process.kill(-pid, 'SIGKILL'); } catch { /* already gone */ } }
}
export function runCommand(text, root, timeoutMs, env = null) {
  return new Promise(done => {
    const child = spawn(text, { cwd: root, shell: true, detached: process.platform !== 'win32', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], ...(env ? { env: { ...process.env, ...env } } : {}) });
    let output = '', timedOut = false, grace = null, settled = false;
    const keep = chunk => { output = `${output}${chunk}`.slice(-(1 << 20)); };
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(grace);
      done({ ...result, output });
    };
    child.stdout.setEncoding('utf8').on('data', keep);
    child.stderr.setEncoding('utf8').on('data', keep);
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child.pid);
      // A process that left the tree can hold the pipes open; the decision must still reach the agent before the hook's own timeout.
      grace = setTimeout(() => { child.stdout.destroy(); child.stderr.destroy(); finish({ status: null, reason: 'timeout' }); }, KILL_GRACE_MS);
    }, timeoutMs);
    child.on('error', error => finish({ status: null, reason: error.code || error.message }));
    child.on('close', status => finish({ status: timedOut ? null : status, reason: timedOut ? 'timeout' : 'it ended with no exit code' }));
  });
}

const quoted = (command, file) => command.replace(/(['"]?)\{file\}\1/g, (_, quote) => (quote ? `${quote}${file}${quote}` : `"${file}"`));
function commandTexts(command, owners, present) {
  if (command.includes('{file}')) return present.map(file => ({ text: quoted(command, file), owners: [file] }));
  if (!command.includes('{files}')) return [{ text: command, owners }];
  const batches = [];
  let batch = [], length = 0;
  for (const file of present) {
    if (batch.length && length + file.length + 3 > COMMAND_LENGTH) { batches.push(batch); batch = []; length = 0; }
    batch.push(file);
    length += file.length + 3;
  }
  if (batch.length) batches.push(batch);
  return batches.map(files => ({ text: command.replaceAll('{files}', files.map(file => `"${file}"`).join(' ')), owners: files }));
}
const namedInOutput = (output, file) => new RegExp(`(?<![\\w.-])${escapeRegExp(file)}(?![\\w-]|\\.\\w)`).test(output.replaceAll('\\', '/'));
// The registry's time is for the whole stage: a hook that reaches its own timeout renders no decision, so the stage must end first and say so.
// `memory` holds what a command with an exit code said over these same versions: a repeated attempt shows it and spends no time. One that did not finish reruns.
async function runStage(root, registry, stage, files, memory = {}) {
  const failures = [], notes = [];
  const earlier = { ...memory };
  let shownAgain = false;
  const commands = new Map();
  for (const file of files) for (const row of registry.rowsFor(file)) for (const entry of row[stage]) {
    const command = typeof entry === 'string' ? entry : entry.run;
    if (!commands.has(command)) commands.set(command, { owners: new Set(), finding: entry.namesFile ? new RegExp(entry.finding) : null });
    commands.get(command).owners.add(file);
  }
  const deadline = Date.now() + registry.timeoutMs[stage];
  const unfinished = (what, reason) => `${what}: could not finish (${reason}); a check that did not finish is a failure`;
  for (const [command, { owners, finding }] of commands) {
    const all = [...owners];
    const named = /\{files?\}/.test(command) ? all.filter(file => existsSync(join(root, file))) : [];
    for (const file of named.filter(path => UNQUOTABLE.test(path))) failures.push(unfinished(file, 'its name holds a character no command line can quote'));
    for (const { text, owners: batch } of commandTexts(command, all, named.filter(path => !UNQUOTABLE.test(path)))) {
      const known = earlier[`${stage}\0${text}`];
      if (known) {
        failures.push(...known.failures);
        notes.push(...known.notes);
        shownAgain ||= known.failures.length > 0;
        continue;
      }
      const left = deadline - Date.now();
      if (left <= 0) { failures.push(unfinished(text, `the ${stage} stage used its ${registry.timeoutMs[stage]} ms before it started`)); continue; }
      const run = await runCommand(text, root, left);
      const before = { failures: failures.length, notes: notes.length };
      const tail = lastLines(run.output, registry.tailLines);
      if (run.status === null) failures.push(`${unfinished(text, run.reason)}${tail ? `\n${tail}` : ''}`);
      // A whole-tree gate fails at this tree. One that printed no line of a finding reported nothing: it crashed, and that is no finding elsewhere, even
      // when its stack trace names a real file. Only a finding in a changed file blocks, with the details under it, which may lie above the tail.
      else if (run.status !== 0 && finding) {
        const lines = run.output.replace(/\u001b\[[0-9;]*m/g, '').split(/\r?\n/);
        const found = lines.flatMap((line, index) => (finding.test(line) ? [index] : []));
        const own = found.filter(index => all.some(file => namedInOutput(lines[index], file))).flatMap(index => lines.slice(index, index + 6));
        if (!found.length) failures.push(`${unfinished(text, `exit ${run.status}, and its output holds no line of a finding`)}\n${tail}`);
        else if (own.length) failures.push(`${text}: exit ${run.status}\n${own.slice(0, registry.tailLines).join('\n')}\n${tail}`);
      }
      else if (run.status !== 0) failures.push(`${text}: exit ${run.status}\n${failingLines(run.output, tail, registry.tailLines)}${tail}`);
      else if (/No test files found/.test(run.output)) notes.push(...batch);
      if (run.status !== null) memory[`${stage}\0${text}`] = { failures: failures.slice(before.failures), notes: notes.slice(before.notes) };
    }
  }
  return { failures, notes: [...new Set(notes)], shownAgain };
}

// After every check passed, with the time the hook has left. It stays out of the way of a registry without it, and loads only when it runs.
// Whatever goes wrong here is told to the agent; the checks above already passed, so it does not turn into a refusal of their version.
async function mutated(root, registry, files, started) {
  const config = registry.mutation;
  if (!config || !files.length) return {};
  const deadline = Math.min(Date.now() + config.timeoutMs, started + config.hookMs);
  try {
    const { runMutation, reportLines } = await import('./mutation-check.mjs');
    return reportLines(await runMutation({ root, config, roots: registry.roots, files, deadline, runCommand }), config.shown);
  } catch (error) {
    return { [files[0]]: [`the mutation check could not run for ${files.join(', ')}: ${error.message}`] };
  }
}

function writtenFile(root, event) {
  const path = event.tool_input?.file_path;
  if (!WRITE_TOOLS.has(event.tool_name) || typeof path !== 'string' || !path) return null;
  const file = relative(root, resolve(isAbsolute(path) || typeof event.cwd !== 'string' ? root : event.cwd, path)).replaceAll('\\', '/');
  return file.startsWith('../') || isAbsolute(file) ? null : file;
}

async function check(event, root) {
  if (typeof event?.hook_event_name !== 'string') throw new Error('the event names no hook');
  const started = Date.now();
  const name = event.hook_event_name;
  const registry = readRegistry(root);
  const path = statePath(root, event);
  const { files: now, gone, others } = snapshot(root, registry);
  const saved = readState(path);
  const state = saved || newState(now, gone, others);
  state.notes ||= {};
  state.goneBefore ||= [...gone];
  state.othersBefore ||= [];
  state.told ||= {};
  state.deletions ||= {};
  for (const kind of NOTE_KINDS) state[kind] ||= {};
  state.seen[name] = (state.seen[name] || 0) + 1;
  if (!['PostToolUse', 'Stop', 'SubagentStop'].includes(name)) { saveState(path, state); return { status: 0, message: '' }; }

  // A file is changed when its hash differs from the baseline. The version is the hash read before any check runs, so a file that changes
  // during a check is never recorded as passed at a version no check saw.
  const written = writtenFile(root, event);
  // A new baseline holds the work before this event, not the write that fired it.
  if (!saved && written) delete state.baseline[written];
  // Whatever the path: what must never enter the tree may be in a file no row holds.
  if (written) state.named[written] = true;
  const versions = { ...now };
  for (const file of [...Object.keys(state.baseline), ...Object.keys(state.named)]) if (!(file in versions) && registry.rowsFor(file).length) versions[file] = hashOf(root, file);
  const changed = Object.keys(versions).filter(file => versions[file] !== state.baseline[file]);
  // A failed version is remembered only while it is the current one: a later return to its hash, or a second deletion, is news.
  for (const file of Object.keys(state.failed)) if (state.failed[file] !== versions[file]) delete state.failed[file];

  if (name === 'PostToolUse') {
    // A version that failed is shown once here, not again on every later command; Stop still refuses it.
    const todo = changed.filter(file => state.passed.write[file] !== versions[file] && state.failed[file] !== versions[file]);
    const read = [...new Set([...todo, ...(written && !(written in versions) ? [written] : [])])];
    // What must never enter the tree is refused whatever any command says, and no command runs over it, because its output could repeat it.
    const refused = refusedLines(root, null, read);
    if (refused.length) {
      for (const { file } of refused) if (file in versions) state.failed[file] = versions[file];
      saveState(path, state);
      return { status: 2, message: [`CODE CHECK FAILED after a write to ${read.join(', ')}. Fix this now, before anything else:`, ...refused.map(refusedText)].join('\n') };
    }
    if (!todo.length) { saveState(path, state); return { status: 0, message: '' }; }
    const { failures } = await runStage(root, registry, 'write', todo);
    if (failures.length) {
      for (const file of todo) state.failed[file] = versions[file];
      saveState(path, state);
      return { status: 2, message: [`CODE CHECK FAILED after a write to ${todo.join(', ')}. Fix this now, before anything else:`, ...failures].join('\n') };
    }
    for (const file of todo) { state.passed.write[file] = versions[file]; delete state.failed[file]; }
    saveState(path, state);
    return { status: 0, message: '' };
  }

  // Stop and SubagentStop, whatever stop_hook_active says: a failed version is refused on every attempt until the file changes.
  // A subagent may finish first, one that cannot act on a note among them, so the main agent still gets it, once per version.
  const goneNow = new Set([...gone].filter(file => !state.goneBefore.includes(file) && hashOf(root, file) === 'deleted'));
  for (const file of changed) if (versions[file] === 'deleted') goneNow.add(file);
  for (const file of state.othersBefore) if (!existsSync(join(root, file))) goneNow.add(file);
  // A file back in the tree may go again, and that is news.
  for (const file of Object.keys(state.told)) if (!goneNow.has(file)) delete state.told[file];
  const heldNotes = () => {
    if (name !== 'Stop') return { files: [], deletions: [], quiet: [], secure: [], mutants: [] };
    const files = Object.keys(state.notes).filter(file => state.notes[file] === versions[file]);
    const held = { files, deletions: Object.keys(state.deletions).filter(file => goneNow.has(file)).flatMap(file => state.deletions[file]) };
    state.deletions = {};
    for (const kind of NOTE_KINDS) {
      held[kind] = Object.keys(state[kind]).filter(file => state[kind][file].version === versions[file]).flatMap(file => state[kind][file].lines);
      state[kind] = {};
    }
    state.notes = {};
    return held;
  };
  const noteResult = ({ files, deletions, quiet: lines, secure, mutants }) => {
    const parts = deletions.map(line => `CODE CHECK NOTE: ${line}`);
    if (files.length) parts.push(`CODE CHECK NOTE: no test reaches ${files.join(', ')}. Its effect on other code is proven only by the type check, where one reads it. Add a test, or say so in your report.`);
    if (lines.length) parts.push(`CODE CHECK NOTE: this change makes a check quieter, so a pass says less than it did:`, ...lines, 'Undo it, or say in your report why it is right.');
    if (secure.length) parts.push('CODE CHECK NOTE: this change touches what an attacker reaches. Review each line against .claude/rules/shared/secure-code-review.md and say in your report what you checked:', ...secure);
    if (mutants.length) parts.push('CODE CHECK NOTE: this code was broken on purpose, with the defect stored in memory only. A line that says `became` is one the tests it names did not notice, or with none named every test that reaches it; a line that says `not tried` or `undecided` was not judged either way:', ...mutants, 'Add an assertion that fails on each, or say in your report why the two forms mean the same.');
    return parts.length ? { status: 2, message: [...parts, 'This stops you once per version of the file.'].join('\n') } : { status: 0, message: '' };
  };
  const NOT_YOURS = 'A session that wrote none of these files reports that instead of changing them.';
  const refused = refusedLines(root, 'HEAD', [...new Set([...Object.keys(state.named), ...changed])]);
  const todo = changed.filter(file => state.passed.stop[file] !== versions[file]);
  // The set of versions these results belong to, a file no row holds included, because a check may read it.
  const key = createHash('sha256').update(JSON.stringify([Object.entries(versions).sort(), [...others].sort().map(file => [file, hashOf(root, file)]), refused.map(refusedText)])).digest('hex');
  // A subagent may have written nothing, so it is told once and may finish; the main agent is refused on every attempt, and the failure is still there for it.
  if (name === 'SubagentStop' && (refused.length || todo.length) && state.subagentRefused === key) { saveState(path, state); return { status: 0, message: '' }; }
  const refuse = lines => {
    if (name === 'SubagentStop') state.subagentRefused = key;
    saveState(path, state);
    return { status: 2, message: lines.join('\n') };
  };
  if (refused.length) return refuse([`CODE CHECK FAILED: ${[...new Set(refused.map(({ file }) => file))].join(', ')} holds what must never enter the tree. Fix this before finishing:`, ...refused.map(refusedText), NOT_YOURS]);
  // What was told of a deletion reaches the main agent too, once per file.
  const deletions = () => {
    const fresh = [...goneNow].filter(file => !state.told[file]);
    const lines = fresh.flatMap(file => { state.told[file] = true; return leftBehind(root, registry, [file]).map(line => [file, line]); });
    if (name === 'SubagentStop') for (const [file, line] of lines) state.deletions[file] = [...(state.deletions[file] || []), line];
    return lines.map(([, line]) => line);
  };
  if (!todo.length) {
    const fresh = deletions();
    const held = heldNotes();
    const result = noteResult({ ...held, deletions: [...new Set([...fresh, ...held.deletions])] });
    saveState(path, state);
    return result;
  }
  if (state.runs?.key !== key) state.runs = { key, results: {} };
  const write = await runStage(root, registry, 'write', todo.filter(file => state.passed.write[file] !== versions[file]), state.runs.results);
  const stop = await runStage(root, registry, 'stop', todo, state.runs.results);
  const failures = [...write.failures, ...stop.failures];
  if (failures.length) return refuse([`CODE CHECK FAILED: how ${todo.join(', ')} affects the rest of the project. Fix this before finishing:`, ...failures,
    ...(write.shownAgain || stop.shownAgain ? ['Shown again: nothing under the roots changed since this ran, so it did not run again. Changing a file under the roots runs it.'] : []), NOT_YOURS]);
  delete state.runs;
  delete state.subagentRefused;
  for (const file of todo) { state.passed.write[file] = versions[file]; state.passed.stop[file] = versions[file]; delete state.failed[file]; }
  const perFile = rules => Object.fromEntries(todo.map(file => [file, added(root, rules, [file])]).filter(([, lines]) => lines.length));
  const quiet = perFile(registry.quieting);
  const secure = perFile(registry.secure.filter(rule => !rule.refuse));
  const mutants = await mutated(root, registry, todo.filter(file => !stop.notes.includes(file)), started);
  if (name === 'SubagentStop') {
    for (const file of stop.notes) state.notes[file] = versions[file];
    for (const [file, lines] of Object.entries(quiet)) state.quiet[file] = { version: versions[file], lines };
    for (const [file, lines] of Object.entries(secure)) state.secure[file] = { version: versions[file], lines };
    for (const [file, lines] of Object.entries(mutants)) state.mutants[file] = { version: versions[file], lines };
  }
  // The version is now passed, so this stops the agent once per version.
  const held = heldNotes();
  const fresh = { quiet, secure, mutants };
  const told = deletions();
  const result = noteResult({ files: [...new Set([...stop.notes, ...held.files])], deletions: [...new Set([...told, ...held.deletions])], ...Object.fromEntries(NOTE_KINDS.map(kind => [kind, [...new Set([...Object.values(fresh[kind]).flat(), ...held[kind]])]])) });
  saveState(path, state);
  return result;
}

// No path returns 0 for a command that did not finish, and any exception is a refusal with a message.
const couldNotRun = error => ({ status: 2, message: `CODE CHECK COULD NOT RUN: ${error.message}. A check that did not run is a failure.` });
export async function runCodeCheck(event, root) {
  try { return await check(event, root); }
  catch (error) { return couldNotRun(error); }
}

const pathKey = path => {
  let real = resolve(path);
  try { real = realpathSync.native(real); } catch { /* the resolved path */ }
  return process.platform === 'win32' ? real.toLowerCase() : real;
};
if (process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url))) {
  // No top-level await: mutation-check.mjs imports this module while the hook runs, and a module still evaluating would wait for itself (exit 13).
  const finish = result => {
    if (result.message) process.stderr.write(`${result.message}\n`, () => process.exit(result.status));
    else process.exit(result.status);
  };
  new Promise(done => { done(runCodeCheck(JSON.parse(readFileSync(0, 'utf8')), process.env.CLAUDE_PROJECT_DIR || process.cwd())); }).catch(couldNotRun).then(finish);
}

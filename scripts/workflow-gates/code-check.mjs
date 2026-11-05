#!/usr/bin/env node
// Task 945 (owner D25, 2026-11-04): written code is always checked, for its quality and for its effect on other code, and a problem is
// solved at once. Claude Code runs this after every tool call and before an agent or subagent finishes. It compares file contents and parses
// no command, so a write through any tool or shell form counts, and a session that changed no code runs nothing.
// It runs checks; it cannot judge logic no check catches. It is a workflow control, not a security barrier: its state is an ignored file.
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from 'node:fs';
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
const UNQUOTABLE = /["'`$%\r\n]/;
const KILL_GRACE_MS = 2000;

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
  const rows = registry.rows.map(row => ({ ...row, patterns: row.paths.map(globToRegExp) }));
  const compiled = rules => (rules || []).map(rule => ({ ...rule, patterns: rule.paths.map(globToRegExp), find: rule.pattern ? new RegExp(rule.pattern, `g${rule.flags || ''}`) : null, line: rule.pattern ? new RegExp(rule.pattern, rule.flags || '') : null }));
  return { ...registry, quieting: compiled(registry.quieting), secure: compiled(registry.secure), rowsFor: file => rows.filter(row => row.patterns.some(pattern => pattern.test(file))) };
}

// A check passes when a test is switched off or an assertion weakened as readily as when the code is right. No command can see that, so what this
// change adds is counted against the file at HEAD. A legitimate case exists, so it stops the agent once per version and is never a lasting refusal.
export function added(root, ruleList, files, base = 'HEAD') {
  const lines = [];
  for (const file of files) {
    const rules = ruleList.filter(rule => rule.patterns.some(pattern => pattern.test(file)));
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
      for (const { text, index } of (added.length ? added : [{ text: `${count(now) - count(before)} more than at HEAD`, index: -1 }]).slice(0, 5)) lines.push(`${file}${index < 0 ? '' : `:${index + 1}`}: ${rule.what}: ${text.trim().slice(0, 120)}`);
    }
  }
  return lines;
}

function hashOf(root, file) {
  try { return createHash('sha256').update(readFileSync(join(root, file))).digest('hex'); }
  catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return 'deleted'; throw error; }
}

// What the tree holds: every dirty code file of the roots with the hash of its content. With -z a rename or copy writes its old path as an
// entry of its own, with no status columns: the old path of a rename is a file that went away, the source of a copy did not change.
function snapshot(root, registry) {
  const git = spawnSync('git', ['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=all', '--', ...registry.roots],
    { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, windowsHide: true });
  if (git.error || git.status !== 0) throw new Error(`git status failed: ${git.error?.message || String(git.stderr).trim()}`);
  const files = {};
  const add = file => { if (registry.rowsFor(file).length) files[file] = hashOf(root, file); };
  const entries = git.stdout.split('\0').filter(Boolean);
  for (let i = 0; i < entries.length; i++) {
    const status = entries[i].slice(0, 2);
    add(entries[i].slice(3));
    if (/[RC]/.test(status)) {
      i++;
      if (status.includes('R') && entries[i]) add(entries[i]);
    }
  }
  return files;
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
const newState = baseline => ({ baseline, passed: { write: {}, stop: {} }, failed: {}, named: {}, notes: {}, quiet: {}, secure: {}, mutants: {}, seen: {} });

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
// A whole-tree gate that lists findings names a real file under the folders it checks. One that names none reported nothing: it crashed or
// never scanned, and that is no finding elsewhere. A word must be a file, because a gate may print the glob it scans before it crashes.
const reportsFile = (root, output, folders) => output.replaceAll('\\', '/').split(/[\s"'`,;:]+/)
  .some(word => [...folders].some(folder => word.startsWith(folder)) && statSync(join(root, word), { throwIfNoEntry: false })?.isFile());

// The registry's time is for the whole stage: a hook that reaches its own timeout renders no decision, so the stage must end first and say so.
async function runStage(root, registry, stage, files) {
  const failures = [], notes = [];
  // What must never enter the tree is refused whatever any command says. It is not a note: nothing legitimate needs it.
  if (stage === 'write') failures.push(...added(root, registry.secure.filter(rule => rule.refuse), files));
  const commands = new Map();
  for (const file of files) for (const row of registry.rowsFor(file)) for (const entry of row[stage]) {
    const command = typeof entry === 'string' ? entry : entry.run;
    if (!commands.has(command)) commands.set(command, { owners: new Set(), folders: new Set(), namesFile: Boolean(entry.namesFile) });
    commands.get(command).owners.add(file);
    // A gate that scans wider than its row names the folders it reports on.
    for (const folder of entry.folders || row.paths.map(path => path.split('*')[0])) commands.get(command).folders.add(folder);
  }
  const deadline = Date.now() + registry.timeoutMs[stage];
  const unfinished = (what, reason) => `${what}: could not finish (${reason}); a check that did not finish is a failure`;
  for (const [command, { owners, folders, namesFile }] of commands) {
    const all = [...owners];
    const named = /\{files?\}/.test(command) ? all.filter(file => existsSync(join(root, file))) : [];
    for (const file of named.filter(path => UNQUOTABLE.test(path))) failures.push(unfinished(file, 'its name holds a character no command line can quote'));
    for (const { text, owners: batch } of commandTexts(command, all, named.filter(path => !UNQUOTABLE.test(path)))) {
      const left = deadline - Date.now();
      if (left <= 0) { failures.push(unfinished(text, `the ${stage} stage used its ${registry.timeoutMs[stage]} ms before it started`)); continue; }
      const run = await runCommand(text, root, left);
      const tail = lastLines(run.output, registry.tailLines);
      if (run.status === null) failures.push(`${unfinished(text, run.reason)}${tail ? `\n${tail}` : ''}`);
      // A whole-tree gate with findings outside this change does not block: only findings in the changed files count.
      else if (run.status !== 0 && namesFile && !all.some(file => namedInOutput(run.output, file))) {
        if (!reportsFile(root, run.output, folders)) failures.push(`${unfinished(text, `exit ${run.status}, and its output names no file it checks`)}\n${tail}`);
      }
      // Such a gate lists the whole tree, so the lines of the changed files, and the details under them, may lie above the tail.
      else if (run.status !== 0 && namesFile) {
        const lines = run.output.split(/\r?\n/);
        const own = lines.flatMap((line, index) => (all.some(file => namedInOutput(line, file)) ? lines.slice(index, index + 6) : []));
        failures.push(`${text}: exit ${run.status}\n${own.slice(0, registry.tailLines).join('\n')}\n${tail}`);
      }
      else if (run.status !== 0) failures.push(`${text}: exit ${run.status}\n${failingLines(run.output, tail, registry.tailLines)}${tail}`);
      else if (/No test files found/.test(run.output)) notes.push(...batch);
    }
  }
  return { failures, notes: [...new Set(notes)] };
}

// After every check passed, with the time the hook has left. It stays out of the way of a registry without it, and loads only when it runs.
// Whatever goes wrong here is told to the agent; the checks above already passed, so it does not turn into a refusal of their version.
async function mutated(root, registry, files, started) {
  const config = registry.mutation;
  if (!config || !files.length) return {};
  const deadline = Math.min(Date.now() + config.timeoutMs, started + config.hookMs);
  try {
    const { runMutation, reportLines } = await import('./mutation-check.mjs');
    return reportLines(await runMutation({ root, config, files, deadline, runCommand }), config.shown);
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
  const now = snapshot(root, registry);
  const saved = readState(path);
  const state = saved || newState(now);
  state.notes ||= {};
  for (const kind of NOTE_KINDS) state[kind] ||= {};
  state.seen[name] = (state.seen[name] || 0) + 1;
  if (!['PostToolUse', 'Stop', 'SubagentStop'].includes(name)) { saveState(path, state); return { status: 0, message: '' }; }

  // A file is changed when its hash differs from the baseline. The version is the hash read before any check runs, so a file that changes
  // during a check is never recorded as passed at a version no check saw.
  const written = writtenFile(root, event);
  // A new baseline holds the work before this event, not the write that fired it.
  if (!saved && written) delete state.baseline[written];
  if (written && registry.rowsFor(written).length) state.named[written] = true;
  const versions = { ...now };
  for (const file of [...Object.keys(state.baseline), ...Object.keys(state.named)]) if (!(file in versions) && registry.rowsFor(file).length) versions[file] = hashOf(root, file);
  const changed = Object.keys(versions).filter(file => versions[file] !== state.baseline[file]);
  // A failed version is remembered only while it is the current one: a later return to its hash, or a second deletion, is news.
  for (const file of Object.keys(state.failed)) if (state.failed[file] !== versions[file]) delete state.failed[file];

  if (name === 'PostToolUse') {
    // A version that failed is shown once here, not again on every later command; Stop still refuses it.
    const todo = changed.filter(file => state.passed.write[file] !== versions[file] && state.failed[file] !== versions[file]);
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
  const heldNotes = () => {
    if (name !== 'Stop') return { files: [], quiet: [], secure: [], mutants: [] };
    const files = Object.keys(state.notes).filter(file => state.notes[file] === versions[file]);
    const held = { files };
    for (const kind of NOTE_KINDS) {
      held[kind] = Object.keys(state[kind]).filter(file => state[kind][file].version === versions[file]).flatMap(file => state[kind][file].lines);
      state[kind] = {};
    }
    state.notes = {};
    return held;
  };
  const noteResult = ({ files, quiet: lines, secure, mutants }) => {
    const parts = [];
    if (files.length) parts.push(`CODE CHECK NOTE: no test reaches ${files.join(', ')}. Its effect on other code is proven only by the type check, where one reads it. Add a test, or say so in your report.`);
    if (lines.length) parts.push(`CODE CHECK NOTE: this change makes a check quieter, so a pass says less than it did:`, ...lines, 'Undo it, or say in your report why it is right.');
    if (secure.length) parts.push('CODE CHECK NOTE: this change touches what an attacker reaches. Review each line against .claude/rules/shared/secure-code-review.md and say in your report what you checked:', ...secure);
    if (mutants.length) parts.push('CODE CHECK NOTE: this code was broken on purpose, in memory only. A line that says `became` is one the tests it names did not notice, or with none named every test that reaches it; a line that says `not tried` was not judged either way:', ...mutants, 'Add an assertion that fails on each, or say in your report why the two forms mean the same.');
    return parts.length ? { status: 2, message: [...parts, 'This stops you once per version of the file.'].join('\n') } : { status: 0, message: '' };
  };
  const todo = changed.filter(file => state.passed.stop[file] !== versions[file]);
  if (!todo.length) {
    const held = heldNotes();
    const result = noteResult(held);
    saveState(path, state);
    return result;
  }
  const write = await runStage(root, registry, 'write', todo.filter(file => state.passed.write[file] !== versions[file]));
  const stop = await runStage(root, registry, 'stop', todo);
  const failures = [...write.failures, ...stop.failures];
  if (failures.length) {
    saveState(path, state);
    return { status: 2, message: [`CODE CHECK FAILED: how ${todo.join(', ')} affects the rest of the project. Fix this before finishing:`, ...failures,
      'A session that wrote none of these files reports that instead of changing them.'].join('\n') };
  }
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
  const result = noteResult({ files: [...new Set([...stop.notes, ...held.files])], ...Object.fromEntries(NOTE_KINDS.map(kind => [kind, [...new Set([...Object.values(fresh[kind]).flat(), ...held[kind]])]])) });
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
  let result;
  try { result = await runCodeCheck(JSON.parse(readFileSync(0, 'utf8')), process.env.CLAUDE_PROJECT_DIR || process.cwd()); }
  catch (error) { result = couldNotRun(error); }
  if (result.message) process.stderr.write(`${result.message}\n`, () => process.exit(result.status));
  else process.exit(result.status);
}

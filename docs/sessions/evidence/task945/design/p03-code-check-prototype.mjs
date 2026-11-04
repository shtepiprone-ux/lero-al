// Task 945 design prototype of scripts/workflow-gates/code-check.mjs. To read, not to paste. It runs as a hook process: JSON on stdin.
// SessionStart records what the tree holds. PostToolUse finds every code file this session changed, by content hash, so a write through any
// tool or shell form counts without parsing a command, runs the write stage and shows a failure at once (exit 2). Stop and SubagentStop run
// the stop stage on every changed file not yet passed at its current hash, and refuse to finish until it passes (exit 2).
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const refuse = lines => { process.stderr.write(`${lines.join('\n')}\n`); process.exit(2); };
let event, registry;
try {
  event = JSON.parse(readFileSync(0, 'utf8') || '{}');
  registry = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/code-check.json'), 'utf8'));
} catch (error) { refuse([`CODE CHECK COULD NOT RUN: ${error.message}. A check that did not run is a failure.`]); }
const glob = pattern => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '(?:.*/)?').replace(/\*/g, '[^/]*')}$`);
const rowsFor = file => registry.rows.filter(row => row.paths.some(pattern => glob(pattern).test(file)));
const isCode = file => rowsFor(file).length > 0;

const statePath = join(root, 'test-results/code-check', `${String(event.session_id || 'no-session').replace(/\W/g, '_')}.json`);
const readState = () => { try { return JSON.parse(readFileSync(statePath, 'utf8')); } catch { return null; } };
function saveState(state) {
  mkdirSync(join(root, 'test-results/code-check'), { recursive: true });
  const temporary = `${statePath}.${process.pid}`;
  writeFileSync(temporary, JSON.stringify(state));
  renameSync(temporary, statePath);
}
const hashOf = file => { try { return createHash('sha256').update(readFileSync(join(root, file))).digest('hex'); } catch { return 'deleted'; } };
function snapshot() {
  const git = spawnSync('git', ['status', '--porcelain', '-z', '--untracked-files=all', '--', ...registry.roots], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (git.status !== 0) throw new Error(`git status failed: ${git.stderr}`);
  const files = {};
  const entries = git.stdout.split('\0').filter(Boolean);
  for (let i = 0; i < entries.length; i++) {
    const file = entries[i].slice(3);
    if (isCode(file)) files[file] = hashOf(file);
    // With -z a rename or copy writes its old path as an entry of its own, with no status columns.
    if (/^(?:R|C|.R|.C)/.test(entries[i])) i++;
  }
  return files;
}
// A check that hangs is ended with its whole process tree: killing the shell alone leaves the program running (p04, first run: EBUSY on its folder).
function runCommand(text, timeoutMs) {
  return new Promise(done => {
    const child = spawn(text, { cwd: root, shell: true, detached: process.platform !== 'win32' });
    let output = '', timedOut = false;
    child.stdout.on('data', chunk => { output = `${output}${chunk}`.slice(-1 << 20); });
    child.stderr.on('data', chunk => { output = `${output}${chunk}`.slice(-1 << 20); });
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)]);
      else { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ } }
    }, timeoutMs);
    child.on('error', error => { clearTimeout(timer); done({ status: null, output, reason: error.code }); });
    child.on('close', status => { clearTimeout(timer); done({ status: timedOut ? null : status, output, reason: timedOut ? 'timeout' : `signal or no exit code` }); });
  });
}
async function runStage(stage, files) {
  const failures = [], notes = [];
  const commands = new Map();
  for (const file of files) for (const row of rowsFor(file)) for (const entry of row[stage] || []) {
    const command = typeof entry === 'string' ? entry : entry.run;
    if (!commands.has(command)) commands.set(command, { owners: [], namesFile: Boolean(entry.namesFile) });
    commands.get(command).owners.push(file);
  }
  // The registry's time is for the whole stage: the hook's own timeout renders no decision, so the stage must end first and say so.
  const deadline = Date.now() + registry.timeoutMs[stage];
  for (const [command, { owners, namesFile }] of commands) {
    const present = owners.filter(file => existsSync(join(root, file)));
    const needsFiles = /\{files?\}/.test(command);
    if (needsFiles && !present.length) continue;
    const texts = command.includes('{file}') ? present.map(file => command.replaceAll('{file}', file)) : [command.replaceAll('{files}', present.map(file => `"${file}"`).join(' '))];
    for (const text of texts) {
      const run = await runCommand(text, Math.max(1, deadline - Date.now()));
      if (run.status === null) failures.push(`${text}: could not finish (${run.reason}); a check that did not finish is a failure`);
      // A whole-tree gate with findings outside this change: only findings in the changed files count (p05: design tokens at HEAD).
      else if (run.status !== 0 && namesFile && !owners.some(file => run.output.includes(file))) continue;
      else if (run.status !== 0) failures.push(`${text}: exit ${run.status}\n${run.output.trim().split('\n').slice(-registry.tailLines).join('\n')}`);
      else if (/No test files found/.test(run.output)) notes.push(...owners);
    }
  }
  return { failures, notes };
}

const name = event.hook_event_name;
if (name === 'SessionStart') {
  if (!readState()) saveState({ baseline: snapshot(), passed: {}, noted: {} });
  process.exit(0);
}
try {
  const state = readState() || { baseline: snapshot(), passed: {}, noted: {} };
  const now = snapshot();
  const changed = Object.keys(now).filter(file => now[file] !== state.baseline[file]);
  // A file the session wrote that the baseline already held dirty, or that went back to its committed text, is seen through the tool input too.
  const named = event.tool_input?.file_path ? String(event.tool_input.file_path).replaceAll('\\', '/').replace(`${root.replaceAll('\\', '/')}/`, '') : null;
  if (named && isCode(named) && !changed.includes(named) && hashOf(named) !== state.passed[`write:${named}`] && hashOf(named) !== state.baseline[named]) changed.push(named);
  if (name === 'PostToolUse') {
    // A version that failed is shown once at PostToolUse, not again on every later command; Stop still refuses it.
    const todo = changed.filter(file => state.passed[`write:${file}`] !== hashOf(file) && state.failed?.[file] !== hashOf(file));
    if (!todo.length) { saveState(state); process.exit(0); }
    const { failures } = await runStage('write', todo);
    if (failures.length) {
      state.failed = { ...state.failed, ...Object.fromEntries(todo.map(file => [file, hashOf(file)])) };
      saveState(state);
      refuse([`CODE CHECK FAILED after a write to ${todo.join(', ')}. Fix this now, before anything else:`, ...failures]);
    }
    for (const file of todo) state.passed[`write:${file}`] = hashOf(file);
    saveState(state);
    process.exit(0);
  }
  if (name === 'Stop' || name === 'SubagentStop') {
    const todo = changed.filter(file => state.passed[`stop:${file}`] !== hashOf(file));
    if (!todo.length) { saveState(state); process.exit(0); }
    const write = await runStage('write', todo.filter(file => state.passed[`write:${file}`] !== hashOf(file)));
    const stop = await runStage('stop', todo);
    const failures = [...write.failures, ...stop.failures];
    if (failures.length) { saveState(state); refuse([`CODE CHECK FAILED: how ${todo.join(', ')} affects the rest of the project. Fix this before finishing:`, ...failures]); }
    for (const file of todo) { state.passed[`write:${file}`] = hashOf(file); state.passed[`stop:${file}`] = hashOf(file); }
    const fresh = stop.notes.filter(file => state.noted[file] !== hashOf(file));
    for (const file of stop.notes) state.noted[file] = hashOf(file);
    saveState(state);
    if (fresh.length) refuse([`CODE CHECK NOTE: no test reaches ${[...new Set(fresh)].join(', ')}. Its effect on other code is proven only by the type check. Add a test, or say so in your report. This stops you once per version of the file.`]);
  }
  process.exit(0);
} catch (error) {
  refuse([`CODE CHECK COULD NOT RUN: ${error.message}. A check that did not run is a failure.`]);
}

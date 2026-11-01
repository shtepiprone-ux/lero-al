#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, existsSync, openSync, readSync, closeSync, fstatSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function modelRole(model) {
  if (typeof model !== 'string') return undefined;
  if (/sonnet/i.test(model)) return 'executor';
  if (/opus/i.test(model)) return 'orchestrator';
  return undefined;
}
function stateFile(root, key) {
  if (typeof key !== 'string' || key.length === 0 || key.length > 256) return undefined;
  const hash = createHash('sha256').update(key).digest('hex');
  return join(root, '.claude/state/session-roles', `${hash}.json`);
}
export function roleFile(root, id) { return stateFile(root, id); }
// One Claude Code process keeps its model across `/clear` (only `/model` changes it, and that fires PostModelSwitch),
// so a cleared session inherits the role its own process last resolved. Keyed by the process id Claude Code exports.
export function processRoleFile(root, pid = process.env.CLAUDE_PID) {
  return /^\d{1,10}$/.test(String(pid ?? '')) ? stateFile(root, `process:${pid}`) : undefined;
}
function readState(file) {
  if (!file || !existsSync(file)) return undefined;
  try {
    const state = JSON.parse(readFileSync(file, 'utf8'));
    return state.version === 1 ? state : undefined;
  } catch { return undefined; }
}
function knownRole(role) { return ['executor', 'orchestrator'].includes(role) ? role : undefined; }

// The model Claude Code itself recorded on this session's latest main-thread assistant entry. Each JSONL line is one
// client-written entry; text inside a prompt or tool result is escaped within its line and cannot form an entry.
const TRANSCRIPT_TAIL_BYTES = 8 * 1024 * 1024;
export function transcriptRole(path) {
  if (typeof path !== 'string' || path.length === 0) return undefined;
  let fd;
  try {
    fd = openSync(path, 'r');
    const size = fstatSync(fd).size;
    const start = Math.max(0, size - TRANSCRIPT_TAIL_BYTES);
    const buffer = Buffer.alloc(size - start);
    readSync(fd, buffer, 0, buffer.length, start);
    const lines = buffer.toString('utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('"assistant"')) continue;
      let entry;
      try { entry = JSON.parse(lines[i]); } catch { continue; }
      if (entry?.type !== 'assistant' || entry.isSidechain === true) continue;
      const model = entry.message?.model;
      if (typeof model !== 'string' || model === '<synthetic>') continue;
      return modelRole(model);
    }
  } catch { return undefined; } finally { if (fd !== undefined) closeSync(fd); }
  return undefined;
}

export function sessionRole(root, event) {
  // Subagents carry a real agent_type even when the session model metadata is absent.
  if (['executor', 'orchestrator'].includes(event.agent_type)) return event.agent_type;
  const supplied = modelRole(event.model);
  if (supplied) return supplied;
  const state = readState(roleFile(root, event.session_id));
  if (knownRole(state?.role)) return state.role;
  // An explicit switch to an unrecognized model stays unknown; it never falls back to an older model.
  if (state?.source === 'PostModelSwitch') return undefined;
  return transcriptRole(event.transcript_path);
}
export function captureRole(root, event) {
  const file = roleFile(root, event.session_id);
  if (!file) return undefined;
  const switched = event.hook_event_name === 'PostModelSwitch';
  const named = knownRole(event.agent_type);
  let role = named || (switched ? modelRole(event.to_model) : modelRole(event.model))
    || (!switched && !event.model ? sessionRole(root, event) : undefined);
  const processFile = processRoleFile(root);
  if (!role && !switched && event.source === 'clear') role = knownRole(readState(processFile)?.role);
  mkdirSync(join(root, '.claude/state/session-roles'), { recursive: true });
  // These contain only the role and the event that set it. No transcript, raw model argument, prompt or credentials.
  writeFileSync(file, JSON.stringify({ version: 1, role: role || null, source: switched ? 'PostModelSwitch' : 'SessionStart' }) + '\n', 'utf8');
  // A fresh process (startup) never inherits an earlier process that had the same id.
  if (processFile && (role || switched || event.source !== 'clear')) {
    writeFileSync(processFile, JSON.stringify({ version: 1, role: role || null }) + '\n', 'utf8');
  }
  return role;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    // A PowerShell 5.1 pipe prefixes a BOM.
    const event = JSON.parse(readFileSync(0, 'utf8').replace(/^\uFEFF/, ''));
    const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
    // `--resolve`: read-only lookup for the PowerShell hooks, so both runtimes share this one implementation.
    if (process.argv.includes('--resolve')) { console.log(sessionRole(root, event) || ''); process.exit(0); }
    const role = captureRole(root, event);
    const context = role === 'executor'
      ? 'Lero.al executor role: load execute-task and its phase files. Never approve tasks or edit policy.'
      : role === 'orchestrator' ? 'Lero.al orchestrator role: load create-task or review-task for the current phase; never implement product code.'
        : 'Lero.al model role is not in this event. Hooks take it from the model Claude Code records on this session\'s first reply; no restart is needed. Load the workflow for your model explicitly.';
    // Both supported events accept plain stdout as context; avoid an event-specific JSON shape.
    console.log(context);
  } catch { console.error('Role bootstrap could not initialize safely.'); process.exitCode = 2; }
}

#!/usr/bin/env node
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContract, validateReport, validateGovernanceReport, isProductPath, isPolicyPath as policyPath, isTaskDocument, safePath, planDigest, workflowRuleInputs,
  isEvidencePath, rebaseChain, rulesEntryErrors } from './contract.mjs';
import { readJson, allContracts } from './cli.mjs';
import { sessionRole } from './session-role.mjs';
import { blockedResponse, plainResponseLines, hasGitHandoff } from './response-state.mjs';

function assistantMessages(transcript) {
  const messages = [];
  for (const [index, line] of transcript.split('\n').entries()) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    if (event?.type === 'assistant' && Array.isArray(event.message?.content)) messages.push({ index, content: event.message.content });
  }
  return messages;
}
export function assistantContent(transcript) {
  return assistantMessages(transcript).flatMap(message => message.content);
}
export function completedReads(root, transcript, required) {
  const pending = new Map(), coverage = new Map();
  const expected = new Map(required.map(file => [file, readFileSync(safePath(root, file), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')]));
  for (const line of transcript.split('\n')) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    for (const block of event?.message?.content || []) {
      if (event.type === 'assistant' && block?.type === 'tool_use' && block.name === 'Read' && block.id) {
        const path = projectPath(root, block.input?.file_path);
        if (required.includes(path)) pending.set(block.id, { path, start: block.input?.offset ?? 1, limit: block.input?.limit ?? 2000 });
      }
      if (block?.type === 'tool_result' && block.is_error !== true && pending.has(block.tool_use_id)) {
        const read = pending.get(block.tool_use_id); pending.delete(block.tool_use_id);
        if (Number.isInteger(read.start) && read.start > 0 && Number.isInteger(read.limit) && read.limit > 0) {
          const content = typeof block.content === 'string' ? block.content : Array.isArray(block.content)
            ? block.content.filter(b => b.type === 'text').map(b => b.text || '').join('\n') : '';
          const lines = coverage.get(read.path) || new Set();
          for (const match of content.matchAll(/^\s*(\d+)(?:→|\t)([^\r\n]*)\r?$/gm)) {
            const number = Number(match[1]);
            if (number >= read.start && number < read.start + read.limit && expected.get(read.path)[number - 1] === match[2]) lines.add(number);
          }
          coverage.set(read.path, lines);
        }
      }
    }
  }
  return required.filter(file => {
    // Only validated task/rule paths are opened, never arbitrary transcript paths or environment files.
    return expected.get(file).every((_, i) => coverage.get(file)?.has(i + 1));
  });
}
function successfulCalls(transcript) {
  const pending = new Map(), completed = [];
  for (const [index, line] of transcript.split('\n').entries()) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    for (const block of event?.message?.content || []) {
      if (event.type === 'assistant' && block.type === 'tool_use' && block.id) pending.set(block.id, block);
      if (block.type === 'tool_result' && pending.has(block.tool_use_id)) {
        const call = pending.get(block.tool_use_id); pending.delete(block.tool_use_id);
        if (block.is_error !== true) completed.push({ ...call, result: block.content, index });
      }
    }
  }
  return completed;
}
function executorContractEdit(root, file, event) {
  try {
    const previous = readJson(root, file);
    let content = event.tool_input.content;
    if (event.tool_name === 'Edit') {
      const old = readFileSync(safePath(root, file), 'utf8');
      const { old_string: before, new_string: after, replace_all: all } = event.tool_input;
      if (typeof before !== 'string' || !before || typeof after !== 'string' || !old.includes(before)) return ['Contract authority cannot verify this edit'];
      content = all ? old.replaceAll(before, after) : old.replace(before, after);
    }
    const next = JSON.parse(content);
    if (!['planned', 'implemented'].includes(previous.stage) || !['planned', 'implemented'].includes(next.stage)
      || JSON.stringify(previous.review) !== JSON.stringify(next.review) || planDigest(root, previous) !== planDigest(root, next)) {
      return ['CONTRACT AUTHORITY: Sonnet cannot change planned expectations or independent review'];
    }
    return [];
  } catch { return ['CONTRACT AUTHORITY: Sonnet may only edit implementation stage on an existing plan with Write/Edit']; }
}
function projectPath(root, file) {
  if (typeof file !== 'string') return '';
  const target = resolve(root, file);
  const lexical = relative(root, target).replaceAll('\\', '/');
  if (lexical === '..' || lexical.startsWith('../') || isAbsolute(lexical)) return lexical;
  let ancestor = target;
  const tail = [];
  while (!existsSync(ancestor) && dirname(ancestor) !== ancestor) { tail.unshift(basename(ancestor)); ancestor = dirname(ancestor); }
  return relative(realpathSync(root), join(realpathSync(ancestor), ...tail)).replaceAll('\\', '/');
}
const pathKey = file => process.platform === 'win32' ? file.toLowerCase() : file;
function inScope(root, scope, file) {
  return Array.isArray(scope) && scope.some(path => typeof path === 'string' && pathKey(projectPath(root, path)) === pathKey(file));
}
function registeredWrites(root, files) {
  const candidates = files.filter(file => !isProductPath(file) && !policyPath(file) && !/^tasks\/.+\.security\.json$/.test(file));
  const enrolled = new Set();
  if (candidates.length) for (const path of allContracts(root)) {
    // Enrollment requires preflight; it never authorizes a write. Authorization uses only the current valid plan.
    let contract; try { contract = readJson(root, path); } catch { continue; }
    for (const file of candidates) if (inScope(root, contract?.scope, file)) enrolled.add(file);
  }
  return enrolled;
}
// Shell writes the PreToolUse guard recognizes: write cmdlets/APIs naming a project path, and output redirection.
export function shellWriteTargets(root, command) {
  const files = [];
  if (/\b(?:Set-Content|Add-Content|Out-File|apply_patch|writeFileSync|write_text|writeFile)\b/i.test(command)) {
    files.push(...[...command.matchAll(/(?:src|public|messages|tasks|database|migrations|supabase|\.claude|\.github|scripts|docs)[/\\][^\s'";|<>]+\.(?:[cm]?[jt]sx?|sql|css|json|md|ps1|py|sh|ya?ml|svg)/g)].map(m => projectPath(root, m[0].replaceAll('\\', '/'))));
  }
  // Redirection writes its target, not every source filename mentioned by a read/test command.
  for (const match of command.matchAll(/(?<![=<>])>{1,2}(?![=>])\s*(?:"([^"]+)"|'([^']+)'|([^\s;|]+))/g)) {
    files.push(projectPath(root, match[1] || match[2] || match[3]));
  }
  return files;
}
// Owner decision 2026-11-01 (Task 935 D2): a session that wrote any governance scope file cannot approve it. The
// approver's rule-only rebase of another reviewed contract (a `rules` chain entry by the receipt contract and its
// evidence) is not such a write, but only while that entry passes its rules validation (Task 940 R5, review note N1).
// A `scope` entry never exempts a write.
export function governanceIndependenceErrors(root, contract, receiptPath, transcript) {
  const calls = successfulCalls(transcript);
  const written = [...calls.filter(call => ['Write', 'Edit'].includes(call.name)).map(call => projectPath(root, call.input?.file_path || call.input?.path)),
    ...calls.filter(call => ['PowerShell', 'Bash'].includes(call.name) && typeof call.input?.command === 'string')
      .flatMap(call => shellWriteTargets(root, call.input.command))];
  const exempt = new Set();
  for (const path of allContracts(root)) {
    if (path === receiptPath) continue;
    let other; try { other = readJson(root, path); } catch { continue; }
    for (const { kind, entry } of rebaseChain(other).entries) {
      if (kind !== 'rules' || !entry || typeof entry !== 'object' || typeof entry.by !== 'string' || pathKey(entry.by) !== pathKey(receiptPath)) continue;
      if (typeof entry.evidence !== 'string' || !isEvidencePath(entry.evidence)) continue;
      let problems; try { problems = rulesEntryErrors(root, other, entry); } catch { continue; }
      if (problems.length) continue;
      exempt.add(pathKey(path));
      exempt.add(pathKey(entry.evidence));
    }
  }
  const errors = [];
  for (const file of new Set(written.filter(Boolean))) {
    if (!exempt.has(pathKey(file)) && inScope(root, contract.scope, file)) {
      errors.push(`GOVERNANCE INDEPENDENCE: this session wrote ${file}; an implementing session cannot approve (owner decision 2026-11-01)`);
    }
  }
  return errors;
}
function currentReceipt(text) {
  const candidate = [...text.matchAll(/^SECURITY TASK PREFLIGHT COMPLETE - contract:[^\r\n]*$/gm)].at(-1);
  if (!candidate) return { error: 'No valid receipt: run `node scripts/workflow-gates/cli.mjs receipt --contract <path>` through the PowerShell tool for the current task.' };
  const receipt = candidate[0].match(/^SECURITY TASK PREFLIGHT COMPLETE - contract: (tasks\/[^\r\n;]+\.security\.json)\.?\s*$/);
  return receipt ? { path: receipt[1] } : { error: 'Current security task receipt is malformed; register a corrected receipt.' };
}

function reviewContinuationErrors(root, last, messages, transcript) {
  // A review's current turn must finish its transition. A later informational owner question is not a new review.
  let ownerIndex = -1;
  for (const [index, line] of transcript.split('\n').entries()) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    const content = event?.message?.content;
    if (event?.type === 'user' && (typeof content === 'string'
      || Array.isArray(content) && content.some(block => block.type === 'text'))) ownerIndex = index;
  }
  const entries = [...messages.map(message => ({ index: message.index,
    text: message.content.filter(block => block.type === 'text').map(block => block.text || '').join('\n') })),
  { index: Infinity, text: last }];
  const mode = list => list.flatMap(entry => plainResponseLines(entry.text))
    .map(line => line.text.match(/^(REVIEW|TASK-DESIGN) PREFLIGHT COMPLETE\b/)?.[1]).filter(Boolean).at(-1);
  const currentMode = mode(entries.filter(entry => entry.index > ownerIndex));
  if (currentMode !== 'REVIEW' && (currentMode || mode(entries) !== 'REVIEW' || !hasGitHandoff(last))) return [];

  const plain = plainResponseLines(last).map(line => line.text);
  // Whole-task approval still takes the independent release-validation path below.
  if (plain.some(line => /^(?:APPROVED|APPROVED WITH NOTES)$/.test(line))) return [];
  const references = plain.filter(line => line.startsWith('NEXT EXECUTOR CONTRACT:'));
  const path = references.length === 1 && references[0].match(/^NEXT EXECUTOR CONTRACT: (tasks\/(?!Archive\/).+\.security\.json)$/i)?.[1];
  if (!path) return ['REVIEW CONTINUATION: a stage acceptance is not the end of the assigned task. Complete and save the next assigned route in this turn, then name exactly one NEXT EXECUTOR CONTRACT: tasks/<path>.security.json. If a concrete external dependency prevents progress, report it with plain BLOCKED and no Git handoff. Resume retained proof; do not restart completed checks.'];
  try {
    const contract = JSON.parse(readFileSync(safePath(root, path), 'utf8'));
    const errors = validateContract(root, contract, { phase: 'plan' });
    if (contract.executionStatus !== 'ready') errors.push('Next route must explicitly be ready');
    if (contract.stage === 'reviewed' || !isTaskDocument(contract.task || '')) errors.push('Next route must be active and open for execution');
    return errors.map(error => `REVIEW CONTINUATION: ${path}: ${error}`);
  } catch (error) { return [`REVIEW CONTINUATION: next route unavailable or invalid (${error.message})`]; }
}

export function evaluateHook(root, event, transcript) {
  const messages = assistantMessages(transcript);
  const durable = successfulCalls(transcript).filter(call => ['PowerShell', 'Bash'].includes(call.name)
    && /(?:^|[\\/])cli\.mjs\s+receipt\s+--contract\s/.test(call.input?.command || ''))
    .map(call => ({ index: call.index, text: typeof call.result === 'string' ? call.result : (call.result || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n') }));
  const text = [...messages.map(message => ({ index: message.index, text: message.content.filter(b => b.type === 'text').map(b => b.text || '').join('\n') })), ...durable]
    .sort((a, b) => a.index - b.index).map(entry => entry.text).join('\n');
  const role = sessionRole(root, event);
  if (event.hook_event_name === 'Stop') {
    const last = typeof event.last_assistant_message === 'string' ? event.last_assistant_message
      : messages.map(message => message.content.filter(b => b.type === 'text').map(b => b.text || '').join('\n')).filter(Boolean).at(-1) || '';
    // Reporting an incomplete task is always possible; it cannot authorize merge or release.
    const incomplete = blockedResponse(last);
    if (incomplete.isBlocked) return incomplete.errors;
    const written = successfulCalls(transcript).filter(b => ['Write', 'Edit'].includes(b.name))
      .map(b => projectPath(root, b.input?.file_path || b.input?.path));
    const tasks = [...new Set(written.filter(isTaskDocument))];
    const errors = role === 'executor' ? [] : reviewContinuationErrors(root, last, messages, transcript);
    for (const task of tasks) {
      if (!existsSync(resolve(root, task))) continue;
      const contract = `${task.slice(0, -3)}.security.json`;
      try { errors.push(...validateContract(root, readJson(root, contract), { phase: 'plan' }).map(e => `${contract}: ${e}`)); }
      catch (error) { errors.push(error.message); }
    }
    if (/^\s*(?:APPROVED(?: WITH NOTES)?|IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW)\s*$/m.test(last)) {
      if (role === 'executor' && /^\s*APPROVED(?: WITH NOTES)?\s*$/m.test(last)) errors.push('Executor cannot issue an approval verdict');
      const receipt = currentReceipt(text);
      if (receipt.error) errors.push(`Completion/approval requires the current task security contract receipt: ${receipt.error}`);
      else {
        try {
          const contract = readJson(root, receipt.path);
          const approving = /^\s*APPROVED(?: WITH NOTES)?\s*$/m.test(last);
          errors.push(...validateContract(root, contract, { phase: approving ? 'release' : 'verify' }));
          if (contract.kind === 'product') errors.push(...validateReport(root, contract, readJson(root, contract.report)));
          if (contract.kind === 'governance') {
            if (approving) errors.push(...governanceIndependenceErrors(root, contract, receipt.path, transcript));
            errors.push(...validateGovernanceReport(root, contract, readJson(root, contract.report)));
          }
          if (approving && contract.stage !== 'reviewed') errors.push('Independent approval requires reviewed stage');
        } catch (error) { errors.push(error.message); }
      }
    }
    return errors;
  }
  if (event.hook_event_name !== 'PreToolUse') return ['Unsupported security hook event'];
  const input = event.tool_input;
  if (!input || typeof input !== 'object') return ['Missing tool_input'];
  let files = [];
  if (['Write', 'Edit'].includes(event.tool_name)) {
    const file = projectPath(root, input.file_path || input.path);
    if (!file) return ['Missing write path'];
    if (file === '..' || file.startsWith('../') || isAbsolute(file)) return ['Write outside the project cannot be verified'];
    files = [file];
  } else if (['PowerShell', 'Bash'].includes(event.tool_name)) {
    if (typeof input.command !== 'string') return ['Missing shell command'];
    files = shellWriteTargets(root, input.command);
  }
  if (files.some(file => /^(?:\.git(?:\/|$))/i.test(file))) return ['OWNER GIT REQUIRED: agents cannot write Git metadata'];
  const explicitExecutor = role === 'executor';
  const explicitOpus = role === 'orchestrator';
  const enrolled = explicitOpus ? new Set() : registeredWrites(root, files);
  if (!role && files.some(file => isProductPath(file) || policyPath(file) || enrolled.has(file) || /^tasks\/.+\.security\.json$/.test(file))) {
    return ['ROLE UNKNOWN: guarded writes require supported session metadata or the configured executor/orchestrator agent'];
  }
  if (explicitExecutor) for (const file of files.filter(f => /^tasks\/.+\.security\.json$/.test(f))) {
    const errors = executorContractEdit(root, file, event);
    if (errors.length) return errors;
  }
  if (explicitOpus && files.some(isProductPath)) return ['ORCHESTRATOR BOUNDARY: product implementation belongs to the executor'];
  const executionReceipt = text.lastIndexOf('EXECUTION PREFLIGHT COMPLETE');
  const opusReceipt = Math.max(text.lastIndexOf('REVIEW PREFLIGHT COMPLETE'), text.lastIndexOf('TASK-DESIGN PREFLIGHT COMPLETE'));
  if (!explicitOpus && (explicitExecutor || executionReceipt > opusReceipt)
    && files.some(policyPath)) {
    return ['POLICY-EDIT AUTHORITY REQUIRED: Sonnet cannot edit workflow policy or enforcement'];
  }
  files = files.filter(file => isProductPath(file) || enrolled.has(file));
  if (!files.length) return [];
  const receipt = currentReceipt(text);
  let reason = receipt.error || '';
  if (!receipt.error) {
    try {
      safePath(root, receipt.path);
      const contract = readJson(root, receipt.path);
      const errors = validateContract(root, contract, { phase: 'plan' });
      if (contract.stage === 'reviewed') errors.push('Reviewed execution is frozen; Opus must reopen the affected route before another write');
      if (!isTaskDocument(contract.task || '')) errors.push('Execution requires an active task; archived receipts retain review evidence only');
      const outside = files.filter(file => !inScope(root, contract.scope, file));
      if (!errors.length && !outside.length) {
        const required = [...new Set([contract.task, ...workflowRuleInputs(root, contract.rules)])];
        const read = completedReads(root, transcript, required);
        const unread = required.filter(file => !read.includes(file));
        if (!unread.length) return [];
        reason = `${receipt.path}: these task/rule files are not fully read in their current content (a changed file must be read again in full): ${unread.join(', ')}.`;
      } else {
        reason = `${receipt.path}: ${errors.length ? `plan invalid (${errors.join('; ')})` : `outside its scope: ${outside.join(', ')} (Opus amends the contract)`}.`;
      }
    } catch (error) { reason = `${receipt.path}: current contract unavailable or invalid (${error.message}).`; }
  }
  return [`SECURITY TEST CONTRACT MISSING: load a valid saved task contract for these exact paths, then emit SECURITY TASK PREFLIGHT COMPLETE - contract: tasks/<kickoff basename>.security.json. ${reason}`];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let event;
  try {
    event = JSON.parse(readFileSync(0, 'utf8'));
    const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
    const transcript = event.transcript_path ? readFileSync(event.transcript_path, 'utf8') : '';
    const errors = evaluateHook(root, event, transcript);
    if (errors.length) {
      const reason = errors.join('\n');
      if (event.hook_event_name === 'Stop') { console.error(reason); process.exitCode = 2; }
      else console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
    }
  } catch {
    // Malformed input/runtime errors must not turn a guarded write into success. No event contents are logged.
    console.error('SECURITY GATE BLOCKED: hook input or required evidence could not be read.'); process.exitCode = 2;
  }
}

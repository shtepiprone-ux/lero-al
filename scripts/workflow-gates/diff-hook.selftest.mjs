import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { digest, planDigest, scopeDigest, validateContract, REQUIRED_PRODUCT_RULES } from './contract.mjs';
import { validateDiff, validateReceipt, unitEnvironment, integrationTargetErrors } from './cli.mjs';
import { evaluateHook, completedReads } from './security-hook.mjs';

function setup(fn) {
  const root = mkdtempSync(join(tmpdir(), 'lero-diff-hook-'));
  try {
    for (const dir of ['tasks', 'src', '.claude/rules/shared']) mkdirSync(join(root, dir), { recursive: true });
    for (const rule of REQUIRED_PRODUCT_RULES) writeFileSync(join(root, rule), 'Synthetic contract fixture.');
    const task = 'tasks/profile_kickoff.md', path = 'tasks/profile_kickoff.security.json';
    writeFileSync(join(root, task), '## Security test contract\nProfile privacy; same-session recovery.');
    const contract = { version: 1, stage: 'planned', kind: 'product', qaProfile: 'Q4', task, taskSha256: digest(root, [task]),
      scope: ['src/profile.ts'], rules: REQUIRED_PRODUCT_RULES,
      cases: ['frontend', 'server'].flatMap(layer => ['allow', 'deny', 'error'].map(outcome => ({
        id: `SEC-${layer.toUpperCase()}-${outcome.toUpperCase()}`, layer, outcome, invariant: 'Only owner B changes profile B',
        actor: 'Synthetic account A', resource: 'Synthetic account B profile', input: 'Untrusted profile PATCH fields',
        response: 'Supported response with exact public fields', forbiddenEffects: ['No write of account B by A'],
        boundary: 'unit', critical: false, testFile: 'src/profile.test.ts', testName: `[SEC-${layer.toUpperCase()}-${outcome.toUpperCase()}] profile boundary`,
      }))) };
    writeFileSync(join(root, path), JSON.stringify(contract));
    const receipt = `SECURITY TASK PREFLIGHT COMPLETE - contract: ${path}.`;
    const textOnly = text => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } });
    const reads = () => [task, ...contract.rules].flatMap((file, index) => [
      { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', id: `read-${index}`, input: { file_path: file } }] } },
      { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `read-${index}`, content: readFileSync(join(root, file), 'utf8').split('\n').map((line, i) => `${i + 1}→${line}`).join('\n') }] } },
    ]).map(e => JSON.stringify(e)).join('\n');
    const transcript = text => reads() + '\n' + textOnly(text);
    fn({ root, task, path, contract, receipt, transcript, textOnly });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

const reviewPreflight = 'REVIEW PREFLIGHT COMPLETE - loaded: review-task; review/01-preflight; shared/role-boundaries; selected Agent Contract fragments; rule index; QA profile.';
const deferredReview36 = `${reviewPreflight}

Review 36: R108–R109 прийнято
Задача 923 лишається відкритою. Далі за §54 ідуть кроки 5–10, першим R86 разом з R78 (c).
Наступну ревізію готую я. Контракт D8_D9 лишається в draft, поки ревізію не спроєктовано.

git add -- docs/backlog.md tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json
git commit -m "docs(Task923): Review 36 - R108-R109 accepted"

Status: R108–R109 ACCEPTED (Task 923 open)`;

test('Review 36 cannot finish by accepting a stage and deferring the next assigned revision', () => setup(f => {
  const event = { hook_event_name: 'Stop', model: 'opus', last_assistant_message: deferredReview36 };
  assert.match(evaluateHook(f.root, event, f.textOnly(reviewPreflight)).join('\n'), /REVIEW CONTINUATION/);
  // Exercise the registered Node hook process too, including re-entrant Stop and a lagging transcript.
  const transcriptPath = join(f.root, 'review.jsonl');
  writeFileSync(transcriptPath, f.textOnly(reviewPreflight));
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./security-hook.mjs', import.meta.url))], {
    input: JSON.stringify({ ...event, stop_hook_active: true, transcript_path: transcriptPath }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: f.root }, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /REVIEW CONTINUATION/);
}));

test('an open-task review handoff requires a current ready active contract; a corrected later route recovers', () => setup(f => {
  const ready = `Stage accepted; the next assigned route is saved.\nNEXT EXECUTOR CONTRACT: ${f.path}\ngit add -- ${f.task}\ngit commit -m "docs: next route"`;
  const event = { hook_event_name: 'Stop', agent_type: 'orchestrator', last_assistant_message: ready };
  const transcript = f.textOnly(deferredReview36);
  for (const state of ['draft', 'blocked']) {
    writeFileSync(join(f.root, f.path), JSON.stringify({ ...f.contract, executionStatus: state }));
    assert.match(evaluateHook(f.root, event, transcript).join('\n'), /REVIEW CONTINUATION/);
  }
  f.contract.executionStatus = 'ready';
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.deepEqual(evaluateHook(f.root, event, transcript), []);
  writeFileSync(join(f.root, f.task), '## Security test contract\nChanged after route validation.');
  assert.match(evaluateHook(f.root, event, transcript).join('\n'), /Task hash is stale/);
  f.contract.taskSha256 = digest(f.root, [f.task]);
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.deepEqual(evaluateHook(f.root, event, transcript), []);
  writeFileSync(join(f.root, f.path), JSON.stringify({ ...f.contract, stage: 'reviewed' }));
  assert.match(evaluateHook(f.root, event, transcript).join('\n'), /REVIEW CONTINUATION/);
}));

test('review continuation cannot use a quoted, duplicate, missing, archived or sensitive route reference', () => setup(f => {
  f.contract.executionStatus = 'ready';
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  const marker = `NEXT EXECUTOR CONTRACT: ${f.path}`;
  for (const reference of [`\x60\x60\x60text\n${marker}\n\x60\x60\x60`, `> ${marker}`, `${marker}\n${marker}`,
    'NEXT EXECUTOR CONTRACT: tasks/missing.security.json', 'NEXT EXECUTOR CONTRACT: tasks/Archive/old.security.json',
    'NEXT EXECUTOR CONTRACT: tasks/../.env.local', 'NEXT EXECUTOR CONTRACT: tasks/../../outside.security.json']) {
    const event = { hook_event_name: 'Stop', model: 'opus', last_assistant_message: `${reviewPreflight}\n${reference}` };
    assert.match(evaluateHook(f.root, event, '').join('\n'), /REVIEW CONTINUATION/, reference);
  }
}));

test('a genuine blocked review can finish without a speculative route or Git; full approval still needs release proof', () => setup(f => {
  const transcript = f.textOnly(reviewPreflight);
  const stop = last_assistant_message => evaluateHook(f.root, { hook_event_name: 'Stop', model: 'opus', last_assistant_message }, transcript);
  assert.deepEqual(stop('The next stage depends on the unavailable owner apply result.\nBLOCKED'), []);
  assert.ok(stop(`NEXT EXECUTOR CONTRACT: ${f.path}\nBLOCKED`).length);
  assert.match(stop('APPROVED').join('\n'), /receipt|reviewed/i);
  assert.match(stop(`${reviewPreflight}\nStage accepted; next revision later.`).join('\n'), /REVIEW CONTINUATION/);
}));

test('review continuation leaves executor reports, a new task-design phase and owner informational questions alone', () => setup(f => {
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'Stop', model: 'sonnet', last_assistant_message: deferredReview36 }, ''), []);
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'Stop', model: 'opus', last_assistant_message: 'TASK-DESIGN PREFLIGHT COMPLETE\nNew assignment.' }, f.textOnly(reviewPreflight)), []);
  const ownerQuestion = JSON.stringify({ type: 'user', message: { content: [{ type: 'text', text: 'Explain the previous result only.' }] } });
  const transcript = f.textOnly(reviewPreflight) + '\n' + ownerQuestion;
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'Stop', model: 'opus', last_assistant_message: 'The earlier review accepted only that stage.' }, transcript), []);
}));
test('product source changes cannot slip through without an accompanying task contract', () => setup(f => {
  assert.match(validateDiff(f.root, ['src/profile.ts'], { phase: 'plan' }).errors.join('\n'), /changed task security contract/);
  assert.deepEqual(validateDiff(f.root, ['src/profile.ts', f.task, f.path], { phase: 'plan' }).errors, []);
  assert.match(validateDiff(f.root, ['src/unscoped.ts', f.path], { phase: 'plan' }).errors.join('\n'), /outside every/);
}));
test('a modified kickoff requires a matching current sidecar even without a source diff', () => setup(f => {
  rmSync(join(f.root, f.path));
  assert.match(validateDiff(f.root, [f.task], { phase: 'plan' }).errors.join('\n'), /missing/);
}));
test('pre-write blocks missing, stale and wrong-scope contracts; a later valid correction recovers', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', model: 'sonnet', tool_name: 'Edit', tool_input: { file_path: join(f.root, 'src/profile.ts') } };
  assert.ok(evaluateHook(f.root, event, '').length);
  assert.ok(evaluateHook(f.root, event, f.textOnly(f.receipt)).length);
  assert.deepEqual(evaluateHook(f.root, event, f.transcript('Invalid earlier receipt.') + '\n' + f.transcript(f.receipt)), []);
  const other = { ...event, tool_input: { path: 'src/other.ts' } };
  assert.ok(evaluateHook(f.root, other, f.transcript(f.receipt)).length);
  writeFileSync(join(f.root, f.task), '## Security test contract\nRevision needs a new hash.');
  assert.ok(evaluateHook(f.root, event, f.transcript(f.receipt)).length);
  f.contract.taskSha256 = digest(f.root, [f.task]); writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.deepEqual(evaluateHook(f.root, event, f.transcript(f.receipt)), []);
}));
test('a denied write names its failed condition: stale read, out of scope, or no receipt (Task 923 review 9)', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', model: 'sonnet', tool_name: 'Edit', tool_input: { file_path: join(f.root, 'src/profile.ts') } };
  const before = f.transcript(f.receipt);
  // Opus revises the task after the executor's full read; the old read no longer proves the current content.
  writeFileSync(join(f.root, f.task), '## Security test contract\nProfile privacy; same-session recovery.\nRevised by Opus.');
  f.contract.taskSha256 = digest(f.root, [f.task]); writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.match(evaluateHook(f.root, event, before).join('\n'), new RegExp(`not fully read in their current content.*${f.task}`));
  assert.deepEqual(evaluateHook(f.root, event, before + '\n' + f.transcript(f.receipt)), []);
  assert.match(evaluateHook(f.root, { ...event, tool_input: { path: 'src/other.ts' } }, f.transcript(f.receipt)).join('\n'), /outside its scope: src\/other\.ts/);
  assert.match(evaluateHook(f.root, event, '').join('\n'), /No valid receipt/);
}));
test('read-only shell calls, missing optional metadata, malformed and shell writes have explicit outcomes', () => setup(f => {
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git diff -- src/profile.ts' } }, ''), []);
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git diff -- src/profile.ts > evidence.diff' } }, ''), []);
  assert.ok(evaluateHook(f.root, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'echo injected > src/profile.ts' } }, '').length);
  assert.ok(evaluateHook(f.root, { hook_event_name: 'PreToolUse', tool_name: 'Edit' }, '').length);
  assert.ok(evaluateHook(f.root, { hook_event_name: 'PreToolUse', tool_name: 'PowerShell', tool_input: { command: "Set-Content 'src/profile.ts' 'changed'" } }, '').length);
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'Stop', stop_hook_active: true }, f.transcript('BLOCKED')), []);
}));
test('publishing a kickoff is blocked without its security contract, including a repeated stop', () => setup(f => {
  rmSync(join(f.root, f.path));
  const transcript = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', id: 'task-write', input: { file_path: f.task } }, { type: 'text', text: 'Task is ready.' }] } }) + '\n'
    + JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'task-write', content: 'Write succeeded.' }] } });
  assert.match(evaluateHook(f.root, { hook_event_name: 'Stop', stop_hook_active: true }, transcript).join('\n'), /Missing file/);
}));
test('task publication may pass before future tests exist; implementation may not', () => setup(f => {
  assert.deepEqual(validateDiff(f.root, [f.task, f.path], { phase: 'verify' }).errors, []);
  assert.match(validateDiff(f.root, ['src/profile.ts', f.path], { phase: 'verify' }).errors.join('\n'), /implemented|Missing file/);
  assert.ok(evaluateHook(f.root, { hook_event_name: 'Stop' }, f.transcript(f.receipt + '\nIMPLEMENTED - AWAITING ORCHESTRATOR REVIEW')).length);
  assert.ok(evaluateHook(f.root, { hook_event_name: 'Stop' }, f.transcript('APPROVED')).length);
}));
test('only successful complete Read results count, including corrected chunks in the same session', () => setup(f => {
  writeFileSync(join(f.root, f.task), Array.from({ length: 2100 }, (_, i) => `line ${i + 1}`).join('\n'));
  const read = (id, offset, limit, failed = false) => [
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', id, input: { file_path: f.task, offset, limit } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: failed, content: failed ? 'denied' : readFileSync(join(f.root, f.task), 'utf8').split('\n').slice(offset - 1, offset - 1 + limit).map((line, i) => `${offset + i}→${line}`).join('\n') }] } },
  ].map(e => JSON.stringify(e)).join('\n');
  assert.deepEqual(completedReads(f.root, read('failed', 1, 2200, true), [f.task]), []);
  const partial = read('first', 1, 2000);
  assert.deepEqual(completedReads(f.root, partial, [f.task]), []);
  assert.deepEqual(completedReads(f.root, partial + '\n' + read('rest', 2001, 100), [f.task]), [f.task]);
}));
test('Sonnet cannot edit shared policy; an explicit Opus role does not inherit an earlier Sonnet restriction', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: '.claude/settings.json' } };
  assert.match(evaluateHook(f.root, event, '').join('\n'), /POLICY-EDIT AUTHORITY/);
  assert.deepEqual(evaluateHook(f.root, { ...event, model: 'opus' }, f.textOnly('EXECUTION PREFLIGHT COMPLETE')), []);
}));

test('the executor policy boundary covers the paths rejected by task publication', () => setup(f => {
  for (const file of ['scripts/check-locale-leak.mjs', 'scripts/workflow-gates/contract.mjs',
    '.claude/rules/create/03-publication.md', '.github/workflows/governance-pr.yml', 'docs/rules/example.md']) {
    const event = { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: file } };
    assert.match(evaluateHook(f.root, event, '').join('\n'), /POLICY-EDIT AUTHORITY/, file);
    assert.deepEqual(evaluateHook(f.root, { ...event, model: 'opus' }, ''), []);
  }
}));
test('unit execution has no live credentials; real-boundary execution requires exact approved target identity', () => {
  const environment = { PATH: 'synthetic-path', SystemRoot: 'synthetic-windows', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-a-secret',
    DATABASE_URL: 'synthetic-db', AWS_SECRET_ACCESS_KEY: 'synthetic-aws', SECURITY_TEST_TARGET: 'development',
    SECURITY_TEST_PROJECT_REF: 'abcdefghijklmnopqrst', NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co' };
  assert.deepEqual(unitEnvironment(environment), { PATH: 'synthetic-path', SystemRoot: 'synthetic-windows', NODE_ENV: 'test' });
  assert.deepEqual(integrationTargetErrors(environment), []);
  assert.ok(integrationTargetErrors({ ...environment, SECURITY_TEST_TARGET: 'production' }).length);
  assert.ok(integrationTargetErrors({ ...environment, NEXT_PUBLIC_SUPABASE_URL: 'https://unapproved.supabase.co' }).length);
});
test('a task cannot bypass contract validation by omitting kickoff from its name', () => setup(f => {
  const task = 'tasks/profile_security_plan.md'; writeFileSync(join(f.root, task), 'A new active task.');
  assert.match(validateDiff(f.root, [task], { phase: 'plan' }).errors.join('\n'), /missing/);
}));
test('direct Git metadata writes require the owner even for Opus', () => setup(f => {
  assert.match(evaluateHook(f.root, { hook_event_name: 'PreToolUse', tool_name: 'Write', model: 'opus',
    tool_input: { file_path: '.git/config' } }, '').join('\n'), /OWNER GIT REQUIRED/);
}));
test('Stop uses the current API message even when the asynchronously written transcript is stale', () => setup(f => {
  assert.ok(evaluateHook(f.root, { hook_event_name: 'Stop', last_assistant_message: 'APPROVED' }, f.textOnly('BLOCKED')).length);
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'Stop', last_assistant_message: 'BLOCKED' }, f.textOnly('APPROVED')), []);
}));

test('a separate Q0 task can accompany a product task without waiving its security contract', () => setup(f => {
  const task = 'tasks/rules_cleanup.md', sidecar = 'tasks/rules_cleanup.security.json';
  writeFileSync(join(f.root, task), '## Security test contract\nRule links only.');
  writeFileSync(join(f.root, sidecar), JSON.stringify({ version: 1, stage: 'planned', kind: 'docs', qaProfile: 'Q0', task,
    taskSha256: digest(f.root, [task]), scope: ['.claude/rules/shared/security-testing.md'], rules: REQUIRED_PRODUCT_RULES,
    cases: [], notApplicable: 'Only rule links; no executable or product behavior changes.' }));
  assert.deepEqual(validateDiff(f.root, ['src/profile.ts', f.task, f.path, task, sidecar], { phase: 'plan' }).errors, []);
}));

test('a successful Read with truncated content is not proof of full-file coverage', () => setup(f => {
  const transcript = [
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'read', name: 'Read', input: { file_path: f.task, limit: 2000 } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'read', content: '     1→## Security test contract\n[output truncated]' }] } },
  ].map(e => JSON.stringify(e)).join('\n');
  assert.deepEqual(completedReads(f.root, transcript, [f.task]), []);
}));

test('an unsuccessful task write does not create a publication obligation', () => setup(f => {
  const transcript = [
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'write', name: 'Write', input: { file_path: 'tasks/never_written.md' } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'write', is_error: true, content: 'denied' }] } },
  ].map(e => JSON.stringify(e)).join('\n');
  writeFileSync(join(f.root, 'tasks/never_written.md'), 'Pre-existing owner task, unchanged by this session.');
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'Stop', last_assistant_message: 'Read-only audit in progress.' }, transcript), []);
}));

test('Sonnet may record implementation but cannot rewrite or approve its own planned expectations', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', model: 'sonnet', tool_name: 'Write', tool_input: { file_path: f.path, content: JSON.stringify({ ...f.contract, stage: 'implemented' }) } };
  assert.deepEqual(evaluateHook(f.root, event, ''), []);
  const weakened = structuredClone(f.contract); weakened.cases = [];
  assert.match(evaluateHook(f.root, { ...event, tool_input: { ...event.tool_input, content: JSON.stringify(weakened) } }, '').join('\n'), /planned expectations|contract authority/i);
  assert.match(evaluateHook(f.root, { ...event, tool_input: { ...event.tool_input, content: JSON.stringify({ ...f.contract, stage: 'reviewed' }) } }, '').join('\n'), /review|authority/i);
}));

test('a fully read draft remains unwritable until Opus publishes it; Sonnet cannot promote it', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Edit', tool_input: { file_path: 'src/profile.ts' } };
  f.contract.executionStatus = 'draft';
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.match(evaluateHook(f.root, event, f.transcript(f.receipt)).join('\n'), /execution.*ready/i);
  const promoted = { ...f.contract, executionStatus: 'ready' };
  assert.match(evaluateHook(f.root, { ...event, tool_name: 'Write', tool_input: { file_path: f.path, content: JSON.stringify(promoted) } }, '').join('\n'), /authority|planned expectations/i);
  const omitted = { ...f.contract }; delete omitted.executionStatus;
  assert.match(evaluateHook(f.root, { ...event, tool_name: 'Write', tool_input: { file_path: f.path, content: JSON.stringify(omitted) } }, '').join('\n'), /authority|planned expectations/i);
  writeFileSync(join(f.root, f.path), JSON.stringify(promoted));
  assert.deepEqual(evaluateHook(f.root, event, f.transcript(f.receipt)), []);
}));

test('the newest task receipt replaces older write authority, including a blocked or missing replacement', () => setup(f => {
  const nextTask = 'tasks/replacement_kickoff.md', nextPath = 'tasks/replacement_kickoff.security.json';
  writeFileSync(join(f.root, nextTask), '## Security test contract\nReplacement route.');
  const next = { ...f.contract, task: nextTask, taskSha256: digest(f.root, [nextTask]), scope: ['src/other.ts'] };
  writeFileSync(join(f.root, nextPath), JSON.stringify(next));
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Edit', tool_input: { file_path: 'src/profile.ts' } };
  const original = f.transcript(f.receipt);
  const selected = `${original}\n${f.textOnly(`SECURITY TASK PREFLIGHT COMPLETE - contract: ${nextPath}.`)}`;
  assert.match(evaluateHook(f.root, event, selected).join('\n'), /outside its scope/);
  next.scope = [...f.contract.scope]; next.executionStatus = 'blocked';
  writeFileSync(join(f.root, nextPath), JSON.stringify(next));
  assert.match(evaluateHook(f.root, event, selected).join('\n'), /execution.*ready/i);
  rmSync(join(f.root, nextPath));
  assert.ok(evaluateHook(f.root, event, selected).length);
  assert.ok(evaluateHook(f.root, event, original + '\n' + f.textOnly('SECURITY TASK PREFLIGHT COMPLETE - contract: not-a-sidecar')).length);
  assert.deepEqual(evaluateHook(f.root, event, selected + '\n' + f.transcript(f.receipt)), []);
}));

test('visible and durable task receipts select the current contract in transcript order', () => setup(f => {
  const path = 'tasks/replacement_kickoff.security.json';
  writeFileSync(join(f.root, path), JSON.stringify({ ...f.contract, scope: ['src/other.ts'] }));
  const durable = id => [
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'PowerShell', id, input: { command: `node scripts/workflow-gates/cli.mjs receipt --contract ${f.path}` } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: f.receipt }] } },
  ].map(event => JSON.stringify(event)).join('\n');
  const selected = f.transcript('Required reads.') + '\n' + durable('earlier') + '\n'
    + f.textOnly(`SECURITY TASK PREFLIGHT COMPLETE - contract: ${path}.`);
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Edit', tool_input: { file_path: 'src/profile.ts' } };
  assert.match(evaluateHook(f.root, event, selected).join('\n'), /outside its scope/);
  assert.deepEqual(evaluateHook(f.root, event, selected + '\n' + durable('corrected')), []);
}));

test('registered helper and documentation scope obeys draft readiness, reads and the current receipt', () => setup(f => {
  const helper = 'scripts/product-helper.mjs';
  f.contract.scope.push(helper); f.contract.executionStatus = 'draft';
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Edit', tool_input: { file_path: helper } };
  assert.ok(evaluateHook(f.root, event, '').length, 'an enrolled helper needs a receipt');
  assert.match(evaluateHook(f.root, event, f.transcript(f.receipt)).join('\n'), /execution.*ready/i);
  f.contract.executionStatus = 'ready'; writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.ok(evaluateHook(f.root, event, f.textOnly(f.receipt)).length, 'a helper requires full reads');
  assert.deepEqual(evaluateHook(f.root, event, f.transcript(f.receipt)), []);
  f.contract.kind = 'docs'; f.contract.qaProfile = 'Q0'; f.contract.cases = [];
  f.contract.scope = ['docs/instructions.md']; f.contract.executionStatus = 'draft';
  f.contract.notApplicable = 'Documentation text only without executable changes or runtime claims.';
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  const doc = { ...event, tool_input: { file_path: 'docs/instructions.md' } };
  assert.match(evaluateHook(f.root, doc, f.transcript(f.receipt)).join('\n'), /execution.*ready/i);
  const shellDoc = { ...doc, tool_name: 'PowerShell', tool_input: { command: "Set-Content 'docs/instructions.md' 'synthetic'" } };
  assert.match(evaluateHook(f.root, shellDoc, f.transcript(f.receipt)).join('\n'), /execution.*ready/i);
  f.contract.executionStatus = 'ready'; writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.deepEqual(evaluateHook(f.root, doc, f.transcript(f.receipt)), []);
  assert.deepEqual(evaluateHook(f.root, shellDoc, f.transcript(f.receipt)), []);
}));

test('unregistered executable helpers require a scoped plan and belong to the executor', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Edit', tool_input: { file_path: 'scripts/product-helper.mjs' } };
  assert.ok(evaluateHook(f.root, event, '').length, 'a helper cannot avoid preflight by missing from every scope');
  assert.match(evaluateHook(f.root, event, f.transcript(f.receipt)).join('\n'), /outside its scope/);
  assert.match(evaluateHook(f.root, { ...event, agent_type: 'orchestrator' }, '').join('\n'), /ORCHESTRATOR BOUNDARY/);
  f.contract.scope.push('scripts/product-helper.mjs');
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.deepEqual(evaluateHook(f.root, event, f.transcript(f.receipt)), []);
  assert.match(validateDiff(f.root, ['scripts/unscoped-helper.mjs', f.path], { phase: 'plan' }).errors.join('\n'), /outside every/);
}));

test('recognized literal helper writes through Bash and PowerShell obey the same boundary as Write/Edit', () => setup(f => {
  for (const [tool_name, command] of [
    ['PowerShell', "Set-Content 'scripts/product-helper.mjs' 'synthetic'"],
    ['PowerShell', "Set-Content 'scripts/product-helper.py' 'synthetic'"],
    ['Bash', `node -e "require('fs').writeFileSync('scripts/product-helper.mjs', 'synthetic')"`],
  ]) {
    const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name, tool_input: { command } };
    assert.ok(evaluateHook(f.root, event, '').length, command);
    assert.match(evaluateHook(f.root, event, f.transcript(f.receipt)).join('\n'), /outside its scope/);
  }
  const policy = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'PowerShell', tool_input: { command: "Set-Content 'scripts/check-example.mjs' 'synthetic'" } };
  assert.match(evaluateHook(f.root, policy, '').join('\n'), /POLICY-EDIT AUTHORITY/);
  assert.deepEqual(evaluateHook(f.root, { ...policy, agent_type: 'orchestrator' }, ''), []);
  assert.deepEqual(evaluateHook(f.root, { ...policy, tool_input: { command: 'Get-Content scripts/product-helper.mjs' } }, ''), []);
}));

test('reviewed execution stays frozen until Opus reopens and readies the affected route', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Edit', tool_input: { file_path: 'src/profile.ts' } };
  f.contract.stage = 'reviewed'; f.contract.executionStatus = 'ready';
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.match(evaluateHook(f.root, event, f.transcript(f.receipt)).join('\n'), /reviewed.*reopen/i);
  const reopened = { ...f.contract, stage: 'implemented', executionStatus: 'draft' };
  assert.match(evaluateHook(f.root, { ...event, tool_name: 'Write', tool_input: { file_path: f.path, content: JSON.stringify(reopened) } }, '').join('\n'), /authority/i);
  Object.assign(f.contract, reopened); writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.match(evaluateHook(f.root, event, f.transcript(f.receipt)).join('\n'), /execution.*ready/i);
  f.contract.executionStatus = 'ready'; writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.deepEqual(evaluateHook(f.root, event, f.transcript(f.receipt)), []);
}));

test('permission and evidence lifecycle: draft, execution, stale proof, reviewed closure and archived refusal', () => setup(f => {
  // Synthetic report fixtures exercise authorization/binding, not actual application tests or a model's reasoning.
  f.contract.scope.push('scripts/product-helper.mjs', 'src/profile.test.ts');
  f.contract.report = 'evidence/report.json'; f.contract.executionStatus = 'draft';
  const save = path => writeFileSync(join(f.root, path || f.path), JSON.stringify(f.contract));
  const edit = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Edit', tool_input: { file_path: 'scripts/product-helper.mjs' } };
  const stop = (status, transcript) => evaluateHook(f.root, { hook_event_name: 'Stop', agent_type: 'orchestrator', last_assistant_message: status }, transcript);
  save();
  assert.ok(evaluateHook(f.root, edit, f.transcript(f.receipt)).length);
  f.contract.executionStatus = 'ready'; save();
  assert.deepEqual(validateReceipt(f.root, f.contract), []);
  assert.deepEqual(evaluateHook(f.root, edit, f.transcript(f.receipt)), []);
  mkdirSync(join(f.root, 'scripts')); mkdirSync(join(f.root, 'evidence'));
  for (const file of f.contract.scope) writeFileSync(join(f.root, file), 'Synthetic implemented file.');
  f.contract.stage = 'implemented'; save();
  assert.ok(stop('IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW', f.transcript(f.receipt)).length, 'missing report blocks completion');
  const retainReport = () => writeFileSync(join(f.root, f.contract.report), JSON.stringify({
    version: 1, status: 'passed', contractSha256: planDigest(f.root, f.contract), scopeSha256: scopeDigest(f.root, f.contract),
    errors: [], vulnerabilities: [], cleanup: { verified: true, remaining: 0, errors: [] },
    cases: f.contract.cases.map(row => ({ id: row.id, status: 'passed', assertionCount: 1 })),
  }));
  retainReport();
  assert.deepEqual(stop('IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW', f.transcript(f.receipt)), []);
  assert.ok(stop('APPROVED', f.transcript(f.receipt)).length, 'implementation cannot approve itself');
  writeFileSync(join(f.root, 'scripts/product-helper.mjs'), 'Changed after the retained proof.');
  assert.ok(stop('IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW', f.transcript(f.receipt)).length);
  retainReport();
  f.contract.stage = 'reviewed';
  writeFileSync(join(f.root, 'evidence/review.md'), 'Synthetic independent review artifact.');
  const bindReview = () => { f.contract.review = { role: 'Opus', decision: 'APPROVED', evidence: 'evidence/review.md',
    evidenceSha256: digest(f.root, ['evidence/review.md']), scopeSha256: scopeDigest(f.root, f.contract),
    reportSha256: digest(f.root, [f.contract.report]) }; };
  bindReview(); save();
  const history = f.transcript(f.receipt);
  assert.deepEqual(stop('APPROVED', history), []);
  assert.match(evaluateHook(f.root, edit, history).join('\n'), /reviewed.*reopen/i);
  mkdirSync(join(f.root, 'tasks/Archive'));
  const task = 'tasks/Archive/profile_kickoff.md', path = 'tasks/Archive/profile_kickoff.security.json';
  renameSync(join(f.root, f.task), join(f.root, task));
  renameSync(join(f.root, f.path), join(f.root, path));
  f.contract.task = task; f.contract.taskSha256 = digest(f.root, [task]);
  retainReport(); bindReview(); save(path);
  assert.deepEqual(validateReceipt(f.root, f.contract), []);
  const archived = history + '\n' + f.textOnly(`SECURITY TASK PREFLIGHT COMPLETE - contract: ${path}.`);
  assert.deepEqual(stop('APPROVED', archived), []);
  assert.match(evaluateHook(f.root, edit, archived).join('\n'), /active task/);
  assert.match(validateContract(f.root, f.contract, { phase: 'plan' }).join('\n'), /active task/);
}));

test('Node Stop treats BLOCKED as the terminal status and rejects a mixed handoff', () => setup(f => {
  const stop = text => evaluateHook(f.root, { hook_event_name: 'Stop', agent_type: 'orchestrator', last_assistant_message: text }, '');
  assert.ok(stop('git.exe add -- tasks/example.md\nBLOCKED').length);
  assert.deepEqual(stop('The previous result was APPROVED; current correction lacks evidence.\nBLOCKED'), []);
}));

test('Node Stop checks all text blocks of the final message without retaining earlier verdicts', () => setup(f => {
  const message = texts => JSON.stringify({ type: 'assistant', message: { content: texts.map(text => ({ type: 'text', text })) } });
  const stop = { hook_event_name: 'Stop', agent_type: 'orchestrator' };
  assert.ok(evaluateHook(f.root, stop, message(['APPROVED', 'BLOCKED'])).length);
  assert.deepEqual(evaluateHook(f.root, stop, message(['APPROVED']) + '\n' + message(['Evidence missing.', 'BLOCKED'])), []);
  assert.deepEqual(evaluateHook(f.root, { ...stop, last_assistant_message: 'Evidence missing.\nBLOCKED' }, message(['APPROVED', 'BLOCKED'])), []);
}));

test('a successful durable receipt tool result authorizes the same verified plan as visible prose', () => setup(f => {
  const transcript = f.transcript('Preflight reads completed.') + '\n' + [
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'receipt', name: 'PowerShell', input: { command: `node scripts/workflow-gates/cli.mjs receipt --contract ${f.path}` } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'receipt', content: f.receipt }] } },
  ].map(e => JSON.stringify(e)).join('\n');
  assert.deepEqual(evaluateHook(f.root, { hook_event_name: 'PreToolUse', model: 'sonnet', tool_name: 'Edit', tool_input: { file_path: 'src/profile.ts' } }, transcript), []);
}));

test('changed required text invalidates old Read evidence until that text is read again', () => setup(f => {
  const old = f.transcript(f.receipt);
  writeFileSync(join(f.root, '.claude/rules/shared/security-testing.md'), 'Changed owner security requirement.');
  const event = { hook_event_name: 'PreToolUse', model: 'sonnet', tool_name: 'Edit', tool_input: { file_path: 'src/profile.ts' } };
  assert.ok(evaluateHook(f.root, event, old).length);
  assert.deepEqual(evaluateHook(f.root, event, f.transcript(f.receipt)), []);
}));

test('unknown authority cannot use a receipt to write product or policy, while read-only calls remain usable', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: 'src/profile.ts' } };
  assert.match(evaluateHook(f.root, event, f.transcript(f.receipt)).join('\n'), /ROLE.*UNKNOWN|unknown authority/i);
  assert.match(evaluateHook(f.root, { ...event, tool_input: { file_path: '.claude/settings.json' } }, '').join('\n'), /ROLE.*UNKNOWN|unknown authority/i);
}));

test('a move out of product scope still requires authorization for the removed production path', () => setup(f => {
  f.contract.scope = ['scripts/moved.ts']; f.contract.inputs = ['src/profile.ts'];
  writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  const files = ['src/profile.ts', 'scripts/moved.ts', f.task, f.path];
  assert.match(validateDiff(f.root, files, { phase: 'plan' }).errors.join('\n'), /src\/profile.ts: outside every/);
  f.contract.scope.push('src/profile.ts'); writeFileSync(join(f.root, f.path), JSON.stringify(f.contract));
  assert.deepEqual(validateDiff(f.root, files, { phase: 'plan' }).errors, []);
}));

test('Windows casing cannot hide Git metadata and writes on a different drive stay outside scope', () => setup(f => {
  const event = { hook_event_name: 'PreToolUse', model: 'opus', tool_name: 'Write', tool_input: { file_path: '.GIT/config' } };
  assert.match(evaluateHook(f.root, event, '').join('\n'), /OWNER GIT REQUIRED/);
  if (process.platform === 'win32') {
    assert.match(evaluateHook(f.root, { ...event, tool_input: { file_path: 'Z:\\outside-audit\\profile.ts' } }, '').join('\n'), /outside the project/);
  }
}));

test('a junction alias cannot hide a future product write from preflight', () => setup(f => {
  symlinkSync(join(f.root, 'src'), join(f.root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  const event = { hook_event_name: 'PreToolUse', model: 'sonnet', tool_name: 'Write', tool_input: { file_path: 'linked/profile.ts' } };
  assert.ok(evaluateHook(f.root, event, '').length);
  assert.deepEqual(evaluateHook(f.root, event, f.transcript(f.receipt)), []);
}));

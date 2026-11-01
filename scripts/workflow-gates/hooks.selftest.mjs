import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const hook = resolve('.claude/hooks/orchestrator-response-gate.ps1');
function run(event, texts, { backlogExit = 0, missingBacklog = false, writes = ['.claude/rules/shared/example.md'], dirtyPath = '.claude/rules/shared/example.md', cleanStatus = false, gitExit = 0 } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'lero-stop-'));
  try {
    mkdirSync(join(root, 'scripts'));
    if (!missingBacklog) writeFileSync(join(root, 'scripts/check-backlog-active.mjs'), `process.exit(${backlogExit});`);
    const transcript = join(root, 'transcript.jsonl');
    const writeEvents = writes.flatMap((file, i) => [
      { type: 'assistant', message: { content: [{ type: 'tool_use', id: `write-${i}`, name: 'Write', input: { file_path: file } }] } },
      { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: `write-${i}`, content: 'Synthetic completed write.' }] } },
    ]);
    writeFileSync(transcript, [...writeEvents, ...texts.map(text => ({ type: 'assistant', message: { content: (Array.isArray(text) ? text : [text]).map(text => ({ type: 'text', text })) } }))].map(e => JSON.stringify(e)).join('\n'));
    // Stub read-only dependencies, not the hook being tested. No Git mutation and no real backlog is touched.
    const psPath = dirtyPath.replaceAll("'", "''");
    writeFileSync(join(root, 'invoke.ps1'), `param([string]$Hook)\nfunction global:git { $global:LASTEXITCODE = ${gitExit}; if ($args -contains 'status' -and $${cleanStatus ? 'false' : 'true'}) { if ($args -contains '-z') { ' M ${psPath}' + [char]0 } else { ' M "${psPath}"' } } }\n& $Hook\nexit $LASTEXITCODE\n`);
    return spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', join(root, 'invoke.ps1'), '-Hook', hook], {
      input: JSON.stringify({ transcript_path: transcript, ...event }), encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: root }, timeout: 15000,
    });
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const windows = process.platform === 'win32';
test('PS 5.1: stop_hook_active cannot bypass a still-invalid Opus handoff', { skip: !windows }, () => {
  const result = run({ model: 'opus', stop_hook_active: true }, ['TASK-DESIGN PREFLIGHT COMPLETE', 'Ready to implement.']);
  assert.equal(result.status, 2, result.stderr || result.error?.message);
});
test('PS 5.1: a corrected later handoff recovers in the same transcript', { skip: !windows }, () => {
  const result = run({ stop_hook_active: true }, ['TASK-DESIGN PREFLIGHT COMPLETE', 'Malformed earlier response.', 'git add -- .claude/rules/shared/example.md\ngit commit -m "docs: example"']);
  assert.equal(result.status, 0, result.stderr);
});
test('PS 5.1: a checker runtime error and missing checker fail closed', { skip: !windows }, () => {
  for (const options of [{ backlogExit: 2 }, { missingBacklog: true }]) {
    const result = run({ model: 'opus' }, ['git add -- .claude/rules/shared/example.md'], options);
    assert.equal(result.status, 2, result.stderr);
  }
});
test('PS 5.1: optional event fields and Sonnet require no prohibited Git handoff', { skip: !windows }, () => {
  assert.equal(run({}, ['An ordinary non-orchestration reply.']).status, 0);
  assert.equal(run({ model: 'sonnet' }, ['Implementation blocked.']).status, 0);
});
test('PowerShell hooks remain ASCII for Windows PowerShell 5.1', () => {
  for (const name of ['phase-write-gate', 'orchestrator-response-gate', 'block-mutating-git', 'phase-receipt-contract', 'emit-phase-receipt', 'session-role', 'orchestrator-router', 'sonnet-executor-bootstrap']) {
    assert.equal([...readFileSync(`.claude/hooks/${name}.ps1`)].some(b => b > 127), false, name);
  }
});
test('PS 5.1: unrelated dirty files do not demand a handoff from a read-only Opus audit', { skip: !windows }, () => {
  const result = run({ model: 'opus' }, ['Review in progress; no files changed in this session.'], { writes: [] });
  assert.equal(result.status, 0, result.stderr);
});
test('PS 5.1: quoted/space-containing paths cannot bypass an owned-write handoff', { skip: !windows }, () => {
  const path = '.claude/rules/shared/file with spaces.md';
  const result = run({ model: 'opus' }, ['Task design ready.'], { writes: [path], dirtyPath: path });
  assert.equal(result.status, 2, result.stderr);
});
test('PS 5.1: owner commit handoffs cannot override the author identity', { skip: !windows }, () => {
  const result = run({ model: 'opus' }, ['git add -- .claude/rules/shared/example.md\ngit commit --author "Synthetic Owner" -m "docs: example"']);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(run({ model: 'opus' }, ['git add -- .claude/rules/shared/example.md\ngit commit -m "docs: example"\nThe --author option is forbidden.']).status, 0);
});
test('PS 5.1: stale transcript cannot allow the current invalid response or block its valid correction', { skip: !windows }, () => {
  const valid = 'git add -- .claude/rules/shared/example.md\ngit commit -m "docs: example"';
  assert.equal(run({ agent_type: 'orchestrator', last_assistant_message: 'Ready without handoff.' }, [valid]).status, 2);
  assert.equal(run({ agent_type: 'orchestrator', last_assistant_message: valid }, ['Ready without handoff.']).status, 0);
});

test('PS 5.1: an evidenced finding may report a blocked correction without publishing a speculative handoff', { skip: !windows }, () => {
  const blocked = 'NEEDS REVISION\nCorrection route not ready: missing command input.\nBLOCKED';
  assert.equal(run({ agent_type: 'orchestrator', last_assistant_message: blocked }, ['TASK-DESIGN PREFLIGHT COMPLETE']).status, 0);
  assert.equal(run({ agent_type: 'orchestrator', last_assistant_message: blocked }, ['git add -- .claude/rules/shared/example.md']).status, 0);
  const handoff = 'git add -- .claude/rules/shared/example.md\ngit commit -m "docs: corrected route"';
  assert.equal(run({ agent_type: 'orchestrator', last_assistant_message: handoff }, [blocked]).status, 0);
});

test('PS 5.1: BLOCKED cannot accompany approval or a Git handoff', { skip: !windows }, () => {
  for (const final of [
    'APPROVED\nBLOCKED',
    'git add -- .claude/rules/shared/example.md\ngit commit -m "docs: unverified route"\nBLOCKED',
    'git push origin main\nBLOCKED',
    'IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW\nBLOCKED',
  ]) assert.equal(run({ agent_type: 'orchestrator', last_assistant_message: final }, []).status, 2, final);
});

test('PS 5.1: an incomplete report needs neither a healthy backlog checker nor available Git', { skip: !windows }, () => {
  for (const options of [{ missingBacklog: true, cleanStatus: true }, { gitExit: 1 }]) {
    const result = run({ agent_type: 'orchestrator', last_assistant_message: 'Missing verification inputs.\nBLOCKED' }, [], options);
    assert.equal(result.status, 0, result.stderr);
  }
});

test('PS 5.1: terminal status is checked before ownership shortcuts; quoted or earlier BLOCKED is not a stop', { skip: !windows }, () => {
  const event = { agent_type: 'orchestrator' };
  assert.equal(run({ ...event, last_assistant_message: 'git.exe add -- tasks/example.md\nBLOCKED' }, [], { writes: [], cleanStatus: true }).status, 2);
  assert.equal(run({ ...event, last_assistant_message: '```text\nBLOCKED\n```\nReady without the required handoff.' }, []).status, 2);
  assert.equal(run({ ...event, last_assistant_message: 'Previous result was APPROVED; current evidence is missing.\nBLOCKED' }, []).status, 0);
});

test('PS 5.1: the final transcript message includes every text block and supersedes earlier verdicts', { skip: !windows }, () => {
  const event = { agent_type: 'orchestrator' };
  assert.equal(run(event, [['APPROVED', 'BLOCKED']]).status, 2);
  assert.equal(run(event, ['APPROVED', ['Evidence missing.', 'BLOCKED']]).status, 0);
});

test('incident: an APPROVED response cannot offer an untested push even with no owned writes', { skip: !windows }, () => {
  const response = 'APPROVED\n```powershell\ngit push origin main\n```';
  for (const event of [{ model: 'opus' }, {}, { model: 'sonnet' }, { stop_hook_active: true }]) {
    const result = run({ ...event, last_assistant_message: response }, [], { writes: [], cleanStatus: true });
    assert.equal(result.status, 2, result.stderr || 'Untested push escaped through a role/ownership shortcut');
  }
});

test('incident recovery: a later factual blocked reply needs no push evidence or new session', { skip: !windows }, () => {
  const result = run({ last_assistant_message: 'Local verification is incomplete.\nBLOCKED', stop_hook_active: true },
    ['APPROVED\ngit push origin main'], { writes: [], cleanStatus: true });
  assert.equal(result.status, 0, result.stderr);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { blockedResponse } from './response-state.mjs';

test('only an actual final plain BLOCKED line selects the incomplete-report path', () => {
  for (const text of ['Evidence missing.\nBLOCKED', 'Evidence missing.\r\nBLOCKED\r\n \r\n']) {
    assert.deepEqual(blockedResponse(text), { isBlocked: true, errors: [] });
  }
  for (const text of [null, '', '> BLOCKED', '**BLOCKED**', 'BLOCKED\nReady now.',
    '```text\nBLOCKED\n```', '```text\nBLOCKED', '~~~~text\n```\nBLOCKED\n~~~~',
    '```text\nBLOCKED\n```\nFinal report lacks evidence.']) {
    assert.equal(blockedResponse(text).isBlocked, false, String(text));
  }
});

test('incomplete reports distinguish historical verdict mentions from contradictory terminal statuses', () => {
  for (const text of ['The previous result was APPROVED.\nBLOCKED',
    '```text\nAPPROVED\n```\nCurrent evidence missing.\nBLOCKED',
    'git status --short\nBLOCKED']) assert.deepEqual(blockedResponse(text), { isBlocked: true, errors: [] });
  for (const status of ['APPROVED', 'APPROVED WITH NOTES', 'IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW']) {
    assert.equal(blockedResponse(`${status}\nBLOCKED`).errors.length, 1, status);
  }
});

test('a blocked response cannot carry canonical Git write handoffs including native PowerShell invocation', () => {
  for (const command of ['git add -- tasks/example.md', 'git.exe commit -m "task ready"',
    'git -C . push origin main', '& git.exe add -- tasks/example.md',
    '& "git.exe" commit -m "task ready"', "& 'git' push origin main",
    'git.exe `\r\n  add -- tasks/example.md']) {
    const result = blockedResponse(`Evidence missing.\n\n\x60\x60\x60powershell\n${command}\n\x60\x60\x60\nBLOCKED`);
    assert.equal(result.isBlocked, true, command);
    assert.equal(result.errors.length, 1, command);
  }
});

test('the PowerShell-facing classifier accepts BOM JSON and fails closed without echoing malformed input', () => {
  const script = fileURLToPath(new URL('./response-state.mjs', import.meta.url));
  const run = input => spawnSync(process.execPath, [script], { input, encoding: 'utf8', timeout: 10000 });
  const valid = run('\uFEFF' + JSON.stringify({ text: 'Evidence missing.\r\nBLOCKED' }));
  assert.equal(valid.status, 0, valid.stderr);
  assert.deepEqual(JSON.parse(valid.stdout), { isBlocked: true, errors: [] });
  for (const input of ['untrusted-private-marker', '{}', '{"text":null}']) {
    const result = run(input);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.doesNotMatch(result.stderr, /untrusted-private-marker/);
  }
});

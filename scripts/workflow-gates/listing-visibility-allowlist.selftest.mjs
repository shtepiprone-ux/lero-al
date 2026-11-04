#!/usr/bin/env node
// Task 942 R1-R3: the listing-visibility gate allowlist matches the reviewed contact-event rule, an entry stays pinned to its own
// file, a stale or unreadable entry is reported, and only Opus may change the gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWLIST, detectVisibilityViolations, staleAllowlistEntries } from '../check-listing-visibility.mjs';
import { evaluateHook } from './security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const GATE = 'scripts/check-listing-visibility.mjs';
const CONTACT_EVENTS = 'src/modules/listings/actions/contactEvents.ts';
const DETAIL_PAGE = 'src/app/[locale]/listings/[slug]/page.tsx';
const FINGERPRINT = ".eq('status', 'active')";
const OLD_CONTACT_FINGERPRINT = ".in('status', ['active', 'sold', 'rented', 'archived'])";
const SOURCE = ['const { data } = await db', "  .from('listings')", "  .select('id')", "  .eq('id', id)", `  ${FINGERPRINT}`, '  .maybeSingle()'].join('\n');
const repositoryFile = path => readFileSync(join(ROOT, path), 'utf8');

test('[GOV-942-CI-GATE-ALLOW] The listing-visibility gate passes on the current tree with every allowlist entry matching a real hit', () => {
  const gate = spawnSync(process.execPath, [GATE], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  assert.equal(gate.error, undefined);
  assert.equal(gate.status, 0, gate.stderr);
  assert.match(gate.stdout, /PASSED — 0 violations\./);
  assert.match(gate.stdout, /Allowlist: 8 entries, 0 stale\./);
  assert.equal(ALLOWLIST.length, 8);
  // AC4: importing the module prints nothing and leaves the process running, with another file as the entry point in argv[1];
  // the file parses on its own.
  const url = new URL(`../../${GATE}`, import.meta.url).href;
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(url)}); console.log('still running');`, 'another-entry.mjs'],
    { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout.replace(/\r\n/g, '\n'), 'still running\n');
  assert.equal(imported.stderr, '');
  assert.equal(spawnSync(process.execPath, ['--check', GATE], { cwd: ROOT, timeout: 60000 }).status, 0);
});

test('[GOV-942-CI-PATH-DENY] An allowlist entry permits its literal only in its own file; the same literal anywhere else is reported', () => {
  assert.deepEqual(detectVisibilityViolations(SOURCE, CONTACT_EVENTS), []);
  for (const path of ['src/modules/listings/actions/otherAction.ts', DETAIL_PAGE]) {
    const violations = detectVisibilityViolations(SOURCE, path);
    assert.equal(violations.length, 1, `one violation for ${path}`);
    assert.equal(violations[0].line, 5, `line 5 for ${path}`);
    assert.equal(violations[0].text, FINGERPRINT);
  }
  assert.deepEqual(ALLOWLIST.filter(entry => entry.path === DETAIL_PAGE), []);
  const contactEntries = ALLOWLIST.filter(entry => entry.path === CONTACT_EVENTS);
  assert.equal(contactEntries.length, 1);
  assert.equal(contactEntries[0].fingerprint, FINGERPRINT);
});

test('[GOV-942-CI-STALE-ERROR] An allowlist entry that matches no real listings-query hit, or whose source cannot be read, is reported stale', () => {
  const old = { path: CONTACT_EVENTS, fingerprint: OLD_CONTACT_FINGERPRINT, reason: 'the old contact-event entry' };
  assert.deepEqual(staleAllowlistEntries([...ALLOWLIST, old], repositoryFile), [old]);
  const missing = { path: 'missing.ts', fingerprint: FINGERPRINT };
  const failing = { path: 'failing.ts', fingerprint: FINGERPRINT };
  const outside = { path: 'outside.ts', fingerprint: FINGERPRINT };
  const inside = { path: 'inside.ts', fingerprint: FINGERPRINT };
  // The file has a listings block; the fingerprint sits only in the query of another table.
  const sources = { 'outside.ts': `const q = supabase.from('profiles').select('id')\n  ${FINGERPRINT}\n\nconst r = supabase.from('listings').select('id')\n`, 'inside.ts': SOURCE };
  const reader = path => {
    if (path === 'failing.ts') throw new Error('unreadable');
    return sources[path] ?? null;
  };
  // Input order, and a matching entry between them stays out.
  assert.deepEqual(staleAllowlistEntries([missing, inside, failing, outside], reader), [missing, failing, outside]);
  assert.deepEqual(staleAllowlistEntries([{ path: 'number.ts', fingerprint: FINGERPRINT }], () => 42), [{ path: 'number.ts', fingerprint: FINGERPRINT }]);
});

test('[GOV-942-HOOK-EXECUTOR-DENY] Only Opus may change the listing-visibility gate and its allowlist', () => {
  const events = [{ tool_name: 'Edit', tool_input: { file_path: GATE, old_string: 'const', new_string: 'let' } },
    { tool_name: 'Write', tool_input: { file_path: GATE, content: 'export const gate = false;\n' } }];
  for (const event of events) {
    const write = { hook_event_name: 'PreToolUse', ...event };
    assert.match(evaluateHook(ROOT, { ...write, model: 'sonnet' }, '').join('\n'), /POLICY-EDIT AUTHORITY REQUIRED/, `${event.tool_name} by sonnet`);
    assert.deepEqual(evaluateHook(ROOT, { ...write, model: 'opus' }, ''), [], `${event.tool_name} by opus`);
  }
});

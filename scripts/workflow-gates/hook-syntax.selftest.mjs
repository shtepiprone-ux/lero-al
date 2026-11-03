#!/usr/bin/env node
// Task 944 R3 (owner D16, 2026-11-03): an Edit or Write that would leave a hook-loaded module unparseable or unable to load is
// refused for every role, because every hook importing it would then refuse every tool, the repairing Edit included.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { evaluateHook, hookModuleSyntaxErrors, hookModuleClosure } from './security-hook.mjs';

const HOOK = 'scripts/workflow-gates/hook.mjs';
const LIB = 'scripts/workflow-gates/lib.mjs';
const PS_HELPER = 'scripts/workflow-gates/ps-helper.mjs';
const LEGACY = 'scripts/workflow-gates/legacy.cjs';
const UNLOADED = 'scripts/workflow-gates/unloaded.mjs';
const LIB_TEXT = 'export const value = 1;\nexport function check(a) { if (a !== null) return a; return 0; }\n';
const SETTINGS = { hooks: { PreToolUse: [{ matcher: 'Edit|Write', hooks: [
  { type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/hook.mjs'] },
  { type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/legacy.cjs'] }] }] } };
const PS1 = "$helper = Join-Path $PSScriptRoot '..\\..\\scripts\\workflow-gates\\ps-helper.mjs'\n& node $helper\n";
const SYNTAX = /^HOOK MODULE SYNTAX: \S+ would stop a hook module from parsing or loading after this write \(/;

function put(root, file, text) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); }
function withRoot(fn, { settings = SETTINGS, hooksFolder = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'lero-hook-syntax-'));
  if (settings !== null) put(root, '.claude/settings.json', typeof settings === 'string' ? settings : JSON.stringify(settings, null, 2));
  if (hooksFolder) put(root, '.claude/hooks/gate.ps1', PS1);
  put(root, HOOK, "import { value } from './lib.mjs';\nexport const run = () => value;\n");
  put(root, LIB, LIB_TEXT);
  put(root, PS_HELPER, 'export const helper = 2;\n');
  put(root, LEGACY, "const fs = require('node:fs');\nmodule.exports = { ok: typeof fs.readFileSync === 'function' };\n");
  put(root, UNLOADED, 'export const unloaded = true;\n');
  try { return fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
const edit = (root, file, old_string, new_string, role = 'orchestrator') => ({ hook_event_name: 'PreToolUse', agent_type: role, tool_name: 'Edit',
  cwd: root, tool_input: { file_path: join(root, file), old_string, new_string } });
const write = (root, file, content, role = 'orchestrator') => ({ hook_event_name: 'PreToolUse', agent_type: role, tool_name: 'Write',
  cwd: root, tool_input: { file_path: join(root, file), content } });
const noSyntaxError = (root, event, message) => {
  assert.deepEqual(hookModuleSyntaxErrors(root, event), [], message);
  assert.ok(!evaluateHook(root, event, '').some(error => error.startsWith('HOOK MODULE SYNTAX')), message);
};

test('[GOV-944-HOOK-SYNTAX-DENY] An Edit or Write that would leave a hook-loaded module unparseable is refused for every role', () => withRoot(root => {
  assert.deepEqual(hookModuleClosure(root), [HOOK, LEGACY, LIB, PS_HELPER]);
  for (const role of ['orchestrator', 'executor']) {
    const events = [
      // The incident's form: a line comment that swallows the rest of the line.
      ['line comment', edit(root, LIB, 'if (a !== null) ', 'if (false && a !== null) // planted line comment ', role)],
      ['unparseable Write', write(root, HOOK, 'export const run = (\n', role)],
      ['.ps1-named script', edit(root, PS_HELPER, 'export const helper = 2;', 'export const helper = ;', role)],
      ['import of a file not written yet', edit(root, HOOK, "import { value } from './lib.mjs';", "import { value } from './lib.mjs';\nimport { later } from './later.mjs';", role)],
      ['removed export', edit(root, LIB, 'export const value = 1;', 'const value = 1;', role)],
      ['bare package import', edit(root, LIB, 'export const value = 1;', "import pad from 'left-pad';\nexport const value = 1;", role)],
      ['unparseable CommonJS closure module', edit(root, LEGACY, 'module.exports = {', 'module.exports = {{', role)],
    ];
    for (const [name, event] of events) {
      const errors = evaluateHook(root, event, '');
      assert.equal(errors.length, 1, `${role} ${name}: ${errors.join(' | ')}`);
      assert.match(errors[0], SYNTAX, `${role} ${name}`);
    }
    // A CRLF closure module and a two-line LF old_string: the result is computed after line-end normalization.
    put(root, LIB, LIB_TEXT.replace(/\n/g, '\r\n'));
    const crlf = evaluateHook(root, edit(root, LIB, 'export const value = 1;\nexport function check(a) {', 'export const value = 1;\nexport function check(a) {{', role), '');
    assert.match(crlf.join('\n'), SYNTAX, `${role} CRLF module`);
    put(root, LIB, LIB_TEXT);
  }
}));

test('[GOV-944-HOOK-SYNTAX-ALLOW] A parseable write of a hook-loaded module, any write of a module no hook loads, and a repairing Edit are not refused by the syntax guard', () => withRoot(root => {
  // A fixture module whose top level would write a marker file: no module is evaluated.
  const marker = join(root, 'scripts/workflow-gates/marker.txt');
  put(root, LIB, `import { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(marker)}, 'evaluated');\n${LIB_TEXT}`);
  for (const role of ['orchestrator', 'executor']) {
    noSyntaxError(root, edit(root, LIB, 'export const value = 1;', 'export const value = 2;', role), `${role} parseable Edit`);
    noSyntaxError(root, write(root, UNLOADED, 'export const = ;\n', role), `${role} unparseable Write of a module no hook loads`);
    noSyntaxError(root, edit(root, LEGACY, 'module.exports = {', "require('node:path');\nmodule.exports = {", role), `${role} CommonJS closure module`);
  }
  // A repairing Edit of an unparseable closure module.
  put(root, LIB, 'export const value = ;\n');
  noSyntaxError(root, edit(root, LIB, 'export const value = ;', 'export const value = 1;'), 'repairing Edit');
  put(root, LIB, 'export const value = 1;\n');
  // Write a new imported file first, then the Edit that imports it.
  noSyntaxError(root, write(root, 'scripts/workflow-gates/new.mjs', 'export const fresh = 3;\n'), 'Write of a new file');
  put(root, 'scripts/workflow-gates/new.mjs', 'export const fresh = 3;\n');
  noSyntaxError(root, edit(root, HOOK, "import { value } from './lib.mjs';", "import { value } from './lib.mjs';\nimport { fresh } from './new.mjs';"), 'Edit importing the new file');
  assert.equal(existsSync(marker), false, 'no fixture module was evaluated');
}));

test('[GOV-944-HOOK-CLOSURE-ERROR] An unreadable closure input, an import cycle, an absent old_string or a failing guard step never throws out of evaluateHook', () => {
  const broken = root => edit(root, LIB, 'export const value = 1;', 'export const value = ;');
  for (const [name, options] of [['missing settings.json', { settings: null, hooksFolder: false }], ['malformed settings.json', { settings: '{ not json', hooksFolder: false }],
    ['malformed settings shape', { settings: { hooks: { PreToolUse: [null, { hooks: 'x' }, { hooks: [null, { args: 7 }] }], Stop: 'x' } }, hooksFolder: false }]]) {
    withRoot(root => {
      assert.deepEqual(hookModuleClosure(root), [], name);
      assert.deepEqual(hookModuleSyntaxErrors(root, broken(root)), [], name);
      assert.doesNotThrow(() => evaluateHook(root, broken(root), ''), name);
    }, options);
  }
  // No .claude/hooks folder: the settings still name the closure.
  withRoot(root => {
    assert.deepEqual(hookModuleClosure(root), [HOOK, LEGACY, LIB]);
    assert.match(hookModuleSyntaxErrors(root, broken(root)).join('\n'), SYNTAX);
  }, { hooksFolder: false });
  withRoot(root => {
    // Two closure modules importing each other: the walk and the link both terminate.
    put(root, HOOK, "import { b } from './cycle-b.mjs';\nexport const a = 1;\nexport const run = () => b;\n");
    put(root, 'scripts/workflow-gates/cycle-b.mjs', "import { a } from './hook.mjs';\nexport const b = () => a;\n");
    assert.deepEqual(hookModuleClosure(root), ['scripts/workflow-gates/cycle-b.mjs', HOOK, LEGACY, PS_HELPER]);
    assert.deepEqual(hookModuleSyntaxErrors(root, edit(root, 'scripts/workflow-gates/cycle-b.mjs', 'export const b', 'export const b2 = 0;\nexport const b')), []);
    // An absent old_string is refused: the result cannot be checked.
    const absent = evaluateHook(root, edit(root, HOOK, 'no such text', 'x'), '');
    assert.deepEqual(absent, [`HOOK MODULE SYNTAX: ${HOOK}: old_string not found, the result cannot be checked`]);
    // A failing guard step (an injected reader that throws) refuses only this write and never throws.
    const failing = { readText: () => { throw new Error('injected reader failure'); } };
    assert.deepEqual(hookModuleSyntaxErrors(root, edit(root, HOOK, 'export const a = 1;', 'export const a = 2;'), failing),
      ['HOOK MODULE SYNTAX: guard error (injected reader failure)']);
    assert.doesNotThrow(() => evaluateHook(root, edit(root, HOOK, 'export const a = 1;', 'export const a = 2;'), ''));
  });
});

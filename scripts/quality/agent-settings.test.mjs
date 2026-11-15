// node --test scripts/quality/agent-settings.test.mjs
// The agents' permissions and hooks are a security control (AI Agent Security: "Block releases when high-risk tool
// policies, approval logic, or credential scopes change without updated tests"; least privilege outside the agent's
// context). This test pins .claude/settings.json: a change that loosens it fails CI until this test changes too, and
// the change report lists both files for the owner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const settings = JSON.parse(readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const deny = new Set(settings.permissions?.deny ?? []);
const ask = new Set(settings.permissions?.ask ?? []);
const allow = settings.permissions?.allow ?? [];

// Every Git subcommand that changes the repository, the index, the working tree, a ref or the configuration.
const MUTATING_GIT = ['add', 'commit', 'push', 'reset', 'restore', 'checkout', 'switch', 'stash', 'merge', 'rebase',
  'cherry-pick', 'revert', 'tag', 'rm', 'apply', 'clean', 'config'];

test('every mutating git command is denied in both shells (agents run read-only Git; the owner commits)', () => {
  const missing = [];
  for (const shell of ['Bash', 'PowerShell']) for (const sub of MUTATING_GIT) {
    if (!deny.has(`${shell}(git ${sub} *)`)) missing.push(`${shell}(git ${sub} *)`);
  }
  assert.deepEqual(missing, []);
});

test('no allow rule re-opens a denied command, a policy file, or an install', () => {
  const risky = allow.filter((r) => /git (add|commit|push|reset|checkout|merge|rebase|config)|npm (i|install|add|update)\b|npx --yes|\.claude|\.github|scripts\/quality|CLAUDE\.md|AGENTS\.md/.test(r));
  assert.deepEqual(risky, []);
});

test('policy files and the dependency manifest wait for the owner (flow.md roles; quality-gates.md §3)', () => {
  const required = ['./.claude/**', './CLAUDE.md', './AGENTS.md', './.github/**', './.githooks/**', './scripts/quality/**',
    './eslint.config.mjs', './package.json', './package-lock.json', './.npmrc'];
  assert.deepEqual(required.filter((p) => !ask.has(`Edit(${p})`)), []);
  for (const shell of ['Bash', 'PowerShell']) for (const cmd of ['npm install', 'npm install *', 'npm i', 'npm i *', 'npm add *', 'npm update *', 'npx --yes *']) {
    assert.ok(ask.has(`${shell}(${cmd})`), `${shell}(${cmd}) asks the owner`);
  }
});

test('Vercel MCP: every deploy, promote, rollback, env, domain, DNS, firewall and project write is denied', () => {
  const must = ['create_deployment', 'request_promote', 'request_rollback', 'create_project_env', 'edit_project_env',
    'update_project', 'buy_domain', 'create_record', 'update_record', 'put_firewall_config', 'update_firewall_config',
    'pause_project', 'assign_alias', 'update_project_protection_bypass', 'upload_file'];
  assert.deepEqual(must.map((t) => `mcp__plugin_vercel_vercel__${t}`).filter((t) => !deny.has(t)), []);
  assert.deepEqual([...deny].filter((t) => t.startsWith('mcp__') && !t.startsWith('mcp__plugin_vercel_vercel__')), []);
});

// Owner, 2026-11-07: every session starts held against the current OWASP Cheat Sheet Series. Owner, 2026-11-14: the
// local agent hooks (pipeline ledger, self-review, claims, push guard, agent loop) were removed; the gates are the CI
// workflow and the pre-commit hook, and this is the only hook left.
/** Why the hooks of a settings object are not exactly one SessionStart command, `owasp.mjs session`; empty when they are. */
export function hookProblems(config) {
  const out = [];
  // every command of every SessionStart entry: a second entry or a second command would run at every session start
  const commands = (config.hooks?.SessionStart ?? []).flatMap((h) => h.hooks ?? []);
  const one = commands.length === 1 ? commands[0] : null;
  const isSession = one && one.type === 'command' && one.command === 'node' && one.args?.length === 2
    && one.args[0] === '${CLAUDE_PROJECT_DIR}/scripts/quality/owasp.mjs' && one.args[1] === 'session';
  if (!isSession) out.push(`SessionStart must run exactly one command, owasp.mjs session (found ${commands.length})`);
  const events = Object.keys(config.hooks ?? {}).filter((e) => e !== 'SessionStart');
  if (events.length) out.push(`hooks on other events: ${events.join(', ')}`);
  return out;
}

test('the session starts with the OWASP reference state, and no other hook is registered', () => {
  assert.deepEqual(hookProblems(settings), []);
});

test('planted: a second SessionStart entry or command, another event, a changed command are each refused (R5-6)', () => {
  const one = settings.hooks.SessionStart[0].hooks[0];
  const extra = { type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/scripts/other.mjs'] };
  const withHooks = (hooks) => ({ hooks });
  assert.equal(hookProblems(withHooks({ SessionStart: [{ matcher: '', hooks: [one] }, { matcher: '', hooks: [extra] }] })).length, 1, 'a second entry');
  assert.equal(hookProblems(withHooks({ SessionStart: [{ matcher: '', hooks: [one, extra] }] })).length, 1, 'a second command');
  assert.equal(hookProblems(withHooks({ SessionStart: [{ matcher: '', hooks: [one, one] }] })).length, 1, 'the same command twice');
  assert.equal(hookProblems(withHooks({ SessionStart: [{ matcher: '', hooks: [one] }], Stop: [{ hooks: [extra] }] })).length, 1, 'another event');
  assert.equal(hookProblems(withHooks({ SessionStart: [{ matcher: '', hooks: [{ ...one, args: [one.args[0], 'check'] }] }] })).length, 1, 'another command');
  assert.equal(hookProblems(withHooks({})).length, 1, 'no hook');
});

test('the Git directory cannot be written through the file tools', () => {
  assert.deepEqual(['Edit(./.git/**)', 'Write(./.git/**)'].filter((r) => !deny.has(r)), []);
});

test('no setting turns permission checks off', () => {
  assert.notEqual(settings.permissions?.defaultMode, 'bypassPermissions');
  assert.equal(settings.disableAllHooks ?? false, false);
  assert.equal(settings.enableAllProjectMcpServers ?? false, false);
});

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

test('the agent loop runs at session start, after every file write, and at every stop (quality-gates.md §3)', () => {
  const runs = (event, mode, matcher) => (settings.hooks?.[event] ?? []).some((h) => (matcher === undefined || h.matcher === matcher)
    && h.hooks.some((x) => x.type === 'command' && x.command === 'node'
      && x.args?.[0] === '${CLAUDE_PROJECT_DIR}/scripts/quality/agent-check.mjs' && x.args?.[1] === mode));
  assert.ok(runs('SessionStart', 'start'), 'SessionStart records the files already changed');
  assert.ok(runs('PostToolUse', 'post', 'Edit|Write|MultiEdit|NotebookEdit'), 'PostToolUse checks every written file');
  assert.ok(runs('Stop', 'stop'), 'Stop checks every changed file');
  assert.ok(runs('SubagentStop', 'stop'), 'SubagentStop checks every changed file');
});

// Owner, 2026-11-10: nothing is done partially. The pipeline's stop check refuses a reply that claims a design, a
// verdict, an implementation, a commit or push handoff or a CI result without its complete ledger; the publication
// guard checks every push and merge command (docs/governance-reset-2026-11-06.md said it ran, but no settings file
// registered it until 2026-11-10).
test('every stop runs the pipeline check, and the main stop runs the publication guard (flow.md, completeness rule)', () => {
  const runs = (event, script, mode) => (settings.hooks?.[event] ?? []).some((h) => h.hooks.some((x) => x.type === 'command'
    && x.command === 'node' && x.args?.[0] === `\${CLAUDE_PROJECT_DIR}/scripts/quality/${script}` && x.args?.[1] === mode));
  assert.ok(runs('Stop', 'pipeline.mjs', 'stop'), 'Stop runs pipeline.mjs stop');
  assert.ok(runs('SubagentStop', 'pipeline.mjs', 'stop'), 'SubagentStop runs pipeline.mjs stop');
  assert.ok(runs('Stop', 'push-safety.mjs', undefined), 'Stop runs push-safety.mjs');
  assert.ok(runs('SessionStart', 'claims.mjs', 'start'), 'SessionStart reports new replies about CI for the claims corpus');
});

test('the pipeline ledgers in the Git directory cannot be written through the file tools', () => {
  assert.deepEqual(['Edit(./.git/**)', 'Write(./.git/**)'].filter((r) => !deny.has(r)), []);
});

test('no setting turns permission checks off', () => {
  assert.notEqual(settings.permissions?.defaultMode, 'bypassPermissions');
  assert.equal(settings.disableAllHooks ?? false, false);
  assert.equal(settings.enableAllProjectMcpServers ?? false, false);
});

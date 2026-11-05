// Task 942 revision 7, prototype of owner decision D31 on a copy of the gate files, and the routes of D30 measured on the real tree. Nothing under scripts/ or .claude/ changes.
// Run from the repository root. Read-only, apart from the ignored test-results/task942-proto/mcp folder and temporary folders.
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const OUT = resolve('test-results/task942-proto/mcp');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync('scripts/workflow-gates', OUT, { recursive: true });
const PREFIX = 'mcp__plugin_vercel_vercel__';
const VERBS = ['accept', 'activate', 'add', 'approve', 'assign', 'authorize', 'buy', 'cancel', 'change', 'complete', 'create', 'delete', 'edit', 'extend', 'generate', 'invalidate', 'issue', 'kill', 'patch', 'pause', 'put', 'record', 'replace', 'reply', 'request', 'rerequest', 'restore', 'retry', 'revoke', 'run', 'stage', 'start', 'stop', 'submit', 'test', 'unpause', 'update', 'upload', 'upsert', 'verify', 'write'];
const EXACT = ['get_access_to_vercel_url', 'get_or_create_drive', 'get_project_deletion_link', 'get_flags_project_disconnection_link'];
const DENY = [...VERBS.map(verb => `${PREFIX}${verb}_*`), ...EXACT.map(name => `${PREFIX}${name}`)];
const MATCHER = 'mcp__.*[Vv]ercel.*';
const patch = (file, swaps) => {
  let text = readFileSync(join(OUT, file), 'utf8');
  for (const [from, to] of swaps) { if (text.split(from).length !== 2) throw new Error(`${file}: not once: ${from.slice(0, 70)}`); text = text.replace(from, () => to); }
  writeFileSync(join(OUT, file), text);
};
patch('security-hook.mjs', [
  ['export const evaluateHook = withPathCache(uncachedEvaluateHook);',
    `export const VERCEL_MCP_MATCHER = ${JSON.stringify(MATCHER)};
export const VERCEL_MCP_DENY = ${JSON.stringify(DENY)};
const VERCEL_MCP_READ = /^(?:get|list|count|aggregate|search|read|filter)_|^(?:artifact_query|git_namespaces|web_fetch_vercel_url)$/;
const VERCEL_MCP_NAME = /^mcp__.*vercel.*?__(.+)$/i;
// D31: a Vercel MCP tool runs only when it is a read; a name this list has not seen is refused, so a new write tool is not open until someone looks at it.
export function vercelMcpErrors(name) {
  const tool = VERCEL_MCP_NAME.exec(String(name ?? ''))?.[1];
  if (tool === undefined) return [];
  const refused = VERCEL_MCP_DENY.some(rule => { const own = rule.slice(rule.lastIndexOf('__') + 2); return own.endsWith('*') ? tool.startsWith(own.slice(0, -1)) : tool === own; });
  return !refused && VERCEL_MCP_READ.test(tool) ? [] : [\`VERCEL MCP WRITE REFUSED: \${tool} is not a read; deployment, environment and account changes are the owner's (D31).\`];
}
export const evaluateHook = withPathCache(uncachedEvaluateHook);`],
  ["  if (event.hook_event_name !== 'PreToolUse') return ['Unsupported security hook event'];\n  const input = event.tool_input;",
    "  if (event.hook_event_name !== 'PreToolUse') return ['Unsupported security hook event'];\n  if (/^mcp__/.test(String(event.tool_name ?? ''))) return vercelMcpErrors(event.tool_name);\n  const input = event.tool_input;"],
]);
patch('check-workflow.mjs', [
  ["const expectedMatcher = event === 'PreToolUse' ? (gitGuard ? 'Bash|PowerShell' : 'Edit|Write|Bash|PowerShell') : '';",
    "const mcpGroup = event === 'PreToolUse' && group.matcher === VERCEL_MCP_MATCHER && hook.args?.some(arg => arg.endsWith('/security-hook.mjs'));\n    const expectedMatcher = mcpGroup ? VERCEL_MCP_MATCHER : event === 'PreToolUse' ? (gitGuard ? 'Bash|PowerShell' : 'Edit|Write|Bash|PowerShell') : '';"],
  ["  // Task 945 R7: written code is always checked,",
    `  const hookOn = matcher => settings.hooks?.PreToolUse?.some(g => g.matcher === matcher && g.hooks?.some(h => h.args?.includes('\${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/security-hook.mjs')));
  if (!hookOn('Edit|Write|Bash|PowerShell')) errors.push('PreToolUse: the security hook is not registered for writes');
  if (!hookOn(VERCEL_MCP_MATCHER)) errors.push('PreToolUse: the security hook is not registered for the Vercel MCP tools');
  for (const rule of VERCEL_MCP_DENY) if (!settings.permissions?.deny?.includes(rule)) errors.push(\`permissions.deny: missing \${rule}\`);
  // Task 945 R7: written code is always checked,`],
]);
const checkText = readFileSync(join(OUT, 'check-workflow.mjs'), 'utf8');
writeFileSync(join(OUT, 'check-workflow.mjs'), checkText.replace(/^(#![^\n]*\n)?/, match => `${match}import { VERCEL_MCP_DENY, VERCEL_MCP_MATCHER } from './security-hook.mjs';\n`));

const hook = await import(pathToFileURL(join(OUT, 'security-hook.mjs')).href);
const { validateSettings } = await import(pathToFileURL(join(OUT, 'check-workflow.mjs')).href);
const names = readFileSync('docs/sessions/evidence/task942/design/vercel-mcp-tools.txt', 'utf8').split(/\r?\n/).filter(Boolean);
const run = name => hook.evaluateHook(ROOT, { hook_event_name: 'PreToolUse', tool_name: name, tool_input: {} }, '');
const refused = names.filter(name => run(`${PREFIX}${name}`).length), allowed = names.filter(name => !run(`${PREFIX}${name}`).length);
console.log('=== the hook on the real evaluateHook');
console.log(`tools ${names.length}; refused ${refused.length}; allowed ${allowed.length}`);
const globbed = name => DENY.some(rule => { const own = rule.slice(PREFIX.length); return own.endsWith('*') ? name.startsWith(own.slice(0, -1)) : name === own; });
console.log(`refused by the hook and in the deny list agree on every tool: ${names.every(name => globbed(name) === refused.includes(name))}`);
for (const [label, name] of [['a tool that does not exist yet', `${PREFIX}future_wipe_everything`], ['the same tool through another server name', 'mcp__claude_ai_Vercel__create_deployment'], ['a read through another server name', 'mcp__claude_ai_Vercel__get_runtime_logs'], ['another server', 'mcp__plugin_playwright_playwright__browser_click'], ['another server, a word that writes', 'mcp__supabase__execute_sql']]) console.log(`${label}: ${run(name).length ? 'refused' : 'allowed'}`);
console.log(`an Edit event still reaches the write branch: ${hook.evaluateHook(ROOT, { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: 'scripts/check-example.mjs' } }, '').join(' ').slice(0, 60)}`);
const spawned = spawnSync(process.execPath, [join(OUT, 'security-hook.mjs')], { input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: `${PREFIX}create_deployment`, tool_input: {} }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
console.log(`spawned hook: exit ${spawned.status}; decision ${JSON.parse(spawned.stdout).hookSpecificOutput.permissionDecision}`);

console.log('=== validateSettings on the real settings with the addition, in memory');
const fresh = () => {
  const settings = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  settings.permissions.deny.push(...DENY);
  const main = settings.hooks.PreToolUse.find(group => group.hooks.some(h => h.args?.some(arg => arg.endsWith('/security-hook.mjs'))));
  settings.hooks.PreToolUse.push({ matcher: MATCHER, hooks: [JSON.parse(JSON.stringify(main.hooks.find(h => h.args.some(arg => arg.endsWith('/security-hook.mjs')))))] });
  return settings;
};
const show = (label, change) => { const settings = fresh(); change?.(settings); const errors = validateSettings(ROOT, settings); console.log(`${label}: ${errors.length ? errors[0].slice(0, 100) : 'no error'}`); };
show('as planned');
show('the write group removed, the MCP group left', s => { s.hooks.PreToolUse = s.hooks.PreToolUse.filter(g => !(g.matcher === 'Edit|Write|Bash|PowerShell' && g.hooks.some(h => h.args?.some(a => a.endsWith('/security-hook.mjs'))))); });
show('the MCP group removed', s => { s.hooks.PreToolUse = s.hooks.PreToolUse.filter(g => g.matcher !== MATCHER); });
show('the MCP matcher narrowed', s => { s.hooks.PreToolUse.find(g => g.matcher === MATCHER).matcher = 'mcp__plugin_vercel_vercel__get_.*'; });
show('another hook on the MCP matcher', s => { s.hooks.PreToolUse.find(g => g.matcher === MATCHER).hooks[0].args = ['${CLAUDE_PROJECT_DIR}/.claude/hooks/phase-write-gate.ps1']; });
show('one deny rule dropped', s => { s.permissions.deny = s.permissions.deny.filter(rule => rule !== `${PREFIX}create_*`); });
show('a mandatory hook left to fail open', s => { delete s.hooks.PreToolUse.find(g => g.matcher === MATCHER).hooks[0].onFailure; });
const realErrors = validateSettings(ROOT, JSON.parse(readFileSync('.claude/settings.json', 'utf8'))).length;
console.log(`the settings as committed today, under the new check: ${realErrors} errors, so the settings and the check change together`);

console.log('=== the hook self-tests on the patched copy, the settings as committed');
for (const file of readdirSync(OUT).filter(name => /^(shell-forms|hook-syntax|session-role|diff-hook|governance-contract|security-contract)/.test(name) && name.endsWith('.selftest.mjs'))) {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join(OUT, file)], { encoding: 'utf8', maxBuffer: 1 << 27, timeout: 280000 });
  const count = key => (new RegExp(`^# ${key} (\\d+)`, 'm').exec(r.stdout) ?? [])[1];
  console.log(`patched ${file}: exit ${r.status}; pass ${count('pass')}, fail ${count('fail')}`);
}

console.log('=== D30: a dependency file in a product contract, the hook and the rerun route');
const { validateContract, scopeDigest } = await import(pathToFileURL(resolve('scripts/workflow-gates/contract.mjs')).href);
const live = await import(pathToFileURL(resolve('scripts/workflow-gates/security-hook.mjs')).href);
const sidecar = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json';
const c931 = JSON.parse(readFileSync(sidecar, 'utf8'));
c931.scope.push('package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb');
console.log(`Task 931 with all five files in scope, plan errors:${JSON.stringify(validateContract(ROOT, c931, { phase: 'plan' })).slice(0, 200)}`);
for (const command of ['npm install --save-exact next@15.5.28 eslint-config-next@15.5.28', 'npm install @sentry/nextjs@10.78.0']) console.log(`${command}: targets ${JSON.stringify(live.shellWriteTargets(ROOT, command, 'PowerShell') ?? null)}`);
const c941 = JSON.parse(readFileSync('tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json', 'utf8'));
const { governanceReport } = await import(pathToFileURL(resolve('scripts/workflow-gates/cli.mjs')).href);
const rerun = governanceReport(ROOT, c941);
console.log(`governance-report in memory on the reviewed Task 941 contract, nothing written: status ${rerun.status}; cases ${rerun.cases.length}; passed ${rerun.cases.filter(k => k.status === 'passed').length}; errors ${JSON.stringify(rerun.errors).slice(0, 300)}; scope is current ${rerun.scopeSha256 === scopeDigest(ROOT, c941)}`);
for (const file of ['docs/sessions/evidence/task923/security/d8-d9-report.mjs', 'docs/sessions/evidence/task923/security/owner-fixes-report.mjs', 'docs/sessions/evidence/task927/security/make-report.mjs']) {
  const text = readFileSync(file, 'utf8');
  console.log(`${file}: reruns through runMappedTests ${/runMappedTests\(ROOT, contract\)/.test(text)}; writes scopeDigest ${/scopeSha256: scopeDigest\(ROOT, contract\)/.test(text)}; refuses a failing run ${/NOT REPORTED/.test(text)}`);
}

console.log('=== the check of Task 945 on the updated manifests, in a temporary folder');
const { checkDependencies } = await import(pathToFileURL(resolve('scripts/workflow-gates/dependency-check.mjs')).href);
const limits = JSON.parse(readFileSync('scripts/workflow-gates/code-check.json', 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'dep-check-'));
const sh = command => spawnSync(command, { cwd: dir, shell: true, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 280000 });
for (const file of ['package.json', 'package-lock.json', '.npmrc']) copyFileSync(file, join(dir, file));
mkdirSync(join(dir, 'scripts/workflow-gates'), { recursive: true });
copyFileSync('scripts/workflow-gates/audit-baseline.json', join(dir, 'scripts/workflow-gates/audit-baseline.json'));
sh('git init -q && git add . && git -c user.name=x -c user.email=x@x commit -qm base');
sh('npm install --package-lock-only --ignore-scripts --no-audit --no-fund --save-exact next@15.5.28 eslint-config-next@15.5.28');
sh('npm install --package-lock-only --ignore-scripts --no-audit --no-fund @sentry/nextjs@10.78.0');
const result = checkDependencies({ root: dir, limits: limits.dependencies ?? limits.dependency ?? limits });
console.log(`checkDependencies: ${JSON.stringify(result).slice(0, 600)}`);
rmSync(dir, { recursive: true, force: true, maxRetries: 3 });

// Task 944 review 3 (approver, read-only for the project): AC8 on the real repository, further R3 counter-checks, the executor
// result of the forms r3-adversarial.mjs found missed, and the frozen 2318-command corpus of AC12 (final hook against the base
// hook saved by r3-adversarial.mjs in the gitignored test-results/944-r3/). No event is applied; nothing in the project is written.
// Usage (project root): node docs/sessions/evidence/task944/review/r3-probes.mjs
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isPolicyPath, isProductPath, digest } from '../../../../../scripts/workflow-gates/contract.mjs';
import { allContracts, readJson } from '../../../../../scripts/workflow-gates/cli.mjs';
import { evaluateHook, hookModuleClosure, hookModuleSyntaxErrors, shellWriteTargets } from '../../../../../scripts/workflow-gates/security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const G = 'scripts/workflow-gates';
const CONTRACT = `${G}/contract.mjs`, HOOK = `${G}/security-hook.mjs`, ROLE = `${G}/session-role.mjs`;
const edit = (file_path, old_string, new_string, extra = {}, role = 'orchestrator') => ({ hook_event_name: 'PreToolUse', agent_type: role, tool_name: 'Edit', cwd: ROOT, tool_input: { file_path, old_string, new_string, ...extra } });
const write = (file_path, content, role = 'orchestrator') => ({ hook_event_name: 'PreToolUse', agent_type: role, tool_name: 'Write', cwd: ROOT, tool_input: { file_path, content } });
const syntax = errors => errors.filter(error => error.startsWith('HOOK MODULE SYNTAX')).map(error => error.slice(0, 170));
const before = digest(ROOT, [CONTRACT, HOOK, ROLE]);

console.log('## AC8 and R3 on the real repository');
const closure = hookModuleClosure(ROOT);
console.log(`closure ${closure.length}: ${closure.join(', ')}`);
const raw = readFileSync(resolve(ROOT, ROLE), 'utf8');
const crlfLines = raw.split('\r\n').slice(0, 2).join('\n');
const cases = [
  ['line comment that swallows a function head (refused)', edit(resolve(ROOT, CONTRACT), 'export function planDigest(root, contract) {', 'export function planDigest(root, contract) // {')],
  ['block comment (allowed)', edit(resolve(ROOT, CONTRACT), 'export function planDigest(root, contract) {', 'export function planDigest(root, contract) /* note */ {')],
  ['executor: same line comment (refused)', edit(resolve(ROOT, CONTRACT), 'export function planDigest(root, contract) {', 'export function planDigest(root, contract) // {', {}, 'executor')],
  ['import of a file not written yet (refused)', edit(resolve(ROOT, HOOK), "from './contract.mjs';", "from './contract.mjs';\nimport './not-yet-written.mjs';")],
  ['removed export (refused)', edit(resolve(ROOT, CONTRACT), 'export const isEvidencePath =', 'const isEvidencePath =')],
  ['relative path spelling (refused)', edit(CONTRACT, 'export function planDigest(root, contract) {', 'export function planDigest(root, contract) // {')],
  ['upper-case path spelling (refused)', edit(CONTRACT.toUpperCase(), 'export function planDigest(root, contract) {', 'export function planDigest(root, contract) // {')],
  ['CRLF module, multi-line LF old_string found (valid edit allowed)', edit(ROLE, crlfLines, crlfLines)],
  ['replace_all across the module that keeps it valid (allowed)', edit(CONTRACT, 'isEvidencePath', 'isEvidencePath', { replace_all: true })],
  ['replace_all that removes an export name (refused)', edit(CONTRACT, 'export const isEvidencePath', 'const isEvidencePath', { replace_all: true })],
  ['absent old_string (refused)', edit(CONTRACT, 'no such text anywhere in the module', 'x')],
  ['Write of unparseable text over a closure module (refused)', write(resolve(ROOT, ROLE), 'export const = ;\n')],
  ['Write with CRLF text that parses (allowed)', write(resolve(ROOT, ROLE), raw)],
  ['module outside the closure: broken hook-load-check.mjs is not a closure file, so its own repair stays possible', write(`${G}/hook-load-check.mjs`, 'export const = ;\n')],
];
for (const [name, event] of cases) {
  const started = performance.now();
  const direct = hookModuleSyntaxErrors(ROOT, event);
  const ms = Math.round(performance.now() - started);
  console.log(`${direct.length ? 'REFUSED' : 'allowed'} ${name} (${ms} ms)${direct.length ? `: ${syntax(direct)[0]}` : ''}`);
  console.log(`  evaluateHook agrees: ${JSON.stringify(syntax(evaluateHook(ROOT, event, '')).length > 0) === JSON.stringify(direct.length > 0)}`);
}
console.log(`live digest unchanged: ${before === digest(ROOT, [CONTRACT, HOOK, ROLE])}`);

console.log('\n## executor result of the missed forms (P = scripts/check-example.mjs, S = package.json; evaluateHook only, nothing runs)');
const P = 'scripts/check-example.mjs';
const executor = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: ROOT, tool_input: { command } });
for (const command of [`perl -0pi -e 's/a/b/' ${P}`, `perl -0777pi -e 's/a/b/' package.json`, `echo \`rm ${P}\``, `echo \`rm package.json\``,
  `env -C scripts bash -c 'rm check-example.mjs'`, `env -C scripts python -c "open('check-example.mjs','w')"`, `python -c "open(file='${P}', mode='w')"`,
  `python -c "import os; os.removedirs('scripts')"`, `powershell -Command "[IO.File]::Open('${P}','Create')"`, `npm exec rimraf ${P}`, `pnpm exec rimraf package.json`, `yarn rimraf ${P}`, `pnpm dlx rimraf ${P}`]) {
  const errors = evaluateHook(ROOT, executor(command), '');
  console.log(`${errors.length ? 'refused' : 'ALLOWED'} ${command}${errors.length ? ` :: ${errors[0].slice(0, 60)}` : ''}`);
}
console.log(`perl attached script control: ${JSON.stringify(shellWriteTargets(ROOT, `perl -pi -e's/a/b/' ${P}`, ROOT))}`);

console.log('\n## AC12 frozen corpus');
const base = await import(pathToFileURL(resolve(ROOT, 'test-results/944-r3/base-hook.mjs')).href);
const corpus = JSON.parse(readFileSync(join(ROOT, 'test-results/task943-prototype/corpus.json'), 'utf8'));
console.log(`corpus ${corpus.length} commands, sha256 ${createHash('sha256').update(JSON.stringify(corpus)).digest('hex')}`);
const guarded = t => !t.startsWith('../') && !/^[A-Za-z]:/.test(t) && (isPolicyPath(t) || isProductPath(t) || /^(?:tasks|docs|\.git)\//i.test(t));
const scopes = new Set();
for (const path of allContracts(ROOT)) { try { const c = readJson(ROOT, path); if (c.kind === 'governance') for (const s of c.scope || []) scopes.add(s.toLowerCase()); } catch { /* unreadable */ } }
let added = 0, guardedAdded = 0, dropped = 0, refused = 0, scopeHits = 0, slowest = 0;
for (const [command, cwd] of corpus) {
  const t0 = performance.now();
  const after = shellWriteTargets(ROOT, command, cwd);
  slowest = Math.max(slowest, performance.now() - t0);
  const old = base.shellWriteTargets(ROOT, command, cwd);
  if (old.some(t => !after.includes(t))) dropped++;
  const extra = after.filter(t => !old.includes(t));
  if (extra.length) added++;
  if (extra.some(guarded)) guardedAdded++;
  if (extra.some(t => scopes.has(t.toLowerCase()))) scopeHits++;
  const tool = /^\s*(?:\$|Get-|Set-|Select-|New-|Remove-|Copy-|& )/.test(command) ? 'PowerShell' : 'Bash';
  const event = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, cwd, tool_input: { command } };
  if (!base.evaluateHook(ROOT, event, '').length && evaluateHook(ROOT, event, '').length) refused++;
}
console.log(`dropped ${dropped}; with added targets ${added}; with an added guarded target ${guardedAdded}; executor newly refused ${refused}; with an added governance scope file ${scopeHits}; slowest final call ${Math.round(slowest)} ms`);

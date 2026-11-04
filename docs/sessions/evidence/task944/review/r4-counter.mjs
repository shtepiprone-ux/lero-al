// Task 944 review 4 (approver, read-only for the project): counter-checks chosen by this review, outside review 3's scripts. Everything
// writes only temporary mkdtemp fixtures; the real functions are imported. Usage (project root): node docs/sessions/evidence/task944/review/r4-counter.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSensitivity } from '../../../../../scripts/workflow-gates/cli.mjs';
import { digest } from '../../../../../scripts/workflow-gates/contract.mjs';
import { evaluateHook, hookModuleClosure, hookModuleSyntaxErrors, isReadOnlyShellCommand } from '../../../../../scripts/workflow-gates/security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${String(detail).slice(0, 170)}` : ''}`); };
const put = (root, file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };

console.log('## R1: runner refusals outside the self-test variants');
const GATE = 'scripts/workflow-gates/gate.mjs', TEST = 'scripts/workflow-gates/gate.selftest.mjs', SENS = 'docs/sessions/evidence/gov/sensitivity.json';
const GATE_TEXT = "export function gate(input) { if (input === 'bad') return false; return true; }\n";
const NAME = '[GOV-T-DENY] the gate refuses bad input';
const testText = body => `import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { gate } from './gate.mjs';\n${body}\n`;
const ONE = `test('${NAME}', () => { assert.equal(gate('bad'), false); });`;
const SPEC = { version: 1, case: 'GOV-T-DENY', target: GATE, find: "if (input === 'bad') return false;", replace: "if (input === 'never') return false;" };
function sensitivity({ body = ONE, spec = SPEC, sensitivityPath = SENS, sensitivityText, environment = {} }) {
  const root = mkdtempSync(join(tmpdir(), 'lero-r4-sens-'));
  const breakPath = 'docs/sessions/evidence/gov/GOV-T-DENY.break.json';
  try {
    put(root, GATE, GATE_TEXT); put(root, TEST, testText(body)); put(root, breakPath, JSON.stringify(spec));
    if (sensitivityText !== undefined) put(root, sensitivityPath, sensitivityText);
    const contract = { kind: 'governance', task: 'tasks/x.md', scope: [GATE, TEST, breakPath], sensitivity: sensitivityPath,
      cases: [{ id: 'GOV-T-DENY', critical: true, testFile: TEST, testName: NAME }] };
    put(root, 'tasks/x.security.json', JSON.stringify(contract));
    const saved = Object.entries(environment).map(([key, value]) => { const old = process.env[key]; process.env[key] = value; return [key, old]; });
    const before = digest(root, [GATE, TEST]);
    const result = runSensitivity(root, 'tasks/x.security.json', breakPath);
    for (const [key, old] of saved) { if (old === undefined) delete process.env[key]; else process.env[key] = old; }
    return { result, unchanged: before === digest(root, [GATE, TEST]), artifact: existsSync(join(root, 'docs/sessions/evidence/gov/GOV-T-DENY.txt')),
      text: sensitivityText === undefined ? existsSync(join(root, sensitivityPath)) : readFileSync(join(root, sensitivityPath), 'utf8') };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const refused = (name, run, message) => {
  const out = sensitivity(run);
  check(`${name} refused`, new RegExp(message).test(out.result.error || '') && out.unchanged && !out.artifact, out.result.error || 'accepted');
};
const control = sensitivity({});
check('control: the valid spec yields a record', !control.result.error && control.result.record?.method === 'in-memory', control.result.error);
refused('two tests with the same name', { body: `${ONE}\n${ONE}` }, 'baseline did not pass');
refused('a skipped named test', { body: `test.skip('${NAME}', () => { assert.equal(gate('bad'), false); });` }, 'baseline did not pass');
refused('a named test absent from the file', { body: "test('[GOV-T-OTHER] other', () => {});" }, 'baseline did not pass');
refused('target traversal', { spec: { ...SPEC, target: '../outside.mjs' } }, 'missing or invalid|neither the scope');
refused('dotted spelling of a scoped target', { spec: { ...SPEC, target: 'scripts/../scripts/workflow-gates/gate.mjs' } }, 'missing or invalid|neither the scope');
refused('an extra spec key', { spec: { ...SPEC, note: 'x' } }, 'the break spec is malformed');
refused('a numeric version', { spec: { ...SPEC, version: '1' } }, 'the break spec is malformed');
refused('a replace that is not text', { spec: { ...SPEC, replace: 7 } }, 'the break spec is malformed');
refused('a target that is no module', { spec: { ...SPEC, target: 'docs/sessions/evidence/gov/GOV-T-DENY.break.json' } }, 'not a .mjs, .cjs or .js file');
refused('sensitivity file outside the evidence tree', { sensitivityPath: 'tasks/sens.json' }, 'sensitivity file .* is invalid');
const bad = sensitivity({ sensitivityText: '{ "cases": 5 }' });
check('a malformed sensitivity file is refused and kept', /sensitivity file .* is invalid/.test(bad.result.error || '') && bad.text === '{ "cases": 5 }' && !bad.artifact, bad.result.error);
const parent = sensitivity({ environment: { NODE_OPTIONS: '--require=./no-such-file.cjs', SENSITIVITY_BREAK: 'no-such-spec.json' } });
check('NODE_OPTIONS and SENSITIVITY_BREAK of the parent do not reach baseline or restored', !parent.result.error, parent.result.error);

console.log('\n## R3: spellings and import forms on a fixture root');
const root = mkdtempSync(join(tmpdir(), 'lero-r4-hook-'));
const HOOK = 'scripts/workflow-gates/hook.mjs';
put(root, '.claude/settings.json', JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/hook.mjs"' }] }] } }));
put(root, HOOK, ["import {", "  a,", "} from './multi.mjs';", "import './side.mjs';", "export * from './star.mjs';", "export { b } from \"./named.mjs\";", "const later = () => import('./dynamic.mjs');", 'export { a, later };', ''].join('\n'));
for (const [file, text] of Object.entries({ multi: 'export const a = 1;\n', side: 'globalThis.x = 1;\n', star: 'export const s = 1;\n', named: 'export const b = 2;\n', dynamic: 'export const d = 3;\n', free: 'export const f = 1;\n' })) put(root, `scripts/workflow-gates/${file}.mjs`, text);
const closure = hookModuleClosure(root);
check('multi-line, side-effect, star, named and dynamic imports are all in the closure', ['multi', 'side', 'star', 'named', 'dynamic'].every(name => closure.includes(`scripts/workflow-gates/${name}.mjs`)) && !closure.includes('scripts/workflow-gates/free.mjs'), closure.join(', '));
const edit = (file_path, old_string, new_string, extra = {}) => ({ hook_event_name: 'PreToolUse', agent_type: 'orchestrator', tool_name: 'Edit', cwd: root, tool_input: { file_path, old_string, new_string }, ...extra });
const breaks = ['export const a = 1;', 'export const a = ;'];
const M = 'scripts/workflow-gates/multi.mjs';
for (const [name, event] of [
  ['absolute path', edit(join(root, M), ...breaks)],
  ['relative path', edit(M, ...breaks)],
  ['backslash path', edit(M.replaceAll('/', '\\'), ...breaks)],
  ['upper-case path', edit(M.toUpperCase(), ...breaks)],
  ['dotted path', edit('scripts/workflow-gates/../workflow-gates/multi.mjs', ...breaks)],
  ['file name relative to the event folder', edit('multi.mjs', ...breaks, { cwd: join(root, 'scripts/workflow-gates') })],
  ['the `path` input', { ...edit('x', ...breaks), tool_input: { path: M, old_string: breaks[0], new_string: breaks[1] } }],
]) check(`${name} refused`, hookModuleSyntaxErrors(root, event).some(error => error.startsWith('HOOK MODULE SYNTAX')), hookModuleSyntaxErrors(root, event)[0] || 'allowed');
const dynamicBreak = edit('scripts/workflow-gates/dynamic.mjs', 'export const d = 3;', 'export const d = ;');
check('a syntax break of a module reached only by import() is refused', hookModuleSyntaxErrors(root, dynamicBreak).length > 0);
check('a directory import is refused', hookModuleSyntaxErrors(root, edit(HOOK, "import './side.mjs';", "import './';")).length > 0);
check('Write without text content is refused', hookModuleSyntaxErrors(root, { ...edit(M, 'a', 'b'), tool_name: 'Write', tool_input: { file_path: M, content: 7 } }).length > 0);
check('Edit with `$&` in new_string is computed literally', hookModuleSyntaxErrors(root, edit(M, 'export const a = 1;', "export const a = '$&';")).length === 0);
check('a write to an outside-closure module is untouched', hookModuleSyntaxErrors(root, edit('scripts/workflow-gates/free.mjs', 'export const f = 1;', 'export const f = ;')).length === 0);
check('a Bash event is not read by the guard', hookModuleSyntaxErrors(root, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'x' } }).length === 0);
const evaluated = evaluateHook(root, edit(M, ...breaks), '');
check('evaluateHook returns exactly the guard error before any role check', evaluated.length === 1 && evaluated[0].startsWith('HOOK MODULE SYNTAX'), evaluated.join(' | '));
rmSync(root, { recursive: true, force: true });

console.log('\n## R3: the closure of the real repository, derived independently');
const named = new Set();
const settings = readFileSync(resolve(ROOT, '.claude/settings.json'), 'utf8');
for (const match of settings.matchAll(/CLAUDE_PROJECT_DIR\}\/([\w./-]+\.mjs)/g)) named.add(match[1]);
for (const file of readdirSync(resolve(ROOT, '.claude/hooks')).filter(name => name.endsWith('.ps1'))) {
  for (const match of readFileSync(resolve(ROOT, '.claude/hooks', file), 'utf8').matchAll(/scripts[\\/][\w.\\/-]+\.mjs/g)) named.add(match[0].replaceAll('\\', '/'));
}
const walk = [...named], seen = new Set();
while (walk.length) {
  const file = walk.pop();
  if (seen.has(file) || !existsSync(resolve(ROOT, file))) continue;
  seen.add(file);
  for (const line of readFileSync(resolve(ROOT, file), 'utf8').split('\n')) {
    const specifier = /^\s*(?:import|export)\b.*?['"](\.{1,2}\/[^'"]+)['"]/.exec(line) || /^\s*\}\s*from\s*['"](\.{1,2}\/[^'"]+)['"]/.exec(line);
    if (specifier) walk.push(resolve(ROOT, dirname(file), specifier[1]).slice(ROOT.length + 1).replaceAll('\\', '/'));
  }
}
const live = hookModuleClosure(ROOT);
const onlyLive = live.filter(file => !seen.has(file)), onlyWalk = [...seen].filter(file => !live.includes(file));
console.log(`live ${live.length}; walk ${seen.size}; only in hookModuleClosure ${JSON.stringify(onlyLive)}; only in the walk ${JSON.stringify(onlyWalk)}`);
check('hookModuleClosure holds every file of the independent walk', onlyWalk.length === 0);
const entry = spawnSync(process.execPath, ['--experimental-vm-modules', '--no-warnings', 'scripts/workflow-gates/hook-load-check.mjs'], { cwd: ROOT, input: JSON.stringify({ entries: live, overrides: {} }), encoding: 'utf8' });
check('the live graph links', entry.status === 0 && entry.stdout.trim() === 'linked', entry.stderr);

console.log('\n## R8: isReadOnlyShellCommand and the Task 941 boundary');
for (const command of ['grep -n "perl -pi" docs/a.md', 'grep -n "then rm" docs/a.md', 'cat docs/a.md']) check(`read-only stays read-only: ${command}`, isReadOnlyShellCommand(command) === true);
for (const command of ['perl -pi -e s/a/b/ docs/a.md', 'if true; then rm docs/a.md; fi']) check(`not read-only: ${command}`, isReadOnlyShellCommand(command) === false);
console.log('\n## R6: each sensitivity artifact records the digests of the live target and test file');
const records = JSON.parse(readFileSync(resolve(ROOT, 'docs/sessions/evidence/task944/sensitivity/sensitivity.json'), 'utf8')).cases;
for (const record of records) {
  const text = readFileSync(resolve(ROOT, record.artifact), 'utf8');
  for (const match of text.matchAll(/^(?:target|test file): (\S+) digest before (\S+) after (\S+)$/gm)) {
    check(`${record.id} ${match[1]}: recorded digests equal each other and the live file`, match[2] === match[3] && match[3] === digest(ROOT, [match[1]]));
  }
}
console.log(`\nFAILURES ${failures}`);
process.exitCode = failures ? 1 : 0;

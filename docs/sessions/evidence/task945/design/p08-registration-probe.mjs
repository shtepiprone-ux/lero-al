// Task 945 design: what registering the tool does to the code that reads the settings. Nothing in the project changes: a patched settings object in memory and a temporary root.
// Run from the project root: node docs/sessions/evidence/task945/design/p08-registration-probe.mjs
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = file => import(pathToFileURL(resolve(file)).href);
const { validateSettings } = await load('scripts/workflow-gates/check-workflow.mjs');
const { isPolicyPath } = await load('scripts/workflow-gates/contract.mjs');
const { hookModuleClosure } = await load('scripts/workflow-gates/security-hook.mjs');
const settings = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
const entry = timeout => ({ matcher: '', hooks: [{ type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/code-check.mjs'], timeout, onFailure: 'block' }] });
const patched = JSON.parse(JSON.stringify(settings));
patched.hooks.SessionStart.push(entry(15));
patched.hooks.PostToolUse = [entry(60)];
patched.hooks.Stop.push(entry(300));
patched.hooks.SubagentStop = [entry(300)];

const fx = mkdtempSync(join(tmpdir(), 'lero-945-reg-'));
const put = (file, text) => { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), text); };
for (const group of Object.values(settings.hooks).flat()) for (const hook of group.hooks) for (const arg of hook.args) if (arg.includes('${CLAUDE_PROJECT_DIR}/')) put(arg.replace('${CLAUDE_PROJECT_DIR}/', ''), '');
console.log(`1 validateSettings, real settings, tool file absent: ${JSON.stringify(validateSettings(fx, settings))}`);
const absent = validateSettings(fx, patched);
console.log(`2 validateSettings, patched settings, tool file absent: ${JSON.stringify(absent)}`);
put('scripts/workflow-gates/code-check.mjs', '');
console.log(`3 validateSettings, patched settings, tool file present: ${JSON.stringify(validateSettings(fx, patched))}`);
const narrowed = JSON.parse(JSON.stringify(patched));
narrowed.hooks.PostToolUse[0].matcher = 'Edit';
console.log(`4 validateSettings, a narrowed matcher: ${JSON.stringify(validateSettings(fx, narrowed))}`);
const removed = JSON.parse(JSON.stringify(patched));
delete removed.hooks.PostToolUse;
delete removed.hooks.SubagentStop;
console.log(`5 validateSettings of today, the registration removed: ${JSON.stringify(validateSettings(fx, removed))}`);

put('.claude/settings.json', JSON.stringify(settings));
console.log(`6 guard closure holds the tool, real settings: ${hookModuleClosure(fx).includes('scripts/workflow-gates/code-check.mjs')}`);
put('.claude/settings.json', JSON.stringify(patched));
console.log(`7 guard closure holds the tool, patched settings: ${hookModuleClosure(fx).includes('scripts/workflow-gates/code-check.mjs')}`);
rmSync(fx, { recursive: true, force: true });

for (const file of ['scripts/workflow-gates/code-check.mjs', 'scripts/workflow-gates/code-check.json', 'scripts/workflow-gates/hook-differential.mjs', 'scripts/workflow-gates/hook-corrections.json', 'scripts/workflow-gates/code-check.selftest.mjs', '.claude/settings.json', '.claude/rules/shared/workflow-gates.md']) console.log(`8 isPolicyPath ${file}: ${isPolicyPath(file)}`);

const manifest = JSON.parse(readFileSync('scripts/workflow-gates/publication.json', 'utf8'));
console.log(`9 publication.json ownedFiles holds the tool today: ${manifest.ownedFiles.includes('scripts/workflow-gates/code-check.mjs')}`);
const selftests = readFileSync('scripts/workflow-gates/selftests.mjs', 'utf8');
console.log(`10 selftests.mjs finds tests by name: ${/selftest\\?\.mjs/.test(selftests)}; ${selftests.split('\n').find(line => /selftest/.test(line))?.trim().slice(0, 120)}`);
const readers = readdirSync('scripts/workflow-gates').filter(name => /\.(?:mjs|json)$/.test(name)).filter(name => /PostToolUse|SubagentStop/.test(readFileSync(join('scripts/workflow-gates', name), 'utf8')));
console.log(`11 files of the gates that name PostToolUse or SubagentStop: ${JSON.stringify(readers)}`);
const scan = spawnSync('git', ['grep', '-n', '-E', 'hooks\\.(PostToolUse|SubagentStop)|Object\\.(keys|entries|values)\\(.*\\.hooks', '--', 'scripts', '.claude/hooks'], { encoding: 'utf8' });
console.log(`12 readers of the settings hooks:\n${scan.stdout.split('\n').filter(Boolean).map(line => `   ${line.slice(0, 140)}`).join('\n')}`);

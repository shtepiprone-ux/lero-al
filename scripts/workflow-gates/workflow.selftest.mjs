import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateWorkflow, validateSettings, validateRuleset } from './check-workflow.mjs';
import { publicationErrors } from './publication.mjs';
import { scanSource as badgeSource } from '../check-badge-canonical.mjs';
import { scanSource as dialogSource } from '../check-dialog-canonical.mjs';
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const policy = read('scripts/workflow-gates/pipeline.json');
const source = read('.github/workflows/governance-pr.yml');
test('actual workflow keeps every mandatory job, summary and release blocker', () => {
  assert.deepEqual(validateWorkflow(source, policy), []);
});
test('workflow rejects path filters, a skipped summary, omitted dependency and nonblocking checks', () => {
  const workflow = structuredClone(source);
  workflow.on.push.paths = ['src/**'];
  workflow.jobs['governance-required'].if = '${{ success() }}';
  workflow.jobs['governance-required'].needs.pop();
  workflow.jobs['locale-leak'].steps[0]['continue-on-error'] = true;
  const errors = validateWorkflow(workflow, policy).join('\n');
  for (const p of [/path-filter/, /summary must run/, /depend on every/, /continue-on-error/]) assert.match(errors, p);
});
test('workflow rejects privileged PR trigger, persistent credentials, missing shard and unprotected secret job', () => {
  const workflow = structuredClone(source);
  workflow.on.pull_request_target = {};
  workflow.jobs.unit.steps[0].with['persist-credentials'] = true;
  workflow.jobs.unit.steps[0].uses = 'actions/checkout@v5';
  workflow.jobs['locale-leak'].strategy.matrix.shard.pop();
  delete workflow.jobs['click-shield'].environment;
  const errors = validateWorkflow(workflow, policy).join('\n');
  for (const p of [/pull_request_target/, /credentials/, /six-way/, /security-ci/, /full commit SHA/]) assert.match(errors, p);
});
test('actual hook registration is complete and fails closed on runtime failure', () => {
  const settings = read('.claude/settings.json');
  assert.deepEqual(validateSettings(process.cwd(), settings), []);
  delete settings.hooks.PreToolUse[0].hooks[0].onFailure;
  assert.match(validateSettings(process.cwd(), settings).join('\n'), /runtime failures/);
  settings.disableAllHooks = true; settings.hooks.SessionStart = []; settings.claudeMdExcludes.push('**/CLAUDE.md');
  const errors = validateSettings(process.cwd(), settings).join('\n');
  for (const p of [/may not be disabled/, /entry instructions/, /sonnet-executor-bootstrap/]) assert.match(errors, p);
});
test('prepared direct-push safety ruleset offers no bypass actor', () => {
  const ruleset = read('scripts/workflow-gates/main.ruleset.json');
  assert.deepEqual(validateRuleset(ruleset), []);
  ruleset.bypass_actors.push({ actor_type: 'RepositoryRole', actor_id: 5, bypass_mode: 'always' });
  const errors = validateRuleset(ruleset).join('\n');
  assert.match(errors, /bypass/);
});

test('owner PR policy (2026-11-01) requires a PR and both stable Actions summaries on an up-to-date branch', () => {
  const ruleset = read('scripts/workflow-gates/main.ruleset.json');
  for (const type of ['pull_request', 'required_status_checks']) {
    const plant = structuredClone(ruleset); plant.rules = plant.rules.filter(r => r.type !== type);
    assert.match(validateRuleset(plant).join('\n'), new RegExp(type), type);
  }
  for (const mutate of [p => p.required_status_checks.pop(), p => { p.strict_required_status_checks_policy = false; },
    p => { delete p.required_status_checks[0].integration_id; }]) {
    const plant = structuredClone(ruleset); mutate(plant.rules.find(r => r.type === 'required_status_checks').parameters);
    assert.match(validateRuleset(plant).join('\n'), /stable summaries/);
  }
});

test('disabled mandatory steps and narrowed hook matchers cannot pass structural validation', () => {
  const workflow = structuredClone(source);
  workflow.jobs.unit.steps.find(s => s.run?.startsWith('npm test')).if = '${{ false }}';
  assert.match(validateWorkflow(workflow, policy).join('\n'), /conditional|disabled/i);
  const settings = read('.claude/settings.json');
  settings.hooks.PreToolUse[0].matcher = 'NoSuchTool';
  settings.hooks.PreToolUse[0].hooks[0].async = true;
  assert.match(validateSettings(process.cwd(), settings).join('\n'), /matcher|background/i);
});

test('a later main push cannot cancel or replace the verification of an earlier pushed commit', () => {
  // GATES_BASE_SHA is github.event.before, so a cancelled or replaced push run leaves that commit's range unchecked.
  for (const concurrency of [
    { group: 'governance-${{ github.event_name }}-${{ github.ref }}', 'cancel-in-progress': false },
    { group: source.concurrency.group, 'cancel-in-progress': true },
  ]) {
    const workflow = structuredClone(source); workflow.concurrency = concurrency;
    assert.match(validateWorkflow(workflow, policy).join('\n'), /concurrency/i);
  }
});

test('artifact actions run on the supported node24 runtime pins', () => {
  const pins = read('scripts/workflow-gates/actions.json').pins;
  assert.equal(pins['actions/upload-artifact'], 'cf430e030ddbb5b0abf93d22962f4752f3646cd9');
  assert.equal(pins['actions/download-artifact'], '9000827ccba6bdab643e8b6fd33ac0654aef8333');
});

test('CI retains the dated locale migration exception while render failures stay blocking', () => {
  const command = source.jobs['locale-leak'].steps.find(s => s.run?.includes('check-locale-leak.mjs')).run;
  assert.match(command, /--report-only-leaks/);
});

test('publication checks real imports, not source snippets, and refuses missing command dependencies', () => {
  const files = new Map([
    ['package.json', JSON.stringify({ scripts: { fixture: 'node scripts/run.mjs' } })],
    ['scripts/workflow-gates/pipeline.json', JSON.stringify({ groups: { fixture: [['npm', 'run', 'fixture']] } })],
    ['.github/workflows/governance-pr.yml', '{"jobs":{}}'], ['.claude/settings.json', '{}'],
    ['scripts/run.mjs', "const example = `import x from './not-an-import.mjs'`;\nimport './required.mjs';"],
    ['scripts/required.mjs', 'export const guard = true;'],
  ]);
  const readCandidate = path => { if (!files.has(path)) throw Error('missing'); return files.get(path); };
  assert.deepEqual(publicationErrors(readCandidate, ['scripts/run.mjs']), []);
  files.delete('scripts/required.mjs');
  assert.match(publicationErrors(readCandidate, ['scripts/run.mjs']).join('\n'), /required.mjs/);
});

test('Linux and native Windows CI both discover the complete gate regression suite', () => {
  for (const id of ['governance', 'hooks']) assert.ok(source.jobs[id].steps.some(s => s.run === 'node scripts/workflow-gates/selftests.mjs'), id);
});

test('badge namespace access cannot bypass the existing canonical owner rule', () => {
  const path = 'src/components/NamespaceBadge.tsx';
  assert.ok(badgeSource(path, "import * as Core from '@mantine/core'; export const A=()=> <Core.Badge/>;").length);
  assert.deepEqual(badgeSource(path, "import * as Core from '@mantine/core'; export const A=()=> <Core.Box/>;"), []);
});

test('a named structured prop must actually be true and cannot be overridden by a later spread', () => {
  const path = 'src/components/StructuredDialog.tsx';
  for (const prop of ['structured={false}', 'structured={undefined}', 'structured={runtimeValue}', 'structured {...unknownProps}']) {
    assert.ok(dialogSource(path, `export const A=()=> <MantineModal ${prop}/>;`).length, prop);
  }
  for (const prop of ['structured', 'structured={true}', '{...knownProps} structured']) {
    assert.deepEqual(dialogSource(path, `export const A=()=> <MantineModal ${prop}/>;`), [], prop);
  }
});

test('import aliases preserve the same dialog/footer/button ancestry rule', () => {
  const imports = "import {MantineModal as Dialog, MantineDialogFooter as Footer, MantineButton as Action} from './canonical';";
  assert.ok(dialogSource('src/components/Dialogs.tsx', `${imports} export const A=()=> <Dialog structured><Action/></Dialog>;`).length);
  assert.deepEqual(dialogSource('src/components/Dialogs.tsx', `${imports} export const A=()=> <Dialog structured footer={<Footer primary={<Action/>}/>}/>;`), []);
});

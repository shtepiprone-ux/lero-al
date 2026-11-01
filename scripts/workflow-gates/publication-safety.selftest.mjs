import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reportErrors, pushCommands, handoffErrors, blobId, trackedTreeErrors, rulesetErrors } from './push-safety.mjs';
import { localPlan, preflightErrors, runCommand } from './prepush.mjs';
import { ciErrors } from './ci-status.mjs';
import { scopeDigest } from './contract.mjs';

const read = file => JSON.parse(readFileSync(file, 'utf8'));
const workflow = read('.github/workflows/governance-pr.yml');
const policy = read('scripts/workflow-gates/pipeline.json');
const plan = localPlan(workflow, policy);
const now = Date.now();
const current = { head: 'a'.repeat(40), tree: 'b'.repeat(40), base: 'c'.repeat(40), remote: 'origin', branch: 'main',
  remoteUrl: 'https://github.com/shtepiprone-ux/lero-al.git', policySha256: 'd'.repeat(64), nodeVersion: '22.22.3', platform: 'win32', dirty: false };
const receipt = () => ({ ...current, version: 1, kind: 'local-prepush', status: 'passed', startedAt: new Date(now - 60000).toISOString(),
  completedAt: new Date(now - 1000).toISOString(), install: { code: 0, signal: null }, release: { code: 0, signal: null },
  jobs: plan.map(row => ({ id: row.id, status: 'passed', commands: row.commands, results: row.commands.map(() => ({ code: 0, signal: null })) })) });

test('prepush covers all eight mandatory jobs and all six locale shards from actual CI commands', () => {
  assert.equal(plan.length, 13);
  assert.deepEqual([...new Set(plan.map(row => row.job))].sort(), [...policy.requiredJobs].sort());
  assert.equal(plan.filter(row => row.job === 'locale-leak').length, 6);
  assert.ok(plan.find(row => row.id === 'unit').commands.some(args => args.includes('--allowOnly=false') && args.includes('--retry=0')));
  assert.deepEqual(reportErrors(receipt(), current, plan, now), []);
});
test('no red, omitted, duplicated, skipped or timed-out job can authorize push', () => {
  for (const mutate of [r => r.jobs.pop(), r => r.jobs.push(r.jobs[0]), r => r.jobs[0].status = 'skipped',
    r => r.jobs[0].results[0].code = 1, r => r.jobs[0].results[0].signal = 'SIGTERM',
    r => r.jobs[0].results.pop(), r => r.install.code = 1, r => r.status = 'failed',
    r => r.jobs[0].commands = [], r => r.release.code = 1]) {
    const r = receipt(); mutate(r); assert.ok(reportErrors(r, current, plan, now).length);
  }
});
test('stale tree, base, runtime, policy, environment, worktree and expired receipts fail closed', () => {
  for (const key of ['head', 'tree', 'base', 'remote', 'remoteUrl', 'branch', 'policySha256', 'nodeVersion', 'platform']) {
    assert.ok(reportErrors(receipt(), { ...current, [key]: 'changed' }, plan, now).length, key);
  }
  assert.ok(reportErrors(receipt(), { ...current, dirty: true }, plan, now).length);
  for (const time of [now - 3600001, now + 1, NaN]) {
    const r = receipt(); r.completedAt = Number.isFinite(time) ? new Date(time).toISOString() : 'invalid';
    assert.ok(reportErrors(r, current, plan, now).length);
  }
});
test('a changed CI command is executed or rejected; unsupported shell code cannot be silently skipped', () => {
  const changed = structuredClone(workflow);
  changed.jobs.unit.steps.push({ name: 'New mandatory check', run: 'node scripts/new-check.mjs' });
  assert.ok(localPlan(changed, policy).find(r => r.id === 'unit').commands.some(args => args.includes('scripts/new-check.mjs')));
  changed.jobs.unit.steps.push({ name: 'Unknown shell', run: 'echo ignored && exit 0' });
  assert.throws(() => localPlan(changed, policy), /Unsupported/);
  const reduced = structuredClone(policy); reduced.requiredJobs.pop();
  assert.throws(() => localPlan(workflow, reduced), /every core job/);
});
test('push detection covers executable fences, global options, chained commands, exe paths and wrappers', () => {
  for (const text of ['git push origin main', 'git -C . push origin main', 'git.exe push origin main',
    '& "C:/Program Files/Git/bin/git.exe" push origin main', 'git commit -m "scope"; git push origin main',
    'powershell -Command "git push origin main"', '```powershell\ngit push origin main\n```', '```text\ngit push origin main\n```', '`git push origin main`']) assert.ok(pushCommands(text).length, text);
  for (const text of ['Push is currently blocked.', '> git push origin main', 'git commit -m "fix: push safety"',
    'Use git to publish after review.']) assert.deepEqual(pushCommands(text), [], text);
});
test('incident 2026-11-01: inline code, table cells and labelled prose are push handoffs too', () => {
  for (const [text, command] of [
    ['APPROVED\nУ окремому вікні PowerShell виконай: `git push origin main`', 'git push origin main'],
    ['| 2 | `git push origin main` |', 'git push origin main'],
    ['**Push:** git push origin main', 'git push origin main'],
    ['The command `git push` requires verification.', 'git push'],
    ['Run `git push -u origin task/923-fix` now.', 'git push -u origin task/923-fix'],
  ]) assert.deepEqual(pushCommands(text), [command], text);
});
const orchestrator = { agent_type: 'orchestrator' };
const activeRules = async () => [];
test('main is reachable only through a PR: direct, bare, forced or refspec pushes are rejected', async () => {
  for (const command of ['git push origin main', 'git push', 'git push origin', 'git push origin HEAD', 'git push origin task/x:main',
    'git push --force origin task/x', 'git push origin +task/x', 'git push origin --delete task/x', 'git push --tags origin task/x',
    'git push -u origin task/x main', 'git push origin refs/heads/task/x']) {
    const errors = await handoffErrors('.', { ...orchestrator, last_assistant_message: `APPROVED\n\`${command}\`` }, { rules: activeRules });
    assert.ok(errors.length, command);
  }
  for (const command of ['git push -u origin task/923-fix', 'git push origin task/main-nav', 'git push --set-upstream origin fix/locale.6']) {
    assert.deepEqual(await handoffErrors('.', { ...orchestrator, last_assistant_message: `APPROVED\n\`${command}\`` }, { rules: activeRules }), [], command);
  }
});
test('a branch push or merge handoff needs the orchestrator, APPROVED and an active GitHub ruleset', async () => {
  const text = 'APPROVED\n`git push -u origin task/923-fix`';
  for (const event of [{}, { model: 'sonnet' }, { agent_type: 'executor' }]) {
    assert.ok((await handoffErrors('.', { ...event, last_assistant_message: text }, { rules: activeRules })).length);
  }
  assert.ok((await handoffErrors('.', { ...orchestrator, last_assistant_message: '`git push -u origin task/923-fix`' }, { rules: activeRules })).length);
  assert.deepEqual(await handoffErrors('.', { ...orchestrator, last_assistant_message: text }, { rules: async () => ['inactive'] }), ['inactive']);
  for (const merge of ['gh pr merge 12 --squash --admin', 'gh pr merge 12 --auto --squash', 'gh pr merge --squash', 'gh pr merge 12']) {
    assert.ok((await handoffErrors('.', { ...orchestrator, last_assistant_message: `APPROVED\n\`${merge}\`` }, { rules: activeRules })).length, merge);
  }
  assert.deepEqual(await handoffErrors('.', { ...orchestrator, last_assistant_message: 'APPROVED\n`gh pr merge 12 --squash --delete-branch`' }, { rules: activeRules }), []);
  assert.ok((await handoffErrors('.', { ...orchestrator, last_assistant_message: `${text}\n\`gh pr merge 12 --squash\`` }, { rules: activeRules })).length);
});
test('GitHub branch rules must enforce PR, both stable checks, force-push and deletion protection', () => {
  const rules = [{ type: 'deletion' }, { type: 'non_fast_forward' }, { type: 'pull_request' }, { type: 'required_status_checks',
    parameters: { required_status_checks: [{ context: 'Governance Required' }, { context: 'Release Security Required' }] } }];
  assert.deepEqual(rulesetErrors(rules), []);
  assert.ok(rulesetErrors([]).length);
  assert.ok(rulesetErrors(null).length);
  for (let index = 0; index < rules.length; index++) assert.ok(rulesetErrors(rules.filter((_, i) => i !== index)).length);
  const partial = structuredClone(rules); partial[3].parameters.required_status_checks.pop();
  assert.match(rulesetErrors(partial).join('\n'), /Release Security Required/);
});
test('role, clean tree and stale transcripts cannot bypass a push; later correction recovers', async () => {
  for (const event of [{}, { model: 'opus' }, { model: 'sonnet' }, { stop_hook_active: true }]) {
    assert.ok((await handoffErrors('.', { ...event, last_assistant_message: 'APPROVED\ngit push origin main' }, { rules: activeRules })).length);
    assert.deepEqual(await handoffErrors('.', { ...event, last_assistant_message: 'Missing local evidence.\nBLOCKED' }), []);
  }
  const root = mkdtempSync(join(tmpdir(), 'lero-publication-transcript-'));
  try {
    const path = join(root, 'session.jsonl');
    writeFileSync(path, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'APPROVED\ngit push origin main' }] } }));
    assert.deepEqual(await handoffErrors('.', { transcript_path: path, last_assistant_message: 'Evidence unavailable.\nBLOCKED' }), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('a PR run expects pull_request-excluded summaries to be skipped; main requires them to succeed', () => {
  const sha = current.head;
  const prRun = { id: 7, head_sha: sha, head_branch: 'task/x', event: 'pull_request', path: '.github/workflows/governance-pr.yml', status: 'completed', conclusion: 'success' };
  const jobs = Object.values(workflow.jobs).flatMap(job => (job.strategy?.matrix?.shard || [null]).map(shard => ({
    name: shard === null ? job.name : job.name.replace('${{ matrix.shard }}', String(shard)),
    status: 'completed', conclusion: /pull_request/.test(job.if || '') ? 'skipped' : 'success', head_sha: sha, run_id: 7,
  })));
  assert.deepEqual(ciErrors(prRun, jobs, sha, workflow, { event: 'pull_request', branch: 'task/x' }), []);
  assert.ok(ciErrors(prRun, jobs, sha, workflow).length, 'a PR run is never main-push evidence');
  const red = structuredClone(jobs); red.find(j => j.name === 'Governance Required').conclusion = 'failure';
  assert.ok(ciErrors(prRun, red, sha, workflow, { event: 'pull_request', branch: 'task/x' }).length);
});
test('post-push CI success requires the exact SHA, all matrix children, terminal summaries and current attempt', () => {
  const sha = current.head;
  const run = { id: 42, head_sha: sha, head_branch: 'main', event: 'push', path: '.github/workflows/governance-pr.yml', status: 'completed', conclusion: 'success' };
  const jobs = Object.values(workflow.jobs).flatMap(job => (job.strategy?.matrix?.shard || [null]).map(shard => ({
    name: shard === null ? job.name : job.name.replace('${{ matrix.shard }}', String(shard)),
    status: 'completed', conclusion: 'success', head_sha: sha, run_id: 42,
  })));
  assert.deepEqual(ciErrors(run, jobs, sha, workflow), []);
  assert.ok(ciErrors({ ...run, head_sha: current.base }, jobs, sha, workflow).length);
  assert.ok(ciErrors({ ...run, status: 'in_progress' }, jobs, sha, workflow).length);
  for (const mutate of [j => j.pop(), j => j[0].conclusion = 'skipped', j => j[0].head_sha = current.base, j => j[0].run_id = 41]) {
    const copy = structuredClone(jobs); mutate(copy); assert.ok(ciErrors(run, copy, sha, workflow).length);
  }
});

test('split workflow policy stays bound to retained security evidence', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-split-policy-'));
  try {
    const dir = join(root, '.claude/rules/shared'); mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'workflow-gates.md'), '## Required companions\nworkflow-contract.md workflow-evidence.md workflow-ci.md git-publication.md');
    for (const name of ['workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication']) writeFileSync(join(dir, `${name}.md`), 'Original synthetic policy.');
    const contract = { scope: [], cases: [], rules: ['.claude/rules/shared/workflow-gates.md'] };
    const before = scopeDigest(root, contract);
    writeFileSync(join(dir, 'workflow-evidence.md'), 'Changed required synthetic policy.');
    assert.notEqual(scopeDigest(root, contract), before, 'Splitting a hashed policy must not unbind its required sections');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('prepush blocks unpublished inputs and local env auto-loading without reading secret content', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-prepush-inputs-'));
  try {
    writeFileSync(join(root, '.env.local'), 'SYNTHETIC_SENTINEL=not-a-real-secret');
    const errors = preflightErrors(root, { ...current, dirty: true }, policy).join('\n');
    assert.match(errors, /untracked/); assert.match(errors, /env files/);
    assert.doesNotMatch(errors, /SYNTHETIC_SENTINEL/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('real prepush child execution retains nonzero exits and raw log digest', async () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-prepush-process-'));
  try {
    mkdirSync(join(root, 'test-results/workflow-gates/prepush'), { recursive: true });
    const result = await runCommand(root, ['node', '-e', 'console.error("Synthetic gate failure");process.exit(7)'], {}, 'failure', 3000);
    assert.equal(result.code, 7); assert.match(readFileSync(join(root, result.log), 'utf8'), /Synthetic gate failure/);
    assert.equal(result.logSha256.length, 64);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('tracked byte inspection detects hidden edits independently of Git status flags', () => {
  const root = mkdtempSync(join(tmpdir(), 'lero-tracked-bytes-'));
  try {
    const original = Buffer.from('original text\n');
    const entries = [`100644 blob ${blobId(original)}\tfile.txt`];
    writeFileSync(join(root, 'file.txt'), original);
    assert.deepEqual(trackedTreeErrors(root, entries), []);
    writeFileSync(join(root, 'file.txt'), 'hidden modification\n');
    assert.match(trackedTreeErrors(root, entries).join('\n'), /differ from HEAD/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

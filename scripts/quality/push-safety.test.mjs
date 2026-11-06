// node --test scripts/quality/push-safety.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { commands, pushProblems, mergeProblems, evaluate } from './push-safety.mjs';

const BRANCH = 'task/945-agent-loop';
const green = { state: 'OPEN', baseRefName: 'main', statusCheckRollup: [{ name: 'CI Required', status: 'COMPLETED', conclusion: 'SUCCESS' }] };
const env = (pr = green) => ({ branch: () => BRANCH, pr: () => pr });
const G = 'g' + 'it';

test('the current task branch may be pushed to origin', () => {
  assert.deepEqual(evaluate(`Run \`${G} push -u origin ${BRANCH}\` in PowerShell.`, env()), []);
  assert.deepEqual(evaluate(`${G} push origin ${BRANCH}`, env()), []);
  assert.deepEqual(evaluate('No publication command here.', env()), []);
  // A branch the same reply creates first may be pushed; one it does not create may not.
  assert.deepEqual(evaluate(`${G} switch -c governance/reset\n${G} commit -m x\n${G} push -u origin governance/reset`, env()), []);
  assert.deepEqual(evaluate(`${G} checkout -b fix/a\n${G} push origin fix/a`, env()), []);
  assert.ok(evaluate(`${G} switch -c fix/a\n${G} push origin fix/b`, env()).length > 0);
  assert.ok(evaluate(`${G} switch -c main\n${G} push origin main`, env()).length > 0);
});

test('main, force, delete, mirror, other branches and wrapped pushes are refused', () => {
  const refused = (line) => evaluate(line, env()).length > 0;
  assert.ok(refused(`${G} push origin main`));
  assert.ok(refused(`${G} push origin HEAD:main`));
  assert.ok(refused(`${G} push origin ${BRANCH}:main`));
  assert.ok(refused(`${G} push --force origin ${BRANCH}`));
  assert.ok(refused(`${G} push -f origin ${BRANCH}`));
  assert.ok(refused(`${G} push --force-with-lease origin ${BRANCH}`));
  assert.ok(refused(`${G} push origin +${BRANCH}`));
  assert.ok(refused(`${G} push --delete origin ${BRANCH}`));
  assert.ok(refused(`${G} push --mirror origin`));
  assert.ok(refused(`${G} push`));
  assert.ok(refused(`${G} push upstream ${BRANCH}`));
  assert.ok(refused(`${G} push origin task/other`));
  assert.ok(refused(`${G} -c core.sshCommand=x push origin ${BRANCH}`));
  assert.ok(refused(`powershell -Command "${G} push origin ${BRANCH}"`));
});

test('a squash merge is allowed only while CI Required is green on an open PR to main', () => {
  assert.deepEqual(evaluate('gh pr merge 12 --squash', env()), []);
  assert.deepEqual(evaluate('gh pr merge 12 --squash --delete-branch', env()), []);
  const reasons = (line, pr) => evaluate(line, env(pr)).join('\n');
  assert.match(reasons('gh pr merge 12 --merge'), /squash merges only/);
  assert.match(reasons('gh pr merge 12 --squash --admin'), /bypasses the ruleset/);
  assert.match(reasons('gh pr merge --squash'), /PR number/);
  assert.match(reasons('gh pr merge 12 --squash', { ...green, statusCheckRollup: [{ name: 'CI Required', status: 'IN_PROGRESS', conclusion: '' }] }), /CI Required is IN_PROGRESS/);
  assert.match(reasons('gh pr merge 12 --squash', { ...green, statusCheckRollup: [{ name: 'CI Required', conclusion: 'FAILURE' }] }), /FAILURE/);
  assert.match(reasons('gh pr merge 12 --squash', { ...green, statusCheckRollup: [] }), /missing/);
  assert.match(reasons('gh pr merge 12 --squash', { ...green, state: 'MERGED' }), /is MERGED/);
  assert.match(reasons('gh pr merge 12 --squash', { ...green, baseRefName: 'develop' }), /targets develop/);
  assert.match(reasons('gh pr merge 12 --squash', null), /could not be read/);
});

test('parsing finds commands in prose, inline code and fences', () => {
  const c = commands(`text \`${G} push origin a\`\n\`\`\`\n${G} push origin b\n\`\`\`\ngh pr merge 3 --squash`);
  assert.deepEqual(c.push.map((p) => p.args), ['origin a', 'origin b']);
  assert.deepEqual(c.merge.map((m) => m.args), ['3 --squash']);
  assert.deepEqual(pushProblems({ prefix: '', args: 'origin HEAD' }, BRANCH), []);
  assert.ok(pushProblems({ prefix: '', args: 'origin HEAD' }, 'main').length > 0);
  assert.ok(mergeProblems({ args: '7 --rebase' }, green).some((x) => /squash/.test(x)));
});

test('the command line blocks with exit 2 and a reason, and passes a reply without commands', () => {
  const script = fileURLToPath(new URL('./push-safety.mjs', import.meta.url));
  const runWith = (message) => spawnSync(process.execPath, [script], { input: JSON.stringify({ last_assistant_message: message }), encoding: 'utf8' });
  const blocked = runWith(`${G} push origin main`);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /main is changed only through a PR/);
  assert.equal(runWith('nothing to publish').status, 0);
  const broken = spawnSync(process.execPath, [script], { input: 'not json', encoding: 'utf8' });
  assert.equal(broken.status, 2);
  assert.match(broken.stderr, /could not verify/);
});

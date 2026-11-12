// node --test scripts/quality/pipeline.test.mjs
// The step-by-step pipeline (owner, 2026-11-10: nothing is done partially; tasks are created, executed and reviewed
// step by step). Each rule of pipeline.mjs has a case that fails when the rule is removed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  changedPaths, ciSummary, designPart, fingerprint, isComplete, kickoffTestRuns, loadPhases, missingRoutePaths,
  namedCommands, phaseSummaries, readLedger, runPhase, stagedByReply, stopFindings, verdictLines,
} from './pipeline.mjs';
import { loadVocabulary } from './claims.mjs';
import { killTree, processList } from './load-watch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'pipeline-'));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main', ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  git('init', '-q');
  writeFileSync(path.join(root, 'a.txt'), 'one\n');
  writeFileSync(path.join(root, 'b.txt'), 'two\n');
  git('add', '.');
  git('commit', '-q', '-m', 'base');
  return { root, git, done: () => rmSync(root, { recursive: true, force: true }) };
}

test('fingerprint: an edited, an untracked and a deleted file each change it; the same files give the same one', () => {
  const f = fixture();
  const fp0 = fingerprint('tree', { root: f.root });
  assert.equal(fingerprint('tree', { root: f.root }), fp0);
  writeFileSync(path.join(f.root, 'a.txt'), 'one!\n');
  const fp1 = fingerprint('tree', { root: f.root });
  assert.notEqual(fp1, fp0);
  writeFileSync(path.join(f.root, 'new.txt'), 'n\n');
  const fp2 = fingerprint('tree', { root: f.root });
  assert.notEqual(fp2, fp1);
  unlinkSync(path.join(f.root, 'b.txt'));
  const fp3 = fingerprint('tree', { root: f.root });
  assert.notEqual(fp3, fp2);
  assert.deepEqual(Object.keys(changedPaths(f.root)).sort(), ['a.txt', 'b.txt', 'new.txt']);
  assert.equal(changedPaths(f.root)['b.txt'], '-');
  writeFileSync(path.join(f.root, '__proto__'), 'p\n');
  const withProto = changedPaths(f.root);
  assert.ok(Object.keys(withProto).includes('__proto__'), 'a file named __proto__ is a key, not the prototype');
  assert.equal(Object.getPrototypeOf(withProto), null);
  f.done();
});

test('runPhase: steps run in order, the first failure stops the phase, and the ledger is bound to the files', () => {
  const f = fixture();
  const marker = path.join(f.root, 'ran-third.txt');
  const phases = { demo: { role: 'Opus', scope: 'tree', steps: [
    { id: 'one', argv: ['node', '-e', 'process.exit(0)'] },
    { id: 'two', argv: ['node', '-e', 'process.exit(3)'] },
    { id: 'three', argv: ['node', '-e', `require('fs').writeFileSync(${JSON.stringify(marker)}, 'x')`] },
  ] } };
  const r = runPhase('demo', { root: f.root, phases });
  assert.equal(r.complete, false);
  assert.equal(r.failed, 'two');
  assert.deepEqual(r.ledger.steps.map((s) => [s.id, s.exit]), [['one', 0], ['two', 3]]);
  assert.throws(() => readFileSync(marker), /ENOENT/, 'a step after the failing one never runs');
  const ok = { demo: { role: 'Opus', scope: 'tree', steps: phases.demo.steps.slice(0, 1) } };
  const r2 = runPhase('demo', { root: f.root, phases: ok });
  assert.equal(r2.complete, true);
  const ledger = readLedger('demo', null, f.root);
  assert.equal(isComplete(ledger, ok.demo, fingerprint('tree', { root: f.root })), true);
  writeFileSync(path.join(f.root, 'a.txt'), 'changed after the run\n');
  assert.equal(isComplete(ledger, ok.demo, fingerprint('tree', { root: f.root })), false, 'a ledger of other files is not complete');
  assert.equal(isComplete(ledger, phases.demo, ledger.fingerprint), false, 'a ledger missing a step is not complete');
  assert.throws(() => runPhase('demo', { root: f.root, phases: ok, base: '--output=x' }), /refused base/);
  f.done();
});

test('runPhase: under NEEDS REVISION a review runs the variant and skips the gate; any other verdict runs both, and only a skipping run under revision counts the skip', () => {
  // Task 964 Review 1 (owner, 2026-11-11): the OWASP task gate needs a task approved by review, so a NEEDS REVISION
  // review could never complete its phase and its verdict was refused by the stop hook
  const f = fixture();
  const kickoff = 'tasks/Sprints/Sprint_93_kickoff_prompt_Task_999_Demo.md';
  mkdirSync(path.join(f.root, 'tasks', 'Sprints'), { recursive: true });
  const write = (verdict) => writeFileSync(path.join(f.root, kickoff), `# Task 999\n\n## Review\n\nReview 1 of x — ${verdict}\n`);
  // outside the repository: a file the step writes inside it would change the tree the ledger is bound to
  const out = mkdtempSync(path.join(os.tmpdir(), 'pipeline-variant-'));
  const marker = path.join(out, 'variant-ran.txt');
  const phases = { review: { role: 'Opus', scope: 'tree', steps: [
    { id: 'local', argv: ['node', '-e', 'process.exit(0)'], underRevision: ['node', '-e', `require('fs').writeFileSync(${JSON.stringify(marker)}, 'x')`] },
    { id: 'gate', argv: ['node', '-e', 'process.exit(1)'], underRevision: 'skip' },
  ] } };
  try {
    write('NEEDS REVISION');
    const r = runPhase('review', { root: f.root, kickoff, phases });
    assert.equal(r.complete, true, r.failed);
    assert.equal(r.ledger.underRevision, true);
    assert.equal(readFileSync(marker, 'utf8'), 'x', 'the underRevision argv ran instead of the plain one');
    assert.deepEqual(r.ledger.steps.map((s) => [s.id, s.exit, !!s.skipped]), [['local', 0, false], ['gate', null, true]]);
    assert.equal(isComplete(r.ledger, phases.review, fingerprint('tree', { root: f.root })), true);
    // the skip counts only in a run under revision that skipped the step
    assert.equal(isComplete({ ...r.ledger, underRevision: false }, phases.review, r.ledger.fingerprint), false);
    assert.equal(isComplete({ ...r.ledger, steps: r.ledger.steps.filter((s) => s.id !== 'gate') }, phases.review, r.ledger.fingerprint), false);
    // a verdict changed after the run makes the ledger stale
    write('APPROVED');
    assert.equal(isComplete(r.ledger, phases.review, fingerprint('tree', { root: f.root })), false);
    // APPROVED runs the plain argv and the gate, which fails here
    unlinkSync(marker);
    const a = runPhase('review', { root: f.root, kickoff, phases });
    assert.equal(a.complete, false);
    assert.equal(a.failed, 'gate');
    assert.equal(a.ledger.underRevision, undefined);
    assert.throws(() => readFileSync(marker), /ENOENT/, 'the plain argv ran');
    // a phase whose steps name no variant ignores the verdict (the handoff)
    write('NEEDS REVISION');
    const plain = { handoff: { role: 'Opus', scope: 'tree', steps: [{ id: 'gate', argv: ['node', '-e', 'process.exit(1)'] }] } };
    assert.equal(runPhase('handoff', { root: f.root, kickoff, phases: plain }).failed, 'gate');
  } finally {
    rmSync(out, { recursive: true, force: true });
    f.done();
  }
});

test('runPhase: a step past its deadline fails at the deadline, though a process it started holds its output, and stops the phase', { timeout: 60000 }, () => {
  // a step's output through a pipe held the phase as long as any process it left lived (owner, 2026-11-11: "monitor
  // every stage and its status")
  const f = fixture();
  const marker = `pipeline-orphan-${process.pid}-${Date.now()}`;
  const hold = `const { spawn } = require('child_process'); spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)', '${marker}'], { stdio: 'inherit' }); setInterval(() => {}, 1000);`;
  const phases = { demo: { role: 'Opus', scope: 'tree', steps: [{ id: 'hangs', argv: ['node', '-e', hold] }, { id: 'after', argv: ['node', '-e', 'process.exit(0)'] }] } };
  const t0 = Date.now();
  try {
    const r = runPhase('demo', { root: f.root, phases, timeoutMs: 2000 });
    assert.ok(Date.now() - t0 < 20_000, `the phase returned ${Date.now() - t0} ms after the start`);
    assert.equal(r.failed, 'hangs');
    assert.deepEqual(r.ledger.steps.map((s) => [s.id, s.exit]), [['hangs', 124]], 'the step after it never ran');
    assert.match(r.ledger.steps[0].summary, /timed out after/);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    assert.deepEqual(processList().filter((p) => p.cmd.includes(marker)).map((p) => p.cmd), [], 'the process the step left is stopped');
  } finally {
    for (const p of processList().filter((x) => x.cmd.includes(marker))) killTree(p.pid);
    f.done();
  }
});

test('the phases cover both models, and every skill runs its phase and names each of its steps', () => {
  const phases = loadPhases(ROOT);
  assert.deepEqual(Object.keys(phases).sort(), ['design', 'execute', 'handoff', 'review']);
  assert.equal(phases.execute.role, 'Sonnet');
  for (const p of ['design', 'review', 'handoff']) assert.equal(phases[p].role, 'Opus');
  for (const [name, def] of Object.entries(phases)) {
    const skill = readFileSync(path.join(ROOT, '.claude', 'skills', def.skill, 'SKILL.md'), 'utf8');
    assert.match(skill, new RegExp(`pipeline\\.mjs run ${name}\\b`), `${def.skill} runs the ${name} phase`);
    for (const s of def.steps) assert.ok(skill.includes(`\`${s.id}\``), `${def.skill} names step ${s.id} of ${name}`);
  }
  for (const p of ['review', 'handoff']) {
    const ids = phases[p].steps.map((s) => s.id);
    assert.ok(ids.includes('ci-local') && ids.includes('ruleset') && ids.indexOf('ci-local') < ids.indexOf('owasp-gate'), `${p} checks the ruleset and runs every CI job locally before the gate`);
    assert.ok(ids.indexOf('claims') >= 0 && ids.indexOf('claims') < ids.indexOf('ci-local'), `${p}: the quick claims step fails before the long local CI run`);
  }
  // under NEEDS REVISION only the review holds the OWASP task gate, and every other CI job still runs
  const variants = Object.entries(phases).flatMap(([p, def]) => def.steps.filter((s) => s.underRevision).map((s) => [p, s.id, s.underRevision]));
  assert.deepEqual(variants, [
    ['review', 'ci-local', ['node', 'scripts/quality/ci-local.mjs', '--hold', 'owasp-gate']],
    ['review', 'owasp-gate', 'skip'],
  ]);
  const flow = readFileSync(path.join(ROOT, '.claude', 'rules', 'flow.md'), 'utf8');
  for (const name of Object.keys(phases)) assert.match(flow, new RegExp(`pipeline\\.mjs run ${name}\\b`), `flow.md names the ${name} phase`);
});

const KICKOFF = 'tasks/Sprints/Sprint_93_kickoff_prompt_Task_999_Demo.md';
const body = (review = '') => `# Task 999 — demo\n\n## Scope\n- new \`scripts/new-tool.mjs\`\n\n## Acceptance criteria\n- AC1 x — test: \`scripts/quality/demo.test.mjs\`\n- AC2 y — test: \`src/a/b.test.ts\` and \`node scripts/check-x.mjs --verify-gate\`\n- AC3 z — test: \`npm run check:stories\` and \`npm run evil; rm -rf /\`\n\n## Route\n1. run \`scripts/new-tool.mjs\` and \`scripts/missing.mjs\`\n\n## Review\n${review}`;

test('kickoff checks: every named test runs, commands only in the safe shapes, Route paths exist or are created', () => {
  const files = new Set(['scripts/quality/demo.test.mjs', 'src/a/b.test.ts']);
  const { runs, missing } = kickoffTestRuns(body(), { files, scripts: { 'check:stories': 'node scripts/check-stories.mjs' } });
  assert.deepEqual(missing, []);
  assert.deepEqual(runs, [
    ['node', '--test', 'scripts/quality/demo.test.mjs'],
    ['npx', 'vitest', 'run', 'src/a/b.test.ts'],
    ['node', 'scripts/check-x.mjs', '--verify-gate'],
    ['npm', 'run', 'check:stories'],
  ]);
  assert.deepEqual(kickoffTestRuns(body(), { files: new Set(['src/a/b.test.ts']) }).missing, ['AC1: scripts/quality/demo.test.mjs']);
  assert.deepEqual(namedCommands('`node ../x.mjs` `node scripts/a.mjs; whoami` `npm run nope` `node scripts/ok.mjs --a=1`', {}), [['node', 'scripts/ok.mjs', '--a=1']]);
  assert.deepEqual(missingRoutePaths(body(), () => false), ['scripts/missing.mjs']);
});

test('design and verdict: the design is the kickoff without its Review; verdict lines are read from the Review only', () => {
  assert.equal(designPart(body('Review 1 — APPROVED')), designPart(body()));
  assert.notEqual(designPart(body().replace('AC1 x', 'AC1 xx')), designPart(body()));
  assert.deepEqual(verdictLines(body('Review 1 (Opus, 2026-11-10) — NEEDS REVISION\nprose naming APPROVED')), ['Review 1 (Opus, 2026-11-10) — NEEDS REVISION']);
});

const yes = () => true;
const no = () => false;
const base = { event: 'Stop', changed: {}, complete: yes, ciStatus: () => null };

test('stop: a design change, a verdict and an implementation each need their complete phase', () => {
  const k = { path: KICKOFF, head: body(), now: body().replace('AC1 x', 'AC1 changed') };
  assert.match(stopFindings({ ...base, reply: 'done', kickoffs: [k], complete: no }).join('\n'), /run design/);
  assert.deepEqual(stopFindings({ ...base, reply: 'done', kickoffs: [k] }), []);
  const v = { path: KICKOFF, head: body(), now: body('Review 1 — APPROVED') };
  const only = (phase) => (p) => p !== phase;
  assert.match(stopFindings({ ...base, reply: 'done', kickoffs: [v], complete: only('review') }).join('\n'), /run review/);
  assert.deepEqual(stopFindings({ ...base, reply: 'done', kickoffs: [v], complete: only('design') }), [], 'a Review edit is not a design change');
  const exec = { ...base, event: 'SubagentStop', agentType: 'executor', reply: 'implemented', changed: { 'scripts/x.mjs': 'h' } };
  assert.match(stopFindings({ ...exec, complete: no }).join('\n'), /run execute/);
  assert.deepEqual(stopFindings({ ...exec, agentType: 'Explore', complete: no }), [], 'a read-only subagent is not an implementation');
  const execOnly = (phase, kickoff) => !(phase === 'execute' && kickoff === '*');
  const main = { ...base, reply: 'done', changed: { 'src/x.ts': 'h' } };
  assert.match(stopFindings({ ...main, complete: execOnly }).join('\n'), /run execute/, 'product code changed in the main session (Sonnet there) needs the execute phase too');
  assert.deepEqual(stopFindings({ ...main, changed: { 'scripts/quality/x.mjs': 'h' }, complete: execOnly }), [], "Opus's policy files are not product code");
});

test('a [pipeline: <phase>] number is backed only by a ledger complete for the files as they are', () => {
  const f = fixture();
  const phases = { demo: { role: 'Opus', scope: 'tree', steps: [{ id: 'one', argv: ['node', '-e', 'console.log("21 passed")'] }] } };
  runPhase('demo', { root: f.root, phases });
  assert.match(phaseSummaries('demo', { root: f.root, phases }), /21 passed/);
  writeFileSync(path.join(f.root, 'a.txt'), 'changed after the run\n');
  assert.equal(phaseSummaries('demo', { root: f.root, phases }), '', 'a stale ledger backs no number');
  f.done();
});

test('fingerprint: the code scope ignores documentation and task records; the tree scope does not', () => {
  const f = fixture();
  writeFileSync(path.join(f.root, 'a.txt'), 'code change\n');
  const code = fingerprint('code', { root: f.root });
  const tree = fingerprint('tree', { root: f.root });
  mkdirSync(path.join(f.root, 'tasks'), { recursive: true });
  writeFileSync(path.join(f.root, 'tasks', 'review.md'), 'a review written after the implementation\n');
  assert.equal(fingerprint('code', { root: f.root }), code);
  assert.notEqual(fingerprint('tree', { root: f.root }), tree);
  writeFileSync(path.join(f.root, 'a.txt'), 'another code change\n');
  assert.notEqual(fingerprint('code', { root: f.root }), code);
  f.done();
});

test('the stop hook finds a complete execute ledger of any task on disk (not only through a stubbed check)', () => {
  const f = fixture();
  mkdirSync(path.join(f.root, 'scripts', 'quality'), { recursive: true });
  writeFileSync(path.join(f.root, 'scripts', 'quality', 'pipeline-steps.json'), readFileSync(path.join(ROOT, 'scripts', 'quality', 'pipeline-steps.json')));
  f.git('add', '.');
  f.git('commit', '-q', '-m', 'steps');
  mkdirSync(path.join(f.root, 'src'), { recursive: true });
  writeFileSync(path.join(f.root, 'src', 'feature.ts'), 'export const x = 1\n');
  const hook = () => {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'quality', 'pipeline.mjs'), 'stop'], {
      cwd: f.root, encoding: 'utf8', windowsHide: true, env: { ...process.env, CLAUDE_PROJECT_DIR: f.root },
      input: JSON.stringify({ hook_event_name: 'SubagentStop', agent_type: 'executor', session_id: 'e', last_assistant_message: 'implemented' }),
    });
    return r.stdout ? JSON.parse(r.stdout) : {};
  };
  assert.match(hook().reason ?? '', /run execute/, 'no ledger: blocked');
  const phases = loadPhases(f.root);
  const dir = path.join(f.root, '.git', 'lero-al-pipeline');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'Task_999-execute.json'), JSON.stringify({ phase: 'execute', fingerprint: fingerprint('code', { root: f.root }), steps: phases.execute.steps.map((s) => ({ id: s.id, exit: 0 })) }));
  assert.equal(hook().decision, undefined, 'a complete execute ledger of Task 999 for this code: the stop goes through');
  writeFileSync(path.join(f.root, 'src', 'feature.ts'), 'export const x = 2\n');
  assert.match(hook().reason ?? '', /run execute/, 'the code changed after the run: blocked again');
  f.done();
});

test('stop: a commit or push handoff needs the handoff phase and stages exactly the changed files', () => {
  const changed = { 'a.mjs': 'h1', 'docs/b.md': 'h2' };
  const reply = 'git add a.mjs docs/b.md\ngit commit -m "x"\ngit push origin task/x';
  assert.deepEqual(stopFindings({ ...base, reply, changed }), []);
  assert.match(stopFindings({ ...base, reply, changed, complete: no }).join('\n'), /run handoff/);
  assert.match(stopFindings({ ...base, reply: 'git add a.mjs\ngit commit -m x\ngit push origin task/x', changed }).join('\n'), /leaves changed files out.*docs\/b\.md/);
  assert.match(stopFindings({ ...base, reply: 'git add a.mjs docs/b.md c.mjs\ngit commit -m x', changed }).join('\n'), /not changed: c\.mjs/);
  assert.deepEqual(stagedByReply('`git add -A`').all, true);
});

test('stop: a reply that names CI needs ci-status from this turn and its line verbatim, so a run in progress is never a result', () => {
  const vocab = loadVocabulary(ROOT);
  const st = { line: 'CI 49899c40f PR #28: 21 of 23 checks concluded, 1 failed, 0 unsigned commit(s)', at: 2000 };
  const claims = ['CI on PR #28 is green', 'PR #28: усі перевірки зелені', 'Lint на PR #28 червоний', 'PR #28 — `CI Required` failed'];
  for (const reply of claims) {
    const s = { ...base, reply, vocab, turnStart: 1000 };
    assert.match(stopFindings({ ...s, ciStatus: () => null }).join('\n'), /ci-status 28/, reply);
    assert.match(stopFindings({ ...s, ciStatus: () => st }).join('\n'), /verbatim/, reply);
    assert.match(stopFindings({ ...s, ciStatus: () => ({ ...st, at: 500 }) }).join('\n'), /in this turn/, reply);
  }
  assert.deepEqual(stopFindings({ ...base, vocab, reply: `PR #28 still running.\n${st.line}`, ciStatus: () => st, turnStart: 1000 }), []);
  // whatever the words, a turn that looked at CI needs the line; a subagent's stop does not report to the owner
  const plain = { ...base, vocab, reply: 'Усе гаразд, можна продовжувати.', turnStart: 1000, ciStatus: () => null };
  assert.deepEqual(stopFindings(plain), [], 'no mention and no look at CI: no line needed');
  assert.match(stopFindings({ ...plain, turnLookedAtCi: true }).join('\n'), /follows a look at CI.*ci-status/);
  assert.deepEqual(stopFindings({ ...plain, turnLookedAtCi: true, event: 'SubagentStop' }), []);
});

test('ci-status: pending checks are counted as not concluded, failures are named, passed only when all concluded green', () => {
  const s = ciSummary('28', '49899c40f435', [
    { name: 'Lint', bucket: 'fail' }, { name: 'Unit', bucket: 'pending' }, { name: 'Gate', bucket: 'pass' }, { name: 'Skip', bucket: 'skipping' },
  ]);
  assert.equal(s.line, 'CI 49899c40f PR #28: 3 of 4 checks concluded, 1 failed, 0 unsigned commit(s)');
  assert.deepEqual([s.done, s.passed, s.failed, s.pending], [false, false, ['Lint'], ['Unit']]);
  const g = ciSummary('28', 'abc', [{ name: 'A', bucket: 'pass' }, { name: 'B', bucket: 'pass' }]);
  assert.deepEqual([g.done, g.passed], [true, true]);
  assert.equal(ciSummary('28', 'abc', []).passed, false, 'no checks is not a pass');
  const u = ciSummary('28', 'abc', [{ name: 'A', bucket: 'pass' }], { unsigned: ['1234567ab'] });
  assert.deepEqual([u.done, u.passed], [true, false], 'an unsigned commit blocks the merge like a red check (main ruleset)');
  assert.match(u.line, /1 unsigned commit/);
});

test('the stop check fails closed and blocks through the hook, not only through the function', () => {
  const f = fixture();
  mkdirSync(path.join(f.root, 'scripts', 'quality'), { recursive: true });
  writeFileSync(path.join(f.root, 'scripts', 'quality', 'pipeline-steps.json'), readFileSync(path.join(ROOT, 'scripts', 'quality', 'pipeline-steps.json')));
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'quality', 'pipeline.mjs'), 'stop'], {
    cwd: f.root, encoding: 'utf8', windowsHide: true, env: { ...process.env, CLAUDE_PROJECT_DIR: f.root },
    input: JSON.stringify({ hook_event_name: 'Stop', session_id: 't', last_assistant_message: 'git add scripts/quality/pipeline-steps.json\ngit commit -m x\ngit push origin main' }),
  });
  assert.equal(r.status, 0);
  assert.match(JSON.parse(r.stdout).decision, /block/);
  assert.match(JSON.parse(r.stdout).reason, /run handoff/);
  // a payload the check cannot read blocks the stop instead of letting it through (fail closed)
  const broken = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'quality', 'pipeline.mjs'), 'stop'], {
    cwd: f.root, encoding: 'utf8', windowsHide: true, env: { ...process.env, CLAUDE_PROJECT_DIR: f.root }, input: '{ not json',
  });
  assert.equal(broken.status, 0);
  assert.equal(JSON.parse(broken.stdout).decision, 'block');
  assert.match(JSON.parse(broken.stdout).reason, /could not run \(fail closed\)/);
  f.done();
});

#!/usr/bin/env node
// Task 945 (owner D25, 2026-11-04): written code is always checked. Every case runs on a temporary Git repository with its own registry, passed
// as `root`, with fixture check scripts and, for the effect on other code, the real tsc of this project. The test removes the folder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout } from 'node:timers';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { added, addedLinesOf, leftBehind, readRegistry, refusedLines, runCodeCheck } from './code-check.mjs';
import { differential } from './hook-differential.mjs';
import { validateSettings } from './check-workflow.mjs';
import { isGovernanceScopePath, isPolicyPath } from './contract.mjs';
import { evaluateHook, hookModuleClosure } from './security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const TOOL = 'scripts/workflow-gates/code-check.mjs';
const REGISTRY = 'scripts/workflow-gates/code-check.json';
const TOOL_ARG = '${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/code-check.mjs';
const NODE = `"${process.execPath.replaceAll('\\', '/')}"`;
const TSC = `${NODE} "${join(ROOT, 'node_modules/typescript/bin/tsc').replaceAll('\\', '/')}" --noEmit --pretty false -p .`;

// Each fixture script appends its name and arguments to marks.log, so a test can see whether a command ran and what it was given.
const MARK = "import { appendFileSync } from 'node:fs';\nappendFileSync('marks.log', `${process.argv.slice(1).map(a => a.replaceAll('\\\\', '/').split('/tests/').at(-1)).join(' ')}\\n`);\n";
const SCRIPTS = {
  'tests/mark.mjs': MARK,
  'tests/lint.mjs': `${MARK}import { readFileSync } from 'node:fs';\nfor (const file of process.argv.slice(2)) if (/debugger/.test(readFileSync(file, 'utf8'))) { console.error(\`\${file}:1: no debugger\`); process.exit(1); }\n`,
  'tests/impact.mjs': `${MARK}import { readFileSync } from 'node:fs';\nif (/BROKEN/.test(readFileSync('src/owner.ts', 'utf8'))) { console.error('consumer test failed: price is broken'); process.exit(1); }\n`,
  'tests/no-tests.mjs': `${MARK}console.log('No test files found, exiting with code 0');\n`,
  'tests/tree-gate.mjs': `${MARK}console.error('finding in src/each/known-bad.ts'); for (let i = 0; i < 30; i++) console.error(\`finding \${i} elsewhere\`); process.exit(1);\n`,
  'tests/hang.mjs': "import { spawn } from 'node:child_process';\nimport { writeFileSync } from 'node:fs';\nconst child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });\nwriteFileSync('pids.json', JSON.stringify([process.pid, child.pid]));\nsetInterval(() => {}, 1000);\n",
  'tests/rewrite.mjs': `${MARK}import { existsSync, writeFileSync } from 'node:fs';\nif (!existsSync('rewritten')) { writeFileSync('rewritten', ''); appendFileSync('src/a.ts', '// changed during the check\\n'); }\n`,
};
const LINT_ROW = { paths: ['src/**/*.ts'], write: [`${NODE} tests/lint.mjs {files}`], stop: [`${NODE} tests/mark.mjs stop`] };
const registryOf = (rows, overrides = {}) => ({ roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 6, rows, ...overrides });

function fixture(t, { registry, files = {}, git = true }) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-check-'));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }));
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  const inRepo = (...args) => {
    const child = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(child.status, 0, `git ${args.join(' ')}: ${child.stderr}`);
  };
  for (const [file, text] of Object.entries({ ...SCRIPTS, ...files })) put(file, text);
  if (registry) put(REGISTRY, typeof registry === 'string' ? registry : JSON.stringify(registry));
  if (git) {
    inRepo('init', '-q');
    inRepo('config', 'core.autocrlf', 'false');
    inRepo('add', '-A');
    inRepo('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'base');
  }
  const run = (name, extra = {}) => runCodeCheck({ hook_event_name: name, session_id: 's1', cwd: root, ...extra }, root);
  const marks = () => (existsSync(join(root, 'marks.log')) ? readFileSync(join(root, 'marks.log'), 'utf8').split(/\r?\n/).filter(Boolean) : []);
  const state = () => JSON.parse(readFileSync(join(root, 'test-results/code-check/s1.json'), 'utf8'));
  return { root, put, inRepo, run, marks, state, edit: file => ({ tool_name: 'Edit', tool_input: { file_path: join(root, file) } }), remove: file => rmSync(join(root, file)) };
}
// A command text the tool must not parse, and that names no file.
const SHELL = { tool_name: 'Bash', tool_input: { command: 'some command the hook does not parse' } };
const passed = (result, label) => assert.deepEqual(result, { status: 0, message: '' }, label);

test('[GOV-945-HOOK-WRITE-DENY] A failing quality check of a written file reaches the agent at once', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/a.ts', 'debugger;\nexport const a = 1;\n');
  const failed = await f.run('PostToolUse', f.edit('src/a.ts'));
  assert.equal(failed.status, 2, 'a lint failure refuses');
  assert.ok(failed.message.startsWith('CODE CHECK FAILED after a write to src/a.ts. Fix this now, before anything else:\n'), failed.message);
  assert.match(failed.message, /tests\/lint\.mjs "src\/a\.ts": exit 1/, 'the failing command and its exit code');
  assert.match(failed.message, /src\/a\.ts:1: no debugger/, 'the failing line');
  const ran = f.marks().length;
  assert.equal(ran, 1);
  passed(await f.run('PostToolUse', SHELL), 'the failed version is not shown again at the next command');
  assert.equal(f.marks().length, ran, 'and no command ran');
  passed(await f.run('PostToolUse', f.edit('src/a.ts')), 'not by a second event naming the file either');
  assert.equal(f.marks().length, ran);
  f.put('src/a.ts', 'export const a = 2;\n');
  passed(await f.run('PostToolUse', f.edit('src/a.ts')), 'a fix passes');
  assert.equal(f.marks().length, ran + 1, 'the fix was checked');
});

test('[GOV-945-HOOK-IMPACT-DENY] An agent cannot finish while its change breaks other code', async t => {
  const owner = 'export const price = (value: number): number => value;\n';
  const consumer = "import { price } from './owner';\nexport const shown = price(1);\n";
  const tsconfig = JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: true, target: 'es2022', module: 'esnext', moduleResolution: 'bundler', types: [] }, include: ['src/**/*.ts'] });
  const f = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [TSC], stop: [`${NODE} tests/impact.mjs`] }]),
    files: { 'tsconfig.json': tsconfig, 'src/owner.ts': owner, 'src/consumer.ts': consumer } });
  passed(await f.run('SessionStart'));

  f.put('src/owner.ts', 'export const price = (value: string): number => Number(value);\n');
  const signature = await f.run('PostToolUse', f.edit('src/owner.ts'));
  assert.equal(signature.status, 2, 'a changed signature refuses');
  assert.match(signature.message, /src\/consumer\.ts\(2,\d+\): error TS2345/, 'in the consumer the session never wrote');
  f.put('src/owner.ts', owner);
  passed(await f.run('PostToolUse', f.edit('src/owner.ts')));

  f.inRepo('mv', 'src/owner.ts', 'src/renamed-owner.ts');
  const renamed = await f.run('PostToolUse', SHELL);
  assert.equal(renamed.status, 2, 'a rename refuses');
  assert.match(renamed.message, /src\/consumer\.ts\(1,\d+\): error TS2307/, 'in the consumer of the old path');
  f.inRepo('mv', 'src/renamed-owner.ts', 'src/owner.ts');
  passed(await f.run('PostToolUse', SHELL), 'the rename undone');

  f.remove('src/owner.ts');
  const deleted = await f.run('PostToolUse', SHELL);
  assert.equal(deleted.status, 2, 'a deletion refuses');
  assert.match(deleted.message, /src\/consumer\.ts\(1,\d+\): error TS2307/, 'in its consumer');
  const deletedAtStop = await f.run('Stop');
  assert.equal(deletedAtStop.status, 2, 'and Stop refuses it');
  assert.match(deletedAtStop.message, /error TS2307/);
  f.put('src/owner.ts', owner);

  f.put('src/owner.ts', `${owner}// BROKEN\n`);
  passed(await f.run('PostToolUse', SHELL), 'the types stay correct');
  const start = 'CODE CHECK FAILED: how src/owner.ts affects the rest of the project. Fix this before finishing:\n';
  for (const extra of [{}, { stop_hook_active: true }]) {
    const stopped = await f.run('Stop', extra);
    assert.equal(stopped.status, 2, `Stop refuses a failed version with ${JSON.stringify(extra)}`);
    assert.ok(stopped.message.startsWith(start), stopped.message);
    assert.match(stopped.message, /consumer test failed: price is broken/);
    assert.ok(stopped.message.endsWith('A session that wrote none of these files reports that instead of changing them.'), stopped.message);
  }
  const subagent = await f.run('SubagentStop');
  assert.equal(subagent.status, 2, 'a subagent cannot finish either');

  f.put('src/owner.ts', `${owner}// fixed\n`);
  passed(await f.run('Stop'), 'a fixed version passes');
  const ran = f.marks().length;
  passed(await f.run('Stop', { stop_hook_active: true }), 'an unchanged passed version passes');
  assert.equal(f.marks().length, ran, 'and runs no command');

  const covered = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/no-tests.mjs {files}`] }]) });
  passed(await covered.run('SessionStart'));
  covered.put('src/uncovered/a.ts', 'export const a = 1;\n');
  const noted = await covered.run('Stop');
  assert.equal(noted.status, 2, 'a file no test reaches stops the agent');
  assert.ok(noted.message.startsWith('CODE CHECK NOTE: no test reaches src/uncovered/a.ts.'), noted.message);
  assert.match(noted.message, /proven only by the type check, where one reads it\. Add a test, or say so in your report/);
  passed(await covered.run('Stop', { stop_hook_active: true }), 'once per version');
});

test('[GOV-945-HOOK-SHELL-WRITE-DENY] A change is found by its content, whatever wrote it', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n', 'src/dirty.ts': 'export const d = 1;\n', 'src/old.ts': 'export const o = 1;\n' } });
  f.put('src/dirty.ts', 'export const d = 2;\n');
  passed(await f.run('SessionStart'));
  assert.deepEqual(f.state().seen, { SessionStart: 1 });
  passed(await f.run('PostToolUse', SHELL), 'a file already dirty at SessionStart with an unchanged hash');
  passed(await f.run('Stop'));
  assert.deepEqual(f.marks(), [], 'runs nothing: a session that changed no code runs no command');

  f.put('src/a.ts', 'debugger;\n');
  const shell = await f.run('PostToolUse', SHELL);
  assert.equal(shell.status, 2, 'a file changed directly, under a Bash event that names no file, is refused');
  assert.match(shell.message, /CODE CHECK FAILED after a write to src\/a\.ts\./);
  assert.match(shell.message, /src\/a\.ts:1: no debugger/);
  f.put('src/a.ts', 'export const a = 1;\n');

  f.put('src/dirty.ts', 'debugger;\n');
  const dirty = await f.run('PostToolUse', SHELL);
  assert.equal(dirty.status, 2, 'a dirty file changed in this session is refused');
  f.put('src/dirty.ts', 'export const d = 1;\n');
  const before = f.marks().length;
  passed(await f.run('PostToolUse', SHELL), 'a dirty file back at its committed text is a change too');
  assert.equal(f.marks().length, before + 1, 'and is checked although the tree no longer shows it');

  f.inRepo('mv', 'src/old.ts', 'src/new.ts');
  passed(await f.run('PostToolUse', SHELL));
  assert.match(f.marks().at(-1), /lint\.mjs src\/new\.ts$/, 'a staged rename is checked under its new name');
  f.inRepo('mv', 'src/new.ts', 'src/old.ts');

  f.put('src/app/[locale]/page.ts', 'export const page = 1;\n');
  passed(await f.run('PostToolUse', SHELL));
  assert.match(f.marks().at(-1), /lint\.mjs src\/app\/\[locale\]\/page\.ts$/, 'a path with brackets, two folders deep, reaches a command exactly');
  assert.ok(f.state().seen.PostToolUse > 1, 'the state holds seen');

  const missing = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n' } });
  missing.put('src/a.ts', 'debugger;\n');
  passed(await missing.run('PostToolUse', SHELL), 'a missing state starts a baseline at that event');
  assert.deepEqual(missing.marks(), [], 'work done before the session is not charged to it');
  assert.ok(existsSync(join(missing.root, 'test-results/code-check/s1.json')));
  missing.put('src/a.ts', 'debugger;\nexport const b = 2;\n');
  assert.equal((await missing.run('PostToolUse', SHELL)).status, 2, 'and the next change is checked');
});

test('[GOV-945-HOOK-DIFFERENTIAL-DENY] A change of the shared hook that loses a target is reported', () => {
  const keeps = { sha256: 'base', shellWriteTargets: (_root, command) => (command.startsWith('npx') ? ['kept.ts', 'dropped.ts'] : []) };
  const same = { shellWriteTargets: keeps.shellWriteTargets };
  const equal = differential(keeps, same, { limit: 500 });
  assert.equal(equal.compared, 500);
  assert.equal(equal.lost, 0, 'equal hooks lose nothing');
  assert.equal(equal.thrown, 0);
  assert.deepEqual(equal.lines, []);
  const drops = { shellWriteTargets: (root, command) => keeps.shellWriteTargets(root, command).filter(target => target !== 'dropped.ts') };
  const lost = differential(keeps, drops, { limit: 500 });
  assert.ok(lost.lost > 0, 'a new hook dropping a target reports it');
  assert.match(lost.lines[0], /^LOST "dropped\.ts" for "npx /, 'with the command');
  const row = { baseSha256: 'base', commandPattern: '^npx', targetPattern: 'dropped', reason: 'fixture' };
  const named = differential(keeps, drops, { limit: 500, corrections: [row] });
  assert.equal(named.lost, 0, 'a matching correction moves it');
  assert.equal(named.named, lost.lost, 'to named');
  const stale = differential(keeps, drops, { limit: 500, corrections: [{ ...row, baseSha256: 'another' }] });
  assert.equal(stale.lost, lost.lost, 'a correction for another hook does not apply');
  assert.equal(stale.named, 0);
  const other = differential(keeps, drops, { limit: 500, corrections: [{ ...row, targetPattern: 'unrelated' }] });
  assert.equal(other.lost, lost.lost, 'a correction naming another target does not apply');
  const throws = differential(keeps, { shellWriteTargets: () => { throw new Error('boom'); } }, { limit: 3 });
  assert.equal(throws.thrown, 3, 'a new hook that throws is counted');
  assert.match(throws.lines[0], /^THROW /);
});

const WRITE_ROWS = {
  eslint: 'node node_modules/eslint/bin/eslint.js --quiet {files}',
  integrity: 'node scripts/check-file-integrity.mjs --files {files}',
  tsc: 'node node_modules/typescript/bin/tsc --noEmit --pretty false',
  gates: 'node scripts/workflow-gates/selftests.mjs',
  workflow: 'node scripts/workflow-gates/check-workflow.mjs',
  related: 'node node_modules/vitest/vitest.mjs related {files} --run --passWithNoTests --allowOnly=false --reporter=dot',
  ciLint: 'node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs {files}',
};
const REAL_ROOTS = ['src', 'scripts', '.claude/hooks', '.claude/settings.json', 'messages', '.storybook', 'tsconfig.json', 'package.json', 'next.config.ts', 'vitest.config.ts', 'vitest.integration.config.ts', 'eslint.config.mjs', 'postcss.config.mjs', 'sentry.edge.config.ts', 'sentry.server.config.ts', 'package-lock.json', '.npmrc', 'supabase/migrations', '.github', 'CLAUDE.md', 'AGENTS.md', '.codex', '.claude/rules', '.claude/skills', '.claude/agents'];
const REAL_ROWS = [
  { paths: ['src/**/*.ts', 'src/**/*.tsx'], write: [WRITE_ROWS.eslint, WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: [WRITE_ROWS.related] },
  { paths: ['src/**/*.tsx', 'src/**/*.css'], write: [WRITE_ROWS.integrity], stop: [{ run: 'node scripts/check-design-tokens.mjs --strict', namesFile: true, finding: '^\\s+\\S+\\s+\\(\\d+\\)\\s*$' }] },
  { paths: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.css', 'messages/*.json'], write: [], stop: [{ run: 'node scripts/check-mojibake.mjs', namesFile: true, finding: '^\\s+\\S+:\\d+:\\d+\\s' }] },
  { paths: ['scripts/**/*.mjs', 'scripts/**/*.js', 'scripts/**/*.cjs'], write: [WRITE_ROWS.integrity], stop: [WRITE_ROWS.gates] },
  // The gate suite reaches the gates only. A scanner in scripts/ has its vitest tests in scripts/__tests__, and they run here.
  { paths: ['scripts/*.mjs', 'scripts/*.js', 'scripts/*.cjs', 'scripts/lib/**/*.mjs', 'scripts/governance/**/*.mjs', 'scripts/rendered-state-census/**/*.mjs'], write: [], stop: [WRITE_ROWS.related] },
  { paths: ['scripts/**/*.ts'], write: [WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: [WRITE_ROWS.related] },
  { paths: ['scripts/workflow-gates/*.mjs'], write: [WRITE_ROWS.ciLint], stop: [] },
  { paths: ['scripts/**/*.json'], write: [WRITE_ROWS.integrity], stop: [WRITE_ROWS.gates, WRITE_ROWS.workflow] },
  { paths: ['scripts/workflow-gates/security-hook.mjs'], write: [], stop: ['node scripts/workflow-gates/hook-differential.mjs'] },
  { paths: ['.claude/hooks/*.ps1'], write: ["powershell -NoProfile -Command \"$e=$null;[void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '{file}'),[ref]$null,[ref]$e); if($e){$e[0].Message;exit 1}\""], stop: [WRITE_ROWS.workflow] },
  { paths: ['.claude/settings.json'], write: [WRITE_ROWS.integrity], stop: [WRITE_ROWS.workflow] },
  { paths: ['messages/*.json'], write: [WRITE_ROWS.integrity], stop: ['node scripts/check-i18n-parity.mjs'] },
  // A file that configures the checks can break the whole project, so its effect is checked too.
  { paths: ['tsconfig.json', 'package.json'], write: [WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: [] },
  { paths: ['package.json', 'package-lock.json'], write: [], stop: ['node scripts/workflow-gates/dependency-check.mjs'] },
  { paths: ['.github/**/*', '.npmrc', 'CLAUDE.md', 'AGENTS.md', '.codex/*', '.claude/rules/**/*', '.claude/skills/**/*', '.claude/agents/*'], write: [], stop: ['node scripts/workflow-gates/check-workflow.mjs'] },
  { paths: ['supabase/migrations/*.sql'], write: ['node scripts/check-file-integrity.mjs --files {files}'], stop: [] },
  { paths: ['next.config.ts', 'sentry.*.config.ts', 'vitest.integration.config.ts', '.storybook/**/*.ts', '.storybook/**/*.tsx'], write: [WRITE_ROWS.eslint, WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: [] },
  { paths: ['vitest.config.ts'], write: [WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: ['node node_modules/vitest/vitest.mjs list --filesOnly'] },
  { paths: ['eslint.config.mjs'], write: [WRITE_ROWS.integrity, WRITE_ROWS.eslint], stop: [] },
  { paths: ['postcss.config.mjs'], write: [WRITE_ROWS.integrity], stop: [] },
];

test('[GOV-945-HOOK-CLEAN-ALLOW] Clean code passes and the registry holds only checks that can fail', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/a.ts', 'export const a = 2;\n');
  passed(await f.run('PostToolUse', f.edit('src/a.ts')), 'a clean write passes');
  passed(await f.run('Stop'), 'and Stop passes');
  passed(await f.run('SubagentStop'));
  assert.deepEqual(f.marks().map(mark => mark.split(' ')[0]), ['lint.mjs', 'mark.mjs'], 'each stage ran once');

  const registry = JSON.parse(readFileSync(join(ROOT, REGISTRY), 'utf8'));
  assert.deepEqual(registry.roots, REAL_ROOTS);
  assert.deepEqual(registry.timeoutMs, { write: 50000, stop: 240000 });
  assert.deepEqual(registry.rows, REAL_ROWS, 'the rows and commands of R5 exactly');
  const commandsOf = row => [...row.write, ...row.stop].map(entry => (typeof entry === 'string' ? entry : entry.run));
  const commands = registry.rows.flatMap(commandsOf);
  for (const row of registry.rows.filter(entry => entry.paths.some(path => path.startsWith('scripts/')))) {
    // Its default config ignores scripts, so only a command naming the gate config can fail for one.
    assert.ok(commandsOf(row).filter(command => /eslint/.test(command)).every(command => command.includes('--config scripts/workflow-gates/eslint.config.mjs')), `ESLint cannot fail for ${row.paths[0]} under its default config`);
  }
  assert.ok(!commands.some(command => /check-ui-contract/.test(command)), 'it reads committed revisions, so it cannot fail for the change');
  for (const entry of registry.rows.flatMap(row => row.stop)) if (/check-mojibake/.test(entry.run ?? entry)) assert.equal(entry.namesFile, true, 'it fails at this tree, so only a finding in a changed file counts');
  for (const command of commands) {
    const script = /^node (\S+)/.exec(command)?.[1];
    if (script) assert.ok(existsSync(join(ROOT, script)), `${script} exists`);
  }

  const gate = [{ paths: ['src/each/**/*.ts'], write: [], stop: [{ run: `${NODE} tests/tree-gate.mjs`, namesFile: true, finding: '^finding in ' }] }];
  const tree = fixture(t, { registry: registryOf(gate), files: { 'src/each/known-bad.ts': 'export const bad = 1;\n', 'src/each/known-bad.tsx': 'export const near = 1;\n' } });
  passed(await tree.run('SessionStart'));
  tree.put('src/each/other.ts', 'export const other = 1;\n');
  passed(await tree.run('Stop'), 'a finding outside the change does not block');
  assert.equal(tree.marks().length, 1, 'the gate ran');
  const near = fixture(t, { registry: registryOf([{ paths: ['src/each/**/*.ts'], write: [], stop: [{ run: `${NODE} tests/near.mjs`, namesFile: true, finding: '^finding in ' }] }]),
    files: { 'tests/near.mjs': "console.error('finding in src/each/wide.tsx and other-src/each/wide.ts'); process.exit(1);\n", 'src/each/wide.ts': 'export const wide = 1;\n', 'src/each/wide.tsx': 'export const near = 1;\n' } });
  passed(await near.run('SessionStart'));
  near.put('src/each/wide.ts', 'export const wide = 2;\n');
  passed(await near.run('Stop'), 'a finding path that merely holds the changed path does not count');
  tree.put('src/each/known-bad.ts', 'export const bad = 2;\n');
  const blocked = await tree.run('Stop');
  assert.equal(blocked.status, 2, 'a finding in a changed file blocks');
  assert.match(blocked.message, /finding in src\/each\/known-bad\.ts\nfinding 0 elsewhere/, 'with the details under it, which lie above the tail');
});

test('[GOV-945-HOOK-GATE-CRASH-ERROR] A crashing gate is no finding elsewhere', async t => {
  const FORM = '^\\s+\\S+:\\d+:\\d+\\s';
  const gateRow = script => [{ paths: ['src/each/**/*.ts'], write: [], stop: [{ run: `${NODE} tests/${script}.mjs`, namesFile: true, finding: FORM }] }];
  const gate = (script, text_, files = {}) => {
    const f = fixture(t, { registry: registryOf(gateRow(script)), files: { 'src/each/a.ts': 'export const a = 1;\n', 'src/each/other.ts': 'export const b = 1;\n', [`tests/${script}.mjs`]: text_, ...files } });
    return f;
  };
  // It names real files, the changed one among them, in the form a stack trace has: a word of the old rule would have read this as a finding.
  const crash = gate('crash', "console.error('Error: Cannot find module x'); console.error('    at src/each/a.ts (file:///x:1:1)'); console.error('    at src/each/other.ts:1'); process.exit(1);\n");
  passed(await crash.run('SessionStart'));
  crash.put('src/each/a.ts', 'export const a = 2;\n');
  const failed = await crash.run('Stop');
  assert.equal(failed.status, 2, 'a gate that crashed refuses');
  assert.match(failed.message, /could not finish \(exit 1, and its output holds no line of a finding\)/);
  assert.match(failed.message, /Cannot find module x/, 'with its reason');
  assert.equal((await crash.run('Stop', { stop_hook_active: true })).status, 2, 'on every attempt');
  const elsewhere = gate('elsewhere', "console.error('  src/each/other.ts:1:2 finding'); process.exit(1);\n");
  passed(await elsewhere.run('SessionStart'));
  elsewhere.put('src/each/a.ts', 'export const a = 2;\n');
  passed(await elsewhere.run('Stop'), 'a finding of the form outside the change does not block');
  const inChange = gate('own', "console.log('\\u001b[31m  src/each/a.ts:1:2 finding\\u001b[0m'); console.log('    the detail'); console.log('  src/each/other.ts:1:2 finding'); process.exit(1);\n");
  passed(await inChange.run('SessionStart'));
  inChange.put('src/each/a.ts', 'export const a = 2;\n');
  const own = await inChange.run('Stop');
  assert.equal(own.status, 2, 'a finding in a changed file blocks');
  assert.match(own.message, /tests\/own\.mjs: exit 1\n\s+src\/each\/a\.ts:1:2 finding\n\s+the detail/, 'at its line with the detail under it, read past colour codes');
  const none = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [{ run: 'x', namesFile: true }] }]) });
  const refused = await none.run('Stop');
  assert.equal(refused.status, 2, 'an entry with no finding');
  assert.match(refused.message, /^CODE CHECK COULD NOT RUN: .*the whole-tree gate x holds no finding/);
  const atWrite = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [{ run: 'x', namesFile: true, finding: '' }], stop: [] }]) });
  assert.match((await atWrite.run('Stop')).message, /CODE CHECK COULD NOT RUN/, 'an empty finding, at either stage');

  const registry = JSON.parse(readFileSync(join(ROOT, REGISTRY), 'utf8'));
  const entries = registry.rows.flatMap(row => row.stop).filter(entry => entry.namesFile);
  assert.deepEqual(entries.map(entry => [entry.run, entry.finding]), [['node scripts/check-design-tokens.mjs --strict', '^\\s+\\S+\\s+\\(\\d+\\)\\s*$'], ['node scripts/check-mojibake.mjs', '^\\s+\\S+:\\d+:\\d+\\s']]);
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry).sort(), ['finding', 'namesFile', 'run'], 'the folders are gone');
    const [script, ...args] = entry.run.split(' ').slice(1);
    const run = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 1 << 26 });
    assert.ok([0, 1].includes(run.status), `${script} ran`);
    const found = `${run.stdout}${run.stderr}`.split(/\r?\n/).filter(line => new RegExp(entry.finding).test(line));
    assert.equal(found.length > 0, run.status !== 0, `${script}, exit ${run.status}: a line of a finding exactly when it fails`);
  }
});

test('Task 945: with no state, the write that fired the event is still checked', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n', 'src/older.ts': 'export const o = 1;\n' } });
  f.put('src/older.ts', 'debugger;\n');
  f.put('src/a.ts', 'debugger;\n');
  const failed = await f.run('PostToolUse', f.edit('src/a.ts'));
  assert.equal(failed.status, 2, 'the file the write tool names is no work before the session');
  assert.match(failed.message, /^CODE CHECK FAILED after a write to src\/a\.ts\. Fix/, 'and another dirty file is not charged to it');
});

test('Task 945: a note a subagent received first still reaches the main agent, once per version', async t => {
  const f = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/no-tests.mjs {files}`] }]), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/a.ts', 'export const a = 2;\n');
  const version = () => f.marks().length;
  assert.equal((await f.run('SubagentStop')).status, 2, 'the subagent that finishes first gets it');
  const ran = version();
  passed(await f.run('SubagentStop'), 'once');
  const main = await f.run('Stop');
  assert.equal(main.status, 2, 'the main agent gets it too');
  assert.ok(main.message.startsWith('CODE CHECK NOTE: no test reaches src/a.ts.'), main.message);
  passed(await f.run('Stop', { stop_hook_active: true }), 'once');
  assert.equal(version(), ran, 'and no command ran again');

  f.put('src/a.ts', 'export const a = 3;\n');
  assert.equal((await f.run('SubagentStop')).status, 2);
  f.put('src/a.ts', 'export const a = 4;\n');
  const newer = await f.run('Stop');
  assert.equal(newer.status, 2, 'a newer version has its own note');
  passed(await f.run('Stop'), 'once');

  const reached = "import { readFileSync } from 'node:fs';\nif (!/covered/.test(readFileSync(process.argv[2], 'utf8'))) console.log('No test files found, exiting with code 0');\n";
  const later = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/reached.mjs {files}`] }]), files: { 'tests/reached.mjs': reached, 'src/a.ts': 'export const a = 1;\n' } });
  passed(await later.run('SessionStart'));
  later.put('src/a.ts', 'export const a = 2;\n');
  assert.equal((await later.run('SubagentStop')).status, 2, 'the older version has no test');
  later.put('src/a.ts', 'export const a = 3; // covered\n');
  passed(await later.run('Stop'), 'and its note is not given for a newer version a test reaches');
});

test('Task 945: what makes a check quieter stops the agent once per version, and only what this change added', async t => {
  const rule = { paths: ['src/**/*.test.ts'], pattern: '\\bit\\.skip\\b', what: 'a test switched off' };
  const fewer = { paths: ['src/**/*.test.ts'], pattern: '\\bexpect\\(', what: 'assertions removed', fewer: true };
  const row = { paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/mark.mjs stop`] };
  const f = fixture(t, { registry: registryOf([row], { quieting: [rule, fewer] }), files: { 'src/a.test.ts': "it.skip('old', () => {});\nit('a', () => { expect(1); expect(2); });\n", 'src/b.ts': 'export const b = 1;\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/b.ts', 'export const b = 2;\n');
  passed(await f.run('Stop'), 'a file no rule holds');

  f.put('src/a.test.ts', "it.skip('old', () => {});\nit('a', () => { expect(1); expect(2); });\nit('c', () => { expect(3); });\n");
  passed(await f.run('Stop'), 'a skip already at HEAD is no work of this change');

  f.put('src/a.test.ts', "it.skip('old', () => {});\nit.skip('a', () => { expect(1); expect(2); });\n");
  const skipped = await f.run('Stop');
  assert.equal(skipped.status, 2, 'a test switched off stops the agent');
  assert.match(skipped.message, /CODE CHECK NOTE: this change makes a check quieter/);
  assert.match(skipped.message, /src\/a\.test\.ts:2: a test switched off: it\.skip\('a'/, 'with the file, the line and the text');
  assert.doesNotMatch(skipped.message, /it\.skip\('old'/, 'not the skip that was already there');
  passed(await f.run('Stop', { stop_hook_active: true }), 'once per version');

  f.put('src/a.test.ts', "it.skip('old', () => {});\nit('a', () => { expect(1); });\n");
  const removed = await f.run('SubagentStop');
  assert.equal(removed.status, 2, 'an assertion removed stops the agent');
  assert.match(removed.message, /src\/a\.test\.ts: assertions removed, 2 at HEAD and 1 now/);
  const main = await f.run('Stop');
  assert.equal(main.status, 2, 'and the main agent hears it too, when a subagent heard it first');
  assert.match(main.message, /assertions removed, 2 at HEAD and 1 now/);
  passed(await f.run('Stop'), 'once');

  f.put('src/a.test.ts', "it.skip('old', () => {});\nit('a', () => { expect(1); expect(2); });\n");
  passed(await f.run('Stop'), 'restored');

  const fresh = fixture(t, { registry: registryOf([row], { quieting: [rule] }) });
  passed(await fresh.run('SessionStart'));
  fresh.put('src/new.test.ts', "it.skip('new', () => {});\n");
  assert.match((await fresh.run('Stop')).message, /src\/new\.test\.ts:1: a test switched off/, 'a new file has nothing at HEAD');

  const older = fixture(t, { registry: registryOf([row], { quieting: [rule] }) });
  passed(await older.run('SessionStart'));
  older.put('src/o.test.ts', "it.skip('o', () => {});\n");
  assert.equal((await older.run('SubagentStop')).status, 2);
  older.put('src/o.test.ts', "it('o', () => {});\n");
  passed(await older.run('Stop'), 'a note of an older version is not given for a newer one');
});

test('Task 945: the real quieting rules read what they are meant to', () => {
  const { quieting } = JSON.parse(readFileSync(join(ROOT, REGISTRY), 'utf8'));
  const rule = what => new RegExp(quieting.find(entry => entry.what.startsWith(what)).pattern);
  for (const text of ["it.skip('a', f)", "describe.skip('a', f)", "test.todo('a')", 'it.fails("a", f)', "xit('a', f)"]) assert.match(text, rule('a test switched off'), text);
  assert.doesNotMatch("it('skips a row', f)", rule('a test switched off'));
  for (const text of ['value as any', 'const a: any = 1', '// @ts-ignore', '// @ts-nocheck', 'value as unknown as string']) assert.match(text, rule('a type check switched off'), text);
  assert.doesNotMatch('const many: anything = 1', rule('a type check switched off'));
  for (const text of ['// eslint-disable-next-line x', '/* design-tokens-allow: 1px */']) assert.match(text, rule('a rule switched off'), text);
  assert.doesNotMatch('scripts/design-tokens-allowlist.json', rule('a rule switched off'), 'the name of the allowlist file is no marker');
  assert.match('expect(a).toBeDefined()', rule('an assertion that accepts'));
  assert.doesNotMatch('expect(a).toBe(5)', rule('an assertion that accepts'));
  // UTF-8 text read as CP1251, and four ordinary words that start with the same two capitals. Escapes, because this file is English.
  assert.match('\u0420\u045f\u0421\u0402\u0420\u0451\u0420\u0406\u0421\u2013\u0421\u201a', rule('garbled Cyrillic'));
  for (const text of ['\u0420\u0443\u0441\u043b\u0430\u043d', '\u0421\u0442\u0440\u0430\u043d\u0430', '\u0420\u0430\u0434\u0456\u0441\u0442\u044c', '\u0421\u044c\u043e\u0433\u043e\u0434\u043d\u0456']) assert.doesNotMatch(text, rule('garbled Cyrillic'), text);
  for (const entry of quieting) for (const path of entry.paths) assert.ok(typeof path === 'string' && entry.what, 'each rule names its files and what it finds');
});

// Every other test here uses fixture checks. This one runs the real registry through the real main, with the real ESLint config, tsc, vitest config and gates,
// because a fixture check proves the tool reads an exit code, and says nothing about whether the registry's commands see a real defect.
function realChain(t, extra = {}) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-chain-'));
  const link = join(root, 'node_modules');
  t.after(() => {
    // The link goes first and on its own, so that removing the folder can never reach what it points at.
    if (process.platform === 'win32') spawnSync('cmd', ['/c', 'rmdir', link]); else rmSync(link, { force: true });
    if (!existsSync(link)) rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  });
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  for (const file of ['eslint.config.mjs', 'tsconfig.json', 'vitest.config.ts', 'src/tests/setup.ts', 'src/tests/server-only-stub.ts', 'src/tests/next-cache-stub.ts', 'scripts/check-file-integrity.mjs',
    'scripts/check-design-tokens.mjs', 'scripts/design-tokens-allowlist.json', 'scripts/lib/mantine-story-scope.mjs', 'scripts/check-i18n-parity.mjs', 'scripts/check-mojibake.mjs', 'scripts/mojibake-allowlist.json', TOOL, REGISTRY, 'scripts/workflow-gates/selftests.mjs', 'scripts/workflow-gates/contract.mjs', 'scripts/workflow-gates/mutation-check.mjs', 'scripts/workflow-gates/mutation-loader.mjs', 'scripts/workflow-gates/mutation-vitest.config.mjs', 'scripts/workflow-gates/dependency-check.mjs', 'scripts/workflow-gates/eslint.config.mjs']) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(join(ROOT, file), join(root, file));
  }
  symlinkSync(join(ROOT, 'node_modules'), link, 'junction');
  const base = {
    '.gitignore': 'node_modules\ntest-results\n*.tsbuildinfo\n', 'next-env.d.ts': '/// <reference types="next" />\n', 'package.json': '{ "name": "fixture", "private": true, "type": "module" }\n',
    'scripts/workflow-gates/fixture.selftest.mjs': "import { test } from 'node:test';\ntest('fixture', () => {});\n",
    'scripts/tool.mjs': 'export const double = value => value * 2;\n',
    'scripts/__tests__/tool.test.ts': "import { it, expect } from 'vitest';\nimport { double } from '../tool.mjs';\nit('doubles', () => expect(double(2)).toBe(4));\n",
    'src/lib/price.ts': 'export const price = (value: number): number => value * 2;\n',
    'src/lib/consumer.ts': "import { price } from './price';\nexport const shown = (value: number): number => price(value) + 1;\n",
    'src/lib/consumer.test.ts': "import { it, expect } from 'vitest';\nimport { shown } from './consumer';\nit('shows a price', () => expect(shown(2)).toBe(5));\n",
    'src/components/Card.tsx': 'export function Card({ title }: { title: string }) {\n  return <div>{title}</div>;\n}\n',
    'src/components/box.module.css': '.box {\n  color: var(--mantine-color-text);\n}\n',
    'messages/en.json': '{ "a": { "title": "T" } }\n', 'messages/it.json': '{ "a": { "title": "T" } }\n', 'messages/sq.json': '{ "a": { "title": "T" } }\n', 'messages/uk.json': '{ "a": { "title": "T" } }\n',
  };
  for (const [file, text] of Object.entries({ ...base, ...extra })) put(file, text);
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('add', '-A');
  git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'base');
  let session = 0;
  const hook = (name, file) => spawnSync(process.execPath, [TOOL], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    input: JSON.stringify({ hook_event_name: name, session_id: `real-${session}`, cwd: root, ...(file ? { tool_name: 'Edit', tool_input: { file_path: join(root, file) } } : {}) }) });
  const start = () => { git('reset', '-q', '--hard'); git('clean', '-fdq'); session++; assert.equal(hook('SessionStart').status, 0); };
  return { root, put, hook, start };
}

test('Task 945: the real registry stops real defects through the real main', async t => {
  const { put, hook, start } = realChain(t);
  const caughtAtWrite = (label, file, text, pattern) => {
    start();
    put(file, text);
    const run = hook('PostToolUse', file);
    assert.equal(run.status, 2, `${label}: refused after the write\n${run.stderr}`);
    assert.match(run.stderr, pattern, label);
  };
  const caughtAtStop = (label, file, text, pattern) => {
    start();
    put(file, text);
    const write = hook('PostToolUse', file);
    assert.equal(write.status, 0, `${label}: passes after the write\n${write.stderr}`);
    const run = hook('Stop');
    assert.equal(run.status, 2, `${label}: refused at Stop\n${run.stderr}`);
    assert.match(run.stderr, pattern, label);
  };
  caughtAtWrite('a project ESLint rule', 'src/components/Card.tsx', "import Image from 'next/image';\nexport function Card({ title }: { title: string }) {\n  return <Image src={title} alt={title} width={1} height={1} />;\n}\n", /next\/image/);
  caughtAtWrite('a NUL byte', 'src/lib/price.ts', 'export const price = (value: number): number => value * 2;\0\n', /price\.ts/);
  caughtAtWrite('a changed signature in a consumer never written', 'src/lib/price.ts', 'export const price = (value: string): number => Number(value);\n', /src\/lib\/consumer\.ts\(2,\d+\): error TS2345/);
  caughtAtWrite('a broken tsconfig', 'tsconfig.json', '{ "compilerOptions": { "strict": \n', /tsconfig\.json/);
  caughtAtStop('changed behaviour a consumer test asserts', 'src/lib/price.ts', 'export const price = (value: number): number => value * 3;\n', /consumer\.test\.ts/);
  caughtAtStop('a raw CSS length', 'src/components/box.module.css', '.box {\n  line-height: 37px;\n}\n', /box\.module\.css/);
  caughtAtStop('mojibake in a source string', 'src/lib/price.ts', "export const label = 'a \u00e2\u20ac\u201d b';\nexport const price = (value: number): number => value * 2;\n", /check-mojibake[\s\S]*src\/lib\/price\.ts/);
  caughtAtStop('a locale key missing from one language', 'messages/uk.json', '{ "a": { } }\n', /uk/);
  caughtAtStop('changed behaviour of a scanner its vitest test asserts', 'scripts/tool.mjs', 'export const double = value => value * 3;\n', /tool\.test\.ts/);
  caughtAtStop('a test silenced with it.skip', 'src/lib/consumer.test.ts', "import { it, expect } from 'vitest';\nimport { shown } from './consumer';\nit.skip('shows a price', () => expect(shown(2)).toBe(5));\n", /consumer\.test\.ts:3: a test switched off/);
  start();
  put('src/lib/price.ts', 'export const price = (value: number): number => value * 2; // clean\n');
  assert.equal(hook('PostToolUse', 'src/lib/price.ts').status, 0, 'a clean write passes');
  assert.equal(hook('Stop').status, 0, 'and Stop passes, so the checks above refused the defect and not the fixture');
});

test('[GOV-945-HOOK-DELETED-CONSUMER-DENY] A deleted file\'s consumers are named', t => {
  const chain = realChain(t, {
    'scripts/lib/shared.mjs': 'export const limit = () => 3;\n',
    'scripts/check-thing.mjs': "import { limit } from './lib/shared.mjs';\nexport const over = value => value > limit();\n",
    'src/lib/data.json': '{ "a": 1 }\n',
    'src/lib/uses-data.ts': "import data from './data.json';\nexport const value = data.a;\n",
    'src/components/panel.module.css': '.panel {\n  color: var(--mantine-color-text);\n}\n',
    'src/components/Panel.tsx': "import styles from './panel.module.css';\nexport const Panel = () => <div className={styles.panel} />;\n",
    'src/lib/unnamed.json': '{}\n',
  });
  const consumers = [['scripts/lib/shared.mjs', 'scripts/check-thing.mjs'], ['src/lib/data.json', 'src/lib/uses-data.ts'], ['src/components/panel.module.css', 'src/components/Panel.tsx']];
  for (const [gone, consumer] of consumers) {
    chain.start();
    rmSync(join(chain.root, gone));
    const first = chain.hook('Stop');
    assert.equal(first.status, 2, `${gone}\n${first.stderr}`);
    assert.ok(first.stderr.startsWith(`CODE CHECK NOTE: ${gone} is gone and these still name it: `), first.stderr);
    assert.ok(first.stderr.split('\n')[0].includes(consumer), first.stderr);
    assert.equal(chain.hook('Stop').status, 0, `${gone}: once`);
  }
  chain.start();
  rmSync(join(chain.root, 'src/lib/unnamed.json'));
  const quiet = chain.hook('Stop');
  assert.equal(quiet.status, 0, `a deleted file nothing names adds no note\n${quiet.stderr}`);

  chain.start();
  for (const [gone] of consumers) rmSync(join(chain.root, gone));
  rmSync(join(chain.root, 'src/lib/unnamed.json'));
  const review = spawnSync(process.execPath, [join(ROOT, 'scripts/workflow-gates/change-review.mjs'), '--base=HEAD', '--minutes=1'], { cwd: chain.root, encoding: 'utf8', timeout: 180000, env: { ...process.env, CLAUDE_PROJECT_DIR: chain.root, GITHUB_STEP_SUMMARY: '' } });
  assert.equal(review.status, 0, `${review.stdout}${review.stderr}`);
  const section = review.stdout.slice(review.stdout.indexOf('## What a deletion left behind'));
  assert.ok(review.stdout.includes('## What a deletion left behind'), review.stdout);
  for (const [gone, consumer] of consumers) assert.ok(section.split('\n').some(line => line.startsWith(`- ${gone} is gone and these still name it: `) && line.includes(consumer)), `${gone}\n${section}`);
  assert.doesNotMatch(section, /unnamed\.json/);

  chain.start();
  rmSync(join(chain.root, 'src/lib/price.ts'));
  const typed = chain.hook('PostToolUse');
  assert.equal(typed.status, 2, 'a deleted TypeScript module is still refused by the type check');
  assert.match(typed.stderr, /src\/lib\/consumer\.ts\(1,\d+\): error TS2307/);
});

test('Task 945: what still names a deleted file: its bounds, its limit, and what tells it once', async t => {
  const users = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`src/use-${i}.ts`, "import a from './lib/shared.mjs';\n"]));
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: {
    ...users,
    'src/lib/shared.mjs': 'export default 1;\n',
    'src/lib/stem.ts': 'export const a = 1;\n', 'src/by-stem.ts': "import { a } from './lib/stem';\n", 'src/word.ts': 'const stem = 1; // stem.ts is a word here, and so is shared\n',
    'src/lib/index.ts': 'export {};\n', 'src/by-folder.ts': "import './lib/index';\n", 'src/by-name.ts': "import './lib/index.ts';\n",
    'src/note.md': 'a\n', 'src/reader.ts': "const a = 'src/note.md';\n",
    'src/untracked-user-of.json': '{}\n',
  } });
  const registry = readRegistry(f.root);
  const said = file => leftBehind(f.root, registry, [file]);
  const [line] = said('src/lib/shared.mjs');
  assert.match(line, /^src\/lib\/shared\.mjs is gone and these still name it: /);
  assert.equal(line.split(': ')[1].split(', ').length, 8, 'at most 8 files');
  assert.deepEqual(said('src/lib/stem.ts'), ['src/lib/stem.ts is gone and these still name it: src/by-stem.ts'], 'a code file by its stem too, bounded, so that a word is no hit');
  assert.deepEqual(said('src/lib/index.ts'), ['src/lib/index.ts is gone and these still name it: src/by-name.ts'], 'an index file by its whole name only: every folder has one');
  assert.deepEqual(said('src/note.md'), ['src/note.md is gone and these still name it: src/reader.ts'], 'a file no row holds too');
  assert.deepEqual(said('src/untracked-user-of.json'), [], 'and a name nothing holds is no line');
  f.put('src/fresh-user.ts', "const a = 'untracked-user-of.json';\n");
  assert.deepEqual(said('src/untracked-user-of.json'), ['src/untracked-user-of.json is gone and these still name it: src/fresh-user.ts'], 'a file not yet committed counts');
  rmSync(join(f.root, 'src/fresh-user.ts'));
  assert.throws(() => leftBehind(tmpdir(), registry, ['a.ts']), /git grep failed/, 'a search that did not run is no empty result');

  passed(await f.run('SessionStart'));
  f.remove('src/note.md');
  const heard = await f.run('SubagentStop');
  assert.equal(heard.status, 2, 'a subagent hears it');
  assert.ok(heard.message.startsWith('CODE CHECK NOTE: src/note.md is gone and these still name it: src/reader.ts\n'), heard.message);
  passed(await f.run('SubagentStop'), 'once');
  const main = await f.run('Stop');
  assert.equal(main.status, 2, 'and the main agent too, once');
  assert.match(main.message, /src\/note\.md is gone/);
  passed(await f.run('Stop'));
  f.put('src/note.md', 'a\n');
  passed(await f.run('Stop'), 'back in the tree, nothing to say');
  f.remove('src/note.md');
  assert.equal((await f.run('Stop')).status, 2, 'gone again is news');
  passed(await f.run('Stop'));

  const earlier = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/note.md': 'a\n', 'src/reader.ts': "const a = 'src/note.md';\n" } });
  earlier.remove('src/note.md');
  passed(await earlier.run('SessionStart'));
  passed(await earlier.run('Stop'), 'a file gone before this session is no work of it');
  const backAgain = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/note.md': 'a\n', 'src/reader.ts': "const a = 'src/note.md';\n" } });
  passed(await backAgain.run('SessionStart'));
  backAgain.remove('src/note.md');
  assert.equal((await backAgain.run('SubagentStop')).status, 2);
  backAgain.put('src/note.md', 'a\n');
  passed(await backAgain.run('Stop'), 'a note held of a file that came back is dropped');
  const folder = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await folder.run('SessionStart'));
  mkdirSync(join(folder.root, 'src/nested'));
  spawnSync('git', ['init', '-q'], { cwd: join(folder.root, 'src/nested') });
  writeFileSync(join(folder.root, 'src/nested/a.txt'), 'a\n');
  spawnSync('git', ['add', '-A'], { cwd: join(folder.root, 'src/nested') });
  spawnSync('git', ['-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'a'], { cwd: join(folder.root, 'src/nested') });
  passed(await folder.run('Stop'), 'a nested repository, listed as a folder, is no failure');
});

test('Task 945: a repeated attempt on the same versions shows what it stored, and a subagent is refused once', async t => {
  const script = `${MARK}import { readFileSync } from 'node:fs';\nif (/BROKEN/.test(readFileSync('src/a.ts', 'utf8'))) { console.error('the failure'); process.exit(1); }\n`;
  const build = () => {
    const f = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/fail.mjs`] }]), files: { 'tests/fail.mjs': script, 'src/a.ts': 'export const a = 1;\n', 'src/note.md': 'a\n' } });
    return f;
  };
  const f = build();
  passed(await f.run('SessionStart'));
  f.put('src/a.ts', '// BROKEN\n');
  const first = await f.run('Stop');
  assert.equal(first.status, 2);
  assert.match(first.message, /the failure/);
  assert.doesNotMatch(first.message, /Shown again/);
  assert.equal(f.marks().length, 1);
  for (const extra of [{}, { stop_hook_active: true }]) {
    const again = await f.run('Stop', extra);
    assert.equal(again.status, 2, 'Stop refuses every attempt');
    assert.match(again.message, /the failure/, 'with the stored failure');
    assert.match(again.message, /Shown again: nothing under the roots changed since this ran, so it did not run again\. Changing a file under the roots runs it\./);
    assert.ok(again.message.endsWith('A session that wrote none of these files reports that instead of changing them.'), again.message);
    assert.equal(f.marks().length, 1, 'and no command ran');
  }
  f.put('src/note.md', 'b\n');
  assert.equal((await f.run('Stop')).status, 2);
  assert.equal(f.marks().length, 2, 'a file no row holds is part of the set, since a check may read it');
  f.put('src/a.ts', '// BROKEN again\n');
  assert.equal((await f.run('Stop')).status, 2);
  assert.equal(f.marks().length, 3, 'a new version runs again');
  f.put('src/a.ts', 'export const a = 2;\n');
  passed(await f.run('Stop'), 'and a fix passes');
  assert.equal(f.marks().length, 4);
  assert.equal(f.state().runs, undefined, 'and nothing stays stored');

  const hanging = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/hangs.mjs`] }], { timeoutMs: { write: 50000, stop: 1500 } }), files: { 'tests/hangs.mjs': `${MARK}setInterval(() => {}, 1000);\n`, 'src/a.ts': 'export const a = 1;\n' } });
  passed(await hanging.run('SessionStart'));
  hanging.put('src/a.ts', 'export const a = 2;\n');
  for (let attempt = 1; attempt <= 2; attempt++) {
    const unfinished = await hanging.run('Stop');
    assert.match(unfinished.message, /could not finish \(timeout\)/);
    assert.doesNotMatch(unfinished.message, /Shown again/);
    assert.equal(hanging.marks().length, attempt, 'a check that did not finish reruns');
  }

  const sub = build();
  passed(await sub.run('SessionStart'));
  sub.put('src/a.ts', '// BROKEN\n');
  const statuses = [];
  for (let attempt = 0; attempt < 10; attempt++) statuses.push((await sub.run('SubagentStop')).status);
  assert.deepEqual(statuses, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'one refusal of ten');
  assert.equal(sub.marks().length, 1, 'one run');
  for (let attempt = 0; attempt < 2; attempt++) {
    const main = await sub.run('Stop');
    assert.equal(main.status, 2, 'the main agent is refused on every attempt');
    assert.match(main.message, /the failure/);
  }
  assert.ok(sub.marks().length <= 2, 'at most one further run');
  sub.put('src/a.ts', '// BROKEN too\n');
  assert.equal((await sub.run('SubagentStop')).status, 2, 'a new set of versions is news to a subagent');
  sub.put('src/a.ts', 'export const a = 3;\n');
  passed(await sub.run('SubagentStop'), 'a fix passes');
  assert.equal(sub.state().subagentRefused, undefined);
  sub.put('src/a.ts', '// BROKEN\n');
  assert.equal((await sub.run('SubagentStop')).status, 2, 'and the old refused set is no pass when it comes back');

  const keyed = fixture(t, { registry: registryOf([LINT_ROW], { secure: [{ paths: ['**/*'], refuse: true, pattern: 'FORBIDDEN', what: 'refused text' }] }), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await keyed.run('SessionStart'));
  keyed.put('src/a.ts', 'const a = "FORBIDDEN";\n');
  assert.equal((await keyed.run('SubagentStop')).status, 2);
  passed(await keyed.run('SubagentStop'), 'what must never enter the tree too: a subagent may have written none of it');
  assert.equal((await keyed.run('Stop')).status, 2);
  assert.equal((await keyed.run('Stop')).status, 2, 'and the main agent is refused on every attempt');
});

test('Task 945: a check that left a process holding its pipes past the grace period did not finish', async t => {
  const hold = "import { spawn } from 'node:child_process';\nimport { writeFileSync } from 'node:fs';\nconst child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'inherit' });\nchild.unref();\nwriteFileSync('held.json', JSON.stringify(child.pid));\nprocess.exit(0);\n";
  const f = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/hold.mjs`] }], { timeoutMs: { write: 50000, stop: 1500 } }), files: { 'tests/hold.mjs': hold, 'src/a.ts': 'export const a = 1;\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/a.ts', 'export const a = 2;\n');
  const started = Date.now();
  const result = await f.run('Stop');
  const held = JSON.parse(readFileSync(join(f.root, 'held.json'), 'utf8'));
  // The process left on purpose is ended whatever the assertions say, and before the folder it runs in is removed.
  try {
    assert.equal(alive(held), true, 'the process that holds the pipes is still there, so the check could not have closed');
    assert.equal(result.status, 2, 'a command whose pipes stay open past the grace period refuses');
    assert.match(result.message, /could not finish \(timeout\); a check that did not finish is a failure/);
    assert.ok(Date.now() - started < 30000, 'the decision still reached the agent');
  } finally {
    try { process.kill(held); } catch { /* it ended by itself */ }
    for (let i = 0; i < 40 && alive(held); i++) await new Promise(done => setTimeout(done, 100));
    // Windows keeps the folder of a killed process busy for a moment after the process is gone, and the removal below does not wait for that.
    await new Promise(done => setTimeout(done, 1000));
  }
});

test('Task 945: the real main of the differential, as a process, exits 1 on a lost target and 0 on an unchanged hook', t => {
  const folder = mkdtempSync(join(tmpdir(), 'lero-945-differential-main-'));
  t.after(() => rmSync(folder, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }));
  const hook = pathToFileURL(join(ROOT, 'scripts/workflow-gates/security-hook.mjs')).href;
  writeFileSync(join(folder, 'drops.mjs'), `import * as real from '${hook}';\nexport const shellWriteTargets = (...args) => real.shellWriteTargets(...args).slice(1);\n`);
  writeFileSync(join(folder, 'same.mjs'), `export { shellWriteTargets } from '${hook}';\n`);
  const script = join(ROOT, 'scripts/workflow-gates/hook-differential.mjs');
  // The limit comes first: the hook is the first argument that is no option, wherever it stands.
  const run = file => spawnSync(process.execPath, [script, '--limit=400', join(folder, file)], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  const drops = run('drops.mjs');
  assert.equal(drops.status, 1, `${drops.stdout}${drops.stderr}`);
  const lost = Number(/^LOST (\d+)$/m.exec(drops.stdout)?.[1]);
  assert.ok(lost > 0, drops.stdout);
  assert.match(drops.stdout, /^compared 400;/m, 'the limit it was given');
  const same = run('same.mjs');
  assert.equal(same.status, 0, `${same.stdout}${same.stderr}`);
  assert.match(same.stdout, /^LOST 0$/m);
});

test('Task 945: the CI lint runs on a gate script at the write, which the default config would pass', t => {
  const registry = JSON.parse(readFileSync(join(ROOT, REGISTRY), 'utf8'));
  const row = registry.rows.find(entry => entry.paths.includes('scripts/workflow-gates/*.mjs'));
  assert.deepEqual(row, { paths: ['scripts/workflow-gates/*.mjs'], write: [WRITE_ROWS.ciLint], stop: [] }, 'the row of R20');
  const chain = realChain(t);
  chain.start();
  chain.put('scripts/workflow-gates/fresh.mjs', 'const unused = 1;\n');
  const script = join(chain.root, 'scripts/workflow-gates/fresh.mjs');
  const plain = spawnSync(process.execPath, ['node_modules/eslint/bin/eslint.js', '--quiet', script], { cwd: chain.root, encoding: 'utf8', timeout: 120000 });
  assert.equal(plain.status, 0, `the default config passes it: ${plain.stdout}`);
  const run = chain.hook('PostToolUse', 'scripts/workflow-gates/fresh.mjs');
  assert.equal(run.status, 2, run.stderr);
  assert.match(run.stderr, /'unused' is assigned a value but never used/);
});

const alive = id => { try { process.kill(id, 0); return true; } catch { return false; } };
test('[GOV-945-HOOK-TIMEOUT-ERROR] A check that did not run is a failure and leaves no process', async t => {
  const hung = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/hang.mjs`] }], { timeoutMs: { write: 50000, stop: 3000 } }), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await hung.run('SessionStart'));
  hung.put('src/a.ts', 'export const a = 2;\n');
  const started = Date.now();
  const result = await hung.run('Stop');
  assert.equal(result.status, 2, 'a command past the limit refuses');
  assert.match(result.message, /could not finish \(timeout\); a check that did not finish is a failure/);
  assert.ok(Date.now() - started < 30000, 'the stage ended at its limit');
  const ids = JSON.parse(readFileSync(join(hung.root, 'pids.json'), 'utf8'));
  assert.equal(ids.length, 2, 'the command and its child wrote their ids');
  // A killed orphan is reaped by the system a moment after the kill.
  for (let i = 0; i < 40 && ids.some(alive); i++) await new Promise(done => setTimeout(done, 100));
  assert.deepEqual(ids.filter(alive), [], 'neither process is alive');

  const unreadable = fixture(t, { registry: '{ not json' });
  const broken = await unreadable.run('Stop');
  assert.equal(broken.status, 2, 'an unreadable registry refuses');
  assert.ok(broken.message.startsWith('CODE CHECK COULD NOT RUN: '), broken.message);

  const shapeless = fixture(t, { registry: { roots: ['src'], rows: [] } });
  const wrong = await shapeless.run('PostToolUse', SHELL);
  assert.equal(wrong.status, 2, 'a registry without its fields refuses');
  assert.match(wrong.message, /CODE CHECK COULD NOT RUN/);

  const noRepository = fixture(t, { registry: registryOf([LINT_ROW]), git: false });
  const outside = await noRepository.run('Stop');
  assert.equal(outside.status, 2, 'a folder that is no Git repository refuses');
  assert.match(outside.message, /CODE CHECK COULD NOT RUN: git status failed/);

  const damaged = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await damaged.run('SessionStart'));
  writeFileSync(join(damaged.root, 'test-results/code-check/s1.json'), '{ damaged');
  const unreadableState = await damaged.run('Stop');
  assert.equal(unreadableState.status, 2, 'a damaged state is no missing state: a new baseline would forgive what the session changed');
  assert.match(unreadableState.message, /CODE CHECK COULD NOT RUN: the state file .*s1\.json is damaged/);

  const stateFolder = fixture(t, { registry: registryOf([LINT_ROW]) });
  mkdirSync(join(stateFolder.root, 'test-results/code-check/s1.json'), { recursive: true });
  const noRead = await stateFolder.run('Stop');
  assert.equal(noRead.status, 2, 'a state that cannot be read is no missing state');
  assert.match(noRead.message, /CODE CHECK COULD NOT RUN/);

  for (const event of [null, { session_id: 's1' }]) {
    const unnamed = await runCodeCheck(event, stateFolder.root);
    assert.equal(unnamed.status, 2, `an event with no hook name refuses: ${JSON.stringify(event)}`);
    assert.match(unnamed.message, /CODE CHECK COULD NOT RUN: the event names no hook/);
  }

  const main = spawnSync(process.execPath, [join(ROOT, TOOL)], { cwd: ROOT, encoding: 'utf8', timeout: 30000,
    input: JSON.stringify({ hook_event_name: 'Stop', session_id: 's1' }), env: { ...process.env, CLAUDE_PROJECT_DIR: unreadable.root } });
  assert.equal(main.status, 2, 'the real main exits 2');
  assert.match(main.stderr, /^CODE CHECK COULD NOT RUN: /, 'with the text on stderr');
  const noEvent = spawnSync(process.execPath, [join(ROOT, TOOL)], { cwd: ROOT, encoding: 'utf8', timeout: 30000, input: '{ not json', env: { ...process.env, CLAUDE_PROJECT_DIR: unreadable.root } });
  assert.equal(noEvent.status, 2, 'an unreadable event refuses too');
  assert.match(noEvent.stderr, /CODE CHECK COULD NOT RUN/);
});

test('[GOV-945-CI-SETTINGS-DENY] The tool cannot be left out of the settings', t => {
  const settings = JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8'));
  assert.deepEqual(validateSettings(ROOT, settings), [], 'the real settings give no error');
  const registered = event => settings.hooks[event].filter(group => group.hooks.some(hook => hook.args?.includes(TOOL_ARG)));
  for (const [event, timeout] of [['SessionStart', 15], ['PostToolUse', 60], ['Stop', 300], ['SubagentStop', 300]]) {
    assert.equal(registered(event).length, 1, `${event} registers the tool once`);
    const hook = registered(event)[0].hooks.find(entry => entry.args.includes(TOOL_ARG));
    assert.equal(hook.command, 'node');
    assert.equal(hook.timeout, timeout, `${event} timeout`);
    assert.equal(hook.onFailure, 'block');
    const removed = JSON.parse(JSON.stringify(settings));
    removed.hooks[event] = removed.hooks[event].filter(group => !group.hooks.some(entry => entry.args?.includes(TOOL_ARG)));
    assert.match(validateSettings(ROOT, removed).join('\n'), new RegExp(`${event}: the code check tool is not registered`), `removed from ${event}`);
    const gone = JSON.parse(JSON.stringify(settings));
    if (['PostToolUse', 'SubagentStop'].includes(event)) {
      delete gone.hooks[event];
      assert.match(validateSettings(ROOT, gone).join('\n'), new RegExp(`${event}: the code check tool is not registered`), `${event} deleted`);
    }
  }
  const narrowed = JSON.parse(JSON.stringify(settings));
  narrowed.hooks.PostToolUse[0].matcher = 'Edit';
  assert.match(validateSettings(ROOT, narrowed).join('\n'), /PostToolUse: mandatory hook matcher is narrowed or changed/, 'a narrowed matcher');
  assert.ok(hookModuleClosure(ROOT).includes(TOOL), 'the guard closure holds the tool');

  // The real registered command, with the variable replaced by the fixture root, runs as a hook process.
  const f = fixture(t, { registry: '{ not json' });
  mkdirSync(join(f.root, dirname(TOOL)), { recursive: true });
  copyFileSync(join(ROOT, TOOL), join(f.root, TOOL));
  for (const event of ['SessionStart', 'PostToolUse', 'Stop', 'SubagentStop']) {
    const hook = registered(event)[0].hooks.find(entry => entry.args.includes(TOOL_ARG));
    const args = hook.args.map(arg => arg.replace('${CLAUDE_PROJECT_DIR}', f.root));
    const child = spawnSync(hook.command, args, { cwd: f.root, encoding: 'utf8', timeout: 30000, input: JSON.stringify({ hook_event_name: event, session_id: 's1' }), env: { ...process.env, CLAUDE_PROJECT_DIR: f.root } });
    assert.equal(child.status, 2, `${event} process exit`);
    assert.match(child.stderr, /^CODE CHECK COULD NOT RUN: /, `${event} stderr`);
  }
});

test('[GOV-945-HOOK-EXECUTOR-DENY] Sonnet cannot change the tool', () => {
  for (const file of [TOOL, REGISTRY, 'scripts/workflow-gates/hook-differential.mjs', 'scripts/workflow-gates/hook-corrections.json', 'scripts/workflow-gates/mutation-check.mjs', 'scripts/workflow-gates/mutation-loader.mjs', 'scripts/workflow-gates/mutation-vitest.config.mjs']) {
    const refused = evaluateHook(ROOT, { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: file, old_string: 'a', new_string: 'b' } }, '').join('\n');
    assert.match(refused, /POLICY-EDIT AUTHORITY REQUIRED|SECURITY TEST CONTRACT MISSING/, `Edit of ${file} by Sonnet`);
  }
  // What steers another tool or an install, also while a product contract is loaded: that contract's scope is no authority over policy.
  const product = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'SECURITY TASK PREFLIGHT COMPLETE - contract: tasks/Sprints/Sprint_92_kickoff_prompt_Task_939_Locale_Leak_Shards_Green.security.json' }] } });
  for (const file of ['AGENTS.md', 'CLAUDE.md', '.codex/config.toml', '.npmrc', '.github/CODEOWNERS', 'docs/orchestrator-procedures.md', 'docs/governance-enforcement.md']) {
    assert.equal(isPolicyPath(file), true, file);
    assert.equal(isGovernanceScopePath(file), true, `a governance task may hold ${file}`);
    const event = { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: file, old_string: 'a', new_string: 'b' } };
    for (const transcript of ['', product]) assert.match(evaluateHook(ROOT, event, transcript).join('\n'), /POLICY-EDIT AUTHORITY REQUIRED/, `Edit of ${file} by Sonnet, ${transcript ? 'with' : 'without'} a product contract`);
    assert.deepEqual(evaluateHook(ROOT, { ...event, model: 'opus' }, ''), [], `Opus may edit ${file}`);
  }
  for (const file of ['docs/AGENTS.md', 'AGENTS.md.bak', 'src/CLAUDE.md', '.npmrc.bak', '.github/CODEOWNERS.txt', 'my.codex/x', 'docs/orchestrator-role.md']) assert.equal(isPolicyPath(file), false, `${file} is none of them`);
});

// Found in the prototype by the implementer: three defects a real session would have met. No sidecar case maps them; the gate suite runs them.
test('Task 945: a Read of a clean code file runs nothing', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'debugger;\n' } });
  passed(await f.run('SessionStart'));
  passed(await f.run('PostToolUse', { tool_name: 'Read', tool_input: { file_path: join(f.root, 'src/a.ts') } }));
  passed(await f.run('Stop'));
  assert.deepEqual(f.marks(), []);
});

test('Task 945: a file a write tool names is checked although the tree cannot show it, and stays counted at Stop', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { '.gitignore': 'src/ignored.ts\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/ignored.ts', 'debugger;\n');
  passed(await f.run('PostToolUse', SHELL), 'the tree does not show an ignored file');
  const failed = await f.run('PostToolUse', f.edit('src/ignored.ts'));
  assert.equal(failed.status, 2, 'the write tool names it');
  assert.equal((await f.run('Stop')).status, 2, 'and Stop still refuses it');
  f.put('src/ignored.ts', 'export const fine = 1;\n');
  passed(await f.run('Stop'));
  const wide = fixture(t, { registry: registryOf([{ paths: ['**/*.ts'], write: [`${NODE} tests/mark.mjs wide`], stop: [] }]) });
  passed(await wide.run('SessionStart'));
  passed(await wide.run('PostToolUse', { tool_name: 'Write', tool_input: { file_path: join(wide.root, '..', 'elsewhere', 'a.ts') } }), 'a file outside the project is not the project\'s');
  assert.deepEqual(wide.marks(), [], 'even under a row that would match it');
});

test('Task 945: every changed file reaches a {files} command once, in batches a command line can hold', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW, { paths: ['src/**/*.ts'], write: [`${NODE} tests/lint.mjs {files}`], stop: [] }]) });
  passed(await f.run('SessionStart'));
  const files = Array.from({ length: 260 }, (_, i) => `src/a-rather-long-folder-name/deep/file-${String(i).padStart(3, '0')}.ts`);
  for (const file of files) f.put(file, 'export const a = 1;\n');
  passed(await f.run('PostToolUse', SHELL), 'more text than cmd.exe accepts at once still runs');
  const batches = f.marks().map(mark => mark.split(' ').slice(1));
  assert.ok(batches.length > 1, 'in more than one batch');
  assert.deepEqual(batches.flat().sort(), files, 'each file exactly once, although two rows hold the command');
});

test('Task 945: a version is recorded as the one the check saw, not the one after it', async t => {
  const f = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [`${NODE} tests/rewrite.mjs`], stop: [] }]), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/a.ts', 'export const a = 2;\n');
  passed(await f.run('PostToolUse', SHELL));
  assert.equal(f.marks().length, 1);
  passed(await f.run('PostToolUse', SHELL));
  assert.equal(f.marks().length, 2, 'the text written during the check gets its own check');
  passed(await f.run('PostToolUse', SHELL));
  assert.equal(f.marks().length, 2, 'and is then passed');
});

test('Task 945: a name no command line can quote is a failure, not a pass', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]) });
  passed(await f.run('SessionStart'));
  f.put("src/it's.ts", 'export const a = 1;\n');
  const failed = await f.run('PostToolUse', SHELL);
  assert.equal(failed.status, 2);
  assert.match(failed.message, /src\/it's\.ts: could not finish \(its name holds a character no command line can quote\)/);
});

test('Task 945: a file of the roots no row holds is no code file', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'export const a = 1;\n', 'src/note.md': 'a\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/note.md', 'b\n');
  passed(await f.run('PostToolUse', SHELL));
  assert.deepEqual(f.marks(), [], 'a document runs nothing');
  f.put('src/note.md', 'c\n');
  f.put('src/a.ts', 'debugger;\n');
  const failed = await f.run('PostToolUse', SHELL);
  assert.match(failed.message, /^CODE CHECK FAILED after a write to src\/a\.ts\. Fix this now/, 'and is not named as a written file');
});

test('Task 945: one path reaches a {file} command as one word, whether or not the command quotes it', async t => {
  const count = "import { appendFileSync } from 'node:fs';\nappendFileSync('marks.log', `${process.argv.length - 2}\\n`);\n";
  const f = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [`${NODE} tests/count.mjs {file}`, `${NODE} tests/count.mjs "{file}"`], stop: [] }]), files: { 'tests/count.mjs': count } });
  passed(await f.run('SessionStart'));
  f.put('src/a b.ts', 'export const a = 1;\n');
  passed(await f.run('PostToolUse', SHELL));
  assert.deepEqual(f.marks(), ['1', '1']);
});

test('Task 945: the state of a session is named by its session id, and a hostile id stays inside the state folder', async t => {
  const f = fixture(t, { registry: registryOf([LINT_ROW]) });
  passed(await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 'b72acaec-300b-422f' }, f.root));
  assert.ok(existsSync(join(f.root, 'test-results/code-check/b72acaec-300b-422f.json')));
  passed(await runCodeCheck({ hook_event_name: 'SessionStart', session_id: '../../escape' }, f.root));
  assert.ok(existsSync(join(f.root, 'test-results/code-check/______escape.json')));
});

test('Task 945: a failed test above the tail of the output still reaches the agent', async t => {
  const report = "console.log('ok 1 - fine'); console.log('not ok 2 - the broken test'); console.log('  error: the reason'); for (let i = 0; i < 60; i++) console.log(`ok ${i + 3} - fine`); process.exit(1);\n";
  const f = fixture(t, { registry: registryOf([{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/report.mjs`] }]), files: { 'tests/report.mjs': report, 'src/a.ts': 'export const a = 1;\n' } });
  passed(await f.run('SessionStart'));
  f.put('src/a.ts', 'export const a = 2;\n');
  const failed = await f.run('Stop');
  assert.equal(failed.status, 2);
  assert.match(failed.message, /not ok 2 - the broken test\n\s+error: the reason/, 'the failed test and its reason');
  assert.match(failed.message, /ok 62 - fine/, 'and the tail');
});

test('Task 945: the real PowerShell row gets its path inside its own quotes and fails on a broken script', { skip: process.platform !== 'win32' }, async t => {
  const row = JSON.parse(readFileSync(join(ROOT, REGISTRY), 'utf8')).rows.find(entry => entry.paths.includes('.claude/hooks/*.ps1'));
  const f = fixture(t, { registry: registryOf([{ ...row, stop: [] }], { roots: ['.claude/hooks'] }), files: { '.claude/hooks/a.ps1': 'Write-Output 1\n' } });
  passed(await f.run('SessionStart'));
  f.put('.claude/hooks/a.ps1', 'Write-Output 2\n');
  passed(await f.run('PostToolUse', SHELL), 'a clean script parses');
  f.put('.claude/hooks/a.ps1', 'function broken {\n');
  const failed = await f.run('PostToolUse', SHELL);
  assert.equal(failed.status, 2, 'a broken script refuses');
  assert.match(failed.message, /Missing closing '}'/);
  f.put('.claude/hooks/a.ps1', 'Write-Output 3\n');
  f.put('.claude/hooks/a b.ps1', 'Write-Output 4\n');
  passed(await f.run('PostToolUse', SHELL), 'a path with a space stays one word inside the quotes of the command');
});

test('Task 945: a staged rename counts the old path as gone, also when the new name is no code file', async t => {
  const stage = { paths: ['src/**/*.ts'], write: [`${NODE} tests/mark.mjs names-no-file`], stop: [] };
  const f = fixture(t, { registry: registryOf([stage]), files: { 'src/old.ts': 'export const a = 1;\n' } });
  passed(await f.run('SessionStart'));
  renameSync(join(f.root, 'src/old.ts'), join(f.root, 'src/old.txt'));
  f.inRepo('add', '-A');
  passed(await f.run('PostToolUse', SHELL));
  assert.deepEqual(f.marks(), ['mark.mjs names-no-file'], 'the command that names no file ran for the deletion');
});

// The defect runs over the lines of revision 1 found these unread by any test; each assertion below fails under one of them.
test('Task 945: what a note quotes is bounded, a quoted path is read back whole, and a rule reads every path it names', async t => {
  const rule = { patterns: [/^src\//], line: /MARKER/, find: /MARKER/g, what: 'a marker', hidden: [] };
  const f = fixture(t, { registry: registryOf([LINT_ROW]), files: { 'src/a.ts': 'MARKER\n', 'src/b.ts': 'MARKER\n' } });
  f.put('src/a.ts', ['MARKER', ...Array.from({ length: 7 }, (_, i) => `MARKER ${i} ${'x'.repeat(150)}`)].join('\n'));
  const lines = added(f.root, [rule], ['src/a.ts']);
  assert.equal(lines.length, 5, 'five lines at most');
  assert.equal(lines[0], `src/a.ts:2: a marker: MARKER 0 ${'x'.repeat(111)}`, 'each cut at 120 characters');
  f.put('src/b.ts', 'MARKER\nMARKER\nMARKER\n');
  assert.deepEqual(added(f.root, [rule], ['src/b.ts']), ['src/b.ts: a marker: 2 more than at HEAD'], 'with no new line of text, the count it grew by');

  const header = '+++ "b/a\\a\\b\\f\\n\\r\\t\\v\\303\\251.txt"';
  assert.deepEqual(addedLinesOf(['diff --git x y', '--- /dev/null', header, '@@ -0,0 +1 @@', '+k', ''].join('\n')), [{ file: 'a\u0007\u0008\u000c\n\r\t\u000bé.txt', line: 1, text: 'k' }], 'each escape Git writes in a quoted path');

  const keyed = fixture(t, { registry: registryOf([LINT_ROW], { secure: [{ paths: ['docs/**/*', 'notes/**/*'], refuse: true, pattern: 'FORBIDDEN', what: 'refused text' }] }) });
  keyed.put('notes/a.txt', 'FORBIDDEN\n');
  assert.deepEqual(refusedLines(keyed.root, null, ['notes/a.txt']), [{ file: 'notes/a.txt', line: 1, rule: 'refused text' }], 'a file under any path of the rule is read');
  const probe = at => {
    const bytes = Buffer.alloc(8100, 0x20);
    bytes.write('FORBIDDEN\n', 0);
    bytes[at] = 0;
    keyed.put('notes/b.txt', bytes);
    return refusedLines(keyed.root, null, ['notes/b.txt']).length;
  };
  assert.equal(probe(7999), 0, 'a NUL in the first 8000 bytes makes a file binary, as Git reads it');
  assert.equal(probe(8000), 1, 'one past them does not');
});

test('Task 945: a refused write is shown once at the writes, a state saved before revision 1 still reads, and a finding in one of two files blocks', async t => {
  const once = fixture(t, { registry: registryOf([LINT_ROW], { secure: [{ paths: ['**/*'], refuse: true, pattern: 'FORBIDDEN', what: 'refused text' }] }), files: { 'src/a.ts': 'export const a = 1;\n' } });
  passed(await once.run('SessionStart'));
  once.put('src/a.ts', 'export const a = "FORBIDDEN";\n');
  assert.equal((await once.run('PostToolUse', once.edit('src/a.ts'))).status, 2);
  passed(await once.run('PostToolUse', SHELL), 'not again at the next command');
  assert.equal((await once.run('Stop')).status, 2, 'and refused at every Stop');

  const libraryRow = registryOf([{ paths: ['src/**/*.mjs'], write: [], stop: [] }]);
  const consumer = { 'src/use.mjs': "import { a } from './lib.mjs';\nexport const b = a;\n" };
  const old = fixture(t, { registry: libraryRow, files: { ...consumer, 'src/lib.mjs': 'export const a = 1;\n' } });
  passed(await old.run('SessionStart'));
  const shape = old.state();
  for (const field of ['goneBefore', 'othersBefore', 'told', 'deletions']) delete shape[field];
  writeFileSync(join(old.root, 'test-results/code-check/s1.json'), JSON.stringify(shape));
  old.remove('src/lib.mjs');
  const told = await old.run('Stop');
  assert.equal(told.status, 2, told.message);
  assert.match(told.message, /^CODE CHECK NOTE: src\/lib\.mjs is gone and these still name it: src\/use\.mjs$/m, 'a state with none of the fields of revision 1');

  const untracked = fixture(t, { registry: libraryRow, files: consumer });
  untracked.put('src/lib.mjs', 'export const a = 1;\n');
  passed(await untracked.run('SessionStart'));
  untracked.remove('src/lib.mjs');
  assert.match((await untracked.run('Stop')).message, /src\/lib\.mjs is gone and these still name it: src\/use\.mjs/, 'a file that was untracked at the start and goes is a deletion too');

  const unheld = fixture(t, { registry: libraryRow, files: { 'src/read.mjs': "export const path = './data.json';\n" } });
  unheld.put('src/data.json', '{}\n');
  passed(await unheld.run('SessionStart'));
  unheld.remove('src/data.json');
  const unheldTold = await unheld.run('Stop');
  assert.match(unheldTold.message, /src\/data\.json is gone and these still name it: src\/read\.mjs/, 'one no row holds, untracked at the start: R13 names it too');
  passed(await unheld.run('Stop'), 'once');

  const renamed = fixture(t, { registry: libraryRow, files: { 'src/data.json': '{}\n', 'src/read.mjs': "export const path = './data.json';\n" } });
  passed(await renamed.run('SessionStart'));
  renamed.inRepo('mv', 'src/data.json', 'src/moved.json');
  assert.match((await renamed.run('Stop')).message, /src\/data\.json is gone and these still name it: src\/read\.mjs/, 'the old path of a staged rename no row holds');

  const pair = fixture(t, { registry: registryOf([{ paths: ['src/each/**/*.ts'], write: [], stop: [{ run: `${NODE} tests/pair.mjs`, namesFile: true, finding: '^\\s+\\S+:\\d+:\\d+\\s' }] }]),
    files: { 'src/each/a.ts': 'export const a = 1;\n', 'src/each/other.ts': 'export const b = 1;\n', 'tests/pair.mjs': "console.error('  src/each/a.ts:1:2 finding'); process.exit(1);\n" } });
  passed(await pair.run('SessionStart'));
  pair.put('src/each/a.ts', 'export const a = 2;\n');
  pair.put('src/each/other.ts', 'export const b = 2;\n');
  assert.equal((await pair.run('Stop')).status, 2, 'a finding that names one of two changed files');
});

test('Task 945: a defect no test noticed reaches the agent at Stop', async t => {
  const mutation = { timeoutMs: 120000, hookMs: 285000, perMutantMs: 20000, concurrency: 1, shown: 8, rows: [{ paths: ['src/**/*.mjs'], run: `${NODE} tests/weak.mjs` }] };
  const weak = fixture(t, { registry: registryOf([{ paths: ['src/**/*.mjs'], write: [], stop: [] }], { mutation }),
    files: { 'src/sum.mjs': 'export const sum = 1;\n', 'tests/weak.mjs': "import { sum } from '../src/sum.mjs';\nif (typeof sum !== 'number') process.exit(1);\n" } });
  passed(await weak.run('SessionStart'));
  weak.put('src/sum.mjs', 'export const sum = 1 + 2;\n');
  const noted = await weak.run('Stop');
  assert.equal(noted.status, 2, noted.message);
  assert.match(noted.message, /^CODE CHECK NOTE: this code was broken on purpose, with the defect stored in memory only\./m);
  assert.match(noted.message, /^src\/sum\.mjs:1: `\+` became `-`, and every test still passed$/m);
});

test('Task 945: AGENTS.md is a document of a governance scope, and a Markdown file elsewhere is not', () => {
  assert.equal(isGovernanceScopePath('AGENTS.md'), true);
  for (const file of ['README.md', 'notes/plan.md', 'docs/data.json']) assert.equal(isGovernanceScopePath(file), false, file);
});

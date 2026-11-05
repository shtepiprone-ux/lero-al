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
import { fileURLToPath } from 'node:url';
import { runCodeCheck } from './code-check.mjs';
import { differential } from './hook-differential.mjs';
import { validateSettings } from './check-workflow.mjs';
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
};
const REAL_ROOTS = ['src', 'scripts', '.claude/hooks', '.claude/settings.json', 'messages', '.storybook', 'tsconfig.json', 'package.json', 'next.config.ts', 'vitest.config.ts', 'vitest.integration.config.ts', 'eslint.config.mjs', 'postcss.config.mjs', 'sentry.edge.config.ts', 'sentry.server.config.ts', 'package-lock.json', '.npmrc', 'supabase/migrations', '.github/workflows', 'CLAUDE.md', 'AGENTS.md', '.codex', '.claude/rules', '.claude/skills', '.claude/agents'];
const REAL_ROWS = [
  { paths: ['src/**/*.ts', 'src/**/*.tsx'], write: [WRITE_ROWS.eslint, WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: [WRITE_ROWS.related] },
  { paths: ['src/**/*.tsx', 'src/**/*.css'], write: [WRITE_ROWS.integrity], stop: [{ run: 'node scripts/check-design-tokens.mjs --strict', namesFile: true }] },
  { paths: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.css', 'messages/*.json'], write: [], stop: [{ run: 'node scripts/check-mojibake.mjs', namesFile: true, folders: ['docs/', 'src/', 'messages/', 'tasks/', 'scripts/'] }] },
  { paths: ['scripts/**/*.mjs', 'scripts/**/*.js', 'scripts/**/*.cjs'], write: [WRITE_ROWS.integrity], stop: [WRITE_ROWS.gates] },
  // The gate suite reaches the gates only. A scanner in scripts/ has its vitest tests in scripts/__tests__, and they run here.
  { paths: ['scripts/*.mjs', 'scripts/*.js', 'scripts/*.cjs', 'scripts/lib/**/*.mjs', 'scripts/governance/**/*.mjs', 'scripts/rendered-state-census/**/*.mjs'], write: [], stop: [WRITE_ROWS.related] },
  { paths: ['scripts/**/*.ts'], write: [WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: [WRITE_ROWS.related] },
  { paths: ['scripts/**/*.json'], write: [WRITE_ROWS.integrity], stop: [WRITE_ROWS.gates, WRITE_ROWS.workflow] },
  { paths: ['scripts/workflow-gates/security-hook.mjs'], write: [], stop: ['node scripts/workflow-gates/hook-differential.mjs'] },
  { paths: ['.claude/hooks/*.ps1'], write: ["powershell -NoProfile -Command \"$e=$null;[void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '{file}'),[ref]$null,[ref]$e); if($e){$e[0].Message;exit 1}\""], stop: [WRITE_ROWS.workflow] },
  { paths: ['.claude/settings.json'], write: [WRITE_ROWS.integrity], stop: [WRITE_ROWS.workflow] },
  { paths: ['messages/*.json'], write: [WRITE_ROWS.integrity], stop: ['node scripts/check-i18n-parity.mjs'] },
  // A file that configures the checks can break the whole project, so its effect is checked too.
  { paths: ['tsconfig.json', 'package.json'], write: [WRITE_ROWS.integrity, WRITE_ROWS.tsc], stop: [] },
  { paths: ['package.json', 'package-lock.json'], write: [], stop: ['node scripts/workflow-gates/dependency-check.mjs'] },
  { paths: ['.github/workflows/*', '.npmrc', 'CLAUDE.md', 'AGENTS.md', '.codex/*', '.claude/rules/**/*', '.claude/skills/**/*', '.claude/agents/*'], write: [], stop: ['node scripts/workflow-gates/check-workflow.mjs'] },
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
    assert.ok(!commandsOf(row).some(command => /eslint/.test(command)), `ESLint ignores scripts, so it cannot fail for ${row.paths[0]}`);
  }
  assert.ok(!commands.some(command => /check-ui-contract/.test(command)), 'it reads committed revisions, so it cannot fail for the change');
  for (const entry of registry.rows.flatMap(row => row.stop)) if (/check-mojibake/.test(entry.run ?? entry)) assert.equal(entry.namesFile, true, 'it fails at this tree, so only a finding in a changed file counts');
  for (const command of commands) {
    const script = /^node (\S+)/.exec(command)?.[1];
    if (script) assert.ok(existsSync(join(ROOT, script)), `${script} exists`);
  }

  const gate = [{ paths: ['src/each/**/*.ts'], write: [], stop: [{ run: `${NODE} tests/tree-gate.mjs`, namesFile: true }] }];
  const tree = fixture(t, { registry: registryOf(gate), files: { 'src/each/known-bad.ts': 'export const bad = 1;\n', 'src/each/known-bad.tsx': 'export const near = 1;\n' } });
  passed(await tree.run('SessionStart'));
  tree.put('src/each/other.ts', 'export const other = 1;\n');
  passed(await tree.run('Stop'), 'a finding outside the change does not block');
  assert.equal(tree.marks().length, 1, 'the gate ran');
  const near = fixture(t, { registry: registryOf([{ paths: ['src/each/**/*.ts'], write: [], stop: [{ run: `${NODE} tests/near.mjs`, namesFile: true }] }]),
    files: { 'tests/near.mjs': "console.error('finding in src/each/wide.tsx and other-src/each/wide.ts'); process.exit(1);\n", 'src/each/wide.ts': 'export const wide = 1;\n', 'src/each/wide.tsx': 'export const near = 1;\n' } });
  passed(await near.run('SessionStart'));
  near.put('src/each/wide.ts', 'export const wide = 2;\n');
  passed(await near.run('Stop'), 'a finding path that merely holds the changed path does not count');
  tree.put('src/each/known-bad.ts', 'export const bad = 2;\n');
  const blocked = await tree.run('Stop');
  assert.equal(blocked.status, 2, 'a finding in a changed file blocks');
  assert.match(blocked.message, /finding in src\/each\/known-bad\.ts\nfinding 0 elsewhere/, 'with the details under it, which lie above the tail');
});

test('Task 945: a whole-tree gate that names no file it checks did not report, and that is no finding elsewhere', async t => {
  const gateRow = script => [{ paths: ['src/each/**/*.ts', 'src/each/**/*.css'], write: [], stop: [{ run: `${NODE} tests/${script}.mjs`, namesFile: true }] }];
  const crash = fixture(t, { registry: registryOf(gateRow('crash')), files: { 'src/each/a.ts': 'export const a = 1;\n', 'tests/crash.mjs': "console.log('scanning src/each/**/*.css'); console.error('Error: Cannot find module x'); console.error('    at file:///scripts/gate.mjs:1:1'); process.exit(1);\n" } });
  passed(await crash.run('SessionStart'));
  crash.put('src/each/a.ts', 'export const a = 2;\n');
  const failed = await crash.run('Stop');
  assert.equal(failed.status, 2, 'a gate that crashed refuses');
  assert.match(failed.message, /could not finish \(exit 1, and its output names no file it checks\)/);
  assert.match(failed.message, /Cannot find module x/, 'with its reason');
  assert.equal((await crash.run('Stop', { stop_hook_active: true })).status, 2, 'on every attempt');

  const folderOnly = fixture(t, { registry: registryOf(gateRow('folder')), files: { 'src/each/a.ts': 'export const a = 1;\n', 'tests/folder.mjs': "console.error('could not read src/each'); process.exit(1);\n" } });
  passed(await folderOnly.run('SessionStart'));
  folderOnly.put('src/each/a.ts', 'export const a = 2;\n');
  assert.equal((await folderOnly.run('Stop')).status, 2, 'a folder is no file');

  const elsewhere = fixture(t, { registry: registryOf(gateRow('elsewhere')), files: { 'src/each/a.ts': 'export const a = 1;\n', 'src/each/known/bad.css': 'a{}\n', 'tests/elsewhere.mjs': "console.error('  src/each/known/bad.css  (2)'); process.exit(1);\n" } });
  passed(await elsewhere.run('SessionStart'));
  elsewhere.put('src/each/a.ts', 'export const a = 2;\n');
  passed(await elsewhere.run('Stop'), 'a real finding elsewhere still does not block');

  const wider = fixture(t, { registry: registryOf([{ paths: ['src/each/**/*.ts'], write: [], stop: [{ run: `${NODE} tests/wider.mjs`, namesFile: true, folders: ['docs/'] }] }]), files: { 'src/each/a.ts': 'export const a = 1;\n', 'docs/old.md': 'a\n', 'tests/wider.mjs': "console.error('  docs/old.md:1 finding'); process.exit(1);\n" } });
  passed(await wider.run('SessionStart'));
  wider.put('src/each/a.ts', 'export const a = 2;\n');
  passed(await wider.run('Stop'), 'a gate that scans wider than its row names the folders it reports on');
});

test('Task 945: the real design-token gate reports the shape the whole-tree rule reads', () => {
  const run = spawnSync(process.execPath, ['scripts/check-design-tokens.mjs', '--strict'], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  if (run.status === 0) return;
  assert.match(`${run.stdout}${run.stderr}`, /^\s*src\/\S+\.(?:tsx?|css)\s+\(\d+\)$/m, 'a failing run names its files on lines of their own');
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
  assert.match('РџСЂРёРІС–С‚', rule('garbled Cyrillic'));
  for (const text of ['Руслан', 'Страна', 'Радість', 'Сьогодні']) assert.doesNotMatch(text, rule('garbled Cyrillic'), text);
  for (const entry of quieting) for (const path of entry.paths) assert.ok(typeof path === 'string' && entry.what, 'each rule names its files and what it finds');
});

// Every other test here uses fixture checks. This one runs the real registry through the real main, with the real ESLint config, tsc, vitest config and gates,
// because a fixture check proves the tool reads an exit code, and says nothing about whether the registry's commands see a real defect.
test('Task 945: the real registry stops real defects through the real main', async t => {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-chain-'));
  const link = join(root, 'node_modules');
  t.after(() => {
    // The link goes first and on its own, so that removing the folder can never reach what it points at.
    if (process.platform === 'win32') spawnSync('cmd', ['/c', 'rmdir', link]); else rmSync(link, { force: true });
    if (!existsSync(link)) rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  });
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  for (const file of ['eslint.config.mjs', 'tsconfig.json', 'vitest.config.ts', 'src/tests/setup.ts', 'src/tests/server-only-stub.ts', 'src/tests/next-cache-stub.ts', 'scripts/check-file-integrity.mjs',
    'scripts/check-design-tokens.mjs', 'scripts/design-tokens-allowlist.json', 'scripts/lib/mantine-story-scope.mjs', 'scripts/check-i18n-parity.mjs', 'scripts/check-mojibake.mjs', 'scripts/mojibake-allowlist.json', TOOL, REGISTRY, 'scripts/workflow-gates/selftests.mjs', 'scripts/workflow-gates/contract.mjs', 'scripts/workflow-gates/mutation-check.mjs', 'scripts/workflow-gates/mutation-loader.mjs', 'scripts/workflow-gates/mutation-vitest.config.mjs', 'scripts/workflow-gates/dependency-check.mjs']) {
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
  for (const [file, text] of Object.entries(base)) put(file, text);
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('add', '-A');
  git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'base');
  let session = 0;
  const hook = (name, file) => spawnSync(process.execPath, [TOOL], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    input: JSON.stringify({ hook_event_name: name, session_id: `real-${session}`, cwd: root, ...(file ? { tool_name: 'Edit', tool_input: { file_path: join(root, file) } } : {}) }) });
  const start = () => { git('reset', '-q', '--hard'); git('clean', '-fdq'); session++; assert.equal(hook('SessionStart').status, 0); };
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
  caughtAtStop('mojibake in a source string', 'src/lib/price.ts', "export const label = 'a â€” b';\nexport const price = (value: number): number => value * 2;\n", /check-mojibake[\s\S]*src\/lib\/price\.ts/);
  caughtAtStop('a locale key missing from one language', 'messages/uk.json', '{ "a": { } }\n', /uk/);
  caughtAtStop('changed behaviour of a scanner its vitest test asserts', 'scripts/tool.mjs', 'export const double = value => value * 3;\n', /tool\.test\.ts/);
  caughtAtStop('a test silenced with it.skip', 'src/lib/consumer.test.ts', "import { it, expect } from 'vitest';\nimport { shown } from './consumer';\nit.skip('shows a price', () => expect(shown(2)).toBe(5));\n", /consumer\.test\.ts:3: a test switched off/);
  start();
  put('src/lib/price.ts', 'export const price = (value: number): number => value * 2; // clean\n');
  assert.equal(hook('PostToolUse', 'src/lib/price.ts').status, 0, 'a clean write passes');
  assert.equal(hook('Stop').status, 0, 'and Stop passes, so the checks above refused the defect and not the fixture');
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

// Task 945 approval of revision 1 (approver): the open points of the completion report, each run. Fixtures are temporary Git repositories; the real tree is read only.
// Usage (project root): node <this file>
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT = resolve('.');
const TOOL = join(ROOT, 'scripts/workflow-gates/code-check.mjs');
const NODE = `"${process.execPath.replaceAll('\\', '/')}"`;
const say = line => console.log(line);
const repo = (files, registry) => {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-approval-'));
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  for (const [file, text] of Object.entries({ '.gitignore': 'test-results\n', 'scripts/workflow-gates/code-check.json': JSON.stringify(registry), ...files })) put(file, text);
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('add', '-A'); git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'base');
  return { root, put, git };
};
const hook = (root, session, name) => new Promise(done => {
  const child = spawn(process.execPath, [TOOL], { cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root }, stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.setEncoding('utf8').on('data', chunk => { err += chunk; });
  child.on('close', status => done({ status, err }));
  child.stdin.end(JSON.stringify({ hook_event_name: name, session_id: session, cwd: root }));
});

// 1. The repeated note: SubagentStop and Stop at once, then one more Stop on the same version.
say('## 1. CODE CHECK NOTE twice for one version');
{
  const row = { paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/no-tests.mjs {files}`] };
  const registry = { roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 6, rows: [row] };
  let repeated = 0, alone = 0;
  const rounds = 12;
  for (let i = 0; i < rounds; i++) {
    const f = repo({ 'tests/no-tests.mjs': "console.log('No test files found, exiting with code 0');\n", 'src/a.ts': 'export const a = 1;\n' }, registry);
    await hook(f.root, 'c', 'SessionStart');
    f.put('src/a.ts', 'export const a = 2;\n');
    const [sub, stop] = await Promise.all([hook(f.root, 'c', 'SubagentStop'), hook(f.root, 'c', 'Stop')]);
    const next = await hook(f.root, 'c', 'Stop');
    if (next.status === 2 && /CODE CHECK NOTE/.test(next.err)) repeated++;
    const third = await hook(f.root, 'c', 'Stop');
    if (i === 0) say(`first round: SubagentStop ${sub.status}, Stop ${stop.status}, next Stop ${next.status}, third Stop ${third.status}`);
    rmSync(f.root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });

    const g = repo({ 'tests/no-tests.mjs': "console.log('No test files found, exiting with code 0');\n", 'src/a.ts': 'export const a = 1;\n' }, registry);
    await hook(g.root, 'c', 'SessionStart');
    g.put('src/a.ts', 'export const a = 2;\n');
    await hook(g.root, 'c', 'Stop');
    if ((await hook(g.root, 'c', 'Stop')).status === 2) alone++;
    rmSync(g.root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  }
  say(`concurrent SubagentStop and Stop: the note came again on the next Stop in ${repeated} of ${rounds} rounds`);
  say(`control, Stop alone: the note came again in ${alone} of ${rounds} rounds`);
}

// 2. The form listed as equivalent: `notes.push(...known.notes)`, read "only on an attempt that fails again".
say('## 2. A note stored by a stage that a later attempt passes');
{
  const once = "import { existsSync, writeFileSync } from 'node:fs';\nif (!existsSync('hung-once')) { writeFileSync('hung-once', ''); setInterval(() => {}, 1000); }\n";
  const row = { paths: ['src/**/*.ts'], write: [], stop: [`${NODE} tests/no-tests.mjs {files}`, `${NODE} tests/once.mjs`] };
  const f = repo({ 'tests/no-tests.mjs': "console.log('No test files found, exiting with code 0');\n", 'tests/once.mjs': once, 'src/a.ts': 'export const a = 1;\n' }, { roots: ['src'], timeoutMs: { write: 50000, stop: 2500 }, tailLines: 6, rows: [row] });
  await hook(f.root, 'c', 'SessionStart');
  f.put('src/a.ts', 'export const a = 2;\n');
  const first = await hook(f.root, 'c', 'Stop');
  const second = await hook(f.root, 'c', 'Stop');
  say(`first Stop ${first.status}, could not finish: ${/could not finish/.test(first.err)}; second Stop ${second.status}, note: ${/no test reaches src\/a\.ts/.test(second.err)}`);
  rmSync(f.root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}

// 3. The limit of selftests.mjs: what its spawnSync timeout says and leaves. The same call, with a short limit and a test file that hangs.
say('## 3. spawnSync timeout of the suite: its words, and what stays alive');
{
  const folder = mkdtempSync(join(tmpdir(), 'lero-945-approval-suite-'));
  const hang = join(folder, 'hang.selftest.mjs');
  writeFileSync(hang, `import { test } from 'node:test';\nimport { writeFileSync } from 'node:fs';\ntest('hangs', async () => { writeFileSync(${JSON.stringify(join(folder, 'pid'))}, String(process.pid)); await new Promise(() => setInterval(() => {}, 1000)); });\n`);
  const result = spawnSync(process.execPath, ['--test', hang], { cwd: folder, encoding: 'utf8', timeout: 4000 });
  const pid = existsSync(join(folder, 'pid')) ? Number(readFileSync(join(folder, 'pid'), 'utf8')) : null;
  const alive = id => { try { process.kill(id, 0); return true; } catch { return false; } };
  say(`status ${result.status}; signal ${result.signal}; error ${result.error?.code}; the suite's own exit would be ${result.status === 0 && !result.error ? 0 : 1}; stdout ${result.stdout.length} bytes; stderr ${result.stderr.length} bytes`);
  say(`the test process ${pid}: alive after the limit: ${pid ? alive(pid) : 'no pid'}`);
  if (pid && alive(pid)) { try { process.kill(pid); } catch { /* gone */ } }
  await new Promise(done => setTimeout(done, 800));
  rmSync(folder, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}

// 4. What an event costs on the real tree, for a session that wrote nothing. The state of this probe is a file of its own under the ignored state folder.
say('## 4. Events on the real tree, no code change, real main');
{
  const event = name => {
    const started = performance.now();
    const run = spawnSync(process.execPath, [TOOL], { cwd: ROOT, encoding: 'utf8', input: JSON.stringify({ hook_event_name: name, session_id: 'approval-probe', cwd: ROOT, tool_name: 'Read', tool_input: { file_path: join(ROOT, 'README.md') } }), env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
    return `${name} exit ${run.status} ${Math.round(performance.now() - started)} ms${run.stderr ? ` ${run.stderr.slice(0, 160)}` : ''}`;
  };
  for (const name of ['SessionStart', 'PostToolUse', 'PostToolUse', 'PostToolUse', 'Stop', 'Stop', 'SubagentStop']) say(event(name));
  rmSync(join(ROOT, 'test-results/code-check/approval-probe.json'), { force: true });
}
// 5. The guard of R15 cannot tell a mutant from another writer. A write during a mutation run, as a second session or the main agent during a SubagentStop would do it.
say('## 5. Another writer during a mutation run started by a hook');
{
  const slow = "import { sum } from '../src/sum.mjs';\nawait new Promise(done => setTimeout(done, 700));\nif (typeof sum !== 'number') process.exit(1);\n";
  const mutation = { timeoutMs: 60000, hookMs: 120000, perMutantMs: 20000, concurrency: 1, shown: 8, rows: [{ paths: ['src/**/*.mjs'], run: `${NODE} tests/slow.mjs` }] };
  const registry = { roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 6, mutation, rows: [{ paths: ['src/**/*.mjs'], write: [], stop: [] }] };
  for (const name of ['SubagentStop', 'Stop']) {
    const f = repo({ 'tests/slow.mjs': slow, 'src/sum.mjs': 'export const sum = 1;\n', 'src/other.mjs': 'export const other = 1;\n' }, registry);
    await hook(f.root, 'c', 'SessionStart');
    f.put('src/sum.mjs', 'export const sum = 1 + 2 + 3 + 4;\n');
    const run = hook(f.root, 'c', name);
    await new Promise(done => setTimeout(done, 2500));
    f.put('src/other.mjs', 'export const other = 2; // the other writer\'s edit\n');
    f.put('src/brand-new.mjs', 'export const fresh = 1; // the other writer\'s new file\n');
    const result = await run;
    const other = readFileSync(join(f.root, 'src/other.mjs'), 'utf8');
    say(`${name}: exit ${result.status}; the edit survived: ${other.includes('the other writer')}; the new file survived: ${existsSync(join(f.root, 'src/brand-new.mjs'))}`);
    say(`  message: ${result.err.replaceAll('\n', ' | ').slice(0, 420)}`);
    if (name === 'SubagentStop') { const next = await hook(f.root, 'c', 'Stop'); say(`  next Stop: exit ${next.status}: ${next.err.replaceAll('\n', ' | ').slice(0, 420)}`); }
    rmSync(f.root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  }
}
say('# end');

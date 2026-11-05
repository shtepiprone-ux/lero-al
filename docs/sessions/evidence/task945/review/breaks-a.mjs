// Task 945 independent review: breaks the author did not name. Every case runs on a temporary fixture repository, with the REAL
// code-check.mjs and change-review.mjs of the project, and the REAL registry (only the mutation key removed where a case says so).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const ROOT = 'C:/Claude_Code_Projects/lero-al';
const REAL = JSON.parse(readFileSync(join(ROOT, 'scripts/workflow-gates/code-check.json'), 'utf8'));
const { runCodeCheck } = await import(`file:///${ROOT}/scripts/workflow-gates/code-check.mjs`);
const NODE = `"${process.execPath.replaceAll('\\', '/')}"`;
const REVIEW = join(ROOT, 'scripts/workflow-gates/change-review.mjs');
const glue = (...p) => p.join('');
const KEY = glue('sk_', 'live_', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6');
const GH = glue('gh', 'p_', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8');

const made = [];
function repo(files, registry = { ...REAL, mutation: undefined }) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-review-break-'));
  made.push(root);
  const put = (f, t) => { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), t); };
  const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' });
  for (const [f, t] of Object.entries({ '.gitignore': 'test-results\n', ...files })) put(f, t);
  put('scripts/workflow-gates/code-check.json', JSON.stringify(registry));
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('checkout', '-qb', 'main'); git('add', '-A');
  git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'base');
  return { root, put, git, base: git('rev-parse', 'HEAD').stdout.trim() };
}
const review = (root, base, env = {}) => spawnSync(process.execPath, [REVIEW, `--base=${base}`], { cwd: tmpdir(), encoding: 'utf8', timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: root, GITHUB_STEP_SUMMARY: '', ...env } });
const say = (...a) => console.log(...a);

say('=== A1 a live key: where does change-review put it');
{
  const r = repo({ 'src/a.ts': 'export const a = 1;\n' });
  r.put('src/a.ts', `export const a = "${KEY}";\nexport const g = "${GH}";\n`);
  const summary = join(r.root, 'summary.md');
  const run = review(r.root, r.base, { GITHUB_STEP_SUMMARY: summary });
  const report = readFileSync(join(r.root, 'test-results/workflow-gates/change-review.md'), 'utf8');
  say('exit', run.status);
  say('full key in stdout (CI log):', run.stdout.includes(KEY), run.stdout.includes(GH));
  say('full key in step summary:', readFileSync(summary, 'utf8').includes(KEY));
  say('full key in the report file (uploaded artifact):', report.includes(KEY));
  say(report.split('\n').find(line => line.includes('live credential')).replace(KEY, '<THE-FULL-KEY>'));
  const h = repo({ 'src/a.ts': 'export const a = 1;\n' });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, h.root);
  h.put('src/a.ts', `export const a = "${KEY}";\n`);
  const told = await runCodeCheck({ hook_event_name: 'PostToolUse', session_id: 's', tool_name: 'Bash' }, h.root);
  say('hook status', told.status, 'full key in the hook message:', told.message.includes(KEY));
}

say('\n=== A2 the same key in files no registry row holds: rule paths say **/*');
for (const file of ['docs/note.md', 'supabase/seed.sql', 'scripts/setup.sh', '.env.example', 'src/lib/data.json', 'public/config.txt', '.github/actions/x/action.yml', 'src/lib/notes.md', 'supabase/functions/x/index.ts', 'tests/a.ts']) {
  const r = repo({ 'src/a.ts': 'export const a = 1;\n' });
  r.put(file, `key = ${KEY}\n`);
  const run = review(r.root, r.base);
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 'x' + file.length }, r.root);
  const hookWrite = await runCodeCheck({ hook_event_name: 'PostToolUse', session_id: 'x' + file.length, tool_name: 'Write', tool_input: { file_path: join(r.root, file) } }, r.root);
  say(file.padEnd(34), 'change-review exit', run.status, /Refused/.test(run.stdout) ? 'refused' : 'NOT refused', '| hook', hookWrite.status);
}

say('\n=== A3 a file name git quotes: non-ASCII');
{
  const r = repo({ 'src/a.ts': 'export const a = 1;\n' });
  r.put('src/lib/caf\u00e9.ts', `export const a = "${KEY}";\nexport const e = eval('1');\n`);
  const run = review(r.root, r.base);
  say('untracked: exit', run.status, /Refused/.test(run.stdout) ? 'refused' : 'NOT refused', '| code files:', /(\d+) code files/.exec(run.stdout)?.[1]);
  r.git('add', '-A'); r.git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'committed, as on CI');
  const ci = review(r.root, r.base);
  say('committed, as on CI: exit', ci.status, /Refused/.test(ci.stdout) ? 'refused' : 'NOT refused', '| code files:', /(\d+) code files/.exec(ci.stdout)?.[1]);
  say('git diff names it:', r.git('diff', '--no-renames', '--name-only', r.base, '--', 'src').stdout.trim());
  const h = repo({ 'src/a.ts': 'export const a = 1;\n' });
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, h.root);
  h.put('src/lib/caf\u00e9.ts', `export const a = "${KEY}";\n`);
  const told = await runCodeCheck({ hook_event_name: 'PostToolUse', session_id: 's', tool_name: 'Bash' }, h.root);
  say('the hook, which uses -z: status', told.status);
}

say('\n=== A4 a key replaced by another key: count unchanged');
{
  const r = repo({ 'src/a.ts': `export const a = "${glue('sk_', 'live_', 'OLDOLDOLDOLDOLDOLDOLDOLD')}";\n` });
  r.put('src/a.ts', `export const a = "${KEY}";\n`);
  const run = review(r.root, r.base);
  say('exit', run.status, /Refused/.test(run.stdout) ? 'refused' : 'NOT refused');
}

say('\n=== A5 moved privileged call: count unchanged');
{
  const r = repo({ 'src/app/api/x/route.ts': "import { createAdminClient } from 'x';\nexport async function GET() { return 1; }\nasync function internal() { return createAdminClient(); }\n" });
  r.put('src/app/api/x/route.ts', "import { createAdminClient } from 'x';\nexport async function GET() { return createAdminClient(); }\n");
  const run = review(r.root, r.base);
  say('exit', run.status, 'names createAdminClient:', /row rules are bypassed/.test(run.stdout), '| report:', run.stdout.split('\n').slice(2, 5).join(' ').slice(0, 120));
}

say('\n=== B1 a whole-tree gate that crashes while naming a real file elsewhere');
{
  const gate = "console.error('TypeError: cannot read src/each/other.css'); process.exit(1);\n";
  const reg = { roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 6, rows: [{ paths: ['src/each/**/*.ts', 'src/each/**/*.css'], write: [], stop: [{ run: `${NODE} tests/crash.mjs`, namesFile: true }] }] };
  const r = repo({ 'src/each/a.ts': 'export const a = 1;\n', 'src/each/other.css': 'a{}\n', 'tests/crash.mjs': gate }, reg);
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, r.root);
  r.put('src/each/a.ts', 'export const a = 2;\n');
  const told = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, r.root);
  say('Stop status', told.status, JSON.stringify(told.message.slice(0, 100)), 'recorded as passed:', Boolean(JSON.parse(readFileSync(join(r.root, 'test-results/code-check/s.json'), 'utf8')).passed.stop['src/each/a.ts']));
}

say('\n=== B2 a commit hides a failing version written through a shell');
{
  const reg = { roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 6, rows: [{ paths: ['src/**/*.ts'], write: [`${NODE} -e "process.exit(1)"`], stop: [] }] };
  const r = repo({ 'src/a.ts': 'export const a = 1;\n' }, reg);
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, r.root);
  r.put('src/a.ts', 'export const a = 2;\n');
  const first = await runCodeCheck({ hook_event_name: 'PostToolUse', session_id: 's', tool_name: 'Bash' }, r.root);
  r.git('add', '-A'); r.git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'owner commits');
  const stop = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, r.root);
  say('after the write', first.status, '| Stop after the commit', stop.status);
}

say('\n=== B3 deleted package.json, lock entry with neither resolved nor integrity, lock-only change');
{
  const { checkDependencies } = await import(`file:///${ROOT}/scripts/workflow-gates/dependency-check.mjs`);
  const limits = { minPackageAgeDays: 30, minVersionAgeDays: 7 };
  const r = repo({ 'package.json': '{"name":"x","dependencies":{"a":"1.0.0"}}', 'package-lock.json': '{"packages":{}}' });
  rmSync(join(r.root, 'package.json'));
  say('package.json deleted:', JSON.stringify(checkDependencies({ root: r.root, limits, times: () => { throw new Error('asked'); }, audit: () => { throw new Error('asked'); } })));
  const l = repo({ 'package.json': '{"name":"x"}', 'package-lock.json': '{"packages":{}}' });
  l.put('package-lock.json', JSON.stringify({ packages: { 'node_modules/evil': { version: '9.9.9' } } }));
  say('lock entry with no resolved and no integrity:', JSON.stringify(checkDependencies({ root: l.root, limits, times: () => null, audit: () => [] })));
  const t = repo({ 'package.json': '{"name":"x","dependencies":{"a":"^1.0.0"}}', 'package-lock.json': JSON.stringify({ packages: { 'node_modules/a': { version: '1.0.0', resolved: 'https://registry.npmjs.org/a/-/a-1.0.0.tgz', integrity: 'sha512-a' } } }) });
  t.put('package-lock.json', JSON.stringify({ packages: { 'node_modules/a': { version: '1.9.9', resolved: 'https://registry.npmjs.org/a/-/a-1.9.9.tgz', integrity: 'sha512-b' }, 'node_modules/brand-new-transitive': { version: '0.0.1', resolved: 'https://registry.npmjs.org/brand-new-transitive/-/brand-new-transitive-0.0.1.tgz', integrity: 'sha512-c' } } }));
  say('lock-only: a version bump and a new transitive package, registry never asked:', JSON.stringify(checkDependencies({ root: t.root, limits, times: () => { throw new Error('asked'); }, audit: () => [] })));
}

say('\n=== C1 the report: a run that could not run, and one undecided');
{
  const { renderReport, reviewChange } = await import(`file:///${ROOT}/scripts/workflow-gates/change-review.mjs`);
  const r = repo({ 'src/a.ts': '1\n' }, { ...REAL, mutation: { shown: 8 } });
  r.put('src/a.ts', '2\n');
  const res = await reviewChange({ root: r.root, base: r.base, mutate: async () => [
    { file: 'src/down.ts', total: 5, caught: 0, survivors: [], undecided: 0, notTried: 0, notLoaded: false, error: 'its tests fail with no defect in it, under the mutation runner (exit 1): harness broken' },
    { file: 'src/undecided.ts', total: 5, caught: 0, survivors: [], undecided: 5, notTried: 0, notLoaded: false, error: null },
  ] });
  say(renderReport(res).split('\n').filter(line => /^## |down\.ts|undecided\.ts/.test(line)).join('\n'));
}

say('\n=== E1 a subagent that wrote nothing, against another agent\'s failing version: how many runs');
{
  const count = join(tmpdir(), `lero-945-count-${process.pid}.log`).replaceAll('\\', '/');
  writeFileSync(join(tmpdir(), `lero-945-count-${process.pid}.cjs`), `require('fs').appendFileSync(${JSON.stringify(count)},'x');process.exit(1);`);
  const script = join(tmpdir(), `lero-945-count-${process.pid}.cjs`).replaceAll('\\', '/');
  const reg = { roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 6, rows: [{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} "${script}"`] }] };
  const r = repo({ 'src/a.ts': 'export const a = 1;\n' }, reg);
  await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, r.root);
  r.put('src/a.ts', 'export const a = 2;\n');
  let refused = 0;
  for (let i = 0; i < 8; i++) refused += (await runCodeCheck({ hook_event_name: 'SubagentStop', session_id: 's', agent_type: 'Explore' }, r.root)).status === 2 ? 1 : 0;
  say('refused', refused, 'of 8; the failing command ran', readFileSync(count, 'utf8').length, 'times');
  rmSync(count, { force: true }); rmSync(script, { force: true });
}

say('\n=== E2 the note repeated: Stop and SubagentStop at once');
{
  const reg = { roots: ['src'], timeoutMs: { write: 50000, stop: 50000 }, tailLines: 6, rows: [{ paths: ['src/**/*.ts'], write: [], stop: [`${NODE} -e "console.log('No test files found, exiting with code 0')" {files}`] }] };
  let repeated = 0, total = 0;
  for (let i = 0; i < 6; i++) {
    const r = repo({ 'src/a.ts': 'export const a = 1;\n' }, reg);
    await runCodeCheck({ hook_event_name: 'SessionStart', session_id: 's' }, r.root);
    r.put('src/a.ts', 'export const a = 2;\n');
    const [a, b] = await Promise.all([runCodeCheck({ hook_event_name: 'SubagentStop', session_id: 's' }, r.root), runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, r.root)]);
    const next = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, r.root);
    const after = await runCodeCheck({ hook_event_name: 'Stop', session_id: 's' }, r.root);
    total++;
    if (next.status === 2) repeated++;
    if (i === 0) say('first pair', a.status, b.status, '| next Stop', next.status, JSON.stringify(next.message.slice(0, 50)), '| after that', after.status);
  }
  say(`the same note came again on the next Stop in ${repeated} of ${total} runs`);
}

for (const root of made) rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

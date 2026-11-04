// Task 942 review 1, self-audit: what the real tools do, and the claims of review-1 that were not executed (read-only).
// Run from the project root: node docs/sessions/evidence/task942/review/r5-real-behaviour.mjs
// `tsc <a missing file>` is harmless: it writes nothing and prints `error TS6053` when, and only when, the project's own tsc really ran as the program.
// npx looks up a local binary or a package, not any program on PATH, so `where` or `rm` would prove nothing here.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const root = process.cwd();
const fx = mkdtempSync(join(tmpdir(), 'lero-942-real-'));
const section = title => console.log(`\n## ${title}`);
const redact = text => text.split(tmpdir()).join('<tmp>').replace(/[A-Za-z]:\\Users\\[^\\\s]+/g, '<user-home>');

section('1. which word npx runs after an option (npm 11, native Windows)');
console.log(`npm ${spawnSync('npm --version', { shell: true, encoding: 'utf8' }).stdout.trim()}`);
const argvs = ['--filter', '-F', '--dir', '--foo', '--cwd', '-w', '--workspace', '--prefix', '-C', '--package', '--silent', '--yes', '--loglevel silent', '--loglevel', '--silent --loglevel warn', '--loglevel silent --filter', '--silent --filter', '--prefix .', '-w .'];
for (const argv of argvs) {
  const run = spawnSync(`npx --no ${argv} tsc nonexistent-942.ts`, { shell: true, encoding: 'utf8', cwd: root, timeout: 90000, input: '' });
  const text = `${run.stdout || ''}\n${run.stderr || ''}`;
  const note = text.split('\n').find(line => /parsed as a normal|npm error|not recognized|invalid config/.test(line)) || '';
  console.log(`${/error TS\d+/.test(text) ? 'tsc RAN    ' : 'tsc did not'} | npx ${argv} tsc | ${redact(note).slice(0, 90)}`);
}

section('2. a repeated text flag of npx: which text runs');
for (const argv of [`-c "where node" -c "where npm"`, `-c "where npm" --call="where node"`, `--call="where npm" -c "where node"`]) {
  const run = spawnSync(`npx --no ${argv}`, { shell: true, encoding: 'utf8', cwd: fx, timeout: 60000, input: '' });
  console.log(`npx ${argv} => ${/node\.exe/.test(run.stdout) ? 'node' : ''}${/npm/.test(run.stdout) ? ' npm' : ''}`);
}

section('3. the runners this machine can run');
for (const tool of ['pnpm', 'yarn', 'bun']) {
  const run = spawnSync(`${tool} --version`, { shell: true, encoding: 'utf8', timeout: 20000 });
  console.log(`${tool}: ${run.status === 0 ? run.stdout.trim() : 'absent'}`);
}

section('4. the F2 command through the real hook process on the hook of C87');
const folders = Array.from({ length: 200 }, (_, i) => `cd d${i}`).join('; ');
const command = `${folders}; python -c "system('${'open('.repeat(2000)}')"`;
for (const [name, event] of [
  ['executor PreToolUse', { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: root, tool_input: { command } }],
  ['main session PreToolUse', { hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: root, tool_input: { command } }],
]) {
  const t0 = performance.now();
  const run = spawnSync(process.execPath, ['scripts/workflow-gates/security-hook.mjs'], { input: JSON.stringify(event), encoding: 'utf8', cwd: root, timeout: 120000, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  console.log(`${name}: ${command.length} characters, exit ${run.status}, ${Math.round(performance.now() - t0)} ms against the 15000 ms limit of settings.json; stderr ${JSON.stringify(redact(run.stderr || '').slice(0, 70))}`);
}

section('5. the p07 and p10 CONTROLS against the residual self-test, as source text');
const self = readFileSync('scripts/workflow-gates/shell-forms-residual.selftest.mjs', 'utf8');
for (const file of ['p07-shell-forms-run', 'p10-more-forms-run']) {
  const source = readFileSync(`docs/sessions/evidence/task942/design/${file}.mjs`, 'utf8');
  const start = source.indexOf('const CONTROLS');
  const end = source.indexOf('];\n', start);
  const items = [...source.slice(start, end).matchAll(/`(?:[^`\\]|\\.)*`/g)].map(match => match[0]);
  const absent = items.filter(item => !self.includes(item));
  console.log(`${file}: ${items.length} controls, ${absent.length} not in the self-test as text`);
  for (const item of absent) console.log(`  ${item.slice(0, 150)}`);
}

section('6. a path longer than the bound on the hook of C60 and on the hook of C87 (retained here; r1-probes.txt has the blanks forms)');
const { pathToFileURL } = await import('node:url');
const c60 = await import(pathToFileURL(join(root, 'test-results/task942-approver/hook-c60.mjs')).href);
const c87 = await import(pathToFileURL(join(root, 'scripts/workflow-gates/security-hook.mjs')).href);
const X = 'scripts/workflow-gates/fixture-scope.mjs';
for (const form of [`python -c "open('${'./'.repeat(2500)}${X}', 'w')"`, `powershell -Command "[IO.File]::Open('${'./'.repeat(2500)}${X}', 'Create')"`]) {
  console.log(`c60 ${c60.shellWriteTargets(root, form, root).includes(X)} | c87 ${c87.shellWriteTargets(root, form, root).includes(X)} | ${form.replace(/(?:\.\/){100,}/, '<2500 ./>')}`);
}
rmSync(fx, { recursive: true, force: true });

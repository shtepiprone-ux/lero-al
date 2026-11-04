// Task 942 revision 5: differential proof that a change of the hook loses no target (read-only). Run from the project root:
// node docs/sessions/evidence/task942/review/r6-superset.mjs [path of a hook copy; default the live hook]
// The hooks of C60 and C87 come from Git. Every command of a generated matrix and of a seeded fuzz runs through the old hooks and the
// hook under test; a target an old hook reports and the hook under test does not is a LOST line, and the exit code is 1.
// Hand-written lists test what their author thought of. This reads what the author did not: it found the defect of the first revision 5.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const real = file => pathToFileURL(join(root, 'scripts/workflow-gates', file)).href;
const work = join(root, 'test-results/task942-approver');
mkdirSync(work, { recursive: true });
const fromGit = async (name, commit) => {
  const text = execFileSync('git', ['show', `${commit}:scripts/workflow-gates/security-hook.mjs`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
  const path = join(work, `hook-${name}.mjs`);
  writeFileSync(path, text.replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
    .replace("new URL('./hook-load-check.mjs', import.meta.url)", `new URL('${real('hook-load-check.mjs')}')`));
  return import(pathToFileURL(path).href);
};
const old = { c60: await fromGit('c60', 'c00337ef5'), c87: await fromGit('c87', '5cd44cb97') };
const tested = await import(pathToFileURL(resolve(process.argv[2] || 'scripts/workflow-gates/security-hook.mjs')).href);
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs';
const fx = mkdtempSync(join(tmpdir(), 'lero-942-superset-'));
for (const file of [X, `docs/${N}`, 'docs/a.b', 'a.b']) { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), 'a\n'); }

// Section 5 names these corrections: the value of `--package` is no program; a word of a nested text keeps no quote character; the value
// of `--unset` or `--split-string` moves no folder; the word a folder option of `env` takes is no second folder option. A lost target only
// they explain is counted apart.
const corrected = (command, target) => /(?:^|\s)(?:-p|--package)(?:\s|$)/.test(command) || /['"]/.test(target) || /--unset|--split-string|-[i0v]*[uS]\b/.test(command) || /(?:--chdir|-[i0v]*C)\s+-[i0v]*C/.test(command);
let lost = 0, named = 0, thrown = 0, slowest = 0, compared = 0;
const lines = [];
function compare(command) {
  compared++;
  const t0 = performance.now();
  let after;
  try { after = tested.shellWriteTargets(fx, command, fx); } catch (error) { thrown++; lines.push(`THROW ${JSON.stringify(command)} ${error.message.slice(0, 70)}`); return; }
  slowest = Math.max(slowest, performance.now() - t0);
  for (const [name, hook] of Object.entries(old)) {
    let before;
    try { before = hook.shellWriteTargets(fx, command, fx); } catch { continue; }
    for (const target of before.filter(path => !after.includes(path))) {
      if (corrected(command, target)) { named++; continue; }
      lost++;
      if (lines.length < 60) lines.push(`LOST ${name} ${JSON.stringify(target)} for ${JSON.stringify(command)}`);
    }
  }
}

// The matrix: every runner, every option, every program, with and without a value, a second option and `--`.
const runners = ['npx', 'pnpx', 'bunx', 'npm exec', 'npm x', 'pnpm exec', 'pnpm dlx', 'yarn exec', 'yarn dlx', 'bun x', 'npx.cmd', 'corepack npx', 'sudo npx', 'env npx'];
const options = ['-w', '--workspace', '--filter', '-F', '--prefix', '-C', '--dir', '--cwd', '--loglevel', '--cache', '--reporter', '--foo', '--silent', '-y', '--yes', '--no', '-q', '--', '--bun', '--ignore-existing'];
const programs = [`rm ${X}`, `rimraf ${X}`, `shx rm ${X}`, `touch ${X}`, `env -C ${D} rm ${N}`, `bash -c 'rm ${X}'`, `python -c "open('${X}','w')"`, `node -e "require('fs').rmSync('${X}')"`, `sed -i s/a/b/ ${X}`];
for (const runner of runners) for (const program of programs) {
  compare(`${runner} ${program}`);
  for (const a of options) {
    compare(`${runner} ${a} ${program}`);
    compare(`${runner} ${a} value ${program}`);
    compare(`${runner} ${a}=value ${program}`);
    for (const b of ['--filter', '--loglevel', '--silent', '--']) compare(`${runner} ${a} value ${b} ${program}`);
  }
}
// The managers' own options before the subcommand.
for (const manager of ['npm', 'pnpm', 'yarn', 'bun', 'npm.cmd', 'pnpm.cmd', 'corepack pnpm']) for (const sub of ['exec', 'x', 'dlx', 'run', '']) for (const tool of [`rimraf ${X}`, `shx rm ${X}`, `rm ${X}`]) {
  compare(`${manager} ${sub} ${tool}`);
  for (const a of options) { compare(`${manager} ${a} ${sub} ${tool}`); compare(`${manager} ${a} value ${sub} ${tool}`); compare(`${manager} ${sub} ${a} ${tool}`); compare(`${manager} ${sub} ${a} value ${tool}`); }
}
// Repeated text flags, the text of `env -S`, the reader's bound, every shape of a call.
for (const a of [`rm ${X}`, 'cat a.b']) for (const b of [`rm ${X}`, 'cat a.b']) {
  for (const [f, g] of [['-c', '-c'], ['-c', '--call'], ['--call', '-c']]) compare(`npx ${f} '${a}' ${g} '${b}'`);
  compare(`npx --call='${a}' -c '${b}'`); compare(`npx -c '${a}' --call='${b}'`); compare(`npx --call='${a}' --call='${b}'`);
}
for (const pad of ['', ' ', ' '.repeat(5000)]) for (const path of [X, `${'./'.repeat(2500)}${X}`]) for (const call of [`open(${pad}'${path}', 'w')`, `open(${pad}file='${path}', mode='w')`, `fs.openSync(${pad}'${path}', 'w')`, `Path('${path}').open(${pad}'w')`, `[IO.File]::Open(${pad}'${path}', 'Create')`, `open('${path}',${pad}'w')`]) {
  compare(`python -c "${call}"`); compare(`bash -c "python -c \\"${call}\\""`);
}
const matrix = compared;

// A seeded fuzz over the same words.
let seed = 20261104;
const rnd = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
const alphabet = [...new Set([...options, ...runners.flatMap(runner => runner.split(' ')), 'npm', 'pnpm', 'yarn', 'bun', 'corepack', 'env', '/usr/bin/env', 'sudo', 'exec', 'x', 'dlx', 'run', 'workspace', 'rimraf', 'shx', 'rm', 'cat', 'tsc', 'bash', 'sh', 'python', 'node', 'eval', 'value', 'docs', '.',
  '-c', '-e', '--call', "--call='rm a.b'", '--call=', '-iC', '-u', '-S', '-iS', '--chdir', '-', "'rm a.b'", '"rm a.b"', "'", '"', '\\"', '\\\\\\"', '`"', '`', ';', '&&', '|', "open('a.b','w')", "open('a.b',", 'open(', "Path('a.b').open('w')", "[IO.File]::Open('a.b','Create')", "'a.b'", 'a.b', 'docs/a.b', '**dict(', "*['w']", "**{'mode':'w'}", 'npm.cmd', 'npx.cmd', 'rm.cmd'])];
for (let i = 0; i < 60000; i++) compare(Array.from({ length: 1 + rnd(7) }, () => alphabet[rnd(alphabet.length)]).join(rnd(6) ? ' ' : ''));

console.log(lines.join('\n'));
console.log(`matrix ${matrix} commands; fuzz 60000 commands; exceptions ${thrown}; slowest ${Math.round(slowest)} ms; corrections section 5 names ${named}; LOST ${lost}`);
rmSync(fx, { recursive: true, force: true });
process.exitCode = lost || thrown ? 1 : 0;

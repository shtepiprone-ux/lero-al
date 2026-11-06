#!/usr/bin/env node
// Task 945 R6 (owner D25, 2026-11-04): old versus new for the shared hook. Every command of a generated matrix and of a seeded fuzz runs through
// both; a target the old hook reports and the new one does not is lost. Hand-written lists test what their author thought of: this run found the
// 1011 targets a green prototype of Task 942 lost. It compares `shellWriteTargets` only; the other logic of the hook is guarded by the gate suite.
// Run from anywhere: node scripts/workflow-gates/hook-differential.mjs [path of a hook; default the working hook]. The old hook is the blob at HEAD.
// A row of hook-corrections.json names an accepted loss, and applies only to the old hook whose bytes have its digest.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LINES = 60;
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs';
const FIXTURE_FILES = [X, `docs/${N}`, 'docs/a.b', 'a.b'];
const FUZZ_COMMANDS = 60000;
const FUZZ_SEED = 20261104;
const RUNNERS = ['npx', 'pnpx', 'bunx', 'npm exec', 'npm x', 'pnpm exec', 'pnpm dlx', 'yarn exec', 'yarn dlx', 'bun x', 'npx.cmd', 'corepack npx', 'sudo npx', 'env npx'];
const OPTIONS = ['-w', '--workspace', '--filter', '-F', '--prefix', '-C', '--dir', '--cwd', '--loglevel', '--cache', '--reporter', '--foo', '--silent', '-y', '--yes', '--no', '-q', '--', '--bun', '--ignore-existing'];
const PROGRAMS = [`rm ${X}`, `rimraf ${X}`, `shx rm ${X}`, `touch ${X}`, `env -C ${D} rm ${N}`, `bash -c 'rm ${X}'`, `python -c "open('${X}','w')"`, `node -e "require('fs').rmSync('${X}')"`, `sed -i s/a/b/ ${X}`];

// The matrix: every runner, every option, every program, with and without a value, a second option and `--`.
function* matrix() {
  for (const runner of RUNNERS) for (const program of PROGRAMS) {
    yield `${runner} ${program}`;
    for (const a of OPTIONS) {
      yield `${runner} ${a} ${program}`;
      yield `${runner} ${a} value ${program}`;
      yield `${runner} ${a}=value ${program}`;
      for (const b of ['--filter', '--loglevel', '--silent', '--']) yield `${runner} ${a} value ${b} ${program}`;
    }
  }
  // The managers' own options before the subcommand.
  for (const manager of ['npm', 'pnpm', 'yarn', 'bun', 'npm.cmd', 'pnpm.cmd', 'corepack pnpm']) for (const sub of ['exec', 'x', 'dlx', 'run', '']) for (const tool of [`rimraf ${X}`, `shx rm ${X}`, `rm ${X}`]) {
    yield `${manager} ${sub} ${tool}`;
    for (const a of OPTIONS) {
      yield `${manager} ${a} ${sub} ${tool}`;
      yield `${manager} ${a} value ${sub} ${tool}`;
      yield `${manager} ${sub} ${a} ${tool}`;
      yield `${manager} ${sub} ${a} value ${tool}`;
    }
  }
  // Repeated text flags, the text of `env -S`, the reader's bound, every shape of a call.
  for (const a of [`rm ${X}`, 'cat a.b']) for (const b of [`rm ${X}`, 'cat a.b']) {
    for (const [f, g] of [['-c', '-c'], ['-c', '--call'], ['--call', '-c']]) yield `npx ${f} '${a}' ${g} '${b}'`;
    yield `npx --call='${a}' -c '${b}'`;
    yield `npx -c '${a}' --call='${b}'`;
    yield `npx --call='${a}' --call='${b}'`;
  }
  for (const pad of ['', ' ', ' '.repeat(5000)]) for (const path of [X, `${'./'.repeat(2500)}${X}`]) {
    for (const call of [`open(${pad}'${path}', 'w')`, `open(${pad}file='${path}', mode='w')`, `fs.openSync(${pad}'${path}', 'w')`, `Path('${path}').open(${pad}'w')`, `[IO.File]::Open(${pad}'${path}', 'Create')`, `open('${path}',${pad}'w')`]) {
      yield `python -c "${call}"`;
      yield `bash -c "python -c \\"${call}\\""`;
    }
  }
}
// A seeded fuzz over the same words.
function* fuzz() {
  let seed = FUZZ_SEED;
  const random = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
  const alphabet = [...new Set([...OPTIONS, ...RUNNERS.flatMap(runner => runner.split(' ')), 'npm', 'pnpm', 'yarn', 'bun', 'corepack', 'env', '/usr/bin/env', 'sudo', 'exec', 'x', 'dlx', 'run', 'workspace', 'rimraf', 'shx', 'rm', 'cat', 'tsc', 'bash', 'sh', 'python', 'node', 'eval', 'value', 'docs', '.',
    '-c', '-e', '--call', "--call='rm a.b'", '--call=', '-iC', '-u', '-S', '-iS', '--chdir', '-', "'rm a.b'", '"rm a.b"', "'", '"', '\\"', '\\\\\\"', '`"', '`', ';', '&&', '|', "open('a.b','w')", "open('a.b',", 'open(', "Path('a.b').open('w')", "[IO.File]::Open('a.b','Create')", "'a.b'", 'a.b', 'docs/a.b', '**dict(', "*['w']", "**{'mode':'w'}", 'npm.cmd', 'npx.cmd', 'rm.cmd'])];
  for (let i = 0; i < FUZZ_COMMANDS; i++) yield Array.from({ length: 1 + random(7) }, () => alphabet[random(alphabet.length)]).join(random(6) ? ' ' : '');
}

// `oldHook` and `newHook` each hold `shellWriteTargets`; `oldHook.sha256` selects the corrections written for it.
export function differential(oldHook, newHook, { corrections = [], limit = Infinity } = {}) {
  const accepted = corrections.filter(row => row.baseSha256 === oldHook.sha256)
    .map(row => ({ command: new RegExp(row.commandPattern), target: new RegExp(row.targetPattern) }));
  const isNamed = (command, target) => accepted.some(row => row.command.test(command) && row.target.test(target));
  const fixture = mkdtempSync(join(tmpdir(), 'lero-945-differential-'));
  let compared = 0, lost = 0, named = 0, thrown = 0, slowest = 0;
  const lines = [];
  try {
    for (const file of FIXTURE_FILES) {
      mkdirSync(dirname(join(fixture, file)), { recursive: true });
      writeFileSync(join(fixture, file), 'a\n');
    }
    for (const source of [matrix, fuzz]) for (const command of source()) {
      if (compared >= limit) return { compared, lost, named, thrown, slowest: Math.round(slowest), lines };
      compared++;
      const started = performance.now();
      let after;
      try { after = newHook.shellWriteTargets(fixture, command, fixture); }
      catch (error) {
        thrown++;
        if (lines.length < LINES) lines.push(`THROW ${JSON.stringify(command)} ${String(error.message).slice(0, 70)}`);
        continue;
      }
      slowest = Math.max(slowest, performance.now() - started);
      let before;
      try { before = oldHook.shellWriteTargets(fixture, command, fixture); } catch { continue; }
      for (const target of before.filter(path => !after.includes(path))) {
        if (isNamed(command, target)) { named++; continue; }
        lost++;
        if (lines.length < LINES) lines.push(`LOST ${JSON.stringify(target)} for ${JSON.stringify(command)}`);
      }
    }
    return { compared, lost, named, thrown, slowest: Math.round(slowest), lines };
  } finally { rmSync(fixture, { recursive: true, force: true }); }
}

// The blob at HEAD as a module of a temporary file, whose own imports reach the working modules next to the hook.
async function headHook(root, hookPath) {
  const bytes = execFileSync('git', ['show', `HEAD:${hookPath}`], { cwd: root, maxBuffer: 1 << 26, windowsHide: true });
  const folder = join(root, 'test-results/hook-differential');
  mkdirSync(folder, { recursive: true });
  const copy = join(folder, `head-hook-${process.pid}.mjs`);
  const sibling = file => pathToFileURL(join(root, 'scripts/workflow-gates', file)).href;
  writeFileSync(copy, bytes.toString('utf8').replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${sibling(file)}'`)
    .replace(/new URL\('\.\/([\w.-]+\.mjs)', import\.meta\.url\)/g, (_, file) => `new URL('${sibling(file)}')`));
  try { return { ...await import(pathToFileURL(copy).href), sha256: createHash('sha256').update(bytes).digest('hex') }; }
  finally { rmSync(copy, { force: true }); }
}

async function main() {
  const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const hookPath = 'scripts/workflow-gates/security-hook.mjs';
  const started = performance.now();
  const oldHook = await headHook(root, hookPath);
  const args = process.argv.slice(2);
  const given = args.find(arg => !arg.startsWith('--'));
  const newHook = await import(pathToFileURL(given ? resolve(given) : join(root, hookPath)).href);
  const { rows } = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/hook-corrections.json'), 'utf8'));
  // A self-test proves this exit code on the first commands; the gate itself always compares them all.
  const limit = Number(args.find(arg => arg.startsWith('--limit='))?.slice(8)) || Infinity;
  const result = differential(oldHook, newHook, { corrections: rows, limit });
  for (const line of result.lines) console.log(line);
  console.log(`compared ${result.compared}; corrections named ${result.named}; exceptions ${result.thrown}; slowest ${result.slowest} ms; old hook ${oldHook.sha256}; ${Math.round(performance.now() - started)} ms`);
  console.log(`LOST ${result.lost}`);
  return result.lost || result.thrown ? 1 : 0;
}

const pathKey = path => {
  let real = resolve(path);
  try { real = realpathSync.native(real); } catch { /* the resolved path */ }
  return process.platform === 'win32' ? real.toLowerCase() : real;
};
if (process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url))) {
  try { process.exitCode = await main(); }
  catch (error) { console.error(`HOOK DIFFERENTIAL COULD NOT RUN: ${error.message}`); process.exitCode = 1; }
}

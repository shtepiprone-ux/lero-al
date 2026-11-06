#!/usr/bin/env node
// Task 945 (owner, 2026-11-05: "this concerns all tasks and all AI models"): the hooks run only inside Claude Code, so a change from any other tool
// reached the tree unchecked. This is the same review of a whole change against its base, in CI and by hand, whoever wrote it. What must never
// enter the tree fails it. The rest cannot fail by itself, since each has a legitimate form, and becomes the list an independent reviewer must
// answer line by line (.claude/rules/review/02-adversarial-ui.md): a machine finds where to look, it does not decide (OWASP Secure Code Review).
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { added, leftBehind, readRegistry, refusedLines, refusedText, runCommand } from './code-check.mjs';
import { checkDependencies } from './dependency-check.mjs';
import { reportLines, runMutation } from './mutation-check.mjs';

const REPORT = 'test-results/workflow-gates/change-review.md';
const git = (root, ...args) => spawnSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });

// A pull request against its target; a push to main against the commit before it; anything else against where it left main.
export function baseOf(root, env = process.env) {
  const ref = env.GITHUB_BASE_REF ? `origin/${env.GITHUB_BASE_REF}` : 'origin/main';
  const fork = git(root, 'merge-base', ref, 'HEAD');
  if (fork.status !== 0) throw new Error(`no base: git merge-base ${ref} HEAD failed: ${String(fork.stderr).trim()}`);
  const point = fork.stdout.trim();
  const head = git(root, 'rev-parse', 'HEAD').stdout.trim();
  if (point !== head) return point;
  const parent = git(root, 'rev-parse', 'HEAD^');
  return parent.status === 0 ? parent.stdout.trim() : head;
}
export function changedFiles(root, registry, base) {
  const list = args => {
    const run = git(root, ...args, '--', ...registry.roots);
    if (run.status !== 0) throw new Error(`git ${args[0]} failed: ${String(run.stderr).trim()}`);
    return run.stdout.split('\0').filter(Boolean);
  };
  // With -z git gives a name as it is. Without it a non-ASCII name comes back quoted and escaped, and no row matches it.
  const files = [...list(['diff', '--no-renames', '--name-only', '-z', base]), ...list(['ls-files', '--others', '--exclude-standard', '-z'])];
  return [...new Set(files)].filter(file => registry.rowsFor(file).length).sort();
}

export async function reviewChange({ root, base, minutes = 8, check = checkDependencies, mutate = runMutation }) {
  const registry = readRegistry(root);
  const files = changedFiles(root, registry, base);
  // Against the whole change, in whatever file holds it. Only the file, the line and the rule are written: a key must not reach a public CI log.
  const refused = refusedLines(root, base, [], { untracked: true });
  const failures = refused.map(refusedText);
  const deletedOrQuiet = added(root, registry.quieting, files, base);
  const surface = added(root, registry.secure, files, base);
  const notes = [];
  const gone = git(root, '-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', '-z', '--diff-filter=D', base, '--', ...registry.roots);
  if (gone.status !== 0) throw new Error(`git diff failed: ${String(gone.stderr).trim()}`);
  const left = leftBehind(root, registry, gone.stdout.split('\0').filter(Boolean));
  const packages = files.filter(file => file === 'package.json' || file === 'package-lock.json');
  // A check over refused text could print it (a package name, a test's output), and the change has already failed.
  if (packages.length && !refused.some(({ file }) => packages.includes(file))) {
    try {
      const result = check({ root, base, limits: registry.dependencies });
      failures.push(...result.failures);
      notes.push(...result.notes);
    } catch (error) { failures.push(`the dependency check could not finish: ${error.message}`); }
  }
  let mutants = {};
  if (registry.mutation && files.length && !refused.length) {
    const results = await mutate({ root, config: registry.mutation, roots: registry.roots, files, base, deadline: Date.now() + minutes * 60000, runCommand });
    mutants = reportLines(results, Infinity);
  }
  // Different claims. A check that could not run, time that ran out and a run with no verdict say nothing either way, and a changed test judged alone says
  // nothing of the module's other tests: measured, captcha.ts read as 4 gaps under one changed test while all its tests caught 26 of 26. None may read as a line no test checks.
  const lines = Object.values(mutants).flat();
  const couldNotRun = lines.filter(line => /: the mutation check could not run: /.test(line));
  const notTried = lines.filter(line => / not tried because time ran out/.test(line));
  const undecided = lines.filter(line => / undecided, because a run ended with no verdict/.test(line));
  const elsewhere = [...couldNotRun, ...notTried, ...undecided];
  const changedTest = lines.filter(line => !elsewhere.includes(line) && /every test of .+ still passed|no run showed it loaded \(/.test(line));
  return { base, files, failures, left, quiet: deletedOrQuiet, surface, notes, couldNotRun, mutants: lines.filter(line => !elsewhere.includes(line) && !changedTest.includes(line)), changedTest, notTried, undecided };
}

export function renderReport({ base, files, failures, left = [], quiet, surface, notes, couldNotRun = [], mutants, changedTest = [], notTried = [], undecided = [] }) {
  const section = (title, why, lines) => (lines.length ? [`## ${title}`, '', why, '', ...lines.map(line => `- ${line}`), ''] : []);
  return [
    '# Change review', '', `Base \`${base}\`, ${files.length} code files. A clean list here proves only that these checks found nothing; the reviewer still reads the whole diff.`, '',
    ...section('Refused', 'These fail the change.', failures),
    ...section('What a deletion left behind', 'These files still name a file this change deleted. A name may be on purpose: is each one?', left),
    ...section('A check said less', 'A deleted test, a weakened or removed assertion, a new mock or a switched-off rule. Why was each right?', quiet),
    ...section('What an attacker reaches, and what steers later agents', 'Read each against `.claude/rules/shared/secure-code-review.md`.', surface),
    ...section('Could not run', 'The mutation check could not judge these files, so this says nothing either way. Each line says why.', couldNotRun),
    ...section('Lines no test checks', 'Broken with every test still passing, or no run showed the file loaded. Add an assertion that fails on it, or say why the two forms mean the same.', mutants),
    ...section('What a changed test misses', 'Only the changed test ran against its module, so another test may still catch these. Does it assert what it exists to assert? `node scripts/workflow-gates/mutation-check.mjs --all <file>` runs every test of that file.', changedTest),
    ...section('Not tried', 'Time ran out, so these say nothing either way. A reviewer of security-relevant code runs the command each names.', notTried),
    ...section('Undecided', 'A run ended with no verdict: the process died, or the defect never applied. These say nothing either way. A reviewer of security-relevant code runs the command each names.', undecided),
    ...section('Notes', 'For the reviewer.', notes),
    ...([failures, left, quiet, surface, couldNotRun, mutants, changedTest, notTried, undecided, notes].some(list => list.length) ? [] : ['Nothing to report.', '']),
  ].join('\n');
}

const pathKey = path => {
  let real = resolve(path);
  try { real = realpathSync.native(real); } catch { /* the resolved path */ }
  return process.platform === 'win32' ? real.toLowerCase() : real;
};
if (process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url))) {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const args = process.argv.slice(2);
  const value = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  try {
    if (!existsSync(join(root, '.git'))) throw new Error(`${root} is no Git repository`);
    const result = await reviewChange({ root, base: value('base') || baseOf(root), minutes: value('minutes') ? Number(value('minutes')) : undefined });
    const text = renderReport(result);
    mkdirSync(dirname(join(root, REPORT)), { recursive: true });
    writeFileSync(join(root, REPORT), text);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    process.stdout.write(`${text}\nReport: ${REPORT}\n`);
    process.exit(result.failures.length ? 1 : 0);
  } catch (error) {
    // A review that did not run is no pass.
    process.stderr.write(`CHANGE REVIEW COULD NOT RUN: ${error.message}\n`);
    process.exit(1);
  }
}

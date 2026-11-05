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
import { added, readRegistry, runCommand } from './code-check.mjs';
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
    return run.stdout.split(/\r?\n/).filter(Boolean);
  };
  const files = [...list(['diff', '--no-renames', '--name-only', base]), ...list(['ls-files', '--others', '--exclude-standard'])];
  return [...new Set(files)].filter(file => registry.rowsFor(file).length).sort();
}

export async function reviewChange({ root, base, minutes = 8, check = checkDependencies, mutate = runMutation }) {
  const registry = readRegistry(root);
  const files = changedFiles(root, registry, base);
  const code = registry.secure.filter(rule => !rule.refuse);
  const failures = added(root, registry.secure.filter(rule => rule.refuse), files, base);
  const deletedOrQuiet = added(root, registry.quieting, files, base);
  const surface = added(root, code, files, base);
  const notes = [];
  const packages = files.filter(file => file === 'package.json' || file === 'package-lock.json');
  if (packages.length) {
    try {
      const result = check({ root, base, limits: registry.dependencies });
      failures.push(...result.failures);
      notes.push(...result.notes);
    } catch (error) { failures.push(`the dependency check could not finish: ${error.message}`); }
  }
  let mutants = {};
  if (registry.mutation && files.length) {
    const results = await mutate({ root, config: registry.mutation, files, base, deadline: Date.now() + minutes * 60000, runCommand });
    mutants = reportLines(results, Infinity);
  }
  // Three different claims. Time that ran out says nothing either way, and a changed test judged alone says nothing of the module's other tests: measured,
  // captcha.ts read as 4 gaps under one changed test while all its tests caught 26 of 26. Neither may read as a line no test checks.
  const lines = Object.values(mutants).flat();
  const notTried = lines.filter(line => / not tried because time ran out/.test(line));
  const changedTest = lines.filter(line => !notTried.includes(line) && /every test of .+ still passed|never loaded it \(/.test(line));
  return { base, files, failures, quiet: deletedOrQuiet, surface, notes, mutants: lines.filter(line => !notTried.includes(line) && !changedTest.includes(line)), changedTest, notTried };
}

export function renderReport({ base, files, failures, quiet, surface, notes, mutants, changedTest = [], notTried = [] }) {
  const section = (title, why, lines) => (lines.length ? [`## ${title}`, '', why, '', ...lines.map(line => `- ${line}`), ''] : []);
  return [
    '# Change review', '', `Base \`${base}\`, ${files.length} code files. A clean list here proves only that these checks found nothing; the reviewer still reads the whole diff.`, '',
    ...section('Refused', 'These fail the change.', failures),
    ...section('A check said less', 'A deleted test, a weakened or removed assertion, a new mock or a switched-off rule. Why was each right?', quiet),
    ...section('What an attacker reaches, and what steers later agents', 'Read each against `.claude/rules/shared/secure-code-review.md`.', surface),
    ...section('Lines no test checks', 'Broken in memory with every test still passing, or never loaded by those tests. Add an assertion that fails on it, or say why the two forms mean the same.', mutants),
    ...section('What a changed test misses', 'Only the changed test ran against its module, so another test may still catch these. Does it assert what it exists to assert? `node scripts/workflow-gates/mutation-check.mjs --all <file>` runs every test of that file.', changedTest),
    ...section('Not tried', 'Time ran out, so these say nothing either way. A reviewer of security-relevant code runs the command each names.', notTried),
    ...section('Notes', 'For the reviewer.', notes),
    ...([failures, quiet, surface, mutants, changedTest, notTried, notes].some(list => list.length) ? [] : ['Nothing to report.', '']),
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

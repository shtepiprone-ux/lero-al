#!/usr/bin/env node
// Changed-line coverage (owner instruction 2026-11-06: "every change is covered by tests automatically"). OWASP basis:
// Secure Code Review (automated checks before review), Secure Coding with AI (agent output is verified by tests, not by
// the agent's report). Reads the Istanbul JSON written by `vitest run --coverage` and the lines added under `src/`
// since the base; every executable added line must run in at least one test.
//
//   node scripts/quality/changed-lines-coverage.mjs --base <ref> [--coverage coverage/coverage-final.json] [--min 80]
//
// Fails (exit 1) when the covered share of executable added lines is below --min, or when any changed source file has
// executable added lines and none of them runs in a test. Exit 2 when it cannot run.

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Source files whose behaviour tests must cover: product code under src/, not tests, Stories, type declarations or test helpers. */
export const SOURCE = /^src\/.+\.(ts|tsx)$/;
export const NOT_SOURCE = /(\.test|\.spec|\.stories)\.(ts|tsx)$|\.d\.ts$|(^|\/)(__tests__|__mocks__|stories|tests)\//;

/** Added line numbers per file from a `git diff -U0` text. */
export function addedLines(diff) {
  const out = new Map();
  let file = null;
  for (const line of diff.split('\n')) {
    const f = /^\+\+\+ b\/(.+)$/.exec(line);
    if (f) { file = f[1]; continue; }
    if (/^\+\+\+ \/dev\/null/.test(line)) { file = null; continue; }
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (h && file) {
      const start = Number(h[1]);
      const count = h[2] === undefined ? 1 : Number(h[2]);
      const set = out.get(file) ?? new Set();
      for (let i = 0; i < count; i++) set.add(start + i);
      out.set(file, set);
    }
  }
  return out;
}

/**
 * line → covered (true/false) for every line inside an Istanbul statement. A line belongs to the innermost statement
 * that contains it (a chained call on its own line counts with its statement; a nested statement that never ran is not
 * hidden by an outer one that did).
 */
export function statementLines(entry) {
  const statements = Object.entries(entry?.statementMap ?? {})
    .map(([id, loc]) => ({ from: loc.start.line, to: loc.end.line, ran: (entry.s?.[id] ?? 0) > 0 }))
    .sort((a, b) => (b.to - b.from) - (a.to - a.from));
  const lines = new Map();
  const span = new Map();
  for (const st of statements) {
    for (let l = st.from; l <= st.to; l++) {
      const width = st.to - st.from;
      if (!span.has(l) || width < span.get(l)) { span.set(l, width); lines.set(l, st.ran); }
      else if (width === span.get(l)) lines.set(l, lines.get(l) || st.ran);
    }
  }
  return lines;
}

/** Evaluates added lines against coverage. `coverage` is keyed by repository-relative path. */
export function evaluate(added, coverage, min) {
  const files = [];
  let total = 0;
  let covered = 0;
  for (const [file, lines] of added) {
    if (!SOURCE.test(file) || NOT_SOURCE.test(file)) continue;
    const entry = coverage[file];
    if (!entry) { files.push({ file, executable: null, covered: 0 }); continue; }
    const map = statementLines(entry);
    let e = 0;
    let c = 0;
    const missed = [];
    for (const l of lines) if (map.has(l)) { e++; if (map.get(l)) c++; else missed.push(l); }
    if (e) files.push({ file, executable: e, covered: c, missed: missed.sort((a, b) => a - b) });
    total += e;
    covered += c;
  }
  const failures = [];
  for (const f of files) {
    if (f.executable === null) failures.push(`${f.file}: not in the coverage report (no test loads it; check the coverage include list)`);
    else if (f.covered === 0) failures.push(`${f.file}: none of ${f.executable} changed executable line(s) runs in a test (lines ${f.missed.join(', ')})`);
  }
  const share = total ? (100 * covered) / total : 100;
  if (share < min) failures.push(`changed-line coverage ${share.toFixed(1)}% < ${min}% (${covered}/${total})`);
  return { files, total, covered, share, failures };
}

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || '').trim()}`);
  return r.stdout;
}

function arg(argv, name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

export function run(argv) {
  const base = arg(argv, '--base');
  if (!base) throw new Error('--base <ref> is required');
  const coverageFile = path.resolve(ROOT, arg(argv, '--coverage', 'coverage/coverage-final.json'));
  const min = Number(arg(argv, '--min', '80'));
  if (!existsSync(coverageFile)) throw new Error(`${path.relative(ROOT, coverageFile)} not found — run vitest with --coverage first`);
  const raw = JSON.parse(readFileSync(coverageFile, 'utf8'));
  const coverage = {};
  for (const [abs, entry] of Object.entries(raw)) coverage[path.relative(ROOT, abs).split(path.sep).join('/')] = entry;
  const mergeBase = git(['merge-base', base, 'HEAD']).trim();
  // Against the working tree: in CI it equals HEAD; locally it includes uncommitted work.
  const added = addedLines(git(['diff', '-U0', '--no-color', '--diff-filter=AM', mergeBase, '--', 'src']));
  return evaluate(added, coverage, min);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let r;
  try {
    r = run(process.argv.slice(2));
  } catch (e) {
    console.error(`changed-lines-coverage could not run: ${e.message}`);
    process.exit(2);
  }
  const lines = ['## Changed-line coverage', '', `${r.covered}/${r.total} executable changed line(s) covered (${r.share.toFixed(1)}%).`, ''];
  for (const f of r.files) lines.push(`- \`${f.file}\`: ${f.executable === null ? 'not in the coverage report' : `${f.covered}/${f.executable}${f.missed?.length ? ` — not run: ${f.missed.join(', ')}` : ''}`}`);
  lines.push('', ...(r.failures.length ? ['### Failures', '', ...r.failures.map((x) => `- ${x}`)] : ['No failure.']));
  const text = lines.join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
  process.exit(r.failures.length ? 1 : 0);
}

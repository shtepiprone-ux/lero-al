#!/usr/bin/env node
// Every acceptance criterion's test exists after the task is implemented, and a criterion added or changed by the
// change has its test added or changed by the same change (owner, 2026-11-06: "a task done → create a test for it; a
// task changed → update the test after execution"). OWASP basis: Verifying Third Party Agent Execution Evidence (keep
// the expected values outside the evidence under review: the kickoff names the test, the diff must contain it), Secure
// Coding with AI §8 (flag missing or reduced tests in agent-generated changes), Threat Modeling ("Can the agreed upon
// mitigations be tested?").
//
//   node scripts/quality/ac-tests.mjs --base <ref> [<kickoff> ...]
//
// With kickoffs named (the executor before reporting, the reviewer before the verdict): those kickoffs, compared with
// the working tree. Without: every implemented kickoff the change touches — a verdict in its Review section, or a
// named test the change adds. Three layers run it: agent-check.mjs at every Stop of an agent session (sessionCheck:
// a kickoff whose test the session added must have every named test before the session may finish),
// change-report.mjs on base...head in CI (hard failure), and this command for the executor and the reviewer.
//
// A test named in an AC: a backticked path ending in .test/.spec.<ext> or .stories.tsx. A bare file name matches any
// repository file with that name. A criterion that only reruns an existing check names a command instead.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { acceptanceCriteria, readRegularFile } from './check-files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const NAMED_TEST = /`([^`\s]+\.(?:(?:test|spec)\.(?:ts|tsx|mts|mjs|js)|stories\.tsx))`/g;
const VERDICT = /\b(APPROVED|NEEDS REVISION)\b/;

/** The ACs of a kickoff body: [{ id, text, tests: [named path] }]. */
export function kickoffAcs(body) {
  if (!body) return [];
  const lines = body.split('\n');
  const start = lines.findIndex((l) => l.trim() === '## Acceptance criteria');
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return acceptanceCriteria(lines.slice(start + 1, end < 0 ? undefined : end), start + 2)
    .map((ac) => ({ ...ac, tests: [...new Set([...ac.text.matchAll(NAMED_TEST)].map((m) => m[1]))] }));
}

/** True when the Review section carries a verdict, so the task has been implemented. */
export function hasVerdict(body) {
  const lines = (body ?? '').split('\n');
  const start = lines.findIndex((l) => l.trim() === '## Review');
  if (start < 0) return false;
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return VERDICT.test(lines.slice(start + 1, end < 0 ? undefined : end).join('\n'));
}

/** Repository files a named test refers to: the exact path, or every file with that base name. */
export function resolveTest(named, files) {
  if (named.includes('/')) return files.has(named) ? [named] : [];
  return [...files].filter((f) => f === named || f.endsWith(`/${named}`));
}

/**
 * Findings for one kickoff.
 * @param {{ path: string, base: string|null, head: string, files: Set<string>, changed: Set<string> }} k
 */
export function acTestFindings({ path: kickoff, base, head, files, changed }) {
  const before = new Map(kickoffAcs(base).map((ac) => [ac.id, ac.text]));
  const out = [];
  for (const ac of kickoffAcs(head)) {
    const revised = before.get(ac.id) !== ac.text;
    for (const named of ac.tests) {
      const found = resolveTest(named, files);
      if (!found.length) { out.push(`${kickoff} ${ac.id}: the named test \`${named}\` does not exist`); continue; }
      if (revised && !found.some((f) => changed.has(f))) {
        out.push(`${kickoff} ${ac.id}: the criterion is new or changed, but its test \`${named}\` is neither added nor changed`);
      }
    }
  }
  return out;
}

/** Paths only Opus may write (flow.md roles): the executor's session is not blocked for a test the reviewer places. */
export const OPUS_OWNED = /^(\.claude\/|\.github\/|\.githooks\/|scripts\/quality\/|CLAUDE\.md$|AGENTS\.md$)/;

/**
 * A kickoff counts as implemented when its Review section has a verdict, or when one of the tests it names was added
 * by the change (did not exist at the base, exists now). The second arm catches a task implemented but not yet
 * reviewed, and the executor's session before any review.
 */
export function isImplemented(body, files, added) {
  if (hasVerdict(body)) return true;
  return kickoffAcs(body).some((ac) => ac.tests.some((named) => resolveTest(named, files).some((f) => added.has(f))));
}

/**
 * The executor's session (agent-check Stop): every active kickoff that this session started implementing (a test it
 * names was added) must have every named test present before the session may finish. Tests on Opus-owned paths are
 * left to the reviewer and to CI.
 * @param {{ kickoffs: { path: string, body: string }[], files: Set<string>, added: Set<string> }} input
 */
export function sessionFindings({ kickoffs, files, added }) {
  const out = [];
  for (const { path: kickoff, body } of kickoffs) {
    if (!isImplemented(body, files, added) || hasVerdict(body)) continue;
    for (const ac of kickoffAcs(body)) {
      for (const named of ac.tests) {
        if (OPUS_OWNED.test(named) || resolveTest(named, files).length) continue;
        out.push(`${kickoff} ${ac.id}: the named test \`${named}\` does not exist yet (write it first — quality-gates.md §8)`);
      }
    }
  }
  return out;
}

function git(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || '').trim()}`);
  return r.stdout;
}
const show = (rev, p) => {
  const r = spawnSync('git', ['show', `${rev}:${p}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  return r.status === 0 ? r.stdout : null;
};
const list = (text) => text.split('\0').filter(Boolean);
const isKickoff = (p) => /^tasks\/.+\.md$/.test(p);
const isActiveKickoff = (p) => /^tasks\/Sprints\/.+_kickoff_prompt_Task_\d+.*\.md$/.test(p);

/** The executor's session: the files and kickoffs of the working tree; `sessionChanged` from agent-check. */
export function sessionCheck(sessionChanged) {
  const tracked = new Set(list(git(['ls-files', '-z'])));
  const files = new Set([...tracked, ...list(git(['ls-files', '-z', '-o', '--exclude-standard']))]);
  for (const d of list(git(['ls-files', '-z', '--deleted']))) files.delete(d);
  const added = new Set(sessionChanged.filter((p) => !tracked.has(p)));
  const kickoffs = [];
  for (const p of files) {
    if (!isActiveKickoff(p)) continue;
    const buf = readRegularFile(path.join(ROOT, p));
    if (buf) kickoffs.push({ path: p, body: buf.toString('utf8') });
  }
  return sessionFindings({ kickoffs, files, added });
}

/** Committed range base...head (CI). `changes` is change-report's parsed name-status list. */
export function rangeFindings(base, head, changes) {
  const files = new Set(list(git(['ls-tree', '-r', '-z', '--name-only', head])));
  const baseFiles = new Set(list(git(['ls-tree', '-r', '-z', '--name-only', base])));
  const changed = new Set(changes.filter((c) => c.code !== 'D').map((c) => c.path));
  const added = new Set([...changed].filter((p) => !baseFiles.has(p)));
  // Every kickoff the change touches: the ones it edits, and every active one (outside tasks/Archive) whose named test
  // it adds — a task implemented without its kickoff being edited is still checked.
  const from = new Map(changes.filter((c) => c.code !== 'D' && isKickoff(c.path)).map((c) => [c.path, c.from ?? c.path]));
  for (const p of files) if (isActiveKickoff(p) && !from.has(p)) from.set(p, p);
  const out = [];
  for (const [kickoff, before] of from) {
    const headText = show(head, kickoff);
    if (!headText || !isImplemented(headText, files, added)) continue;
    out.push(...acTestFindings({ path: kickoff, base: show(base, before), head: headText, files, changed }));
  }
  return out;
}

/** Working tree against base (the executor and the reviewer, before anything is committed). */
export function worktreeFindings(base, named) {
  const files = new Set([...list(git(['ls-files', '-z'])), ...list(git(['ls-files', '-z', '-o', '--exclude-standard']))]);
  const deleted = new Set(list(git(['ls-files', '-z', '--deleted'])));
  for (const d of deleted) files.delete(d);
  const changed = new Set([...list(git(['diff', '-z', '--name-only', base])), ...list(git(['ls-files', '-z', '-o', '--exclude-standard']))]);
  const tracked = new Set(list(git(['ls-tree', '-r', '-z', '--name-only', base])));
  const added = new Set([...changed].filter((p) => !tracked.has(p)));
  const kickoffs = named.length ? named.map((p) => p.split('\\').join('/'))
    : [...files].filter((p) => (changed.has(p) && isKickoff(p)) || isActiveKickoff(p));
  const out = [];
  for (const k of new Set(kickoffs)) {
    const buf = readRegularFile(path.join(ROOT, k));
    if (!buf) { out.push(`${k}: is not a readable file`); continue; }
    const text = buf.toString('utf8');
    if (!named.length && !isImplemented(text, files, added)) continue;
    out.push(...acTestFindings({ path: k, base: show(base, k), head: text, files, changed }));
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--base');
  if (at < 0 || !args[at + 1]) { console.error('usage: ac-tests.mjs --base <ref> [<kickoff> ...]'); process.exit(2); }
  const base = args[at + 1];
  const named = args.filter((_, i) => i !== at && i !== at + 1);
  let findings;
  try { findings = worktreeFindings(base, named); } catch (e) { console.error(`ac-tests could not run: ${e.message}`); process.exit(2); }
  for (const f of findings) console.log(f);
  console.log(findings.length ? `FAIL: ${findings.length} acceptance-criterion test finding(s)` : 'PASS: every named test exists, and every new or changed criterion has its test added or changed');
  process.exit(findings.length ? 1 : 0);
}

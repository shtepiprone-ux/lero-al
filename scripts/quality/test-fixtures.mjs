// Fixture files a test plants inside the working tree, and their automatic cleanup (owner, 2026-11-10: "what is the
// problem in making the cleanup automatic right away?").
//
// agent-check.test.mjs must plant files in the real src/ (the hook it tests checks the project's own files). Its
// after() hook removed them only when the run ended normally; a run stopped from outside (TaskStop terminates the
// process; no handler runs) left them in src/, and the Stop hooks then saw them as product code. Now:
// - the test claims the directory with a lock that holds its process id and releases it on every exit it can see;
// - a directory whose lock is missing or whose process is gone is swept by SessionStart and by every Stop;
// - while the owning process is alive, the hooks leave the directory out of "changed files".

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const FIXTURE_REL = 'src/__agent_check_test__';

/** The lock of the fixture directory, in the repository's Git directory (outside the working tree). */
export const lockFile = (gitDir) => path.join(gitDir, 'lero-al-agent-check', 'fixture.lock');

/** True when the process exists (signal 0 tests for it without touching it). */
export function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

function readLock(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

/** True while a living process holds the fixture directory. */
export function fixtureInUse(gitDir, isAlive = pidAlive) {
  const lock = readLock(lockFile(gitDir));
  return !!lock && isAlive(lock.pid);
}

/** The test claims the directory: its process id goes into the lock. */
export function claimFixture(gitDir, pid = process.pid) {
  mkdirSync(path.dirname(lockFile(gitDir)), { recursive: true });
  writeFileSync(lockFile(gitDir), JSON.stringify({ pid, dir: FIXTURE_REL, at: Date.now() }));
}

/** Removes the directory and the lock. */
export function releaseFixture(root, gitDir) {
  rmSync(path.join(root, FIXTURE_REL), { recursive: true, force: true });
  rmSync(lockFile(gitDir), { force: true });
}

/** Removes a fixture directory no living process holds; returns true when it swept one. */
export function sweepStaleFixture(root, gitDir, isAlive = pidAlive) {
  if (!existsSync(path.join(root, FIXTURE_REL)) && !existsSync(lockFile(gitDir))) return false;
  if (fixtureInUse(gitDir, isAlive)) return false;
  releaseFixture(root, gitDir);
  return true;
}

/**
 * True when the hooks of this process should leave the fixture directory out: a living process other than this one's
 * parent holds it. The test runs the hook as its child, and that child must see the files it is testing.
 */
export function fixtureHidden(gitDir, { isAlive = pidAlive, parent = process.ppid } = {}) {
  const lock = readLock(lockFile(gitDir));
  return !!lock && isAlive(lock.pid) && lock.pid !== parent;
}

/** True for a path inside the fixture directory. */
export const isFixturePath = (rel) => rel === FIXTURE_REL || rel.startsWith(`${FIXTURE_REL}/`);

/**
 * The whole-project typecheck's output without the errors in a fixture a living test holds: the file list leaves that
 * directory out, but `tsc -p tsconfig.json` reads all of src/, so a Stop during agent-check.test.mjs reported the test's
 * deliberately mistyped `typed.ts` as the session's error (2026-11-11). An error line starts at column 0 with its file;
 * the indented lines after it belong to it. Empty when nothing else is left.
 */
export function withoutFixtureErrors(output) {
  const kept = [];
  let inFixture = false;
  for (const line of String(output).split(/\r?\n/)) {
    if (/^\S/.test(line)) inFixture = isFixturePath(line.split('(')[0].replace(/\\/g, '/'));
    if (!inFixture && line.trim()) kept.push(line);
  }
  return kept.join('\n');
}

// node --test scripts/quality/test-fixtures.test.mjs
// Fixture files a test plants in src/ are cleaned up automatically (owner, 2026-11-10). A run stopped from outside
// (TaskStop) left src/__agent_check_test__ behind, and the Stop hooks took it for product code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURE_REL, claimFixture, fixtureHidden, fixtureInUse, isFixturePath, lockFile, pidAlive, releaseFixture, sweepStaleFixture, withoutFixtureErrors } from './test-fixtures.mjs';

test('the whole-project typecheck leaves out the errors of a held fixture, and keeps every other error with its lines', () => {
  // a Stop during agent-check.test.mjs reported the test's deliberately mistyped typed.ts (2026-11-11)
  const fixture = `${FIXTURE_REL}/typed.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.`;
  assert.equal(withoutFixtureErrors(`${fixture}\n`), '', 'only the fixture failed: nothing is left');
  assert.equal(withoutFixtureErrors(fixture.replace(/\//g, '\\')), '', 'a Windows path is the same fixture');
  const real = "src/app/page.tsx(3,7): error TS2304: Cannot find name 'x'.\n  The detail line of that error.";
  assert.equal(withoutFixtureErrors(`${fixture}\n  a detail of the fixture error\n${real}\n`), real);
  assert.equal(withoutFixtureErrors('src/__agent_check_test__x/a.ts(1,1): error TS1: y'), 'src/__agent_check_test__x/a.ts(1,1): error TS1: y', 'a look-alike directory is not the fixture');
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function tree() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'fixtures-'));
  const gitDir = path.join(root, '.git');
  mkdirSync(path.join(root, FIXTURE_REL), { recursive: true });
  mkdirSync(gitDir, { recursive: true });
  writeFileSync(path.join(root, FIXTURE_REL, 'typed.ts'), 'export const a: number = 1\n');
  return { root, gitDir, planted: () => existsSync(path.join(root, FIXTURE_REL)), done: () => rmSync(root, { recursive: true, force: true }) };
}

test('a fixture whose test process is gone, or that has no lock, is swept; a living one is left alone', () => {
  const t = tree();
  claimFixture(t.gitDir, 424242);
  assert.equal(sweepStaleFixture(t.root, t.gitDir, () => true), false, 'a living test keeps its files');
  assert.ok(t.planted());
  assert.equal(sweepStaleFixture(t.root, t.gitDir, () => false), true, 'the test was stopped from outside: swept');
  assert.equal(t.planted(), false);
  assert.equal(existsSync(lockFile(t.gitDir)), false, 'the lock goes with it');
  mkdirSync(path.join(t.root, FIXTURE_REL), { recursive: true });
  assert.equal(sweepStaleFixture(t.root, t.gitDir), true, 'a directory without a lock is a leftover');
  assert.equal(t.planted(), false);
  t.done();
});

test('the hooks leave a held fixture out, except the hook the test itself runs as its child', () => {
  const t = tree();
  claimFixture(t.gitDir, 4242);
  assert.equal(fixtureHidden(t.gitDir, { isAlive: () => true, parent: 999 }), true, 'a session hook does not count the files of a running test');
  assert.equal(fixtureHidden(t.gitDir, { isAlive: () => true, parent: 4242 }), false, "the test's own child sees them");
  assert.equal(fixtureHidden(t.gitDir, { isAlive: () => false, parent: 999 }), false, 'a dead owner hides nothing');
  assert.equal(fixtureInUse(t.gitDir, () => true), true);
  releaseFixture(t.root, t.gitDir);
  assert.equal(t.planted(), false);
  assert.ok(isFixturePath(`${FIXTURE_REL}/typed.ts`) && !isFixturePath('src/__agent_check_test__x/a.ts') && !isFixturePath('src/a.ts'));
  t.done();
});

test('pidAlive: this process is alive, a number that is no process is not', () => {
  assert.equal(pidAlive(process.pid), true);
  assert.equal(pidAlive(0), false);
  assert.equal(pidAlive(-1), false);
  assert.equal(pidAlive(2 ** 31 - 2), false);
});

test('a test process killed from outside leaves files that the next hook run removes', { timeout: 60000 }, () => {
  const t = tree();
  rmSync(path.join(t.root, FIXTURE_REL), { recursive: true, force: true });
  // a child claims the fixture, plants a file and is killed before any exit handler can run
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { claimFixture } from ${JSON.stringify(new URL('./test-fixtures.mjs', import.meta.url).href)};
    import { mkdirSync, writeFileSync } from 'node:fs';
    claimFixture(${JSON.stringify(t.gitDir)});
    mkdirSync(${JSON.stringify(path.join(t.root, FIXTURE_REL))}, { recursive: true });
    writeFileSync(${JSON.stringify(path.join(t.root, FIXTURE_REL, 'left.ts'))}, 'x');
    process.kill(process.pid, 'SIGKILL');
  `], { encoding: 'utf8' });
  assert.notEqual(child.status, 0, 'the child died without cleaning up');
  assert.ok(t.planted(), 'its files are left behind');
  assert.equal(sweepStaleFixture(t.root, t.gitDir), true);
  assert.equal(t.planted(), false, 'the next hook run removes them');
  t.done();
});

test('agent-check.test.mjs claims its fixture and releases it on every exit it sees', () => {
  const src = readFileSync(path.join(ROOT, 'scripts', 'quality', 'agent-check.test.mjs'), 'utf8');
  assert.match(src, /claimFixture\(GIT_DIR\)/);
  assert.match(src, /process\.on\('exit', releaseOnce\)/);
  assert.match(src, /'SIGINT', 'SIGTERM'/);
  assert.match(src, /sweepStaleFixture\(ROOT, GIT_DIR\)/);
});

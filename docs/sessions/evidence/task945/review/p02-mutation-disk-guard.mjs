// Task 945 review 1: executed prototype of the guard the kickoff revision names for the mutation check. A mutant is code that runs, so "in memory" limits
// where the defect is stored, not what it does. This compares the tree before and after one mutant run, restores what the run changed, and names it.
// Design evidence to read, not code to paste. Runs on a temporary repository.
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const root = mkdtempSync(join(tmpdir(), 'lero-945-p02-'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
git('init', '-q'); git('config', 'core.autocrlf', 'false');
put('.gitignore', 'test-results\n');
put('scripts/baseline.json', '{"entries":[1,2,3]}\n');
put('scripts/dirty.json', '{"at":"head"}\n');
git('add', '-A'); git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'base');
put('scripts/dirty.json', '{"at":"the session"}\n');
put('scripts/new.json', '{"untracked":true}\n');

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const statusEntries = () => git('status', '--porcelain', '-z', '--untracked-files=all').split('\0').filter(Boolean).map(entry => entry.slice(3));
// Bytes of each file already dirty when the run starts. A file clean at that point comes back from its blob at HEAD.
function snapshot() {
  const held = new Map();
  for (const file of statusEntries()) held.set(file, existsSync(join(root, file)) ? readFileSync(join(root, file)) : null);
  return held;
}
function restore(held) {
  const moved = [];
  // The union: a file the run deleted may no longer be in the status, which was this prototype's own first defect (an untracked file stayed lost).
  for (const file of new Set([...statusEntries(), ...held.keys()])) {
    const now = existsSync(join(root, file)) ? readFileSync(join(root, file)) : null;
    if (held.has(file)) {
      const before = held.get(file);
      if ((now && before && sha(now) === sha(before)) || (!now && !before)) continue;
      if (before) writeFileSync(join(root, file), before); else rmSync(join(root, file), { force: true });
      moved.push(file);
      continue;
    }
    const blob = spawnSync('git', ['show', `HEAD:${file}`], { cwd: root, maxBuffer: 1 << 28 });
    if (blob.status === 0) writeFileSync(join(root, file), blob.stdout); else rmSync(join(root, file), { force: true });
    moved.push(file);
  }
  return moved;
}

const held = snapshot();
console.log('before a run:', JSON.stringify(statusEntries()));
// What a mutant of a scanner did in breaks-d.mjs M1, and three more kinds of effect.
put('scripts/baseline.json', '{"wiped":true}');
put('scripts/dirty.json', '{"wiped":true}');
put('scripts/stray.json', '{"stray":true}');
rmSync(join(root, 'scripts/new.json'));
console.log('after a run:', JSON.stringify(statusEntries()));
const moved = restore(held);
console.log('named and restored:', JSON.stringify(moved.sort()));
console.log('after the restore:', JSON.stringify(statusEntries()));
console.log('tracked file back at its blob:', readFileSync(join(root, 'scripts/baseline.json'), 'utf8') === '{"entries":[1,2,3]}\n');
console.log('a file the session had changed keeps the session\'s text:', readFileSync(join(root, 'scripts/dirty.json'), 'utf8') === '{"at":"the session"}\n');
console.log('an untracked file deleted by the run is back:', existsSync(join(root, 'scripts/new.json')));
console.log('a stray file is gone:', !existsSync(join(root, 'scripts/stray.json')));
rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

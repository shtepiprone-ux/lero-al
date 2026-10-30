// Task 923 Revision 41 evidence helper (executor): node r41-02-diff.mjs
// Line diff of the two Task 927-era test files against the copies saved before the edit (r41-00-*.txt), through `git diff --no-index` (read-only).
// It prints each diff, then the count of changed line pairs per file. Exit 0 when exactly four lines changed in total, 1 otherwise.
import { spawnSync } from 'node:child_process';

const pairs = [
  ['docs/sessions/evidence/task923/r41-00-googleReauth.txt', 'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx'],
  ['docs/sessions/evidence/task923/r41-00-deletePassword.txt', 'src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx'],
];
let changed = 0;
for (const [before, after] of pairs) {
  const r = spawnSync('git', ['diff', '--no-index', '--no-color', '--unified=0', before, after], { encoding: 'utf8' });
  console.log(`=== ${after} against ${before} (git diff exit ${r.status}; 1 means the files differ) ===`);
  console.log(r.stdout);
  const removed = r.stdout.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).length;
  const added = r.stdout.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
  console.log(`removed lines: ${removed}; added lines: ${added}`);
  if (removed !== added) { console.log('removed and added differ'); process.exit(1); }
  changed += removed;
}
console.log(`changed lines in total: ${changed}`);
process.exit(changed === 4 ? 0 : 1);

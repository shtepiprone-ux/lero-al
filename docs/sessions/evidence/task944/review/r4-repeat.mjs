// Task 944 review 4 (approver, read-only): three fresh runs of the four self-test files of this task in different file orders
// (`shared/security-test-quality.md`, determinism and isolation of a new harness); installed Node 22.22.3 has no seeded test shuffle
// flag, so the order varies by the file list. Writes only each file's own mkdtemp fixtures. Usage (project root): node docs/sessions/evidence/task944/review/r4-repeat.mjs
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const G = 'scripts/workflow-gates';
const FILES = ['sensitivity', 'hook-syntax', 'shell-forms', 'governance-contract'].map(name => `${G}/${name}.selftest.mjs`);
const ORDERS = [[0, 1, 2, 3], [3, 2, 1, 0], [2, 0, 3, 1]];
let failures = 0;
for (const order of ORDERS) {
  const files = order.map(index => FILES[index]);
  const child = spawnSync(process.execPath, ['--test', '--test-concurrency=1', '--test-reporter=tap', ...files], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const total = name => /^# (\w+) (\d+)$/gm[Symbol.matchAll](child.stdout).find(m => m[1] === name)?.[2];
  const ok = child.status === 0 && total('fail') === '0' && total('skipped') === '0' && total('cancelled') === '0';
  if (!ok) failures++;
  console.log(`${order.join(' ')}: exit ${child.status}; tests ${total('tests')}; pass ${total('pass')}; fail ${total('fail')}; skipped ${total('skipped')}`);
}
console.log(`FAILURES ${failures}`);
process.exitCode = failures ? 1 : 0;

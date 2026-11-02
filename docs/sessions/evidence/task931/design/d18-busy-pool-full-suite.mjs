// Task 931 revision 3 design (Opus, read-only probe, 2026-11-02): run the whole unit suite once with the busy-pool preload of
// d17 and list every failed test, so that class A covers every load-sensitive test, not only the five known files.
// Usage: node <this file> <output json path outside the project>
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const out = process.argv[2];
if (!out) throw new Error('output path required');
const preload = pathToFileURL(resolve(ROOT, 'docs/sessions/evidence/task931/design/d17-busy-pool-preload.mjs')).href;
const r = spawnSync('npx', ['vitest', 'run', '--retry=0', '--reporter=json', `--outputFile=${out}`], {
  cwd: ROOT, env: { ...process.env, NODE_OPTIONS: `--import=${preload}` }, encoding: 'utf8', shell: true, maxBuffer: 256 * 1024 * 1024 });
const j = JSON.parse(readFileSync(out, 'utf8'));
const failed = j.testResults.flatMap(f => f.assertionResults.filter(a => a.status === 'failed')
  .map(a => `${f.name.replace(/\\/g, '/').split('/lero-al/')[1]} :: ${a.fullName}`));
const files = [...new Set(failed.map(line => line.split(' :: ')[0]))];
console.log(`busy pool, full unit suite: exit ${r.status}; total ${j.numTotalTests} passed ${j.numPassedTests} failed ${j.numFailedTests} skipped ${j.numPendingTests}; failed files ${files.length}`);
for (const file of files) console.log(`FILE ${file} (${failed.filter(line => line.startsWith(`${file} :: `)).length})`);
for (const line of failed) console.log(`  ${line}`);

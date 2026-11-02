// Task 931 revision 3 design (Opus, read-only probe, 2026-11-02): run the class A test files N times with and without the
// busy-pool preload and print the failed test count of each run. Usage: node <this file> [runs]
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const preload = pathToFileURL(resolve(ROOT, 'docs/sessions/evidence/task931/design/d17-busy-pool-preload.mjs')).href;
const FILES = ['src/lib/auth/__tests__/googlePopup.test.ts', 'src/components/layout/__tests__/Header.google.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx', 'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx'];
const runs = Number(process.argv[2] || 2);
for (const busy of [false, true]) for (let i = 1; i <= runs; i++) {
  const env = { ...process.env, NODE_OPTIONS: busy ? `--import=${preload}` : '' };
  const r = spawnSync('npx', ['vitest', 'run', ...FILES, '--reporter=json', '--retry=0'], { cwd: ROOT, env, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  const json = r.stdout.slice(r.stdout.indexOf('{'));
  let summary = 'unparsed';
  try {
    const j = JSON.parse(json);
    const failed = j.testResults.flatMap(f => f.assertionResults.filter(a => a.status === 'failed').map(a => `${f.name.replace(/\\/g, '/').split('/src/')[1]} :: ${a.fullName}`));
    summary = `total ${j.numTotalTests} passed ${j.numPassedTests} failed ${j.numFailedTests}${failed.length ? `\n    ${failed.join('\n    ')}` : ''}`;
  } catch {}
  const marks = (r.stderr.match(/\[busy-pool\]/g) || []).length;
  console.log(`${busy ? 'busy' : 'idle'} run ${i}: exit ${r.status}; preload marks ${marks}; ${summary}`);
}

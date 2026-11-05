// Task 945 review, self-audit. The file CI blames for its one unhandled error, run alone three times. Reads only; run from the repository root.
import { spawnSync } from 'node:child_process';

const file = ['src/components/layout/__tests__', 'header-hydration-id-parity.test.tsx'].join('/');
for (let run = 1; run <= 3; run += 1) {
  const begun = Date.now();
  const result = spawnSync('node', ['node_modules/vitest/vitest.mjs', 'run', file, '--reporter=dot'], { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 120000 });
  const text = `${result.stdout}${result.stderr}`;
  console.log(`run ${run}: exit ${result.status}, ${Math.round((Date.now() - begun) / 1000)} s, ${/window is not defined/.test(text) ? 'window error' : 'no window error'}`);
}

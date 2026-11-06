// Task 945 approval: AC11 on the real tree, the last sentence: refusedLines over the merge base of origin/main and HEAD, with untracked files, and its time.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { refusedLines, refusedText } from '../../scripts/workflow-gates/code-check.mjs';

const root = resolve('.');
const base = spawnSync('git', ['merge-base', 'origin/main', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
for (const [label, from, options] of [['merge base, tracked', base, {}], ['merge base, with untracked', base, { untracked: true }], ['HEAD, with untracked', 'HEAD', { untracked: true }]]) {
  const started = performance.now();
  const found = refusedLines(root, from, [], options);
  console.log(`${label}: ${found.length} results in ${Math.round(performance.now() - started)} ms`);
  for (const line of found.slice(0, 10)) console.log(`  ${refusedText(line)}`);
}
